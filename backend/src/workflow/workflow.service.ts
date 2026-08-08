import { randomUUID } from "node:crypto";
import { SectionStatus } from "@prisma/client";
import { prisma } from "../database/prisma.client.js";
import { ApiError } from "../common/exceptions/api-error.js";
import type { AuthUser } from "../authentication/auth-user.js";
import { assertProjectDistrictAccess } from "../authorization/project-access.policy.js";
import { canReview } from "../authorization/role.policy.js";

type WorkflowStatus = "draft" | "submitted" | "under_review" | "returned" | "approved" | "final";
type NoteStatus = "open" | "resolved";
type NotePriority = "low" | "normal" | "high" | "critical";

interface WorkflowPerson {
  id: number;
  name: string;
  role: string;
}

interface WorkflowNote {
  id: string;
  section: string;
  sectionKey: string;
  note: string;
  priority: NotePriority;
  status: NoteStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  createdBy: WorkflowPerson;
  recipients: WorkflowPerson[];
}

interface WorkflowEvent {
  id: string;
  type: "note_created" | "note_resolved" | "note_reopened" | "review_returned" | "review_approved";
  message: string;
  createdAt: string;
  actor: WorkflowPerson;
  noteId?: string;
}

interface WorkflowState {
  status: WorkflowStatus;
  notes: WorkflowNote[];
  events: WorkflowEvent[];
  signatures: unknown[];
  lastUpdated: string;
}

const REVIEW_ROLES = new Set(["SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN", "REVIEWER"]);
const RECIPIENT_ROLES = [
  "DISTRICT_ADMIN",
  "DISTRICT_OFFICER",
  "GEOLOGIST",
  "SURVEY_OFFICER",
  "DATA_ENTRY_OPERATOR",
  "REPORT_GENERATOR",
  "REVIEWER",
];

function person(user: Pick<AuthUser, "id" | "fullName" | "role">): WorkflowPerson {
  return { id: Number(user.id), name: user.fullName, role: user.role };
}

function readState(raw?: string | null): Record<string, any> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function defaultWorkflow(): WorkflowState {
  return {
    status: "draft",
    notes: [],
    events: [],
    signatures: [],
    lastUpdated: new Date().toISOString(),
  };
}

function workflowFrom(state: Record<string, any>): WorkflowState {
  const current = state.reviewWorkflow;
  if (!current || typeof current !== "object" || Array.isArray(current)) return defaultWorkflow();
  return {
    status: current.status || "draft",
    notes: Array.isArray(current.notes) ? current.notes : [],
    events: Array.isArray(current.events) ? current.events : [],
    signatures: Array.isArray(current.signatures) ? current.signatures : [],
    lastUpdated: current.lastUpdated || new Date().toISOString(),
  };
}

function sectionKey(label: string) {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "general";
}

function normalizePriority(value: unknown): NotePriority {
  const priority = String(value || "normal").toLowerCase();
  return (["low", "normal", "high", "critical"] as const).includes(priority as NotePriority)
    ? (priority as NotePriority)
    : "normal";
}

function notificationType(projectId: bigint, noteId: string, kind = "REVIEW_NOTE") {
  return `${kind}:${projectId.toString()}:${noteId}`;
}

