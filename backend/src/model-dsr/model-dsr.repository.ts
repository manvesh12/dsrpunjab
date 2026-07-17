import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../database/prisma.client.js";
import type { NormalizedSection } from "./section-normalizer.js";

export class ModelDsrRepository {
  constructor(private readonly database: PrismaClient) {}

  listTemplates() {
    return this.database.modelDsr.findMany({ orderBy: { createdAt: "desc" }, include: { sections: { orderBy: { sequence: "asc" } } } });
  }
  createTemplate(data: Prisma.ModelDsrUncheckedCreateInput, sections: NormalizedSection[]) {
    return this.database.modelDsr.create({
      data: {
        ...data,
        sections: { create: sections.map(section => ({ ...section, configuration: section.configuration as Prisma.InputJsonObject, isIncluded: true })) }
      },
      include: { sections: { orderBy: { sequence: "asc" } } }
    });
  }
  findTemplate(id: string) {
    return this.database.modelDsr.findUnique({ where: { id }, include: { sections: { orderBy: { sequence: "asc" } } } });
  }
  findTemplateSimple(id: string) { return this.database.modelDsr.findUnique({ where: { id } }); }
  sectionCount(modelId: string) { return this.database.modelDsrSection.count({ where: { modelId } }); }
  async createSections(modelId: string, sections: NormalizedSection[]) {
    for (const section of sections) {
      await this.database.modelDsrSection.create({
        data: { modelId, ...section, configuration: section.configuration as Prisma.InputJsonObject }
      });
    }
  }
  async updateTemplate(id: string, data: Prisma.ModelDsrUncheckedUpdateInput, sections?: NormalizedSection[]) {
    await this.database.$transaction(async tx => {
      await tx.modelDsr.update({ where: { id }, data });
      if (sections) {
        await tx.modelDsrSection.deleteMany({ where: { modelId: id } });
        for (const section of sections) {
          await tx.modelDsrSection.create({
            data: { modelId: id, ...section, configuration: section.configuration as Prisma.InputJsonObject, isIncluded: true }
          });
        }
      }
    });
    return this.findTemplate(id);
  }
  publish(id: string) {
    return this.database.modelDsr.update({
      where: { id }, data: { status: "PUBLISHED" }, include: { sections: { orderBy: { sequence: "asc" } } }
    });
  }
  generatedCount(modelId: string) { return this.database.generatedDsr.count({ where: { modelId } }); }
  archive(id: string) { return this.database.modelDsr.update({ where: { id }, data: { status: "ARCHIVED" } }); }
  deleteTemplate(id: string) { return this.database.modelDsr.delete({ where: { id } }); }

  createGenerated(data: Prisma.GeneratedDsrUncheckedCreateInput) { return this.database.generatedDsr.create({ data }); }
  listGenerated() {
    return this.database.generatedDsr.findMany({ orderBy: { createdAt: "desc" }, include: { model: { select: { title: true } } } });
  }
  findGenerated(id: string) {
    return this.database.generatedDsr.findUnique({
      where: { id },
      include: { model: { include: { sections: { orderBy: { sequence: "asc" } } } }, versions: { orderBy: { createdAt: "desc" } } }
    });
  }

  findProject(id: bigint) { return this.database.project.findUnique({ where: { id } }); }
  importIntoProject(projectId: bigint, projectState: string, remarks: string, performedBy?: bigint) {
    return this.database.$transaction(async tx => {
      await tx.project.update({ where: { id: projectId }, data: { projectState } });
      await tx.workflowHistory.create({
        data: { reportId: projectId, action: "MODEL_DSR_IMPORTED", remarks, performedBy }
      });
    });
  }

  findTemplateForDuplicate(id: string) {
    return this.database.modelDsr.findUnique({ where: { id }, include: { sections: true } });
  }
  duplicate(data: Prisma.ModelDsrUncheckedCreateInput, sections: Array<{
    sectionName: string; sequence: number; contentType: any; configuration: Prisma.JsonValue; isIncluded: boolean; chapterType: string | null;
  }>) {
    return this.database.modelDsr.create({
      data: {
        ...data,
        sections: {
          create: sections.map(section => ({ ...section, configuration: section.configuration as Prisma.InputJsonObject }))
        }
      },
      include: { sections: { orderBy: { sequence: "asc" } } }
    });
  }
  preview(modelId: string) { return this.database.modelPreviewCache.findUnique({ where: { modelId } }); }
  versions(modelId: string) {
    return this.database.modelDsrVersion.findMany({ where: { modelId }, orderBy: { createdAt: "desc" } });
  }
}

export type ModelDsrRepositoryContract = Pick<
  ModelDsrRepository,
  "listTemplates" | "createTemplate" | "findTemplate" | "findTemplateSimple" | "sectionCount" | "createSections" |
  "updateTemplate" | "publish" | "generatedCount" | "archive" | "deleteTemplate" | "createGenerated" |
  "listGenerated" | "findGenerated" | "findProject" | "importIntoProject" | "findTemplateForDuplicate" |
  "duplicate" | "preview" | "versions"
>;

export const modelDsrRepository = new ModelDsrRepository(prisma);
