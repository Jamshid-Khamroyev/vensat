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
import aiRouter from './backend/controller/ai.controller'
import { env } from './backend/utils/env';

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
  aiLimiter,
} from "./backend/midlewere/rate-limit";



const app = express();
app.use(cors({
    origin: ["https://aerotest-1.onrender.com", "http://localhost:3000"],
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true
}));
app.use(express.json({ limit: "10mb" }));

const PORT = env.PORT;
const MONGODB_URI = env.MONGODB_URI;
export const JWT_SECRET = env.JWT_SECRET;

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

    app.post('/api/feedback', async (req, res) => {
    try {
      const formData = req.body;
      const botToken = env.BOT_TOKEN;
      const chatId = env.BOT_CHAT_ID;

      if (!botToken || !chatId) {
        return res.status(500).json({ success: false, error: 'Bot not configured' });
      }

    const message = `📝 YANGI FEEDBACK
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

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message })
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
});
    
  const sentRequests = new Set();

   app.post('/api/analytics', async (req, res) => {
        const botToken = env.BOT_TOKEN;
        const chatId = env.BOT_CHAT_ID;
      try {
        const d = req.body;

        const timeStr = Object.entries(d.sectionTime || {})
          .sort((a, b) => (b[1] as number) - (a[1] as number))
          .map(([name, sec]) => {
            const mins = Math.floor((sec as number) / 60);
            const secs = Math.floor((sec as number) % 60);
            return `${name}: ${mins > 0 ? mins + 'm ' : ''}${secs}s`;
          })
          .join('\n  ');

        if(d.times && d.message_id){
          const msg = `
          📊 ANALYTICS REPORT
          ─────────────────
          👤 Visitor: ${d.visitorId}
          💻 Device: ${d.device} (${d.browser})
          🖥️ OS: ${d.os}
          📱 Screen: ${d.screen}
          🌍 Language: ${d.language}
          🕐 Timezone: ${d.timezone}
          🔗 Referrer: ${d.referrer}
             Times: ${d.times}
          ⏱️ Duration: ${Math.floor(d.duration / 60)}m ${d.duration % 60}s
          📜 Max Scroll: ${d.maxScroll}%
          ⏳ Section Time:
            ${timeStr || '❌ Ma\'lumot yo\'q'}
          💬 Feedback: ${d.feedback || '❌ Yo\'q'}
          ─────────────────
          📅 ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}`;

          const data = await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              chat_id: chatId,
              message_id: d.message_id,
              text: msg,
            }),
          });
          const responsData = await data.json()
          return res.json({
            success: true,
            data: responsData.result?.message_id,
          });
        }

        const requestId = `${d.visitorId}-${d.sessionId}-${new Date().getDay()}`;
        
        if (sentRequests.has(requestId)) {
          return res.json({ success: true, duplicate: true });
        }
        sentRequests.add(requestId);
        

        if (!botToken || !chatId) {
          return res.status(500).json({ success: false });
        }
        
        

        const msg = `
    📊 ANALYTICS REPORT
    ─────────────────
    👤 Visitor: ${d.visitorId}
    💻 Device: ${d.device} (${d.browser})
    🖥️ OS: ${d.os}
    📱 Screen: ${d.screen}
    🌍 Language: ${d.language}
    🕐 Timezone: ${d.timezone}
    🔗 Referrer: ${d.referrer}
    ⏱️ Duration: ${Math.floor(d.duration / 60)}m ${d.duration % 60}s
    📜 Max Scroll: ${d.maxScroll}%
    ⏳ Section Time:
      ${timeStr || '❌ Ma\'lumot yo\'q'}
    💬 Feedback: ${d.feedback || '❌ Yo\'q'}
    ─────────────────
    📅 ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}`;

        const data = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: msg })
        });

        const responseData = await data.json();
        res.json({ success: true, data: responseData.result?.message_id });
      } catch (error) {
        res.status(500).json({ success: false });
      }
    });


    // AI (story, words, translate)
    app.use("/api/ai", aiLimiter, aiRouter);
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