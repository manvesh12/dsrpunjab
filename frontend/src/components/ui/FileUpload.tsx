import { Download, FileUp, LoaderCircle, Replace, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { uploadsApi, type FileMetadata } from "../../api/uploads.api";
import { useLocalDraft } from "../../hooks/useLocalDraft";

const MAX_LOCAL_PREVIEW_BYTES = 512 * 1024;
const MAX_INLINE_PREVIEW_BYTES = 10 * 1024 * 1024;

export type StoredProjectFile = Partial<FileMetadata> & {
  name: string;
  preview?: string;
};

type FileUploadProps = {
  projectId: string | number;
  storageKey: string;
  moduleName: string;
  requirementId: string;
  label: string;
  hint: string;
  accept: string;
  multiple?: boolean;
  showPreview?: boolean;
  onPreview?: (src: string | null) => void;
};

/**
 * Project-aware file picker. Metadata stays in the local draft for the live
 * editor, while the actual file is uploaded to the project's backend folder.
 */
export default function FileUpload({
  projectId,
  storageKey,
  moduleName,
  requirementId,
  label,
  hint,
  accept,
  multiple = false,
  showPreview = true,
  onPreview,
}: FileUploadProps) {
  const [stored, setStored] = useLocalDraft<
    StoredProjectFile[] | StoredProjectFile | null
  >(storageKey, multiple ? [] : null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [blobPreviews, setBlobPreviews] = useState<Record<string, string>>({});
  const files = useMemo(() => normalizeStoredFiles(stored), [stored]);
  const primaryPreview = files[0]
    ? (projectFilePreview(files[0], blobPreviews) ?? null)
    : null;
  const shouldLoadPreviews = showPreview || Boolean(onPreview);

  useEffect(() => {
    if (!/^\d+$/.test(String(projectId))) return;
    let active = true;
    void uploadsApi
      .list({ projectId, module: moduleName, requirementId })
      .then((remoteFiles) => {
        if (!active) return;
        const sorted = [...remoteFiles].sort(
          (left, right) =>
            Date.parse(right.uploadedAt) - Date.parse(left.uploadedAt),
        );
        const selected = multiple ? sorted : sorted.slice(0, 1);
        setStored((current) => {
          const localFiles = normalizeStoredFiles(current);
          if (!selected.length) {
            const legacy = localFiles.filter(
              (file) => !file.id && !file.savedName,
            );
            return multiple ? legacy : (legacy[0] ?? null);
          }
          const hydrated = selected.map((metadata) => {
            const local = localFiles.find(
              (file) =>
                file.id === metadata.id ||
                file.savedName === metadata.savedName,
            );
            return metadataToStoredFile(metadata, local);
          });
          return multiple ? hydrated : (hydrated[0] ?? current);
        });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [moduleName, multiple, projectId, requirementId, setStored]);

  useEffect(() => {
    if (!shouldLoadPreviews || !/^\d+$/.test(String(projectId))) return;
    let active = true;
    let createdUrls: string[] = [];
    void Promise.all(
      files.map(async (file) => {
        const identifier = file.savedName || file.id;
        if (
          !identifier ||
          file.preview?.startsWith("data:") ||
          !canAutoPreview(file)
        ) {
          return null;
        }
        try {
          const blob = await uploadsApi.downloadBlob(identifier, projectId);
          return [identifier, URL.createObjectURL(blob)] as const;
        } catch {
          return null;
        }
      }),
    ).then((entries) => {
      const previews = entries.filter(
        (entry): entry is readonly [string, string] => entry !== null,
      );
      createdUrls = previews.map(([, url]) => url);
      if (!active) {
        createdUrls.forEach((url) => URL.revokeObjectURL(url));
        return;
      }
      setBlobPreviews(Object.fromEntries(previews));
    });
    return () => {
      active = false;
      createdUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files, projectId, shouldLoadPreviews]);

  useEffect(() => {
    onPreview?.(primaryPreview);
  }, [onPreview, primaryPreview]);

  const saveFiles = (next: StoredProjectFile[]) => {
    setStored(multiple ? next : (next[0] ?? null));
  };

  const select = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!selectedFiles.length) return;
    if (!/^\d+$/.test(String(projectId))) {
      toast.error("Open a valid project before uploading files.");
      return;
    }

    setUploading(true);
    try {
      const results = await Promise.allSettled(
        (multiple ? selectedFiles : selectedFiles.slice(0, 1)).map(
          async (selected) => {
            const metadata = await uploadsApi.upload(selected, {
              projectId,
              module: moduleName,
              requirementId,
            });
            const preview = await createPreview(selected);
            return {
              ...metadata,
              name: metadata.originalName || selected.name,
              preview,
            } satisfies StoredProjectFile;
          },
        ),
      );
      const uploaded = results.flatMap((result) =>
        result.status === "fulfilled" ? [result.value] : [],
      );
      const failed = results.length - uploaded.length;
      if (!uploaded.length) {
        const firstFailure = results.find(
          (result): result is PromiseRejectedResult =>
            result.status === "rejected",
        );
        throw firstFailure?.reason || new Error("File upload failed");
      }

      if (!multiple) {
        const cleanupResults = await Promise.allSettled(
          files.flatMap((file) => {
            const identifier = file.savedName || file.id;
            return identifier ? [uploadsApi.delete(identifier, projectId)] : [];
          }),
        );
        if (cleanupResults.some((result) => result.status === "rejected")) {
          toast.warning(
            "New file uploaded, but the replaced file needs cleanup.",
          );
        }
      }
      saveFiles(multiple ? [...files, ...uploaded] : uploaded);
      toast.success(
        `${uploaded.length} file${uploaded.length === 1 ? "" : "s"} uploaded to this project`,
      );
      if (failed) {
        toast.error(
          `${failed} file${failed === 1 ? "" : "s"} could not be uploaded`,
        );
      }
    } catch (error) {
      toast.error(uploadErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const remove = async (index: number) => {
    const target = files[index];
    const identifier = target.savedName || target.id;
    try {
      if (identifier) await uploadsApi.delete(identifier, projectId);
      const next = files.filter((_, fileIndex) => fileIndex !== index);
      saveFiles(next);
      toast.success(
        identifier ? "File deleted from project" : "Local file removed",
      );
    } catch (error) {
      toast.error(uploadErrorMessage(error));
    }
  };

  const download = async (file: StoredProjectFile) => {
    const identifier = file.savedName || file.id;
    if (!identifier) return;
    setDownloading(identifier);
    try {
      const blob = await uploadsApi.downloadBlob(identifier, projectId);
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = file.name;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      toast.error(uploadErrorMessage(error));
    } finally {
      setDownloading(null);
    }
  };

  if (files.length) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="space-y-3">
          {files.map((file, index) => {
            const preview = projectFilePreview(file, blobPreviews);
            const identifier = file.savedName || file.id;
            return (
              <div key={file.id || `${file.name}-${index}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 truncate text-sm font-semibold text-emerald-900">
                    Stored: {file.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="module-btn shrink-0 text-red-600"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
                {showPreview && preview && (
                  <UploadedPreview
                    src={preview}
                    contentType={file.contentType}
                  />
                )}
                {showPreview &&
                  !preview &&
                  identifier &&
                  isPreviewable(file) && (
                    <button
                      type="button"
                      onClick={() => void download(file)}
                      disabled={downloading === identifier}
                      className="module-btn mt-3"
                    >
                      {downloading === identifier ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <Download size={16} />
                      )}
                      {downloading === identifier
                        ? "Downloading..."
                        : `Download (${formatBytes(file.sizeBytes)})`}
                    </button>
                  )}
              </div>
            );
          })}
        </div>
        <label
          className={`module-btn mt-3 cursor-pointer ${uploading ? "pointer-events-none opacity-60" : ""}`}
        >
          {uploading ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <Replace size={16} />
          )}
          {multiple ? "Add more" : "Replace"}
          <input
            type="file"
            accept={accept}
            multiple={multiple}
            hidden
            disabled={uploading}
            onChange={select}
          />
        </label>
      </div>
    );
  }

  return (
    <label
      className={`flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-blue-400 ${uploading ? "pointer-events-none opacity-60" : ""}`}
    >
      {uploading ? (
        <LoaderCircle className="animate-spin text-blue-600" />
      ) : (
        <FileUp className="text-blue-600" />
      )}
      <span className="mt-2 font-semibold">
        {uploading ? "Uploading to project..." : label}
      </span>
      <span className="text-xs text-slate-500">{hint}</span>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        disabled={uploading}
        onChange={select}
      />
    </label>
  );
}

function normalizeStoredFiles(
  stored: StoredProjectFile[] | StoredProjectFile | null,
) {
  return Array.isArray(stored) ? stored : stored ? [stored] : [];
}

function projectFilePreview(
  file: StoredProjectFile,
  blobPreviews: Record<string, string>,
) {
  if (file.preview?.startsWith("data:")) return file.preview;
  const identifier = file.savedName || file.id;
  if (identifier) return blobPreviews[identifier];
  return undefined;
}

function metadataToStoredFile(
  metadata: FileMetadata,
  local?: StoredProjectFile,
): StoredProjectFile {
  const localPreview = local?.preview?.startsWith("data:")
    ? local.preview
    : undefined;
  return {
    ...metadata,
    name: metadata.originalName || metadata.fileName,
    preview: localPreview,
  };
}

function UploadedPreview({
  src,
  contentType,
}: {
  src: string;
  contentType?: string;
}) {
  return src.startsWith("data:image") || contentType?.startsWith("image/") ? (
    <img
      src={src}
      alt="Uploaded preview"
      className="mt-3 max-h-72 w-full rounded-lg object-contain"
    />
  ) : (
    <iframe
      title="Uploaded PDF preview"
      src={src}
      className="mt-3 h-64 w-full rounded-lg border bg-white"
    />
  );
}

function isPreviewable(file: StoredProjectFile) {
  const contentType = String(file.contentType || "").toLowerCase();
  const name = file.name.toLowerCase();
  return (
    contentType === "application/pdf" ||
    contentType.startsWith("image/") ||
    /\.(pdf|jpe?g|png|tiff?)$/.test(name)
  );
}

function canAutoPreview(file: StoredProjectFile) {
  return (
    isPreviewable(file) &&
    typeof file.sizeBytes === "number" &&
    file.sizeBytes <= MAX_INLINE_PREVIEW_BYTES
  );
}

function formatBytes(bytes?: number) {
  if (typeof bytes !== "number") return "stored file";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function createPreview(file: File) {
  const previewable =
    file.type.startsWith("image/") || file.type === "application/pdf";
  if (!previewable || file.size > MAX_LOCAL_PREVIEW_BYTES) return undefined;
  return readFile(file);
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function uploadErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response
  ) {
    const data = error.response.data as { error?: string; message?: string };
    return (
      data.error || data.message || "File upload failed. Please try again."
    );
  }
  return error instanceof Error
    ? error.message
    : "File upload failed. Please try again.";
}
