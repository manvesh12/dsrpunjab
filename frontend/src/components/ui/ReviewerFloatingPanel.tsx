import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  MessageSquarePlus,
  X,
  Send,
  CheckCheck,
  ChevronDown,
  Bell,
  User,
  FileText,
  BookOpen,
  Map,
  ChartNoAxesCombined,
  Layers3,
  RefreshCw,
  FileCheck2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { saveReviewerNote } from "../../api/workflow.api";

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────
const DSR_SECTIONS = [
  { id: "front-matter",   label: "Front Matter",          icon: FileText,           desc: "Cover page, certificates, preface" },
  { id: "chapters",       label: "Chapters",               icon: BookOpen,           desc: "All DSR report chapters" },
  { id: "plates",         label: "Plates & Maps",          icon: Map,                desc: "District and geology maps" },
  { id: "cross-sections", label: "Cross Section Graphs",   icon: ChartNoAxesCombined,desc: "River profiles and cross-sections" },
  { id: "annexures",      label: "Annexures I–VII",        icon: Layers3,            desc: "Primary DSR annexures" },
  { id: "annexures-btok", label: "Annexures B–K",          icon: Layers3,            desc: "Additional annexures" },
  { id: "replenishment",  label: "Replenishment Report",   icon: RefreshCw,          desc: "Survey and replenishment data" },
  { id: "model-dsr",      label: "Model DSR",              icon: FileCheck2,         desc: "Compiled model DSR report" },
];

const RECIPIENTS = [
  { id: "sdo",        name: "Sub-Divisional Officer",   role: "SDO",           dept: "Geology & Mining" },
  { id: "axen",       name: "Executive Engineer",       role: "AXEN",          dept: "Geology & Mining" },
  { id: "reviewer1",  name: "Reviewer – Level 1",       role: "Reviewer",      dept: "State Pollution Board" },
  { id: "reviewer2",  name: "Reviewer – Level 2",       role: "Sr. Reviewer",  dept: "Mining Department" },
  { id: "dc",         name: "District Coordinator",     role: "Coordinator",   dept: "District Administration" },
  { id: "admin",      name: "Portal Administrator",     role: "Admin",         dept: "DSR Portal Team" },
];

// ─────────────────────────────────────────────────────────
// Review notification stored type
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

function notifStorageKey(projectId: string) {
  return `dsr:review-notifs:${projectId}`;
}

function loadNotifications(projectId: string): ReviewNotification[] {
  try {
    return JSON.parse(localStorage.getItem(notifStorageKey(projectId)) || "[]");
  } catch { return []; }
}

function saveNotifications(projectId: string, notifs: ReviewNotification[]) {
  localStorage.setItem(notifStorageKey(projectId), JSON.stringify(notifs));
}

