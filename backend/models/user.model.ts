import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true, index: true },
    displayName: { type: String },
    password: { type: String },
    role: { type: String, default: "user" },
    avatar: { type: String },
    eoi_skill: {
      score: { type: Number, default: 0 },
      questionTaken: { type: Number, default: 0 }
    },
  
    sec_skill: {
      score: { type: Number, default: 0 },
      questionTaken: { type: Number, default: 0 }
    },
  
    iai_skill: {
      score: { type: Number, default: 0 },
      questionTaken: { type: Number, default: 0 }
    },
  
    cas_skill: {
      score: { type: Number, default: 0 },
      questionTaken: { type: Number, default: 0 }
    },
  
    accuracy: {
      score: { type: Number, default: 0 },
      totalTestsTaken: { type: Number, default: 0 }
    },
    createdAt: { type: Date, default: Date.now }
});
  
export const User = mongoose.model("User", UserSchema);