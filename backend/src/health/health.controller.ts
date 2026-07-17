import type { NextFunction, Request, Response } from "express";
import { healthService, type HealthService } from "./health.service.js";

export class HealthController {
  constructor(private readonly service: HealthService) {}
  health = (_req: Request, res: Response) => res.json(this.service.health());
  live = (_req: Request, res: Response) => res.json(this.service.live());
  ready = async (_req: Request, res: Response, _next: NextFunction) => {
    try { res.json(await this.service.ready()); }
    catch (error) { res.status(503).json({ status: "error", message: error instanceof Error ? error.message : String(error) }); }
  };
}

export const healthController = new HealthController(healthService);
