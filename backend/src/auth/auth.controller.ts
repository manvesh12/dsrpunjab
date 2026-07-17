import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../common/exceptions/api-error.js";
import { environment } from "../config/environment.js";
import { recordAudit } from "../audit/audit.middleware.js";
import { jsonSafe } from "../common/utils/json-safe.js";
import { refreshTokenCookieOptions, sessionCookieOptions } from "./auth.constants.js";
import type { AuditRecorder } from "./auth.types.js";
import {
  identifierInput, invitationTokenInput, invitedOtpInput, loginInput, registerInvitedInput,
  resetOtpInput, resetPasswordInput, verifyRegisterInput
} from "./auth.validator.js";
import { invitedRegistrationService, type InvitedRegistrationService } from "./invited-registration.service.js";
import { passwordResetService, type PasswordResetService } from "./password-reset.service.js";
import { sessionService, type SessionService } from "./session.service.js";

export class AuthController {
  constructor(
    private readonly sessions: SessionService,
    private readonly resets: PasswordResetService,
    private readonly invitations: InvitedRegistrationService
  ) {}

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = loginInput(req.body);
      const session = await this.sessions.login(input.username, input.password, this.audit(req));
      this.setSessionCookies(res, session.token, session.refreshToken);
      res.json(jsonSafe(session.response));
    } catch (error) { next(error); }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.sessions.refresh(req.cookies?.dsr_refresh_token);
      res.cookie(environment.sessionCookieName, result.token, sessionCookieOptions);
      res.json(result);
    } catch (error) {
      if (error instanceof ApiError && error.code === "REFRESH_TOKEN_INVALID") {
        res.clearCookie("dsr_refresh_token", { path: "/api/auth/refresh" });
      }
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.sessions.logout(req.cookies?.dsr_refresh_token, this.audit(req));
      res.clearCookie(environment.sessionCookieName, { path: "/" });
      res.clearCookie("dsr_refresh_token", { path: "/api/auth/refresh" });
      res.json(result);
    } catch (error) { next(error); }
  };

  registerDisabled = (_req: Request, res: Response) => {
    res.status(403).json({ error: "Public registration is disabled. Please use an administrator invitation link." });
  };

  verifyRegisterOtp = async (req: Request, res: Response, next: NextFunction) => {
    try { const input = verifyRegisterInput(req.body); res.json(await this.invitations.verifyLegacyRegistration(input.email, input.otp)); }
    catch (error) { next(error); }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await this.resets.request(identifierInput(req.body).identifier, this.audit(req))); }
    catch (error) { next(error); }
  };

  verifyResetOtp = async (req: Request, res: Response, next: NextFunction) => {
    try { const input = resetOtpInput(req.body); res.json(await this.resets.verify(input.identifier, input.otp, this.audit(req))); }
    catch (error) { next(error); }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = resetPasswordInput(req.body);
      res.json(await this.resets.reset(
        input.identifier, input.otp, input.newPassword,
        { ip: this.clientIp(req), userAgent: req.header("user-agent") || undefined },
        this.audit(req)
      ));
    } catch (error) { next(error); }
  };

  invitationDetails = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(jsonSafe(await this.invitations.details(String(req.params.token)))); }
    catch (error) { next(error); }
  };

  registerInvited = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(jsonSafe(await this.invitations.start(registerInvitedInput(req.body), this.audit(req)))); }
    catch (error) { next(error); }
  };

  verifyInvitedOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = invitedOtpInput(req.body);
      const result = await this.invitations.verify(input.token, input.otp, this.audit(req));
      this.setSessionCookies(res, result.session.token, result.session.refreshToken);
      res.json(jsonSafe(result.response));
    } catch (error) { next(error); }
  };

  resendInvitedOtp = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await this.invitations.resend(invitationTokenInput(req.body).token, this.audit(req))); }
    catch (error) { next(error); }
  };

  private audit(req: Request): AuditRecorder {
    return (action, metadata, status) => recordAudit(req, action, metadata, status);
  }

  private setSessionCookies(res: Response, token: string, refreshToken: string) {
    res.cookie(environment.sessionCookieName, token, sessionCookieOptions);
    res.cookie("dsr_refresh_token", refreshToken, refreshTokenCookieOptions);
  }

  private clientIp(req: Request) {
    const forwardedFor = req.header("x-forwarded-for");
    if (forwardedFor) return forwardedFor.split(",")[0]?.trim();
    return req.ip || req.socket.remoteAddress || undefined;
  }
}

export const authController = new AuthController(sessionService, passwordResetService, invitedRegistrationService);
