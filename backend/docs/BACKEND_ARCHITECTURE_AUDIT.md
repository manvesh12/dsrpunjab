# Backend Architecture Audit and Migration Plan

## 1. Scope and preservation contract

This audit covers the Express/TypeScript API, Prisma schema, authentication, authorization, queues, storage, email, deployment files, scripts and operational endpoints. The migration contract is:

- preserve every existing URL, HTTP method and successful response shape;
- preserve business decisions and database schema during architectural extraction;
- move one domain at a time behind compatibility exports;
- require type-check and endpoint regression checks before removing old adapters.

## 2. Pre-migration architecture baseline

The backend is a TypeScript Express application using Prisma/PostgreSQL, JWT, BullMQ/Redis, local or S3-compatible object storage and SMTP/Brevo email.

```text
Express server
  -> global security/rate-limit/body middleware
  -> authentication + mutation audit middleware
  -> 13 route files / 66 declared endpoints
       -> route-level validation and business decisions
       -> PrismaClient directly in 10 route files
       -> storage, email and queue helpers
  -> PostgreSQL / Redis / local disk or S3 / SMTP or Brevo
```

Before migration, route files acted as controller, service, validator and repository at the same time. `src/lib` contained cross-cutting code, but its name did not communicate ownership or architectural boundaries.

## 3. Measured inventory

| Area | Evidence |
| --- | --- |
| Source | 31 original TypeScript files under `src` |
| Routes | 13 route files and 66 declared endpoints |
| Direct database coupling | 10 route files use the Prisma singleton directly |
| Largest file | `routes/auth.ts`, 762 lines |
| Other large files | `model-dsr.ts` 623, `users.ts` 462, `projects.ts` 365 |
| Email | `lib/email.ts`, 268 lines and multiple delivery/template responsibilities |
| Validation | `lib/validation.ts` has only two helpers; most validation remains in routes |
| Automated tests | one security load script; no unit/controller/repository suite |
| Migrations | Prisma schema and seed exist; no checked-in migration history |

After the sixth migration batch, all thirteen legacy route files are compatibility-only exports and direct Prisma use inside route files has fallen from 10 to zero. `server.ts` now composes routes directly from their domain modules.

## 4. Pre-migration file responsibility catalogue

| File | Current responsibility | Main problem |
| --- | --- | --- |
| `server.ts` | Express composition, security, routes, health, errors, logging | composition and operational behavior mixed |
| `worker.ts` | PDF/Excel workers | placeholder processing and console logging |
| `routes/auth.ts` | login, refresh, registration, invitation, OTP, reset | 13 endpoints and several workflows in 762 lines |
| `routes/users.ts` | users, invitations, spreadsheet imports | HTTP, validation, hashing, Excel and DB mixed |
| `routes/model-dsr.ts` | model CRUD, versions, generation, import and preview | broad aggregate with repeated error blocks |
| `routes/projects.ts` | CRUD, phases, rollback, import and state | large payload and transaction responsibilities mixed |
| `routes/replenishment.ts` | study CRUD and DSR state synchronization | parsing, size guards, persistence and HTTP mixed |
| `routes/reports.ts` | report CRUD, workflow, audit reads | workflow decisions directly in route |
| `routes/files.ts` | upload/download/delete | Multer, storage and metadata consistency mixed |
| `routes/pdf.ts` | legacy PDF upload/download/email | base64 parsing and file orchestration in route |
| `routes/settings.ts` | public settings and admin updates | constants, fallback rules and repository mixed |
| `routes/search.ts` | vector search/index | raw queries and HTTP mixed |
| `routes/jobs.ts` | enqueue PDF/Excel work | small but queue errors shaped locally |
| `routes/stream.ts` | Redis SSE subscribe/publish | connection lifecycle and HTTP mixed |
| `lib/auth.ts` | JWT middleware, role mapping and permission checks | authentication, authorization and DB lookup mixed |
| `lib/email.ts` | providers, templates and five mail workflows | provider, configuration and presentation mixed |
| `lib/storage.ts` | local/S3 adapter | useful boundary, but provider interface is implicit |
| `lib/audit.ts` | audit middleware and DB write | fire-and-forget writes can be lost under failure |
| `lib/security.ts` | rate-limit policies | hardcoded policy values |
| `lib/config.ts` | environment loading | formerly flat and unvalidated |
| `lib/validation.ts` | ID and string helpers | validation is still scattered |
| `lib/projects.ts` | project DTO mapping | mapper is stored as a generic library |
| `lib/permissions.ts` | role-permission mapping | correct concept, wrong generic location |
| `lib/district-access.ts` | district authorization | mixes policy checks with HTTP responses |
| `lib/prisma.ts` | database client | valid singleton boundary |
| `jobs/queues.ts` | queue instances and Redis config | queue construction and event logging mixed |

