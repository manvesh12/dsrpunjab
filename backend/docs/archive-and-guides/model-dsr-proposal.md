# Model DSR Feature - Implementation Proposal

## 1. Understand Existing System

**Impact Analysis**

*   **Components Affected:**
    *   **Dashboard:** Will need new widgets or links for Model DSR templates and generated reports.
    *   **Existing DSR workflows:** Will need to integrate with or coexist alongside the new Model DSR engine.
    *   **Reporting engine:** Must be extended to support dynamic template population and rendering.
    *   **Storage:** Needs to handle new template configurations, generated PDFs, and draft versions.
    *   **Audit logs:** Must track actions like template creation, versioning, and publishing.
    *   **Admin panel:** Requires new screens for template management and configuration.
*   **Components Untouched:**
    *   **Authentication:** Existing JWT/session mechanisms remain unchanged.
    *   **Core User Management:** No changes to base user models unless new roles are strictly needed.
    *   **Basic File Uploads (Non-DSR):** Standard image/avatar uploads remain unaffected.
*   **Dependencies:**
    *   Next.js (Frontend UI)
    *   Express.js (Backend APIs)
    *   Prisma / PostgreSQL (Database layer)
    *   PDF Generation Library (e.g., Puppeteer, PDFKit, or existing solution)

---

## 2. Feature Definition

**Objectives for Model DSR**

**Admin Capabilities:**
*   Create Model DSR (Build a new template)
*   Edit Model DSR (Modify existing templates with version control)
*   Delete Model DSR (Soft delete / Archive)
*   Version Model DSR (Track changes to templates over time)
*   Select Model DSR (Choose a template for a specific project/day)
*   Generate Final DSR (Produce the end report)
*   Save Draft (Save work in progress without publishing)
*   Publish (Make a draft template available for use)
*   Archive (Retire old templates)

**Generated DSR Characteristics:**
*   Preserve template structure exactly as designed.
*   Populate dynamic values accurately from DB or user input.
*   Export to high-quality PDF.
*   Support regeneration if underlying data changes (prior to final approval).

---

## 3. Functional Architecture

**Frontend Design:**
*   **Navigation changes:** Add "Model DSRs" to the main admin sidebar.
*   **Admin screens:** A list view of templates with status indicators.
*   **Forms:** Drag-and-drop or block-based builder for defining sections.
*   **Preview UI:** A live preview component showing how the DSR will look with dummy/real data.
*   **Validation UX:** Real-time feedback for missing mandatory fields or structural errors.

**Backend Design:**
*   **Services:** `TemplateService`, `DsrGenerationService`, `VersionControlService`.
*   **Controllers:** REST controllers mapping to the services above.
*   **Business layer:** Logic to merge template sections with dynamic data and handle version bumps.
*   **Validation layer:** Ensure templates meet business rules before publishing.
*   **Generation engine:** The core module that takes JSON template + Data -> HTML -> PDF.
*   **Storage:** Securely store final PDFs in S3/Local storage and save the URL in the DB.

**Key Concepts Explained:**
*   **Metadata:** Information about the template (author, tags, effective date).
*   **Documents:** The final generated PDF reports.
*   **Attachments:** Additional files users can append to a specific DSR instance.
*   **Versioning:** Using an immutable record strategy where editing a published template creates a `v+1` draft.

---

## 4. Database Design

**Proposed Schema Changes**

**`model_dsr` Table**
*   `id` (UUID, PK)
*   `title` (String)
*   `description` (Text)
*   `status` (Enum: DRAFT, PUBLISHED, ARCHIVED)
*   `created_by` (UUID, FK to Users)
*   `created_at` (Timestamp)
*   `updated_at` (Timestamp)
*   `version` (Int)

**`model_dsr_sections` Table**
*   `id` (UUID, PK)
*   `model_id` (UUID, FK to model_dsr)
*   `section_name` (String)
*   `sequence` (Int)
*   `content_type` (Enum: TEXT, TABLE, IMAGE, DYNAMIC_GRID)
*   `configuration` (JSONB) - Stores layout, data bindings, etc.

**`generated_dsr` Table**
*   `id` (UUID, PK)
*   `model_id` (UUID, FK)
*   `project_id` (UUID, FK)
*   `status` (Enum: DRAFT, FINAL)
*   `data_payload` (JSONB) - The actual data entered by the user.
*   `pdf_url` (String)

**`generated_dsr_versions` Table**
*   Tracks history of generated reports for auditing.
*   `id`, `generated_dsr_id`, `data_payload`, `pdf_url`, `created_at`.

