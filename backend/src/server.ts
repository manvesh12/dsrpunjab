import { createApp } from "./app.js";
import { logger } from "./common/logging/logger.js";
import { environment } from "./config/environment.js";
import { disconnectDatabase } from "./database/database.lifecycle.js";
import { closeQueues } from "./jobs/queues.js";
import { progressStreamService } from "./notifications/progress-stream.service.js";

const server = createApp().listen(environment.apiPort, () => {
  logger.info("server_started", { port: environment.apiPort });
});

let shutdownStarted = false;
async function shutdown(signal: NodeJS.Signals) {
  if (shutdownStarted) return;
  shutdownStarted = true;
  logger.info("server_shutdown_started", { signal });
  server.close();
  progressStreamService.close();
  const results = await Promise.allSettled([disconnectDatabase(), closeQueues()]);
  const failures = results.filter(result => result.status === "rejected");
  if (failures.length) {
    logger.error("server_shutdown_failed", { failures: failures.length });
    process.exitCode = 1;
  } else {
    logger.info("server_shutdown_complete");
  }
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
