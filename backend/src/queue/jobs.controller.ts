import type { NextFunction, Request, Response } from "express";
import { jobsService, type JobsService } from "./jobs.service.js";

export class JobsController {
  constructor(private readonly service: JobsService) {}

  pdf = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(202).json(await this.service.enqueuePdf(req.body || {}, req.user!)); }
    catch (error) { next(error); }
  };

  excel = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(202).json(await this.service.enqueueExcel(req.body || {}, req.user!)); }
    catch (error) { next(error); }
  };
}

export const jobsController = new JobsController(jobsService);
