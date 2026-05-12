import express from "express";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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
  displayName: { type: String },
  password: { type: String },
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

// Name generator for group titles
const generateGroupName = () => {
  const adjectives = ['Advanced', 'Basic', 'Essential', 'Professional', 'Academic', 'Business', 'Technical', 'Scientific', 'Literary', 'Conversational'];
  const topics = ['Vocabulary', 'English', 'Language', 'Terms', 'Expressions', 'Phrases', 'Words', 'Concepts', 'Definitions', 'Lexicon'];
  const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  const number = Math.floor(Math.random() * 999) + 1;
  return `${randomAdj} ${randomTopic} ${number}`;
};

const GroupWordsSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  words: [{
    term: { type: String, required: true },
    definition: { type: String, required: true }
  }],
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const GroupWords = mongoose.model("GroupWords", GroupWordsSchema);

const StorySchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Story = mongoose.model("Story", StorySchema);

// Authentication middleware
const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    (req as any).user = decoded;
    next();
  });
};

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
    origin: ["https://aerotest-1.onrender.com", "http://localhost:3000"],
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
app.post("/api/auth/register", asyncHandler(async (req, res) => {
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
  const defaultGroup = await GroupWords.create({
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


app.post("/api/auth/login", asyncHandler(async (req, res) => {
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
    user: {
      _id: user._id,
      email: user.email,
      displayName: user.displayName
    }
  });
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

  // Group Words
  app.get("/api/words/:userId", authenticateToken, asyncHandler(async (req, res) => {
    if (!req.params.userId) return res.status(400).json({ error: "User ID required" });
    const groups = await GroupWords.find({ userId: req.params.userId }).sort({ createdAt: -1 }).limit(1000);
    res.json(groups);
  }));

  // Get or create default group
  app.get("/api/words/:userId/default", authenticateToken, asyncHandler(async (req, res) => {
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

  app.post("/api/words", authenticateToken, asyncHandler(async (req, res) => {
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
  app.post("/api/words/:userId/default", authenticateToken, asyncHandler(async (req, res) => {
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

 app.patch("/api/words/:id", authenticateToken, asyncHandler(async (req, res) => {
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

  app.delete("/api/words/:id", authenticateToken, asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid group ID" });
    }
    await GroupWords.findByIdAndDelete(req.params.id);
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
