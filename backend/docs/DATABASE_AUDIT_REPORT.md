# Smart DSR Portal Database Audit Report

Date: 2026-07-10

## Scope

This audit reviewed the local Prisma schema, seed script, backend Prisma query usage, and database-related service code for the Smart DSR Portal.

The workspace does not include `backend/.env`, so a live PostgreSQL connection was not available. Because of that, this audit did not execute production catalog checks against `pg_tables`, `pg_indexes`, `pg_constraint`, `pg_stat_user_indexes`, `pg_stat_statements`, triggers, or live data quality queries. No destructive migration was attempted.

## Current Architecture Summary

- ORM: Prisma with PostgreSQL.
- Schema source: `backend/prisma/schema.prisma`.
- Migrations: no checked-in Prisma migration directory. The backend `start` script currently uses `prisma db push --accept-data-loss`, which is not recommended for production change management.
- Core domains:
  - Authentication and users: `User`, `RefreshToken`, `OtpVerification`, `PasswordResetRequest`, `Invitation`.
  - Projects and report state: `Project`, `DsrFile`, `WorkflowHistory`, `AuditLog`, `DsrReportChunk`.
  - Report generation: `Report`, `ModelDsr`, `ModelDsrSection`, `ModelDsrFile`, `ModelDsrVersion`, `GeneratedDsr`, `GeneratedDsrVersion`.
  - Replenishment reports: `ReplenishmentStudy`.
  - Configuration: `SystemSetting`.

## Improvements Made

Only additive indexes were added to `schema.prisma`. These are safe, backward-compatible performance and integrity-support changes that do not rename columns, remove fields, alter existing data, or add foreign keys that could fail on orphaned production rows.

Added index coverage for:

- User administration and RBAC filtering:
  - `User(role, active)`
  - `User(district, role)`
  - `User(createdAt)`
- Authentication token cleanup and validation:
  - `RefreshToken(userId, revoked, expiresAt)`
  - `RefreshToken(expiresAt)`
- Project dashboard, district filtering, phase listing, and ownership views:
  - `Project(status, createdAt)`
  - `Project(createdBy, createdAt)`
  - `Project(district, status, createdAt)`
- Report list and workflow filtering:
  - `Report(projectId, status)`
  - `Report(status, createdAt)`
  - `Report(submittedBy, createdAt)`
  - `WorkflowHistory(reportId, performedAt)`
  - `WorkflowHistory(performedBy, performedAt)`
  - `WorkflowHistory(action, performedAt)`
- Audit log search and filtering:
  - `AuditLog(userId, createdAt)`
  - `AuditLog(action, createdAt)`
  - `AuditLog(method, path, createdAt)`
  - `AuditLog(status, createdAt)`
- File lookup and project file listing:
  - `DsrFile(projectId, createdAt)`
  - `DsrFile(annexureId)`
  - `DsrFile(objectKey)`
- Model DSR listing, section loading, permissions, imports, and generated DSRs:
  - `ModelDsr(status, createdAt)`
  - `ModelDsr(district, status)`
  - `ModelDsr(createdBy, createdAt)`
  - `ModelDsr(category, status)`
  - `ModelDsrSection(modelId, isIncluded)`
  - `ModelDsrSection(contentType)`
  - `ModelDsrFile(modelId, createdAt)`
  - `ModelDsrFile(fileType)`
  - `ModelDsrVersion(modelId, createdAt)`
  - `ModelDsrPermission(userId, accessLevel)`
  - `ModelImportHistory(modelId, importedAt)`
  - `ModelImportHistory(projectId, importedAt)`
  - `ModelImportHistory(importedBy, importedAt)`
  - `GeneratedDsr(modelId, status, createdAt)`
  - `GeneratedDsr(projectId, status, createdAt)`
  - `GeneratedDsrVersion(generatedDsrId, createdAt)`
- OTP and password reset security workflows:
  - `PasswordResetRequest(identifier, used, createdAt)`
  - `PasswordResetRequest(userId, used, createdAt)`
  - `PasswordResetRequest(expiresAt)`
  - `OtpVerification(identifier, purpose, used, createdAt)`
  - `OtpVerification(expiresAt)`
- Invitation, replenishment, settings, and search support:
  - `Invitation(status, expiresAt)`
  - `Invitation(createdBy, createdAt)`
  - `ReplenishmentStudy(projectId, createdAt)`
  - `ReplenishmentStudy(status, createdAt)`
  - `ReplenishmentStudy(createdBy, createdAt)`
  - `SystemSetting(updatedAt)`
  - `DsrReportChunk(projectId, section)`
  - `DsrReportChunk(createdAt)`

## Findings

### Strengths

