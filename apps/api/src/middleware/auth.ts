import type { NextFunction, Request, Response } from "express";
import { UserModel } from "../models/User.js";
import { verifyToken } from "../utils/auth.js";
import { HttpError } from "../utils/httpError.js";

declare module "express-serve-static-core" {
  interface Request {
    authUser?: {
      id: string;
      role: "admin" | "participant";
    };
  }
}

const loadAuthUser = async (req: Request, required: boolean) => {
  const token = req.cookies?.token;
  if (!token) {
    if (required) {
      throw new HttpError(401, "Authentication required");
    }
    req.authUser = undefined;
    return;
  }

  try {
    const payload = verifyToken(token);
    const user = await UserModel.findById(payload.sub);
    if (!user) {
      throw new HttpError(401, "Invalid session");
    }

    req.authUser = {
      id: String(user._id),
      role: user.role,
    };
  } catch (error) {
    req.authUser = undefined;
    if (required) {
      throw error;
    }
  }
};

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    await loadAuthUser(req, false);
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    await loadAuthUser(req, true);
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (role: "admin" | "participant") => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.authUser) {
      next(new HttpError(401, "Authentication required"));
      return;
    }

    if (req.authUser.role !== role) {
      next(new HttpError(403, "You do not have access to this resource"));
      return;
    }

    next();
  };
};
