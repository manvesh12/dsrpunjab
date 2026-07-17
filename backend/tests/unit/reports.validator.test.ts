import assert from "node:assert/strict";
import test from "node:test";
import { ApiError } from "../../src/common/exceptions/api-error.js";
import { reportWorkflowDto, updateReportStatusDto } from "../../src/reports/reports.validator.js";

test("report workflow input keeps the existing normalization", () => {
  assert.deepEqual(reportWorkflowDto("42", { action: " approve ", remarks: "done" }), {
    reportId: 42n,
    action: "APPROVE",
    remarks: "done"
  });
});

test("invalid report status returns a typed 400 error", () => {
  assert.throws(
    () => updateReportStatusDto("42", {}, { status: "NOT_REAL" }),
    (error: unknown) => error instanceof ApiError && error.status === 400 && error.code === "INVALID_REPORT_STATUS"
  );
});
