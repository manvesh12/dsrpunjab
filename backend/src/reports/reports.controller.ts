import type { NextFunction, Request, Response } from "express";
import { jsonSafe } from "../common/utils/json-safe.js";
import { createReportDto, reportId, reportWorkflowDto, updateReportStatusDto } from "./reports.validator.js";
import { reportsService, type ReportsService } from "./reports.service.js";

export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  list = async (_req: Request, res: Response, next: NextFunction) => this.respond(res, next, () => this.service.list());

  create = async (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, () => this.service.create(createReportDto(req.body), req.user!));

  updateStatus = async (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, () => this.service.updateStatus(updateReportStatusDto(req.params.id, req.query, req.body), req.user!));

  workflow = async (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, () => this.service.runWorkflow(reportWorkflowDto(req.params.id, req.body), req.user!));

  history = async (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, () => this.service.history(reportId(req.params.id)));

  auditLogs = async (_req: Request, res: Response, next: NextFunction) => this.respond(res, next, () => this.service.auditLogs());

  private async respond(res: Response, next: NextFunction, action: () => unknown | Promise<unknown>) {
    try { res.json(jsonSafe(await action())); }
    catch (error) { next(error); }
  }
}

export const reportsController = new ReportsController(reportsService);
