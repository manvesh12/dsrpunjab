import { Router } from "express";
import multer from "multer";
import { requirePermissions } from "../authorization/permissions.middleware.js";
import { MAX_FILE_SIZE_BYTES } from "./upload.constants.js";
import { uploadsController } from "./uploads.controller.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_FILE_SIZE_BYTES } });
export const filesRouter = Router();

filesRouter.get("/", requirePermissions(["PROJECT_VIEW"]), uploadsController.list);
filesRouter.post("/upload", requirePermissions(["PROJECT_EDIT"]), upload.single("file"), uploadsController.upload);
filesRouter.get("/download/:identifier", requirePermissions(["PROJECT_VIEW"]), uploadsController.download);
filesRouter.delete("/:identifier", requirePermissions(["PROJECT_EDIT"]), uploadsController.delete);
