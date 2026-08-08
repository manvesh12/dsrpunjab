import type { NextFunction, Request, Response } from "express";
import { jsonSafe } from "../common/utils/json-safe.js";
import { projectId } from "../projects/projects.validator.js";
import { workflowService, type WorkflowService } from "./workflow.service.js";

export class WorkflowController {
  constructor(private readonly service: WorkflowService) {}

  summary = (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, () => this.service.summary(projectId(req.params.id), req.user!));

  recipients = (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, () => this.service.recipients(projectId(req.params.id), req.user!));

  createNote = (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, () => this.service.createNote(projectId(req.params.id), req.body, req.user!), 201);

  setNoteStatus = (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, () => this.service.setNoteStatus(projectId(req.params.id), String(req.params.noteId), req.body?.status, req.user!));

  saveSignatures = (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, () => this.service.saveSignatures(projectId(req.params.id), req.body?.signatures, req.user!));

  submitDecision = (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, () => this.service.submitDecision(projectId(req.params.id), req.body, req.user!));

  private async respond(res: Response, next: NextFunction, action: () => unknown | Promise<unknown>, status = 200) {
    try { res.status(status).json(jsonSafe(await action())); }
    catch (error) { next(error); }
  }
}

export const workflowController = new WorkflowController(workflowService);
