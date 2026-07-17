import type { NextFunction, Request, Response } from "express";
import { auditService } from "./audit.service.js";

function clientIp(req: Request) {
  const forwardedFor = req.header("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim();
  return req.ip || req.socket.remoteAddress || undefined;
}

export function recordAudit(req: Request, action: string, metadata?: Record<string, unknown>, status?: number) {
  auditService.record({
    userId: req.user?.id,
    action,
    method: req.method,
    path: req.originalUrl,
    ip: clientIp(req),
    userAgent: req.header("user-agent") || undefined,
    status,
    metadata
  });
}

export function auditMutations(req: Request, res: Response, next: NextFunction) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) { next(); return; }
  res.on("finish", () => {
    const resource = req.path.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "").toUpperCase() || "API";
    recordAudit(req, `${req.method}_${resource}`, undefined, res.statusCode);
  });
  next();
}
