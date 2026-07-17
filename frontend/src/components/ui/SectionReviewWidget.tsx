import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
  MessageSquareDiff,
  X,
  Send,
  CheckCheck,
  ChevronDown,
  User,
  Check,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { saveReviewerNote } from "../../api/workflow.api";

// ─────────────────────────────────────────────────────────
// Route → Section mapping
// ─────────────────────────────────────────────────────────
const ROUTE_SECTION_MAP: Record<string, string> = {
  "front-matter":   "Front Matter",
  "chapters":       "Chapters",
  "plates":         "Plates & Maps",
  "cross-sections": "Cross Section Graphs",
  "annexures":      "Annexures I–VII",
  "replenishment":  "Replenishment Report",
  "model-dsr":      "Model DSR",
  "preview":        "Report Preview",
  "generate":       "Final PDF Generation",
  "reviewer":       "Reviewer & Workflow",
};

function detectSection(pathname: string): string {
  // Extract last meaningful segment
  const parts = pathname.split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  return ROUTE_SECTION_MAP[last] ?? "General Review";
}

// ─────────────────────────────────────────────────────────
// Recipients
// ─────────────────────────────────────────────────────────
const RECIPIENTS = [
  { id: "sdo",       name: "Sub-Divisional Officer",  role: "SDO" },
  { id: "axen",      name: "Executive Engineer",      role: "AXEN" },
  { id: "reviewer1", name: "Reviewer – Level 1",      role: "Reviewer" },
  { id: "reviewer2", name: "Reviewer – Level 2",      role: "Sr. Reviewer" },
  { id: "dc",        name: "District Coordinator",    role: "Coordinator" },
];

// ─────────────────────────────────────────────────────────
// Notification storage
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

