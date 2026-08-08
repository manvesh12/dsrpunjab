import { apiClient } from "./client";
import type {
  SignatureAuthority,
  ReviewerNote,
  ReviewSubmission,
  WorkflowSummary,
  WorkflowPerson,
  CreateReviewerNoteInput,
} from "../types/workflow.types";

const STORAGE_KEY_PREFIX = "dsr:workflow:";

function localKey(projectId: string) {
  return `${STORAGE_KEY_PREFIX}${projectId}`;
}

function defaultSignatures(): SignatureAuthority[] {
  return [
    {
      id: 1,
      order: 1,
      role: "SDO",
      name: "Sub-Divisional Officer",
      dept: "Department of Geology & Mining, Punjab",
      signed: false,
    },
    {
      id: 2,
      order: 2,
      role: "AXEN",
      name: "Executive Engineer",
      dept: "Department of Geology & Mining, Punjab",
      signed: false,
    },
    {
      id: 3,
      order: 3,
      role: "REVIEWER_1",
      name: "Reviewer – Level 1",
      dept: "Punjab State Pollution Control Board",
      signed: false,
    },
    {
      id: 4,
      order: 4,
      role: "REVIEWER_2",
      name: "Reviewer – Level 2",
      dept: "State Mining Department, Punjab",
      signed: false,
    },
  ];
}

function loadLocal(projectId: string): WorkflowSummary | null {
  try {
    const raw = localStorage.getItem(localKey(projectId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLocal(summary: WorkflowSummary) {
  localStorage.setItem(localKey(summary.projectId), JSON.stringify(summary));
}

function normalizeSummary(summary: WorkflowSummary): WorkflowSummary {
  const reviewerNotes = (summary.reviewerNotes || []).map((note, index) => ({
    ...note,
    id: note.id || `${note.section}-${note.updatedAt || index}`,
    sectionKey: note.sectionKey || note.section.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    priority: note.priority || "normal",
    status: note.status || "open",
    createdAt: note.createdAt || note.updatedAt || new Date().toISOString(),
    updatedAt: note.updatedAt || note.createdAt || new Date().toISOString(),
    createdBy: note.createdBy || { id: 0, name: "Reviewer", role: "REVIEWER" },
    recipients: note.recipients || [],
  }));
  return {
    ...summary,
    reviewerNotes,
    reviewEvents: summary.reviewEvents || [],
    canReview: summary.canReview ?? false,
    openNotes: summary.openNotes ?? reviewerNotes.filter((note) => note.status === "open").length,
  };
}

export async function getWorkflowSummary(
  projectId: string
): Promise<WorkflowSummary> {
  try {
    const res = await apiClient.get<WorkflowSummary>(
      `/projects/${projectId}/workflow`
    );
    const summary = normalizeSummary(res.data);
    saveLocal(summary);
    return summary;
  } catch (error: unknown) {
    const status = typeof error === "object" && error !== null && "response" in error
      ? (error as { response?: { status?: number } }).response?.status
      : undefined;
    if (status && status < 500) throw error;
  }

  const local = loadLocal(projectId);
  if (local) return normalizeSummary(local);

  const fresh: WorkflowSummary = {
    projectId,
    projectName: `Project ${projectId}`,
    district: "Jalandhar",
    status: "draft",
    currentStep: 1,
    totalSteps: 8,
    signatures: defaultSignatures(),
    reviewerNotes: [],
    reviewEvents: [],
    canReview: false,
    openNotes: 0,
    lastUpdated: new Date().toISOString(),
  };
  saveLocal(fresh);
  return fresh;
}

export async function saveSignature(
  projectId: string,
  signatureId: number,
  method: string,
  signatureImage?: string
): Promise<void> {
  const summary = await getWorkflowSummary(projectId);
  const sig = summary.signatures.find((s) => s.id === signatureId);
  if (!sig) return;

  sig.signed = true;
  sig.signedAt = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  sig.method = method;
  if (signatureImage) sig.signatureImage = signatureImage;

  summary.lastUpdated = new Date().toISOString();
  saveLocal(summary);

  try {
    await apiClient.put(`/projects/${projectId}/workflow/signatures`, {
      signatures: summary.signatures,
    });
  } catch {
    // silent
  }
}

export async function saveReviewerNote(
  projectId: string,
  section: string,
  note: string,
  options: Omit<CreateReviewerNoteInput, "section" | "note"> = {}
): Promise<ReviewerNote> {
  const { data } = await apiClient.post<ReviewerNote>(`/projects/${projectId}/workflow/notes`, {
    section,
    note,
    ...options,
  });
  return data;
}

export async function getReviewRecipients(projectId: string): Promise<WorkflowPerson[]> {
  const { data } = await apiClient.get<WorkflowPerson[]>(`/projects/${projectId}/workflow/recipients`);
  return data;
}

export async function setReviewerNoteStatus(
  projectId: string,
  noteId: string,
  status: ReviewerNote["status"]
): Promise<ReviewerNote> {
  const { data } = await apiClient.patch<ReviewerNote>(`/projects/${projectId}/workflow/notes/${noteId}`, { status });
  return data;
}

export async function submitReview(
  projectId: string,
  submission: ReviewSubmission
): Promise<void> {
  await apiClient.post(`/projects/${projectId}/workflow/review`, submission);
}

export type { SignatureAuthority, ReviewerNote };
