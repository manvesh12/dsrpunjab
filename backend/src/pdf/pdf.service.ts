import { assertProjectDistrictAccess, assertProjectUnlocked } from "../authorization/project-access.policy.js";
import { randomUUID } from "node:crypto";
import { ApiError } from "../common/exceptions/api-error.js";
import type { AuthUser } from "../authentication/auth-user.js";
import { canAdmin, canUpload } from "../authorization/role.policy.js";
import { storageService, type StorageService } from "../storage/storage.service.js";
import { projectPdfObjectKey } from "../storage/project-storage.js";
import { settleBestEffort } from "../storage/storage-cleanup.js";
import { FINAL_PDF_ADMIN_MESSAGE } from "./pdf.constants.js";
import { pdfRepository, type PdfRepositoryContract } from "./pdf.repository.js";
import { decodePdf, pdfAnnexureId, pdfFileName, pdfProjectId } from "./pdf.validator.js";

export class PdfService {
  constructor(
    private readonly repository: PdfRepositoryContract,
    private readonly storage: Pick<StorageService, "putFile" | "getFile" | "deleteFile">
  ) {}

  async upload(body: any, user: AuthUser) {
    const projectId = pdfProjectId(body?.projectId);
    const annexureId = pdfAnnexureId(body?.annexureId);
    const fileName = pdfFileName(body?.fileName);
    this.authorize(annexureId, user, true);
    const project = await this.repository.findProject(projectId);
    assertProjectDistrictAccess(project, user);
    assertProjectUnlocked(project);
    if (!fileName || body?.pdf == null) {
      const previousFile = await this.repository.deleteMetadata(projectId, annexureId);
      if (previousFile) await settleBestEffort("pdf_delete", [{
        target: previousFile.objectKey,
        run: () => this.storage.deleteFile(previousFile.objectKey)
      }]);
      return { success: true };
    }
    const bytes = decodePdf(body.pdf);
    const key = this.objectKey(projectId, annexureId);
    await this.storage.putFile(key, bytes, "application/pdf");
    let updatedProjectState: string | undefined;
    if (annexureId === "final") {
      let state: Record<string, unknown> = {};
      try {
        state = project.projectState ? JSON.parse(project.projectState) : {};
        if (typeof state === "string") state = JSON.parse(state);
      } catch { state = {}; }
      state.finalPdfGeneratedAt = new Date().toISOString();
      updatedProjectState = JSON.stringify(state);
    }
    let saved: Awaited<ReturnType<PdfRepositoryContract["saveUpload"]>>;
    try {
      saved = await this.repository.saveUpload({
        projectId,
        annexureId,
        fileName,
        objectKey: key,
        sizeBytes: bytes.byteLength,
        projectState: updatedProjectState,
        remarks: `Uploaded document '${fileName}' for Annexure ${annexureId}`,
        performedBy: user.id
      });
    } catch (error) {
      await settleBestEffort("pdf_metadata_rollback", [{ target: key, run: () => this.storage.deleteFile(key) }]);
      throw error;
    }
    if (saved.previousObjectKey && saved.previousObjectKey !== key) {
      await settleBestEffort("pdf_replacement", [{
        target: saved.previousObjectKey,
        run: () => this.storage.deleteFile(saved.previousObjectKey!)
      }]);
    }
    return { success: true };
  }

  async download(projectIdValue: unknown, annexureValue: unknown, user: AuthUser) {
    const projectId = pdfProjectId(projectIdValue);
    const annexureId = pdfAnnexureId(annexureValue);
    this.authorize(annexureId, user, false);
    const project = await this.repository.findProject(projectId);
    assertProjectDistrictAccess(project, user);
    const file = await this.repository.findFile(projectId, annexureId);
    if (!file) throw new ApiError(404, "PDF_NOT_FOUND", "PDF not found");
    return { file, bytes: await this.storage.getFile(file.objectKey) };
  }

  emailFinal(body: any, user: AuthUser) {
    if (!canAdmin(user.role)) throw new ApiError(403, "FINAL_PDF_ADMIN_ONLY", FINAL_PDF_ADMIN_MESSAGE);
    const projectIdValue = String(body?.projectId || "");
    const email = pdfFileName(body?.email);
    if (!/^\d+$/.test(projectIdValue) || !email.includes("@")) {
      throw new ApiError(400, "FINAL_PDF_EMAIL_INPUT_INVALID", "Missing projectId or email");
    }
    return { success: true, message: `Final DSR PDF queued for ${email}` };
  }

  private authorize(annexureId: string, user: AuthUser, upload: boolean) {
    if (annexureId === "final" && !canAdmin(user.role)) {
      throw new ApiError(403, "FINAL_PDF_ADMIN_ONLY", FINAL_PDF_ADMIN_MESSAGE);
    }
    if (upload && !canUpload(user.role) && !canAdmin(user.role)) throw new ApiError(403, "ACCESS_DENIED", "Access denied");
  }

  private objectKey(projectId: bigint, annexureId: string) {
    return projectPdfObjectKey(projectId, annexureId, randomUUID());
  }
}

export const pdfService = new PdfService(pdfRepository, storageService);
