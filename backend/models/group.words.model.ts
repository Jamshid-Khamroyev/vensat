import mongoose from "mongoose";

const GroupWordsSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    words: [{
      term: { type: String, required: true },
      definition: { type: String, required: true },
      sentence: { type: String }
    }],
    isDefault: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  });
  
  export const GroupWords = mongoose.model("GroupWords", GroupWordsSchema);