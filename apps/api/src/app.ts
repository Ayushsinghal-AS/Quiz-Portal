import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { requireCsrf } from "./middleware/csrf.js";
import { authRouter } from "./routes/authRoutes.js";
import { attemptRouter, questionRouter, quizRouter } from "./routes/quizRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser(env.COOKIE_SECRET));
  app.use(requestLogger);
  app.use(requireCsrf);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/quizzes", quizRouter);
  app.use("/api/questions", questionRouter);
  app.use("/api/attempts", attemptRouter);

  app.use(errorHandler);
  return app;
};
