import mongoose, { Schema } from "mongoose";
import type { QuizStatus } from "@quizarena/shared";

export interface QuizDocument {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  durationMinutes: number;
  status: QuizStatus;
  createdBy: mongoose.Types.ObjectId;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const quizSchema = new Schema<QuizDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    durationMinutes: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    publishedAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

export const QuizModel = mongoose.models.Quiz || mongoose.model<QuizDocument>("Quiz", quizSchema);