## 5. Problems found

### Architecture and SOLID

- Route files violate single responsibility by combining transport, validation, decisions, queries and integrations.
- Database implementation is visible throughout transport code, preventing isolated service tests.
- Dependencies are imported as global singletons instead of accepted at construction boundaries.
- Domain terms are split between generic `routes` and `lib` directories.
- Error handling is repeated and produces inconsistent response structures.

### Validation and API consistency

- Zod is concentrated in authentication; most domains perform ad-hoc checks.
- Some invalid IDs use a shared helper while UUID and body fields are checked manually.
- Responses alternate between `{ error }`, `{ success, error }`, raw models and domain DTOs.
- A global response-envelope change would break the current frontend; standardization must be versioned or added only to new APIs.

### Security

- `xlsx@0.18.5` has published high-severity prototype-pollution and ReDoS advisories; npm reports no automatic registry fix, so replacement needs Excel import/export compatibility testing.
- Development JWT fallbacks are unsafe if accidentally used in production.
- Access tokens require a database lookup for every authenticated request; correct for revocation, but costly without a short cache.
- CORS supports one configured origin rather than an explicit allow-list.
- Upload limits exist, but MIME signature/virus-scan hooks are not implemented.
- OTP verification workflows need atomic attempt/update operations to avoid concurrent reuse races.
- Sensitive workflow data should be excluded explicitly from logs and audit metadata.

### Database and concurrency

- `start` executes `prisma db push --accept-data-loss`; this is unsafe for production deployment.
- No migration history is checked in, so schema rollout and rollback are not reproducible.
- Storage upload and database metadata writes are not one transaction; compensation is required when either side fails.
- OTP, invitation and workflow state transitions should use conditional updates/transactions.
- Large `projectState`, generated payload and embedding content can create large reads and memory pressure.
- Report/workflow foreign-key relationships are represented as scalar IDs in several models, limiting referential guarantees.

### Performance and operations

- Semantic search currently generates random mock embeddings, so indexed/query vectors are nondeterministic and search relevance is not production-ready.
- Authentication queries the full user record on every protected request.
- Large JSON/text state is returned or parsed in request handlers.
- Dashboard counts are suitable for short TTL caching.
- Settings, permissions and district/master data are suitable for cache-aside reads.
- Readiness previously reported Redis as healthy without performing a Redis health operation.
- Queue instances connect during module import and generate repeated connection errors when Redis is optional or unavailable.
- Console logging was unstructured and lacked a request correlation ID.
- Background job workers currently acknowledge placeholder work rather than durable processing results.

### Testing gaps

- No unit tests for services, validators, policies or mappers.
- No repository integration tests against PostgreSQL.
- No controller contract tests protecting current response shapes.
- No workflow concurrency tests or storage failure-compensation tests.

## 6. Target folder structure

