import { prisma } from "../database/prisma.client.js";
import { ApiError } from "../common/exceptions/api-error.js";
import type { Prisma } from "@prisma/client";

export class ProjectsSectionsService {

  async saveDraft(projectId: bigint, draftContent: any) {
    const draft = await prisma.projectDraft.upsert({
      where: { projectId },
      create: {
        projectId,
        draftContent: draftContent,
      },
      update: {
        draftContent: draftContent,
      },
    });
    return { success: true, updatedAt: draft.updatedAt };
  }

  async updateSection(projectId: bigint, sectionName: string, content: any, user: any, version?: number) {
    const existing = await prisma.projectSection.findUnique({
      where: { projectId_sectionName: { projectId, sectionName } }
    });

    if (existing) {
      // Role-Based Validation
      if (existing.status === 'LOCKED' && user?.role !== 'ADMIN') {
        throw new ApiError(403, "FORBIDDEN", "Forbidden: This section is locked and can only be edited by an Admin.");
      }
      if (existing.status === 'APPROVED' && user?.role === 'OFFICER') {
        throw new ApiError(403, "FORBIDDEN", "Forbidden: Approved sections cannot be edited by Officers.");
      }

      // Optimistic Locking check
      if (version !== undefined && existing.version > version) {
        throw new ApiError(409, "CONFLICT", "Conflict: A newer version of this section has been saved by someone else.");
      }
    }

    const section = await prisma.projectSection.upsert({
      where: {
        projectId_sectionName: { projectId, sectionName }
      },
      create: {
        projectId,
        sectionName,
        content: content,
        version: 1,
      },
      update: {
        content: content,
        version: {
          increment: 1
        }
      }
    });

    if (user && user.id) {
      await prisma.projectAuditLog.create({
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
  }
}

export const projectsSectionsService = new ProjectsSectionsService();
