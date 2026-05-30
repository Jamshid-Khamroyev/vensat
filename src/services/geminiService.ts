import { GoogleGenAI, Type } from "@google/genai";
import axios from "axios";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ParsedQuestion {
  _id: string;
  text: string;
  options: string[];
  correctAnswerIndex?: number;
  difficulty?: string;
  question?: string ;
  category?: string;
}

export interface ParsedTest {
  _id: string;
  title: string;
  questions: ParsedQuestion[];
}

function cleanText(text: string): string {
  if (!text) return "";
  // Remove markdown artifacts like \n*, \r, etc. and normalize spacing
  return text.replace(/\\n\*/g, " ").replace(/\n\*/g, " ").replace(/\s+/g, " ").trim();
}

function cleanTest(test: ParsedTest): ParsedTest {
  return {
    ...test,
    title: cleanText(test.title),
    questions: test.questions.map(q => ({
      ...q,
      text: cleanText(q.text),
      options: q.options.map(cleanText)
    }))
  };
}

import { CohereClientV2 } from 'cohere-ai';

const cohere = new CohereClientV2({ token: process.env.COHERE_API_KEY || 'VFd7U1jk9dql7eBgrWYtJqmaYdNpwRbfvuFp4XBL' });

export async function generateSATTest(category: string, difficulty: string, count: number, words?: string): Promise<ParsedTest> {
    const model = "command-a-plus-05-2026";
    const systemInstruction = `
    You are an expert Digital SAT (DSAT) Reading & Writing question writer.

    Create ONLY official-style current DSAT questions.

    Category: ${category}
    Difficulty: ${difficulty}
    Question Count: ${count}

    ${words 
      ? `Use these vocabulary words naturally throughout passages and answer choices: ${words}. Try to distribute them naturally across as many passages as possible. In vocabulary-in-context questions, prefer using the words inside answer choices naturally, not inside the question stem.` 
      : ''
    }

    CRITICAL REQUIREMENTS - MUST FOLLOW EXACTLY:
    
    1. EVERY question MUST be directly instantiated/adapted from REAL Bluebook Digital SAT tests
    2. EVERY passage MUST be written in EXACT Bluebook style (same tone, length, complexity)
    3. EVERY question format MUST be taken directly from College Board's official DSAT tests
    4. DO NOT invent new question types - ONLY use formats that have appeared on REAL College Board DSAT exams
    5. Each question should feel like it was copied directly from an official Bluebook practice test

    STRICT RULES:
    - ONLY use real DSAT Reading & Writing question formats that have appeared on actual College Board exams
    - NEVER create custom or vocabulary-definition questions
    - NEVER ask about the function or meaning of a specific word (unless it's the official vocabulary-in-context format)
    - Questions must sound EXACTLY like official Bluebook DSAT questions - word-for-word style matching
    - Every passage must mirror real Bluebook passages in: length (50-150 words), complexity, academic tone, and content type

    Allowed stem styles (must match Bluebook exactly):
    ## Information and Ideas
    - "Which choice best states the main idea of the text?"
    - "Which choice most logically completes the text?"
    - "According to the text, ...?" (specific detail questions)
    - "Based on the text, ...?" (inference questions)
    - "Which finding, if true, would most directly support [someone's] hypothesis?"
    - "Which finding, if true, would most directly undermine [someone's] claim?"
    - "Which quotation from the interviews best illustrates [something]?"
    - "Which choice most effectively uses data from the notes to complete the text?"
    - Synthesis questions using student notes format

    ## Craft and Structure
    - "Which choice best completes the text with the most logical and precise word or phrase?"
    - "Which choice best states the main purpose of the text?"
    - "Which choice best describes the function of the [specific sentence] in the overall structure of the text?"
    - "Which choice best describes the overall structure of the text?"
    - "As used in the text, '[word]' most nearly means?"

    ## Expression of Ideas
    - Student notes revision questions (official format only)
    - "Which choice completes the text with the most logical transition?"
    - Rhetorical synthesis questions exactly as they appear on Bluebook

    ## Standard English Conventions
    - "Which choice completes the text so that it conforms to the conventions of Standard English?"
    - Punctuation, grammar, and syntax questions in official Bluebook format

    FORBIDDEN:
    - Any question format not found on official College Board DSAT exams
    - Made-up question stems
    - Vocabulary definition questions (e.g., "What does X mean?")
    - Questions asking about word function or role (e.g., "What is the function of the word X?")
    - Any custom or hybrid formats

    QUESTION DISTRIBUTION:
    - Within each category, distribute different official DSAT subtypes as evenly as possible
    - Each question must be traceable to a REAL Bluebook question pattern
    - Example for craft-structure: balance vocabulary-in-context (as used in text), overall structure, main purpose, text function

    PASSAGE REQUIREMENTS:
    - Length: 50-150 words for single passage questions
    - Content areas: Literature, History/Social Studies, Humanities, Science
    - Authentic academic tone matching College Board style guides
    - Realistic complexity for specified difficulty level
    - Natural paragraph breaks where appropriate
    - No artificial or forced content

    OUTPUT:
    - Return clean valid JSON only
    - No markdown
    - No explanations
    - No formatting artifacts
    - Each question must be indistinguishable from an official Bluebook question
    `;

    const prompt = `Generate a ${difficulty} difficulty practice test for ${category} with ${count} questions.${words ? ` Focus on these words: ${words}` : ''}

  IMPORTANT: Every single question and passage MUST be directly inspired by/adapted from REAL College Board Bluebook Digital SAT tests. Do NOT create any original question formats. Every question pattern should be instantly recognizable as an official DSAT question.

  Return ONLY valid JSON matching this exact schema:
  {
    "title": "string",
    "category": "string",
    "questions": [
      {
        "id": "string (e.g., 'q1', 'q2')",
        "text": "string (Bluebook-style passage, 50-150 words, authentic academic content)",
        "question": "string (EXACT Bluebook question stem format)",
        "options": ["string", "string", "string", "string"],
        "correctAnswerIndex": "number (0-3)",
        "difficulty": "string (easy/medium/hard)",
        "category": "string"
      }
    ]
  }

  VERIFICATION CHECKLIST FOR EACH QUESTION:
  ✓ Passage reads exactly like a real Bluebook passage
  ✓ Question stem matches official College Board wording
  ✓ All 4 answer choices are plausible DSAT-style distractors  
  ✓ Exactly 1 correct answer
  ✓ Format has appeared on actual DSAT exams
  ✓ No invented or hybrid question types
  ✓ Difficulty level matches College Board standards`;

    const response = await cohere.chat({
      model: model,
      messages: [
        {
          role: "system",
          content: systemInstruction
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.6,
      thinking: {
        type: "enabled"
      }
    });

    // Extract JSON from response
    const responseText = response.message?.content?.[0]?.text || "{}";
    
    // Clean potential markdown code blocks
    let cleanJson = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      cleanJson = jsonMatch[1];
    }
    
    return cleanTest(JSON.parse(cleanJson));
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
    headers: { 'Authorization': `Bearer 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`, 'Content-Type': 'application/json' }
  });
  
  return JSON.parse(data.choices[0].message.content);
}

