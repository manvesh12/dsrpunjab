import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../common/exceptions/api-error.js";
import { jsonSafe } from "../common/utils/json-safe.js";
import { invitationService, type InvitationService } from "./invitation.service.js";
import { userManagementService, type UserManagementService } from "./user-management.service.js";
import { toUserDto } from "./users.mapper.js";
import { userRosterService, type UserRosterService } from "./user-roster.service.js";
import { userId } from "./users.validator.js";

export class UsersController {
  constructor(
    private readonly users: UserManagementService,
    private readonly invitations: InvitationService,
    private readonly roster: UserRosterService
  ) {}

  list = async (_req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, async () => (await this.users.list()).map(toUserDto));

  export = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const output = await this.roster.export();
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", 'attachment; filename="district-user-login-roster.xlsx"');
      res.send(output);
    } catch (error) { next(error); }
  };

  inviteTemplate = (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", 'attachment; filename="district-user-invitation-template.xlsx"');
      res.send(this.roster.template());
    } catch (error) { next(error); }
  };

  create = async (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, async () => toUserDto(await this.users.create(req.body)), 201);

  update = async (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, async () => toUserDto(await this.users.update(userId(req.params.id), req.body)));

  setActive = async (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, async () => toUserDto(await this.users.setActive(userId(req.params.id), req.body?.active)));

  delete = async (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, () => this.users.delete(userId(req.params.id)));

  invite = async (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, () => this.invitations.invite(req.body, req.user!));

  bulkInvite = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) { next(new ApiError(400, "INVITATION_FILE_REQUIRED", "No file uploaded")); return; }
    try { res.json(await this.invitations.bulk(req.file.buffer, req.user!)); }
    catch (error) {
      next(error instanceof ApiError ? error : new ApiError(500, "INVITATION_FILE_FAILED", `Failed to process the uploaded file: ${error instanceof Error ? error.message : String(error)}`));
    }
  };

  private async respond(res: Response, next: NextFunction, action: () => unknown | Promise<unknown>, status = 200) {
    try { res.status(status).json(jsonSafe(await action())); }
    catch (error) { next(error); }
  }
}

export const usersController = new UsersController(userManagementService, invitationService, userRosterService);
