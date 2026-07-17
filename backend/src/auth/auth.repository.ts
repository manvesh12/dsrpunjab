import type { Invitation, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../database/prisma.client.js";

export class AuthRepository {
  constructor(private readonly database: PrismaClient) {}

  findLoginUser(identifier: string) {
    return this.database.user.findFirst({ where: { OR: [{ username: identifier }, { email: identifier }] } });
  }
  findUserByIdentifier(identifier: string) {
    return this.database.user.findFirst({ where: { OR: [{ email: identifier }, { mobileNumber: identifier }] } });
  }
  findUserByEmail(email: string) { return this.database.user.findUnique({ where: { email } }); }
  findOtherUserByMobile(mobileNumber: string, email: string) {
    return this.database.user.findFirst({ where: { mobileNumber, NOT: { email } } });
  }
  activateUser(email: string) { return this.database.user.update({ where: { email }, data: { active: true } }); }
  updateUserPassword(id: bigint, password: string) { return this.database.user.update({ where: { id }, data: { password } }); }

  createRefreshToken(userId: bigint, token: string, expiresAt: Date) {
    return this.database.refreshToken.create({ data: { userId, token, expiresAt } });
  }
  findRefreshToken(token: string) {
    return this.database.refreshToken.findUnique({ where: { token }, include: { user: true } });
  }
  revokeRefreshToken(id: bigint) { return this.database.refreshToken.update({ where: { id }, data: { revoked: true } }); }
  revokeRefreshByToken(token: string) { return this.database.refreshToken.updateMany({ where: { token }, data: { revoked: true } }); }
  revokeUserRefreshTokens(userId: bigint) {
    return this.database.refreshToken.updateMany({ where: { userId }, data: { revoked: true } });
  }

  findOtp(identifier: string, purposes: string[]) {
    return this.database.otpVerification.findFirst({
      where: { identifier, purpose: { in: purposes }, used: false },
      orderBy: { createdAt: "desc" }
    });
  }
  incrementOtpAttempts(id: bigint) {
    return this.database.otpVerification.update({ where: { id }, data: { attemptCount: { increment: 1 } } });
  }
  markOtpUsed(id: bigint) { return this.database.otpVerification.update({ where: { id }, data: { used: true } }); }
  expireOtps(identifier: string, purpose: string) {
    return this.database.otpVerification.updateMany({ where: { identifier, purpose, used: false }, data: { used: true } });
  }
  createOtp(identifier: string, purpose: string, otpHash: string, expiresAt: Date) {
    return this.database.otpVerification.create({ data: { identifier, purpose, otpHash, expiresAt } });
  }

  findLatestReset(identifier: string) {
    return this.database.passwordResetRequest.findFirst({ where: { identifier, used: false }, orderBy: { createdAt: "desc" } });
  }
  countRecentResets(identifier: string, since: Date) {
    return this.database.passwordResetRequest.count({ where: { identifier, createdAt: { gte: since } } });
  }
  expireUserResets(userId: bigint) {
    return this.database.passwordResetRequest.updateMany({ where: { userId, used: false }, data: { used: true } });
  }
  createReset(userId: bigint, identifier: string, otpHash: string, expiresAt: Date) {
    return this.database.passwordResetRequest.create({ data: { userId, identifier, otpHash, expiresAt } });
  }
  incrementResetAttempts(id: bigint) {
    return this.database.passwordResetRequest.update({ where: { id }, data: { attemptCount: { increment: 1 } } });
  }
  markResetUsed(id: bigint) { return this.database.passwordResetRequest.update({ where: { id }, data: { used: true } }); }

  findInvitation(token: string) { return this.database.invitation.findFirst({ where: { token } }); }
  updateInvitation(id: string, data: Prisma.InvitationUncheckedUpdateInput) {
    return this.database.invitation.update({ where: { id }, data });
  }

  completeInvitation(invitation: Invitation, otpId: bigint, profile: Record<string, any>) {
    return this.database.$transaction(async tx => {
      await tx.otpVerification.update({ where: { id: otpId }, data: { used: true } });
      const user = await tx.user.create({
        data: {
          username: invitation.email,
          email: invitation.email,
          fullName: String(profile.fullName || invitation.fullName || invitation.email),
          mobileNumber: String(profile.mobileNumber || invitation.mobileNumber || ""),
          password: invitation.pendingPasswordHash!,
          role: invitation.role,
          districtId: invitation.district ? BigInt(invitation.district) : null,
          active: true,
          accessScope: invitation.designation || invitation.department || undefined
        }
      });
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: "REGISTERED", registeredAt: new Date(), pendingPasswordHash: null }
      });
      return user;
    });
  }
}

export type AuthRepositoryContract = Pick<
  AuthRepository,
  "findLoginUser" | "findUserByIdentifier" | "findUserByEmail" | "findOtherUserByMobile" | "activateUser" |
  "updateUserPassword" | "createRefreshToken" | "findRefreshToken" | "revokeRefreshToken" | "revokeRefreshByToken" |
  "revokeUserRefreshTokens" | "findOtp" | "incrementOtpAttempts" | "markOtpUsed" | "expireOtps" | "createOtp" |
  "findLatestReset" | "countRecentResets" | "expireUserResets" | "createReset" | "incrementResetAttempts" |
  "markResetUsed" | "findInvitation" | "updateInvitation" | "completeInvitation"
>;

export const authRepository = new AuthRepository(prisma);
