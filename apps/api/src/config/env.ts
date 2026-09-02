import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("4000"),
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/quizarena"),
  REDIS_URL: z.string().default("redis://127.0.0.1:6379"),
  JWT_SECRET: z.string().default("development-secret"),
  COOKIE_SECRET: z.string().default("cookie-secret"),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  SEED_ADMIN_NAME: z.string().default("QuizArena Admin"),
  SEED_ADMIN_EMAIL: z.string().default("admin@quizarena.dev"),
  SEED_ADMIN_PASSWORD: z.string().default("Admin123!"),
  NODE_ENV: z.string().default("development"),
  USE_IN_MEMORY_CACHE: z.string().optional(),
  CROSS_SITE_COOKIES: z.string().optional(),
});

const parsed = envSchema.parse(process.env);

const crossSiteCookies = parsed.CROSS_SITE_COOKIES === "true";

export const env = {
  ...parsed,
  PORT: Number(parsed.PORT),
  isProduction: parsed.NODE_ENV === "production",
  useInMemoryCache: parsed.USE_IN_MEMORY_CACHE === "true" || parsed.NODE_ENV === "test",
  crossSiteCookies,
  cookieSameSite: (crossSiteCookies ? "none" : "lax") as "none" | "lax",
  cookieSecure: crossSiteCookies || parsed.NODE_ENV === "production",
};
