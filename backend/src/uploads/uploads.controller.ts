import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../common/exceptions/api-error.js";
import { readRawUpload } from "./raw-upload-reader.js";
import { uploadsService, type UploadsService } from "./uploads.service.js";

export class UploadsController {
  constructor(private readonly service: UploadsService) {}

  upload = async (req: Request, res: Response) => {
    try {
      const uploaded = req.file;
      const bytes = uploaded?.buffer || await readRawUpload(req);
      const result = await this.service.upload({
        projectIdValue: req.query.projectId || req.body?.projectId,
        originalName: uploaded?.originalname || String(req.query.name || req.headers["x-file-name"] || ""),
        bytes,
        declaredContentType: uploaded?.mimetype || String(req.headers["content-type"] || ""),
        moduleName: String(req.query.module || "replenishment"),
        requirementId: String(req.query.requirementId || "upload"),
        uploadedBy: String(req.query.uploadedBy || req.headers["x-uploaded-by"] || "")
      }, req.user!);
      res.status(201).json(result);
    } catch (error) {
      this.uploadError(res, error);
    }
  };

  download = async (req: Request, res: Response) => {
    try {
      const { file, bytes } = await this.service.download(String(req.params.identifier), String(req.query.projectId || ""), req.user!);
      const inline = String(req.query.inline || "false") === "true";
      res.setHeader("Content-Type", file.contentType || "application/octet-stream");
      res.setHeader("Content-Disposition", `${inline ? "inline" : "attachment"}; filename="${encodeURIComponent(file.fileName)}"`);
      res.send(bytes);
    } catch (error) {
      if (error instanceof ApiError && error.code.startsWith("PROJECT_")) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      res.status(404).type("text/plain").send(`File not found${error instanceof ApiError && error.code === "FILE_NOT_FOUND" ? "" : ` or error loading: ${error instanceof Error ? error.message : String(error)}`}`);
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      res.json(await this.service.delete(String(req.params.identifier), String(req.query.projectId || ""), req.user!));
    } catch (error) {
      if (error instanceof ApiError && error.code.startsWith("PROJECT_")) res.status(error.status).json({ error: error.message });
      else res.status(error instanceof ApiError ? error.status : 500).json({ success: false, error: error instanceof Error ? error.message : "Delete failed" });
    }
  };

  private uploadError(res: Response, error: unknown) {
    if (error instanceof ApiError && error.code.startsWith("PROJECT_")) res.status(error.status).json({ error: error.message });
    else res.status(error instanceof ApiError ? error.status : 500).json({ success: false, error: error instanceof Error ? error.message : "Upload failed" });
  }
}

export const uploadsController = new UploadsController(uploadsService);
