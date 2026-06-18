import mongoose from "mongoose";

const TestSchema = new mongoose.Schema({
    title: { type: String, required: true },
    creatorId: { type: String, required: true },
    category: { type: String, required: true },
    timeLimit: { type: Number, default: 32 },
    isGlobal: { type: Boolean, default: false },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    createdAt: { type: Date, default: Date.now }
  });
  
  
export const Test = mongoose.model("Test", TestSchema);