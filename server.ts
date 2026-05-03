import express from "express";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const MONGODB_URI = process.env.MONGODB_URI

// MongoDB schemas
const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  displayName: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", UserSchema);

const TestSchema = new mongoose.Schema({
  title: String,
  creatorId: String,
  timeLimit: { type: Number, default: 30 }, // in minutes
  questions: [{
    text: String,
    options: [String],
    question: String,
    correctAnswerIndex: Number,
    difficulty: String,
    category: String
  }],
  createdAt: { type: Date, default: Date.now }
});

const SessionSchema = new mongoose.Schema({
  testId: String,
  userId: String,
  title: String,
  total: Number,
  answers: Object,
  score: Number,
  startTime: Date,
  endTime: Date,
  status: { type: String, enum: ['in-progress', 'completed'] }
});

const Test = mongoose.model("Test", TestSchema);
const Session = mongoose.model("Session", SessionSchema);

const WordSchema = new mongoose.Schema({
  userId: String,
  term: String,
  definition: String,
  category: String,
  createdAt: { type: Date, default: Date.now }
});

const Word = mongoose.model("Word", WordSchema);

async function startServer() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  app.use(cors({
    origin: ["https://aerotest.onrender.com", "http://localhost:3000"],
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true
  }));
  app.use(express.json());

  // Story Schema & Model
  const StorySchema = new mongoose.Schema({
    userId: String,
    title: String,
    content: String,
    category: String,
    createdAt: { type: Date, default: Date.now }
  });
  const Story = mongoose.model("Story", StorySchema);

  // API Routes
  app.post("/api/auth/login", async (req, res) => {
    const { email, displayName } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });
    
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, displayName: displayName || email.split('@')[0] });
      await user.save();
    }
    res.json(user);
  });

  app.get("/api/tests", async (req, res) => {
    const tests = await Test.find().sort({ createdAt: -1 });
    res.json(tests);
  });

  app.post("/api/tests", async (req, res) => {
    const newTest = new Test(req.body);
    await newTest.save();
    res.status(201).json(newTest);
  });

  app.patch("/api/tests/:id", async (req, res) => {
    const updatedTest = await Test.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedTest);
  });

  app.delete("/api/tests/:id", async (req, res) => {
    await Test.findByIdAndDelete(req.params.id);
    res.status(204).send();
  });

  // Sessions
  app.get("/api/sessions/:userId", async (req, res) => {
    const sessions = await Session.find({ userId: req.params.userId }).sort({ startTime: -1 });
    res.json(sessions);
  });

  app.post("/api/sessions", async (req, res) => {
    const newSession = new Session(req.body);
    await newSession.save();
    res.status(201).json(newSession);
  });

  app.patch("/api/sessions/:id", async (req, res) => {
    const updatedSession = await Session.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedSession);
  });

  app.delete("/api/sessions/:id", async (req, res) => {
    await Session.findByIdAndDelete(req.params.id);
    res.status(204).send();
  });

  // Words
  app.get("/api/words/:userId", async (req, res) => {
    const words = await Word.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(words);
  });

  app.post("/api/words", async (req, res) => {
    const newWord = new Word(req.body);
    await newWord.save();
    res.status(201).json(newWord);
  });

  app.delete("/api/words/:id", async (req, res) => {
    await Word.findByIdAndDelete(req.params.id);
    res.status(204).send();
  });

  // Stories
  app.get("/api/stories/:userId", async (req, res) => {
    const stories = await Story.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(stories);
  });

  app.post("/api/stories", async (req, res) => {
    const newStory = new Story(req.body);
    await newStory.save();
    res.status(201).json(newStory);
  });

  app.delete("/api/stories/:id", async (req, res) => {
    await Story.findByIdAndDelete(req.params.id);
    res.status(204).send();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
