import type { NextFunction, Request, Response } from "express";
import { logger } from "../logging/logger.js";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startedAt = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    logger.info("http_request", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      userId: req.user?.id?.toString() || null,
      ip: req.ip
    });
  });
  next();
}
