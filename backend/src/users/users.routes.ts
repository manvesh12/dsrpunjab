import { Router } from "express";
import multer from "multer";
import { requirePermissions, requireAnyPermission } from "../authorization/permissions.middleware.js";
import { usersController } from "./users.controller.js";

const upload = multer({ storage: multer.memoryStorage() });
export const usersRouter = Router();

usersRouter.use(requireAnyPermission(['USER_VIEW', 'USER_CREATE', 'USER_EDIT', 'USER_DELETE']));
usersRouter.get("/", requirePermissions(['USER_VIEW']), usersController.list);
usersRouter.get("/export", requirePermissions(['USER_VIEW']), usersController.export);
usersRouter.get("/invite-template", requirePermissions(['USER_CREATE']), usersController.inviteTemplate);
usersRouter.post("/", requirePermissions(['USER_CREATE']), usersController.create);
usersRouter.put("/:id", requirePermissions(['USER_EDIT']), usersController.update);
usersRouter.patch("/:id/active", requirePermissions(['USER_EDIT']), usersController.setActive);
usersRouter.delete("/:id", requirePermissions(['USER_DELETE']), usersController.delete);
usersRouter.post("/invite", requirePermissions(['USER_CREATE']), usersController.invite);
usersRouter.post("/invite/bulk", requirePermissions(['USER_CREATE']), upload.single("file"), usersController.bulkInvite);
