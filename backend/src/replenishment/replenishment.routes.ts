import { Router } from "express";
import { requireAuth } from "../authentication/authentication.middleware.js";
import { replenishmentController } from "./replenishment.controller.js";

export const replenishmentRouter = Router();

replenishmentRouter.get("/projects/:projectId/replenishment", requireAuth, replenishmentController.list);
replenishmentRouter.post("/projects/:projectId/replenishment", requireAuth, replenishmentController.create);
replenishmentRouter.get("/replenishment/approved-dsrs", requireAuth, replenishmentController.listApprovedDsrs);
replenishmentRouter.get("/replenishment/:id", requireAuth, replenishmentController.get);
replenishmentRouter.put("/replenishment/:id", requireAuth, replenishmentController.update);
replenishmentRouter.delete("/replenishment/:id", requireAuth, replenishmentController.delete);

// Replenishment Report Builder Specific Routes
replenishmentRouter.post("/replenishment/:id/fetch-final-dsr", requireAuth, replenishmentController.fetchFinalDsr);
replenishmentRouter.put("/replenishment/:id/state", requireAuth, replenishmentController.saveState);
replenishmentRouter.post("/replenishment/:id/upload", requireAuth, replenishmentController.upload);
replenishmentRouter.post("/replenishment/:id/workflow", requireAuth, replenishmentController.workflow);
replenishmentRouter.post("/replenishment/:id/generate-ai", requireAuth, replenishmentController.generateAi);
