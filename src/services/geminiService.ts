import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import Groq from 'groq-sdk';

const isBrowser = typeof window !== 'undefined'

const VITE_GEMINI_API_KEY = isBrowser ? (import.meta.env?.VITE_GEMINI_API_KEY || '') : (process.env?.VITE_GEMINI_API_KEY || process.env?.GEMINI_API_KEY || '') || 'AIzaSyCPaO2ZwchH1_vLCf9RlAYm5AKqR6IsR7s';
const VITE_GROQ_API_KEY = isBrowser ? (import.meta.env?.VITE_GROQ_API_KEY || '') : (process.env?.VITE_GROQ_API_KEY || process.env?.GROQ_API_KEY || '') || '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';
const VITE_OPEN_ROUTER = isBrowser ? (import.meta.env?.VITE_OPEN_ROUTER || '') : (process.env?.VITE_OPEN_ROUTER || process.env?.OPEN_ROUTER || '') || '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';


const ai = new GoogleGenAI({ apiKey: VITE_GEMINI_API_KEY});

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

// ====================================================

export async function generateStory(
  genre: string,
  topic: string,
  length: 'medium' | 'long' | 'extended',
  words?: string,
  description?: string
): Promise<{ title: string, content: string }> {
  const lengthMap = { medium: '~500 words', long: '~1000 words', extended: '~2000 words' };
  const tokenMap = { medium: 800, long: 1500, extended: 2800 };

  const { data } = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: 'You are a storyteller. Respond with valid JSON: {"title": "...", "content": "..."}' },
      { role: 'user', content: `Create a ${genre} story about "${topic}". ${description ? `Context: ${description}` : ''} ${words ? `Include these words naturally in their context: ${words}` : ''} Length: ${lengthMap[length]}` }
    ],
    temperature: 0.8,
    max_tokens: tokenMap[length],
    response_format: { type: "json_object" }
  }, {
    headers: { 'Authorization': `Bearer ${VITE_GROQ_API_KEY}`, 'Content-Type': 'application/json' }
  });
  
  return JSON.parse(data.choices[0].message.content);
}

export async function chatWithAI(message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[]) {
  const model = "gemini-3-flash-preview";
  const systemInstruction = "You are AeroBot, a sleek and helpful SAT coach. Keep your responses concise, visually structured with bullet points or bold text, and encouraging. Use simple language but high-value tips. If asked about a problem, break it down step-by-step.";
  
  const response = await ai.models.generateContent({
    model,
    contents: [...history, { role: 'user', parts: [{ text: message }] }],
    config: { systemInstruction }
  });
  
  return response.text;
}

export async function generateSentencesForWords(words: string[]): Promise<Array<{ term: string; sentence: string }>> {
  const model = "llama-3.3-70b-versatile";
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

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VITE_GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: "Generate sentences for each word now." }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    })
  });

  const data = await response.json();
  const result = JSON.parse(data.choices[0].message.content || "[]");
  
  // Agar javob array bo'lmasa, ichidan array topish
  if (Array.isArray(result)) {
    return result;
  }
  
  // Ba'zi modellar { sentences: [...] } formatida qaytarishi mumkin
  if (result.vocab && Array.isArray(result.vocab)) {
    return result.vocab;
  }

  if (result.vocabulary && Array.isArray(result.vocabulary)) {
    return result.vocabulary;
  }
  
  return [];
}



