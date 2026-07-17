import type { Queue } from "bullmq";
import { ApiError } from "../common/exceptions/api-error.js";
import type { AuthUser } from "../authentication/auth-user.js";
import { canUpload } from "../authorization/role.policy.js";
import { excelQueue, pdfQueue } from "../jobs/queues.js";

export class JobsService {
  constructor(
    private readonly pdf: Pick<Queue, "add">,
    private readonly excel: Pick<Queue, "add">
  ) {}

  async enqueuePdf(payload: unknown, user: AuthUser) {
    this.requireUpload(user);
    try {
      const job = await this.pdf.add("generate-pdf", payload || {});
      return { jobId: job.id, status: "queued" };
    } catch (error) {
      throw new ApiError(503, "PDF_QUEUE_UNAVAILABLE", "PDF queue is unavailable. Start Redis or use the simple local portal.", error instanceof Error ? error.message : String(error));
    }
  }

  async enqueueExcel(payload: unknown, user: AuthUser) {
    this.requireUpload(user);
    try {
      const job = await this.excel.add("process-excel", payload || {});
      return { jobId: job.id, status: "queued" };
    } catch (error) {
      throw new ApiError(503, "EXCEL_QUEUE_UNAVAILABLE", "Excel queue is unavailable. Start Redis or use the simple local portal.", error instanceof Error ? error.message : String(error));
    }
  }

  private requireUpload(user: AuthUser) {
    if (!canUpload(user.role)) throw new ApiError(403, "ACCESS_DENIED", "Access denied");
  }
}

export const jobsService = new JobsService(pdfQueue, excelQueue);