**`attachments` & `audit_logs`**
*   Integrate with existing tables, adding polymorphic relations or new ENUM types (e.g., `ACTION_TYPE = 'TEMPLATE_PUBLISHED'`).

**Database Architecture Notes:**
*   **Relations:** `model_dsr` 1:N `model_dsr_sections`. `model_dsr` 1:N `generated_dsr`.
*   **Indexes:** B-Tree indexes on `status`, `created_by`, and `model_id`. GIN index on `configuration` if querying inside JSONB is needed.
*   **Scaling:** JSONB allows flexible templates without schema migrations. Heavy PDF files are offloaded to object storage.

---

## 5. Workflow Design

The core lifecycle clearly separates the structure (template) from the content (data), following a distinct 3-step process:

**Step 1 — Admin creates/uploads Model DSR (Template)**
*   Defines the overall structure: Chapters, Headings, Static text, and Tables layout.
*   Sets up placeholders for dynamic content (e.g., Annexure placeholders, Map placeholders).
*   *Note: This template contains no actual district or production data.*

**Step 2 — Admin uploads District Data (Payload)**
*   User selects the Model DSR template and inputs the actual data for that specific report instance.
*   Uploaded data includes: District details, Production data, Maps, Coordinates, Survey reports, Annexures, Images, and Replenishment values.

**Step 3 — System generates Final DSR**
*   **Logic:** `Template + Uploaded Data = Final DSR`
*   The system dynamically substitutes the placeholders from Step 1 with the uploaded data from Step 2 to export the final document.

**Example Mapping:**
*   **Model DSR (Template):**
    ```text
    Chapter 4: General Profile of District
    District Name: {{district_name}}
    Population: {{population}}
    Revenue: {{revenue}}
    ```
*   **Admin Uploads (Data Payload):**
    `district_name` = Jalandhar, `population` = X, `revenue` = Y
*   **Generated Final DSR:**
    ```text
    Chapter 4: General Profile of District
    District Name: Jalandhar
    Population: X
    Revenue: Y
    ```

**Step 4 — Update Existing DSR (Optional)**
*   If data needs correction prior to final approval, the user re-opens the instance, modifies the uploaded District Data (Step 2), and the system regenerates the Final DSR (Step 3), saving a new version.

---

## 6. API Design

**Template APIs**
*   `GET /api/v1/model-dsrs` - List templates (filters: status, version).
*   `GET /api/v1/model-dsrs/:id` - Get template with sections.
*   `POST /api/v1/model-dsrs` - Create new draft template.
*   `PUT /api/v1/model-dsrs/:id` - Update draft template or sections.
*   `POST /api/v1/model-dsrs/:id/publish` - Publish template.
*   `DELETE /api/v1/model-dsrs/:id` - Archive template.

**Generation APIs**
*   `POST /api/v1/dsr/generate` - Pass template ID and data payload to create PDF.
*   `PUT /api/v1/dsr/:id/regenerate` - Update existing DSR and recreate PDF.

**Preview & Version APIs**
*   `POST /api/v1/dsr/preview` - Returns HTML/Base64 PDF for UI preview.
*   `GET /api/v1/dsr/:id/versions` - List historical versions of a generated DSR.

**Validation & Error Handling:**
*   400 Bad Request for missing required fields in JSON payload.
*   404 for Template Not Found.
*   409 Conflict if trying to edit a PUBLISHED template directly.

---

## 7. Permissions & Roles

**Role-Based Access Control (RBAC)**

| Role | Template Management | DSR Generation | DSR Approval |
| :--- | :--- | :--- | :--- |
| **Super Admin** | Create, Edit, Publish, Delete | Full Access | Final Approval |
| **Admin** | Create, Edit, Publish | Full Access | Final Approval |
| **Reviewer** | View Only | View, Add Comments | Review & Approve |
| **Viewer** | No Access | View Published Only | No Access |

**Approval Workflow:**
*   Generated DSRs start in `DRAFT`.
*   Submitter changes status to `PENDING_REVIEW`.
*   Reviewer changes status to `APPROVED` or `REJECTED`.

---

## 8. Validation Rules

**Mandatory Rules:**
*   At least one section must exist before publishing.
*   `sequence` numbers must be contiguous and unique per template.
*   Duplicate template titles are prevented.

**Business Rules:**
*   Templates cannot be deleted if they have associated `generated_dsr` records (must be archived instead).
*   Published templates are immutable; edits create a new `v+1` draft.

**System Rules:**
*   Upload limits: Max 10MB for attachment files.
*   Generation timeout: PDF generation must complete within 30 seconds or fail gracefully.
*   JSONB payload max size: 1MB to prevent abuse.

