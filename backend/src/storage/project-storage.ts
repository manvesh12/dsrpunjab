import { ApiError } from "../common/exceptions/api-error.js";

export function projectStoragePrefix(projectId: bigint | number | string) {
  const normalized = String(projectId);
  if (!/^\d+$/.test(normalized) || normalized === "0") {
    throw new ApiError(400, "PROJECT_STORAGE_ID_INVALID", "Invalid project storage identifier");
  }
  return `projects/${normalized}`;
}

export function projectFileObjectKey(
  projectId: bigint | number | string,
  moduleName: string,
  requirementId: string,
  storedFileName: string
) {
  return `${projectStoragePrefix(projectId)}/files/${moduleName}/${requirementId}/${storedFileName}`;
}

export function copiedProjectFileObjectKey(
  sourceObjectKey: string,
  sourceProjectId: bigint | number | string,
  destinationProjectId: bigint | number | string,
  fallbackFileName: string
) {
  const normalizedKey = String(sourceObjectKey).replace(/\\/g, "/").replace(/^\/+/, "");
  const sourcePrefix = `${projectStoragePrefix(sourceProjectId)}/`;
  const legacySourcePrefix = `files/${String(sourceProjectId)}/`;
  let relativeKey: string | null = null;

  if (normalizedKey.startsWith(sourcePrefix)) {
    relativeKey = normalizedKey.slice(sourcePrefix.length);
  } else if (normalizedKey.startsWith(legacySourcePrefix)) {
    relativeKey = `files/${normalizedKey.slice(legacySourcePrefix.length)}`;
  }

  if (relativeKey && isSafeRelativeKey(relativeKey)) {
    return `${projectStoragePrefix(destinationProjectId)}/${relativeKey}`;
  }

  let safeFallback = String(fallbackFileName)
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
    .replace(/[. ]+$/g, "")
    .replace(/^\.+$/, "file")
    .slice(0, 180) || "file";
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(safeFallback)) {
    safeFallback = `file-${safeFallback}`;
  }
  return `${projectStoragePrefix(destinationProjectId)}/files/inherited/${safeFallback}`;
}

function isSafeRelativeKey(value: string) {
  const segments = value.split("/");
  return segments.length > 0 && segments.every(segment => Boolean(segment) && segment !== "." && segment !== ".." && !segment.includes("\0"));
}

export function projectPdfObjectKey(
  projectId: bigint | number | string,
  annexureId: string,
  versionId?: string
) {
  const suffix = versionId ? `-${versionId}` : "";
  return `${projectStoragePrefix(projectId)}/pdf/${annexureId}${suffix}.pdf`;
}

export function projectReplenishmentObjectKey(
  projectId: bigint | number | string,
  replenishmentId: string,
  sectionId: string,
  storedFileName: string
) {
  return `${projectStoragePrefix(projectId)}/replenishment/${replenishmentId}/${sectionId}/${storedFileName}`;
}
