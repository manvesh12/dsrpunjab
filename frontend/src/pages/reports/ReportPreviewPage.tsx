import { Download, LoaderCircle, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { uploadsApi, type FileMetadata } from "../../api/uploads.api";
import PageHeader from "../../components/layout/PageHeader";
import { useLocalDraft } from "../../hooks/useLocalDraft";
import {
  defaultChapters,
  migrateChapters,
  type ChapterDraft,
  type ChapterFile,
} from "../../utils/chapterDrafts";

const MAX_INLINE_PREVIEW_BYTES = 10 * 1024 * 1024;
const frontMatterOrder = ["cover", "certificate", "contents", "preface"];
const frontMatterTitles: Record<string, string> = {
  cover: "Cover Page",
  certificate: "Certificate of Compliance",
  contents: "Content Page",
  preface: "Preface",
};

type UploadRecord = ChapterFile;
type LocatedFile = {
  metadata: FileMetadata;
  moduleName: string;
  requirementId: string;
  title: string;
};
type PreviewDocument = LocatedFile & { src?: string };
type RemotePreviewState = {
  projectId: string;
  status: "ready" | "error";
  documents: PreviewDocument[];
};
type LocalDocuments = {
  cover: UploadRecord | null;
  certificate: UploadRecord | null;
  contents: UploadRecord | null;
  preface: UploadRecord | null;
  chapters: ChapterDraft[];
};

function UploadedPreview({
  src,
  title,
  contentType,
}: {
  src: string;
  title: string;
  contentType?: string;
}) {
  const image =
    src.startsWith("data:image") || contentType?.startsWith("image/");
  return image ? (
    <div className="mb-12 flex flex-col items-center">
      <h2 className="mb-4 text-xl font-bold">{title}</h2>
      <img
        src={src}
        alt={`Uploaded preview for ${title}`}
        className="w-full border border-slate-200 shadow-md"
      />
    </div>
  ) : (
    <div className="mb-12 flex w-full flex-col items-center">
      <h2 className="mb-4 text-xl font-bold">{title}</h2>
      <iframe
        title={`Uploaded PDF preview for ${title}`}
        src={src}
        className="h-[1400px] w-full border border-slate-200 bg-white shadow-md"
      />
    </div>
  );
}

export default function ReportPreviewPage() {
  const { projectId = "default" } = useParams();
  const [cover] = useLocalDraft<UploadRecord | null>(
    `project-${projectId}:cover`,
    null,
  );
  const [certificate] = useLocalDraft<UploadRecord | null>(
    `project-${projectId}:certificate`,
    null,
  );
  const [contents] = useLocalDraft<UploadRecord | null>(
    `project-${projectId}:contents`,
    null,
  );
  const [preface] = useLocalDraft<UploadRecord | null>(
    `project-${projectId}:preface`,
    null,
  );
  const [chapters] = useLocalDraft<ChapterDraft[]>(
    `project-${projectId}:chapters-exact`,
    defaultChapters,
    { legacyKeys: ["chapters-exact"], migrate: migrateChapters },
  );
  const [remoteState, setRemoteState] = useState<RemotePreviewState | null>(
    null,
  );

  useEffect(() => {
    if (!/^\d+$/.test(projectId)) return;
    let active = true;
    const objectUrls: string[] = [];
    const local: LocalDocuments = {
      cover,
      certificate,
      contents,
      preface,
      chapters,
    };

    void uploadsApi
      .list({ projectId })
      .then(async (files) => {
        const selected = selectReportFiles(files, chapters);
        return Promise.all(
          selected.map(async (file): Promise<PreviewDocument> => {
            const localFile = matchingLocalFile(file, local);
            const localPreview =
              matchesMetadata(localFile, file.metadata) &&
              localFile?.preview?.startsWith("data:")
                ? localFile.preview
                : undefined;
            if (localPreview) return { ...file, src: localPreview };
            if (file.metadata.sizeBytes > MAX_INLINE_PREVIEW_BYTES) return file;
            try {
              const blob = await uploadsApi.downloadBlob(
                file.metadata.savedName || file.metadata.id,
                projectId,
              );
              if (!active) return file;
              const src = URL.createObjectURL(blob);
              objectUrls.push(src);
              return { ...file, src };
            } catch {
              return file;
            }
          }),
        );
      })
      .then((documents) => {
        if (active) {
          setRemoteState({ projectId, status: "ready", documents });
        }
      })
      .catch(() => {
        if (active) {
          setRemoteState({ projectId, status: "error", documents: [] });
        }
      });

    return () => {
      active = false;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [certificate, chapters, contents, cover, preface, projectId]);

  const activeRemote =
    remoteState?.projectId === projectId ? remoteState : null;
  const local: LocalDocuments = {
    cover,
    certificate,
    contents,
    preface,
    chapters,
  };
  const documents =
    activeRemote?.status === "ready"
      ? mergeRemoteDocuments(
          activeRemote.documents,
          localPreviewDocuments(local, false),
        )
      : localPreviewDocuments(local, true);

  const downloadFinalPdf = () => {
    const pdf = new jsPDF();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("DISTRICT SURVEY REPORT", 105, 25, { align: "center" });
    pdf.setFontSize(10);
    pdf.text("Government of Punjab • 2025-26", 105, 33, {
      align: "center",
    });
    pdf.text(
      "Note: PDF combination of uploaded files is a backend feature.",
      105,
      50,
      { align: "center" },
    );
    pdf.save(`DSR-Final-Report-${projectId}.pdf`);
  };

  return (
    <>
      <PageHeader
        title="Live Report Preview"
        description={`Continuous compiled preview of all uploaded documents for project #${projectId}`}
        action={
          <div className="flex gap-2">
            <button className="module-btn" onClick={() => window.print()}>
              <Printer size={17} />
              Print
            </button>
            <button className="module-btn-primary" onClick={downloadFinalPdf}>
              <Download size={17} />
              Download Final PDF
            </button>
          </div>
        }
      />

      <main className="overflow-y-auto rounded-2xl border border-slate-200 bg-slate-100 p-4 md:p-8">
        <article className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-col items-center bg-white px-4 py-16 shadow-xl md:px-12">
          {!documents.length ? (
            <div className="flex min-h-[500px] flex-col items-center justify-center text-center">
              <p className="max-w-md text-lg text-slate-500">
                No documents have been uploaded yet. Please upload files in the
                project editor to see the continuous live preview here.
              </p>
            </div>
          ) : (
            <div className="flex w-full flex-col items-center gap-16">
              {documents.map((document) =>
                document.src ? (
                  <UploadedPreview
                    key={document.metadata.id}
                    src={document.src}
                    title={document.title}
                    contentType={document.metadata.contentType}
                  />
                ) : (
                  <AuthenticatedDownloadCard
                    key={document.metadata.id}
                    document={document}
                    projectId={projectId}
                  />
                ),
              )}
              <div className="mt-12 flex w-full flex-col items-center border-t-2 border-dashed border-slate-300 pt-12 text-slate-400">
                <p>End of Report Document</p>
              </div>
            </div>
          )}
        </article>
      </main>
    </>
  );
}

function AuthenticatedDownloadCard({
  document,
  projectId,
}: {
  document: PreviewDocument;
  projectId: string;
}) {
  const [downloading, setDownloading] = useState(false);
  const download = async () => {
    setDownloading(true);
    try {
      const blob = await uploadsApi.downloadBlob(
        document.metadata.savedName || document.metadata.id,
        projectId,
      );
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = document.metadata.originalName;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch {
      toast.error("File could not be downloaded.");
    } finally {
      setDownloading(false);
    }
  };
  return (
    <div className="flex w-full flex-col items-center rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center">
      <h2 className="text-xl font-bold">{document.title}</h2>
      <p className="mt-2 text-sm text-slate-500">
        {document.metadata.originalName} •{" "}
        {formatBytes(document.metadata.sizeBytes)}
      </p>
      <button
        type="button"
        onClick={download}
        disabled={downloading}
        className="module-btn-primary mt-5"
      >
        {downloading ? (
          <LoaderCircle size={17} className="animate-spin" />
        ) : (
          <Download size={17} />
        )}
        {downloading ? "Downloading..." : "Download file"}
      </button>
    </div>
  );
}

function selectReportFiles(files: FileMetadata[], chapters: ChapterDraft[]) {
  const located = files.flatMap((metadata) => {
    const location = objectKeyLocation(metadata.objectKey);
    if (!location || !isPreviewable(metadata)) return [];
    return [
      {
        metadata,
        ...location,
        title: reportFileTitle(location, metadata, chapters),
      } satisfies LocatedFile,
    ];
  });
  const newestBySlot = new Map<string, LocatedFile>();
  const multiFile: LocatedFile[] = [];
  for (const file of located) {
    if (["front-matter", "chapters", "plates"].includes(file.moduleName)) {
      const key = `${file.moduleName}/${file.requirementId}`;
      const current = newestBySlot.get(key);
      if (
        !current ||
        Date.parse(file.metadata.uploadedAt) >
          Date.parse(current.metadata.uploadedAt)
      ) {
        newestBySlot.set(key, file);
      }
    } else {
      multiFile.push(file);
    }
  }
  const chapterOrder = new Map(
    chapters.map((chapter, index) => [chapter.slotId, index]),
  );
  return [...newestBySlot.values(), ...multiFile].sort((left, right) => {
    const leftOrder = reportOrder(left, chapterOrder);
    const rightOrder = reportOrder(right, chapterOrder);
    return leftOrder.localeCompare(rightOrder);
  });
}

function objectKeyLocation(objectKey: string) {
  const segments = String(objectKey || "")
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean);
  const filesIndex = segments.indexOf("files");
  if (filesIndex < 0) return null;
  const legacy = filesIndex === 0;
  const moduleIndex = legacy ? filesIndex + 2 : filesIndex + 1;
  const requirementIndex = moduleIndex + 1;
  const moduleName = segments[moduleIndex];
  const requirementId = segments[requirementIndex];
  return moduleName && requirementId ? { moduleName, requirementId } : null;
}

function reportFileTitle(
  location: { moduleName: string; requirementId: string },
  metadata: FileMetadata,
  chapters: ChapterDraft[],
) {
  if (location.moduleName === "front-matter") {
    return (
      frontMatterTitles[location.requirementId] ||
      humanize(location.requirementId)
    );
  }
  if (location.moduleName === "chapters") {
    return (
      chapters.find((chapter) => chapter.slotId === location.requirementId)
        ?.name || humanize(location.requirementId)
    );
  }
  if (location.moduleName === "plates") {
    return `Plate: ${metadata.originalName}`;
  }
  if (location.moduleName === "additional-annexures") {
    return `${humanize(location.requirementId)}: ${metadata.originalName}`;
  }
  return `${humanize(location.moduleName)}: ${metadata.originalName}`;
}

function reportOrder(file: LocatedFile, chapterOrder: Map<string, number>) {
  const moduleOrder: Record<string, number> = {
    "front-matter": 0,
    chapters: 1,
    plates: 2,
    annexures: 3,
    "additional-annexures": 4,
    replenishment: 5,
  };
  const moduleRank = moduleOrder[file.moduleName] ?? 9;
  const requirementRank =
    file.moduleName === "front-matter"
      ? frontMatterOrder.indexOf(file.requirementId)
      : file.moduleName === "chapters"
        ? (chapterOrder.get(file.requirementId) ?? 999)
        : 0;
  return `${String(moduleRank).padStart(2, "0")}:${String(requirementRank).padStart(4, "0")}:${file.requirementId}:${file.metadata.uploadedAt}`;
}

function matchingLocalFile(file: LocatedFile, local: LocalDocuments) {
  if (file.moduleName === "front-matter") {
    const records: Record<string, UploadRecord | null> = {
      cover: local.cover,
      certificate: local.certificate,
      contents: local.contents,
      preface: local.preface,
    };
    return records[file.requirementId];
  }
  if (file.moduleName === "chapters") {
    return local.chapters.find(
      (chapter) => chapter.slotId === file.requirementId,
    )?.file;
  }
  return undefined;
}

function matchesMetadata(
  local: UploadRecord | null | undefined,
  metadata: FileMetadata,
) {
  return Boolean(
    local &&
    ((local.id && local.id === metadata.id) ||
      (local.savedName && local.savedName === metadata.savedName)),
  );
}

function localPreviewDocuments(
  local: LocalDocuments,
  includeIdentifierFiles: boolean,
): PreviewDocument[] {
  const documents: PreviewDocument[] = [];
  const add = (
    record: UploadRecord | null,
    title: string,
    moduleName: string,
    requirementId: string,
  ) => {
    if (!record?.preview?.startsWith("data:")) return;
    if (!includeIdentifierFiles && (record.id || record.savedName)) return;
    documents.push({
      metadata: localMetadata(record, `legacy-${moduleName}-${requirementId}`),
      moduleName,
      requirementId,
      title,
      src: record.preview,
    });
  };
  add(local.cover, frontMatterTitles.cover, "front-matter", "cover");
  add(
    local.certificate,
    frontMatterTitles.certificate,
    "front-matter",
    "certificate",
  );
  add(local.contents, frontMatterTitles.contents, "front-matter", "contents");
  add(local.preface, frontMatterTitles.preface, "front-matter", "preface");
  local.chapters.forEach((chapter) =>
    add(chapter.file ?? null, chapter.name, "chapters", chapter.slotId),
  );
  return documents;
}

function mergeRemoteDocuments(
  remote: PreviewDocument[],
  legacy: PreviewDocument[],
) {
  const remoteSlots = new Set(
    remote.map((file) => `${file.moduleName}/${file.requirementId}`),
  );
  return [
    ...remote,
    ...legacy.filter(
      (file) => !remoteSlots.has(`${file.moduleName}/${file.requirementId}`),
    ),
  ];
}

function localMetadata(record: UploadRecord, id: string): FileMetadata {
  return {
    id,
    originalName: record.name,
    fileName: record.name,
    savedName: "",
    objectKey: "",
    contentType: record.preview?.startsWith("data:image")
      ? "image/*"
      : "application/pdf",
    sizeBytes: 0,
    url: "",
    downloadUrl: "",
    uploadedAt: "",
    success: true,
  };
}

function isPreviewable(metadata: FileMetadata) {
  return (
    metadata.contentType === "application/pdf" ||
    metadata.contentType.startsWith("image/") ||
    /\.(pdf|jpe?g|png|tiff?)$/i.test(metadata.originalName)
  );
}

function humanize(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
