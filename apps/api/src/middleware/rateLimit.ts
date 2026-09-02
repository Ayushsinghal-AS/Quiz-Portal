import type { NextFunction, Request, Response } from "express";
import { cacheService } from "../services/cache.js";
import { HttpError } from "../utils/httpError.js";

export const createRateLimiter = ({
  key,
  windowSeconds,
  maxRequests,
}: {
  key: string;
  windowSeconds: number;
  maxRequests: number;
}) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const clientKey = `${key}:${req.ip}`;
      const raw = await cacheService.get(clientKey);
      const current = raw
        ? (JSON.parse(raw) as { count: number; resetAt: number })
        : { count: 0, resetAt: Date.now() + windowSeconds * 1000 };

      if (current.resetAt <= Date.now()) {
        current.count = 0;
        current.resetAt = Date.now() + windowSeconds * 1000;
      }

      current.count += 1;
      const ttlSeconds = Math.max(1, Math.ceil((current.resetAt - Date.now()) / 1000));
      await cacheService.set(clientKey, JSON.stringify(current), ttlSeconds);

      if (current.count > maxRequests) {
        next(new HttpError(429, "Too many requests. Please wait and try again."));
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
