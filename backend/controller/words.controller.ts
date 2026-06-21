import { Router } from "express";
import { GroupWords } from "../models/group.words.model";
import { User } from "../models/user.model";
import { authenticateToken } from "../midlewere/auth.midlewere";
import mongoose from "mongoose";
import { generateGroupName } from "../utils";
import express from "express"

const router = Router()

export const asyncHandler = (fn: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<any>) => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
}

  router.get("/:userId", authenticateToken, asyncHandler(async (req, res) => {
    if (!req.params.userId) return res.status(400).json({ error: "User ID required" });
    const groups = await GroupWords.aggregate([
      { $match: { userId: req.params.userId } },
      { $sort: { createdAt: -1 } },
      { $limit: 50 },
      {
        $project: {
          title: 1,
          createdAt: 1,
          isDefault: 1,
          userId: 1,
          wordsCount: { $size: "$words" }
        }
      }
    ]);
    res.json(groups);
  }));

  router.get("/:userId/:groupId", authenticateToken, asyncHandler(async (req, res) => {
    if (!req.params.userId) return res.status(400).json({ error: "User ID required" });
    if (!req.params.groupId) return res.status(400).json({ error: "Group ID required" });
    const group = await GroupWords.findOne({ userId: req.params.userId, _id: req.params.groupId });
    res.json(group);
  }));

  // Get or create default group
  router.get("/:userId/default", authenticateToken, asyncHandler(async (req, res) => {
    if (!req.params.userId) return res.status(400).json({ error: "User ID required" });
    
    let defaultGroup = await GroupWords.findOne({ userId: req.params.userId, isDefault: true });
    
    if (!defaultGroup) {
      // Create default group if it doesn't exist
      const user = await User.findById(req.params.userId);
      defaultGroup = await GroupWords.create({
        userId: req.params.userId,
        title: `${user?.displayName || 'User'}'s Default Group`,
        words: [],
        isDefault: true
      });
    }
    
    res.json(defaultGroup);
  }));

  router.post("", authenticateToken, asyncHandler(async (req, res) => {
    const { userId, words, title } = req.body;
    
    // Validate each word has term and definition
    for (const word of words) {
      if (!word.term || !word.definition) {
        return res.status(400).json({ error: "Each word must have term and definition" });
      }
    }
    
    const groupTitle = title || generateGroupName();
    const newGroup = new GroupWords({
      userId,
      title: groupTitle,
      words
    });

    await newGroup.save();
    res.status(201).json(newGroup);
  }));

  // Add words to default group
  router.post("/:userId/default", authenticateToken, asyncHandler(async (req, res) => {
    if (!req.params.userId) return res.status(400).json({ error: "User ID required" });
    const { words } = req.body;
    
    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: "Words array required" });
    }
    
    // Validate each word has term and definition
    for (const word of words) {
      if (!word.term || !word.definition) {
        return res.status(400).json({ error: "Each word must have term and definition" });
      }
    }
    
    let defaultGroup = await GroupWords.findOne({ userId: req.params.userId, isDefault: true });
    
    if (!defaultGroup) {
      // Create default group if it doesn't exist
      const user = await User.findById(req.params.userId);
      defaultGroup = await GroupWords.create({
        userId: req.params.userId,
        title: `${user?.displayName || 'User'}'s Default Group`,
        words: [],
        isDefault: true
      });
    }
    
    // Add words to default group
    defaultGroup.words.push(...words);
    await defaultGroup.save();
    
    res.json(defaultGroup);
  }))

 router.patch("/:id", authenticateToken, asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid group ID" });
  }

  const { words, title } = req.body;
  const update: any = {};

  if (title) {
    update.$set = { title };
  }

  if (words && Array.isArray(words) && words.length > 0) {
    for (const word of words) {
      if (!word.term || !word.definition) {
        return res.status(400).json({ error: "Each word must have term and definition" });
      }
    }
    update.$addToSet = { words: { $each: words } };
  }

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  const updatedGroup = await GroupWords.findByIdAndUpdate(
    req.params.id,
    update,
    { new: true, runValidators: true }
  );

  if (!updatedGroup) {
    return res.status(404).json({ error: "Group not found" });
  }

  res.json(updatedGroup);
}));

router.delete("/:id", authenticateToken, asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid group ID" });
    }
    await GroupWords.findByIdAndDelete(req.params.id);
    res.status(204).send();
}));

export default router