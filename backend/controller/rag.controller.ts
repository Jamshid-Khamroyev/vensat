import { Router, Request, Response } from 'express';
import { createEmbedding, createTest } from '../../src/services/geminiService';
import { setupCollection, saveToQdrant, searchInQdrant } from '../../src/services/qdrant';

const ragRouter = Router();

function splitIntoChunks(text: string, size: number = 300): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + sentence).length > size) {
      if (current.trim()) chunks.push(current.trim());
      current = sentence;
    } else {
      current += ' ' + sentence;
    }
  }
  
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

ragRouter.post('/upload', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ success: false, error: 'Text required' });
    }

    const chunks = splitIntoChunks(text);
    
    const embeddings: number[][] = [];
    for (let i = 0; i < chunks.length; i++) {
      const emb = await createEmbedding(chunks[i]);
      embeddings.push(emb);
    }
    
    await setupCollection();
    
    await saveToQdrant(
      chunks.map((text, i) => ({ id: `chunk_${i}`, text })),
      embeddings
    );
    
    res.json({
      success: true,
      data: {
        chunks: chunks.length,
        preview: chunks[0]?.substring(0, 100)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message, errorStack: error });
  }
});

ragRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const { topic, count = 4 } = req.body;
    
    if (!topic) {
      return res.status(400).json({ success: false, error: 'Topic required' });
    }

    const queryEmbedding = await createEmbedding(topic);
    const results = await searchInQdrant(queryEmbedding, 3);
    
    const context = results
      .map((r: any) => r.payload?.text || '')
      .filter(Boolean)
      .join('\n\n');
    
    if (!context) {
      return res.json({
        success: true,
        data: {
          topic,
          questions: [{
            question: 'Ma\'lumot topilmadi. Avval matn yuklang.',
            options: ['Ha', 'Yo\'q', 'OK', 'Keyin'],
            correctAnswer: 0,
            explanation: 'Matn yuklash kerak'
          }]
        }
      });
    }
    
    const test = await createTest(context, count, topic);
    
    
    res.json({
      success: true,
      data: { topic, context, ...test }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error });
  }
});

export default ragRouter; 
