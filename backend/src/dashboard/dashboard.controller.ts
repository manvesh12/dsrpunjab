import type { NextFunction, Request, Response } from "express";
import { dashboardService, type DashboardService } from "./dashboard.service.js";

export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  getStats = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.getStats());
    } catch (error) {
      next(error);
    }
  };
}

export const dashboardController = new DashboardController(dashboardService);
