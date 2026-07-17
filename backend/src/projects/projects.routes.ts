import { Router } from "express";
import { projectsController } from "./projects.controller.js";
import { projectsSectionsController } from "./projects.sections.controller.js";
import { requirePermissions, requireAnyPermission } from "../authorization/permissions.middleware.js";

export const projectsRouter = Router();

projectsRouter.use(requireAnyPermission(['PROJECT_VIEW', 'PROJECT_CREATE', 'PROJECT_EDIT', 'PROJECT_DELETE']));
projectsRouter.get("/", requirePermissions(['PROJECT_VIEW']), projectsController.list);
projectsRouter.post("/", requirePermissions(['PROJECT_CREATE']), projectsController.create);
projectsRouter.post("/:id/import-package", requirePermissions(['PROJECT_CREATE']), projectsController.importPackage);
projectsRouter.post("/:id/rollback", requirePermissions(['PROJECT_EDIT']), projectsController.rollback);
projectsRouter.post("/:id/phases", requirePermissions(['PROJECT_EDIT']), projectsController.nextPhase);
projectsRouter.get("/:id", requirePermissions(['PROJECT_VIEW']), projectsController.get);
projectsRouter.put("/:id/state", requirePermissions(['PROJECT_EDIT']), projectsController.updateState);
projectsRouter.delete("/:id", requirePermissions(['PROJECT_DELETE']), projectsController.delete);

// New granular persistence routes
projectsRouter.patch("/:id/sections/:sectionName", requirePermissions(['PROJECT_EDIT']), projectsSectionsController.updateSection);
projectsRouter.post("/:id/draft", requirePermissions(['PROJECT_EDIT']), projectsSectionsController.saveDraft);
