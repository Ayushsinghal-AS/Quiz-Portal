import type { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import { serializeMyAttempt } from "../services/serializers.js";
import { AttemptModel } from "../models/Attempt.js";
import { QuestionModel } from "../models/Question.js";
import { QuizModel } from "../models/Quiz.js";
import { AnswerModel } from "../models/Answer.js";
import { HttpError } from "../utils/httpError.js";
import {
  serializeAnalytics,
  serializeAttemptResult,
  serializeAttemptSession,
  serializeLeaderboard,
  serializeQuizDetail,
  serializeQuizListItem,
} from "../services/serializers.js";
import {
  finalizeAttempt,
  getAttemptSession,
  getMyAttempt,
  saveAttemptAnswer,
  startAttempt,
} from "../services/attempts.js";
import { getAttemptState } from "../services/sessionStore.js";
import { getLeaderboard } from "../services/leaderboard.js";

const getRouteId = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] ?? "" : value ?? "";

const ensureAdminOwnsQuiz = async (quizId: string, userId: string) => {
  const quiz = await QuizModel.findById(quizId);
  if (!quiz) {
    throw new HttpError(404, "Quiz not found");
  }
  if (String(quiz.createdBy) !== userId) {
    throw new HttpError(403, "You do not have access to this quiz");
  }
  return quiz;
};

export const listQuizzes = async (req: Request, res: Response) => {
  const isAdmin = req.authUser?.role === "admin";
  const filter = isAdmin
    ? { createdBy: new Types.ObjectId(req.authUser?.id) }
    : { status: "published" };

  const quizzes = await QuizModel.find(filter).sort({ createdAt: -1 });
  const questions = await QuestionModel.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { quizId: { $in: quizzes.map((quiz) => quiz._id) } } },
    { $group: { _id: "$quizId", count: { $sum: 1 } } },
  ]);
  const questionMap = new Map(questions.map((item) => [String(item._id), item.count]));

  res.json(
    quizzes.map((quiz) => serializeQuizListItem(quiz, questionMap.get(String(quiz._id)) ?? 0)),
  );
};

export const getQuizDetail = async (req: Request, res: Response) => {
  const quizId = getRouteId(req.params.id);
  const quiz = await QuizModel.findById(quizId);
  if (!quiz) {
    throw new HttpError(404, "Quiz not found");
  }

  const isAdminOwner =
    req.authUser?.role === "admin" && String(quiz.createdBy) === req.authUser.id;
  if (!isAdminOwner && quiz.status !== "published") {
    throw new HttpError(404, "Quiz not found");
  }

  const questions = await QuestionModel.find({ quizId: quiz._id }).sort({ order: 1 });
  res.json(serializeQuizDetail(quiz, questions, isAdminOwner));
};

export const createQuiz = async (req: Request, res: Response) => {
  const quiz = await QuizModel.create({
    ...req.body,
    createdBy: req.authUser?.id,
    publishedAt: req.body.status === "published" ? new Date() : undefined,
  });

  res.status(201).json(serializeQuizDetail(quiz, [], true));
};

export const updateQuiz = async (req: Request, res: Response) => {
  const quiz = await ensureAdminOwnsQuiz(getRouteId(req.params.id), req.authUser!.id);

  quiz.title = req.body.title;
  quiz.description = req.body.description;
  quiz.durationMinutes = req.body.durationMinutes;
  quiz.status = req.body.status;
  if (quiz.status === "published") {
    quiz.publishedAt = new Date();
  }
  await quiz.save();

  const questions = await QuestionModel.find({ quizId: quiz._id }).sort({ order: 1 });
  res.json(serializeQuizDetail(quiz, questions, true));
};

