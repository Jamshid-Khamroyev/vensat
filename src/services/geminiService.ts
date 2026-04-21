import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ParsedQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface ParsedTest {
  title: string;
  questions: ParsedQuestion[];
}

export async function parseTestContent(testText: string, keyText: string): Promise<ParsedTest> {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are a professional exam parser. Your task is to take raw test text and a list of correct answers, 
    then merge them into a structured JSON format.
    
    Rules:
    1. Identify all questions from the test text.
    2. Match them with the correct answers provided in the key text. 
    3. If the key text is a numbered list (e.g., 1-A, 2-B), match by number.
    4. Options should be extracted as an array of strings.
    5. correctAnswerIndex should be 0-based.
    6. Return a title for the test based on the content.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [{ text: `TEST TEXT:\n${testText}\n\nANSWER KEY:\n${keyText}` }],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                text: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswerIndex: { type: Type.INTEGER }
              },
              required: ["id", "text", "options", "correctAnswerIndex"]
            }
          }
        },
        required: ["title", "questions"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function generateSATTest(type: string, count: number): Promise<ParsedTest> {
  const model = "gemini-3-flash-preview";
  const systemInstruction = `
    You are an expert SAT tutor. Create a high-quality SAT-style practice test.
    The test should focus on: ${type}.
    Create exactly ${count} questions.
    Questions must be rigorous, with one clear correct answer and three plausible distractors.
    For Reading/Writing, include relevant passages.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [{ text: `Generate a ${count} question SAT practice test for ${type}.` }],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                text: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswerIndex: { type: Type.INTEGER }
              },
              required: ["id", "text", "options", "correctAnswerIndex"]
            }
          }
        },
        required: ["title", "questions"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function generateWordsTest(words: string, count: number): Promise<ParsedTest> {
  const model = "gemini-3-flash-preview";
  const systemInstruction = `
    You are a language teacher. Create a test focused on these specific words: ${words}.
    Create ${count} questions. 
    Use various formats like fill-in-the-blank (with options), definition matching, or sentence completion.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [{ text: `Create a ${count} question test based on these words: ${words}` }],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                text: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswerIndex: { type: Type.INTEGER }
              },
              required: ["id", "text", "options", "correctAnswerIndex"]
            }
          }
        },
        required: ["title", "questions"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}
