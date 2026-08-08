import { randomUUID } from "node:crypto";
import { assertProjectDistrictAccess, assertProjectUnlocked } from "../authorization/project-access.policy.js";
import { ApiError } from "../common/exceptions/api-error.js";
import type { AuthUser } from "../authentication/auth-user.js";
import { storageService, type StorageService } from "../storage/storage.service.js";
import { projectFileObjectKey } from "../storage/project-storage.js";
import { settleBestEffort } from "../storage/storage-cleanup.js";
import { CONTENT_TYPES_BY_EXTENSION } from "./upload.constants.js";
import { uploadsRepository, type UploadsRepositoryContract } from "./uploads.repository.js";
import { displayFileName, safeFileName, uploadProjectId, validateUpload } from "./upload.validator.js";

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
    assertProjectUnlocked(project);

    const originalName = displayFileName(input.originalName);
    const storedFileName = safeFileName(originalName);
    const extension = validateUpload(originalName, input.bytes);
    const contentType = CONTENT_TYPES_BY_EXTENSION[extension] || input.declaredContentType || "application/octet-stream";
    const moduleName = this.storageSegment(input.moduleName, "uploads");
    const requirement = this.storageSegment(input.requirementId, "upload");
    const annexureId = `file-${moduleName}-${Date.now()}-${randomUUID()}`;
    const objectKey = projectFileObjectKey(
      projectId,
      moduleName,
      requirement,
      `${annexureId}-${storedFileName}`
    );

    await this.storage.putFile(objectKey, input.bytes, contentType);
    try {
      const file = await this.repository.create({
        projectId, annexureId, fileName: originalName, objectKey, contentType, sizeBytes: input.bytes.byteLength
      });
      return this.metadata(file, projectId, input.uploadedBy || "");
    } catch (error) {
      await settleBestEffort("generic_upload_metadata_rollback", [{
        target: objectKey,
        run: () => this.storage.deleteFile(objectKey)
      }]);
      throw error;
    }
  }

  async list(
    projectIdValue: unknown,
    moduleNameValue: unknown,
    requirementIdValue: unknown,
    user: AuthUser
  ) {
    const projectId = uploadProjectId(projectIdValue);
    const project = await this.repository.findProject(projectId);
    assertProjectDistrictAccess(project, user);
    assertProjectUnlocked(project);
    const moduleName = this.storageSegment(moduleNameValue, "");
    const requirement = this.storageSegment(requirementIdValue, "");
    if (Boolean(moduleName) !== Boolean(requirement)) {
      throw new ApiError(400, "FILE_FILTER_INVALID", "module and requirementId must be provided together");
    }
    const prefixes = moduleName && requirement ? [
      projectFileObjectKey(projectId, moduleName, requirement, ""),
      `files/${projectId.toString()}/${moduleName}/${requirement}/`
    ] : [];
    const files = await this.repository.list(projectId, prefixes);
    return files.map(file => this.metadata(file, projectId));
  }

  async download(identifier: string, projectIdValue: string, user: AuthUser) {
    const projectId = uploadProjectId(projectIdValue);
    const file = await this.repository.find(identifier, projectId.toString());
    if (!file) throw new ApiError(404, "FILE_NOT_FOUND", "File not found");
    const project = await this.repository.findProject(file.projectId);
    assertProjectDistrictAccess(project, user);
    return { file, bytes: await this.storage.getFile(file.objectKey) };
  }

  async delete(identifier: string, projectIdValue: string, user: AuthUser) {
    const projectId = uploadProjectId(projectIdValue);
    const file = await this.repository.find(identifier, projectId.toString());
    if (!file) throw new ApiError(404, "FILE_NOT_FOUND", "File not found");
    const project = await this.repository.findProject(file.projectId);
    assertProjectDistrictAccess(project, user);
    assertProjectUnlocked(project);
    await this.repository.delete(file.id);
    await settleBestEffort("generic_file_delete", [{
      target: file.objectKey,
      run: () => this.storage.deleteFile(file.objectKey)
    }]);
    return { success: true, message: "File deleted" };
  }

  private storageSegment(value: unknown, fallback: string) {
    const raw = String(value || "").trim();
    if (!raw) return fallback;
    const normalized = safeFileName(raw).replace(/\./g, "");
    return normalized || fallback;
  }

  private metadata(file: {
    id: bigint;
    annexureId: string;
    fileName: string;
    objectKey: string;
    contentType: string;
    sizeBytes: number;
    createdAt: Date;
  }, projectId: bigint, uploadedBy = "") {
    return {
      success: true,
      id: file.id.toString(),
      originalName: file.fileName,
      fileName: file.fileName,
      savedName: file.annexureId,
      objectKey: file.objectKey,
      contentType: file.contentType,
      sizeBytes: file.sizeBytes,
      uploadedBy,
      uploadedAt: file.createdAt.toISOString(),
      url: `/api/files/download/${encodeURIComponent(file.annexureId)}?projectId=${projectId.toString()}&inline=true`,
      downloadUrl: `/api/files/download/${encodeURIComponent(file.annexureId)}?projectId=${projectId.toString()}`
    };
  }
}

export const uploadsService = new UploadsService(uploadsRepository, storageService);
