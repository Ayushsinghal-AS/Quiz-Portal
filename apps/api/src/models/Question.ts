import mongoose, { Schema } from "mongoose";

export interface OptionValue {
  id: string;
  text: string;
}

export interface QuestionDocument {
  _id: mongoose.Types.ObjectId;
  quizId: mongoose.Types.ObjectId;
  questionText: string;
  options: OptionValue[];
  correctOptionId: string;
  points: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const optionSchema = new Schema<OptionValue>(
  {
    id: { type: String, required: true },
    text: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const questionSchema = new Schema<QuestionDocument>(
  {
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true, index: true },
    questionText: { type: String, required: true, trim: true },
    options: {
      type: [optionSchema],
      required: true,
      validate: [(value: OptionValue[]) => value.length === 4, "Questions must have exactly four options"],
    },
    correctOptionId: { type: String, required: true },
    points: { type: Number, required: true, min: 1 },
    order: { type: Number, required: true, min: 1 },
  },
  {
    timestamps: true,
  },
);

export const QuestionModel =
  mongoose.models.Question || mongoose.model<QuestionDocument>("Question", questionSchema);

