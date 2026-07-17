import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export function requestContext(req: Request, res: Response, next: NextFunction) {
  const suppliedId = req.header("x-request-id")?.trim();
  req.requestId = suppliedId && suppliedId.length <= 128 ? suppliedId : randomUUID();
  res.setHeader("x-request-id", req.requestId);
  next();
}
