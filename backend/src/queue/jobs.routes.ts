import { Router } from "express";
import { jobsController } from "./jobs.controller.js";

export const jobsRouter = Router();
jobsRouter.post("/pdf", jobsController.pdf);
jobsRouter.post("/excel", jobsController.excel);