```text
backend/
  src/
    config/
    common/
      constants/ helpers/ utils/ exceptions/ filters/ middleware/ logging/
    auth/
      auth.controller.ts auth.service.ts auth.repository.ts
      auth.routes.ts auth.dto.ts auth.validator.ts security/
    users/ roles/ permissions/ districts/
    projects/ reports/ replenishment/ annexures/ surveys/
    uploads/ downloads/ dashboard/ notifications/ email/ pdf/ workflow/ audit/
    scheduler/ queue/ storage/ database/
    server.ts worker.ts
  prisma/
    schema.prisma migrations/ seed.ts
  tests/
    unit/ integration/ contract/ fixtures/
  docs/
```

Folders are created when a real responsibility is migrated; empty architecture theatre is avoided.

## 7. Target dependency direction

```text
Routes -> Controllers -> Services -> Repository interfaces -> Prisma repositories
                         |        -> Storage / Mail / Queue interfaces
                         -> Domain policies, validators and mappers

Common/config is imported by infrastructure and composition only.
Repositories never import controllers or services.
Domain services never depend on Express Request/Response.
```

Circular dependencies are not present in the current import graph, but direct singleton imports create hidden runtime coupling. Constructor injection is introduced at service/repository boundaries.

## 8. Controller, service and repository rules

- Controllers parse already-validated request data, call one service operation and serialize the existing response.
- Services own workflow, decisions, calculations, transaction boundaries and integration orchestration.
- Repositories own Prisma queries and database mapping only.
- DTOs distinguish create/update/request/response types.
- Zod validators live with the owning domain and are reused by HTTP and job consumers.
- Mappers convert Prisma entities to public DTOs; database records are not exposed implicitly.

## 9. Authentication and authorization migration

Split the current authentication file in this order:

1. token service: sign, verify and refresh-token rotation;
2. password service: hashing and password policy;
3. OTP service/repository: generation, hashed storage, attempts and atomic consumption;
4. invitation service: invitation state machine and registration;
5. reset service: request, resend, verify and reset;
6. authentication middleware: session extraction and user loading;
7. authorization policies: role, permission and district checks.

Compatibility routes retain all 13 existing paths until contract tests pass.

## 10. Configuration strategy

Environment access is centralized under `src/config`. The next hardening step should validate production configuration at startup with Zod, including database URL, non-default JWT secrets, CORS origins, storage provider, Redis and mail provider. Defaults remain temporarily for local compatibility.

## 11. Error handling and API standardization

The new global handler returns a stable error payload containing `error`, `code` and `requestId`. Existing successful response bodies remain unchanged. A uniform `{ success, message, data, metadata }` envelope should only be introduced under a versioned `/api/v2` contract or after coordinated frontend migration.

## 12. Logging, monitoring and health

- Every request receives or generates an `x-request-id`.
- HTTP and unhandled error logs are structured JSON.
- Logging must redact passwords, tokens, OTPs and uploaded content.
- Liveness checks process availability only.
- Readiness must check PostgreSQL and, when required, Redis/storage dependencies.
- Future metrics: request latency, error rate, DB pool saturation, queue depth, job age, upload failures and auth failures.

## 13. Cache strategy

| Data | Suggested TTL/invalidation |
| --- | --- |
| Dashboard counts | 15–30 seconds; invalidate on project/report completion |
| System settings | 1–5 minutes; invalidate on update |
| Role permissions | process cache; invalidate on configuration deployment |
| District/master data | 10–60 minutes; invalidate on master update |
| Model DSR preview metadata | existing persisted cache plus version-key invalidation |

Do not cache user-specific district-scoped queries without including user scope in the key.

## 14. File storage and background jobs

- Define a `StorageProvider` interface for put/get/delete/signed URL.
- Keep local disk and S3 implementations behind the interface.
- Validate extension, declared MIME, detected file signature and size.
- Add a virus-scan hook before files become downloadable.
- Use compensating deletion if object storage succeeds and metadata persistence fails.
- Move PDF, Excel, large report and email processing to jobs with idempotency keys, retry policy and a dead-letter workflow.

## 15. Testing strategy

