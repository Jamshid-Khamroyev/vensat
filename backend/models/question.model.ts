import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    question: { type: String, required: true },
    graph: { type: String },
    options: [{ type: String, required: true }],
    correctAnswerIndex: { type: Number, required: true },
    difficulty: { type: String },
    isDual: { type: Boolean, default: false },
    category: { type: String },
    createdAt: { type: Date, default: Date.now }
  });
  
export const Question = mongoose.model("Question", QuestionSchema);