export class WorkflowService {
  async summary(projectId: bigint, user: AuthUser) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { district: { select: { name: true } } },
    });
    assertProjectDistrictAccess(project, user);
    const workflow = workflowFrom(readState(project.lastReviewedState));
    return {
      projectId: projectId.toString(),
      projectName: project.title || project.projectName,
      district: project.district?.name || "Unassigned",
      status: workflow.status,
      currentStep: Math.max(1, Math.min(8, Math.ceil((project.progress || 0) / 12.5))),
      totalSteps: 8,
      signatures: workflow.signatures,
      reviewerNotes: workflow.notes.map((note) => ({
        ...note,
        canUpdate: REVIEW_ROLES.has(user.role) ||
          note.createdBy.id === Number(user.id) ||
          note.recipients.some((recipient) => recipient.id === Number(user.id)),
      })),
      reviewEvents: workflow.events,
      canReview: canReview(user.role) || user.role === "STATE_ADMIN",
      openNotes: workflow.notes.filter((note) => note.status === "open").length,
      lastUpdated: workflow.lastUpdated,
    };
  }

  async recipients(projectId: bigint, user: AuthUser) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    assertProjectDistrictAccess(project, user);
    const users = await prisma.user.findMany({
      where: {
        active: true,
        role: { in: RECIPIENT_ROLES },
        ...(project.districtId ? { districtId: project.districtId } : {}),
      },
      select: { id: true, fullName: true, role: true, officeName: true, designation: true },
      orderBy: [{ role: "asc" }, { fullName: "asc" }],
    });
    return users.map((entry) => ({
      id: Number(entry.id),
      name: entry.fullName,
      role: entry.role,
      department: entry.officeName || entry.designation || "District DSR Team",
    }));
  }

  async createNote(projectId: bigint, body: any, user: AuthUser) {
    this.requireReviewer(user);
    const section = String(body?.section || body?.sectionLabel || "").trim();
    const noteText = String(body?.note || "").trim();
    if (!section) throw new ApiError(400, "REVIEW_SECTION_REQUIRED", "Select a report section.");
    if (noteText.length < 3) throw new ApiError(400, "REVIEW_NOTE_REQUIRED", "Write a review note before sending.");
    if (noteText.length > 5000) throw new ApiError(400, "REVIEW_NOTE_TOO_LONG", "Review notes cannot exceed 5000 characters.");

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    assertProjectDistrictAccess(project, user);
    const requestedIds: number[] = Array.from(new Set<number>((Array.isArray(body?.recipientIds) ? body.recipientIds : [])
      .map((id: unknown) => Number(id)).filter((id: number) => Number.isSafeInteger(id) && id > 0)));
    const recipientWhere = requestedIds.length
      ? { id: { in: requestedIds.map((id) => BigInt(id)) } }
      : { role: { in: ["DATA_ENTRY_OPERATOR", "DISTRICT_OFFICER", "DISTRICT_ADMIN"] } };
    const recipients = await prisma.user.findMany({
      where: {
        active: true,
        ...recipientWhere,
        ...(project.districtId ? { districtId: project.districtId } : {}),
      },
      select: { id: true, fullName: true, role: true },
    });
    if (!recipients.length) {
      throw new ApiError(400, "REVIEW_RECIPIENT_REQUIRED", "Select at least one valid project recipient.");
    }

    const now = new Date().toISOString();
    const note: WorkflowNote = {
      id: randomUUID(),
      section,
      sectionKey: String(body?.sectionKey || sectionKey(section)),
      note: noteText,
      priority: normalizePriority(body?.priority),
      status: "open",
      createdAt: now,
      updatedAt: now,
      createdBy: person(user),
      recipients: recipients.map((entry) => ({ id: Number(entry.id), name: entry.fullName, role: entry.role })),
    };
    const state = readState(project.lastReviewedState);
    const workflow = workflowFrom(state);
    workflow.status = "under_review";
    workflow.notes = [note, ...workflow.notes];
    workflow.events = [{
      id: randomUUID(), type: "note_created", noteId: note.id, actor: person(user), createdAt: now,
      message: `${user.fullName} requested changes in ${section}.`,
    }, ...workflow.events];
    workflow.lastUpdated = now;

    await prisma.$transaction([
      prisma.project.update({ where: { id: projectId }, data: { lastReviewedState: JSON.stringify({ ...state, reviewWorkflow: workflow }) } }),
      prisma.projectSection.updateMany({
        where: { projectId, sectionName: { in: [note.section, note.sectionKey] } },
        data: { status: SectionStatus.RETURNED },
      }),
      prisma.notification.createMany({
        data: recipients.map((recipient) => ({
          userId: recipient.id,
          type: notificationType(projectId, note.id),
          message: `${section}: ${noteText}`,
        })),
      }),
      prisma.workflowHistory.create({
        data: { reportId: projectId, action: "REVIEW_NOTE_CREATED", remarks: `${section}: ${noteText}`, performedBy: user.id },
      }),
    ]);
    return { ...note, canUpdate: true };
  }

  async setNoteStatus(projectId: bigint, noteId: string, status: NoteStatus, user: AuthUser) {
    if (status !== "open" && status !== "resolved") {
      throw new ApiError(400, "REVIEW_STATUS_INVALID", "Review note status must be open or resolved.");
    }
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    assertProjectDistrictAccess(project, user);
    const state = readState(project.lastReviewedState);
    const workflow = workflowFrom(state);
    const note = workflow.notes.find((entry) => entry.id === noteId);
    if (!note) throw new ApiError(404, "REVIEW_NOTE_NOT_FOUND", "Review note not found.");
    const isRecipient = note.recipients.some((recipient) => recipient.id === Number(user.id));
    if (!isRecipient && note.createdBy.id !== Number(user.id) && !REVIEW_ROLES.has(user.role)) {
      throw new ApiError(403, "REVIEW_NOTE_FORBIDDEN", "You cannot update this review note.");
    }
    const now = new Date().toISOString();
    note.status = status;
    note.updatedAt = now;
    note.resolvedAt = status === "resolved" ? now : undefined;
    workflow.events = [{
      id: randomUUID(), type: status === "resolved" ? "note_resolved" : "note_reopened", noteId,
      actor: person(user), createdAt: now,
      message: `${user.fullName} marked the ${note.section} note as ${status}.`,
    }, ...workflow.events];
    workflow.lastUpdated = now;
    await prisma.$transaction([
      prisma.project.update({ where: { id: projectId }, data: { lastReviewedState: JSON.stringify({ ...state, reviewWorkflow: workflow }) } }),
      prisma.projectSection.updateMany({
        where: { projectId, sectionName: { in: [note.section, note.sectionKey] } },
        data: { status: status === "resolved" ? SectionStatus.PENDING_REVIEW : SectionStatus.RETURNED },
      }),
      prisma.workflowHistory.create({
        data: { reportId: projectId, action: status === "resolved" ? "REVIEW_NOTE_RESOLVED" : "REVIEW_NOTE_REOPENED", remarks: note.section, performedBy: user.id },
      }),
    ]);
    return { ...note, canUpdate: true };
  }

  async saveSignatures(projectId: bigint, signatures: unknown[], user: AuthUser) {
    this.requireReviewer(user);
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    assertProjectDistrictAccess(project, user);
    const state = readState(project.lastReviewedState);
    const workflow = workflowFrom(state);
    workflow.signatures = Array.isArray(signatures) ? signatures : [];
    workflow.lastUpdated = new Date().toISOString();
    await prisma.project.update({ where: { id: projectId }, data: { lastReviewedState: JSON.stringify({ ...state, reviewWorkflow: workflow }) } });
  }

  async submitDecision(projectId: bigint, body: any, user: AuthUser) {
    this.requireReviewer(user);
    const decision = String(body?.decision || "").toLowerCase();
    if (decision !== "approved" && decision !== "returned") {
      throw new ApiError(400, "REVIEW_DECISION_INVALID", "Decision must be approved or returned.");
    }
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    assertProjectDistrictAccess(project, user);
    const state = readState(project.lastReviewedState);
    const workflow = workflowFrom(state);
    const openNotes = workflow.notes.filter((note) => note.status === "open");
    if (decision === "approved" && openNotes.length) {
      throw new ApiError(409, "REVIEW_OPEN_NOTES", `Resolve ${openNotes.length} open review note(s) before approval.`);
    }
    const aggregatedNotes = String(body?.aggregatedNotes || "").trim();
    if (decision === "returned" && !aggregatedNotes && !openNotes.length) {
      throw new ApiError(400, "REVIEW_RETURN_REASON_REQUIRED", "Add review notes before returning the project.");
    }
    const now = new Date().toISOString();
    workflow.status = decision;
    workflow.events = [{
      id: randomUUID(), type: decision === "approved" ? "review_approved" : "review_returned",
      actor: person(user), createdAt: now,
      message: decision === "approved" ? `${user.fullName} approved the report.` : `${user.fullName} returned the report for corrections.`,
    }, ...workflow.events];
    workflow.lastUpdated = now;
    const recipientIds = Array.from(new Set([
      ...workflow.notes.flatMap((note) => note.recipients.map((recipient) => recipient.id)),
      ...(project.createdBy ? [Number(project.createdBy)] : []),
    ])).filter((id) => Number.isSafeInteger(id) && id > 0 && id !== Number(user.id));
    const notificationUsers = recipientIds.length
      ? await prisma.user.findMany({
          where: { id: { in: recipientIds.map((id) => BigInt(id)) }, active: true },
          select: { id: true },
        })
      : [];
    const notificationMessage = decision === "approved"
      ? `${project.title || project.projectName} has been approved.`
      : `${project.title || project.projectName} was returned for corrections.${aggregatedNotes ? ` ${aggregatedNotes}` : ""}`;
    const operations: any[] = [
      prisma.project.update({
        where: { id: projectId },
        data: {
          lastReviewedState: JSON.stringify({
            ...state,
            reviewWorkflow: workflow,
            lastDecision: { decision, aggregatedNotes, submittedAt: now, submittedBy: person(user) },
          }),
        },
      }),
      prisma.workflowHistory.create({
        data: { reportId: projectId, action: decision === "approved" ? "REVIEW_APPROVED" : "REVIEW_RETURNED", remarks: aggregatedNotes || null, performedBy: user.id },
      }),
      prisma.projectSection.updateMany({
        where: decision === "approved"
          ? { projectId }
          : {
              projectId,
              sectionName: { in: openNotes.flatMap((note) => [note.section, note.sectionKey]) },
            },
        data: { status: decision === "approved" ? SectionStatus.APPROVED : SectionStatus.RETURNED },
      }),
    ];
    if (notificationUsers.length) {
      operations.push(prisma.notification.createMany({
        data: notificationUsers.map((entry) => ({ userId: entry.id, type: notificationType(projectId, randomUUID(), `REVIEW_${decision.toUpperCase()}`), message: notificationMessage })),
      }));
    }
    await prisma.$transaction(operations);
    return { status: workflow.status, lastUpdated: workflow.lastUpdated };
  }

  private requireReviewer(user: AuthUser) {
    if (!canReview(user.role) && user.role !== "STATE_ADMIN") {
      throw new ApiError(403, "REVIEW_FORBIDDEN", "Only reviewers and administrators can perform this action.");
    }
  }
}

export const workflowService = new WorkflowService();
