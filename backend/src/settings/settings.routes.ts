
import { Router } from "express";
import { requireAuth } from "../authentication/authentication.middleware.js";
import { requireAnyRole } from "../authorization/authorization.middleware.js";
import { settingsController } from "./settings.controller.js";

export const settingsRouter = Router();

settingsRouter.get("/:key", settingsController.getByKey);
settingsRouter.put("/:key", requireAuth, requireAnyRole(["SUPER_ADMIN", "STATE_ADMIN"]), settingsController.update);
