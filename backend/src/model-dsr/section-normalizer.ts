import { SectionContentType, type Prisma } from "@prisma/client";

export type NormalizedSection = {
  sectionName: string;
  sequence: number;
  contentType: SectionContentType;
  configuration: Record<string, unknown>;
};

export function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizedContentType(value: unknown): SectionContentType {
  const normalized = String(value || "").toUpperCase();
  return (Object.values(SectionContentType) as string[]).includes(normalized)
    ? normalized as SectionContentType
    : SectionContentType.TEXT;
}

export function defaultModelDsrSections(context: Record<string, unknown> = {}): NormalizedSection[] {
  const chapters = [
    "Introduction", "Overview of Mining Activity", "General Profile of the District", "Geology and Mineral Wealth",
    "Drainage and River System", "Mineral Potential", "Replenishment Study", "Environmental Management Plan",
    "Cluster and Transportation Details", "Recommendations"
  ];
  const annexures = [
    "Annexure A - Mining Lease Details", "Annexure B - Production Details", "Annexure C - Replenishment Data",
    "Annexure D - Environmental Safeguards", "Annexure E - Public Consultation Records"
  ];
  return [
    ...chapters.map((name, index) => ({
      sectionName: `Chapter ${index + 1} - ${name}`,
      sequence: index + 1,
      contentType: SectionContentType.TEXT,
      configuration: { kind: "chapter", chapterNo: index + 1, source: "model-dsr", ...context }
    })),
    ...annexures.map((name, index) => ({
      sectionName: name,
      sequence: chapters.length + index + 1,
      contentType: SectionContentType.TABLE,
      configuration: { kind: "annexure", annexureNo: index + 1, source: "model-dsr", ...context }
    }))
  ];
}

export function normalizeSections(sections: unknown, context: Record<string, unknown> = {}) {
  if (!Array.isArray(sections) || sections.length === 0) return defaultModelDsrSections(context);
  return sections.map((raw, index) => {
    const section = isRecord(raw) ? raw : {};
    const configuration = isRecord(section.configuration) ? section.configuration : {};
    const name = String(section.sectionName || section.name || `Section ${index + 1}`).trim();
    return {
      sectionName: name || `Section ${index + 1}`,
      sequence: index + 1,
      contentType: normalizedContentType(section.contentType),
      configuration: { ...configuration, ...context }
    };
  });
}

export function splitSections(sections: Array<{
  id: string; sectionName: string; sequence: number; contentType: SectionContentType; configuration: Prisma.JsonValue;
}>) {
  const ordered = [...sections].sort((a, b) => a.sequence - b.sequence);
  return {
    chapters: ordered.filter(section => !section.sectionName.toLowerCase().includes("annexure")),
    annexures: ordered.filter(section => section.sectionName.toLowerCase().includes("annexure"))
  };
}

export function parseProjectState(value?: string | null): Record<string, any> {
  if (!value) return {};
  try { const parsed = JSON.parse(value); return isRecord(parsed) ? parsed : {}; }
  catch { return {}; }
}
