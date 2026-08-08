import {
  Columns3,
  Download,
  Eye,
  FileUp,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { uploadsApi } from "../../api/uploads.api";
import PageHeader from "../layout/PageHeader";
import { useLocalDraft } from "../../hooks/useLocalDraft";

export type EditorColumn = {
  key: string;
  label: string;
  type?: "text" | "number" | "date";
};

type ModuleEditorProps = {
  storageKey: string;
  title: string;
  description: string;
  columns: EditorColumn[];
  sampleRows?: Record<string, string>[];
  guidance?: string;
  embedded?: boolean;
  showLivePreview?: boolean;
  onRowsChange?: (rows: Record<string, string>[]) => void;
  editableStructure?: boolean;
  projectId?: string | number;
  uploadModule?: string;
  uploadRequirementId?: string;
  onSnapshotChange?: (snapshot: {
    title: string;
    columns: EditorColumn[];
    rows: Record<string, string>[];
    attachments: string[];
  }) => void;
};

type ProjectAttachment = {
  name: string;
  id?: string;
  savedName?: string;
};

export default function ModuleEditor({
  storageKey,
  title,
  description,
  columns,
  sampleRows = [],
  guidance,
  embedded = false,
  showLivePreview = true,
  onRowsChange,
  editableStructure = false,
  onSnapshotChange,
  projectId,
  uploadModule = "annexures",
  uploadRequirementId = "attachment",
}: ModuleEditorProps) {
  const [rows, setRows] = useLocalDraft<Record<string, string>[]>(
    storageKey,
    sampleRows,
  );
  const [editableTitle, setEditableTitle] = useLocalDraft(
    `${storageKey}:title`,
    title,
  );
  const [editableColumns, setEditableColumns] = useLocalDraft<EditorColumn[]>(
    `${storageKey}:columns`,
    columns,
  );
  const [attachments, setAttachments] = useLocalDraft<
    (string | ProjectAttachment)[]
  >(`${storageKey}:attachments`, []);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [preview, setPreview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const snapshotCallback = useRef(onSnapshotChange);

  useEffect(() => {
    if (projectId === undefined || !/^\d+$/.test(String(projectId))) return;
    let active = true;
    void Promise.all([
      uploadsApi.list({
        projectId,
        module: uploadModule,
        requirementId: uploadRequirementId,
      }),
      uploadsApi.list({
        projectId,
        module: uploadModule,
        requirementId: `${uploadRequirementId}-template`,
      }),
    ])
      .then(([attachmentFiles, templateFiles]) => {
        if (!active) return;
        const remoteFiles = [...attachmentFiles, ...templateFiles].sort(
          (left, right) =>
            Date.parse(right.uploadedAt) - Date.parse(left.uploadedAt),
        );
        setAttachments((current) => {
          const legacy = current.filter(
            (attachment) =>
              typeof attachment === "string" ||
              (!attachment.id && !attachment.savedName),
          );
          if (!remoteFiles.length) return legacy;
          const remote = remoteFiles.map((file) => ({
            name: file.originalName || file.fileName,
            id: file.id,
            savedName: file.savedName,
          }));
          const remoteNames = new Set(remote.map(attachmentName));
          const uniqueLegacy = legacy.filter(
            (attachment) => !remoteNames.has(attachmentName(attachment)),
          );
          return [...remote, ...uniqueLegacy];
        });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [projectId, setAttachments, uploadModule, uploadRequirementId]);

  useEffect(() => {
    snapshotCallback.current = onSnapshotChange;
  }, [onSnapshotChange]);

  useEffect(() => onRowsChange?.(rows), [onRowsChange, rows]);
  useEffect(
    () =>
      snapshotCallback.current?.({
        title: editableTitle,
        columns: editableColumns,
        rows,
        attachments: attachments.map((attachment) =>
          typeof attachment === "string" ? attachment : attachment.name,
        ),
      }),
    [attachments, editableColumns, editableTitle, rows],
  );

  const addRow = () =>
    setRows((current) => [
      ...current,
      Object.fromEntries(editableColumns.map((column) => [column.key, ""])),
    ]);
  const updateRow = (index: number, key: string, value: string) =>
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row,
      ),
    );
  const removeRow = (index: number) =>
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
  const downloadTemplate = () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      editableColumns.map((column) => column.label),
      editableColumns.map(() => ""),
    ]);
    sheet["!cols"] = editableColumns.map((column) => ({
      wch: Math.max(16, Math.min(42, column.label.length + 4)),
    }));
    XLSX.utils.book_append_sheet(workbook, sheet, "Template");
    XLSX.writeFile(workbook, `${storageKey}-template.xlsx`);
  };
  const storeProjectFiles = async (
    files: File[],
    requirementId = uploadRequirementId,
  ) => {
    if (!files.length) return;
    if (projectId === undefined) {
      setAttachments((current) => {
        const existing = new Set(current.map(attachmentName));
        return [
          ...current,
          ...files
            .map((file) => file.name)
            .filter((name) => !existing.has(name)),
        ];
      });
      toast.success(
        `${files.length} attachment${files.length === 1 ? "" : "s"} added`,
      );
      return;
    }
    if (!/^\d+$/.test(String(projectId))) {
      toast.error("Open a valid project before uploading files.");
      return;
    }

    setUploadingAttachments(true);
    const results = await Promise.allSettled(
      files.map(async (file) => {
        const uploaded = await uploadsApi.upload(file, {
          projectId,
          module: uploadModule,
          requirementId,
        });
        return {
          name: uploaded.originalName || file.name,
          id: uploaded.id,
          savedName: uploaded.savedName,
        } satisfies ProjectAttachment;
      }),
    );
    const uploaded = results.flatMap((result) =>
      result.status === "fulfilled" ? [result.value] : [],
    );
    const failed = results.length - uploaded.length;
    if (uploaded.length) {
      setAttachments((current) => [...current, ...uploaded]);
      toast.success(
        `${uploaded.length} file${uploaded.length === 1 ? "" : "s"} uploaded to this project`,
      );
    }
    if (failed) {
      toast.error(
        `${failed} file${failed === 1 ? "" : "s"} could not be uploaded`,
      );
    }
    setUploadingAttachments(false);
  };
  const importCsv = async (file: File) => {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const matrix = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
      header: 1,
      defval: "",
    });
    if (!matrix.length) return;
    const headers = matrix[0].map(String);
    const importedColumns = headers.map((label, index) => ({
      key: `column_${index + 1}`,
      label: label || `Column ${index + 1}`,
    }));
    const importedRows = matrix
      .slice(1)
      .filter((row) => row.some((value) => String(value).trim()))
      .map((row) =>
        Object.fromEntries(
          row.map((value, index) => [`column_${index + 1}`, String(value)]),
        ),
      );
    setEditableColumns(importedColumns);
    setRows(importedRows);
    toast.success(`${importedRows.length} entries imported`);
    await storeProjectFiles([file], `${uploadRequirementId}-template`);
  };
  const addAttachments = (files: FileList | null) => {
    if (!files?.length) return;
    void storeProjectFiles(Array.from(files));
  };
  const removeAttachment = async (index: number) => {
    const target = attachments[index];
    if (typeof target !== "string" && projectId !== undefined) {
      const identifier = target.savedName || target.id;
      if (identifier) {
        try {
          await uploadsApi.delete(identifier, projectId);
        } catch {
          toast.error("Attachment could not be deleted from the project.");
          return;
        }
      }
    }
    setAttachments((current) =>
      current.filter((_, attachmentIndex) => attachmentIndex !== index),
    );
    toast.success("Attachment removed");
  };
  const addColumn = () => {
    const index = editableColumns.length + 1;
    setEditableColumns((current) => [
      ...current,
      { key: `custom_${index}`, label: `New Column ${index}` },
    ]);
  };
  const renameColumn = (index: number, label: string) =>
    setEditableColumns((current) =>
      current.map((column, i) => (i === index ? { ...column, label } : column)),
    );
  const deleteColumn = (index: number) => {
    const target = editableColumns[index];
    setEditableColumns((current) => current.filter((_, i) => i !== index));
    setRows((current) =>
      current.map((row) => {
        const next = { ...row };
        delete next[target.key];
        return next;
      }),
    );
  };

  return (
    <>
      {!embedded && (
        <PageHeader
          title={title}
          description={description}
          action={
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingAttachments}
                className="module-btn"
              >
                <Upload size={17} /> Upload CSV
              </button>
              <button
                onClick={() => setPreview((value) => !value)}
                className="module-btn"
              >
                <Eye size={17} /> {preview ? "Edit" : "Preview"}
              </button>
              <button
                onClick={() => toast.success(`${title} draft saved`)}
                className="module-btn-primary"
              >
                <Save size={17} /> Save Draft
              </button>
            </div>
          }
        />
      )}
      <input
        ref={fileRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        hidden
        disabled={uploadingAttachments}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void importCsv(file);
        }}
      />
      {guidance && (
        <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {guidance}
        </div>
      )}
      <section
        className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${embedded ? "mb-5" : ""}`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="min-w-0 flex-1">
            {editableStructure ? (
              <input
                value={editableTitle}
                onChange={(e) => setEditableTitle(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 font-bold text-slate-900 outline-none focus:border-blue-500"
              />
            ) : (
              <h2 className="font-bold text-slate-900">{editableTitle}</h2>
            )}
            <p className="mt-1 text-sm text-slate-500">
              {description} • {rows.length} record{rows.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="ml-3 flex flex-wrap gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadingAttachments}
              className="module-btn"
            >
              <Upload size={17} /> Upload Template
            </button>
            <label
              className={`module-btn cursor-pointer ${uploadingAttachments ? "pointer-events-none opacity-60" : ""}`}
            >
              {uploadingAttachments ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <FileUp size={17} />
              )}
              {uploadingAttachments ? "Uploading..." : "Upload File"}
              <input
                type="file"
                accept=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png,.tif,.tiff,.kml,.kmz,.shp,.dwg,.las,.laz"
                multiple
                hidden
                disabled={uploadingAttachments}
                onChange={(event) => {
                  addAttachments(event.target.files);
                  event.target.value = "";
                }}
              />
            </label>
            <button onClick={downloadTemplate} className="module-btn">
              <Download size={17} /> Download Excel Template
            </button>
            {editableStructure && !preview && (
              <button onClick={addColumn} className="module-btn">
                <Columns3 size={17} />
                Add Column
              </button>
            )}
            {!preview && (
              <button onClick={addRow} className="module-btn-primary">
                <Plus size={17} /> Add Row
              </button>
            )}
          </div>
        </div>
        {preview ? (
          <DocumentPreview
            title={editableTitle}
            columns={editableColumns}
            rows={rows}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-xs uppercase text-slate-500">
                      #
                    </th>
                    {editableColumns.map((column, columnIndex) => (
                      <th
                        key={column.key}
                        className="px-2 py-2 text-xs uppercase text-slate-500"
                      >
                        {editableStructure ? (
                          <div className="flex min-w-40 items-center gap-1">
                            <input
                              value={column.label}
                              onChange={(e) =>
                                renameColumn(columnIndex, e.target.value)
                              }
                              className="min-w-0 flex-1 rounded border bg-white px-2 py-1 font-semibold"
                            />
                            <button
                              onClick={() => deleteColumn(columnIndex)}
                              className="rounded p-1 text-red-500"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ) : (
                          column.label
                        )}
                      </th>
                    ))}
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, index) => (
                    <tr key={index}>
                      {
                        <td className="px-4 py-3 text-slate-400">
                          {index + 1}
                        </td>
                      }
                      {editableColumns.map((column) => (
                        <td key={column.key} className="p-2">
                          <input
                            type={column.type ?? "text"}
                            value={row[column.key] ?? ""}
                            onChange={(event) =>
                              updateRow(index, column.key, event.target.value)
                            }
                            className="w-full min-w-32 rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                          />
                        </td>
                      ))}
                      <td className="p-2">
                        <button
                          aria-label="Delete row"
                          onClick={() => removeRow(index)}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === 0 && (
                <div className="p-12 text-center text-sm text-slate-500">
                  No entries yet. Click Add Row to begin.
                </div>
              )}
            </div>
            {attachments.length > 0 && (
              <div className="border-t bg-slate-50 px-5 py-3 text-sm text-slate-600">
                <strong>Attached files:</strong>
                <div className="mt-2 flex flex-wrap gap-2">
                  {attachments.map((attachment, index) => (
                    <span
                      key={`${attachmentName(attachment)}-${index}`}
                      className="inline-flex items-center gap-1 rounded-lg border bg-white px-2 py-1"
                    >
                      {attachmentName(attachment)}
                      <button
                        type="button"
                        aria-label={`Remove ${attachmentName(attachment)}`}
                        onClick={() => void removeAttachment(index)}
                        className="rounded p-0.5 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {showLivePreview && (
              <div className="border-t bg-slate-100 p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Live document preview
                </p>
                <DocumentPreview
                  title={editableTitle}
                  columns={editableColumns}
                  rows={rows}
                />
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}

function attachmentName(attachment: string | ProjectAttachment) {
  return typeof attachment === "string" ? attachment : attachment.name;
}

function DocumentPreview({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: EditorColumn[];
  rows: Record<string, string>[];
}) {
  return (
    <div className="m-4 min-h-80 overflow-x-auto rounded border bg-white p-8 shadow-inner print:shadow-none">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest">
          Government of Punjab
        </p>
        <h2 className="mt-3 text-xl font-bold uppercase">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">District Survey Report</p>
      </div>
      <PreviewTable columns={columns} rows={rows} />
    </div>
  );
}

function PreviewTable({
  columns,
  rows,
}: {
  columns: EditorColumn[];
  rows: Record<string, string>[];
}) {
  return (
    <table className="mt-8 w-full border-collapse text-xs">
      <thead>
        <tr>
          {columns.map((column) => (
            <th
              key={column.key}
              className="border border-slate-400 bg-slate-100 p-2 text-left"
            >
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>
            {columns.map((column) => (
              <td key={column.key} className="border border-slate-300 p-2">
                {row[column.key] || "—"}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
