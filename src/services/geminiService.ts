import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import { getSATInstructions } from "../utils/index";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ParsedQuestion {
  _id: string;
  text: string;
  options: string[];
  correctAnswerIndex?: number;
  difficulty?: string;
  graph?: string;
  question: string ;
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

// ===========================================================================

const mistral_api = process.env.MISTRAL_API || "Pw44z1Z70t9mBvIfRGOGxm8zgI3HoFBy"

export async function generateSATTest(
  category: string,
  difficulty: string,
  count: number,
  words?: string
) {
  const { systemInstruction, prompt } = getSATInstructions(category, {
    difficulty,
    count,
    words,
  });

  const response = await axios.post(
    "https://api.mistral.ai/v1/chat/completions",
    {
      model: "ministral-3b-2512",
      messages: [
        {
          role: "system",
          content: systemInstruction,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.6,
      response_format: {
        type: "json_object",
      },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY || mistral_api}`,
        "Content-Type": "application/json",
      },
    }
  );

  const responseText = response.data.choices[0].message.content;

  const data = cleanTest(JSON.parse(responseText));
  return data
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