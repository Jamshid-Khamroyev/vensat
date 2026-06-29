import { Router, Request, Response } from 'express';
import axios from 'axios';
import { authenticateToken } from '../midlewere/auth.midlewere';
import {
  generateStory,
  generateSentencesForWords,
  generatePracticeQuestionsAI,
} from '../services/geminiService';
import { env } from '../utils/env';

const router = Router();

const asyncHandler = (fn: (req: Request, res: Response) => Promise<any>) =>
  (req: Request, res: Response) => Promise.resolve(fn(req, res)).catch((err) => {
    console.error('AI controller error:', err);
    res.status(500).json({ success: false, message: err.message || 'AI request failed' });
  });

router.post('/story', authenticateToken, asyncHandler(async (req, res) => {
  const { genre, topic, length, words, description } = req.body;

  if (!genre || !topic) {
    return res.status(400).json({ success: false, message: 'genre and topic are required' });
  }

  const validLengths = ['medium', 'long', 'extended'];
  const storyLength = validLengths.includes(length) ? length : 'medium';

  const result = await generateStory(genre, topic, storyLength, words, description);

  if (!result?.title || !result?.content) {
    return res.status(500).json({ success: false, message: 'Failed to generate story' });
  }

  res.json({ success: true, data: result });
}));

router.post('/words/sentences', authenticateToken, asyncHandler(async (req, res) => {
  const { words } = req.body;

  if (!Array.isArray(words) || words.length === 0) {
    return res.status(400).json({ success: false, message: 'words array is required' });
  }

  const sentences = await generateSentencesForWords(words);
  res.json({ success: true, data: sentences });
}));

router.post('/words/practice', authenticateToken, asyncHandler(async (req, res) => {
  const { words } = req.body;

  if (!Array.isArray(words) || words.length === 0) {
    return res.status(400).json({ success: false, message: 'words array is required' });
  }

  const questions = await generatePracticeQuestionsAI({ words });
  res.json({ success: true, data: questions });
}));

router.post('/translate', authenticateToken, asyncHandler(async (req, res) => {
  const { text, source = 'en', target = 'uz' } = req.body;

  if (!text?.trim()) {
    return res.status(400).json({ success: false, message: 'text is required' });
  }

  if (!env.RAPIDAPI_KEY) {
    return res.status(503).json({ success: false, message: 'Translation service is not configured' });
  }

  const response = await axios.post(
    'https://deep-translate1.p.rapidapi.com/language/translate/v2',
    { q: text, source, target },
    {
      headers: {
        'x-rapidapi-key': env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'deep-translate1.p.rapidapi.com',
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );

  res.json({ success: true, data: response.data });
}));

export default router;
