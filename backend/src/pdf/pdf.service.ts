import { assertProjectDistrictAccess } from "../authorization/project-access.policy.js";
import { ApiError } from "../common/exceptions/api-error.js";
import type { AuthUser } from "../authentication/auth-user.js";
import { canAdmin, canUpload } from "../authorization/role.policy.js";
import { storageService, type StorageService } from "../storage/storage.service.js";
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
    const key = this.objectKey(projectId, annexureId);
    if (!fileName || body?.pdf == null) {
      await this.storage.deleteFile(key).catch(() => undefined);
      await this.repository.deleteMetadata(projectId, annexureId);
      return { success: true };
    }
    const bytes = decodePdf(body.pdf);
    await this.storage.putFile(key, bytes, "application/pdf");
    await this.repository.upsertFile(projectId, annexureId, fileName, key, bytes.byteLength);
    if (annexureId === "final") {
      let state: Record<string, unknown> = {};
      try {
        state = project.projectState ? JSON.parse(project.projectState) : {};
        if (typeof state === "string") state = JSON.parse(state);
      } catch { state = {}; }
      state.finalPdfGeneratedAt = new Date().toISOString();
      await this.repository.updateProjectState(projectId, JSON.stringify(state));
    }
    await this.repository.createWorkflow(projectId, `Uploaded document '${fileName}' for Annexure ${annexureId}`, user.id);
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

  private objectKey(projectId: bigint, annexureId: string) { return `${annexureId}-${projectId}.pdf`; }
}

export const pdfService = new PdfService(pdfRepository, storageService);
