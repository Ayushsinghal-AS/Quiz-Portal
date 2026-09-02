import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Role } from "@quizarena/shared";
import { env } from "../config/env.js";

export interface JwtPayload {
  sub: string;
  role: Role;
}

export const hashPassword = (password: string) => bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
export const comparePassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export const signToken = (payload: JwtPayload) =>
  jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: Math.floor(env.AUTH_SESSION_MAX_AGE_MS / 1000),
  });

export const verifyToken = (token: string) =>
  jwt.verify(token, env.JWT_SECRET) as JwtPayload;

