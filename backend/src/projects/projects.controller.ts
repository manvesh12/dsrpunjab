import type { NextFunction, Request, Response } from "express";
import { jsonSafe } from "../common/utils/json-safe.js";
import { toProjectDto } from "./projects.mapper.js";
import { projectsService, type ProjectsService } from "./projects.service.js";
import { projectId } from "./projects.validator.js";

export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  list = async (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, async () => (await this.service.list(req.user!)).map(toProjectDto));

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.create(req.body || {}, req.user!);
      if (result.bulk) res.json(jsonSafe({ success: true, projects: result.projects.map(toProjectDto) }));
      else res.status(201).json(jsonSafe(toProjectDto(result.project)));
    } catch (error) { next(error); }
  };

  importPackage = async (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, async () => toProjectDto(await this.service.importPackage(projectId(req.params.id), req.body, req.user!)));

  rollback = async (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, () => this.service.rollback(projectId(req.params.id), req.user!));

  nextPhase = async (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, async () => toProjectDto(await this.service.nextPhase(projectId(req.params.id, "source phase id"), req.body, req.user!)), 201);

  get = async (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, async () => toProjectDto(await this.service.get(projectId(req.params.id), req.user!)));

  updateState = async (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, async () => ({ success: true, project: toProjectDto(await this.service.updateState(projectId(req.params.id), req.body, req.user!)) }));

  delete = async (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, () => this.service.delete(projectId(req.params.id), req.user!));

  private async respond(res: Response, next: NextFunction, action: () => unknown | Promise<unknown>, status = 200) {
    try { res.status(status).json(jsonSafe(await action())); }
    catch (error) { next(error); }
  }
}

export const projectsController = new ProjectsController(projectsService);
