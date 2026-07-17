import { storageService } from "../storage/storage.service.js";

// Compatibility functions retained for existing PDF and project modules.
export const putFile = storageService.putFile.bind(storageService);
export const getFile = storageService.getFile.bind(storageService);
export const deleteFile = storageService.deleteFile.bind(storageService);
export const getSignedDownloadUrl = storageService.signedDownloadUrl.bind(storageService);

export function putPdf(objectKey: string, bytes: Buffer) {
  return storageService.putFile(objectKey, bytes, "application/pdf");
}

export const getPdf = getFile;
export const deletePdf = deleteFile;
