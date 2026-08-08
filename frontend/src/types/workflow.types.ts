// ─── Signature / Reviewer Workflow Types ──────────────────────────────────────

export type SignMethod = "aadhaar" | "dsc" | "otp";

export type AuthorityRole =
  | "SDO"
  | "AXEN"
  | "REVIEWER_1"
  | "REVIEWER_2"
  | "DISTRICT_OWNER";

export interface SignatureAuthority {
  id: number;
  order: number;
  role: AuthorityRole;
  name: string;
  dept: string;
  signed: boolean;
  signedAt?: string;
  method?: string;
  signatureImage?: string;
}

export interface ReviewerNote {
  id: string;
  section: string;
  sectionKey: string;
  note: string;
  priority: "low" | "normal" | "high" | "critical";
  status: "open" | "resolved";
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  createdBy: WorkflowPerson;
  recipients: WorkflowPerson[];
  canUpdate?: boolean;
}

export interface WorkflowPerson {
  id: number;
  name: string;
  role: string;
  department?: string;
}

export interface ReviewEvent {
  id: string;
  type: "note_created" | "note_resolved" | "note_reopened" | "review_returned" | "review_approved";
  message: string;
  createdAt: string;
  actor: WorkflowPerson;
  noteId?: string;
}

export interface CreateReviewerNoteInput {
  section: string;
  sectionKey?: string;
  note: string;
  priority?: ReviewerNote["priority"];
  recipientIds?: number[];
}

export type ReviewDecision = "approved" | "returned";

export interface ReviewSubmission {
  decision: ReviewDecision;
  aggregatedNotes: string;
  submittedAt: string;
  submittedBy: string;
}

// Completion checklist items
export interface ChecklistItem {
  key: string;
  label: string;
  done: boolean;
  note: string;
  locked: boolean;
}

export type WorkflowStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "returned"
  | "approved"
  | "final";

export interface WorkflowSummary {
  projectId: string;
  projectName: string;
  district: string;
  status: WorkflowStatus;
  currentStep: number;
  totalSteps: number;
  signatures: SignatureAuthority[];
  reviewerNotes: ReviewerNote[];
  reviewEvents: ReviewEvent[];
  canReview: boolean;
  openNotes: number;
  lastUpdated: string;
}
