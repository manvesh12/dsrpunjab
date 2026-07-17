# Backend File Structure Guide

This guide explains where each responsibility lives after the migration. A feature follows one dependency direction:

```text
route -> controller -> service -> repository -> Prisma
                       |       -> provider interfaces (storage/email/queue)
                       -> validators, policies and mappers
```

## Entry points

| File | Responsibility | Used by |
| --- | --- | --- |
| `src/app.ts` | Builds Express, orders middleware and mounts every active router. It does not open a port. | `server.ts`, future HTTP contract tests |
| `src/server.ts` | Opens the HTTP port and coordinates graceful process shutdown. | `npm run dev`, `npm start` |
| `src/worker.ts` | Starts PDF/Excel BullMQ workers and closes them on shutdown. | `npm run dev:worker`, `npm run start:worker` |

## File naming contract

These suffixes have the same meaning in every domain:

| Suffix | Single responsibility |
| --- | --- |
| `.routes.ts` | URL and middleware wiring only |
| `.controller.ts` | Translate Express request/response and call a service |
| `.service.ts` | Business rules, decisions and workflow orchestration |
| `.repository.ts` | Database reads/writes only |
| `.validator.ts` | Parse and validate external input |
| `.dto.ts` / `.types.ts` | Request, response and internal contracts |
| `.mapper.ts` | Convert persistence models into API DTOs |
| `.constants.ts` | Stable domain constants and limits |
| `.policy.ts` | Pure authorization decision |
| `.provider.ts` | Infrastructure adapter behind an interface |
| `.middleware.ts` | Reusable Express request-chain behavior |

## Authentication and authorization

| File | Responsibility |
| --- | --- |
| `auth/auth.routes.ts` | Preserves all authentication endpoint URLs. |
| `auth/auth.controller.ts` | Cookie/request/response handling and calls to auth workflows. |
| `auth/auth.repository.ts` | Login, OTP, invitation, reset and refresh-token Prisma queries. |
| `auth/auth.validator.ts` | Login, invited registration and password-reset input rules. |
| `auth/auth.types.ts` | Auth workflow interfaces such as the audit callback. |
| `auth/auth.constants.ts` | Refresh-token and OTP timing constants. |
| `auth/session.service.ts` | Login, refresh, logout and session response creation. |
| `auth/otp.service.ts` | OTP generation, hashing and verification decisions. |
| `auth/password-reset.service.ts` | Reset request/resend/verify/change workflow. |
| `auth/invited-registration.service.ts` | Invite-only registration and activation workflow. |
| `auth/security/password.service.ts` | Password policy, hashing and comparison. |
| `authentication/auth-user.ts` | Minimal authenticated-user type attached to Express requests. |
| `authentication/token.service.ts` | Access-token signing and subject verification. |
| `authentication/authentication.repository.ts` | Loads the current session user. |
| `authentication/authentication.middleware.ts` | Reads bearer/cookie token and attaches the current user. |
| `authorization/permissions.ts` | Typed role-to-permission matrix. |
| `authorization/role.policy.ts` | Admin/review/upload and frontend-role decisions. |
| `authorization/project-access.policy.ts` | District-scoped project access decisions. |
| `authorization/authorization.middleware.ts` | Role-gate Express middleware. |

## Business domains

| Folder | Files and ownership |
| --- | --- |
| `dashboard/` | `routes` mounts stats; `controller` handles HTTP; `service` calculates counts; `repository` runs count queries; `dto` defines the result. |
| `projects/` | `routes`, `controller`, `service`, `repository` and `validator` own project CRUD, phases, rollback and import. `projects.mapper.ts` owns the public project shape. |
| `reports/` | `routes`, `controller`, `service`, `repository`, `validator` and `dto` own report CRUD, workflow and audit reads. |
| `replenishment/` | `routes`, `controller`, `service`, `repository`, `validator` and `constants` own replenishment CRUD, payload limits and DSR-state synchronization. |
| `model-dsr/` | `routes`, `controller`, `service` and `repository` own templates, versions, generation, import and preview. `section-normalizer.ts` owns section defaults/normalization. |
| `users/` | `routes` and `controller` expose admin APIs. `user-management.service`, `invitation.service`, `user-roster.service` and `user-spreadsheet.service` split CRUD, invitations, roster and Excel workflows. `repository`, `validator`, `mapper` and `constants` own persistence, input, output and stable values. |
| `settings/` | Layered routes/controller/service/repository with `validator`, `dto` and `constants` for public defaults and admin updates. |
| `search/` | Layered search/index endpoints. `embedding.service.ts` isolates the current embedding implementation so it can be replaced without changing the service. |
| `pdf/` | Layered legacy PDF upload/download/email behavior. `validator` handles base64/signature input and `constants` owns limits. |
| `uploads/` | Layered file metadata and storage orchestration. `raw-upload-reader` owns Multer input extraction; validator/constants own safety limits. |

