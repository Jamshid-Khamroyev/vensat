import { JWT_SECRET } from "@/server";
import { Router } from "express"
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticateToken} from "../midlewere/auth.midlewere"
import { User } from "../models/user.model";
import { GroupWords } from "../models/group.words.model";

const asyncHandler = (fn: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<any>) => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
};
  

const router = Router();

router.post("/register", asyncHandler(async (req, res) => {
    const { email, displayName, password } = req.body;
  
    const normalizedEmail = email.toLowerCase().trim();
  
    const existingUser = await User.findOne({ email: normalizedEmail });
  
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }
  
    const hashedPassword = await bcrypt.hash(password, 10);
  
    const user = await User.create({
      email: normalizedEmail,
      displayName: displayName.trim(),
      password: hashedPassword
    });
  
    // Create default group for new user
    await GroupWords.create({
      userId: user._id.toString(),
      title: `${user.displayName}'s Default Group`,
      words: [],
      isDefault: true
    });
  
    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  
    res.status(201).json({
      message: "User created",
      token,
      user: {
        _id: user._id,
        email: user.email,
        displayName: user.displayName
      }
    });
}));
  
  
router.post("/login", asyncHandler(async (req, res) => {
    const { email, password } = req.body;
  
    const normalizedEmail = email.toLowerCase().trim();
  
    const user = await User.findOne({ email: normalizedEmail });
  
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }
  
    // const isMatch = await bcrypt.compare(password, user.password);
  
    // if (!isMatch) {
    //   return res.status(400).json({ error: "Invalid password" });
    // }
  
    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  
    res.json({
      message: "Login successful",
      token,
      user
    });
}));

router.get("/me", authenticateToken, asyncHandler(async (req: any, res) => {
    const user = await User.findById(req.user?.userId).select("-password");

    if(!user){
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
}));

export default router;