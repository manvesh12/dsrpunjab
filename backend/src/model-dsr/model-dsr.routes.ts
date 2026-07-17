import { Router } from "express";
import { modelDsrController } from "./model-dsr.controller.js";

export const modelDsrRouter = Router();
modelDsrRouter.get("/", modelDsrController.list);
modelDsrRouter.post("/", modelDsrController.create);
modelDsrRouter.post("/generate", modelDsrController.generate);
modelDsrRouter.get("/generated/list", modelDsrController.listGenerated);
modelDsrRouter.get("/generated/:id", modelDsrController.getGenerated);
modelDsrRouter.get("/:id", modelDsrController.get);
modelDsrRouter.put("/:id", modelDsrController.update);
modelDsrRouter.post("/:id/publish", modelDsrController.publish);
modelDsrRouter.delete("/:id", modelDsrController.delete);
modelDsrRouter.post("/:id/import", modelDsrController.import);
modelDsrRouter.post("/:id/duplicate", modelDsrController.duplicate);
modelDsrRouter.get("/:id/preview", modelDsrController.preview);
modelDsrRouter.get("/:id/versions", modelDsrController.versions);
