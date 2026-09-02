import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Role } from "@quizarena/shared";
import { env } from "../config/env.js";

export interface JwtPayload {
  sub: string;
  role: Role;
}

export const hashPassword = (password: string) => bcrypt.hash(password, 10);
export const comparePassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export const signToken = (payload: JwtPayload) =>
  jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "7d",
  });

export const verifyToken = (token: string) =>
  jwt.verify(token, env.JWT_SECRET) as JwtPayload;

