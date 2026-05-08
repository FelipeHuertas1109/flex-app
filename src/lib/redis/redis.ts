import { Redis, RedisOptions } from "ioredis";

// Use environment variable in production, fallback to provided url for development
const REDIS_URL = process.env.REDIS_URL || "";

const options: RedisOptions = {
  // Limit retries to prevent blocking the app
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    if (times > 5) {
      console.warn("[Redis] Max retries reached. Falling back to memory cache.");
      return null; // Stop retrying
    }
    return delay;
  },
  maxRetriesPerRequest: 1,
};

// Pass TLS options if the URL uses rediss://
if (REDIS_URL.startsWith("rediss://")) {
  options.tls = {
    rejectUnauthorized: false,
  };
}

export const redis = new Redis(REDIS_URL, options);

// Prevent unhandled network errors from crashing the entire application
redis.on("error", (err) => {
  console.warn("[Redis] Error event:", err.message);
});
