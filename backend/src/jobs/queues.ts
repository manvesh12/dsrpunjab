import { Queue } from "bullmq";
import { logger } from "../common/logging/logger.js";
import { redisConnection } from "../queue/redis-connection.js";
export { redisConnection } from "../queue/redis-connection.js";

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 1000 },
  removeOnComplete: 100,
  removeOnFail: 1000 // Keep more failures for DLQ investigation
};

export const pdfQueue = new Queue("pdf-jobs", { connection: redisConnection(), defaultJobOptions });
export const excelQueue = new Queue("excel-jobs", { connection: redisConnection(), defaultJobOptions });
export const auditQueue = new Queue("audit-jobs", { connection: redisConnection(), defaultJobOptions });
export const notificationsQueue = new Queue("notifications-jobs", { connection: redisConnection(), defaultJobOptions });

pdfQueue.on("error", error => logger.warn("queue_connection_error", { queue: "pdf", error: error.message }));
excelQueue.on("error", error => logger.warn("queue_connection_error", { queue: "excel", error: error.message }));
auditQueue.on("error", error => logger.warn("queue_connection_error", { queue: "audit", error: error.message }));
notificationsQueue.on("error", error => logger.warn("queue_connection_error", { queue: "notifications", error: error.message }));

export function closeQueues() {
  return Promise.all([pdfQueue.close(), excelQueue.close(), auditQueue.close(), notificationsQueue.close()]);
}
