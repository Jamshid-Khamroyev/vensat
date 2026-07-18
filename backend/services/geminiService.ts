import axios from "axios";
import { senMessage } from "../utils";
import { groq, openrouter } from "../utils/config";
import { env } from "../utils/env"

export interface ParsedQuestion {
  _id: string;
  text: string;
  options: string[];
  correctAnswerIndex?: number;
  difficulty?: string;
  graph?: string;
  question: string;
  isDual?: boolean;
  category: string;
}

export interface ParsedTest {
  _id: string;
  title: string;
  questions: ParsedQuestion[];
}

interface PracticeQuestion {
  sentence: string;
  correctWord: string;
  options: string[];
  explanation: string;
  wordDefinition: string;
}

interface GeneratePracticeParams {
  words: string[];  
}

export async function generateStory(
  genre: string,
  topic: string,
  length: 'medium' | 'long' | 'extended',
  words?: string,
  description?: string
): Promise<{ title: string, content: string }> {
  const lengthMap = { medium: '~500 words', long: '~1000 words', extended: '~2000 words' };
  const tokenMap = { medium: 800, long: 1500, extended: 2800 };

  try {
    const result = await groq.chat.completions.create({
      model: 'groq/compound',
      messages: [
        { role: 'system', content: 'You are a storyteller. Respond with valid JSON: {"title": "...", "content": "..."}' },
        { role: 'user', content: `Create a ${genre} story about "${topic}". ${description ? `Context: ${description}` : ''} ${words ? `Include these words naturally in their context: ${words}` : ''} Length: ${lengthMap[length]}` }
      ],
      temperature: 0.8,
      max_tokens: tokenMap[length],
      response_format: { type: "json_object" }
    });
    
    return JSON.parse(result.choices[0].message.content || '{}');
  } catch (error: any) {
    if (error?.response?.status === 429) {
      await senMessage();
    }
    throw error;
  }
}

