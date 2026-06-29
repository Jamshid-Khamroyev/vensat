import { Router, Request, Response } from 'express';
import { createEmbedding, GenerateAnswers, GenerateExplanation, generateQuestionsForPassages, generateRulesQuestion, generateSATPassages } from '../../src/services/geminiService';
import { setupCollection, saveToQdrant, searchInQdrant, COLLECTION_NAME } from '../../src/services/qdrant';
import fs from 'fs';
import { PDFParse } from 'pdf-parse';
import multer from 'multer';
import { Test } from '../models/test.model';
import { Question } from '../models/question.model';
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { authenticateToken } from '../midlewere/auth.midlewere';
import axios from 'axios';


  const ragRouter = Router();

  export const upload = multer({
    dest: 'uploads/'
  });


  function splitIntoChunks(text: string, size: number = 800): string[] {
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

  ragRouter.post('/upload-pdf', upload.single('pdf'), async (req: Request, res: Response) => {
    try {
      const { collectionName } = req.body
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'PDF required'
        });
      }

      const pdfBuffer = fs.readFileSync(req.file.path);
      const pdfData = await new PDFParse(new Uint8Array(pdfBuffer)).getText();
      const text = pdfData.text;

      const chunks = splitIntoChunks(text);

      const embeddings = await Promise.all(chunks.map(chunk => createEmbedding(chunk)));

      await setupCollection(collectionName);

      await saveToQdrant(
        chunks.map((text, i) => ({
          id: `${req.file?.filename}_chunk_${i}`,
          text,
          source: req.file?.originalname,
          chunkIndex: i
        })),
        embeddings,
        collectionName
      );

      res.json({
        success: true,
        data: {
          fileName: req.file.originalname,
          pages: pdfData.total,
          chunks: chunks.length,
          preview: chunks[0]?.substring(0, 100)
        }
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    } finally {
      fs.unlinkSync(req.file.path);
    }
  });

  ragRouter.post('/upload', async (req: Request, res: Response) => {
    try {
      const { text, collectionName } = req.body;
      
      if (!text) {
        return res.status(400).json({ success: false, error: 'Text required' });
      }

      const chunks = splitIntoChunks(text);
      
      const embeddings: number[][] = [];
      for (let i = 0; i < chunks.length; i++) {
        const emb = await createEmbedding(chunks[i]);
        embeddings.push(emb);
      }
      
      await setupCollection(collectionName);
      
      await saveToQdrant(
        chunks.map((text, i) => ({ id: `chunk_${i}`, text })),
        embeddings,
        collectionName
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

  ragRouter.post('/generate', authenticateToken, async (req: Request, res: Response) => {
    try {
      const { difficulty = "medium", category = "", userWords = [] } = req.body
      const results = await searchInQdrant(COLLECTION_NAME.PDF)
      
      const context = results
        .map((r: any) => r.payload?.text || '')
        .filter(Boolean)
        .join('\n\n');
      
      if (!context) return res.json({ success: false, message: "Data is not exist on this query!" })
      
      
      const test = await generateSATPassages({category, context, difficulty, userWords})
      const passagesData = test.map(t => t.passageText)
      
      const test1 = await generateQuestionsForPassages({ passages: passagesData, category, difficulty })
    
      const test2 = await GenerateAnswers({ questions: test1, difficulty })  
      
      const questions = await Promise.all(test2.map(async (t) => {
        const q = await Question.create({ 
          text: t.modifiedPassageText,
          question: t.question,
          options: t.options,
          correctAnswerIndex: t.correctAnswerIndex,
          category,
          difficulty
        })

        return q._id
      }))

      const NewTest = await Test.create({ 
        questions,
        category,
        difficulty,
        creatorId: (req as any).user.userId,
        title: `${category} Test ${new Date().toISOString().split('T')[0]}`
      })
      
      
      res.json({ success: true, data: NewTest });
    } catch (error: any) {
      res.status(500).json({ success: false, error });
    }
  });

  ragRouter.post('/generate/rules', authenticateToken, async (req: Request, res: Response) => {
    try {
      const { query } = req.body

      const emb = await createEmbedding(query)
      
      const result = await searchInQdrant(COLLECTION_NAME.RULES, emb)
      
      const context = result
        .map((r: any) => r.payload?.text || '')
        .filter(Boolean)
        .join('\n\n');

      const results = await searchInQdrant(COLLECTION_NAME.PDF)
      
      const context2 = results
        .map((r: any) => r.payload?.text || '')
        .filter(Boolean)
        .join('\n\n');
      
      const questions = await generateRulesQuestion(context, context2)
      
      res.json({ success: true, data: questions });
    } catch (error: any) {
      res.status(500).json({ success: false, error });
    }
  });

  ragRouter.post("/scan", authenticateToken, async (req: Request, res: Response) => {
        try {
            const { url } = req.body;
            let texts = ``

            if (!url)
                return res.status(400).json({ success: false, message: "URL required" });

            // 1. Category page
            const { data: html } = await axios.get(url);

            const dom = new JSDOM(html, { url });
            const document = dom.window.document;

            const articleLinks = [
              ...new Map(
                  [...document.querySelectorAll("a")]
                      .map((a) => ({
                          title: a.textContent?.trim() || "",
                          href: a.href,
                      }))
                      .filter(
                          (a) =>
                              a.href &&
                              a.title.length > 20 &&
                              a.href.startsWith("http")
                      )
                      .map((item) => [item.href, item])
              ).values(),
          ].slice(40, 100);

            // 3. Har bir article'ni scrape qilish
            const articles = await Promise.all(
                articleLinks.map(async (item) => {
                    try {
                        const { data } = await axios.get(item.href);

                        const articleDom = new JSDOM(data, {
                            url: item.href,
                        });

                        const article = new Readability(
                            articleDom.window.document
                        ).parse();

                        if (!article || article.textContent.length < 500)
                            return null;
                        
                        texts += article.textContent

                        return {
                            title: article.title,
                            length: article.length
                        };
                    } catch {
                        return null;
                    }
                })
            );

      
            if (!texts) {
              return res.status(400).json({ success: false, error: 'Text required' });
            }

            const chunks = splitIntoChunks(texts);
            
            const embeddings: number[][] = [];
            for (let i = 0; i < chunks.length; i++) {
              const emb = await createEmbedding(chunks[i]);
              embeddings.push(emb);
            }
            
            await setupCollection(COLLECTION_NAME.PDF);
            
            await saveToQdrant(
              chunks.map((text, i) => ({ id: `chunk_${i}`, text })),
              embeddings,
              COLLECTION_NAME.PDF
            );

            res.json({
                success: true,
                count: articles.filter(Boolean).length
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
  });

export default ragRouter; 