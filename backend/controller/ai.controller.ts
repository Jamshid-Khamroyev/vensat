import { Router, Request, Response } from 'express';
import axios from 'axios';
import { authenticateToken } from '../midlewere/auth.midlewere';
import {
  generateStory,
  generateSentencesForWords,
  generatePracticeQuestionsAI,
  translateWords,
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
  console.log(words);
  
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
  try {
    const { words } = req.body;
    
    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ success: false, message: 'Words array is required' });
    }

    if (words.length > 100) {
      return res.status(400).json({ success: false, message: 'Maximum 100 words allowed' });
    }

    const translations = await translateWords(words);
    res.json({ success: true, data: translations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

export default router;