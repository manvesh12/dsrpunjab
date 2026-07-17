import { Worker } from "bullmq";
import { logger } from "./common/logging/logger.js";
import { redisConnection } from "./queue/redis-connection.js";

const connection = redisConnection();

const pdfWorker = new Worker(
  "pdf-jobs",
  async (job) => {
    logger.info("worker_job_received", { queue: "pdf", jobId: job.id, name: job.name });
    return { ok: true, receivedAt: new Date().toISOString(), payload: job.data };
  },
  { connection }
);

const excelWorker = new Worker(
  "excel-jobs",
  async (job) => {
    logger.info("worker_job_received", { queue: "excel", jobId: job.id, name: job.name });
    return { ok: true, receivedAt: new Date().toISOString(), payload: job.data };
  },
  { connection }
);

pdfWorker.on("error", (error) => {
  logger.warn("worker_connection_error", { queue: "pdf", error: error.message });
});

excelWorker.on("error", (error) => {
  logger.warn("worker_connection_error", { queue: "excel", error: error.message });
});

logger.info("workers_started", { queues: ["pdf", "excel"] });

let shutdownStarted = false;
async function shutdown(signal: NodeJS.Signals) {
  if (shutdownStarted) return;
  shutdownStarted = true;
  logger.info("workers_shutdown_started", { signal });
  const results = await Promise.allSettled([pdfWorker.close(), excelWorker.close()]);
  if (results.some(result => result.status === "rejected")) process.exitCode = 1;
  logger.info("workers_shutdown_complete");
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