export const deleteQuiz = async (req: Request, res: Response) => {
  const quiz = await ensureAdminOwnsQuiz(getRouteId(req.params.id), req.authUser!.id);

  const removeQuizData = async (session?: mongoose.ClientSession) => {
    const attempts = await AttemptModel.find({ quizId: quiz._id }, null, session ? { session } : undefined).lean();
    await QuestionModel.deleteMany({ quizId: quiz._id }, session ? { session } : undefined);
    await AnswerModel.deleteMany(
      { attemptId: { $in: attempts.map((attempt) => attempt._id) } },
      session ? { session } : undefined,
    );
    await AttemptModel.deleteMany({ quizId: quiz._id }, session ? { session } : undefined);
    await QuizModel.deleteOne({ _id: quiz._id }, session ? { session } : undefined);
  };

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await removeQuizData(session);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.includes("replica set")) {
      throw error;
    }
    await removeQuizData();
  } finally {
    await session.endSession();
  }

  res.status(204).send();
};

export const publishQuiz = async (req: Request, res: Response) => {
  const quiz = await ensureAdminOwnsQuiz(getRouteId(req.params.id), req.authUser!.id);
  quiz.status = quiz.status === "published" ? "draft" : "published";
  if (quiz.status === "published") {
    quiz.publishedAt = new Date();
  }
  await quiz.save();
  const questions = await QuestionModel.find({ quizId: quiz._id }).sort({ order: 1 });
  res.json(serializeQuizDetail(quiz, questions, true));
};

export const addQuestion = async (req: Request, res: Response) => {
  const quiz = await ensureAdminOwnsQuiz(getRouteId(req.params.id), req.authUser!.id);
  if (!req.body.options.some((option: { id: string }) => option.id === req.body.correctOptionId)) {
    throw new HttpError(400, "Correct option must match one of the provided options");
  }

  const question = await QuestionModel.create({
    ...req.body,
    quizId: quiz._id,
  });
  res.status(201).json(question);
};

export const updateQuestion = async (req: Request, res: Response) => {
  const question = await QuestionModel.findById(getRouteId(req.params.id));
  if (!question) {
    throw new HttpError(404, "Question not found");
  }
  await ensureAdminOwnsQuiz(String(question.quizId), req.authUser!.id);
  if (!req.body.options.some((option: { id: string }) => option.id === req.body.correctOptionId)) {
    throw new HttpError(400, "Correct option must match one of the provided options");
  }

  question.questionText = req.body.questionText;
  question.options = req.body.options;
  question.correctOptionId = req.body.correctOptionId;
  question.points = req.body.points;
  question.order = req.body.order;
  await question.save();
  res.json(question);
};

export const deleteQuestion = async (req: Request, res: Response) => {
  const question = await QuestionModel.findById(getRouteId(req.params.id));
  if (!question) {
    throw new HttpError(404, "Question not found");
  }
  await ensureAdminOwnsQuiz(String(question.quizId), req.authUser!.id);
  await question.deleteOne();
  res.status(204).send();
};

export const startQuizAttempt = async (req: Request, res: Response) => {
  const { quiz, attempt } = await startAttempt(getRouteId(req.params.id), req.authUser!.id);
  const questions = await QuestionModel.find({ quizId: quiz._id }).sort({ order: 1 });
  const state = await getAttemptState(String(attempt._id));
  res.status(201).json(serializeAttemptSession(attempt, quiz, questions, state.answers));
};

export const getMyQuizAttempt = async (req: Request, res: Response) => {
  const attempt = await getMyAttempt(getRouteId(req.params.id), req.authUser!.id);
  res.json(serializeMyAttempt(attempt));
};

export const getInProgressAttemptSession = async (req: Request, res: Response) => {
  const result = await getAttemptSession(getRouteId(req.params.id), req.authUser!.id);
  res.json(serializeAttemptSession(result.attempt, result.quiz, result.questions, result.state.answers));
};

export const saveAnswer = async (req: Request, res: Response) => {
  await saveAttemptAnswer(getRouteId(req.params.id), req.body.questionId, req.body.selectedOptionId);
  res.status(204).send();
};

