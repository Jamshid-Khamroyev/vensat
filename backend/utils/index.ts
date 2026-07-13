import axios from "axios";
import { env } from "./env";

export const generateGroupName = () => {
    const adjectives = ['Advanced', 'Basic', 'Essential', 'Professional', 'Academic', 'Business', 'Technical', 'Scientific', 'Literary', 'Conversational'];
    const topics = ['Vocabulary', 'English', 'Language', 'Terms', 'Expressions', 'Phrases', 'Words', 'Concepts', 'Definitions', 'Lexicon'];
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    const number = Math.floor(Math.random() * 999) + 1;
    return `${randomAdj} ${randomTopic} ${number}`;
};

export async function senMessage(){
  const BOT_TOKEN = env.BOT_CHAT_ID
  const CHAT_ID = env.BOT_CHAT_ID

  await axios.post(
  `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
  {
    chat_id: CHAT_ID,
    text: "⚠️ Groq API kunlik limiti tugadi!"
  }
);
}