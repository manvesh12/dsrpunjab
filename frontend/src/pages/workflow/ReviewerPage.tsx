import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  CheckCircle2,
  Circle,
  Clock,
  Lock,
  CheckCheck,
  Send,
  MessageSquareText,
  AlertTriangle,
  ChevronRight,
  FileCheck,
  ClipboardList,
  ShieldCheck,
  Download,
  Bell,
  BellRing,
  Inbox,
  FileText,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "../../components/layout/PageHeader";
import {
  getWorkflowSummary,
  saveReviewerNote,
  submitReview,
} from "../../api/workflow.api";
import type {
  WorkflowSummary,
  ReviewerNote,
  ChecklistItem,
} from "../../types/workflow.types";

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────
const WORKFLOW_STEPS = [
  "Project Setup",
  "Front Matter",
  "Chapters",
  "Plates",
  "Cross Sections",
  "Annexures I-VII",
  "Annexures B-K",
  "PDF Generation",
];

const DSR_SECTIONS = [
  "Front Matter",
  "Chapters",
  "Plates & Maps",
  "Cross Section Graphs",
  "Annexures I-VII",
  "Annexures B-K",
  "Replenishment Report",
  "Model DSR",
];

// ─────────────────────────────────────────────────────────
// Notification type (mirrors ReviewerFloatingPanel)
// ─────────────────────────────────────────────────────────
interface ReviewNotification {
  id: string;
  projectId: string;
  sectionId: string;
  sectionLabel: string;
  note: string;
  recipientId: string;
  recipientName: string;
  sentAt: string;
  read: boolean;
}

function notifKey(projectId: string) {
  return `dsr:review-notifs:${projectId}`;
}

function loadNotifs(projectId: string): ReviewNotification[] {
  try { return JSON.parse(localStorage.getItem(notifKey(projectId)) || "[]"); }
  catch { return []; }
}

function saveNotifs(projectId: string, notifs: ReviewNotification[]) {
  localStorage.setItem(notifKey(projectId), JSON.stringify(notifs));
}

// ─────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────
type ActiveTab = "workflow" | "notes" | "notifications" | "review";

