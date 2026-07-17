import type { NextFunction, Request, Response } from "express";
import { jsonSafe } from "../common/utils/json-safe.js";
import { searchService, type SearchService } from "./search.service.js";
import { indexRequest, searchRequest } from "./search.validator.js";

export class SearchController {
  constructor(private readonly service: SearchService) {}

  search = async (req: Request, res: Response, next: NextFunction) => {
    try { const input = searchRequest(req.body); res.json(jsonSafe(await this.service.search(input.query, input.limit))); }
    catch (error) { next(error); }
  };

  index = async (req: Request, res: Response, next: NextFunction) => {
    try { const input = indexRequest(req.body); res.status(201).json(await this.service.index(input.projectId, input.section, input.content)); }
    catch (error) { next(error); }
  };
}

export const searchController = new SearchController(searchService);
