import dotenv from "dotenv";
// dotenv.config({ path: ".env" });

import express from "express";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { env } from './backend/utils/env';

// Routes
import TestRouter from "./backend/controller/test.controller";
import AuthRouter from "./backend/controller/auth.controller";
import HistoryRouter from "./backend/controller/history.controller";
import storyRouter from "./backend/controller/story.controller";
import WordRouter from "./backend/controller/words.controller";
import practiceRouter from './backend/controller/practice-word';
import ragRouter from './backend/controller/rag.controller';
import aiRouter from './backend/controller/ai.controller';

// Middlewares
import {
  globalLimiter,
  authLimiter,
  testLimiter,
  historyLimiter,
  wordLimiter,
  storyLimiter,
  practiceLimiter,
  ragLimiter,
  aiLimiter,
} from "./backend/midlewere/rate-limit";

// ============================================
// 1. APP CONFIGURATION
// ============================================
const app = express();

// CORS configuration
app.use(cors({
  origin: ["https://aerotest-1.onrender.com", "http://localhost:3000"],
  methods: ["GET", "POST", "PATCH", "DELETE"],
  credentials: true
}));

// Body parser
app.use(express.json({ limit: "3mb" }));

// ============================================
// 2. ENVIRONMENT VARIABLES
// ============================================
const PORT = env.PORT || 10000; // Render default port
const MONGODB_URI = env.MONGODB_URI;
export const JWT_SECRET = env.JWT_SECRET;

// Validate required environment variables
if (!MONGODB_URI) {
  console.error("❌ FATAL: MONGODB_URI is not defined in environment variables");
  process.exit(1);
}

if (!JWT_SECRET) {
  console.error("❌ FATAL: JWT_SECRET is not defined in environment variables");
  process.exit(1);
}

// ============================================
// 3. HEALTH CHECK ENDPOINT
// ============================================
app.get("/health", (_req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.json({
    status: "ok",
    mongodb: mongoStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ============================================
// 4. ASYNC HANDLER UTILITY
// ============================================
export const asyncHandler = (
  fn: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<any>
) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ============================================
// 5. REQUEST LOGGING (Development only)
// ============================================
if (process.env.NODE_ENV !== "production") {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ============================================
// 6. RATE LIMITING
// ============================================
app.use(globalLimiter);

// ============================================
// 7. API ROUTES
// ============================================
// Auth routes
app.use("/api/auth", authLimiter, AuthRouter);

// Test routes
app.use("/api/tests", testLimiter, TestRouter);

// History routes
app.use("/api/history", historyLimiter, HistoryRouter);

// Words routes
app.use("/api/words", wordLimiter, WordRouter);

// Stories routes
app.use("/api/stories", storyLimiter, storyRouter);

// Practice routes
app.use("/api/word/practice", practiceLimiter, practiceRouter);

// RAG routes
app.use("/api/rag", ragLimiter, ragRouter);

// AI routes (story, words, translate)
app.use("/api/ai", aiLimiter, aiRouter);

// ============================================
// 8. FEEDBACK ENDPOINT (Telegram Bot)
// ============================================
app.post('/api/feedback', async (req, res) => {
  try {
    const formData = req.body;
    const botToken = env.BOT_TOKEN;
    const chatId = env.BOT_CHAT_ID;

    if (!botToken || !chatId) {
      console.error("❌ Telegram bot configuration missing");
      return res.status(500).json({
        success: false,
        error: 'Bot not configured'
      });
    }

    const message = `
📝 YANGI FEEDBACK
─────────────────
⭐ Reyting: ${formData.rating || '❌ Yo\'q'}
💬 Tajriba: ${formData.experience || '❌ Yo\'q'}
⚠️ Muammo: ${formData.problem || '❌ Yo\'q'}
❤️ Yoqadigan jihatlar: ${formData.features || '❌ Yo\'q'}
💡 Takliflar: ${formData.improvement || '❌ Yo\'q'}
📊 Foydalanish: ${formData.frequency || '❌ Yo\'q'}
📧 Email: ${formData.email || '❌ Kiritilmagan'}
📢 Tavsiya: ${formData.recommendation || '❌ Yo\'q'}
─────────────────
📅 ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}`;

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message
      })
    });

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Feedback error:", error);
    res.status(500).json({
      success: false,
      error: String(error)
    });
  }
});

// ============================================
// 9. GLOBAL ERROR HANDLER
// ============================================
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("❌ Unhandled error:", err);
  
  const statusCode = err.status || 500;
  const message = process.env.NODE_ENV === "production"
    ? "Internal server error"
    : err.message;

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack })
  });
});

// ============================================
// 10. STATIC FILES & VITE (Production/Development)
// ============================================
if (process.env.NODE_ENV !== "production") {
  // Development: Vite middleware
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  // Production: Serve static files
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  
  // SPA fallback - all routes go to index.html
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ============================================
// 11. START SERVER
// ============================================
async function startServer() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4 // Use IPv4
    });
    console.log("✅ Connected to MongoDB");

    // MongoDB connection events
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB reconnected");
    });

    // Start HTTP server - CRITICAL FIX: Bind to 0.0.0.0
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🟢 Health check: http://localhost:${PORT}/health`);
    });

    // ============================================
    // 12. GRACEFUL SHUTDOWN
    // ============================================
    const shutdown = async (signal: string) => {
      console.log(`\n⚠️ ${signal} received. Shutting down gracefully...`);
      
      // Close HTTP server
      server.close(() => {
        console.log("✅ HTTP server closed");
      });

      // Close MongoDB connection
      try {
        await mongoose.connection.close(false);
        console.log("✅ MongoDB connection closed");
      } catch (error) {
        console.error("❌ Error closing MongoDB connection:", error);
      }

      process.exit(0);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      console.error("❌ Uncaught Exception:", error);
      shutdown("UNCAUGHT_EXCEPTION");
    });

    process.on("unhandledRejection", (reason, promise) => {
      console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
    });

  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

// ============================================
// 13. START APPLICATION
// ============================================
startServer();