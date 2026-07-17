import type { NextFunction, Request, Response } from "express";
import { progressStreamService, type ProgressStreamService } from "./progress-stream.service.js";

export class ProgressStreamController {
  constructor(private readonly service: ProgressStreamService) {}

  events = (req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.write('data: {"status": "connected"}\n\n');
    const unsubscribe = this.service.subscribe(message => res.write(`data: ${message}\n\n`));
    req.on("close", () => { unsubscribe(); res.end(); });
  };

  publish = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await this.service.publish(req.body)); }
    catch (error) { next(error); }
  };
}

export const progressStreamController = new ProgressStreamController(progressStreamService);
