import { Router } from "express";
import multer from "multer";
import { MAX_FILE_SIZE_BYTES } from "./upload.constants.js";
import { uploadsController } from "./uploads.controller.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_FILE_SIZE_BYTES } });
export const filesRouter = Router();

filesRouter.post("/upload", upload.single("file"), uploadsController.upload);
filesRouter.get("/download/:identifier", uploadsController.download);
filesRouter.delete("/:identifier", uploadsController.delete);
