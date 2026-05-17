import { GoogleGenAI, Type } from "@google/genai";

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
    7. CRITICAL: Clean all text from artifacts like "\\n*" or weird formatting characters.
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
                correctAnswerIndex: { type: Type.INTEGER },
                difficulty: { type: Type.STRING, description: "Infer from content (Easy, Medium, Hard)" },
                category: { type: Type.STRING, description: "Infer from content (SAT Category)" }
              },
              required: ["id", "text", "options", "correctAnswerIndex", "difficulty", "category"]
            }
          }
        },
        required: ["title", "questions"]
      }
    }
  });

  return cleanTest(JSON.parse(response.text || "{}"));
}

export async function generateSATTest(category: string, difficulty: string, count: number, words?: string): Promise<ParsedTest> {
  const model = "gemini-3-flash-preview";
  const systemInstruction = `
    You are an expert Digital SAT (DSAT) instructor. Create a high-quality practice test for the category: ${category}.
    
    Difficulty: ${difficulty}
    Question Count: ${count}.
    ${words ? `INTEGRATION OBJECTIVE: You MUST integrate these specific vocabulary words/concepts into the questions and passages: ${words}. Let them be the focus of the question or essential context within the DSAT style passage.` : 'Generate standard high-rigor DSAT questions for this category.'}

    Rules for DSAT Questions:
    - For Reading & Writing: Every question MUST feature a high-level passage (paragraphs/sentences). Use authentic DSAT language.
    - Metdata: For every question, include its "difficulty" (matching ${difficulty}) and "category" (matching ${category}).
    - CRITICAL: Do NOT include any formatting artifacts like "\\n*" or markdown bullets in the text fields.
    - Category section should contain => information-ideas, craft-structure, expression-ideas, standard-conventions
    
    Structure:
    The question stem must sound like a real DSAT question
    Return a structured JSON match schema.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [{ text: `Generate a ${difficulty} difficulty practice test for ${category} with ${count} questions.${words ? ` Focus on these words: ${words}` : ''}` }],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          category: { type: Type.STRING },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                text: { type: Type.STRING },
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswerIndex: { type: Type.INTEGER },
                difficulty: { type: Type.STRING },
                category: { type: Type.STRING }
              },
              required: ["id", "text", "options", "question", "correctAnswerIndex", "difficulty", "category"]
            }
          }
        },
        required: ["title", "questions", "category"]
      }
    }
  });

  return cleanTest(JSON.parse(response.text || "{}"));
}

export async function generateStory(category: string, topic: string, length: 'short' | 'medium' | 'long', words?: string): Promise<{ title: string, content: string }> {
  const model = "gemini-3-flash-preview";
  const systemInstruction = `
    You are a creative writer and SAT tutor. Create a high-quality ${length} story about "${topic}" in the context of "${category}".
    ${words ? `INTEGRATION OBJECTIVE: You MUST naturally weave these specific SAT vocabulary words/concepts into the narrative: ${words}.

    WORD USAGE RULES (CRITICAL):
    - Each vocabulary word MUST be used in a context that makes its meaning clear and understandable from surrounding sentences.
    - Do NOT just list the words or force them awkwardly. They should feel like natural parts of the story.
    - Use the words in ways that reveal their definitions through context clues, actions, or character dialogue.
    - If a word is abstract, embody it through concrete situations or character decisions.
    - The story should remain engaging and coherent — never sacrifice readability for vocabulary insertion.
    - Aim for at least ONE meaningful usage of each provided word.` : ''}

    Structure:
    - Title: Attractive and relevant.
    - Content: Polished prose, well-structured paragraphs.
    - Length Guidelines: ${length === 'short' ? 'Short (~250 words)' : length === 'medium' ? 'Medium (~500 words)' : 'Long (~1000 words)'}

    Format the output as a JSON object with 'title' and 'content' keys.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [{ text: "Write the story now." }],
    config: { 
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string" }
        },
        required: ["title", "content"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
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

export async function generateWordsTest(category: string, words: string, count: number): Promise<ParsedTest> {
  const model = "gemini-3-flash-preview";
  const systemInstruction = `
    You are a language teacher. Create a high-level vocabulary test.
    Focus on these specific words: ${words}.
    Target Category/Context: ${category}.
    
    Create ${count} questions. 
    Every question MUST be context-based (sentence completion or passage analysis) within the ${category} field.
    Use the provided words as the primary focus for correct answers or essential context.
    Metdata: For every question, include its "difficulty" (assign based on complexity) and "category" (matching Vocabulary: ${category}).
    CRITICAL: Clean all text from artifacts like "\\n*".
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [{ text: `Create a ${count} question ${category} test using these words: ${words}` }],
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
                correctAnswerIndex: { type: Type.INTEGER },
                difficulty: { type: Type.STRING },
                category: { type: Type.STRING }
              },
              required: ["id", "text", "options", "correctAnswerIndex", "difficulty", "category"]
            }
          }
        },
        required: ["title", "questions"]
      }
    }
  });

  return cleanTest(JSON.parse(response.text || "{}"));
}

export async function translateText(text: string, from: string, to: string): Promise<string> {
  const model = "gemini-2.0-flash";
  const systemInstruction = `
    You are a professional translator. Translate the given text accurately from ${from} to ${to}.
    Preserve the meaning and tone of the original text.
    Return only the translated text without any additional explanations or formatting.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [{ text: `Translate the following ${from} text to ${to}:\n\n${text}` }],
    config: {
      systemInstruction,
      responseMimeType: "text/plain",
    }
  });

  return response.text || "";
}

export async function generateSentencesForWords(words: string[]): Promise<Array<{ term: string; sentence: string }>> {
  const model = "gemini-3-flash-preview";
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

  const response = await ai.models.generateContent({
    model,
    contents: [{ text: "Generate sentences for each word now." }],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: "array",
        items: {
          type: "object",
          properties: {
            term: { type: "string" },
            sentence: { type: "string" }
          },
          required: ["term", "sentence"]
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
}