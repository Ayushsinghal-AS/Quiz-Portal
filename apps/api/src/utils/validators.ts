import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

export const quizSchema = z.object({
  title: z.string().trim().min(3),
  description: z.string().trim().min(10),
  durationMinutes: z.number().int().min(1).max(180),
  status: z.enum(["draft", "published"]).default("draft"),
});

const optionSchema = z.object({
  id: z.string().trim().min(1),
  text: z.string().trim().min(1),
});

export const questionSchema = z.object({
  questionText: z.string().trim().min(5),
  options: z.array(optionSchema).length(4),
  correctOptionId: z.string().trim().min(1),
  points: z.number().int().min(1).max(100),
  order: z.number().int().min(1),
});

export const answerSchema = z.object({
  questionId: z.string().trim().min(1),
  selectedOptionId: z.string().trim().min(1),
});