export const submitAttempt = async (req: Request, res: Response) => {
  const result = await finalizeAttempt(getRouteId(req.params.id));
  res.json(
    serializeAttemptResult(
      result.attempt,
      result.quiz,
      result.totalPoints,
      result.correctCount,
      result.questions.length,
    ),
  );
};

export const getAttemptResult = async (req: Request, res: Response) => {
  const attempt = await AttemptModel.findById(getRouteId(req.params.id));
  if (!attempt) {
    throw new HttpError(404, "Attempt not found");
  }
  if (String(attempt.userId) !== req.authUser!.id && req.authUser!.role !== "admin") {
    throw new HttpError(403, "You do not have access to this attempt");
  }
  if (attempt.status === "in_progress") {
    throw new HttpError(409, "Attempt has not been submitted yet");
  }

  const quiz = await QuizModel.findById(attempt.quizId).orFail();
  const questions = await QuestionModel.find({ quizId: quiz._id }).sort({ order: 1 });
  const answers = await AnswerModel.find({ attemptId: attempt._id });
  const correctCount = answers.filter((answer) => answer.isCorrect).length;
  const totalPoints = questions.reduce((sum, question) => sum + question.points, 0);

  res.json(serializeAttemptResult(attempt, quiz, totalPoints, correctCount, questions.length));
};

export const getQuizLeaderboard = async (req: Request, res: Response) => {
  const leaderboard = await getLeaderboard(getRouteId(req.params.id));
  res.json(serializeLeaderboard(leaderboard));
};

export const getQuizAnalytics = async (req: Request, res: Response) => {
  const quiz = await ensureAdminOwnsQuiz(getRouteId(req.params.id), req.authUser!.id);
  const quizObjectId = new Types.ObjectId(String(quiz._id));

  const [attemptSummary] = await AttemptModel.aggregate<{
    totalAttempts: number;
    totalParticipants: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
  }>([
    { $match: { quizId: quizObjectId } },
    {
      $facet: {
        totals: [{ $count: "totalAttempts" }],
        finals: [
          { $match: { status: { $in: ["submitted", "auto_submitted"] } } },
          {
            $group: {
              _id: null,
              totalParticipants: { $sum: 1 },
              averageScore: { $avg: "$score" },
              highestScore: { $max: "$score" },
              lowestScore: { $min: "$score" },
            },
          },
        ],
      },
    },
    {
      $project: {
        totalAttempts: { $ifNull: [{ $arrayElemAt: ["$totals.totalAttempts", 0] }, 0] },
        totalParticipants: { $ifNull: [{ $arrayElemAt: ["$finals.totalParticipants", 0] }, 0] },
        averageScore: { $ifNull: [{ $arrayElemAt: ["$finals.averageScore", 0] }, 0] },
        highestScore: { $ifNull: [{ $arrayElemAt: ["$finals.highestScore", 0] }, 0] },
        lowestScore: { $ifNull: [{ $arrayElemAt: ["$finals.lowestScore", 0] }, 0] },
      },
    },
  ]);

  const leaderboard = await getLeaderboard(String(quiz._id));
  const totalAttempts = attemptSummary?.totalAttempts ?? 0;
  const totalParticipants = attemptSummary?.totalParticipants ?? 0;
  const analytics = {
    quizId: String(quiz._id),
    quizTitle: quiz.title,
    totalParticipants,
    averageScore: Number((attemptSummary?.averageScore ?? 0).toFixed(1)),
    highestScore: attemptSummary?.highestScore ?? 0,
    lowestScore: attemptSummary?.lowestScore ?? 0,
    completionRate: totalAttempts === 0 ? 0 : Number(((totalParticipants / totalAttempts) * 100).toFixed(1)),
    createdAt: quiz.createdAt.toISOString(),
    publishedAt: quiz.publishedAt ? quiz.publishedAt.toISOString() : null,
    leaderboard,
  };

  res.json(serializeAnalytics(analytics));
};
