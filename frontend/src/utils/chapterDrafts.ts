export type ChapterFile = {
  name: string;
  preview?: string;
  id?: string;
  savedName?: string;
};

export type ChapterDraft = {
  slotId: string;
  name: string;
  summary: string;
  file?: ChapterFile;
};

const chapterDefinitions = [
  [
    "CHAPTER 1 - INTRODUCTION",
    "Overview of the district and purpose of the DSR under EMGSM 2020 guidelines.",
  ],
  [
    "CHAPTER 2 - OVERVIEW OF MINING ACTIVITIES IN THE DISTRICT",
    "Current and historical sand mining activities, lease details, and district statistics.",
  ],
  [
    "CHAPTER 3 - PROCESS OF DEPOSITION OF SEDIMENTS IN THE RIVERS OF THE DISTRICT",
    "River morphology, sedimentation rates, and annual replenishment estimates.",
  ],
  [
    "CHAPTER 4 - GENERAL PROFILE OF THE DISTRICT",
    "Geographic, demographic, and administrative profile of the district.",
  ],
  [
    "CHAPTER 5 - PHYSIOGRAPHY OF THE DISTRICT",
    "Terrain, drainage patterns, river systems, and physical features.",
  ],
  [
    "CHAPTER 6 - GEOLOGY AND MINERAL WEALTH",
    "Geological formations, mineral deposits, and subsurface characteristics.",
  ],
  [
    "CHAPTER 7 - ESTIMATION OF DEPOSITS AND REPLENISHMENT STUDIES",
    "Scientific estimation of available sand deposits and annual natural replenishment.",
  ],
  [
    "CHAPTER 8 - TRANSPORT",
    "Transportation infrastructure, road conditions, and logistics for mining operations.",
  ],
  [
    "CHAPTER 9 - REMEDIAL MEASURE TO MITIGATE THE IMPACT OF MINING",
    "Environmental safeguards, monitoring mechanisms, and impact mitigation plans.",
  ],
  [
    "CHAPTER 10 - CONCLUSION",
    "Summary findings, recommendations, and compliance declarations.",
  ],
] as const;

export const defaultChapters: ChapterDraft[] = chapterDefinitions.map(
  ([name, summary], index) => ({
    slotId: `chapter-${index + 1}`,
    name,
    summary,
  }),
);

export function migrateChapters(value: unknown): ChapterDraft[] {
  const source = Array.isArray(value) ? value : defaultChapters;
  const usedSlots = new Set<string>();
  return source.map((candidate, index) => {
    const chapter =
      candidate && typeof candidate === "object"
        ? (candidate as Partial<ChapterDraft>)
        : {};
    const baseSlot = normalizeSlotId(chapter.slotId, `chapter-${index + 1}`);
    let slotId = baseSlot;
    let suffix = 2;
    while (usedSlots.has(slotId)) slotId = `${baseSlot}-${suffix++}`;
    usedSlots.add(slotId);
    return {
      slotId,
      name: String(chapter.name || `CHAPTER ${index + 1}`),
      summary: String(chapter.summary || ""),
      file: chapter.file,
    };
  });
}

export function createUploadSlotId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function normalizeSlotId(value: unknown, fallback: string) {
  const normalized = String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
  return normalized || fallback;
}
