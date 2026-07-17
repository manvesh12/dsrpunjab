import { GeneratedDsrStatus, ModelDsrStatus, Prisma } from "@prisma/client";
import { assertProjectDistrictAccess } from "../authorization/project-access.policy.js";
import { ApiError } from "../common/exceptions/api-error.js";
import type { AuthUser } from "../authentication/auth-user.js";
import { modelDsrRepository, type ModelDsrRepositoryContract } from "./model-dsr.repository.js";
import { defaultModelDsrSections, isRecord, normalizeSections, parseProjectState, splitSections } from "./section-normalizer.js";

export class ModelDsrService {
  constructor(private readonly repository: ModelDsrRepositoryContract) {}

  listTemplates() { return this.repository.listTemplates(); }

  async create(body: any, user: AuthUser) {
    this.requireAdmin(user.role);
    const title = String(body?.title || "").trim();
    if (!title) throw new ApiError(400, "MODEL_DSR_TITLE_REQUIRED", "Title is required");
    const sections = normalizeSections(body?.sections, { district: body?.district || null, sourceFileName: body?.sourceFileName || null });
    try {
      return await this.repository.createTemplate({
        modelId: `MODEL-DSR-${Date.now()}`,
        title,
        description: body?.description ? String(body.description) : null,
        category: body?.category ? String(body.category) : null,
        district: body?.district ? String(body.district) : null,
        mineralType: body?.mineralType ? String(body.mineralType) : null,
        remarks: body?.remarks ? String(body.remarks) : null,
        visibility: body?.visibility ? String(body.visibility) : "DEPARTMENT_ONLY",
        status: ModelDsrStatus.DRAFT,
        createdBy: user.id,
        version: 1
      }, sections);
    } catch (error) { this.rethrowDatabase(error); }
  }

  async generate(body: any) {
    if (!body?.modelId || !body?.dataPayload) {
      throw new ApiError(400, "MODEL_DSR_GENERATE_INPUT_REQUIRED", "modelId and dataPayload are required");
    }
    const template = await this.repository.findTemplateSimple(String(body.modelId));
    if (!template || template.status !== ModelDsrStatus.PUBLISHED) {
      throw new ApiError(400, "MODEL_DSR_UNPUBLISHED", "Invalid or unpublished template");
    }
    return this.repository.createGenerated({
      modelId: String(body.modelId),
      projectId: body.projectId ? BigInt(body.projectId) : null,
      status: GeneratedDsrStatus.FINAL,
      dataPayload: (isRecord(body.dataPayload) ? body.dataPayload : {}) as Prisma.InputJsonObject
    });
  }

  listGenerated() { return this.repository.listGenerated(); }

  async getGenerated(id: string) {
    const generated = await this.repository.findGenerated(id);
    if (!generated) throw new ApiError(404, "GENERATED_DSR_NOT_FOUND", "Generated DSR not found");
    return generated;
  }

  async get(id: string) {
    const template = await this.repository.findTemplate(id);
    if (!template) throw new ApiError(404, "MODEL_DSR_NOT_FOUND", "Template not found");
    return template;
  }

  async update(id: string, body: any, user: AuthUser) {
    this.requireAdmin(user.role);
    const existing = await this.repository.findTemplateSimple(id);
    if (!existing) throw new ApiError(404, "MODEL_DSR_NOT_FOUND", "Template not found");
    if (existing.status === ModelDsrStatus.PUBLISHED) {
      throw new ApiError(409, "MODEL_DSR_PUBLISHED", "Cannot edit a published template. Create a new version.");
    }
    const sections = Array.isArray(body?.sections)
      ? normalizeSections(body.sections, { district: body?.district || existing.district || null, sourceFileName: body?.sourceFileName || null })
      : undefined;
    try {
      return await this.repository.updateTemplate(id, {
        title: body?.title ? String(body.title).trim() : existing.title,
        description: body?.description !== undefined ? String(body.description || "") : existing.description,
        category: body?.category !== undefined ? String(body.category || "") : existing.category,
        district: body?.district !== undefined ? String(body.district || "") : existing.district,
        mineralType: body?.mineralType !== undefined ? String(body.mineralType || "") : existing.mineralType,
        remarks: body?.remarks !== undefined ? String(body.remarks || "") : existing.remarks,
        visibility: body?.visibility !== undefined ? String(body.visibility || "") : existing.visibility
      }, sections);
    } catch (error) { this.rethrowDatabase(error); }
  }