export async function generatePracticeQuestionsAI(
  params: GeneratePracticeParams
): Promise<PracticeQuestion[]> {
  const { words } = params;
  
  // So'zlarni stringga aylantirish
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
    const { data } = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          'Authorization': `Bearer ${VITE_GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const response = JSON.parse(data.choices[0].message.content);
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
    
  } catch (error) {
    console.error('Error generating practice questions:', error);
    throw new Error('Failed to generate practice questions');
  }
}



// RAG ====================================================================
import { OpenRouter } from '@openrouter/sdk';

const openrouter = new OpenRouter({
  apiKey: VITE_OPEN_ROUTER || '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',
});

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

const groq = new Groq({
  apiKey: VITE_GROQ_API_KEY || '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',
  dangerouslyAllowBrowser: true
});


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
    'Which choice completes the text with the most logical and precise word or phrase?'
  ],

  'expression-of-ideas': [
    // 'The student wants to emphasize [specific aspect] about [topic]. Which choice most effectively uses relevant information from the notes to accomplish this goal?',
    // 'The student wants to highlight [specific aspect] regarding [subject]. Which choice most effectively uses relevant information from the notes to accomplish this goal?',
    // 'The student wants to present [topic] and its [conclusions/findings]. Which choice most effectively uses relevant information from the notes to accomplish this goal?',
    // 'The student wants to contrast [aspect A] and [aspect B] in the two [subjects]. Which choice most effectively uses relevant information from the notes to accomplish this goal?',
    // 'The student wants to emphasize the [duration/purpose/cause/effect] of [subject]. Which choice most effectively uses relevant information from the notes to accomplish this goal?',
    'Which choice completes the text with the most logical transition?'
  ]
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
    
  const templates = selectedTemplates
    .map((template, index) => `${index + 1}. "${template}"`)
    .join('\n');    

  const systemPrompt = `You are an SAT test maker.

For EACH passage in the provided array, generate exactly ONE tailored question prompt.

DO NOT generate multiple choice options (A, B, C, D), answers, or explanations.

Respond ONLY as a JSON array containing objects matching the number of input passages.

Rules per passage object:
- Pick ONLY from the provided question templates.
- Tailor brackets to fit the context.
- If "Which choice most logically completes the text?" is chosen, add "_____" in 'modifiedPassageText not questionText'.
- If "Which choice best describes the function of the underlined sentence in the overall structure of the text?" is chosen, wrap the target sentence in #hash_symbols# in 'modifiedPassageText not questionText'.
- If "Which choice best states the main purpose of the underlined portion as a whole?" is chosen, wrap the target portion in #hash_symbols# in 'modifiedPassageText not questionText'.
- If "Which choice completes the text with the most logical and precise word or phrase?" is chosen, add a blank "_____" in 'modifiedPassageText not questionText' where the word or phrase should appear.
- If a Transition question is selected ("Which choice completes the text with the most logical transition?"), transform the passage into a realistic SAT Transition task. Insert a blank "_____" at the point where a logical transition word or phrase is needed. The passage should contain two related ideas that require a logical bridge.
- For all other question types, 'modifiedPassageText' must match the original text.
- All questions must closely resemble official Digital SAT Reading and Writing questions.
- Do not create generic classroom-style questions.`;

  try {
    const result = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Question Templates For This Run:
          
Question Templates For Each Passage (use template 1 for passage 1, template 2 for passage 2, etc.):
${templates}  

Passages Array:
${JSON.stringify(passages)}

Category: ${category}
Difficulty: ${difficulty}`
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
  } catch (error) {
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

  Output Schema (Return exactly this array structure, NO explanations):
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
      model: 'llama-3.3-70b-versatile',
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
  } catch (error) {
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
      "modifiedPassageText": "The original modifiedPassageText string",
     "options": [
       "Option text original",
       "Option text original",
       "Option text original",
       "Option text original"
      ],
      "correctAnswerIndex": 0,
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
      model: 'llama-3.3-70b-versatile',
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
  } catch (error) {
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
   - 'easy': If difficulty is Easy, rewrite the context using clear, accessible, and common English vocabulary.
   - 'medium': Use standard, high-school-level academic prose.
   - 'hard': Use advanced, high-tier SAT vocabulary and sophisticated/complex sentence structures, ensuring the quality remains elite while preserving absolute clarity.`;

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
      model: 'llama-3.3-70b-versatile',
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
    console.error("SAT Passage generation pipeline error:", error);
    throw error;
  }
}