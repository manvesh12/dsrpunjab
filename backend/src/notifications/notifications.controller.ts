import type { NextFunction, Request, Response } from "express";
import { jsonSafe } from "../common/utils/json-safe.js";
import { ApiError } from "../common/exceptions/api-error.js";
import { notificationsService, type NotificationsService } from "./notifications.service.js";

function notificationId(value: string) {
  try {
    const parsed = BigInt(value);
    if (parsed <= 0n) throw new Error();
    return parsed;
  } catch {
    throw new ApiError(400, "NOTIFICATION_ID_INVALID", "Invalid notification id.");
  }
}

export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  list = (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, () => this.service.list(req.user!));

  markRead = (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, () => this.service.markRead(notificationId(String(req.params.id)), req.user!));

  markAllRead = (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, () => this.service.markAllRead(req.user!));

  remove = (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, () => this.service.remove(notificationId(String(req.params.id)), req.user!));

  private async respond(res: Response, next: NextFunction, action: () => unknown | Promise<unknown>) {
    try { res.json(jsonSafe(await action())); }
    catch (error) { next(error); }
  }
}

export const notificationsController = new NotificationsController(notificationsService);
