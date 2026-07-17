import { Router } from "express";
import { progressStreamController } from "./progress-stream.controller.js";

export const streamRouter = Router();
streamRouter.get("/events", progressStreamController.events);
streamRouter.post("/publish", progressStreamController.publish);
