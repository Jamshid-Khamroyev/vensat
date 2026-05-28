import mongoose, { Schema } from "mongoose";

export interface IPracticeQuestion {
  _id: string;
  sentence: string;
  correctWord: string;
  options: string[];
  explanation: string;
  wordDefinition: string;
}

export interface IPractice extends Document {
  userId: string;
  groupId: string;
  questions: IPracticeQuestion[];
  totalQuestions: number;
  createdAt: Date;
  updatedAt: Date;
  lastPracticed?: Date;
}

const PracticeQuestionSchema = new Schema({
  sentence: { type: String, required: true },
  correctWord: { type: String, required: true },
  options: [String],
  explanation: { type: String, required: true },
  wordDefinition: { type: String, required: true }
});

const PracticeSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true, index: true },
  questions: [PracticeQuestionSchema],
  totalQuestions: { type: Number, required: true },
  lastPracticed: { type: Date, default: new Date().toISOString() },
}, { timestamps: true });

export const Practice = mongoose.model<IPractice>('Practice', PracticeSchema);
