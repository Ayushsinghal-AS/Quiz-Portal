import { cacheKeys, cacheService } from "./cache.js";

export interface AttemptSessionState {
  attemptId: string;
  answers: Record<string, string>;
}

export const getAttemptState = async (attemptId: string): Promise<AttemptSessionState> => {
  const raw = await cacheService.get(cacheKeys.attemptSession(attemptId));
  if (!raw) {
    return { attemptId, answers: {} };
  }

  return JSON.parse(raw) as AttemptSessionState;
};

export const setAttemptState = async (attemptId: string, answers: Record<string, string>, ttlSeconds: number) => {
  await cacheService.set(
    cacheKeys.attemptSession(attemptId),
    JSON.stringify({ attemptId, answers }),
    ttlSeconds,
  );
};

export const clearAttemptState = async (attemptId: string) => {
  await cacheService.delete(cacheKeys.attemptSession(attemptId));
};

