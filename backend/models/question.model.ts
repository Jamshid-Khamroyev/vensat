import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema({
    text: { type: String },
    question: { type: String },
    graph: { type: String },
    options: [{ type: String, required: true }],
    correctAnswerIndex: { type: Number, required: true },
    explanation: {
      type: Map,
      of: String,
      default: {}
    },
    difficulty: { type: String },
    isOfficial: { type: Boolean, default: false },
    isDual: { type: Boolean, default: false },
    category: { type: String },
    createdAt: { type: Date, default: Date.now }
  });
  
export const Question = mongoose.model("Question", QuestionSchema);