Annexures, surveys, downloads and workflow do not have empty decorative folders. Their current behavior belongs to `model-dsr`, `uploads`/`pdf`, and `reports` respectively. If they gain an independent API or lifecycle, they should become first-class domains using the same file contract.

## Infrastructure and shared modules

| Folder/file | Responsibility |
| --- | --- |
| `config/environment.ts` | The only source-level environment-variable reader and typed runtime configuration. |
| `config/index.ts` | Public configuration export. |
| `common/exceptions/api-error.ts` | Typed operational error with status, code and details. |
| `common/filters/global-error-handler.ts` | Final unhandled-error serializer and correlated error logging. |
| `common/logging/logger.ts` | Structured JSON logger. |
| `common/middleware/request-context.ts` | Creates/propagates request IDs. |
| `common/middleware/request-logger.ts` | Logs request completion with correlation context. |
| `common/middleware/not-found.ts` | Final unmatched-route response. |
| `common/middleware/rate-limit.ts` | API, auth and upload rate-limit policies. |
| `common/utils/json-safe.ts` | Converts BigInt-containing values into JSON-safe output. |
| `common/validators/shared.validator.ts` | Small reusable scalar validators retained for compatible endpoints. |
| `database/prisma.client.ts` | Owns the single Prisma client instance. |
| `database/database.lifecycle.ts` | Disconnects Prisma during application shutdown. |
| `audit/audit.middleware.ts` | Captures explicit and mutation audit events. |
| `audit/audit.service.ts` | Serializes metadata and performs best-effort audit orchestration. |
| `audit/audit.repository.ts` | Writes audit records. |
| `health/health.routes.ts` | Mounts health, liveness and readiness URLs. |
| `health/health.controller.ts` | Preserves health response/status contracts. |
| `health/health.service.ts` | Coordinates dependency readiness. |
| `health/health.repository.ts` | Executes the database readiness query. |
| `email/email.types.ts` | Delivery message/provider contracts. |
| `email/email.provider.ts` | SMTP-first, Brevo-fallback transport adapter. |
| `email/email.templates.ts` | Builds the six existing email bodies and subjects. |
| `email/email.service.ts` | Public mail workflows and their historical failure behavior. |
| `storage/storage-provider.ts` | Object-storage interface. |
| `storage/local-storage.provider.ts` | Local filesystem implementation. |
| `storage/s3-storage.provider.ts` | S3/MinIO-compatible implementation. |
| `storage/storage.service.ts` | Chooses and exposes the configured provider. |
| `queue/redis-connection.ts` | Parses Redis connection configuration. |
| `queue/jobs.routes.ts` | Job submission URLs. |
| `queue/jobs.controller.ts` | HTTP translation for job submission. |
| `queue/jobs.service.ts` | Authorization, enqueueing and queue-unavailable decisions. |
| `jobs/queues.ts` | BullMQ queue construction, retry policy, logging and closure. |
| `notifications/progress-stream.routes.ts` | SSE/publish URL wiring. |
| `notifications/progress-stream.controller.ts` | SSE connection lifecycle and HTTP translation. |
| `notifications/progress-stream.service.ts` | Redis publish/subscribe implementation. |

## Compatibility adapters

The thirteen `src/routes/*.ts` files only re-export their new domain routers. The files under `src/lib` similarly re-export authentication, authorization, audit, email, storage, Prisma, validation, mapping and configuration APIs. Active source code does not import these adapters; they exist only to avoid breaking historical imports during deployment or external tooling.

## Database and tests

| Path | Responsibility |
| --- | --- |
| `prisma/schema.prisma` | Existing PostgreSQL data model; unchanged by the architecture migration. |
| `prisma/seed.ts` | Existing initial-data seed. |
| `tests/unit/*.test.ts` | 39 fast regression tests for services, validators, policies, templates and failure compensation. |
| `docs/BACKEND_ARCHITECTURE_AUDIT.md` | Baseline audit, dependency map, risks, migration history and production checklist. |
| `docs/BACKEND_FILE_STRUCTURE.md` | This ownership/onboarding guide. |

There is intentionally no empty `roles`, `districts`, `annexures`, `surveys`, `scheduler`, `cache`, `metrics` or `monitoring` directory. A folder is added only when executable behavior has a real owner; policies and current behavior already live in the modules named above.
