import {
  ArrowDown,
  ArrowUp,
  Image,
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
type PlateFile = { name: string; id?: string; savedName?: string };
type Plate = {
  slotId: string;
  name: string;
  summary: string;
  fileName?: string;
  file?: PlateFile;
};
const initial: Plate[] = [
  {
    slotId: "plate-1",
    name: "Plate 1 - Pre/Post Monsoon Cross Section",
    summary: "Auto-generated elevation chart for sand volume calculation.",
  },
  {
    slotId: "plate-2",
    name: "Plate 2 - Geological Subsurface Map",
    summary: "Detailed lithological boundaries and soil types.",
  },
];
export default function PlatesPage() {
  const { projectId = "default" } = useParams();
  const [plates, setPlates] = useLocalDraft<Plate[]>(
    `project-${projectId}:plates-exact`,
    initial,
    { legacyKeys: ["plates-exact"], migrate: migratePlates },
  );
  const [uploading, setUploading] = useState<number | null>(null);
  const plateSlotSignature = plates.map((plate) => plate.slotId).join("|");

  useEffect(() => {
    if (!/^\d+$/.test(projectId)) return;
    let active = true;
    const slotIds = plateSlotSignature ? plateSlotSignature.split("|") : [];
    void Promise.all(
      slotIds.map((slotId) =>
        uploadsApi.list({
          projectId,
          module: "plates",
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
        setPlates((current) =>
          current.map((plate) => {
            const remote = filesBySlot.get(plate.slotId);
            if (!remote) {
              return plate.file?.id || plate.file?.savedName
                ? { ...plate, file: undefined, fileName: undefined }
                : plate;
            }
            const name = remote.originalName || remote.fileName;
            return {
              ...plate,
              fileName: name,
              file: {
                name,
                id: remote.id,
                savedName: remote.savedName,
              },
            };
          }),
        );
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [plateSlotSignature, projectId, setPlates]);
  const update = (i: number, p: Partial<Plate>) =>
    setPlates((c) => c.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const move = (i: number, d: number) =>
    setPlates((c) => {
      const n = [...c];
      [n[i], n[i + d]] = [n[i + d], n[i]];
      return n;
    });
  const uploadPlate = async (index: number, selected: File) => {
    if (!/^\d+$/.test(projectId)) {
      toast.error("Open a valid project before uploading files.");
      return;
    }
    const slotId = plates[index]?.slotId;
    if (!slotId) return;
    setUploading(index);
    try {
      const uploaded = await uploadsApi.upload(selected, {
        projectId,
        module: "plates",
        requirementId: slotId,
      });
      const previous = plates[index]?.file;
      const previousIdentifier = previous?.savedName || previous?.id;
      if (previousIdentifier) {
        await uploadsApi
          .delete(previousIdentifier, projectId)
          .catch(() =>
            toast.warning(
              "New plate uploaded, but the replaced file needs cleanup.",
            ),
          );
      }
      const name = uploaded.originalName || selected.name;
      setPlates((current) =>
        current.map((plate, plateIndex) =>
          plateIndex === index
            ? {
                ...plate,
                fileName: name,
                file: {
                  name,
                  id: uploaded.id,
                  savedName: uploaded.savedName,
                },
              }
            : plate,
        ),
      );
      toast.success("Plate file uploaded to this project");
    } catch (error) {
      toast.error(fileErrorMessage(error));
    } finally {
      setUploading(null);
    }
  };
  const removePlate = async (index: number) => {
    const file = plates[index]?.file;
    const identifier = file?.savedName || file?.id;
    setUploading(index);
    try {
      if (identifier) await uploadsApi.delete(identifier, projectId);
      setPlates((current) =>
        current.filter((_, plateIndex) => plateIndex !== index),
      );
      toast.success("Plate removed");
    } catch (error) {
      toast.error(fileErrorMessage(error));
    } finally {
      setUploading(null);
    }
  };
  const leftPanel = (
    <div className="space-y-4">
      {plates.map((plate, i) => (
        <article
          key={plate.slotId}
          className="rounded-2xl border bg-white p-5 shadow-sm"
        >
          <div className="flex gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Image size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <input
                value={plate.name}
                onChange={(e) => update(i, { name: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 font-bold outline-none focus:border-blue-500"
              />
              <textarea
                value={plate.summary}
                onChange={(e) => update(i, { summary: e.target.value })}
                rows={2}
                className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <label
                className={`module-btn mt-2 cursor-pointer ${uploading !== null ? "pointer-events-none opacity-60" : ""}`}
              >
                {uploading === i ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
                {uploading === i
                  ? "Uploading..."
                  : plate.file?.name || plate.fileName || "Upload PDF / Image"}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.tif,.tiff"
                  hidden
                  disabled={uploading !== null}
                  onChange={(e) => {
                    const selected = e.target.files?.[0];
                    e.target.value = "";
                    if (selected) void uploadPlate(i, selected);
                  }}
                />
              </label>
            </div>
            <div>
              <button
                disabled={uploading !== null || i === 0}
                onClick={() => move(i, -1)}
                className="block rounded p-2 disabled:opacity-30"
              >
                <ArrowUp size={17} />
              </button>
              <button
                disabled={uploading !== null || i === plates.length - 1}
                onClick={() => move(i, 1)}
                className="block rounded p-2 disabled:opacity-30"
              >
                <ArrowDown size={17} />
              </button>
              <button
                disabled={uploading !== null}
                onClick={() => void removePlate(i)}
                className="block rounded p-2 text-red-500"
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
  const rightPanel = (
    <aside className="h-full rounded-2xl border bg-slate-100 p-4">
      <p className="mb-3 text-xs font-bold uppercase text-slate-500">
        Live plate index preview
      </p>
      <div className="min-h-[560px] bg-white p-8 shadow">
        <p className="text-center text-xs font-bold uppercase tracking-widest">
          District Survey Report
        </p>
        <h2 className="mt-3 text-center text-xl font-bold uppercase">
          List of Plates
        </h2>
        <div className="mt-8 space-y-5">
          {plates.map((p) => (
            <div key={p.slotId} className="border-b pb-3">
              <p className="font-bold">{p.name}</p>
              <p className="text-sm text-slate-600">{p.summary}</p>
              {p.fileName && (
                <p className="mt-1 text-xs text-blue-600">
                  Attached: {p.fileName}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
  return (
    <>
      <PageHeader
        title="Plate Section"
        description="Upload PDFs and images. Each entry becomes a plate in the final DSR report."
        action={
          <button
            className="module-btn-primary"
            onClick={() =>
              setPlates((c) => [
                ...c,
                {
                  slotId: createSlotId("plate"),
                  name: `Plate ${c.length + 1} - Enter Title`,
                  summary: "Enter plate description",
                },
              ])
            }
          >
            <Plus size={17} />
            Add Plate
          </button>
        }
      />
      <div className="h-[calc(100vh-12rem)] flex">
        <ResizableLayout
          leftPanel={leftPanel}
          rightPanel={rightPanel}
          leftPanelDefaultSize={60}
          rightPanelDefaultSize={40}
        />
      </div>
    </>
  );
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

function newestFile(files: FileMetadata[]) {
  return [...files].sort(
    (left, right) => Date.parse(right.uploadedAt) - Date.parse(left.uploadedAt),
  )[0];
}

function migratePlates(value: unknown): Plate[] {
  const source = Array.isArray(value) ? value : initial;
  const usedSlots = new Set<string>();
  return source.map((candidate, index) => {
    const plate =
      candidate && typeof candidate === "object"
        ? (candidate as Partial<Plate>)
        : {};
    const baseSlot = normalizeSlotId(plate.slotId, `plate-${index + 1}`);
    let slotId = baseSlot;
    let suffix = 2;
    while (usedSlots.has(slotId)) slotId = `${baseSlot}-${suffix++}`;
    usedSlots.add(slotId);
    return {
      slotId,
      name: String(plate.name || `Plate ${index + 1}`),
      summary: String(plate.summary || ""),
      fileName: plate.fileName,
      file: plate.file,
    };
  });
}

function normalizeSlotId(value: unknown, fallback: string) {
  const normalized = String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
  return normalized || fallback;
}

function createSlotId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}
