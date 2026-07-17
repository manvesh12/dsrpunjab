export const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024;

export const ALLOWED_FILE_EXTENSIONS = new Set([
  ".pdf", ".xlsx", ".xls", ".csv", ".jpg", ".jpeg", ".png", ".tif", ".tiff",
  ".kml", ".kmz", ".shp", ".dwg", ".las", ".laz"
]);

export const CONTENT_TYPES_BY_EXTENSION: Readonly<Record<string, string>> = Object.freeze({
  ".pdf": "application/pdf",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xls": "application/vnd.ms-excel",
  ".csv": "text/csv",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".kml": "application/vnd.google-earth.kml+xml",
  ".kmz": "application/vnd.google-earth.kmz",
  ".shp": "application/octet-stream",
  ".dwg": "application/acad",
  ".las": "application/octet-stream",
  ".laz": "application/octet-stream"
});
