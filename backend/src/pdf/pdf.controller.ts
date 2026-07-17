import type { Request, Response } from "express";
import { ApiError } from "../common/exceptions/api-error.js";
import { pdfService, type PdfService } from "./pdf.service.js";

export class PdfController {
  constructor(private readonly service: PdfService) {}

  upload = async (req: Request, res: Response) => {
    try { res.json(await this.service.upload(req.body, req.user!)); }
    catch (error) { this.jsonOrAdminError(res, error); }
  };

  download = async (req: Request, res: Response) => {
    try {
      const { file, bytes } = await this.service.download(req.query.projectId, req.query.annexureId, req.user!);
      const inline = String(req.query.inline || "false") === "true";
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `${inline ? "inline" : "attachment"}; filename="${encodeURIComponent(file.fileName)}"`);
      res.send(bytes);
    } catch (error) {
      if (error instanceof ApiError && error.code === "FINAL_PDF_ADMIN_ONLY") res.status(error.status).type("text/plain").send(error.message);
      else if (error instanceof ApiError && error.code === "PDF_PROJECT_REQUIRED") res.status(error.status).type("text/plain").send(error.message);
      else if (error instanceof ApiError && error.code.startsWith("PROJECT_")) res.status(error.status).json({ error: error.message });
      else res.status(404).type("text/plain").send(error instanceof ApiError && error.code === "PDF_NOT_FOUND" ? error.message : `PDF not found or error loading: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  emailFinal = async (req: Request, res: Response) => {
    try { res.json(this.service.emailFinal(req.body, req.user!)); }
    catch (error) { this.jsonOrAdminError(res, error); }
  };

  private jsonOrAdminError(res: Response, error: unknown) {
    if (error instanceof ApiError && error.code === "FINAL_PDF_ADMIN_ONLY") {
      res.status(error.status).type("text/plain").send(error.message);
      return;
    }
    if (error instanceof ApiError && error.code.startsWith("PROJECT_")) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    res.status(error instanceof ApiError ? error.status : 500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error"
    });
  }
}

export const pdfController = new PdfController(pdfService);
