import type { NextFunction, Request, Response } from "express";
import { settingsService, type SettingsService } from "./settings.service.js";
import { validateUpdateSetting } from "./settings.validator.js";

export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  getByKey = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await this.service.getByKey(String(req.params.key))); }
    catch (error) { next(error); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await this.service.update(validateUpdateSetting(String(req.params.key), req.body))); }
    catch (error) { next(error); }
  };
}

export const settingsController = new SettingsController(settingsService);
