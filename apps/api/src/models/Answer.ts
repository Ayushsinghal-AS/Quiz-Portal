import mongoose, { Schema } from "mongoose";

export interface AnswerDocument {
  _id: mongoose.Types.ObjectId;
  attemptId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  selectedOptionId: string;
  isCorrect: boolean;
  pointsAwarded: number;
  createdAt: Date;
  updatedAt: Date;
}

const answerSchema = new Schema<AnswerDocument>(
  {
    attemptId: { type: Schema.Types.ObjectId, ref: "Attempt", required: true, index: true },
    questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true },
    selectedOptionId: { type: String, default: "" },
    isCorrect: { type: Boolean, required: true },
    pointsAwarded: { type: Number, required: true, min: 0 },
  },
  {
    timestamps: true,
  },
);

answerSchema.index({ attemptId: 1, questionId: 1 }, { unique: true });

export const AnswerModel =
  mongoose.models.Answer || mongoose.model<AnswerDocument>("Answer", answerSchema);