// export async function generateStory(category: string, topic: string, length: 'short' | 'medium' | 'long', words?: string): Promise<{ title: string, content: string }> {
//   const model = "gemini-3-flash-preview";
//   const systemInstruction = `
//     You are a creative writer and SAT tutor. Create a high-quality ${length} story about "${topic}" in the context of "${category}".
//     ${words ? `INTEGRATION OBJECTIVE: You MUST naturally weave these specific SAT vocabulary words/concepts into the narrative: ${words}.

//     WORD USAGE RULES (CRITICAL):
//     - Each vocabulary word MUST be used in a context that makes its meaning clear and understandable from surrounding sentences.
//     - Do NOT just list the words or force them awkwardly. They should feel like natural parts of the story.
//     - Use the words in ways that reveal their definitions through context clues, actions, or character dialogue.
//     - If a word is abstract, embody it through concrete situations or character decisions.
//     - The story should remain engaging and coherent — never sacrifice readability for vocabulary insertion.
//     - Aim for at least ONE meaningful usage of each provided word.` : ''}

//     Structure:
//     - Title: Attractive and relevant.
//     - Content: Polished prose, well-structured paragraphs.
//     - Length Guidelines: ${length === 'short' ? 'Short (~250 words)' : length === 'medium' ? 'Medium (~500 words)' : 'Long (~1000 words)'}

//     Format the output as a JSON object with 'title' and 'content' keys.
//   `;

//   const response = await ai.models.generateContent({
//     model,
//     contents: [{ text: "Write the story now." }],
//     config: { 
//       systemInstruction,
//       responseMimeType: "application/json",
//       responseSchema: {
//         type: "object",
//         properties: {
//           title: { type: "string" },
//           content: { type: "string" }
//         },
//         required: ["title", "content"]
//       }
//     }
//   });

//   return JSON.parse(response.text || "{}");
// }

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
      'Authorization': `Bearer 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`,
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
  
  return [];
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
          'Authorization': `Bearer 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`,
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