  async publish(id: string, user: AuthUser) {
    this.requireAdmin(user.role);
    const template = await this.repository.findTemplate(id);
    if (!template) throw new ApiError(404, "MODEL_DSR_NOT_FOUND", "Template not found");
    if (!template.sections.length) await this.ensureTemplateSections(id);
    return this.repository.publish(id);
  }

  async delete(id: string, user: AuthUser) {
    this.requireAdmin(user.role);
    if (await this.repository.generatedCount(id) > 0) {
      return { message: "Template archived because it has existing reports", template: await this.repository.archive(id) };
    }
    await this.repository.deleteTemplate(id);
    return { message: "Template deleted permanently" };
  }

  async import(id: string, body: any, user: AuthUser) {
    if (!body?.projectId) throw new ApiError(400, "PROJECT_ID_REQUIRED", "projectId is required");
    let projectId: bigint;
    try { projectId = BigInt(body.projectId); }
    catch { throw new ApiError(400, "PROJECT_ID_INVALID", "Invalid projectId"); }
    await this.ensureTemplateSections(id);
    const template = await this.repository.findTemplate(id);
    if (!template) throw new ApiError(404, "MODEL_DSR_NOT_FOUND", "Model DSR not found");
    const project = await this.repository.findProject(projectId);
    if (!project) throw new ApiError(404, "TARGET_PROJECT_NOT_FOUND", "Target Project not found");
    assertProjectDistrictAccess(project, user);
    const config = body.config || {};
    const state = parseProjectState(project.projectState);
    const importedAt = new Date().toISOString();
    const { chapters, annexures } = splitSections(template.sections);
    if (config.backupCurrent) {
      state.__backup = JSON.parse(JSON.stringify(state));
      if (isRecord(state.__backup) && isRecord(state.__backup.__backup)) delete state.__backup.__backup;
    }
    state.modelDsrImported = true;
    state.modelDsrId = template.id;
    state.modelDsrTitle = template.title;
    state.modelDsrImportedAt = importedAt;
    state.modelDsrImportConfig = config;
    if (config.replaceChapters !== false) {
      state.importedChapters = chapters.map(section => ({
        id: section.id, name: section.sectionName, sequence: section.sequence,
        contentType: section.contentType, configuration: section.configuration
      }));
      state.chapters = chapters.map(section => ({ title: section.sectionName, modelDsrSectionId: section.id, importedAt }));
    }
    if (config.replaceAnnexures !== false) {
      state.importedAnnexures = annexures.map(section => ({
        id: section.id, name: section.sectionName, sequence: section.sequence,
        contentType: section.contentType, configuration: section.configuration
      }));
      state.modelDsrAnnexures = annexures.map(section => ({ title: section.sectionName, modelDsrSectionId: section.id, importedAt }));
    }
    if (config.keepAttachments) state.modelDsrKeptExistingAttachments = true;
    await this.repository.importIntoProject(
      projectId,
      JSON.stringify(state),
      `${template.title} imported into ${project.projectName || project.title || "project"}`,
      user.id
    );
    return {
      message: "Import successful",
      projectId: project.id.toString(),
      modelDsrId: template.id,
      chaptersImported: chapters.length,
      annexuresImported: annexures.length
    };
  }

  async duplicate(id: string, user: AuthUser) {
    this.requireAdmin(user.role);
    const original = await this.repository.findTemplateForDuplicate(id);
    if (!original) throw new ApiError(404, "MODEL_DSR_ORIGINAL_NOT_FOUND", "Original template not found");
    return this.repository.duplicate({
      modelId: `MODEL-DSR-${Date.now()}`,
      title: `${original.title} (Copy)`,
      description: original.description,
      category: original.category,
      district: original.district,
      mineralType: original.mineralType,
      remarks: original.remarks,
      visibility: original.visibility,
      status: ModelDsrStatus.DRAFT,
      createdBy: user.id,
      version: 1
    }, original.sections);
  }

  async preview(id: string) { return await this.repository.preview(id) || {}; }
  versions(id: string) { return this.repository.versions(id); }

  private async ensureTemplateSections(modelId: string) {
    if (await this.repository.sectionCount(modelId) === 0) {
      await this.repository.createSections(modelId, defaultModelDsrSections());
    }
  }

  private requireAdmin(role: string) {
    if (role !== "SUPER_ADMIN" && role !== "STATE_ADMIN") {
      throw new ApiError(403, "MODEL_DSR_ADMIN_REQUIRED", "Access denied. Only Admins can manage Model DSRs.");
    }
  }

  private rethrowDatabase(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError(409, "MODEL_DSR_TITLE_EXISTS", "A Model DSR with this title already exists");
    }
    throw error;
  }
}

export const modelDsrService = new ModelDsrService(modelDsrRepository);
