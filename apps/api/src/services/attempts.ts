import { QuestionModel, type OptionValue } from "../models/Question.js";
import { AnswerModel } from "../models/Answer.js";
import { AttemptModel } from "../models/Attempt.js";
import { QuizModel } from "../models/Quiz.js";
import { clearAttemptState, getAttemptState, setAttemptState } from "./sessionStore.js";
import { HttpError } from "../utils/httpError.js";
import { invalidateLeaderboard } from "./leaderboard.js";

export const startAttempt = async (quizId: string, userId: string) => {
  const quiz = await QuizModel.findById(quizId);
  if (!quiz || quiz.status !== "published") {
    throw new HttpError(404, "Quiz not found");
  }

  const existingFinalAttempt = await AttemptModel.findOne({
    quizId,
    userId,
    status: { $in: ["submitted", "auto_submitted"] },
  });

  if (existingFinalAttempt) {
    throw new HttpError(409, "You have already completed this quiz");
  }

  const activeAttempt = await AttemptModel.findOne({
    quizId,
    userId,
    status: "in_progress",
  });

  if (activeAttempt) {
    throw new HttpError(409, "You already have an active attempt for this quiz");
  }

  const createdAttempt = await AttemptModel.create({
    quizId,
    userId,
    startedAt: new Date(),
    status: "in_progress",
    score: 0,
    completionTimeSeconds: 0,
  });
  const ttlSeconds = quiz.durationMinutes * 60;
  await setAttemptState(String(createdAttempt._id), {}, ttlSeconds);

  return { quiz, attempt: createdAttempt };
};

export const getActiveAttempt = async (quizId: string, userId: string) => {
  const attempt = await AttemptModel.findOne({
    quizId,
    userId,
    status: "in_progress",
  });

  if (!attempt) {
    throw new HttpError(404, "No active attempt found");
  }

  return attempt;
};

export const getAttemptSession = async (attemptId: string, userId: string) => {
  const attempt = await AttemptModel.findById(attemptId);
  if (!attempt) {
    throw new HttpError(404, "Attempt not found");
  }
  if (String(attempt.userId) !== userId) {
    throw new HttpError(403, "You do not have access to this attempt");
  }
  if (attempt.status !== "in_progress") {
    throw new HttpError(409, "Attempt has already been submitted");
  }

  const quiz = await QuizModel.findById(attempt.quizId).orFail();
  const questions = await QuestionModel.find({ quizId: quiz._id }).sort({ order: 1 });
  const state = await getAttemptState(attemptId);
  return { quiz, attempt, questions, state };
};

export const saveAttemptAnswer = async (attemptId: string, questionId: string, selectedOptionId: string) => {
  const attempt = await AttemptModel.findById(attemptId);
  if (!attempt) {
    throw new HttpError(404, "Attempt not found");
  }
  if (attempt.status !== "in_progress") {
    throw new HttpError(409, "Attempt has already been submitted");
  }

  const quiz = await QuizModel.findById(attempt.quizId).orFail();
  const expiresAt = new Date(attempt.startedAt.getTime() + quiz.durationMinutes * 60_000);
  if (expiresAt.getTime() <= Date.now()) {
    throw new HttpError(409, "Attempt has expired");
  }

  const question = await QuestionModel.findOne({ _id: questionId, quizId: quiz._id });
  if (!question) {
    throw new HttpError(404, "Question not found");
  }
  if (!question.options.some((option: OptionValue) => option.id === selectedOptionId)) {
    throw new HttpError(400, "Invalid answer option");
  }

  const state = await getAttemptState(attemptId);
  state.answers[questionId] = selectedOptionId;
  const ttlSeconds = Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  await setAttemptState(attemptId, state.answers, ttlSeconds);
};

export const finalizeAttempt = async (attemptId: string) => {
  const attempt = await AttemptModel.findById(attemptId);
  if (!attempt) {
    throw new HttpError(404, "Attempt not found");
  }

  const quiz = await QuizModel.findById(attempt.quizId).orFail();
  const questions = await QuestionModel.find({ quizId: quiz._id }).sort({ order: 1 });

  if (attempt.status !== "in_progress") {
    const answers = await AnswerModel.find({ attemptId });
    const correctCount = answers.filter((answer) => answer.isCorrect).length;
    const totalPoints = questions.reduce((sum, question) => sum + question.points, 0);
    return { attempt, quiz, questions, correctCount, totalPoints };
  }

  const state = await getAttemptState(attemptId);
  const now = new Date();
  const expiresAt = new Date(attempt.startedAt.getTime() + quiz.durationMinutes * 60_000);
  const submittedAt = now.getTime() > expiresAt.getTime() ? expiresAt : now;
  const isAutoSubmitted = now.getTime() > expiresAt.getTime();

  await AnswerModel.deleteMany({ attemptId });

  const answersToCreate = questions.map((question) => {
    const selectedOptionId = state.answers[String(question._id)] ?? "";
    const isCorrect = selectedOptionId !== "" && selectedOptionId === question.correctOptionId;
    return {
      attemptId: attempt._id,
      questionId: question._id,
      selectedOptionId,
      isCorrect,
      pointsAwarded: isCorrect ? question.points : 0,
    };
  });

  if (answersToCreate.length > 0) {
    await AnswerModel.insertMany(answersToCreate, { ordered: true });
  }

  const score = answersToCreate.reduce((sum, answer) => sum + answer.pointsAwarded, 0);
  const correctCount = answersToCreate.filter((answer) => answer.isCorrect).length;
  const completionTimeSeconds = Math.max(
    1,
    Math.round((submittedAt.getTime() - attempt.startedAt.getTime()) / 1000),
  );

  attempt.submittedAt = submittedAt;
  attempt.status = isAutoSubmitted ? "auto_submitted" : "submitted";
  attempt.score = score;
  attempt.completionTimeSeconds = completionTimeSeconds;
  await attempt.save();

  await clearAttemptState(attemptId);
  await invalidateLeaderboard(String(quiz._id));

  const totalPoints = questions.reduce((sum, question) => sum + question.points, 0);
  return { attempt, quiz, questions, correctCount, totalPoints };
};