---

## 9. UI/UX Plan

**Key Screens:**
1.  **Dashboard:** Metric cards showing "Templates Active", "DSRs Generated Today".
2.  **Template List:** Table view with Title, Version, Status, Actions (Edit, Clone, Archive).
3.  **Create Template:** Setup wizard. Field inputs for Title/Description.
4.  **Template Editor:** Drag-and-drop workspace. Left panel for section types (Text, Table), right panel for configuration.
5.  **Preview Screen:** Modal or split-view showing the live rendering.
6.  **Generated Reports List:** Grid/Table of final PDFs with download links.
7.  **Version History:** Timeline UI showing who edited what and when.
8.  **Settings:** Global DSR settings (e.g., default logos, headers).

**States & Empty States:**
*   *Empty Template List:* Illustration with "No templates found. Create your first Model DSR!"
*   *Loading States:* Skeleton loaders during PDF generation.

---

## 10. Migration Strategy

**Zero-Downtime Approach:**
1.  **Data Schema:** Apply Prisma migrations (creates new tables, does not touch existing DSR tables yet).
2.  **Compatibility:** Build the Model DSR APIs alongside existing legacy endpoints.
3.  **Feature Flags:** Wrap the UI navigation and new API routes in a feature flag (e.g., `ENABLE_MODEL_DSR=true`).
4.  **Data Migration/Backfill:** Create a background script to map old DSR formats into the new `generated_dsr` JSONB structure if necessary, or treat them as legacy read-only records.
5.  **Rollback:** If issues occur, toggle the feature flag off. Old DSR system remains 100% operational.

---

## 11. Deployment Strategy

**Environments:**
*   **Dev:** For active development and local testing.
*   **QA:** Feature flagged. Automated tests run against this environment.
*   **UAT (User Acceptance Testing):** Deployed for stakeholders to build test templates and generate sample PDFs.
*   **Production:** 
    *   **Rollout:** Phased rollout via feature flags to specific beta users first.
    *   **Monitoring:** Set up Datadog/NewRelic alerts on PDF generation failures or API timeouts.
    *   **Rollback:** Database migrations are additive. If code fails, revert application deployment.

---

## 12. Testing Plan

*   **Unit Testing:** Jest for business logic (e.g., sequence validation, JSON merging).
*   **Integration Testing:** Supertest for API endpoints (ensure POST /templates saves to DB).
*   **Regression Testing:** Ensure existing legacy DSRs still load and function correctly.
*   **Performance Testing:** K6 to simulate 100 concurrent PDF generation requests.
*   **Security Testing:** Ensure SQL injection/XSS protection on dynamic template inputs. Check RBAC enforcement.
*   **UAT:** Provide stakeholders with a script: "Create template -> Publish -> Generate Report -> Verify PDF matches expectations."

---

## 13. Non-Functional Requirements

*   **Performance:** UI interactions (template builder) should feel instant (<100ms). PDF generation < 5 seconds.
*   **Availability:** 99.9% uptime. The PDF worker should be decoupled to not block main API threads.
*   **Scalability:** Separate the PDF rendering engine into an independent worker process/queue (e.g., BullMQ) if volume grows.
*   **Security:** JWT authentication. Row-level security for project-specific templates.
*   **Logging & Observability:** Structured JSON logs for all state changes. APM tracing for the generation pipeline.
*   **Caching:** Cache published templates in Redis, as they are immutable and read frequently.
*   **Backup & Recovery:** Nightly pg_dump of database. PDFs stored in S3 with versioning enabled.

---

## 14. Risks & Mitigation

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **Template Conflicts** | High | Implement strict versioning. Immutable published templates. |
| **PDF Engine Performance**| High | Offload PDF generation to a background worker queue. Implement timeouts. |
| **Migration Failure** | Medium | Keep legacy DSR data separate. Use additive schema changes only. |
| **Data Corruption (JSON)**| High | Strict JSON Schema validation at the API boundary before saving to `configuration`. |

---

## 15. Deliverables

*   **Architecture Document:** This proposal document.
*   **DB Schema:** Prisma `schema.prisma` updates with new models.
*   **APIs:** Implemented Express routes with OpenAPI/Swagger documentation.
*   **Flowcharts:** (To be generated via Mermaid in subsequent technical docs).
*   **Timeline:** Target 3-week sprint (Week 1: DB & API, Week 2: UI & PDF Engine, Week 3: Testing & UAT).
*   **Effort Estimation:** ~120 Story Points (Full Stack).
*   **Rollout Checklist:** Feature flag verification, DB migration verification, monitoring setup.
