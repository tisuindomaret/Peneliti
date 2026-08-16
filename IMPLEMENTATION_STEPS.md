# Implementation Steps — Research Permit Licensing Web Application

> This file is the operational checklist for the AI Coding Agent. Work top to bottom, phase by phase.
> Do not proceed to the next phase until the current phase's **Definition of Done (DoD)** is satisfied.
> Cross-reference: `PROJECT_PLAN.md` (why), `DATA_MODEL.md` and `API_SPEC.md` (contracts), `AGENT_GUIDELINES.md` (rules).

---

## Phase 0 — Project Bootstrap (Pre-Week 1)

- [ ] Confirm the technical stack with the user (default proposal in `PROJECT_PLAN.md` §10). Record the final decision in `DATA_MODEL.md`/`API_SPEC.md` headers.
- [ ] Initialize monorepo or separate repos (backend, frontend) with clear README per package.
- [ ] Set up TypeScript config, linting (ESLint), formatting (Prettier), and pre-commit hooks.
- [ ] Set up Docker Compose for local dev: app, PostgreSQL, Redis (if used), mail-catcher (e.g., MailHog) for local email testing.
- [ ] Create `.env.example` listing all required environment variables (DB, SMTP, JWT secret, storage path, base URL for QR verification links) — never commit real secrets.
- [ ] Set up CI pipeline skeleton (lint, type-check, test) even if tests are minimal initially.
- [ ] Create `CHANGELOG.md` and start logging every notable change.

**Definition of Done:** `docker compose up` boots an empty app + DB locally; CI runs lint/build on push; `.env.example` is complete and accurate.

---

## Phase 1 — Discovery & Design (Week 1–3)

- [ ] Re-confirm scope boundaries from `PROJECT_PLAN.md` §4 (in-scope vs. out-of-scope) with the user/product owner.
- [ ] Draft the full database schema based on `DATA_MODEL.md`; review for normalization, indexing needs (application number, permit number, status, applicant_id), and soft-delete strategy for accounts (FR-01.5 — deactivate without deleting history).
- [ ] Design the RBAC model: roles, permissions, role-permission mapping tables (not hardcoded role strings in business logic).
- [ ] Design the status state machine for both Application and Research Output entities (see `PROJECT_PLAN.md` §7), including which role can trigger which transition.
- [ ] Design wireframes (can be low-fidelity, text-described in `docs/wireframes.md` if no design tool is available) for: registration/login, applicant dashboard, application form (multi-step), document upload, verifier queue, review screen, official's decision screen, permit PDF preview, public verification page, research output upload, output review screen, admin configuration screens, admin dashboard.
- [ ] Define the permit-numbering pattern and application-numbering pattern as configurable templates (e.g., `{PREFIX}/{TYPE}/{YYYY}/{SEQ}`), pending institution confirmation (`PROJECT_PLAN.md` §17.5).
- [ ] Write out the API contract in `API_SPEC.md` (endpoints, request/response shapes, auth requirements) before writing backend code.
- [ ] Flag all unresolved "Open Decisions" (`PROJECT_PLAN.md` §17) explicitly to the user; use placeholder/configurable values in the meantime.

**Definition of Done:** `DATA_MODEL.md` and `API_SPEC.md` are complete and internally consistent; wireframe descriptions exist for every screen listed above; all Open Decisions are either confirmed or explicitly logged as pending with a placeholder strategy.

---

## Phase 2 — Core Development (Week 4–10)

### 2.1 Authentication & Accounts (FR-01)
- [ ] Implement registration (name, email, phone, password, applicant type) with password hashing (bcrypt/argon2).
- [ ] Implement email verification via signed token or OTP; block application submission until verified.
- [ ] Implement login/logout, forgot-password, and change-password flows.
- [ ] Implement RBAC middleware enforced on every protected route (not just UI hiding).
- [ ] Implement account deactivation (soft delete) preserving application history and foreign-key integrity.
- [ ] Write tests: registration validation, duplicate email rejection, RBAC denial for wrong-role access.