export async function generateSentencesForWords(words: string[]): Promise<Array<{ term: string; sentence: string }>> {
  const wordsList = words.join(', ');
  
  const systemInstruction = `
    You are an expert SAT tutor and English language educator. Your task is to create contextual example sentences for each given vocabulary word.

    INPUT WORDS: ${wordsList}

    REQUIREMENTS:
    1. For EACH word, you MUST provide:
       - The term itself
       - ONE original sentence that demonstrates the word's meaning through context

    2. SENTENCE RULES (CRITICAL):
       - Each sentence must NATURALLY incorporate the vocabulary word
       - The word's meaning MUST be clear from the context of the sentence
       - Do NOT just say "The word X means Y" — show it through action, description, or situation
       - Sentences should be realistic, educational, and engaging
       - Length: 5-12 words per sentence
       - Use different contexts for different words
       - Sentences must be grammatically correct
       - Avoid forced or awkward constructions

    Format the output as a JSON array of objects, each with 'term' and 'sentence' keys.
  `;

  try {
    const result = await groq.chat.completions.create({
      model: 'groq/compound',
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: "Generate sentences for each word now." }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    
    const data = JSON.parse(result.choices[0].message.content || '{}');
    
    if (Array.isArray(data)) {
      return data;
    }

    if (!Array.isArray(data) && words.length === 1) {
      return data;
    }
    
    if (data.terms && Array.isArray(data.terms)) {
      return data.terms;
    }

    if (data.vocabulary && Array.isArray(data.vocabulary)) {
      return data.vocabulary;
    }
    
    return [];
  } catch (error: any) {
    if (error?.response?.status === 429) {
      await senMessage();
    }
    throw error;
  }
}

export async function generatePracticeQuestionsAI(
  params: GeneratePracticeParams
): Promise<PracticeQuestion[]> {
  const { words } = params;
  console.log(words);
  
  
  const wordsString = words.join(', ');
  
  const systemPrompt = `You are an English language teacher. Create fill-in-the-blank practice questions.
Response format: JSON array of objects with fields:
- sentence: string (a sentence with a blank like "____")
- correctWord: string (the missing word)
- options: string[] (array of 4 words: 1 correct + 3 from the given words list)
- explanation: string (why this word fits here)
- wordDefinition: string (definition of the correct word in simple Uzbek)

Important: The correct word and all options MUST be selected from the provided words list.`;

  const userPrompt = `Create for each word exist in list fill-in-the-blank practice questions using these words: ${wordsString}
Each question should have a sentence with a blank (_____), and the missing word should be from the list.
The 3 wrong options should also be from the same word list.
Make sure each word is used naturally in context.`;

  try {
    const result = await groq.chat.completions.create({
      model: 'groq/compound',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 8192,
      response_format: { type: "json_object" }
    });
    
    const response = JSON.parse(result.choices[0].message.content || '{}');
    if (Array.isArray(response)) {
      return response;
    }
    if (response.questions && Array.isArray(response.questions)) {
      return response.questions;
    }
    const possibleArrays = Object.values(response).filter(v => Array.isArray(v));
    if (possibleArrays.length > 0) {
      return possibleArrays[0] as PracticeQuestion[];
    }
    
    throw new Error('Invalid response format from API');
    
  } catch (error: any) {
    if (error?.response?.status === 429) {
      await senMessage();
    }
    console.error('Error generating practice questions:', error);
    throw new Error('Failed to generate practice questions');
  }
}

export async function createEmbedding(text: string): Promise<number[]> {
  try {
    const cleanText = text.replace(/\n/g, ' ').trim();
    const result: any = await openrouter.embeddings.generate({
      requestBody: {
        model: "nvidia/llama-nemotron-embed-vl-1b-v2:free",
        input: cleanText,
        encodingFormat: "float"
      }
    });
    
    return result?.data?.[0]?.embedding || 
           (Array.isArray(result) ? result[0]?.embedding : []) ||
           result?.embedding ||
           [];
  } catch (error: any) {
    console.error('Embedding error:', error.message);
    return [];
  }
}

interface BulkQuestionParams {
  passages: string[];
  category: string;
  difficulty: "easy" | "medium" | "hard";
}

const templateGroups = {
  'information-and-ideas': [
    'Which choice best states the main idea of the text?',
    'Which choice most logically completes the text?',
    'According to the text, [specific claim about passage content]?',
    'Based on the text, [inference about passage content]?',
    "Which finding, if true, would most directly support [researcher's / author's] hypothesis?",
    "Which finding, if true, would most directly undermine [researcher's / author's] claim?",
    'Which quotation from the source material best illustrates [claim about the text]?'
  ],

  'craft-and-structure': [
    'Which choice best states the main purpose of the text?',
    'Which choice best describes the function of the underlined sentence in the overall structure of the text?',
    'Which choice best describes the overall structure of the text?',
    'Which choice best states the main purpose of the underlined portion as a whole?',
    'Which choice best states the main purpose of the underlined portion as a whole?',
    'Which choice completes the text with the most logical and precise word or phrase?',
    'Which choice completes the text with the most logical and precise word or phrase?',
    'Which choice best states the main purpose of the text?',
    'Which choice best describes the function of the underlined sentence in the overall structure of the text?',
    'Which choice best describes the function of the underlined sentence in the overall structure of the text?',
    'Which choice best describes the overall structure of the text?',
    'Which choice best states the main purpose of the underlined portion as a whole?',
    'Which choice completes the text with the most logical and precise word or phrase?',
    'Based on the texts, how would the author of Text 2 most likely respond to the claim presented in Text 1?',
    'Based on the texts, how would the author of Text 2 most likely characterize the argument presented in Text 1?',
    'Based on the texts, which statement best describes the relationship between the two texts?',
    'Based on the texts, which statement best compares the perspectives of the two authors?',
    'Which choice best states the main purpose of the underlined portion as a whole?',
  ],

  'expression-of-ideas': [
    'The student wants to emphasize [specific aspect] about [topic]. Which choice most effectively uses relevant information from the notes to accomplish this goal?',
    'The student wants to highlight [specific aspect] regarding [subject]. Which choice most effectively uses relevant information from the notes to accomplish this goal?',
    'The student wants to present [topic] and its [conclusions/findings]. Which choice most effectively uses relevant information from the notes to accomplish this goal?',
    'The student wants to contrast [aspect A] and [aspect B] in the two [subjects]. Which choice most effectively uses relevant information from the notes to accomplish this goal?',
    'The student wants to emphasize the [duration/purpose/cause/effect] of [subject]. Which choice most effectively uses relevant information from the notes to accomplish this goal?',
    'Which choice completes the text with the most logical transition?',
    'Which choice completes the text with the most logical transition?',
    'Which choice completes the text with the most logical transition?',
    'Which choice completes the text with the most logical transition?',
    'Which choice completes the text with the most logical transition?'
  ]
};

const templateInstructions: Record<string, string> = {
  'Which choice most logically completes the text?':
    'Insert "_____" into pessage at the appropriate location in the pessage! not question text',

  'Which choice best describes the function of the underlined sentence in the overall structure of the text?':
    'Wrap the target sentence in pessage with #hash_symbols#.',

  'Which choice best states the main purpose of the underlined portion as a whole?':
    'Wrap the target portion in pessage with #hash_symbols#.',

  'Which choice completes the text with the most logical and precise word or phrase?':
    'Replace the target word or phrase in pessage with "_____".',

  'Which choice completes the text with the most logical transition?':
    'The passage should contain two related ideas requiring a logical transition. Insert "_____" where a transition word or phrase should appear',

  'The student wants to emphasize [specific aspect] about [topic]. Which choice most effectively uses relevant information from the notes to accomplish this goal?':
    'Transform modifiedPassageText into an official Digital SAT Student Notes passage, then rewrite the passage as a series of concise bullet-point notes. Wrap each individual note with ^...^. Preserve all key information from the original passage, but present it as notes rather than paragraphs.',

  'The student wants to highlight [specific aspect] regarding [subject]. Which choice most effectively uses relevant information from the notes to accomplish this goal?':
    'Transform modifiedPassageText into an official Digital SAT Student Notes passage, then rewrite the passage as a series of concise bullet-point notes. Wrap each individual note with ^...^. Preserve all key information from the original passage, but present it as notes rather than paragraphs.',

  'The student wants to present [topic] and its [conclusions/findings]. Which choice most effectively uses relevant information from the notes to accomplish this goal?':
    'Transform modifiedPassageText into an official Digital SAT Student Notes passage, then rewrite the passage as a series of concise bullet-point notes. Wrap each individual note with ^...^. Preserve all key information from the original passage, but present it as notes rather than paragraphs.',

  'The student wants to contrast [aspect A] and [aspect B] in the two [subjects]. Which choice most effectively uses relevant information from the notes to accomplish this goal?':
    'Transform modifiedPassageText into an official Digital SAT Student Notes passage, then rewrite the passage as a series of concise bullet-point notes. Wrap each individual note with ^...^. Preserve all key information from the original passage, but present it as notes rather than paragraphs.',

  'The student wants to emphasize the [duration/purpose/cause/effect] of [subject]. Which choice most effectively uses relevant information from the notes to accomplish this goal?':
    'Transform modifiedPassageText into an official Digital SAT Student Notes passage, then rewrite the passage as a series of concise bullet-point notes. Wrap each individual note with ^...^. Preserve all key information from the original passage, but present it as notes rather than paragraphs.',

  'Based on the texts, how would the author of Text 2 most likely respond to the claim presented in Text 1?':
  'Split pessage into two separate passages at the most natural break to create Dual text question. Wrap the entire two passage with &&[pessage1]&& &&[pessage2]&&',

'Based on the texts, how would the author of Text 2 most likely characterize the argument presented in Text 1?':
  'Split pessage into two separate passages at the most natural break to create Dual text question. Wrap the entire two passage with &&[pessage1]&& &&[pessage2]&&',

'Based on the texts, which statement best describes the relationship between the two texts?':
  'Split pessage into two separate passages at the most natural break to create Dual text question. Wrap the entire two passage with &&[pessage1]&& &&[pessage2]&&',

'Based on the texts, which statement best compares the perspectives of the two authors?':
  'Split pessage into two separate passages at the most natural break to create Dual text question. Wrap the entire two passage with &&[pessage1]&& &&[pessage2]&&',
};

export async function generateQuestionsForPassages({
  passages,
  category,
  difficulty
}: BulkQuestionParams): Promise<any[]> {

  const categoryTemplates =
    templateGroups[category as keyof typeof templateGroups] ||
    templateGroups['information-and-ideas'];

  const selectedTemplates = passages.map(() => {
    const randomIndex = Math.floor(Math.random() * categoryTemplates.length);
    return categoryTemplates[randomIndex];
  });  

    const passageConfigs = passages.map((passage, index) => ({
      passage,
      template: selectedTemplates[index],
      instruction: templateInstructions[selectedTemplates[index]] ?? null
    }));

    const systemPrompt = `
You are an SAT test maker.

For EACH passage, generate exactly ONE tailored Digital SAT Reading and Writing question.

DO NOT generate answer choices, answers, or explanations.

Respond ONLY as a JSON array with the same number of objects as the input passages.

General Rules:
- Use ONLY the provided template for each passage.
- Replace any bracketed placeholders with context-specific wording.
- Unless an additional instruction is provided, modifiedPassageText must remain identical to the original passage.
- All questions must closely resemble official Digital SAT Reading and Writing questions.
- Do not create generic classroom-style questions.
`;

  try {
    const result = await groq.chat.completions.create({
      model: 'groq/compound',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Passages:
${JSON.stringify(passageConfigs, null, 2)}
1. Read the original article carefully.
2. Select the most informative paragraph or section that can stand alone while preserving the author's main message.
3. Rewrite and condense the selected text into approximately ${difficulty === "easy" ? "25-50" : difficulty === "medium" ? "50-75" : "75-100"} words, following the typical length of a Digital SAT reading passage.
4. Remove unnecessary details such as, repetitions, statistics, side discussions that are not essential to understanding the passage.
5. Simplify the language slightly to match the Digital SAT reading level, but do not oversimplify the ideas or change their meaning.
6. Preserve the author's tone, writing style, logical flow, and intended message as much as possible. The passage should feel like an authentic adaptation rather than a summary.
7. Ensure the adapted passage is coherent, self-contained, and understandable without requiring additional context from the original article.
8. Finally, generate authentic Digital SAT-style Reading and Writing questions based solely on the adapted passage.

Category: ${category}
Difficulty: ${difficulty}

Each object already contains:
- the passage
- the exact question template to use
- any additional formatting instruction (if needed)

Follow those instructions exactly.
JSON FORMAT 
[
  {
    "question": "question text",
    "modifiedPassageText": "Pessage"
  },
  {
    "question": "question text",
    "modifiedPassageText": "Pessage"
  },...
]
`
        }
      ],
      temperature: difficulty === 'hard' ? 0.5 : 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const text = result.choices[0]?.message?.content || '[]';

    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed)
        ? parsed
        : Object.values(parsed)[0] as any[];
    } catch {
      const cleaned = text
        .replace(/,\s*}/g, '}')
        .replace(/,\s*\]/g, ']')
        .replace(/,\s*,/g, ',');

      const parsed = JSON.parse(cleaned);

      return Array.isArray(parsed)
        ? parsed
        : Object.values(parsed)[0] as any[];
    }
  } catch (error: any) {
    if (error?.response?.status === 429) {
      await senMessage();
    }
    console.error(error);
    throw error;
  }
}

interface GenerateAnswersParams {
  questions: any[];
  difficulty: "easy" | "medium" | "hard";
}

export async function GenerateAnswers({ questions, difficulty }: GenerateAnswersParams): Promise<any[]> {
  const systemPrompt = `You are an elite SAT psychometrician. Your sole task is to generate 4 multiple-choice options (A, B, C, D) for each provided SAT question. 
  Respond ONLY as a valid JSON array of objects. No conversational filler, no markdown wrapping.

  CRITICAL RULES FOR THE 100% CORRECT ANSWER:
  - Must be completely unarguable and directly supported by explicit evidence or airtight literal inference in the text.
  - Cannot require any outside assumptions or extrapolation. 
  - Often uses paraphrased versions of the words in the text rather than repeating exact phrases.

  CRITICAL RULES FOR TRAPS/DISTRACTORS (Based on official College Board SAT Specifications):
  You must generate exactly 3 highly deceptive traps based on the "${difficulty}" level using these specific SAT-error archetypes:
  1. "Too Broad" / "Overgeneralization": Takes a small detail from the text and blows it out of proportion, making a claim that applies to a whole field, world, or concept when the text only discussed a specific instance.
  2. "Too Narrow" / "Detail Trap": Focuses on a completely true statement from the passage, but one that does NOT answer the specific question asked (e.g., states a minor fact instead of answering the main idea or the exact prompt question).
  3. "Unsupported / New Information" / "Plausible but Absent": An option that sounds highly logical, scientifically accurate, or naturally true in the real world, but has absolutely ZERO explicit textual evidence in the provided passage. 
  4. "Right Words, Wrong Relationship" / "Textual Mash-up": Uses exact, high-impact keywords directly lifted from the text, but rearranges them or alters the verbs/prepositions to invert, distort, or completely fake the logical relationship stated by the author.
  5. "Extreme / Absolute Language": Uses words like "always", "never", "entirely", "completely", or "impossible" when the text only suggests a tendency, possibility, or nuanced probability.

  For ${difficulty} level, make the distinctions between the correct answer and the traps extremely subtle.`;

  const userPrompt = `
  Input Questions & Passages Data:
  ${JSON.stringify(questions)}

  Output Schema (Return exactly this array structure, NO explanations), Respond like this:
  [
    {
      "question": "The original question string",
      "modifiedPassageText": "The original modifiedPassageText string",
      "options": [
       "Option text",
       "Option text",
       "Option text",
       "Option text"
      ],
      "correctAnswerIndex": 0
    }
  ]`;

  try {
    const result = await groq.chat.completions.create({
      model: 'groq/compound',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: difficulty === 'hard' ? 0.6 : 0.4,
      max_tokens: 3000,
      response_format: { type: 'json_object' }
    });

    const text = result.choices[0]?.message?.content || '[]';
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : Object.values(parsed)[0] as any[];
    } catch {
      const cleaned = text.replace(/,\s*}/g, '}').replace(/,\s*\]/g, ']').replace(/,\s*,/g, ',');
      const parsed = JSON.parse(cleaned);
      return Array.isArray(parsed) ? parsed : Object.values(parsed)[0] as any[];
    }
  } catch (error: any) {
    if (error?.response?.status === 429) {
      await senMessage();
    }
    console.error('Groq Answers Generation Error:', error);
    throw error;
  }
}

export async function GenerateExplanation(test2: any[]): Promise<any[]> {
  const systemPrompt = `You are an expert SAT psychometrician and elite educator. Your task is to analyze the provided SAT questions and create a thorough, deeply contextual explanation for every single option (A, B, C, and D) based strictly on text evidence.
  Respond ONLY as a valid JSON array of objects. No conversational filler, no markdown wrapping.

  CRITICAL EXPLANATION RULES (College Board Style):
  - Correct Answer Explanation: You must write a high-quality paragraph explicitly starting with "Choice [Letter] is the best answer because...". It must detail exactly how the option logically aligns with the passage, quoting or paraphrasing the text, and breaking down the precise contextual definition or reasoning.
  - Incorrect Answer Explanations: For the remaining three options, you must write individual paragraphs explicitly starting with "Choice [Letter] is incorrect because...". Deconstruct why that word or statement does not make sense in context, explaining its literal definition and contrasting it directly against what the text actually states or implies. Do not use short bullet points; use full, sophisticated academic prose exactly like official SAT answer keys.`;

  const userPrompt = `
  Input Test Data:
  ${JSON.stringify(test2)}

  Output Schema (Return exactly this array structure):
  [
    {
      "question": "The original question string",
      "text": "The original text string",
     "options": [
       "Option text original",
       "Option text original",
       "Option text original",
       "Option text original"
      ],
      "correctAnswerIndex": 0 orginal,
      "explanation": {
        0: "Choice A is the best answer because... OR Choice A is incorrect because...",
        1: "Choice B is the best answer because... OR Choice B is incorrect because...",
        2: "Choice C is the best answer because... OR Choice C is incorrect because...",
        3: "Choice D is the best answer because... OR Choice D is incorrect because..."
      }
    }
  ]`;

  try {
    const result = await groq.chat.completions.create({
      model: 'groq/compound',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    });

    const text = result.choices[0]?.message?.content || '[]';
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : Object.values(parsed)[0] as any[];
    } catch {
      const cleaned = text.replace(/,\s*}/g, '}').replace(/,\s*\]/g, ']').replace(/,\s*,/g, ',');
      const parsed = JSON.parse(cleaned);
      return Array.isArray(parsed) ? parsed : Object.values(parsed)[0] as any[];
    }
  } catch (error: any) {
    if (error?.response?.status === 429) {
      await senMessage();
    }
    console.error('Groq Explanation Generation Error:', error);
    throw error;
  }
}

interface PassageParams {
  context: string;    
  category: "Information and Ideas" | "Craft and Structure" | "Standart English Convention" | "Expression of Ideas";
  difficulty: "Easy" | "Medium" | "Hard";
  userWords: string[]; 
}

interface SATPassage {
  id: number;
  title: string;
  passageText: string;
  difficulty: string;
  category: string;
  targetWordsUsed: string[]; 
}

export async function generateSATPassages({
  context,
  category,
  difficulty,
  userWords
}: PassageParams): Promise<SATPassage[]> {
  
  const systemPrompt = `You are an expert SAT test maker and psychometrician. 
Your task is to generate exactly 4 high-quality, authentic Digital SAT-style passages based STRICTLY on the provided Source Context.
Respond ONLY in a valid JSON array format containing exactly 4 objects. No markdown formatting, no conversational filler.

CRITICAL RULES FOR PASSAGES:
1. Source Fidelity: Use the provided Source Context to extract facts, arguments, or data. Do not hallucinate external historical or scientific facts outside the context scope.
2. Tone & Style: Strictly academic, cohesive, and professional, perfectly mirroring Digital SAT passages.
3. Length: Each passage must be a single, focused paragraph between 80 to 150 words.
4. Vocabulary & Difficulty Tuning:
   - Vocabulary Injection: Analyze the user's target words: [${userWords}]. If any of these words or their direct synonyms fit logically into the passage context, you MUST weave them into the text, replacing weaker words without altering the sentence's meaning.
   - 'easy': If difficulty is Easy, rewrite the context using clear, accessible, and common English vocabulary size: 30-40 words.
   - 'medium': Use standard, high-school-level academic prose size: 40-55 words.
   - 'hard': Use advanced, high-tier SAT vocabulary and sophisticated/complex sentence structures, ensuring the quality remains elite while preserving absolute clarity. size: 60-90 words`;

  const userPrompt = `Source Context to build passages from:
\"\"\"
${context}
\"\"\"

Parameters:
- Category: ${category} (Digital SAT style)
- Difficulty Level: ${difficulty}
- Target User Words to prioritize/substitute: [${userWords}]

JSON Output Schema:
[
  {
    "id": 1,
    "passageText": "The refined, SAT-style academic passage text here...",
  }
]`;

  try {
    const result = await groq.chat.completions.create({
      model: 'groq/compound',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: difficulty === 'Hard' ? 0.5 : 0.3, 
      max_tokens: 2500,
      response_format: { type: 'json_object' }
    });

    const text = result.choices[0]?.message?.content || '[]';
    
    try {
      const parsedData = JSON.parse(text);
      return Array.isArray(parsedData) ? parsedData : (parsedData.passages || Object.values(parsedData)[0]);
    } catch {
      const cleaned = text
        .replace(/,\s*}/g, '}')
        .replace(/,\s*\]/g, ']')
        .replace(/,\s*,/g, ',');
      const parsedData = JSON.parse(cleaned);
      return Array.isArray(parsedData) ? parsedData : (parsedData.passages || Object.values(parsedData)[0]);
    }

  } catch (error: any) {
    if (error?.response?.status === 429) {
      await senMessage();
    }
    console.error("SAT Passage generation pipeline error:", error);
    throw error;
  }
}

export async function generateRulesQuestion(context: string, context2: string) {
  const systemPrompt = `
You are an elite Digital SAT English Conventions item writer and psychometrician.

Your task is to generate EXACTLY 5 authentic Digital SAT English Conventions questions based STRICTLY on the provided Rules Context.

Respond ONLY with valid JSON.

CRITICAL RULES:

1. Use ONLY the grammar and writing rules found in the provided context.
2. Do NOT introduce external grammar concepts.
4. Use this exact question text:
3. You must use blank in the every pessage!

"Which choice completes the text so that it conforms to the conventions of Standard English?"

8. Incorrect answers must be plausible and mimic common student mistakes.
12. Each passage should be 30-80 words and the blank on testing section
13. Every question should target one rule from the provided context.
14. Each question should use pessages in the context while generating standart english convetion question

Output schema:

[
  {
    "text": "passage with a blank using context pessages",
    "question": "Which choice completes the text so that it conforms to the conventions of Standard English?",
    "options": [
      "choice A",
      "choice B",
      "choice C",
      "choice D"
    ],
    "correctAnswerIndex": 0
  }
]
`;

  const userPrompt = `
Rules Context:

"""
${context}
"""

Context for generating pessages below!

"""
${context2}
"""

Generate exactly 5 questions.
`;

  try {
    const result = await groq.chat.completions.create({
      model: "groq/compound",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.9,
      max_tokens: 3000,
      response_format: { type: "json_object" }
    });

    const text = result.choices[0]?.message?.content || "[]";

    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed)
        ? parsed
        : parsed.questions || Object.values(parsed)[0];
    } catch {
      const cleaned = text
        .replace(/,\s*}/g, "}")
        .replace(/,\s*\]/g, "]");

      const parsed = JSON.parse(cleaned);

      return Array.isArray(parsed)
        ? parsed
        : parsed.questions || Object.values(parsed)[0];
    }
  } catch (error: any) {
    if (error?.response?.status === 429) {
      await senMessage();
    }
    console.error("Rules Question Generation Error:", error);
    throw error;
  }
}

export const translateWords = async (words) => {
  const wordsList = Array.isArray(words) ? words.join(', ') : words;

  const response = await axios.post(
    'https://api.mistral.ai/v1/chat/completions',
    {
      model: 'mistral-large-latest',
      messages: [
        { 
          role: 'system', 
          content: 'Translate English words to Uzbek. Fix spelling mistakes. Remove extra characters and symbols. Return ONLY valid English words. Return ONLY JSON array: [{"term":"corrected_english","definition":"uzbek"}]'
        },
        { role: 'user', content: `Translate: ${wordsList}` }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    },
    {
      headers: {
        'Authorization': `Bearer ${env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const content = response.data.choices[0].message.content;
  const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').replace(/`/g, '');
  const match = cleaned.match(/\[[\s\S]*\]/);
  
  if (!match) throw new Error('Invalid response format');
  return JSON.parse(match[0]);
};
