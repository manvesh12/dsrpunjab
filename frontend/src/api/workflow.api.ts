import { apiClient } from "./client";
import type {
  SignatureAuthority,
  ReviewerNote,
  ReviewSubmission,
  WorkflowSummary,
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

export async function getWorkflowSummary(
  projectId: string
): Promise<WorkflowSummary> {
  try {
    const res = await apiClient.get<WorkflowSummary>(
      `/projects/${projectId}/workflow`
    );
    const summary = res.data;
    saveLocal(summary);
    return summary;
  } catch {
    // fall through
  }

  const local = loadLocal(projectId);
  if (local) return local;

  const fresh: WorkflowSummary = {
    projectId,
    projectName: `Project ${projectId}`,
    district: "Jalandhar",
    status: "draft",
    currentStep: 1,
    totalSteps: 8,
    signatures: defaultSignatures(),
    reviewerNotes: [],
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
  note: string
): Promise<void> {
  const summary = await getWorkflowSummary(projectId);
  const existing = summary.reviewerNotes.find((n) => n.section === section);
  if (existing) {
    existing.note = note;
    existing.updatedAt = new Date().toISOString();
  } else {
    summary.reviewerNotes.push({
      section,
      note,
      updatedAt: new Date().toISOString(),
    });
  }
  summary.lastUpdated = new Date().toISOString();
  saveLocal(summary);

  try {
    await apiClient.put(`/projects/${projectId}/workflow/notes`, {
      notes: summary.reviewerNotes,
    });
  } catch {
    // silent
  }
}

export async function submitReview(
  projectId: string,
  submission: ReviewSubmission
): Promise<void> {
  const summary = await getWorkflowSummary(projectId);
  summary.status = submission.decision === "approved" ? "approved" : "returned";
  summary.lastUpdated = new Date().toISOString();
  saveLocal(summary);

  try {
    await apiClient.post(`/projects/${projectId}/workflow/review`, submission);
  } catch {
    // silent
  }
}

export type { SignatureAuthority, ReviewerNote };
