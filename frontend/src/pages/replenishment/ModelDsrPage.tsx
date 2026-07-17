import { useState, useEffect, useRef, useCallback } from "react";
import {
  FilePlus,
  FolderOpen,
  ArrowLeft,
  Download,
  Pencil,
  Trash2,
  GripVertical,
  RotateCcw,
  UploadCloud,
  FileText,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import jsPDF from "jspdf";
import PageHeader from "../../components/layout/PageHeader";
import ResizableLayout from "../../components/layout/ResizableLayout";
import { apiClient } from "../../api/client";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
type ReportSection = string; // section ID that's checked

interface ModelDsrReport {
  id: string;
  name: string;
  createdAt: string;
  sections: ReportSection[];
  frontMatterPdfs: Record<string, string[]>; // uploadKey → dataURLs
  customPdfs: Record<string, string[]>;      // sectionId → dataURLs
  customSections: CustomSection[];
  sectionOrder: string[];
}

interface CustomSection {
  id: string;
  name: string;
  type: string;
  isCustom: true;
}

type View = "options" | "create" | "list" | "editor";

// ─────────────────────────────────────────────────────────
// Static section definitions
// ─────────────────────────────────────────────────────────
interface SubSection {
  id: string;
  name: string;
  uploadKey?: string;
}

interface SectionDef {
  id: string;
  name: string;
  type: string;
  hasSubsections?: boolean;
  subsections?: SubSection[];
  isCustom?: boolean;
}

const FRONT_MATTER_KEY: Record<string, string> = {
  "fm-cover": "cover",
  "fm-toc": "toc",
  "fm-pref": "pref",
  "fm-ack": "ack",
  "fm-cert": "cert",
};

const BASE_SECTIONS: SectionDef[] = [
  {
    id: "front-matter",
    name: "Front Matter",
    type: "DSR",
    hasSubsections: true,
    subsections: [
      { id: "fm-cover", name: "Cover Page", uploadKey: "cover" },
      { id: "fm-toc", name: "Content Page", uploadKey: "toc" },
      { id: "fm-pref", name: "Preface", uploadKey: "pref" },
      { id: "fm-ack", name: "Acknowledgement", uploadKey: "ack" },
      { id: "fm-cert", name: "Certificate of Compliance", uploadKey: "cert" },
    ],
  },
  { id: "chapters", name: "Chapters Outline", type: "DSR", hasSubsections: false },
  { id: "plates", name: "Plate Section", type: "DSR", hasSubsections: false },
  { id: "anx1", name: "Annexure I – Sources", type: "Annexure" },
  { id: "anx2", name: "Annexure II – Leases", type: "Annexure" },
  { id: "anx3", name: "Annexure III – Clusters", type: "Annexure" },
  { id: "anx4", name: "Annexure IV – Transport", type: "Annexure" },
  { id: "anx5", name: "Annexure V – Bench Mark & CORS", type: "Annexure" },
  { id: "anx6", name: "Annexure VI – Final Cluster Details", type: "Annexure" },
  { id: "anx7", name: "Annexure VII – Transportation Routes", type: "Annexure" },
  { id: "annexure-b", name: "Annexure B", type: "More Annexures" },
  { id: "annexure-c", name: "Annexure C", type: "More Annexures" },
  { id: "annexure-d", name: "Annexure D", type: "More Annexures" },
  { id: "annexure-e", name: "Annexure E", type: "More Annexures" },
  { id: "annexure-f", name: "Annexure F", type: "More Annexures" },
  { id: "annexure-g", name: "Annexure G", type: "More Annexures" },
  { id: "annexure-h", name: "Annexure H", type: "More Annexures" },
  { id: "annexure-i", name: "Annexure I", type: "More Annexures" },
  { id: "annexure-j", name: "Annexure J", type: "More Annexures" },
  { id: "annexure-k", name: "Annexure K", type: "More Annexures" },
];

const DEFAULT_ORDER = BASE_SECTIONS.map((s) => s.id);

// ─────────────────────────────────────────────────────────
// Local storage helpers
// ─────────────────────────────────────────────────────────
function reportsKey(projectId: string) {
  return `model_dsr_reports_${projectId}`;
}

function loadReports(projectId: string): ModelDsrReport[] {
  try {
    return JSON.parse(localStorage.getItem(reportsKey(projectId)) || "[]");
  } catch {
    return [];
  }
}

function saveReports(projectId: string, reports: ModelDsrReport[]) {
  localStorage.setItem(reportsKey(projectId), JSON.stringify(reports));
}

// ─────────────────────────────────────────────────────────
// API helpers (with localStorage fallback)
// ─────────────────────────────────────────────────────────
async function fetchReportsFromServer(projectId: string): Promise<ModelDsrReport[]> {
  try {
    const res = await apiClient.get<
      { id: string; title: string; createdAt: string; reportState: Record<string, unknown> }[]
    >(`/projects/${projectId}/replenishment`);
    const data = Array.isArray(res.data) ? res.data : [];
    return data
      .filter((s) => (s.reportState as { type?: string })?.type === "model_dsr")
      .map((s) => {
        const state = (s.reportState || {}) as {
          sections?: string[];
          frontMatterPdfs?: Record<string, string[]>;
          customPdfs?: Record<string, string[]>;
          customSections?: CustomSection[];
          sectionOrder?: string[];
        };
        return {
          id: s.id,
          name: s.title,
          createdAt: s.createdAt,
          sections: state.sections || [],
          frontMatterPdfs: state.frontMatterPdfs || {},
          customPdfs: state.customPdfs || {},
          customSections: state.customSections || [],
          sectionOrder: state.sectionOrder || [],
        };
      });
  } catch {
    return [];
  }
}

async function saveReportToServer(projectId: string, report: ModelDsrReport) {
  if (!report.id) return;
  try {
    await apiClient.put(`/replenishment/${report.id}`, {
      title: report.name,
      status: "DRAFT",
      reportState: {
        type: "model_dsr",
        sections: report.sections,
        frontMatterPdfs: report.frontMatterPdfs,
        customPdfs: report.customPdfs,
        customSections: report.customSections,
        sectionOrder: report.sectionOrder,
      },
    });
  } catch {
    // silent – local cache already saved
  }
}

async function createReportOnServer(
  projectId: string,
  name: string
): Promise<{ id: string; createdAt: string } | null> {
  try {
    const res = await apiClient.post<{ id: string; createdAt: string }>(
      `/projects/${projectId}/replenishment`,
      {
        title: name,
        reportState: {
          type: "model_dsr",
          sections: [],
          frontMatterPdfs: {},
          customPdfs: {},
          customSections: [],
          sectionOrder: [],
        },
      }
    );
    return res.data;
  } catch {
    return null;
  }
}

async function deleteReportOnServer(reportId: string) {
  try {
    await apiClient.delete(`/replenishment/${reportId}`);
  } catch {
    // silent
  }
}

// ─────────────────────────────────────────────────────────
// PDF generation (jsPDF)
// ─────────────────────────────────────────────────────────
function generateModelDsrPDF(
  reportName: string,
  sections: SectionDef[],
  selectedIds: string[]
) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();

  pdf.setFillColor(23, 50, 77);
  pdf.rect(0, 0, pageW, 40, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("Government of Punjab", pageW / 2, 15, { align: "center" });
  pdf.setFontSize(12);
  pdf.text("Model DSR Report", pageW / 2, 24, { align: "center" });
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(reportName, pageW / 2, 33, { align: "center" });

  pdf.setTextColor(30, 41, 59);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("Selected DSR Sections", 14, 55);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  let y = 65;
  const selected = sections.filter((s) => selectedIds.includes(s.id));

  if (selected.length === 0) {
    pdf.setTextColor(100, 116, 139);
    pdf.text("No sections were selected for this report.", 14, y);
  } else {
    selected.forEach((s, i) => {
      if (y > 270) {
        pdf.addPage();
        y = 20;
      }
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(12, y - 5, pageW - 24, 10, 2, 2, "F");
      pdf.setTextColor(30, 41, 59);
      pdf.setFont("helvetica", "bold");
      pdf.text(`${i + 1}. ${s.name}`, 16, y + 1);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 116, 139);
      pdf.text(s.type, pageW - 14, y + 1, { align: "right" });
      y += 14;
    });
  }

  const now = new Date().toLocaleString("en-IN");
  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(8);
  pdf.setTextColor(148, 163, 184);
  const totalPages = (pdf as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    pdf.text(`Generated: ${now} | Page ${p} of ${totalPages}`, pageW / 2, 290, {
      align: "center",
    });
  }

  pdf.save(`${reportName.replace(/[^a-z0-9]+/gi, "-")}.pdf`);
}

