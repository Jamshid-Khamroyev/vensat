import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

function readEnv(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

function requireEnv(name: string, aliases: string[] = []): string {
  const value = readEnv(name) ?? aliases.map(readEnv).find(Boolean);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  NODE_ENV: readEnv('NODE_ENV') ?? 'development',
  PORT: Number(readEnv('PORT') ?? '3000'),

  MONGODB_URI: requireEnv('MONGODB_URI', ['MONGODB_URI']),
  JWT_SECRET: requireEnv('JWT_SECRET', ['JWT_SECRET']),

  GROQ_API_KEY: requireEnv('GROQ_API_KEY'),
  OPEN_ROUTER: requireEnv('OPEN_ROUTER_API_KEY', ['OPEN_ROUTER']),

  QDRANT_URL: requireEnv('QDRANT_URL'),
  QDRANT_API_KEY: requireEnv('QDRANT_API_KEY'),

  BOT_TOKEN: requireEnv('VITE_BOT_TOKEN'),
  BOT_CHAT_ID: requireEnv('VITE_BOT_CHAT_ID'),

  RAPIDAPI_KEY: readEnv('RAPIDAPI_KEY'),

  IMAGEKIT_PUBLIC_KEY: readEnv('IMAGEKIT_PUBLIC_KEY'),
  IMAGEKIT_PRIVATE_KEY: readEnv('IMAGEKIT_PRIVATE_KEY'),
  IMAGEKIT_URL_ENDPOINT: readEnv('IMAGEKIT_URL_ENDPOINT'),

  MISTRAL_API_KEY: requireEnv('MISTRAL_API_KEY'),

  GEMINI_API_KEY: readEnv('GEMINI_API_KEY'),
};