function appendNotifications(projectId: string, newNotifs: ReviewNotification[]) {
  try {
    const existing: ReviewNotification[] = JSON.parse(
      localStorage.getItem(notifKey(projectId)) || "[]"
    );
    localStorage.setItem(notifKey(projectId), JSON.stringify([...newNotifs, ...existing]));
  } catch { /* silent */ }
}

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────
export default function SectionReviewWidget() {
  const { projectId = "1" } = useParams();
  const location = useLocation();

  const section = detectSection(location.pathname);
  const sectionSlug = location.pathname.split("/").filter(Boolean).pop() ?? "general";

  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState("");
  const [showRecipients, setShowRecipients] = useState(false);
  const [selected, setSelected] = useState<string[]>(["reviewer1"]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset sent state when section changes
  useEffect(() => {
    setSent(false);
    setNote("");
  }, [location.pathname]);

  // Auto-focus textarea when expanded
  useEffect(() => {
    if (expanded && !sent) {
      setTimeout(() => textareaRef.current?.focus(), 120);
    }
  }, [expanded, sent]);

  const toggleRecipient = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleSend = async () => {
    if (!note.trim()) { toast.error("Please write a review note."); return; }
    if (selected.length === 0) { toast.error("Select at least one recipient."); return; }

    setSending(true);
    try {
      await saveReviewerNote(projectId, section, note);

      const newNotifs: ReviewNotification[] = selected.map((rId) => {
        const rec = RECIPIENTS.find((r) => r.id === rId)!;
        return {
          id: `${Date.now()}-${rId}`,
          projectId,
          sectionId: sectionSlug,
          sectionLabel: section,
          note,
          recipientId: rId,
          recipientName: rec.name,
          sentAt: new Date().toISOString(),
          read: false,
        };
      });

      appendNotifications(projectId, newNotifs);
      setSent(true);
      toast.success(`Review sent to ${selected.length} recipient(s)!`);
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setNote("");
    setSent(false);
    setShowRecipients(false);
  };

  // Don't render on reviewer page itself
  if (location.pathname.includes("/reviewer")) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {/* Expanded panel */}
      {expanded && (
        <div
          className="mb-3 w-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.14)" }}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-indigo-700 to-indigo-600 px-4 py-3">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-indigo-300">
                <MessageSquareDiff size={11} />
                Section Review
              </div>
              <div className="mt-0.5 text-sm font-extrabold text-white">{section}</div>
            </div>
            <button
              onClick={() => { setExpanded(false); reset(); }}
              className="rounded-lg p-1 text-indigo-200 hover:bg-white/10 hover:text-white"
            >
              <X size={15} />
            </button>
          </div>

          {sent ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center px-5 py-8 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
                <CheckCheck size={26} className="text-emerald-600" />
              </div>
              <p className="text-sm font-bold text-slate-800">Review sent!</p>
              <p className="mt-1 text-xs text-slate-500">
                Notified {selected.length} recipient(s) for <em>{section}</em>
              </p>
              <div className="mt-4 flex w-full gap-2">
                <button
                  onClick={reset}
                  className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Send Another
                </button>
                <button
                  onClick={() => { setExpanded(false); reset(); }}
                  className="flex-1 rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  Continue Working
                </button>
              </div>
            </div>
          ) : (
            /* ── Input state ── */
            <div className="p-4">
              {/* Note textarea */}
              <label className="mb-1.5 block text-[10px] font-bold uppercase text-slate-400">
                Your review feedback
              </label>
              <textarea
                ref={textareaRef}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => {
                  // Ctrl+Enter to send
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleSend();
                }}
                placeholder={`What changes are needed in ${section}?\n\nTip: Ctrl+Enter to send`}
                rows={4}
                className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">{note.length} chars</span>
              </div>

              {/* Recipients accordion */}
              <button
                onClick={() => setShowRecipients((p) => !p)}
                className="mt-3 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                <div className="flex items-center gap-1.5">
                  <User size={12} />
                  {selected.length === 0
                    ? "Select recipients"
                    : `${selected.length} recipient${selected.length > 1 ? "s" : ""} selected`}
                </div>
                {showRecipients ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {showRecipients && (
                <div className="mt-2 space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-2">
                  {RECIPIENTS.map((rec) => {
                    const on = selected.includes(rec.id);
                    return (
                      <button
                        key={rec.id}
                        onClick={() => toggleRecipient(rec.id)}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${
                          on ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-white"
                        }`}
                      >
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                            on ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300"
                          }`}
                        >
                          {on && <Check size={10} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-semibold leading-tight">{rec.name}</div>
                          <div className="text-[9px] text-slate-400">{rec.role}</div>
                        </div>
                      </button>
                    );
                  })}
                  <div className="flex gap-1.5 border-t border-slate-200 pt-1.5">
                    <button
                      onClick={() => setSelected(RECIPIENTS.map((r) => r.id))}
                      className="flex-1 rounded-lg py-1 text-[10px] font-semibold text-indigo-600 hover:bg-indigo-50"
                    >
                      All
                    </button>
                    <button
                      onClick={() => setSelected([])}
                      className="flex-1 rounded-lg py-1 text-[10px] font-semibold text-slate-500 hover:bg-slate-100"
                    >
                      None
                    </button>
                  </div>
                </div>
              )}

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={sending || !note.trim() || selected.length === 0}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 active:scale-95 transition-transform"
              >
                {sending ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send size={14} /> Send Review
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Trigger button ── */}
      <button
        onClick={() => setExpanded((p) => !p)}
        title={`Review: ${section}`}
        className={`group flex items-center gap-2 rounded-2xl shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 ${
          expanded
            ? "bg-indigo-700 px-4 py-3 text-white"
            : "bg-indigo-600 px-4 py-3 text-white hover:bg-indigo-700"
        }`}
        style={{ boxShadow: "0 4px 20px rgba(79,70,229,0.4)" }}
      >
        {expanded ? (
          <>
            <X size={16} />
            <span className="text-xs font-bold">Close</span>
          </>
        ) : (
          <>
            <MessageSquareDiff size={18} />
            <div className="text-left">
              <div className="text-[9px] font-semibold uppercase tracking-wide opacity-80">Review</div>
              <div className="max-w-[130px] truncate text-xs font-bold leading-tight">{section}</div>
            </div>
          </>
        )}
      </button>
    </div>
  );
}
