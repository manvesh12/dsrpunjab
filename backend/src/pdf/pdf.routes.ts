import { Router } from "express";
import { pdfController } from "./pdf.controller.js";

export const pdfRouter = Router();
pdfRouter.post("/upload-pdf", pdfController.upload);
pdfRouter.get("/download-pdf", pdfController.download);
pdfRouter.post("/email-final-pdf", pdfController.emailFinal);
