import { Router } from "express"
import { History } from "../models/history.model";
import mongoose from "mongoose";
import { Test } from "../models/test.model";
import { Question } from "../models/question.model";
import { authenticateToken } from "../midlewere/auth.midlewere";
import express from "express"
import { User } from "../models/user.model";

const router = Router()

export const asyncHandler = (fn: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<any>) => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
};

  router.get("", asyncHandler(async (req, res) => {
    const { userId, category, limit = 100, page = 1 } = req.query;
    const match: any = {};
    if (userId) match.creatorId = userId;
    if (category) match.category = category;
    
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [tests, total] = await Promise.all([
      Test.aggregate([
        { $match: match },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: parseInt(limit as string) },
        { $set: { question: { $size: "$questions" } } },
        { $unset: "questions" }
      ]),
      Test.countDocuments(match)
    ]);
    
    res.json({ tests, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  }));
  
  router.get("/:id", asyncHandler(async (req, res) => {
    const test = await Test.findById(req.params.id).lean();
    if (!test) return res.status(404).json({ error: "Test not found" });
    
    const questions = await Question.find({ _id: { $in: test.questions } }).lean();
    const sanitizedQuestions = questions.map(({ correctAnswerIndex, ...q }) => q);
    
    res.json({ ...test, questions: sanitizedQuestions });
  }));
  
  router.post("", asyncHandler(async (req, res) => {
    const { title, creatorId, questions, category, timeLimit } = req.body;
    
    if (!title || !creatorId || !Array.isArray(questions) || questions.length === 0 || !category) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const createdQuestions = await Question.insertMany(questions);
    const questionIds = createdQuestions.map(q => q._id);
    
    const newTest = new Test({ ...req.body, questions: questionIds });
    await newTest.save();
    
    res.status(201).json({
      _id: newTest._id,
      title: newTest.title,
      category: newTest.category,
      timeLimit: newTest.timeLimit,
      question: newTest.questions.length
    });
  }));
  
  router.patch("/:id", asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid test ID" });
    }
    const updatedTest = await Test.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedTest) return res.status(404).json({ error: "Test not found" });
    res.json(updatedTest);
  }));
  
  router.delete("/:id", asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid test ID" });
    }
    const test = await Test.findById(req.params.id);
    if (test) {
      await Question.deleteMany({ _id: { $in: test.questions } });
      await Test.findByIdAndDelete(req.params.id);
    }
    res.status(204).send();
  }));
  
  router.post("/:id/check", authenticateToken, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { answers } = req.body;
    const userId = (req as any)?.user?.userId;
    
    const test = await Test.findById(id).lean();
    if (!test) return res.status(404).json({ error: "Test not found" });
    
    const questions = await Question.find({ _id: { $in: test.questions } }).lean();

    const UserSkillChanger = {
      "information-ideas": 0,
      "craft-structure": 0,
      "expression-ideas": 0,
      "standard-conventions": 0
    }
    
    const results = questions.map(q => {
      const answer = answers.find(a => a.questionId === q._id.toString());
      UserSkillChanger[q.category] += answer?.selectedIndex === q.correctAnswerIndex ? ( q.difficulty === "hard" ? 1.01 :1) : 0;
      return {
        questionId: q._id,
        isCorrect: answer?.selectedIndex === q.correctAnswerIndex,
        correctAnswerIndex: q.correctAnswerIndex,
        userSelectedIndex: answer?.selectedIndex ?? null
      };
    });
    
    const score = results.filter(r => r.isCorrect).length;
    const total = questions.length;
    
    await History.create({
      userId,
      testId: test._id,
      title: test.title,
      category: test.category,
      results,
      score,
      total,
      completedAt: new Date()
    });

    const user = await User.findById(userId);
if (!user) return;

const categoryMap = {
  "information-ideas": { skill: "iai_skill" },
  "craft-structure": { skill: "cas_skill" },
  "expression-ideas": { skill: "eoi_skill" },
  "standard-conventions": { skill: "sec_skill" }
};

const category = categoryMap[test.category];
if (!category) return;

const skillData = user[category.skill] || { score: 0, questionTaken: 0 };

user.accuracy.totalTestsTaken += 1;
const currentAccuracy = (score / total) * 100;
user.accuracy.score = Math.round((currentAccuracy + (user.accuracy.score || 0) * (user.accuracy.totalTestsTaken - 1)) / user.accuracy.totalTestsTaken);

const categoryScore = (UserSkillChanger[test.category] / test.questions.length) * 100;
user[category.skill] = {
  score: Math.round((categoryScore + skillData.score * skillData.questionTaken) / (skillData.questionTaken + 1)),
  questionTaken: skillData.questionTaken + test.questions.length
};

await user.save();
      
      res.json({ score, total });
  }));

export default router