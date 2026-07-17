import { randomUUID } from "node:crypto";
import { assertProjectDistrictAccess } from "../authorization/project-access.policy.js";
import { ApiError } from "../common/exceptions/api-error.js";
import type { AuthUser } from "../authentication/auth-user.js";
import { storageService, type StorageService } from "../storage/storage.service.js";
import { CONTENT_TYPES_BY_EXTENSION } from "./upload.constants.js";
import { uploadsRepository, type UploadsRepositoryContract } from "./uploads.repository.js";
import { safeFileName, uploadProjectId, validateUpload } from "./upload.validator.js";

export type UploadFileInput = {
  projectIdValue: unknown;
  originalName: string;
  bytes: Buffer;
  declaredContentType?: string;
  moduleName?: string;
  requirementId?: string;
  uploadedBy?: string;
};

export class UploadsService {
  constructor(
    private readonly repository: UploadsRepositoryContract,
    private readonly storage: Pick<StorageService, "putFile" | "getFile" | "deleteFile">
  ) {}

  async upload(input: UploadFileInput, user: AuthUser) {
    const projectId = uploadProjectId(input.projectIdValue);
    const project = await this.repository.findProject(projectId);
    assertProjectDistrictAccess(project, user);

    const originalName = safeFileName(input.originalName);
    const extension = validateUpload(originalName, input.bytes);
    const contentType = input.declaredContentType || CONTENT_TYPES_BY_EXTENSION[extension] || "application/octet-stream";
    const moduleName = safeFileName(input.moduleName || "replenishment").replace(/\./g, "");
    const requirement = safeFileName(input.requirementId || "upload").replace(/\./g, "");
    const annexureId = `file-${moduleName}-${Date.now()}-${randomUUID()}`;
    const objectKey = `files/${projectId.toString()}/${moduleName}/${requirement}/${annexureId}-${originalName}`;

    await this.storage.putFile(objectKey, input.bytes, contentType);
    try {
      const file = await this.repository.create({
        projectId, annexureId, fileName: originalName, objectKey, contentType, sizeBytes: input.bytes.byteLength
      });
      return {
        success: true,
        id: file.id.toString(),
        originalName,
        fileName: file.fileName,
        savedName: file.annexureId,
        objectKey: file.objectKey,
        contentType: file.contentType,
        sizeBytes: file.sizeBytes,
        uploadedBy: input.uploadedBy || "",
        uploadedAt: file.createdAt.toISOString(),
        url: `/api/files/download/${encodeURIComponent(file.annexureId)}?inline=true`,
        downloadUrl: `/api/files/download/${encodeURIComponent(file.annexureId)}`
      };
    } catch (error) {
      await this.storage.deleteFile(objectKey).catch(() => undefined);
      throw error;
    }
  }

  async download(identifier: string, projectIdValue: string, user: AuthUser) {
    const file = await this.repository.find(identifier, projectIdValue);
    if (!file) throw new ApiError(404, "FILE_NOT_FOUND", "File not found");
    const project = await this.repository.findProject(file.projectId);
    assertProjectDistrictAccess(project, user);
    return { file, bytes: await this.storage.getFile(file.objectKey) };
  }

  async delete(identifier: string, projectIdValue: string, user: AuthUser) {
    const file = await this.repository.find(identifier, projectIdValue);
    if (!file) throw new ApiError(404, "FILE_NOT_FOUND", "File not found");
    const project = await this.repository.findProject(file.projectId);
    assertProjectDistrictAccess(project, user);
    await this.storage.deleteFile(file.objectKey).catch(() => undefined);
    await this.repository.delete(file.id);
    return { success: true, message: "File deleted" };
  }
}

export const uploadsService = new UploadsService(uploadsRepository, storageService);
