import { Router } from "express";
import { dashboardController } from "./dashboard.controller.js";

export const dashboardRouter = Router();

dashboardRouter.get("/stats", dashboardController.getStats);