### 2.2 Applicant Profile (FR-02)
- [ ] Individual profile fields: identity, address, affiliation, contact.
- [ ] Institutional profile fields: institution name, address, responsible officer, legal documents upload.
- [ ] Profile auto-fill on new application creation, with edit capability.

### 2.3 Permit Type & Requirement Configuration (FR-03)
- [ ] Admin CRUD for permit types (create/edit/activate/deactivate).
- [ ] Each permit type: configurable form field set, document requirements (mandatory/optional, accepted formats, size limits), validity period, and linked PDF template.
- [ ] Seed at least one sample permit type end-to-end for development/testing (mark clearly as sample/demo data).

### 2.4 Application Submission (FR-04)
- [ ] Draft creation, autosave/save-and-resume.
- [ ] Multi-step form: research title, field/topic, location, period, objective, method summary, principal investigator, team members, institution.
- [ ] File upload with format/size validation (PDF, DOC/DOCX, XLS/XLSX, JPG, JPEG, PNG — configurable).
- [ ] Completeness checklist that blocks submission when mandatory items are missing.
- [ ] Generate a unique application number at submission using the confirmed numbering pattern.
- [ ] Scope queries so applicants only see their own (or institution-assigned) applications.
- [ ] Tests: submission blocked when incomplete; application number uniqueness; ownership scoping.

### 2.5 Verification & Review Back-Office (FR-05)
- [ ] Verifier queue with filters: status, permit type, date, assignment.
- [ ] Review screen: view form data, download documents, add notes per application/file, mark completeness.
- [ ] Revision-request flow producing a clear actionable list for the applicant.
- [ ] Version-lock reviewed applications; version documents on resubmission (never overwrite silently).
- [ ] Approving official's decision screen: summary view, approve/reject with mandatory reason on rejection and optional conditions on approval.
- [ ] Implement the full status state machine transitions from `PROJECT_PLAN.md` §7.1, each producing an audit/history entry.
- [ ] Tests: revision loop, version history integrity, rejection requires reason.

### 2.6 Notifications (FR-07, partial)
- [ ] Email notification triggers: account created, application received, revision requested, status changed, permit issued, output review completed.
- [ ] In-app notification center (list + read/unread state).
- [ ] Failed-delivery logging with retry capability for authorized staff.
- [ ] Background job/queue for async email sending (do not block request/response cycle on SMTP).

**Definition of Done for Phase 2:** An applicant can register, get verified, submit a complete application, go through revision and approval cycles, and receive notifications at each step; a verifier and an official can fully operate the back-office queue; all transitions are audit-logged; RBAC is enforced end-to-end; core unit/integration tests pass in CI.

---

## Phase 3 — Issuance & Research Outputs (Week 11–13)

### 3.1 Permit Document & Public Verification (FR-06)
- [ ] Implement permit-number generation per confirmed pattern, unique and sequential per configuration.
- [ ] Implement PDF generation from an admin-approved template (institution logo, letter number, signatory, wording — placeholders until confirmed).
- [ ] Embed QR code / verification URL in the generated PDF.
- [ ] Build the public verification page (`/verify/{permit_number}` or via QR payload) showing: validity status, permit number, applicant/institution, research title, validity period, expiration status — filtered per privacy policy (no sensitive personal data exposed publicly).
- [ ] Enforce immutability: issued permits cannot be edited; cancellations/revisions create a new version with full history and a `superseded_by`/`cancelled` marker.
- [ ] Tests: PDF generation correctness, QR payload resolves correctly, public page never leaks non-public personal data.

### 3.2 Research Output Upload & Review (FR-08)
- [ ] Surface the output-upload obligation on Approved/Expired permits (dashboard widget + notification).
- [ ] Upload flow for final report, summary, publication link, dataset, and other configured output types.
- [ ] Output metadata form: title, authors, year, abstract, keywords, access classification (internal/restricted/public — default internal per risk mitigation).
- [ ] Reviewer actions: accept, request revision, reject with notes.
- [ ] Automatic reminder job for permit holders who have not met the upload obligation by deadline.
- [ ] Update permit compliance status to "Completed" once requirements are satisfied.
- [ ] Tests: default-internal visibility, reviewer transition correctness, reminder job triggers correctly.