1. Contract tests snapshot all current endpoints, status codes and success/error bodies.
2. Unit tests instantiate services with fake repositories.
3. Repository tests use an isolated PostgreSQL database and migrations.
4. Integration tests cover auth, district access, project workflow, replenishment and files.
5. Concurrency tests cover OTP consumption, invitations, report transitions and duplicate uploads.
6. Security tests cover rate limits, token failures, privilege escalation, payload size and unsafe uploads.

## 16. Migration plan

| Phase | Scope | Risk |
| --- | --- | --- |
| 1 | config, request context, structured logging, global error foundation | low |
| 2 | dashboard and settings vertical slices | low |
| 3 | reports and replenishment | medium |
| 4 | projects and files/storage | medium-high |
| 5 | users and invitations | high |
| 6 | authentication/OTP/reset | highest |
| 7 | model DSR and background generation | high |
| 8 | remove compatibility adapters after contract parity | controlled |

Every phase requires: type-check, unit tests, API contract comparison, database query review and rollback-ready commit.

## 17. Risk analysis

- **Response-shape drift:** protect with controller contract tests.
- **Authorization regression:** test every role/district combination before moving policies.
- **Transaction drift:** preserve query ordering first, then introduce explicit transactions separately.
- **Generated report changes:** fixture-test PDF/model/replenishment outputs.
- **Storage orphaning:** add compensation and reconciliation jobs.
- **Deployment schema loss:** replace `db push --accept-data-loss` with reviewed migrations before production rollout.
- **Big-bang refactor risk:** compatibility exports keep imports and routes stable throughout migration.

## 18. Production readiness checklist

- [ ] Production refuses default JWT and refresh secrets.
- [ ] Prisma migrations are reviewed and deployed separately from app startup.
- [ ] API contract tests cover all current endpoints.
- [ ] Database backup and restore are tested.
- [ ] CORS allow-list and proxy trust are environment-specific.
- [ ] Redis, storage and mail health/alerts are configured.
- [ ] Upload signature checks and malware scanning are enabled.
- [ ] Logs are structured, redacted and centrally retained.
- [ ] Queue jobs are idempotent and have dead-letter handling.
- [ ] Rate limits use a distributed store in multi-instance deployments.
- [ ] Graceful HTTP, Prisma, Redis and worker shutdown is implemented.
- [ ] Load, security and failure-recovery tests pass.

## 19. First implemented vertical slices

Dashboard now demonstrates the target layering without changing `GET /api/dashboard/stats`:

```text
dashboard.routes -> dashboard.controller -> dashboard.service -> dashboard.repository -> Prisma
```

The old `routes/dashboard.ts` is a compatibility export. Request IDs, structured HTTP logs, centralized unhandled errors and isolated configuration are also introduced as migration foundations.

Settings now demonstrates the same layering plus centralized validation and fallback behavior:

```text
settings.routes -> settings.controller -> settings.validator + settings.service
                                          -> settings.repository -> Prisma
```

`GET /api/settings/:key` remains public, `PUT /api/settings/:key` retains its admin authorization, and the existing public defaults/degraded fallback are preserved.

Reports now separates six existing endpoints into validator, controller, service and repository layers. Role decisions remain in the service, Prisma access is isolated, and workflow/audit DTO mapping is unchanged.

Replenishment now separates all five existing endpoints, including project-state synchronization, size protection, district access, CRUD and legacy re-creation behavior. The shared district policy is independent of Express and the previous `lib/district-access` API remains available as a compatibility adapter.

The first batch is protected by TypeScript compilation and ten unit tests covering dashboard calculations, settings fallback, report validation, district policy and replenishment DSR-state synchronization.

The second batch migrates all eight Project endpoints and all three general File endpoints. Project phase creation retains its database transaction, rollback/import behavior remains intact, and project object deletion still uses best-effort storage cleanup. Storage now has explicit local-disk and S3 provider implementations behind `StorageService`; existing PDF callers continue through compatibility exports. File upload now compensates by deleting an object when its database metadata write fails. The suite now contains 16 passing unit tests.

