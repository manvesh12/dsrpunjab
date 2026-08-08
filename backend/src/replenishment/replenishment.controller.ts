import type { NextFunction, Request, Response } from "express";
import { jsonSafe } from "../common/utils/json-safe.js";
import { replenishmentService, type ReplenishmentService } from "./replenishment.service.js";
import { replenishmentId, replenishmentProjectId } from "./replenishment.validator.js";

export class ReplenishmentController {
  constructor(private readonly service: ReplenishmentService) {}

  list = async (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, () => this.service.list(replenishmentProjectId(req.params.projectId), req.user!));

  listApprovedDsrs = async (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, () => this.service.listApprovedDsrs(req.user!));

  create = async (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, () => this.service.create(replenishmentProjectId(req.params.projectId), req.body, req.user!), 201);

  get = async (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, () => this.service.get(replenishmentId(req.params.id), req.user!));

  update = async (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, () => this.service.update(replenishmentId(req.params.id), req.body, req.user!));

  delete = async (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, () => this.service.delete(replenishmentId(req.params.id), req.user!));

  fetchFinalDsr = async (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, () => this.service.fetchFinalDsr(replenishmentId(req.params.id), req.user!));

  saveState = async (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, () => this.service.saveState(replenishmentId(req.params.id), req.body, req.user!));

  upload = async (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, () => this.service.upload(replenishmentId(req.params.id), {
      sectionId: req.body?.sectionId,
      originalName: req.file?.originalname || "",
      bytes: req.file?.buffer || Buffer.alloc(0),
      declaredContentType: req.file?.mimetype || ""
    }, req.user!), 201);

  downloadFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { file, bytes } = await this.service.downloadFile(
        replenishmentId(req.params.id),
        replenishmentId(req.params.fileId),
        req.user!
      );
      const inline = String(req.query.inline || "false") === "true";
      res.setHeader("Content-Type", file.contentType || "application/octet-stream");
      res.setHeader("Content-Disposition", `${inline ? "inline" : "attachment"}; filename="${encodeURIComponent(file.fileName)}"`);
      res.send(bytes);
    } catch (error) {
      next(error);
    }
  };

  deleteFile = async (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, () => this.service.deleteFile(
      replenishmentId(req.params.id),
      replenishmentId(req.params.fileId),
      req.user!
    ));

  workflow = async (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, () => this.service.workflow(replenishmentId(req.params.id), req.body, req.user!));

  generateAi = async (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, () => this.service.generateAi(replenishmentId(req.params.id), req.body, req.user!));

  private async respond(res: Response, next: NextFunction, action: () => unknown | Promise<unknown>, status = 200) {
    try { res.status(status).json(jsonSafe(await action())); }
    catch (error) { next(error); }
  }
}

export const replenishmentController = new ReplenishmentController(replenishmentService);
