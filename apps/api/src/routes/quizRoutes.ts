import { Router } from "express";
import {
  addQuestion,
  createQuiz,
  deleteQuestion,
  deleteQuiz,
  getMyQuizAttempt,
  getInProgressAttemptSession,
  getAttemptResult,
  getQuizAnalytics,
  getQuizDetail,
  getQuizLeaderboard,
  listQuizzes,
  publishQuiz,
  saveAnswer,
  startQuizAttempt,
  submitAttempt,
  updateQuestion,
  updateQuiz,
} from "../controllers/quizController.js";
import { optionalAuth, requireAuth, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { answerSchema, questionSchema, quizSchema } from "../utils/validators.js";

export const quizRouter = Router();

quizRouter.get("/", optionalAuth, asyncHandler(listQuizzes));
quizRouter.get("/:id", optionalAuth, asyncHandler(getQuizDetail));
quizRouter.post("/", requireAuth, requireRole("admin"), validateBody(quizSchema), asyncHandler(createQuiz));
quizRouter.put("/:id", requireAuth, requireRole("admin"), validateBody(quizSchema), asyncHandler(updateQuiz));
quizRouter.delete("/:id", requireAuth, requireRole("admin"), asyncHandler(deleteQuiz));
quizRouter.patch("/:id/publish", requireAuth, requireRole("admin"), asyncHandler(publishQuiz));
quizRouter.post("/:id/questions", requireAuth, requireRole("admin"), validateBody(questionSchema), asyncHandler(addQuestion));
quizRouter.post("/:id/start", requireAuth, requireRole("participant"), asyncHandler(startQuizAttempt));
quizRouter.get("/:id/my-attempt", requireAuth, requireRole("participant"), asyncHandler(getMyQuizAttempt));
quizRouter.get("/:id/leaderboard", requireAuth, requireRole("admin"), asyncHandler(getQuizLeaderboard));
quizRouter.get("/:id/analytics", requireAuth, requireRole("admin"), asyncHandler(getQuizAnalytics));

export const questionRouter = Router();
questionRouter.put("/:id", requireAuth, requireRole("admin"), validateBody(questionSchema), asyncHandler(updateQuestion));
questionRouter.delete("/:id", requireAuth, requireRole("admin"), asyncHandler(deleteQuestion));

export const attemptRouter = Router();
attemptRouter.get("/:id/session", requireAuth, requireRole("participant"), asyncHandler(getInProgressAttemptSession));
attemptRouter.post("/:id/answer", requireAuth, requireRole("participant"), validateBody(answerSchema), asyncHandler(saveAnswer));
attemptRouter.post("/:id/submit", requireAuth, requireRole("participant"), asyncHandler(submitAttempt));
attemptRouter.get("/:id/result", requireAuth, asyncHandler(getAttemptResult));
