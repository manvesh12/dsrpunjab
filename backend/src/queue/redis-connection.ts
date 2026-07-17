import { environment } from "../config/environment.js";

export function redisConnection() {
  try {
    const url = new URL(environment.queueRedisUrl);
    return {
      host: url.hostname,
      port: Number(url.port || 6379),
      username: url.username || undefined,
      password: url.password || undefined,
      ...(url.protocol === "rediss:" ? { tls: {} } : {})
    };
  } catch {
    return { host: "127.0.0.1", port: 6379 };
  }
}
