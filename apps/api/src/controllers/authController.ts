import type { Request, Response } from "express";
import { UserModel } from "../models/User.js";
import { comparePassword, signToken } from "../utils/auth.js";
import { HttpError } from "../utils/httpError.js";
import { env } from "../config/env.js";
import { serializeUser } from "../services/serializers.js";
import { issueCsrfToken } from "../middleware/csrf.js";

const cookieOptions = {
  httpOnly: true,
  sameSite: env.cookieSameSite,
  secure: env.cookieSecure,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const clearCookieOptions = {
  httpOnly: true,
  sameSite: env.cookieSameSite,
  secure: env.cookieSecure,
};

export const register = async (req: Request, res: Response) => {
  const email = req.body.email.toLowerCase();
  let user = await UserModel.findOne({ email });

  if (user) {
    if (user.role !== "participant") {
      throw new HttpError(409, "Email is already registered");
    }
    user.name = req.body.name;
    await user.save();
  } else {
    user = await UserModel.create({
      name: req.body.name,
      email,
      role: "participant",
    });
  }

  const token = signToken({ sub: String(user._id), role: user.role });
  const csrfToken = issueCsrfToken(res);
  res.cookie("token", token, cookieOptions);
  res.status(201).json({ user: serializeUser(user), csrfToken });
};

export const login = async (req: Request, res: Response) => {
  const user = await UserModel.findOne({ email: req.body.email.toLowerCase() });
  if (!user || !user.passwordHash) {
    throw new HttpError(401, "Invalid email or password");
  }

  const matches = await comparePassword(req.body.password, user.passwordHash);
  if (!matches) {
    throw new HttpError(401, "Invalid email or password");
  }

  const token = signToken({ sub: String(user._id), role: user.role });
  const csrfToken = issueCsrfToken(res);
  res.cookie("token", token, cookieOptions);
  res.json({ user: serializeUser(user), csrfToken });
};

export const me = async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.json({ user: null });
    return;
  }

  const user = await UserModel.findById(req.authUser?.id).orFail();
  res.json({ user: serializeUser(user) });
};

export const logout = async (_req: Request, res: Response) => {
  res.clearCookie("token", clearCookieOptions);
  res.clearCookie("csrfToken", {
    httpOnly: false,
    sameSite: env.cookieSameSite,
    secure: env.cookieSecure,
  });
  res.status(204).send();
};
