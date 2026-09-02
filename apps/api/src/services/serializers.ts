import type {
  AttemptResult,
  AttemptSession,
  AuthUser,
  LeaderboardEntry,
  MyAttemptResponse,
  QuizAnalytics,
  QuizDetail,
  QuizListItem,
  QuizQuestionForAdmin,
  QuizQuestionForParticipant,
} from "@quizarena/shared";
import type { AttemptDocument } from "../models/Attempt.js";
import type { QuizDocument } from "../models/Quiz.js";
import type { QuestionDocument } from "../models/Question.js";
import type { UserDocument } from "../models/User.js";

export const serializeUser = (user: UserDocument): AuthUser => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
});

export const serializeQuizListItem = (
  quiz: QuizDocument,
  questionCount: number,
): QuizListItem => ({
  id: String(quiz._id),
  title: quiz.title,
  description: quiz.description,
  durationMinutes: quiz.durationMinutes,
  status: quiz.status,
  questionCount,
  createdAt: quiz.createdAt.toISOString(),
});

export const serializeQuestionForParticipant = (
  question: QuestionDocument,
): QuizQuestionForParticipant => ({
  id: String(question._id),
  questionText: question.questionText,
  options: question.options.map((option) => ({
    id: option.id,
    text: option.text,
  })),
  points: question.points,
  order: question.order,
});

export const serializeQuestionForAdmin = (question: QuestionDocument): QuizQuestionForAdmin => ({
  ...serializeQuestionForParticipant(question),
  correctOptionId: question.correctOptionId,
});

export const serializeQuizDetail = (
  quiz: QuizDocument,
  questions: QuestionDocument[],
  includeAnswers: boolean,
): QuizDetail => ({
  id: String(quiz._id),
  title: quiz.title,
  description: quiz.description,
  durationMinutes: quiz.durationMinutes,
  status: quiz.status,
  createdAt: quiz.createdAt.toISOString(),
  questions: includeAnswers
    ? questions.map(serializeQuestionForAdmin)
    : questions.map(serializeQuestionForParticipant),
});

export const serializeAttemptSession = (
  attempt: AttemptDocument,
  quiz: QuizDocument,
  questions: QuestionDocument[],
  answers: Record<string, string>,
): AttemptSession => ({
  attemptId: String(attempt._id),
  quizId: String(quiz._id),
  quizTitle: quiz.title,
  expiresAt: new Date(attempt.startedAt.getTime() + quiz.durationMinutes * 60_000).toISOString(),
  startedAt: attempt.startedAt.toISOString(),
  answers,
  questions: questions.map(serializeQuestionForParticipant),
});

export const serializeMyAttempt = (attempt: AttemptDocument): MyAttemptResponse => ({
  attemptId: String(attempt._id),
  status: attempt.status,
});

export const serializeAttemptResult = (
  attempt: AttemptDocument,
  quiz: QuizDocument,
  totalPoints: number,
  correctCount: number,
  questionCount: number,
): AttemptResult => ({
  attemptId: String(attempt._id),
  quizId: String(quiz._id),
  quizTitle: quiz.title,
  score: attempt.score,
  totalPoints,
  correctCount,
  questionCount,
  completionTimeSeconds: attempt.completionTimeSeconds,
  status: attempt.status,
  submittedAt: attempt.submittedAt?.toISOString() ?? attempt.updatedAt.toISOString(),
});

export const serializeLeaderboard = (
  entries: LeaderboardEntry[],
): LeaderboardEntry[] => entries.map((entry) => ({ ...entry }));

export const serializeAnalytics = (analytics: QuizAnalytics): QuizAnalytics => analytics;
