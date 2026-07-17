import crypto from "node:crypto";
import type { User } from "@prisma/client";
import { passwordService, type PasswordService } from "./security/password.service.js";
import { ApiError } from "../common/exceptions/api-error.js";
import { tokenService } from "../authentication/token.service.js";
import { permissionsFor, roleToFrontend } from "../authorization/role.policy.js";
import { REFRESH_TOKEN_TTL_MS } from "./auth.constants.js";
import { authRepository, type AuthRepositoryContract } from "./auth.repository.js";
import type { AuditRecorder } from "./auth.types.js";

export class SessionService {
  constructor(private readonly repository: AuthRepositoryContract, private readonly passwords: PasswordService) {}

  async login(username: string, password: string, audit: AuditRecorder) {
    const identifier = username.toLowerCase();
    const user = await this.repository.findLoginUser(identifier);
    if (!user || !(await this.passwords.verify(password, user.password))) {
      audit("AUTH_LOGIN_FAILED", { username: identifier }, 401);
      throw new ApiError(401, "LOGIN_FAILED", "Invalid username or password");
    }
    if (!user.active) {
      throw new ApiError(403, "ACCOUNT_INACTIVE", "Please verify your email via OTP to activate your account.");
    }
    const session = await this.create(user);
    audit("AUTH_LOGIN_SUCCESS", { username: user.username, role: user.role }, 200);
    return session;
  }

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) throw new ApiError(401, "REFRESH_TOKEN_REQUIRED", "No refresh token provided");
    const stored = await this.repository.findRefreshToken(refreshToken);
    if (!stored || stored.revoked || stored.expiresAt < new Date() || !stored.user.active) {
      if (stored) await this.repository.revokeRefreshToken(stored.id);
      throw new ApiError(401, "REFRESH_TOKEN_INVALID", "Invalid refresh token");
    }
    const token = tokenService.sign(stored.user);
    return { token, success: true };
  }

  async logout(refreshToken: string | undefined, audit: AuditRecorder) {
    if (refreshToken) await this.repository.revokeRefreshByToken(refreshToken);
    audit("AUTH_LOGOUT", undefined, 200);
    return { success: true };
  }

  async create(user: User) {
    const token = tokenService.sign(user);
    const refreshToken = crypto.randomBytes(40).toString("hex");
    await this.repository.createRefreshToken(user.id, refreshToken, new Date(Date.now() + REFRESH_TOKEN_TTL_MS));
    return { token, refreshToken, response: await this.userResponse(user, token) };
  }

  async userResponse(user: User, token: string) {
    return {
      token,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: `ROLE_${user.role}`,
      uiRole: roleToFrontend(user.role),
      permissions: Array.from(await (await import('../authorization/permissions.middleware.js')).getPermissionsForRole(user.role)),
      scope: { districtId: user.districtId, blockName: user.blockName, sectionName: user.sectionName },
      accessLabel: user.accessScope || user.role.replaceAll("_", " ")
    };
  }
}

export const sessionService = new SessionService(authRepository, passwordService);