// ─────────────────────────────────────────────────────────
// Badge component
// ─────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    DSR: "bg-slate-200 text-slate-600",
    Annexure: "bg-blue-50 text-blue-700",
    "More Annexures": "bg-purple-50 text-purple-700",
    "Custom PDF": "bg-amber-50 text-amber-700",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
        colors[type] || "bg-gray-100 text-gray-500"
      }`}
    >
      {type}
    </span>
  );
}

// ─────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────
export default function ModelDsrPage() {
  const { projectId = "default" } = useParams();

  const [view, setView] = useState<View>("options");
  const [reports, setReports] = useState<ModelDsrReport[]>([]);
  const [activeReport, setActiveReport] = useState<ModelDsrReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [newReportName, setNewReportName] = useState("");

  // Load reports from localStorage on mount
  useEffect(() => {
    setReports(loadReports(projectId));
  }, [projectId]);

  // Persist reports to localStorage whenever they change
  useEffect(() => {
    saveReports(projectId, reports);
  }, [projectId, reports]);

  // ── Refresh from server ──
  const refreshFromServer = useCallback(async () => {
    setLoading(true);
    try {
      const serverReports = await fetchReportsFromServer(projectId);
      if (serverReports.length > 0) {
        setReports(serverReports);
        saveReports(projectId, serverReports);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // ── Create report ──
  const handleCreateReport = async () => {
    const name = newReportName.trim();
    if (!name) {
      toast.error("Please enter a report name");
      return;
    }
    setLoading(true);
    try {
      const serverRes = await createReportOnServer(projectId, name);
      const newReport: ModelDsrReport = {
        id: serverRes?.id || `local-${Date.now()}`,
        name,
        createdAt: serverRes?.createdAt || new Date().toISOString(),
        sections: [],
        frontMatterPdfs: {},
        customPdfs: {},
        customSections: [],
        sectionOrder: DEFAULT_ORDER,
      };
      setReports((prev) => [newReport, ...prev]);
      setActiveReport(newReport);
      setNewReportName("");
      setView("editor");
      toast.success("Report created!");
    } catch {
      toast.error("Failed to create report");
    } finally {
      setLoading(false);
    }
  };

  // ── Delete report ──
  const handleDelete = async (reportId: string) => {
    if (!confirm("Delete this report? This cannot be undone.")) return;
    await deleteReportOnServer(reportId);
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    toast.success("Report deleted");
  };

  // ── Rename report ──
  const handleRename = async (reportId: string) => {
    const report = reports.find((r) => r.id === reportId);
    if (!report) return;
    const newName = prompt("Enter new report name:", report.name);
    if (!newName || !newName.trim()) return;
    const updated = { ...report, name: newName.trim() };
    setReports((prev) => prev.map((r) => (r.id === reportId ? updated : r)));
    await saveReportToServer(projectId, updated);
    toast.success("Report renamed");
  };

  // ── Open report ──
  const handleOpen = (report: ModelDsrReport) => {
    setActiveReport(report);
    setView("editor");
  };

  // ── Save active report ──
  const persistActiveReport = useCallback(
    async (updated: ModelDsrReport) => {
      setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      await saveReportToServer(projectId, updated);
    },
    [projectId]
  );

  // ── Download PDF directly from list ──
  const handleDownloadDirect = (reportId: string) => {
    const report = reports.find((r) => r.id === reportId);
    if (!report) return;
    if (report.sections.length === 0) {
      toast.error("No sections selected in this report");
      return;
    }
    const allSections = buildSectionList(report);
    generateModelDsrPDF(report.name, allSections, report.sections);
  };

  return (
    <>
      <PageHeader
        title="Model DSR"
        description="Create and compile Model DSR reports by selecting specific DSR sections"
        action={
          view !== "options" ? (
            <button
              className="module-btn"
              onClick={() => setView("options")}
            >
              <ArrowLeft size={16} />
              Back to Options
            </button>
          ) : undefined
        }
      />

      {/* No project warning */}
      {projectId === "default" && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-700">
          <Info size={20} className="mt-0.5 shrink-0" />
          <p className="text-sm font-medium">
            No active project selected. Please open a project first to manage Model DSR reports.
          </p>
        </div>
      )}

      {view === "options" && (
        <OptionsView
          onCreateNew={() => setView("create")}
          onOpenExisting={async () => {
            await refreshFromServer();
            setView("list");
          }}
        />
      )}

      {view === "create" && (
        <CreateReportView
          value={newReportName}
          onChange={setNewReportName}
          onSubmit={handleCreateReport}
          onBack={() => setView("options")}
          loading={loading}
        />
      )}

      {view === "list" && (
        <ReportListView
          reports={reports}
          loading={loading}
          onOpen={handleOpen}
          onRename={handleRename}
          onDelete={handleDelete}
          onDownload={handleDownloadDirect}
          onBack={() => setView("options")}
          onRefresh={refreshFromServer}
        />
      )}

      {view === "editor" && activeReport && (
        <ReportEditor
          report={activeReport}
          onChange={(updated) => {
            setActiveReport(updated);
            persistActiveReport(updated);
          }}
          onBack={() => setView("list")}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────
// Options View
// ─────────────────────────────────────────────────────────
function OptionsView({
  onCreateNew,
  onOpenExisting,
}: {
  onCreateNew: () => void;
  onOpenExisting: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="mb-10 text-center">
        <h2 className="text-2xl font-extrabold text-slate-800">Model DSR</h2>
        <p className="mt-2 text-sm text-slate-500">
          Create and compile Model DSR reports by selecting specific DSR sections.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <OptionCard
          icon={<FilePlus size={28} className="text-blue-600" />}
          iconBg="bg-blue-50"
          title="Create New Report"
          description="Define a report name, choose custom sections, and generate a printable PDF."
          onClick={onCreateNew}
        />
        <OptionCard
          icon={<FolderOpen size={28} className="text-green-600" />}
          iconBg="bg-green-50"
          title="Open Existing Report"
          description="Open, edit, rename, delete or download previously compiled reports."
          onClick={onOpenExisting}
        />
      </div>
    </div>
  );
}

function OptionCard({
  icon,
  iconBg,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md active:scale-95"
    >
      <div
        className={`mb-5 flex h-14 w-14 items-center justify-center rounded-xl ${iconBg}`}
      >
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-bold text-slate-800">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-500">{description}</p>
    </button>
  );
}

// ─────────────────────────────────────────────────────────
// Create Report View
// ─────────────────────────────────────────────────────────
function CreateReportView({
  value,
  onChange,
  onSubmit,
  onBack,
  loading,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
}) {
  return (
    <div className="mx-auto max-w-md py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50">
            <FilePlus size={28} className="text-blue-600" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800">New Model DSR Report</h2>
          <p className="mt-2 text-sm text-slate-500">
            Enter a name for your custom report to start selecting DSR sections.
          </p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Report Title
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSubmit()}
              placeholder="e.g. Model DSR Report 2026"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              autoFocus
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={onBack}
              className="flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Back
            </button>
            <button
              onClick={onSubmit}
              disabled={loading}
              className="flex flex-[2] items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Report"}
              {!loading && <ArrowLeft size={15} className="rotate-180" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Report List View
// ─────────────────────────────────────────────────────────
function ReportListView({
  reports,
  loading,
  onOpen,
  onRename,
  onDelete,
  onDownload,
  onBack,
  onRefresh,
}: {
  reports: ModelDsrReport[];
  loading: boolean;
  onOpen: (r: ModelDsrReport) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
  onBack: () => void;
  onRefresh: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800">Saved Model DSR Reports</h2>
          <p className="mt-0.5 text-xs text-slate-500">{reports.length} report(s) saved</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            {loading ? "Loading..." : "↻ Refresh"}
          </button>
          <button
            onClick={onBack}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Back
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-400">Loading reports…</div>
      ) : reports.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-400">
          No saved reports found. Create a new report to get started.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b bg-slate-50 text-left text-xs font-bold uppercase text-slate-500">
              <tr>
                {["Report Name", "Date Created", "Sections", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-b hover:bg-slate-50">
                  <td className="px-5 py-3 font-semibold text-slate-800">{r.name}</td>
                  <td className="px-5 py-3 text-slate-500">
                    {new Date(r.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      {r.sections.length} sections
                    </span>
                  </td>
                  <td className="flex flex-wrap gap-2 px-5 py-3">
                    <button
                      onClick={() => onOpen(r)}
                      className="rounded bg-blue-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-blue-700"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => onRename(r.id)}
                      className="flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      <Pencil size={11} /> Rename
                    </button>
                    <button
                      onClick={() => onDownload(r.id)}
                      className="flex items-center gap-1 rounded bg-amber-500 px-2.5 py-1 text-xs font-bold text-white hover:bg-amber-600"
                    >
                      <Download size={11} /> PDF
                    </button>
                    <button
                      onClick={() => onDelete(r.id)}
                      className="flex items-center gap-1 rounded border border-red-200 px-2.5 py-1 text-xs font-bold text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={11} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Build full section list for a report (base + custom)
// ─────────────────────────────────────────────────────────
function buildSectionList(report: ModelDsrReport): SectionDef[] {
  const sections: SectionDef[] = BASE_SECTIONS.map((s) => ({ ...s }));
  (report.customSections || []).forEach((cs) => {
    sections.push({ id: cs.id, name: cs.name, type: cs.type || "Custom PDF", isCustom: true });
  });

  // Sort by sectionOrder
  const order =
    report.sectionOrder && report.sectionOrder.length > 0
      ? report.sectionOrder
      : DEFAULT_ORDER;

  const allIds = sections.map((s) => s.id);
  const missing = allIds.filter((id) => !order.includes(id));
  const fullOrder = [...order, ...missing];

  sections.sort((a, b) => {
    const ia = fullOrder.indexOf(a.id);
    const ib = fullOrder.indexOf(b.id);
    return ia - ib;
  });

  return sections;
}

// ─────────────────────────────────────────────────────────
// Report Editor
// ─────────────────────────────────────────────────────────
function ReportEditor({
  report,
  onChange,
  onBack,
}: {
  report: ModelDsrReport;
  onChange: (updated: ModelDsrReport) => void;
  onBack: () => void;
}) {
  const sections = buildSectionList(report);
  const checkedSet = new Set(report.sections);

  // Drag state
  const dragIdRef = useRef<string | null>(null);
  const [sectionOrder, setSectionOrder] = useState<string[]>(
    report.sectionOrder && report.sectionOrder.length > 0
      ? report.sectionOrder
      : sections.map((s) => s.id)
  );

  // Sorted sections according to current order
  const orderedSections = [...sections].sort((a, b) => {
    return sectionOrder.indexOf(a.id) - sectionOrder.indexOf(b.id);
  });

  // Count selected top-level sections (parents or standalone)
  const selectedCount = orderedSections.filter(
    (s) => checkedSet.has(s.id) || (s.hasSubsections && s.subsections?.some((sub) => checkedSet.has(sub.id)))
  ).length;

  // ── Toggle section ──
  const toggleSection = (id: string, checked: boolean) => {
    const section = sections.find((s) => s.id === id);
    let newSections = new Set(report.sections);
    if (section?.hasSubsections && section.subsections) {
      section.subsections.forEach((sub) => {
        if (checked) newSections.add(sub.id);
        else newSections.delete(sub.id);
      });
      if (checked) newSections.add(id);
      else newSections.delete(id);
    } else {
      if (checked) newSections.add(id);
      else newSections.delete(id);
    }
    // Update parent state
    if (!section?.hasSubsections) {
      const parent = sections.find(
        (s) => s.hasSubsections && s.subsections?.some((sub) => sub.id === id)
      );
      if (parent && parent.subsections) {
        const allChecked = parent.subsections.every((sub) => newSections.has(sub.id));
        const anyChecked = parent.subsections.some((sub) => newSections.has(sub.id));
        if (allChecked) newSections.add(parent.id);
        else if (!anyChecked) newSections.delete(parent.id);
      }
    }
    onChange({ ...report, sections: Array.from(newSections), sectionOrder });
  };

  // ── Drag & Drop ──
  const handleDragStart = (id: string) => {
    dragIdRef.current = id;
  };

  const handleDragOver = (e: React.DragEvent, overId: string) => {
    e.preventDefault();
    if (!dragIdRef.current || dragIdRef.current === overId) return;
    setSectionOrder((prev) => {
      const arr = [...prev];
      const fromIdx = arr.indexOf(dragIdRef.current!);
      const toIdx = arr.indexOf(overId);
      if (fromIdx < 0 || toIdx < 0) return prev;
      arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, dragIdRef.current!);
      return arr;
    });
  };

  const handleDragEnd = () => {
    dragIdRef.current = null;
    onChange({ ...report, sectionOrder });
  };

  // ── Reset order ──
  const resetOrder = () => {
    const defaultOrd = sections.map((s) => s.id);
    setSectionOrder(defaultOrd);
    onChange({ ...report, sectionOrder: defaultOrd });
    toast.success("Section order reset to default");
  };

  // ── Add custom section ──
  const addCustomSection = () => {
    const name = prompt("Enter custom section title:");
    if (!name || !name.trim()) return;
    const newId = `custom-pdf-${Date.now()}`;
    const newSec: CustomSection = {
      id: newId,
      name: name.trim(),
      type: "Custom PDF",
      isCustom: true,
    };
    const newOrder = [...sectionOrder, newId];
    setSectionOrder(newOrder);
    onChange({
      ...report,
      customSections: [...(report.customSections || []), newSec],
      sectionOrder: newOrder,
    });
    toast.success("Custom section added");
  };

  // ── Delete custom section ──
  const deleteCustomSection = (sectionId: string) => {
    if (!confirm("Delete this custom section?")) return;
    const newOrder = sectionOrder.filter((id) => id !== sectionId);
    setSectionOrder(newOrder);
    const newChecked = report.sections.filter((id) => id !== sectionId);
    const newCustomPdfs = { ...report.customPdfs };
    delete newCustomPdfs[sectionId];
    onChange({
      ...report,
      customSections: report.customSections.filter((cs) => cs.id !== sectionId),
      sectionOrder: newOrder,
      sections: newChecked,
      customPdfs: newCustomPdfs,
    });
    toast.success("Custom section deleted");
  };

  // ── Download PDF ──
  const handleDownload = () => {
    const selected = report.sections;
    if (selected.length === 0) {
      toast.error("No sections selected – please select at least one section");
      return;
    }
    const allSecs = buildSectionList(report);
    generateModelDsrPDF(report.name, allSecs, selected);
    toast.success("PDF generated!");
  };

  return (
    <div
      className="flex h-[calc(100vh-140px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div>
          <div className="text-base font-extrabold text-slate-800">{report.name}</div>
          <div className="mt-0.5 text-xs text-slate-500">
            Select DSR sections &amp; annexures to compile into a Model DSR report
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            ← Back
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
          >
            <Download size={13} /> Download PDF
          </button>
        </div>
      </div>

      {/* Body: 2-column */}
      <div className="h-[calc(100vh-10rem)] flex">
        <ResizableLayout 
          leftPanelDefaultSize={40} rightPanelDefaultSize={60}
          leftPanel={
            <div
              className="flex flex-col overflow-hidden h-full border-r border-slate-100"
              id="model-dsr-checklist-scroll-container"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600">
                  Select Sections
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={resetOrder}
                    className="flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-500 hover:bg-slate-50"
                  >
                    <RotateCcw size={10} /> Reset Order
                  </button>
                  <button
                    onClick={addCustomSection}
                    className="flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-600 hover:bg-blue-100"
                  >
                    <FilePlus size={10} /> Add Custom PDF
                  </button>
                  <span className="flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-500">
                    <GripVertical size={10} /> Drag to reorder
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {orderedSections.map((section) => (
                  <DraggableSectionItem
                    key={section.id}
                    section={section}
                    report={report}
                    checkedSet={checkedSet}
                    onToggle={toggleSection}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    onDeleteCustom={deleteCustomSection}
                    onChange={onChange}
                  />
                ))}
              </div>
            </div>
          }
          rightPanel={
            <PreviewPanel
              report={report}
              sections={orderedSections}
              selectedCount={selectedCount}
            />
          }
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Draggable Section Item
// ─────────────────────────────────────────────────────────
function DraggableSectionItem({
  section,
  report,
  checkedSet,
  onToggle,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDeleteCustom,
  onChange,
}: {
  section: SectionDef;
  report: ModelDsrReport;
  checkedSet: Set<string>;
  onToggle: (id: string, checked: boolean) => void;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onDeleteCustom: (id: string) => void;
  onChange: (r: ModelDsrReport) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const isChecked = checkedSet.has(section.id);
  const subsChecked = section.hasSubsections
    ? section.subsections?.filter((sub) => checkedSet.has(sub.id)) ?? []
    : [];
  const allSubsChecked =
    section.hasSubsections &&
    section.subsections?.length === subsChecked.length &&
    (section.subsections?.length ?? 0) > 0;
  const someSubsChecked = subsChecked.length > 0 && !allSubsChecked;

  const handleFrontMatterUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    subId: string,
    uploadKey: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }
    const url = URL.createObjectURL(file);
    const newFM = { ...report.frontMatterPdfs, [uploadKey]: [url] };
    onChange({ ...report, frontMatterPdfs: newFM });
    toast.success("Front matter PDF uploaded!");
    e.target.value = "";
  };

  const removeFrontMatterPdf = (uploadKey: string) => {
    if (!confirm("Remove this front matter PDF?")) return;
    const newFM = { ...report.frontMatterPdfs };
    delete newFM[uploadKey];
    onChange({ ...report, frontMatterPdfs: newFM });
    toast.success("Front matter PDF removed");
  };

  const handleCustomPdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }
    const url = URL.createObjectURL(file);
    const newCustomPdfs = { ...report.customPdfs, [section.id]: [url] };
    onChange({ ...report, customPdfs: newCustomPdfs });
    toast.success("PDF uploaded!");
    e.target.value = "";
  };

  const removeCustomPdf = () => {
    if (!confirm("Remove uploaded PDF?")) return;
    const newCustomPdfs = { ...report.customPdfs };
    delete newCustomPdfs[section.id];
    onChange({ ...report, customPdfs: newCustomPdfs });
    toast.success("PDF removed");
  };

  return (
    <div
      draggable
      onDragStart={() => {
        setIsDragging(true);
        onDragStart(section.id);
      }}
      onDragOver={(e) => onDragOver(e, section.id)}
      onDragEnd={() => {
        setIsDragging(false);
        onDragEnd();
      }}
      className={`rounded-lg border transition-all ${
        isDragging
          ? "border-dashed border-blue-300 bg-blue-50 opacity-40"
          : "border-slate-200 bg-slate-50 hover:border-slate-300"
      }`}
    >
      <div className="flex items-start gap-2 p-3">
        {/* Drag handle */}
        <span className="mt-0.5 flex cursor-grab items-center rounded bg-slate-200 p-1 text-slate-400 hover:bg-slate-300 active:cursor-grabbing">
          <GripVertical size={13} />
        </span>

        {/* Checkbox */}
        <input
          type="checkbox"
          id={`chk-${section.id}`}
          checked={isChecked || allSubsChecked}
          ref={(el) => {
            if (el) el.indeterminate = someSubsChecked;
          }}
          onChange={(e) => onToggle(section.id, e.target.checked)}
          className="mt-0.5 h-4 w-4 cursor-pointer accent-blue-600"
        />

        {/* Label */}
        <label
          htmlFor={`chk-${section.id}`}
          className="flex flex-1 cursor-pointer items-center gap-2"
        >
          <TypeBadge type={section.type} />
          <span className="text-sm font-bold text-slate-800">{section.name}</span>
        </label>

        {/* Delete custom section */}
        {section.isCustom && (
          <button
            onClick={() => onDeleteCustom(section.id)}
            className="text-red-400 hover:text-red-600"
            title="Delete custom section"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Sub-sections (Front Matter) */}
      {section.hasSubsections && section.subsections && (
        <div className="ml-10 mr-3 mb-3 space-y-1.5 border-l-2 border-dashed border-slate-300 pl-3">
          {section.subsections.map((sub) => {
            const uploadKey = sub.uploadKey || FRONT_MATTER_KEY[sub.id] || sub.id;
            const uploadedPages =
              section.id === "front-matter" ? report.frontMatterPdfs?.[uploadKey] : null;
            const hasUpload = Array.isArray(uploadedPages) && uploadedPages.length > 0;
            return (
              <div key={sub.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`chk-${sub.id}`}
                  checked={checkedSet.has(sub.id)}
                  onChange={(e) => onToggle(sub.id, e.target.checked)}
                  className="h-3.5 w-3.5 cursor-pointer accent-blue-600"
                />
                <label
                  htmlFor={`chk-${sub.id}`}
                  className="flex-1 cursor-pointer text-xs text-slate-600"
                >
                  {sub.name}
                </label>
                {section.id === "front-matter" && (
                  <div className="flex items-center gap-1">
                    {hasUpload ? (
                      <>
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-700">
                          PDF {uploadedPages!.length}p
                        </span>
                        <button
                          onClick={() => removeFrontMatterPdf(uploadKey)}
                          className="rounded bg-red-50 px-1.5 py-0.5 text-[9px] font-bold text-red-600 hover:bg-red-100"
                        >
                          Remove
                        </button>
                      </>
                    ) : (
                      <>
                        <label
                          htmlFor={`fm-upload-${sub.id}`}
                          className="flex cursor-pointer items-center gap-0.5 rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 hover:bg-blue-100"
                        >
                          <UploadCloud size={9} /> Upload PDF
                        </label>
                        <input
                          id={`fm-upload-${sub.id}`}
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={(e) => handleFrontMatterUpload(e, sub.id, uploadKey)}
                        />
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Custom PDF upload area */}
      {section.isCustom && (
        <div className="mx-3 mb-3">
          {report.customPdfs?.[section.id]?.length ? (
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <FileText size={13} className="text-blue-600" />
                PDF Uploaded ({report.customPdfs[section.id].length} pages)
              </div>
              <button
                onClick={removeCustomPdf}
                className="font-bold text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ) : (
            <label
              htmlFor={`custom-upload-${section.id}`}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white py-2.5 text-xs text-slate-500 hover:border-blue-300 hover:text-blue-600"
            >
              <UploadCloud size={14} /> Upload PDF document
              <input
                id={`custom-upload-${section.id}`}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleCustomPdfUpload}
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Preview Panel
// ─────────────────────────────────────────────────────────
function PreviewPanel({
  report,
  sections,
  selectedCount,
}: {
  report: ModelDsrReport;
  sections: SectionDef[];
  selectedCount: number;
}) {
  const checkedSet = new Set(report.sections);
  const selectedSections = sections.filter(
    (s) =>
      checkedSet.has(s.id) ||
      (s.hasSubsections && s.subsections?.some((sub) => checkedSet.has(sub.id)))
  );

  const district = "Punjab";
  const year = "2025-26";

  const previewHtml = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; background: #f1f5f9; padding: 20px; color: #0f172a; }
  .page { background: #fff; max-width: 700px; margin: 0 auto; padding: 40px 48px; box-shadow: 0 4px 24px rgba(0,0,0,0.10); min-height: 900px; }
  .gov-header { text-align: center; border-bottom: 2px solid #17324d; padding-bottom: 16px; margin-bottom: 32px; }
  .gov-header .emblem { font-size: 40px; margin-bottom: 6px; }
  .gov-header h1 { font-size: 14px; font-weight: 700; color: #17324d; letter-spacing: 1px; text-transform: uppercase; }
  .gov-header h2 { font-size: 11px; color: #64748b; margin-top: 2px; }
  .report-title { text-align: center; margin-bottom: 28px; }
  .report-title h3 { font-size: 18px; font-weight: 800; color: #1e293b; text-transform: uppercase; }
  .report-title p { font-size: 11px; color: #64748b; margin-top: 6px; }
  .section-list h4 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
  .section-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 6px; margin-bottom: 5px; background: #f8fafc; border: 1px solid #e2e8f0; }
  .section-num { font-size: 10px; font-weight: 700; color: #94a3b8; min-width: 20px; }
  .section-name { font-size: 12px; font-weight: 600; color: #1e293b; flex: 1; }
  .section-badge { font-size: 9px; padding: 2px 7px; border-radius: 100px; font-weight: 700; background: #e2e8f0; color: #475569; }
  .empty { text-align: center; padding: 60px 20px; color: #94a3b8; font-size: 13px; }
  .footer { margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 9px; color: #94a3b8; text-align: center; }
</style>
</head>
<body>
<div class="page">
  <div class="gov-header">
    <div class="emblem">🏛️</div>
    <h1>Government of Punjab</h1>
    <h2>District Survey Report Portal</h2>
  </div>
  <div class="report-title">
    <h3>${report.name || "Model DSR Report"}</h3>
    <p>${district} • ${year}</p>
  </div>
  <div class="section-list">
    <h4>Selected Sections (${selectedSections.length})</h4>
    ${
      selectedSections.length === 0
        ? '<div class="empty">No sections selected yet.<br>Select sections on the left to see the live preview.</div>'
        : selectedSections
            .map(
              (s, i) =>
                `<div class="section-item">
                  <span class="section-num">${i + 1}.</span>
                  <span class="section-name">${s.name}</span>
                  <span class="section-badge">${s.type}</span>
                </div>`
            )
            .join("")
    }
  </div>
  <div class="footer">Generated by DSR Portal • Preview only</div>
</div>
</body>
</html>`;

  return (
    <div className="flex flex-col overflow-hidden bg-slate-100">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-200 px-4 py-2.5">
        <span className="text-xs font-bold text-slate-600">Model DSR Preview</span>
        <span className="rounded-full bg-slate-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
          {selectedCount} selected
        </span>
      </div>
      <div className="flex-1 overflow-hidden">
        <iframe
          key={report.sections.join(",")}
          srcDoc={previewHtml}
          className="h-full w-full border-none bg-white"
          title="Model DSR Live Preview"
        />
      </div>
    </div>
  );
}
