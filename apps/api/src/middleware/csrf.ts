import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

const csrfCookieOptions = {
  httpOnly: false,
  sameSite: env.cookieSameSite,
  secure: env.cookieSecure,
  maxAge: env.AUTH_SESSION_MAX_AGE_MS,
};

export const issueCsrfToken = (res: Response) => {
  const csrfToken = crypto.randomUUID();
  res.cookie("csrfToken", csrfToken, csrfCookieOptions);
  return csrfToken;
};

export const csrfTokenHandler = (_req: Request, res: Response) => {
  const csrfToken = issueCsrfToken(res);
  res.json({ csrfToken });
};

export const requireCsrf = (req: Request, _res: Response, next: NextFunction) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    next();
    return;
  }

  const cookieToken = req.cookies?.csrfToken;
  const headerToken = req.header("x-csrf-token");

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    next(new HttpError(403, "Invalid CSRF token"));
    return;
  }

  next();
};

