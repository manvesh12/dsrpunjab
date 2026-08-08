import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../authentication/authentication.middleware.js";
import { requirePermissions } from "../authorization/permissions.middleware.js";
import { uploadLimiter } from "../common/middleware/rate-limit.js";
import { MAX_FILE_SIZE_BYTES } from "../uploads/upload.constants.js";
import { replenishmentController } from "./replenishment.controller.js";

export const replenishmentRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_FILE_SIZE_BYTES } });

replenishmentRouter.get("/projects/:projectId/replenishment", requireAuth, requirePermissions(["PROJECT_VIEW"]), replenishmentController.list);
replenishmentRouter.post("/projects/:projectId/replenishment", requireAuth, requirePermissions(["PROJECT_CREATE"]), replenishmentController.create);
replenishmentRouter.get("/replenishment/approved-dsrs", requireAuth, requirePermissions(["PROJECT_VIEW"]), replenishmentController.listApprovedDsrs);
replenishmentRouter.get("/replenishment/:id", requireAuth, requirePermissions(["PROJECT_VIEW"]), replenishmentController.get);
replenishmentRouter.put("/replenishment/:id", requireAuth, requirePermissions(["PROJECT_EDIT"]), replenishmentController.update);
replenishmentRouter.delete("/replenishment/:id", requireAuth, requirePermissions(["PROJECT_DELETE"]), replenishmentController.delete);

// Replenishment Report Builder Specific Routes
replenishmentRouter.post("/replenishment/:id/fetch-final-dsr", requireAuth, requirePermissions(["PROJECT_EDIT"]), replenishmentController.fetchFinalDsr);
replenishmentRouter.put("/replenishment/:id/state", requireAuth, requirePermissions(["PROJECT_EDIT"]), replenishmentController.saveState);
replenishmentRouter.post("/replenishment/:id/upload", requireAuth, requirePermissions(["PROJECT_EDIT"]), uploadLimiter, upload.single("file"), replenishmentController.upload);
replenishmentRouter.get("/replenishment/:id/files/:fileId", requireAuth, requirePermissions(["PROJECT_VIEW"]), replenishmentController.downloadFile);
replenishmentRouter.delete("/replenishment/:id/files/:fileId", requireAuth, requirePermissions(["PROJECT_EDIT"]), replenishmentController.deleteFile);
replenishmentRouter.post("/replenishment/:id/workflow", requireAuth, requirePermissions(["PROJECT_EDIT"]), replenishmentController.workflow);
replenishmentRouter.post("/replenishment/:id/generate-ai", requireAuth, requirePermissions(["PROJECT_EDIT"]), replenishmentController.generateAi);
