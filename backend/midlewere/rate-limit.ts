import { rateLimit } from "express-rate-limit";

const config = (windowMs: number, limit: number, message: string) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message,
    },
  });

export const globalLimiter = config(
  3 * 60 * 1000,
  500,
  "Too many requests."
);

export const authLimiter = config(
  1 * 60 * 1000,
  30,
  "Too many authentication attempts."
);

export const testLimiter = config(
  1 * 60 * 1000,
  40,
  "Too many test requests."
);

export const historyLimiter = config(
  1 * 60 * 1000,
  60,
  "Too many history requests."
);

export const wordLimiter = config(
  1 * 60 * 1000,
  60,
  "Too many word requests."
);

export const storyLimiter = config(
  1 * 60 * 1000,
  20,
  "Too many story requests."
);

export const practiceLimiter = config(
  1 * 60 * 1000,
  40,
  "Too many practice requests."
);

export const ragLimiter = config(
  1 * 60 * 1000,
  10,
  "Too many AI requests."
);