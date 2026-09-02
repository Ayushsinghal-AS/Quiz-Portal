import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number(),
  MONGODB_URI: z.string(),
  REDIS_URL: z.string(),
  JWT_SECRET: z.string(),
  COOKIE_SECRET: z.string(),
  CLIENT_URL: z.string(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]),
  SEED_ADMIN_NAME: z.string(),
  SEED_ADMIN_EMAIL: z.string(),
  SEED_ADMIN_PASSWORD: z.string(),
  NODE_ENV: z.string(),
  USE_IN_MEMORY_CACHE: z.string().optional(),
  CROSS_SITE_COOKIES: z.string().optional(),
  AUTH_SESSION_MAX_AGE_MS: z.coerce.number(),
  BCRYPT_SALT_ROUNDS: z.coerce.number(),
  AUTH_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number(),
  AUTH_RATE_LIMIT_MAX_REQUESTS: z.coerce.number(),
});

const parsed = envSchema.parse(process.env);

const crossSiteCookies = parsed.CROSS_SITE_COOKIES === "true";

export const env = {
  ...parsed,
  isProduction: parsed.NODE_ENV === "production",
  useInMemoryCache: parsed.USE_IN_MEMORY_CACHE === "true" || parsed.NODE_ENV === "test",
  crossSiteCookies,
  cookieSameSite: (crossSiteCookies ? "none" : "lax") as "none" | "lax",
  cookieSecure: crossSiteCookies || parsed.NODE_ENV === "production",
};