The third batch migrates Search, queue submission, Redis progress streaming and legacy PDF endpoints. Redis connection parsing is shared, search embeds behind a provider interface, and PDF authorization/validation/persistence are separated. The intentionally existing random embedding implementation is isolated and clearly marked for replacement after governance and relevance tests. The suite now contains 20 passing unit tests.

The fourth batch migrates all nine User endpoints. User management, password policy, invitation workflow, spreadsheet parsing/export and persistence now have separate owners. Route-level admin protection and every existing URL remain unchanged. The suite now contains 24 passing unit tests.

The fifth batch migrates all 13 Auth endpoints into session, OTP, password-reset, invitation-registration, validation and repository modules. Cookie paths, response fields and audit events remain compatible. Invited OTP verification now accepts both the current `INVITE_REGISTER` purpose and the legacy `REGISTER` purpose, resolving a purpose mismatch without invalidating old records. The suite now contains 28 passing unit tests.

The sixth batch migrates all 13 Model DSR endpoints. Section normalization/defaults, template lifecycle, generation, project import and persistence have separate owners. Model import now applies the same district-access policy as other project mutations. All original route files are compatibility exports, the active route layer contains no Prisma calls, and the suite contains 32 passing unit tests.

## 20. Final implemented architecture

The migration now has 147 focused TypeScript source files across 25 top-level modules. The thirteen historical files in `src/routes` are compatibility-only exports; `app.ts` composes the active domain routers directly.

```text
server.ts (process lifecycle)
  -> app.ts (Express composition)
     -> domain.routes
        -> domain.controller
           -> domain.service
              -> domain.repository -> database/prisma.client
              -> authorization policies
              -> storage/email/queue provider interfaces
```

Implemented cross-cutting boundaries:

- authentication user loading and JWT parsing are under `authentication`;
- role, permission and project/district policies are under `authorization`;
- audit middleware, service and repository are independent;
- environment access is isolated under `config`;
- JSON serialization, shared validation, rate limiting, request context, logging and errors are under `common`;
- Prisma construction and application database lifecycle are under `database`;
- SMTP/Brevo delivery, templates and mail workflows are under `email`;
- health controller/service/repository are independent from server bootstrap;
- local disk and S3 implementations satisfy a storage-provider interface;
- queue and worker logging is structured and process shutdown closes HTTP, Prisma, Redis queue and worker resources.

Active domain modules no longer import compatibility `lib/*` paths. Direct Prisma usage is limited to repository and database lifecycle files. Controllers have no Prisma access. `lib/*` and `routes/*` remain small re-export adapters so external or historical imports do not break.

The test suite now contains 39 passing unit tests covering validation, policies, service decisions, storage compensation, authentication compatibility, email contracts and readiness behavior. TypeScript/Prisma build and the full test suite pass.

## 21. Deliberately unresolved production blockers

These items require deployment, infrastructure or product decisions and were not silently changed during the architecture migration:

1. `npm start` still runs `prisma db push --accept-data-loss`; replace it with reviewed Prisma migrations before production deployment.
2. `xlsx@0.18.5` still has high-severity advisories and no safe automatic upgrade; select a replacement and run spreadsheet fixture compatibility tests.
3. Semantic search still uses the isolated random mock embedding provider; select an approved deterministic embedding service/model.
4. Redis readiness still reports the historical response contract without an actual Redis ping; make Redis required/optional policy explicit, then implement the corresponding probe.
5. Queue processors still return placeholder acknowledgements; real PDF/Excel processors need idempotency keys, durable result metadata and dead-letter operations.
6. Rate limiting is process-local; multi-instance production needs a distributed store.
7. Upload signature detection and malware scanning need an approved scanning service.
8. No checked-in migration history exists yet, so database rollback is not reproducible.

The codebase is modular and materially safer to maintain, but production sign-off should remain blocked until the applicable items above and the unchecked readiness checklist are resolved.