- Sensitive OTP values are stored as hashes, not plain text.
- Passwords use bcrypt hashing.
- Refresh tokens are persisted and revocable.
- Several critical ownership relationships already use cascade or set-null behavior:
  - `Project -> DsrFile`
  - `Project -> ReplenishmentStudy`
  - `Project -> DsrReportChunk`
  - `ModelDsr -> ModelDsrSection`
  - `ModelDsr -> ModelDsrFile`
  - `ModelDsr -> ModelDsrVersion`
  - `GeneratedDsr -> GeneratedDsrVersion`
- `DsrFile` has a unique `(projectId, annexureId)` key, which supports deterministic final PDF/file replacement.
- Report versions exist for Model DSR and Generated DSR domains.

### Risks And Gaps

- No migration history is checked in. Production databases should use reviewed migration files, not only `db push`.
- The backend `start` script includes `prisma db push --accept-data-loss`; this is unsafe for government production deployments.
- Several fields represent foreign keys but are not declared as Prisma relations:
  - `Report.projectId`, `submittedBy`, `reviewedBy`, `approvedBy`
  - `WorkflowHistory.reportId`, `performedBy`
  - `AuditLog.userId`
  - `Project.createdBy`
  - `ModelDsr.createdBy`
  - `ModelDsrPermission.userId`
  - `Invitation.createdBy`
  These should not be converted blindly until live orphan checks are run.
- Some important tables do not yet include full enterprise audit columns:
  - `updatedBy`
  - `deletedAt`
  - `version`
  - `createdBy`
  Coverage is partial and varies by table.
- `projectState`, `surveyData`, and `reportState` contain large JSON/text payloads. This preserves flexibility, but it limits relational integrity and makes some report data difficult to query or validate.
- `DsrFile` is currently used for both final PDFs and uploaded support files. This is workable, but long-term file versioning, checksum, uploaded-by, report linkage, and logical file categories should be normalized.
- Some delete endpoints permanently delete rows and storage objects. For production, projects, reports, model templates, files, and replenishment studies should prefer soft-delete where business rules require retention.
- `WorkflowHistory.reportId` is used as a project ID in several project workflow paths. This naming is confusing and should be standardized carefully in a backward-compatible migration.

## Query Optimization Notes

- `reports/audit-logs` loads all workflow rows, then all related projects. Add pagination before this table grows.
- `projects.get("/")` includes all files for every visible project. Use pagination and selective includes for large deployments.
- Model DSR list includes all sections for all templates. Use a summary endpoint or pagination if templates become large.
- File lookup by `annexureId`, `objectKey`, and `fileName` now has better index support, but `findFirst` by non-unique file names can still be ambiguous.
- OTP cleanup should be scheduled periodically by `expiresAt` and `used` filters.

## Recommended Production Migration Strategy

1. Stop using `prisma db push --accept-data-loss` in production.
2. Introduce checked-in Prisma migrations from this point forward.
3. Before adding foreign keys to existing loose ID fields, run orphan checks in staging:
   - `Report.projectId` not found in `Project.id`
   - `WorkflowHistory.reportId` not found in intended parent table
   - `AuditLog.userId` not found in `User.id`
   - `Project.createdBy` not found in `User.id`
   - `ModelDsrPermission.userId` not found in `User.id`
4. Backfill missing audit fields before enforcing non-null constraints.
5. Add soft-delete columns incrementally and update APIs to filter active records.
6. Add file checksum and uploaded-by metadata after storage compatibility is confirmed.
7. Use `EXPLAIN ANALYZE` and `pg_stat_statements` to confirm the added indexes are used.

## Live Database Checks To Run

Run these in staging or production before any constraint refactor:

```sql
select schemaname, tablename from pg_tables where schemaname = 'public' order by tablename;
select indexname, tablename, indexdef from pg_indexes where schemaname = 'public' order by tablename, indexname;
select conname, conrelid::regclass as table_name, contype, pg_get_constraintdef(oid) from pg_constraint order by table_name::text, conname;
select relname, n_live_tup, n_dead_tup from pg_stat_user_tables order by n_live_tup desc;
select relname, indexrelname, idx_scan from pg_stat_user_indexes order by idx_scan asc;
```

## Verification

- Prisma schema validation should be run after changes:
  - `npx prisma validate`
- Backend compile should be run after generated client refresh:
  - `npm run build`

## Remaining Recommendations

- Add migrations and remove production `db push --accept-data-loss`.
- Introduce soft delete for project, report, replenishment, model template, and file records.
- Normalize report metadata that must be searched or filtered out of JSON payloads.
- Add checksum, uploadedBy, deletedAt, version, and file category to file management after API compatibility planning.
- Add pagination to project, audit, workflow, and model list endpoints.
- Add foreign keys only after live orphan cleanup.
- Decide whether `WorkflowHistory.reportId` should be renamed to `entityId` or split into `projectId` and `reportId` in a compatibility migration.
