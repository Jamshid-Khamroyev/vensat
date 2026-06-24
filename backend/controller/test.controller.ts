import { Router } from "express"
import { History } from "../models/history.model";
import mongoose from "mongoose";
import { Test } from "../models/test.model";
import { Question } from "../models/question.model";
import { authenticateToken } from "../midlewere/auth.midlewere";
import express from "express"
import { User } from "../models/user.model";
import { GenerateExplanation } from "@/src/services/geminiService";

const router = Router()

    export const asyncHandler = (fn: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<any>) => {
        return (req: express.Request, res: express.Response, next: express.NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
        };
    };

    router.get("", asyncHandler(async (req, res) => {
        const { userId, category, isGlobal, difficulty, limit = 100, page = 1 } = req.query;
        const match: any = {};
        
        if (category) match.category = category;
        if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty as string)) match.difficulty = difficulty;
        
        if (isGlobal === 'true') match.isGlobal = true;
        else if (userId && isGlobal === 'false') { match.creatorId = userId; match.isGlobal = false; }
        else if (userId) match.creatorId = userId;
        else match.isGlobal = true;
        
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        const [tests, total] = await Promise.all([
            Test.aggregate([
                { $match: match },
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: parseInt(limit as string) },
                { $addFields: { questionCount: { $size: "$questions" } } },
                { $unset: "questions" }
            ]),
            Test.countDocuments(match)
        ]);
        
        res.json({ tests, total, page: parseInt(page as string), limit: parseInt(limit as string) });
    }));
  
    router.get("/:id", asyncHandler(async (req, res) => {
        const test = await Test.findById(req.params.id).lean();
        if (!test) return res.status(404).json({ error: "Test not found" });
        
        const questions = await Question.find({ _id: { $in: test.questions } }).select('-correctAnswerIndex -explanation').lean();
        
        res.json({ ...test, questions });
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
        try {
            const { id } = req.params;
            const { answers } = req.body;
            const userId = (req as any)?.user?.userId;

            const test = await Test.findById(id).lean();
            if (!test) return res.status(404).json({ error: "Test not found" });

            const questions = await Question.find({ _id: { $in: test.questions } }).lean();

            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ error: "User not found" });

            // Category mapping for skill fields
            const categoryMap: Record<string, { skill: string }> = {
                "information-ideas": { skill: "iai_skill" },
                "craft-structure": { skill: "cas_skill" },
                "expression-ideas": { skill: "eoi_skill" },
                "standard-conventions": { skill: "sec_skill" }
            };

            // Initialize skill trackers for all categories
            const categoryScores: Record<string, { correct: number; total: number }> = {
                "information-ideas": { correct: 0, total: 0 },
                "craft-structure": { correct: 0, total: 0 },
                "expression-ideas": { correct: 0, total: 0 },
                "standard-conventions": { correct: 0, total: 0 }
            };

            // Process each question
            if(!questions[0].explanation){
                const explanations = await GenerateExplanation(questions);
                const bulkOps = explanations.map((item) => ({
                    updateOne: {
                        filter: {
                            question: item.question,
                            text: item.text
                        },
                        update: {
                            $set: {
                                explanation: item.explanation
                            }
                        }
                    }
                }));
    
                await Question.bulkWrite(bulkOps);
            }

            const results = (questions.map((q: any) => {
                
                const answer = answers.find((a: any) => a.questionId === q._id.toString());
                const isCorrect = answer?.selectedIndex === q.correctAnswerIndex;
                
                // Track category scores
                if (categoryScores[q.category]) {
                    categoryScores[q.category].total += 1;
                    if (isCorrect) {
                        // Weight hard questions slightly more
                        const weight = q.difficulty === "hard" ? 1.05 : 1;
                        categoryScores[q.category].correct += weight;
                    }
                }

                return {
                    questionId: q._id,
                    isCorrect,
                    correctAnswerIndex: q.correctAnswerIndex,
                    userSelectedIndex: answer?.selectedIndex ?? null,
                    category: q.category
                };
            }));

            // Calculate overall score
            const score = results.filter(r => r.isCorrect).length;
            const total = questions.length;

            // Save test history
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

            // Update overall accuracy
            user.accuracy.totalTestsTaken += 1;
            const currentAccuracy = (score / total) * 100;
            user.accuracy.score = Math.round(
                (currentAccuracy + (user.accuracy.score || 0) * (user.accuracy.totalTestsTaken - 1)) / 
                user.accuracy.totalTestsTaken
            );

            // Update each category skill
            let totalSkillImprovement = 0;
            let categoriesUpdated = 0;

            for (const [category, data] of Object.entries(categoryScores)) {
                if (data.total === 0) continue;

                const categoryInfo = categoryMap[category];
                if (!categoryInfo) continue;

                const categoryScore = Math.min(100, (data.correct / data.total) * 100);
                
                const skillData = user[categoryInfo.skill] || { score: 0, questionTaken: 0 };
                
                const totalQuestions = skillData.questionTaken + data.total;
                const updatedScore = Math.round(
                    (categoryScore + skillData.score * skillData.questionTaken) / totalQuestions
                );

                user[categoryInfo.skill] = {
                    score: Math.min(100, updatedScore),
                    questionTaken: totalQuestions
                };

                totalSkillImprovement += categoryScore;
                categoriesUpdated++;
            }

            if (categoriesUpdated > 0) {
                const averageSkillScore = totalSkillImprovement / categoriesUpdated;
                user.accuracy.score = Math.round(averageSkillScore);
            }

            await user.save();

            res.json({
                score,
                total,
                percentage: Math.round((score / total) * 100),
                categoryBreakdown: Object.entries(categoryScores).reduce((acc, [category, data]) => {
                    if (data.total > 0) {
                        acc[category] = {
                            correct: Math.round(data.correct),
                            total: data.total,
                            percentage: Math.round((data.correct / data.total) * 100)
                        };
                    }
                    return acc;
                }, {} as Record<string, { correct: number; total: number; percentage: number }>),
                skillUpdates: Object.keys(categoryScores).reduce((acc, category) => {
                    const categoryInfo = categoryMap[category];
                    if (categoryInfo && user[categoryInfo.skill]) {
                        acc[category] = user[categoryInfo.skill];
                    }
                    return acc;
                }, {} as Record<string, any>),
                overallAccuracy: user.accuracy
            });

        } catch (error) {
            console.error("Error checking test:", error);
            res.status(500).json({ error: "Failed to check test" });
        }
    }));

export default router