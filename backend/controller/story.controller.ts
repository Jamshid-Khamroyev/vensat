import { Router } from "express";
import express from "express"
import { Story } from "../models/story.model";
import mongoose from "mongoose";
const router = Router()

export const asyncHandler = (fn: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<any>) => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };


  router.get("/:userId", asyncHandler(async (req, res) => {
    if (!req.params.userId) return res.status(400).json({ error: "User ID required" });
    const stories = await Story.find({ userId: req.params.userId }).sort({ createdAt: -1 }).limit(200);
    res.json(stories);
  }));



  router.post("/", asyncHandler(async (req, res) => {
    const { userId, title, content, category } = req.body;
    if (!title || !content || !category) {
      return res.status(400).json({ error: "Missing required fields: title, content, category" });
    }
    const newStory = new Story({ userId, title, content, category });
    await newStory.save();
    res.status(201).json(newStory);
  }));



  router.delete("/:id", asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid story ID" });
    }
    await Story.findByIdAndDelete(req.params.id);
    res.status(204).send();
  }));

export default router