import type { NextFunction, Request, Response } from "express";
import { environment } from "../../config/environment.js";
import { ApiError } from "../exceptions/api-error.js";
import { logger } from "../logging/logger.js";

export function globalErrorHandler(error: Error, req: Request, res: Response, _next: NextFunction) {
  const apiError = error instanceof ApiError ? error : null;
  const status = apiError?.status || 500;
  const message = apiError?.message || "Internal server error";

  logger.error("request_failed", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    status,
    errorName: error.name,
    errorMessage: error.message,
    stack: environment.isProduction ? undefined : error.stack
  });

  res.status(status).json({
    error: message,
    code: apiError?.code || "INTERNAL_ERROR",
    requestId: req.requestId,
    ...(apiError?.details === undefined ? {} : { details: apiError.details })
  });
}
