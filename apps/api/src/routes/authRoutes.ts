import { Router } from "express";
import { login, logout, me, register } from "../controllers/authController.js";
import { csrfTokenHandler } from "../middleware/csrf.js";
import { optionalAuth } from "../middleware/auth.js";
import { createRateLimiter } from "../middleware/rateLimit.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { loginSchema, registerSchema } from "../utils/validators.js";

export const authRouter = Router();
const authLimiter = createRateLimiter({ key: "auth", windowSeconds: 60, maxRequests: 8 });

authRouter.get("/csrf-token", csrfTokenHandler);
authRouter.post("/register", authLimiter, validateBody(registerSchema), asyncHandler(register));
authRouter.post("/login", authLimiter, validateBody(loginSchema), asyncHandler(login));
authRouter.get("/me", optionalAuth, asyncHandler(me));
authRouter.post("/logout", asyncHandler(logout));
