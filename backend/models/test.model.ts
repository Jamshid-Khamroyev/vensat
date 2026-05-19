import mongoose from "mongoose";

const TestSchema = new mongoose.Schema({
    title: { type: String, required: true },
    creatorId: { type: String, required: true },
    category: { type: String, required: true },
    timeLimit: { type: Number, default: 30 },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    createdAt: { type: Date, default: Date.now }
  });
  
  
export const Test = mongoose.model("Test", TestSchema);