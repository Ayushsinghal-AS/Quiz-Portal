import mongoose, { Schema } from "mongoose";
import type { AttemptStatus } from "@quizarena/shared";

export interface AttemptDocument {
  _id: mongoose.Types.ObjectId;
  quizId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  startedAt: Date;
  submittedAt?: Date;
  status: AttemptStatus;
  score: number;
  completionTimeSeconds: number;
  createdAt: Date;
  updatedAt: Date;
}

const attemptSchema = new Schema<AttemptDocument>(
  {
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    startedAt: { type: Date, required: true },
    submittedAt: { type: Date },
    status: { type: String, enum: ["in_progress", "submitted", "auto_submitted"], default: "in_progress" },
    score: { type: Number, default: 0 },
    completionTimeSeconds: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
);

attemptSchema.index({ quizId: 1, userId: 1 });

export const AttemptModel =
  mongoose.models.Attempt || mongoose.model<AttemptDocument>("Attempt", attemptSchema);

