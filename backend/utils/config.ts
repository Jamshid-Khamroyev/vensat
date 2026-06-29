import Groq from 'groq-sdk';
import { OpenRouter } from '@openrouter/sdk';
import { env } from './env';

export const groq = new Groq({
  apiKey: env.GROQ_API_KEY,
});

export const openrouter = new OpenRouter({
  apiKey: env.OPEN_ROUTER_API_KEY,
});
