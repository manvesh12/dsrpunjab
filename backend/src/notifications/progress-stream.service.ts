import { Redis } from "ioredis";
import { ApiError } from "../common/exceptions/api-error.js";
import { logger } from "../common/logging/logger.js";
import { redisConnection } from "../queue/redis-connection.js";

const PROGRESS_CHANNEL = "dsr_progress_events";

export class ProgressStreamService {
  constructor(
    private readonly subscriber = new Redis(redisConnection()),
    private readonly publisher = new Redis(redisConnection())
  ) {}

  subscribe(listener: (message: string) => void) {
    const handler = (channel: string, message: string) => {
      if (channel === PROGRESS_CHANNEL) listener(message);
    };
    this.subscriber.subscribe(PROGRESS_CHANNEL, error => {
      if (error) logger.error("progress_stream_subscribe_failed", { error: error.message });
    });
    this.subscriber.on("message", handler);
    return () => this.subscriber.off("message", handler);
  }

  async publish(body: any) {
    if (!body?.projectId) throw new ApiError(400, "PROJECT_ID_REQUIRED", "projectId is required");
    const payload = JSON.stringify({
      projectId: body.projectId,
      action: body.action || "PROCESSING",
      progress: body.progress || 0,
      message: body.message || "Working...",
      timestamp: new Date().toISOString()
    });
    await this.publisher.publish(PROGRESS_CHANNEL, payload);
    return { success: true, published: true };
  }

  close() {
    this.subscriber.disconnect();
    this.publisher.disconnect();
  }
}

export const progressStreamService = new ProgressStreamService();
