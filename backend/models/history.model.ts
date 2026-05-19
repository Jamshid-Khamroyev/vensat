import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    results: [{
      questionId: mongoose.Schema.Types.ObjectId,
      isCorrect: Boolean,
      correctAnswerIndex: Number,
      userSelectedIndex: Number
    }],
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    completedAt: { type: Date, default: Date.now }
});
  
export const History = mongoose.model('History', historySchema);