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
  section: string;
  note: string;
  updatedAt: string;
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
  lastUpdated: string;
}