### 3.3 Dashboard, Search & Reports (FR-09)
- [ ] Admin dashboard widgets: applications per status, period trend, average processing time, active permits, permits expiring soon, output-upload compliance rate.
- [ ] Internal search across application number, applicant name, institution, title, permit type, location, period, status.
- [ ] Export application list / decisions / output compliance to XLSX and PDF, respecting role-based visibility.
- [ ] Tests: export data matches in-app filtered results; role-based redaction verified.

### 3.4 Administration & Audit Trail (FR-10)
- [ ] Admin management screens for internal users, roles, work units, regions/locations, research fields, permit types, requirements, templates.
- [ ] Central audit-logging utility invoked by every critical action (login, role change, application submit/edit, status change, permit download/issuance, config change).
- [ ] Audit trail read-only UI for authorized roles; no edit/delete endpoint exposed anywhere.
- [ ] Tests: every critical action type produces exactly one correct audit entry; audit endpoints reject write attempts.

**Definition of Done for Phase 3:** A full lifecycle — application → approval → permit issuance → public verification → output upload → output review → completion — works end to end with correct audit trail, dashboards reflect live data, and exports are accurate.

---

## Phase 4 — Testing, Training & Go-Live (Week 14–16)

- [ ] Write and execute UAT scripts covering: full application-to-issuance flow, output upload/review flow, cross-role/cross-applicant access-denial tests, permit PDF/QR consistency check.
- [ ] Run a security pass: verify HTTPS/TLS config, password hashing, session security, login throttling, CSRF/XSS/SQL-injection protections (NFR-04, NFR-05), file-upload validation and non-executable storage (NFR-07).
- [ ] Load/performance sanity check against NFR-02 (≤3s page loads) on representative data volume.
- [ ] Configure and test daily backups (DB + files) and perform a limited restore test (NFR-08, NFR-09).
- [ ] Set up monitoring/alerting for uptime and error logs (NFR-13).
- [ ] Write admin documentation and end-user guides (applicant, verifier, official, admin, reviewer).
- [ ] Conduct operator training sessions; collect and resolve feedback.
- [ ] Verify all 10 Go-Live Acceptance Criteria in `PROJECT_PLAN.md` §15 explicitly, item by item, before declaring readiness.
- [ ] Prepare handover package: source code, deployment configs, VPS access, service credentials (per contract).

**Definition of Done for Phase 4:** Every item in the Go-Live Acceptance Criteria checklist is verifiably true, with evidence (test logs, screenshots, or sign-off) attached to each item.

---

## Phase 5 — Maintenance (12 months post go-live)

- [ ] Establish a support/ticketing process for bug reports and minor change requests.
- [ ] Keep monitoring dashboards reviewed on a regular cadence; respond to uptime/error alerts.
- [ ] Verify backup integrity periodically (not just that backups run, but that they restore).
- [ ] Track minor scope changes separately from this plan; do not silently fold them into "core" scope without documenting as an addendum (see `PROJECT_PLAN.md` §16 scope-creep risk).

---

## Continuous Practices (Apply Throughout All Phases)

- [ ] Every new entity/table change must be reflected back into `DATA_MODEL.md` in the same change set.
- [ ] Every new/changed endpoint must be reflected back into `API_SPEC.md` in the same change set.
- [ ] Every status-changing action must go through the shared audit/history mechanism — no exceptions, no bypassing it for "quick fixes."
- [ ] Every list/detail endpoint must be checked against the Access Control Matrix (`PROJECT_PLAN.md` §12) before merging.
- [ ] Keep `CHANGELOG.md` updated per merged feature.
- [ ] When blocked by an Open Decision (`PROJECT_PLAN.md` §17), stop, document the blocker, and use a clearly-labeled placeholder rather than inventing institutional policy.
