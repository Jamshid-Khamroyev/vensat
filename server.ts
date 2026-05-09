import express from "express";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("FATAL: MONGODB_URI is not defined in environment variables");
  process.exit(1);
}

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "ok", mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

// MongoDB schemas
const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true, index: true },
  displayName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", UserSchema);

const TestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  creatorId: { type: String, required: true },
  timeLimit: { type: Number, default: 30 },
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
  testId: { type: String, required: true },
  userId: { type: String, required: true, index: true },
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
  userId: { type: String, required: true, index: true },
  term: { type: String, required: true },
  definition: { type: String, required: true },
  category: { type: String, default: 'Vocabulary' },
  createdAt: { type: Date, default: Date.now }
});

const Word = mongoose.model("Word", WordSchema);

const StorySchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Story = mongoose.model("Story", StorySchema);

// Async wrapper for routes
const asyncHandler = (fn: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<any>) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

async function startServer() {
  // Connect to MongoDB with retry logic
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  }

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected. Attempting to reconnect...");
  });

  app.use(cors({
    origin: ["https://aerotest.onrender.com", "http://localhost:3000"],
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true
  }));
  app.use(express.json({ limit: "10mb" }));

  // Request logging in dev
  if (process.env.NODE_ENV !== "production") {
    app.use((req, _res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
  }

  // API Routes
  app.post("/api/auth/login", asyncHandler(async (req, res) => {
    const { email, displayName } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email required and must be a string" });
    }
    if (!displayName || typeof displayName !== "string") {
      return res.status(400).json({ error: "Display name required" });
    }

    let user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      user = new User({ email: email.toLowerCase().trim(), displayName: displayName.trim() || email.split('@')[0] });
      await user.save();
    }
    res.json(user);
  }));

  // Tests
  app.get("/api/tests", asyncHandler(async (_req, res) => {
    const tests = await Test.find().sort({ createdAt: -1 }).limit(100);
    res.json(tests);
  }));

  app.post("/api/tests", asyncHandler(async (req, res) => {
    const { title, creatorId, questions } = req.body;
    if (!title || !creatorId || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: "Missing required fields: title, creatorId, questions" });
    }
    const newTest = new Test(req.body);
    await newTest.save();
    res.status(201).json(newTest);
  }));

  app.patch("/api/tests/:id", asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid test ID" });
    }
    const updatedTest = await Test.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedTest) return res.status(404).json({ error: "Test not found" });
    res.json(updatedTest);
  }));

  app.delete("/api/tests/:id", asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid test ID" });
    }
    await Test.findByIdAndDelete(req.params.id);
    res.status(204).send();
  }));

  // Sessions
  app.get("/api/sessions/:userId", asyncHandler(async (req, res) => {
    if (!req.params.userId) return res.status(400).json({ error: "User ID required" });
    const sessions = await Session.find({ userId: req.params.userId }).sort({ startTime: -1 }).limit(200);
    res.json(sessions);
  }));

  app.post("/api/sessions", asyncHandler(async (req, res) => {
    const { testId, userId, answers } = req.body;
    if (!testId || !userId) {
      return res.status(400).json({ error: "Missing testId or userId" });
    }
    const newSession = new Session(req.body);
    await newSession.save();
    res.status(201).json(newSession);
  }));

  app.patch("/api/sessions/:id", asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid session ID" });
    }
    const updatedSession = await Session.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedSession) return res.status(404).json({ error: "Session not found" });
    res.json(updatedSession);
  }));

  app.delete("/api/sessions/:id", asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid session ID" });
    }
    await Session.findByIdAndDelete(req.params.id);
    res.status(204).send();
  }));

  // Words
  app.get("/api/words/:userId", asyncHandler(async (req, res) => {
    if (!req.params.userId) return res.status(400).json({ error: "User ID required" });
    const words = await Word.find({ userId: req.params.userId }).sort({ createdAt: -1 }).limit(1000);
    res.json(words);
  }));

  app.post("/api/words", asyncHandler(async (req, res) => {
    const { userId, term, definition } = req.body;
    if (!userId || !term || !definition) {
      return res.status(400).json({ error: "Missing required fields: userId, term, definition" });
    }
    const newWord = new Word(req.body);
    await newWord.save();
    res.status(201).json(newWord);
  }));

  app.delete("/api/words/:id", asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid word ID" });
    }
    await Word.findByIdAndDelete(req.params.id);
    res.status(204).send();
  }));

  // Stories
  app.get("/api/stories/:userId", asyncHandler(async (req, res) => {
    if (!req.params.userId) return res.status(400).json({ error: "User ID required" });
    const stories = await Story.find({ userId: req.params.userId }).sort({ createdAt: -1 }).limit(200);
    res.json(stories);
  }));

  app.post("/api/stories", asyncHandler(async (req, res) => {
    const { userId, title, content, category } = req.body;
    if (!title || !content || !category) {
      return res.status(400).json({ error: "Missing required fields: title, content, category" });
    }
    const newStory = new Story({ userId, title, content, category });
    await newStory.save();
    res.status(201).json(newStory);
  }));

  app.delete("/api/stories/:id", asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid story ID" });
    }
    await Story.findByIdAndDelete(req.params.id);
    res.status(204).send();
  }));

  // Global error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(err.status || 500).json({
      error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
    });
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
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log("HTTP server closed");
    });
    await mongoose.connection.close(false);
    console.log("MongoDB connection closed");
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

startServer();
