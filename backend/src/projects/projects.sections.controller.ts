import type { NextFunction, Request, Response } from "express";
import { projectsSectionsService } from "./projects.sections.service.js";

export class ProjectsSectionsController {
  
  saveDraft = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = BigInt(req.params.id as string);
      const draftContent = req.body;
      const result = await projectsSectionsService.saveDraft(projectId, draftContent);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  updateSection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = BigInt(req.params.id as string);
      const sectionName = req.params.sectionName as string;
      const content = req.body.content;
      const version = req.headers['x-version'] ? parseInt(req.headers['x-version'] as string, 10) : undefined;
      const user = (req as any).user;
      
      const result = await projectsSectionsService.updateSection(projectId, sectionName, content, user, version);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}

export const projectsSectionsController = new ProjectsSectionsController();
