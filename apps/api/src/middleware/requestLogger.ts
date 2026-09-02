import type { NextFunction, Request, Response } from "express";
import { logger } from "../services/logger.js";

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    logger.info("http_request", {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      ip: req.ip,
      userId: req.authUser?.id ?? null,
    });
  });

  next();
};

