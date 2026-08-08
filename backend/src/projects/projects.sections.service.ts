import { prisma } from "../database/prisma.client.js";
import { ApiError } from "../common/exceptions/api-error.js";
import type { Prisma } from "@prisma/client";

export class ProjectsSectionsService {
  async saveDraft(projectId: bigint, draftContent: any) {
    const draft = await prisma.$transaction(async tx => {
      await this.requireUnlockedProject(tx, projectId);
      return tx.projectDraft.upsert({
        where: { projectId },
        create: { projectId, draftContent },
        update: { draftContent },
      });
    });
    return { success: true, updatedAt: draft.updatedAt };
  }

  async updateSection(projectId: bigint, sectionName: string, content: any, user: any, version?: number) {
    return prisma.$transaction(async tx => {
      await this.requireUnlockedProject(tx, projectId);
      const existing = await tx.projectSection.findUnique({
        where: { projectId_sectionName: { projectId, sectionName } }
      });

      if (existing) {
        if (existing.status === "LOCKED" && user?.role !== "ADMIN") {
          throw new ApiError(403, "FORBIDDEN", "Forbidden: This section is locked and can only be edited by an Admin.");
        }
        if (existing.status === "APPROVED" && user?.role === "OFFICER") {
          throw new ApiError(403, "FORBIDDEN", "Forbidden: Approved sections cannot be edited by Officers.");
        }

        if (version !== undefined && existing.version > version) {
          throw new ApiError(409, "CONFLICT", "Conflict: A newer version of this section has been saved by someone else.");
        }
      }

      const section = await tx.projectSection.upsert({
        where: { projectId_sectionName: { projectId, sectionName } },
        create: { projectId, sectionName, content, version: 1 },
        update: {
          content,
          version: { increment: 1 }
        }
      });

      if (user?.id) {
        await tx.projectAuditLog.create({
          data: {
            projectId,
            userId: user.id,
            action: `UPDATE_SECTION_${sectionName.toUpperCase()}`,
            oldValue: existing ? (existing.content as any) : undefined,
            newValue: content as any
          }
        });
      }

      return { success: true, version: section.version, updatedAt: section.updatedAt };
    });
  }

  private async requireUnlockedProject(tx: Prisma.TransactionClient, projectId: bigint) {
    const unlocked = await tx.project.updateMany({
      where: { id: projectId, phaseLocked: false },
      data: { phaseLocked: false }
    });
    if (unlocked.count !== 1) {
      throw new ApiError(409, "PROJECT_PHASE_LOCKED", "This project phase is locked and cannot be modified");
    }
  }
}

export const projectsSectionsService = new ProjectsSectionsService();
