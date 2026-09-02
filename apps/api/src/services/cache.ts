import { createClient, type RedisClientType } from "redis";
import { env } from "../config/env.js";

type StoredValue = string;

class CacheService {
  private client: RedisClientType | null = null;
  private connected = false;
  private readonly memory = new Map<string, { value: StoredValue; expiresAt?: number }>();

  async connect() {
    if (env.useInMemoryCache || this.connected) {
      return;
    }

    if (!this.client) {
      this.client = createClient({ url: env.REDIS_URL });
      this.client.on("error", () => {
        this.connected = false;
      });
    }

    try {
      await this.client.connect();
      this.connected = true;
    } catch {
      this.connected = false;
    }
  }

  async disconnect() {
    if (this.client && this.connected) {
      await this.client.disconnect();
    }
    this.connected = false;
  }

  private cleanupMemoryKey(key: string) {
    const entry = this.memory.get(key);
    if (!entry) {
      return;
    }

    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      this.memory.delete(key);
    }
  }

  async get(key: string) {
    if (env.useInMemoryCache || !this.connected || !this.client) {
      this.cleanupMemoryKey(key);
      return this.memory.get(key)?.value ?? null;
    }

    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    if (env.useInMemoryCache || !this.connected || !this.client) {
      this.memory.set(key, {
        value,
        expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
      });
      return;
    }

    if (ttlSeconds) {
      await this.client.set(key, value, { EX: ttlSeconds });
      return;
    }

    await this.client.set(key, value);
  }

  async delete(key: string) {
    if (env.useInMemoryCache || !this.connected || !this.client) {
      this.memory.delete(key);
      return;
    }

    await this.client.del(key);
  }

  async clearAll() {
    if (env.useInMemoryCache || !this.connected || !this.client) {
      this.memory.clear();
      return;
    }

    await this.client.flushAll();
  }
}

export const cacheService = new CacheService();

export const cacheKeys = {
  attemptSession: (attemptId: string) => `attempt:${attemptId}:session`,
  leaderboard: (quizId: string) => `quiz:${quizId}:leaderboard`,
};
