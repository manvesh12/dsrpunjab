import {
  ArrowDown,
  ArrowUp,
  LoaderCircle,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { uploadsApi, type FileMetadata } from "../../api/uploads.api";
import PageHeader from "../../components/layout/PageHeader";
import ResizableLayout from "../../components/layout/ResizableLayout";
import { useLocalDraft } from "../../hooks/useLocalDraft";
import {
  createUploadSlotId,
  defaultChapters,
  migrateChapters,
  type ChapterDraft,
} from "../../utils/chapterDrafts";
export default function ChaptersPage() {
  const { projectId = "default" } = useParams();
  const [chapters, setChapters] = useLocalDraft<ChapterDraft[]>(
    `project-${projectId}:chapters-exact`,
    defaultChapters,
    { legacyKeys: ["chapters-exact"], migrate: migrateChapters },
  );
  const [uploading, setUploading] = useState<number | null>(null);
  const chapterSlotSignature = chapters
    .map((chapter) => chapter.slotId)
    .join("|");

  useEffect(() => {
    if (!/^\d+$/.test(projectId)) return;
    let active = true;
    const slotIds = chapterSlotSignature ? chapterSlotSignature.split("|") : [];
    void Promise.all(
      slotIds.map((slotId) =>
        uploadsApi.list({
          projectId,
          module: "chapters",
          requirementId: slotId,
        }),
      ),
    )
      .then((slots) => {
        if (!active) return;
        const filesBySlot = new Map(
          slotIds.map(
            (slotId, index) =>
              [slotId, newestFile(slots[index] ?? [])] as const,
          ),
        );
        setChapters((current) =>
          current.map((chapter) => {
            const remote = filesBySlot.get(chapter.slotId);
            if (!remote) {
              return chapter.file?.id || chapter.file?.savedName
                ? { ...chapter, file: undefined }
                : chapter;
            }
            const localPreview =
              (chapter.file?.id === remote.id ||
                chapter.file?.savedName === remote.savedName) &&
              chapter.file.preview?.startsWith("data:")
                ? chapter.file.preview
                : undefined;
            return {
              ...chapter,
              file: {
                name: remote.originalName || remote.fileName,
                id: remote.id,
                savedName: remote.savedName,
                preview: localPreview,
              },
            };
          }),
        );
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [chapterSlotSignature, projectId, setChapters]);
  const move = (i: number, d: number) =>
    setChapters((c) => {
      const n = [...c];
      [n[i], n[i + d]] = [n[i + d], n[i]];
      return n;
    });
  const uploadChapter = async (index: number, selected: File) => {
    if (!/^\d+$/.test(projectId)) {
      toast.error("Open a valid project before uploading files.");
      return;
    }
    const slotId = chapters[index]?.slotId;
    if (!slotId) return;
    setUploading(index);
    try {
      const uploaded = await uploadsApi.upload(selected, {
        projectId,
        module: "chapters",
        requirementId: slotId,
      });
      const preview = await chapterPreview(selected);
      const previous = chapters[index]?.file;
      const previousIdentifier = previous?.savedName || previous?.id;
      if (previousIdentifier) {
        await uploadsApi
          .delete(previousIdentifier, projectId)
          .catch(() =>
            toast.warning(
              "New chapter uploaded, but the replaced file needs cleanup.",
            ),
          );
      }
      setChapters((current) =>
        current.map((chapter, chapterIndex) =>
          chapterIndex === index
            ? {
                ...chapter,
                file: {
                  name: uploaded.originalName || selected.name,
                  preview,
                  id: uploaded.id,
                  savedName: uploaded.savedName,
                },
              }
            : chapter,
        ),
      );
      toast.success("Chapter file uploaded to this project");
    } catch (error) {
      toast.error(fileErrorMessage(error));
    } finally {
      setUploading(null);
    }
  };
  const removeChapter = async (index: number) => {
    const file = chapters[index]?.file;
    const identifier = file?.savedName || file?.id;
    setUploading(index);
    try {
      if (identifier) await uploadsApi.delete(identifier, projectId);
      setChapters((current) =>
        current.filter((_, chapterIndex) => chapterIndex !== index),
      );
      toast.success("Chapter removed");
    } catch (error) {
      toast.error(fileErrorMessage(error));
    } finally {
      setUploading(null);
    }
  };
  return (
    <>
      <PageHeader
        title="Report Chapters"
        description="10 chapters as per EMGSM 2020 • Edit headings and summaries • Upload chapter PDFs"
        action={
          <button
            className="module-btn-primary"
            onClick={() =>
              setChapters((c) => [
                ...c,
                {
                  slotId: createUploadSlotId("chapter"),
                  name: "NEW CHAPTER - ENTER TITLE",
                  summary: "Enter chapter summary here...",
                },
              ])
            }
          >
            <Plus size={17} />
            Add Chapter
          </button>
        }
      />
      <div className="h-[calc(100vh-12rem)] flex">
        <ResizableLayout
          leftPanelDefaultSize={60}
          rightPanelDefaultSize={40}
          leftPanel={
            <div className="space-y-3">
              {chapters.map((chapter, i) => (
                <article
                  key={chapter.slotId}
                  className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <input
                      value={chapter.name}
                      onChange={(e) =>
                        setChapters((c) =>
                          c.map((x, j) =>
                            j === i ? { ...x, name: e.target.value } : x,
                          ),
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 font-bold outline-none focus:border-blue-500"
                    />
                    <textarea
                      rows={2}
                      value={chapter.summary}
                      onChange={(e) =>
                        setChapters((c) =>
                          c.map((x, j) =>
                            j === i ? { ...x, summary: e.target.value } : x,
                          ),
                        )
                      }
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                    <label
                      className={`module-btn mt-2 cursor-pointer ${uploading !== null ? "pointer-events-none opacity-60" : ""}`}
                    >
                      {uploading === i ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <Upload size={16} />
                      )}
                      {uploading === i ? "Uploading..." : "Upload Chapter PDF"}
                      <input
                        type="file"
                        accept=".pdf"
                        hidden
                        disabled={uploading !== null}
                        onChange={(e) => {
                          const selected = e.target.files?.[0];
                          e.target.value = "";
                          if (!selected) return;
                          void uploadChapter(i, selected);
                        }}
                      />
                    </label>
                    {chapter.file && (
                      <p className="mt-2 text-xs font-medium text-emerald-600 truncate">
                        Uploaded: {chapter.file.name}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      disabled={uploading !== null || i === 0}
                      onClick={() => move(i, -1)}
                      className="rounded p-2 hover:bg-slate-100 disabled:opacity-30"
                    >
                      <ArrowUp size={17} />
                    </button>
                    <button
                      disabled={uploading !== null || i === chapters.length - 1}
                      onClick={() => move(i, 1)}
                      className="rounded p-2 hover:bg-slate-100 disabled:opacity-30"
                    >
                      <ArrowDown size={17} />
                    </button>
                    <button
                      disabled={uploading !== null}
                      onClick={() => void removeChapter(i)}
                      className="rounded p-2 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          }
          rightPanel={
            <aside className="h-full rounded-2xl border bg-slate-200 p-4 block">
              <p className="mb-3 text-xs font-bold uppercase text-slate-600">
                Live Chapter Index Preview
              </p>
              <div className="min-h-[760px] bg-white p-8 shadow">
                <p className="text-center text-xs font-bold uppercase tracking-[.2em]">
                  District Survey Report
                </p>
                <h2 className="mt-4 border-b-2 pb-4 text-center text-xl font-bold uppercase">
                  Table of Chapters
                </h2>
                <div className="mt-6 space-y-4">
                  {chapters.map((chapter) => (
                    <div key={chapter.slotId} className="border-b pb-3">
                      <p className="text-sm font-bold">{chapter.name}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        {chapter.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          }
        />
      </div>
    </>
  );
}

function chapterPreview(file: File) {
  if (file.size <= 512 * 1024) return readFile(file);
  return Promise.resolve(undefined);
}

function newestFile(files: FileMetadata[]) {
  return [...files].sort(
    (left, right) => Date.parse(right.uploadedAt) - Date.parse(left.uploadedAt),
  )[0];
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function fileErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response
  ) {
    const data = error.response.data as { error?: string; message?: string };
    return data.error || data.message || "File operation failed.";
  }
  return error instanceof Error ? error.message : "File operation failed.";
}
