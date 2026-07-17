import { Router } from "express";
import { searchController } from "./search.controller.js";

export const searchRouter = Router();
searchRouter.post("/", searchController.search);
searchRouter.post("/index", searchController.index);