// ─────────────────────────────────────────────────────────
// Floating Reviewer Panel
// ─────────────────────────────────────────────────────────
export default function ReviewerFloatingPanel() {
  const { projectId = "1" } = useParams();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"select" | "write" | "send" | "done">("select");

  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const [notifs, setNotifs] = useState<ReviewNotification[]>([]);
  const [showNotifBadge, setShowNotifBadge] = useState(false);

  // Load notifications on mount / when panel opens
  useEffect(() => {
    const loaded = loadNotifications(projectId);
    setNotifs(loaded);
    setShowNotifBadge(loaded.some((n) => !n.read));
  }, [projectId, open]);

  const resetPanel = () => {
    setStep("select");
    setSelectedSection(null);
    setReviewText("");
    setSelectedRecipients([]);
  };

  const closePanel = () => {
    setOpen(false);
    resetPanel();
  };

  const toggleRecipient = (id: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleSend = async () => {
    if (!selectedSection || !reviewText.trim() || selectedRecipients.length === 0) {
      toast.error("Please fill in all fields and select at least one recipient.");
      return;
    }
    setSending(true);
    try {
      const section = DSR_SECTIONS.find((s) => s.id === selectedSection)!;

      // Save reviewer note to workflow state
      await saveReviewerNote(projectId, section.label, reviewText);

      // Create notifications for each recipient
      const newNotifs: ReviewNotification[] = selectedRecipients.map((rId) => {
        const recipient = RECIPIENTS.find((r) => r.id === rId)!;
        return {
          id: `${Date.now()}-${rId}`,
          projectId,
          sectionId: selectedSection,
          sectionLabel: section.label,
          note: reviewText,
          recipientId: rId,
          recipientName: recipient.name,
          sentAt: new Date().toISOString(),
          read: false,
        };
      });

      const existing = loadNotifications(projectId);
      const updated = [...newNotifs, ...existing];
      saveNotifications(projectId, updated);
      setNotifs(updated);
      setShowNotifBadge(true);

      setStep("done");
      toast.success(`Review sent to ${selectedRecipients.length} recipient(s)!`);
    } finally {
      setSending(false);
    }
  };

  const sectionObj = DSR_SECTIONS.find((s) => s.id === selectedSection);

  return (
    <>
      {/* ── Floating Trigger Button ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Notification badge bubble */}
        {showNotifBadge && !open && (
          <div className="animate-bounce rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 shadow-md">
            📋 Review notifications pending
          </div>
        )}

        <button
          onClick={() => { setOpen((p) => !p); if (!open) resetPanel(); }}
          className={`relative flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 ${
            open
              ? "bg-slate-700 text-white"
              : "bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700"
          }`}
          title="Reviewer Notes"
        >
          {open ? <X size={22} /> : <MessageSquarePlus size={22} />}
          {showNotifBadge && !open && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              {notifs.filter((n) => !n.read).length}
            </span>
          )}
        </button>
      </div>

      {/* ── Review Panel ── */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-700 to-blue-600 px-4 py-3.5">
            <div className="flex items-center gap-2 text-white">
              <MessageSquarePlus size={16} />
              <span className="text-sm font-bold">Send Review Feedback</span>
            </div>
            <div className="flex items-center gap-2">
              {step !== "select" && (
                <button
                  onClick={resetPanel}
                  className="rounded-lg px-2 py-0.5 text-[10px] font-semibold text-blue-200 hover:bg-white/10"
                >
                  ← Start over
                </button>
              )}
              <button onClick={closePanel} className="text-blue-200 hover:text-white">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex border-b border-slate-100 bg-slate-50">
            {(["select", "write", "send"] as const).map((s, i) => {
              const labels = ["1. Section", "2. Review", "3. Recipients"];
              const done =
                (s === "select" && (step === "write" || step === "send" || step === "done")) ||
                (s === "write" && (step === "send" || step === "done")) ||
                step === "done";
              const active = step === s;
              return (
                <div
                  key={s}
                  className={`flex flex-1 items-center justify-center gap-1 py-2 text-[10px] font-bold transition-colors ${
                    done ? "text-emerald-600" : active ? "text-blue-600" : "text-slate-400"
                  }`}
                >
                  {done ? <Check size={10} /> : <span>{i + 1}</span>}
                  {labels[i]}
                </div>
              );
            })}
          </div>

          <div className="max-h-[480px] overflow-y-auto">
            {/* ── Step 1: Select Section ── */}
            {step === "select" && (
              <div className="p-4">
                <p className="mb-3 text-xs text-slate-500">
                  Choose the DSR section you want to review:
                </p>
                <div className="space-y-1.5">
                  {DSR_SECTIONS.map((sec) => {
                    const Icon = sec.icon;
                    return (
                      <button
                        key={sec.id}
                        onClick={() => { setSelectedSection(sec.id); setStep("write"); }}
                        className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-blue-300 hover:bg-blue-50"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <Icon size={15} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-slate-800">{sec.label}</div>
                          <div className="text-[10px] text-slate-400">{sec.desc}</div>
                        </div>
                        <ChevronDown size={14} className="-rotate-90 text-slate-400" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Step 2: Write Review ── */}
            {step === "write" && sectionObj && (
              <div className="p-4">
                {/* Selected section chip */}
                <div className="mb-3 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2">
                  <sectionObj.icon size={14} className="text-blue-600" />
                  <span className="text-xs font-bold text-blue-700">{sectionObj.label}</span>
                </div>

                <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">
                  Review Feedback
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder={`What changes are needed in ${sectionObj.label}? Be specific about required corrections…`}
                  rows={6}
                  className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  autoFocus
                />
                <div className="mt-1 text-right text-[10px] text-slate-400">
                  {reviewText.length} characters
                </div>

                <button
                  disabled={!reviewText.trim()}
                  onClick={() => setStep("send")}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Next: Select Recipients →
                </button>
              </div>
            )}

            {/* ── Step 3: Select Recipients ── */}
            {step === "send" && (
              <div className="p-4">
                {/* Review summary */}
                <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-400">
                    {sectionObj && <sectionObj.icon size={11} />}
                    {sectionObj?.label}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-600">{reviewText}</p>
                </div>

                <label className="mb-2 block text-xs font-bold uppercase text-slate-500">
                  Send review to:
                </label>
                <div className="space-y-1.5">
                  {RECIPIENTS.map((rec) => {
                    const selected = selectedRecipients.includes(rec.id);
                    return (
                      <button
                        key={rec.id}
                        onClick={() => toggleRecipient(rec.id)}
                        className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                          selected
                            ? "border-blue-300 bg-blue-50"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {selected ? <Check size={14} /> : <User size={14} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-slate-800">{rec.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {rec.role} · {rec.dept}
                          </div>
                        </div>
                        <div
                          className={`h-4 w-4 shrink-0 rounded-full border-2 ${
                            selected ? "border-blue-600 bg-blue-600" : "border-slate-300"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Select all / none */}
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => setSelectedRecipients(RECIPIENTS.map((r) => r.id))}
                    className="flex-1 rounded-lg border border-slate-200 py-1.5 text-[10px] font-semibold text-slate-500 hover:bg-slate-50"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedRecipients([])}
                    className="flex-1 rounded-lg border border-slate-200 py-1.5 text-[10px] font-semibold text-slate-500 hover:bg-slate-50"
                  >
                    Clear
                  </button>
                </div>

                <button
                  disabled={selectedRecipients.length === 0 || sending}
                  onClick={handleSend}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send size={14} />
                  {sending
                    ? "Sending…"
                    : `Send to ${selectedRecipients.length} recipient${selectedRecipients.length !== 1 ? "s" : ""}`}
                </button>
              </div>
            )}

            {/* ── Step 4: Done ── */}
            {step === "done" && (
              <div className="flex flex-col items-center px-5 py-10 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
                  <CheckCheck size={32} className="text-emerald-600" />
                </div>
                <h3 className="text-base font-extrabold text-slate-800">Review Sent!</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Your review for <strong>{sectionObj?.label}</strong> has been sent to{" "}
                  {selectedRecipients.length} recipient(s) and saved to the workflow.
                </p>

                {/* Recipients list */}
                <div className="mt-4 w-full space-y-1.5">
                  {selectedRecipients.map((rId) => {
                    const rec = RECIPIENTS.find((r) => r.id === rId)!;
                    return (
                      <div
                        key={rId}
                        className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs"
                      >
                        <Bell size={11} className="text-emerald-600" />
                        <span className="font-semibold text-emerald-700">{rec.name}</span>
                        <span className="ml-auto text-emerald-500">{rec.role}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 flex w-full gap-3">
                  <button
                    onClick={resetPanel}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Send Another
                  </button>
                  <button
                    onClick={closePanel}
                    className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notifications list at bottom */}
          {step === "select" && notifs.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Recent Review Notifications
                </span>
                <button
                  onClick={() => {
                    const updated = notifs.map((n) => ({ ...n, read: true }));
                    saveNotifications(projectId, updated);
                    setNotifs(updated);
                    setShowNotifBadge(false);
                  }}
                  className="text-[10px] text-blue-600 hover:underline"
                >
                  Mark all read
                </button>
              </div>
              <div className="max-h-36 space-y-1.5 overflow-y-auto">
                {notifs.slice(0, 5).map((n) => (
                  <div
                    key={n.id}
                    className={`rounded-lg border px-3 py-2 text-xs ${
                      n.read
                        ? "border-slate-200 bg-white text-slate-500"
                        : "border-blue-200 bg-blue-50 text-blue-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{n.sectionLabel}</span>
                      <span className="shrink-0 text-[9px] opacity-60">
                        → {n.recipientName.split(" ")[0]}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-[10px] opacity-75">{n.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
