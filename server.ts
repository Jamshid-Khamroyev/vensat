import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import express from "express";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";

// Routes
import TestRouter from "./backend/controller/test.controller"
import AuthRouter from "./backend/controller/auth.controller";
import HistoryRouter from "./backend/controller/history.controller"
import storyRouter from "./backend/controller/story.controller"
import WordRouter from "./backend/controller/words.controller"
import practiceRouter from './backend/controller/practice-word'
import ragRouter from './backend/controller/rag.controller'

// Middleweres
import {
  globalLimiter,
  authLimiter,
  testLimiter,
  historyLimiter,
  wordLimiter,
  storyLimiter,
  practiceLimiter,
  ragLimiter,
} from "./backend/midlewere/rate-limit";



const app = express();
app.use(cors({
    origin: ["https://aerotest-1.onrender.com", "http://localhost:3000"],
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true
}));
app.use(express.json({ limit: "10mb" }));

const PORT = Number(process.env.PORT) || 3000;
const MONGODB_URI = process.env.VITE_MONGODB_URI;
export const JWT_SECRET = process.env.VITE_JWT_SECRET || 'your-secret-key-change-in-production';

if (!MONGODB_URI) {
  console.error("FATAL: MONGODB_URI is not defined in environment variables");
  process.exit(1);
}

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "ok", mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});


// Async wrapper for routes
export const asyncHandler = (fn: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<any>) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
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

  // Request logging in dev
  if (process.env.NODE_ENV !== "production") {
    app.use((req, _res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
  }

  app.use(globalLimiter);

    // Auth
    app.use("/api/auth", authLimiter, AuthRouter);

    // Tests
    app.use("/api/tests", testLimiter, TestRouter);

    // History
    app.use("/api/history", historyLimiter, HistoryRouter);

    // Group Words
    app.use("/api/words", wordLimiter, WordRouter);

    // Stories
    app.use("/api/stories", storyLimiter, storyRouter);

    // Word Practice
    app.use("/api/word/practice", practiceLimiter, practiceRouter);

    // RAG
    app.use("/api/rag", ragLimiter, ragRouter);
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

  const server = app.listen(PORT, () => {
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