import { logger } from "../common/logging/logger.js";

export type BestEffortOperation = {
  target: string;
  run: () => Promise<unknown>;
};

export async function settleBestEffort(
  context: string,
  operations: BestEffortOperation[]
) {
  const results = await Promise.allSettled(operations.map(operation => operation.run()));
  const failures = results.flatMap((result, index) =>
    result.status === "rejected" ? [{
      target: operations[index]?.target || "unknown",
      error: result.reason instanceof Error ? result.reason.message : String(result.reason)
    }] : []
  );
  if (failures.length) logger.warn("storage_cleanup_failed", { context, failures });
  return results;
}
