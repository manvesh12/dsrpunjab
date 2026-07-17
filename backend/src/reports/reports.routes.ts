import { Router } from "express";
import { reportsController } from "./reports.controller.js";
import { requirePermissions, requireAnyPermission } from "../authorization/permissions.middleware.js";

export const reportsRouter = Router();

reportsRouter.use(requireAnyPermission(['REPORT_VIEW', 'REPORT_GENERATE', 'REPORT_DOWNLOAD', 'REPORT_APPROVE']));
reportsRouter.get("/", requirePermissions(['REPORT_VIEW']), reportsController.list);
reportsRouter.post("/", requirePermissions(['REPORT_GENERATE']), reportsController.create);
reportsRouter.patch("/:id/status", requirePermissions(['REPORT_APPROVE']), reportsController.updateStatus);
reportsRouter.post("/:id/workflow", requirePermissions(['REPORT_APPROVE']), reportsController.workflow);
reportsRouter.get("/:id/history", requirePermissions(['REPORT_VIEW']), reportsController.history);
reportsRouter.get("/audit-logs", requirePermissions(['REPORT_VIEW']), reportsController.auditLogs);
