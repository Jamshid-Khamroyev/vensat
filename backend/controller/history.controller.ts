import express from "express"

import { Router } from "express"
import { History } from "../models/history.model";
import { Question } from "../models/question.model"

const router = Router()

export const asyncHandler = (fn: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<any>) => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
};

router.get("/:userId", asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 10, category } = req.query;
    
    const query: any = { userId };
    if (category && category !== 'all') query.category = category;
    
    const [history, total] = await Promise.all([
      History.find(query)
      .sort({ completedAt: -1 })
      .skip(((page as number) - 1) * (limit as number))
      .limit(parseInt(limit as string))
      .lean(),

      History.countDocuments(query)
    ]);
    
    res.json({ history, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) });
  }));

  router.get("/detail/:historyId", asyncHandler(async (req, res) => {
    const history = await History.findById(req.params.historyId)
      .populate('testId', 'title category')
      .lean();
    
    if (!history) return res.status(404).json({ error: "History not found" });
    
    const questions = await Question.find({ _id: { $in: history.results.map(r => r.questionId) } })
      .select('text options category difficulty')
      .lean();
    
    const questionMap = new Map(questions.map(q => [q._id.toString(), q]));
    
    const results = history.results.map(r => ({
      ...r,
      question: questionMap.get(r.questionId.toString())
    }));
    
    const correctCount = results.filter(r => r.isCorrect).length;
    
    res.json({
      ...history,
      results,
      stats: {
        correctCount,
        incorrectCount: history.total - correctCount,
        percentage: parseFloat(((correctCount / history.total) * 100).toFixed(1))
      }
    });
  }));

export default router