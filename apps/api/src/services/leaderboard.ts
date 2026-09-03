import type { LeaderboardEntry } from "@quizarena/shared";
import { AnswerModel } from "../models/Answer.js";
import { AttemptModel } from "../models/Attempt.js";
import { QuizModel } from "../models/Quiz.js";
import { UserModel } from "../models/User.js";
import { cacheKeys, cacheService } from "./cache.js";

export const getLeaderboard = async (quizId: string): Promise<LeaderboardEntry[]> => {
  const cacheKey = cacheKeys.leaderboard(quizId);
  const cached = await cacheService.get(cacheKey);
  if (cached) {
    return JSON.parse(cached) as LeaderboardEntry[];
  }

  await QuizModel.findById(quizId).orFail();

  const attempts = await AttemptModel.find({
    quizId,
    status: { $in: ["submitted", "auto_submitted"] },
  })
    .sort({ score: -1, completionTimeSeconds: 1, submittedAt: 1 })
    .lean();

  const users = await UserModel.find({
    _id: { $in: attempts.map((attempt) => attempt.userId) },
  }).lean();

  const userMap = new Map(users.map((user) => [String(user._id), { name: user.name, email: user.email }]));

  const leaderboard = attempts.map((attempt, index) => ({
    rank: index + 1,
    participantName: userMap.get(String(attempt.userId))?.name ?? "Unknown Player",
    participantEmail: userMap.get(String(attempt.userId))?.email ?? "",
    score: attempt.score,
    completionTimeSeconds: attempt.completionTimeSeconds,
  }));

  await cacheService.set(cacheKey, JSON.stringify(leaderboard), 120);
  return leaderboard;
};

export const invalidateLeaderboard = async (quizId: string) => {
  await cacheService.delete(cacheKeys.leaderboard(quizId));
};

export const getAttemptScoreSummary = async (attemptId: string) => {
  const answers = await AnswerModel.find({ attemptId }).lean();
  const totalPoints = answers.reduce((sum, answer) => sum + answer.pointsAwarded, 0);
  const correctCount = answers.filter((answer) => answer.isCorrect).length;

  return {
    totalPointsAvailable: answers.reduce((sum, answer) => sum + Math.max(answer.pointsAwarded, answer.pointsAwarded), 0),
    totalPoints,
    correctCount,
  };
};