export default function ReviewerPage() {
  const { projectId = "default" } = useParams();
  const [tab, setTab] = useState<ActiveTab>("workflow");
  const [summary, setSummary] = useState<WorkflowSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifs, setNotifs] = useState<ReviewNotification[]>([]);

  // Review modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [aggregatedNotes, setAggregatedNotes] = useState("");

  // Notes panel
  const [noteSection, setNoteSection] = useState(DSR_SECTIONS[0]);
  const [noteText, setNoteText] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWorkflowSummary(projectId);
      setSummary(data);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    setNotifs(loadNotifs(projectId));
  }, [projectId]);

  // Sync note text when section changes
  useEffect(() => {
    const existing = summary?.reviewerNotes.find((n) => n.section === noteSection);
    setNoteText(existing?.note || "");
  }, [noteSection, summary]);

  // ── Build checklist ──
  const buildChecklist = (): ChecklistItem[] => {
    const step1 = true;
    const step2 = step1;
    const step3 = step2;
    const step4 = step3;
    const step5 = step4;
    const step6 = step5;
    const step7 = step6;
    const step8 = summary?.status === "final" || summary?.status === "approved";

    return [
      { key: "setup",    label: "Project Setup",        done: step1, note: "District, year, mineral type", locked: false },
      { key: "fm",       label: "Front Matter",          done: step2, note: "Cover, certificate & table of contents", locked: !step1 },
      { key: "chapters", label: "All Chapters",          done: step3, note: "Minimum 2 chapters required", locked: !step2 },
      { key: "plates",   label: "Plate Section",         done: step4, note: "Add at least one plate", locked: !step3 },
      { key: "graphs",   label: "Cross Section Graphs",  done: step5, note: "Generate cross-section graphs", locked: !step4 },
      { key: "anx1",    label: "Annexures I-VII",        done: step6, note: "Upload or fill Annexures I–VII", locked: !step5 },
      { key: "anxb",     label: "Annexures B-K",         done: step7, note: "Complete Annexures B through K", locked: !step6 },
      { key: "pdf",      label: "Final PDF Generation",  done: !!step8, note: "Generate final compiled PDF", locked: !step7 },
    ];
  };

  const openReviewModal = () => {
    const allNotes = summary?.reviewerNotes
      .filter((n) => n.note.trim())
      .map((n) => `[${n.section}]\n${n.note}`)
      .join("\n\n") || "";
    setAggregatedNotes(allNotes);
    setReviewModalOpen(true);
  };

  const handleReviewDecision = async (decision: "approved" | "returned") => {
    await submitReview(projectId, {
      decision,
      aggregatedNotes,
      submittedAt: new Date().toISOString(),
      submittedBy: "Reviewer",
    });
    setSummary((prev) =>
      prev ? { ...prev, status: decision === "approved" ? "approved" : "returned" } : prev
    );
    setReviewModalOpen(false);
    toast.success(decision === "approved" ? "Project approved!" : "Project returned for corrections.");
  };

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    await saveReviewerNote(projectId, noteSection, noteText);
    setSummary((prev) => {
      if (!prev) return prev;
      const exists = prev.reviewerNotes.find((n) => n.section === noteSection);
      const updated = exists
        ? prev.reviewerNotes.map((n) => n.section === noteSection ? { ...n, note: noteText, updatedAt: new Date().toISOString() } : n)
        : [...prev.reviewerNotes, { section: noteSection, note: noteText, updatedAt: new Date().toISOString() }];
      return { ...prev, reviewerNotes: updated };
    });
    toast.success("Note saved");
  };

  const markAllRead = () => {
    const updated = notifs.map((n) => ({ ...n, read: true }));
    saveNotifs(projectId, updated);
    setNotifs(updated);
    toast.success("All notifications marked as read");
  };

  const deleteNotif = (id: string) => {
    const updated = notifs.filter((n) => n.id !== id);
    saveNotifs(projectId, updated);
    setNotifs(updated);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  const checklist = buildChecklist();
  const completedSteps = checklist.filter((c) => c.done).length;
  const progressPct = Math.round((completedSteps / checklist.length) * 100);
  const unreadCount = notifs.filter((n) => !n.read).length;

  const statusColors: Record<string, string> = {
    draft:        "bg-slate-100 text-slate-600",
    submitted:    "bg-blue-100 text-blue-700",
    under_review: "bg-amber-100 text-amber-700",
    returned:     "bg-red-100 text-red-700",
    approved:     "bg-green-100 text-green-700",
    final:        "bg-emerald-100 text-emerald-700",
  };

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "workflow",      label: "Workflow",       icon: <ClipboardList size={15} /> },
    { id: "notes",         label: "Review Notes",   icon: <MessageSquareText size={15} /> },
    { id: "notifications", label: "Notifications",  icon: <Bell size={15} />, badge: unreadCount },
    { id: "review",        label: "Approve/Return", icon: <ShieldCheck size={15} /> },
  ];

  return (
    <>
      <PageHeader
        title="Reviewer & Workflow"
        description="Section-by-section review notes · Approval workflow · Notification inbox"
        action={
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusColors[summary?.status || "draft"]}`}>
              {summary?.status?.replace("_", " ") || "Draft"}
            </span>
          </div>
        }
      />

      {/* Progress bar */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-700">
            Workflow Completion — {completedSteps}/{checklist.length} steps
          </span>
          <span className="text-sm font-bold text-blue-600">{progressPct}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {/* Step bar */}
        <div className="mt-4 flex items-start">
          {WORKFLOW_STEPS.map((step, i) => {
            const done = checklist[i]?.done ?? false;
            const active = !done && (i === 0 || checklist[i - 1]?.done);
            return (
              <div key={step} className="flex flex-1 flex-col items-center">
                <div className="flex w-full items-center">
                  {i > 0 && <div className={`h-0.5 flex-1 ${done ? "bg-emerald-400" : "bg-slate-200"}`} />}
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${done ? "bg-emerald-500 text-white" : active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                    {done ? <CheckCheck size={13} /> : i + 1}
                  </div>
                  {i < WORKFLOW_STEPS.length - 1 && <div className={`h-0.5 flex-1 ${done ? "bg-emerald-400" : "bg-slate-200"}`} />}
                </div>
                <span className={`mt-1.5 text-center text-[9px] font-semibold ${done ? "text-emerald-600" : active ? "text-blue-600" : "text-slate-400"}`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-bold transition-all ${tab === t.id ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}
          >
            {t.icon}
            {t.label}
            {t.badge ? (
              <span className={`ml-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${tab === t.id ? "bg-white text-blue-600" : "bg-red-500 text-white"}`}>
                {t.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ── Tab: Workflow ── */}
      {tab === "workflow" && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="font-bold text-slate-800">Section Completion Status</h3>
            <p className="mt-0.5 text-xs text-slate-500">Serial-locked — each stage must be completed before the next unlocks</p>
          </div>
          <div className="divide-y">
            {checklist.map((item) => (
              <div key={item.key} className={`flex items-center gap-4 px-5 py-3.5 ${item.locked ? "opacity-50" : ""}`}>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${item.done ? "bg-emerald-100 text-emerald-600" : item.locked ? "bg-slate-100 text-slate-400" : "bg-amber-100 text-amber-600"}`}>
                  {item.done ? <CheckCircle2 size={17} /> : item.locked ? <Lock size={15} /> : <Circle size={17} />}
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-semibold ${item.done ? "text-slate-800" : "text-slate-600"}`}>{item.label}</div>
                  <div className="mt-0.5 text-xs text-slate-400">{item.note}</div>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${item.done ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  {item.done ? "Done" : item.locked ? "Locked" : "Pending"}
                </span>
                {!item.done && !item.locked && (
                  <Link to={`/projects/${projectId}`} className="flex items-center gap-0.5 text-xs font-semibold text-blue-600 hover:underline">
                    Go <ChevronRight size={12} />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: Notes ── */}
      {tab === "notes" && (
        <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
          {/* Section list */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-bold text-slate-700">DSR Sections</h3>
            </div>
            <div className="divide-y">
              {DSR_SECTIONS.map((section) => {
                const note = summary?.reviewerNotes.find((n) => n.section === section);
                const hasNote = !!(note?.note?.trim());
                return (
                  <button
                    key={section}
                    onClick={() => setNoteSection(section)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${noteSection === section ? "bg-blue-50" : "hover:bg-slate-50"}`}
                  >
                    <div className={`h-2 w-2 shrink-0 rounded-full ${hasNote ? "bg-amber-400" : "bg-slate-200"}`} />
                    <span className={`flex-1 text-sm font-semibold ${noteSection === section ? "text-blue-700" : "text-slate-700"}`}>
                      {section}
                    </span>
                    {hasNote && (
                      <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">Note</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note editor */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="font-bold text-slate-800">{noteSection}</h3>
                <p className="mt-0.5 text-xs text-slate-400">Write review feedback for this section</p>
              </div>
              {summary?.reviewerNotes.find((n) => n.section === noteSection)?.updatedAt && (
                <span className="text-[10px] text-slate-400">
                  Saved {new Date(summary.reviewerNotes.find((n) => n.section === noteSection)!.updatedAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                </span>
              )}
            </div>
            <div className="p-5">
              <textarea
                key={noteSection}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder={`Describe the changes required in ${noteSection}…\n\nBe specific about:\n• What needs to be corrected\n• Which data is missing or incorrect\n• Any compliance issues (EMGSM 2020)`}
                rows={10}
                className="w-full resize-none rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-400">{noteText.length} characters</span>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setNoteText(""); }}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleSaveNote}
                    disabled={!noteText.trim()}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <FileCheck size={13} /> Save Note
                  </button>
                </div>
              </div>
            </div>

            {/* All saved notes summary */}
            {summary?.reviewerNotes.filter((n) => n.note.trim()).length ? (
              <div className="border-t border-slate-100 px-5 py-4">
                <h4 className="mb-3 text-xs font-bold uppercase text-slate-400">All Saved Notes</h4>
                <div className="space-y-2">
                  {summary.reviewerNotes.filter((n) => n.note.trim()).map((n) => (
                    <div key={n.section} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="mb-1 flex items-center gap-2">
                        <FileText size={12} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-600">{n.section}</span>
                      </div>
                      <p className="line-clamp-2 text-xs text-slate-500">{n.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ── Tab: Notifications ── */}
      {tab === "notifications" && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Inbox size={18} className="text-slate-500" />
              <h3 className="font-bold text-slate-800">Review Notification Inbox</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {notifs.length > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {notifs.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <BellRing size={40} className="mb-3 text-slate-300" />
              <p className="text-sm font-semibold text-slate-500">No review notifications yet</p>
              <p className="mt-1 text-xs text-slate-400">
                Use the <strong>blue button</strong> (bottom right) to send review feedback
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifs.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-4 px-5 py-4 transition ${!n.read ? "bg-blue-50/50" : ""}`}
                >
                  <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${!n.read ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"}`}>
                    <MessageSquareText size={17} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">{n.sectionLabel}</span>
                      {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{n.note}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <User size={11} /> {n.recipientName}
                      </span>
                      <span>·</span>
                      <span>{new Date(n.sentAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1.5">
                    {!n.read && (
                      <button
                        onClick={() => {
                          const updated = notifs.map((notif) => notif.id === n.id ? { ...notif, read: true } : notif);
                          saveNotifs(projectId, updated);
                          setNotifs(updated);
                        }}
                        className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-600 hover:bg-blue-100"
                      >
                        Mark read
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotif(n.id)}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-bold text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Review & Approve ── */}
      {tab === "review" && (
        <div className="space-y-5">
          {summary?.status === "approved" && (
            <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
              <CheckCheck size={20} />
              <div>
                <div className="font-bold">Project Approved</div>
                <div className="text-sm">Ready for final PDF generation.</div>
              </div>
            </div>
          )}
          {summary?.status === "returned" && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              <AlertTriangle size={20} />
              <div>
                <div className="font-bold">Returned for Modifications</div>
                <div className="text-sm">Sent back to data entry team for corrections.</div>
              </div>
            </div>
          )}

          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Checklist", value: `${checklist.filter((c) => c.done).length}/${checklist.length}`, sub: "steps complete", color: "bg-blue-50 text-blue-600" },
              { label: "Review Notes", value: String(summary?.reviewerNotes.filter((n) => n.note.trim()).length ?? 0), sub: "sections annotated", color: "bg-amber-50 text-amber-600" },
              { label: "Notifications Sent", value: String(notifs.length), sub: `${unreadCount} unread`, color: "bg-purple-50 text-purple-600" },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className={`mb-2 inline-flex rounded-xl px-2 py-1 text-[10px] font-bold uppercase ${card.color}`}>{card.label}</div>
                <div className="text-2xl font-extrabold text-slate-800">{card.value}</div>
                <div className="text-xs text-slate-500">{card.sub}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-2 font-extrabold text-slate-800">Review Actions</h3>
            <p className="mb-5 text-sm text-slate-500">
              Once you have reviewed all sections and added notes, return the project for corrections or approve it.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={openReviewModal}
                className="flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-600"
              >
                <AlertTriangle size={15} /> Return for Corrections
              </button>
              <button
                onClick={openReviewModal}
                className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-700"
              >
                <CheckCheck size={15} /> Approve Report
              </button>
              <button className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-100">
                <Send size={15} /> Submit to Authority
              </button>
              <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">
                <Download size={15} /> Download Review Report
              </button>
            </div>
          </div>

          {/* Review notes summary */}
          {(summary?.reviewerNotes.filter((n) => n.note.trim()).length ?? 0) > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="font-bold text-slate-800">Saved Review Notes</h3>
              </div>
              <div className="divide-y">
                {summary!.reviewerNotes.filter((n) => n.note.trim()).map((n: ReviewerNote) => (
                  <div key={n.section} className="px-5 py-4">
                    <div className="mb-1 flex items-center gap-2 text-xs font-bold text-slate-500">
                      <FileText size={12} /> {n.section}
                    </div>
                    <p className="text-sm text-slate-700">{n.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Review Modal ── */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-base font-extrabold text-slate-800">Return Project for Modifications</h3>
              <button onClick={() => setReviewModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="px-5 py-5">
              <p className="mb-4 text-sm text-slate-500">
                Review the aggregated notes. This will be sent back to the Report Coordinator for corrections.
              </p>
              <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Aggregated Review Notes</label>
              <textarea
                rows={10}
                value={aggregatedNotes}
                onChange={(e) => setAggregatedNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-3 font-mono text-xs outline-none focus:border-blue-500"
                placeholder="No notes added yet…"
              />
              <div className="mt-4 flex gap-3">
                <button onClick={() => setReviewModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button onClick={() => handleReviewDecision("returned")} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-500 py-2.5 text-sm font-bold text-white hover:bg-red-600">
                  Return to Data Entry
                </button>
                <button onClick={() => handleReviewDecision("approved")} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 text-sm font-bold text-white hover:bg-green-700">
                  <CheckCheck size={15} /> Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
