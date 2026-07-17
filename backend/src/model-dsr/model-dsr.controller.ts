import type { NextFunction, Request, Response } from "express";
import { jsonSafe } from "../common/utils/json-safe.js";
import { modelDsrService, type ModelDsrService } from "./model-dsr.service.js";

export class ModelDsrController {
  constructor(private readonly service: ModelDsrService) {}

  list = async (_req: Request, res: Response, next: NextFunction) => this.respond(res, next, () => this.service.listTemplates());
  create = async (req: Request, res: Response, next: NextFunction) => this.respond(res, next, () => this.service.create(req.body, req.user!), 201);
  generate = async (req: Request, res: Response, next: NextFunction) => this.respond(res, next, () => this.service.generate(req.body));
  listGenerated = async (_req: Request, res: Response, next: NextFunction) => this.respond(res, next, () => this.service.listGenerated());
  getGenerated = async (req: Request, res: Response, next: NextFunction) => this.respond(res, next, () => this.service.getGenerated(String(req.params.id)));
  get = async (req: Request, res: Response, next: NextFunction) => this.respond(res, next, () => this.service.get(String(req.params.id)));
  update = async (req: Request, res: Response, next: NextFunction) => this.respond(res, next, () => this.service.update(String(req.params.id), req.body, req.user!));
  publish = async (req: Request, res: Response, next: NextFunction) => this.respond(res, next, () => this.service.publish(String(req.params.id), req.user!));
  delete = async (req: Request, res: Response, next: NextFunction) => this.respond(res, next, () => this.service.delete(String(req.params.id), req.user!));
  import = async (req: Request, res: Response, next: NextFunction) => this.respond(res, next, () => this.service.import(String(req.params.id), req.body, req.user!));
  duplicate = async (req: Request, res: Response, next: NextFunction) => this.respond(res, next, () => this.service.duplicate(String(req.params.id), req.user!), 201);
  preview = async (req: Request, res: Response, next: NextFunction) => this.respond(res, next, () => this.service.preview(String(req.params.id)));
  versions = async (req: Request, res: Response, next: NextFunction) => this.respond(res, next, () => this.service.versions(String(req.params.id)));

  private async respond(res: Response, next: NextFunction, action: () => unknown | Promise<unknown>, status = 200) {
    try { res.status(status).json(jsonSafe(await action())); }
    catch (error) { next(error); }
  }
}

export const modelDsrController = new ModelDsrController(modelDsrService);
