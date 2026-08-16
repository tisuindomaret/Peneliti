# Project Plan — Research Permit Licensing Web Application

> Audience: AI Coding Agent (autonomous or semi-autonomous)
> Source: Derived and refined from `PRD_Aplikasi_Perizinan_Penelitian.md` (v1.0, Indonesian government PRD)
> Status: Ready for technical planning and implementation
> Companion files: `IMPLEMENTATION_STEPS.md`, `AGENT_GUIDELINES.md`, `DATA_MODEL.md`, `API_SPEC.md`

---

## 1. Mission Statement

Build a web application that digitizes the end-to-end lifecycle of **research permit licensing** for a government institution (`[Institution Name]`), replacing paper/email-based workflows with a trackable, auditable, role-based digital system.

The system must cover **five lifecycle stages**:

1. Applicant registration and application submission
2. Institutional verification (administrative + substantive review)
3. Approval/rejection decision by an authorized official
4. Digital permit issuance with public authenticity verification (QR code)
5. Post-research output submission, review, and archival/publication

**Non-goals for v1** (do not build unless explicitly instructed): certified e-signature (BSrE) integration, payment/retribution gateway, SSO/population-registry/SMS/WhatsApp integrations, native mobile apps, bulk legacy archive digitization, full-text public research repository.

---

## 2. Guiding Principles for the Coding Agent

1. **Do not expand scope.** If a requirement is ambiguous or not covered below, flag it instead of guessing — see Section 16 "Open Decisions" and `AGENT_GUIDELINES.md`.
2. **Configuration over hardcoding.** Permit types, required documents, form fields, and document number patterns must be admin-configurable data, not hardcoded logic.
3. **Every state change is auditable.** Any transition in application status or research-output status must write an immutable audit/history record (actor, timestamp, before/after state, note).
4. **Role-based access control (RBAC) is mandatory everywhere**, not just in the UI — enforce on every API endpoint and query.
5. **Issued permits are immutable.** Once a permit PDF/number is issued, it cannot be edited; corrections require a new version with full history.
6. **Build incrementally per phase** (Section 14) and keep each phase demoable and testable before moving to the next.

---

## 3. Problem Statement

| Current problem | Impact | Product solution |
|---|---|---|
| No unified channel for applicants to submit/track permits | Unclear status, high manual inquiry volume | Applicant portal with digital forms and real-time status tracking |
| Documents scattered across email/manual archives | Lost files, duplication, slow review | Centralized file storage with automated completeness checklist |
| Decisions and verification notes not consistently documented | Hard to audit or measure service performance | Status workflow, activity history, officer notes, audit trail |
| Research outputs not collected after permit issuance | Institution loses research outputs and knowledge base | Mandatory output upload + compliance dashboard |
| Permit issuance and document verification vulnerable to forgery | Reduced public trust | Uniquely numbered permits, QR code / public verification, digital archive |

---

## 4. Business Goals & Success Metrics

### 4.1 Business goals
1. Increase transparency, speed, and accountability of the research permit service.
2. Provide a digital trail from registration to research output submission.
3. Reduce reliance on physical paperwork and manual processing.
4. Provide aggregate research data for institutional reporting and decision-making.

### 4.2 Success metrics

| Metric | Initial target | Measurement |
|---|---:|---|
| Applications submitted via the app | ≥ 90% within 6 months post go-live | Digital submissions vs. total submissions |
| Document completeness on first submission | ≥ 75% | % of submissions with zero revision requests |
| Initial verification response time | ≤ 2 business days | Time between submission and first verifier action |
| Application traceability | 100% | Every application has status + activity history |
| Research output upload compliance | Target set per permit type by institution | % of completed permits with uploaded outputs |
| Service availability | ≥ 99% per month | VPS uptime monitoring |

These metrics should map directly to dashboard widgets built in Phase 3 (Section 14).

---

## 5. User Roles & Permissions

| Role | Description | Key permissions |
|---|---|---|
| Applicant | Individual, researcher, university, institution, or agency submitting a permit request | Register, manage profile, create applications, upload documents, respond to revision requests, download permit, upload research output |
| Verifier/Operator | Staff checking completeness and eligibility of applications | View queue, verify, request revisions, add notes, forward to approving official |
| Approving Official | Authorized decision-maker | Approve/reject applications, set conditions, authorize permit issuance |
| Administrator | Technical/service configuration manager | Manage users/roles, permit types, requirements, document templates, numbering schemes, notification config, reports |
| Research Output Reviewer (optional role) | Staff/committee evaluating research outputs | Review outputs, request revisions, archive, set visibility |
| Public (no account) | Anonymous visitor | Verify permit authenticity, access outputs marked public |

Build RBAC as a **first-class data model** (roles, permissions, role-permission mapping) rather than hardcoded role checks scattered through the code, so new roles/permissions can be added via admin configuration in later phases without code changes.

---

## 6. Core Service Flows

### 6.1 Permit application flow
1. Applicant registers an account and verifies their email address.
2. Applicant completes an individual/institutional profile.
3. Applicant selects a permit type, fills out the form, and uploads required documents.
4. System validates required fields, file formats, and file size limits.
5. Application is submitted and receives a unique application number.
6. Verifier checks administrative completeness and substantive content.
7. If incomplete, verifier sends a revision request; applicant updates and resubmits.
8. If complete, the application is forwarded for the approving official's decision.
9. Official approves or rejects the application with reasons/conditions.
10. For approved applications, the system issues a permit document with a unique number and QR code.
11. Applicant downloads the permit; status becomes active.

### 6.2 Research output flow
1. System reminds the permit holder before/after the research end date.
2. Permit holder uploads the final report and/or required outputs.
3. Reviewer checks completeness and conformity of the uploaded materials.
4. Reviewer can request revisions, accept for archival, or reject with reasons.
5. Accepted outputs are archived; visibility is set to **internal**, **restricted**, or **public**.
6. Permit compliance status is updated to "completed" once output requirements are met.

---

## 7. Status Model

### 7.1 Application statuses

| Status | Meaning | Allowed next actions |
|---|---|---|
| Draft | Not yet submitted by applicant | Edit, delete, submit |
| Submitted | Sent, awaiting review | Initial verification |
| Needs Revision | Data/documents require applicant correction | Edit and resubmit |
| Administrative Verification | Completeness check in progress | Request revision or proceed to substantive review |
| Substantive Verification | Substantive review in progress | Request revision, recommend approve/reject |
| Awaiting Approval | Awaiting authorized official's decision | Approve or reject |
| Approved | Permit issued and active | Upload research output per obligation |
| Rejected | Application not approved | View reason; new application if allowed |
| Expired | Permit validity period ended | Upload output if still required; archive |
| Completed | Research output received/archived | View archive |

### 7.2 Research output statuses

`Not Uploaded → Uploaded → Under Review → Needs Revision → Accepted for Archive / Rejected`

**Rule:** every status transition (application or output) must produce a history entry containing timestamp, actor, before/after status, and note (if any). Implement this as a shared, reusable audit/history mechanism rather than duplicating logic per entity.

---

## 8. Functional Requirements

### FR-01 — Authentication & Accounts
- Registration with name, email, phone number, password, and applicant type.
- Email verification (link or OTP) required before an application can be submitted.
- Login, logout, forgot password, and password change.
- Role-based access control (RBAC) enforced at the API layer.
- Admin can deactivate accounts without deleting application history.

### FR-02 — Applicant Profile
- Individual applicants store identity, address, affiliation, and contact details.
- Institutional applicants store institution name, address, responsible officer, and legal documents (if required).
- Saved profile data pre-fills new applications; updates are always allowed.

### FR-03 — Permit Type & Requirement Configuration
- Admin can create, edit, activate, or deactivate permit types.
- Each permit type has a configurable form, document requirements, validity period, and permit document template.
- Requirements can be marked mandatory/optional and specify accepted format/size limits.

### FR-04 — Permit Application
- Applicant can create, save, and resume a draft application.
- Minimum form fields: research title, field/topic, location, period, objective, brief method, principal investigator, team members, institution.
- File upload supports PDF, DOC/DOCX, XLS/XLSX, JPG, JPEG, PNG (configurable list/size).
- System shows a completeness checklist and blocks submission if mandatory requirements are missing.
- System generates a unique application number at submission time.
- Applicant sees only their own applications or those assigned to them within an institution.

### FR-05 — Institutional Verification & Review
- Verifiers have a queue filterable by status, permit type, date, and assignment.
- Verifiers can view form data, download files, add notes per application/file, and mark completeness.
- Verifiers can request revisions with a clear list of required applicant actions.
- System locks the reviewed application version and versions files after resubmission.
- Approving officials see a review summary and record an approve/reject decision.
- Rejection requires a reason; approval may include additional terms/conditions.

### FR-06 — Permit Document & Public Verification
- System issues a unique permit number following an admin-defined pattern.
- System generates a permit PDF from an institution-approved template.
- The permit document embeds a QR code or verification URL.
- A public verification page accepts a permit number or QR scan and shows (respecting privacy policy) at minimum: validity status, permit number, applicant/institution, research title, validity period, expiration status.
- Issued permits are immutable; cancellations/revisions produce a history entry and, if needed, a new document version.

### FR-07 — Notifications
- Email notifications for: account creation, application received, revision requested, status change, permit issued, output review completed.
- In-app notification center.
- Admin-configurable notification templates and internal recipients per status.
- Failed notification deliveries are logged and retryable by authorized staff.

### FR-08 — Research Output Upload & Review
- System surfaces the output-upload obligation on Approved or Expired permits.
- Applicant can upload final report, summary, publication link, dataset, and other configured output types.
- Output metadata: title, authors, year, abstract/summary, keywords, access classification.
- Reviewer can accept, request revision, or reject with notes.
- System reminds permit holders who have not met upload obligations by the configured deadline.

### FR-09 — Dashboard, Search & Reports
- Admin dashboard: applications per status, period trends, processing time, active permits, permits expiring soon, output-upload compliance.
- Internal search by application number, applicant name, institution, title, permit type, location, period, status.
- Export application lists, decisions, and output compliance to XLSX/PDF.
- Reports must respect role-based data visibility.

### FR-10 — Administration & Audit Trail
- Admin manages internal users, roles, work units, regions/locations, research fields, permit types, requirements, templates.
- System logs critical activity: login, role changes, application submission/edit, status changes, permit download/issuance, configuration changes.
- Audit entries include timestamp, actor, object, action type, before/after status, and IP address if available.
- Audit trail is read-only for authorized roles and cannot be edited via the application UI.

---

## 9. Non-Functional Requirements

| ID | Requirement | Acceptance criteria |
|---|---|---|
| NFR-01 | Responsive | Usable on desktop, tablet, and modern mobile browsers |
| NFR-02 | Performance | Common pages/main lists load ≤ 3s on a normal connection (excluding large file transfer) |
| NFR-03 | Availability | ≥ 99% monthly uptime, excluding announced scheduled maintenance |
| NFR-04 | Transport security | All production traffic over HTTPS/TLS with a valid certificate |
| NFR-05 | Account security | Hashed passwords, secure sessions, login-attempt throttling, CSRF/XSS/SQL-injection protection |
| NFR-06 | Authorization | All endpoints and data scoped by role and application ownership |
| NFR-07 | File handling | Validate extension, MIME type, size, and (if available) malware scan; files never executable server-side |
| NFR-08 | Backup | Daily DB/file backups, ≥ 30-day retention baseline |
| NFR-09 | Recovery | Documented and tested recovery procedure before handover |
| NFR-10 | Privacy | Personal data visible only to authorized roles per institutional data policy |
| NFR-11 | Compatibility | Latest two versions of Chrome, Edge, Firefox, Safari for core functions |
| NFR-12 | Accessibility | Forms have labels, clear validation, basic keyboard navigation, adequate contrast |
| NFR-13 | Observability | App, database, and VPS have error logging and uptime monitoring |

---

## 10. Recommended Technical Stack

> The PRD does not mandate a stack. The following is a recommended, pragmatic default suited to a small government team, a 16-week timeline, and a single mid-size VPS (4 vCPU / 8GB RAM / 160GB SSD). The coding agent should confirm this with the user before scaffolding if a different stack is preferred.

- **Backend:** Node.js (TypeScript) with Express or NestJS — REST API. Alternative: PHP/Laravel if the institution's ops team is more familiar with it.
- **Frontend:** Next.js (React, TypeScript) for applicant portal, back-office, and public verification page (SSR helps SEO for the public verification page and speeds up first load).
- **Database:** PostgreSQL (relational integrity is important for audit trails, statuses, and RBAC).
- **File storage:** Local disk on VPS under a non-web-executable path, or S3-compatible object storage if available; store only metadata + path in DB.
- **PDF generation:** A server-side PDF library (e.g., `pdf-lib`, Puppeteer for HTML-to-PDF from templates) driven by admin-configured templates.
- **QR code:** Server-generated QR encoding a verification URL (`/verify/{permit_number}` or signed token).
- **Auth:** Session or JWT-based auth with RBAC middleware; email verification via signed token/OTP.
- **Email delivery:** Transactional SMTP provider (e.g., self-hosted Postfix, or a transactional email API).
- **Background jobs:** A queue/worker (e.g., BullMQ on Redis) for notification retries, reminder emails, and PDF generation.
- **Monitoring/logging:** Centralized error logging (e.g., self-hosted Sentry or simple structured logs) + uptime monitor.
- **Deployment:** Dockerized services (app, DB, worker, reverse proxy) behind Nginx with TLS (Let's Encrypt).

This stack choice should be recorded in `DATA_MODEL.md` / `API_SPEC.md` once confirmed, and never silently changed mid-project.

---

## 11. Data Entities (Summary)

See `DATA_MODEL.md` for full schema design. High-level entities:

- **User** — identity, email, phone, role, account status, verification timestamp
- **Institution** — name, address, contact, responsible officer, legal documents
- **Application (Permohonan)** — application number, permit type, applicant, title, location, period, status, submission date
- **Requirement Document** — document type, filename, storage location, version, upload time, review status
- **Review** — officer, timestamp, notes, completeness/substance decision
- **Permit (Izin)** — permit number, issue date, validity period, QR/verification URL, PDF document, status
- **Research Output** — related permit, metadata, file/link, access classification, review status
- **Notification** — recipient, channel, event, content, delivery status, sent time
- **Audit Trail** — actor, timestamp, action, object, before/after status, security metadata

---

## 12. Access Control Matrix (Summary)

| Function | Applicant | Verifier | Official | Admin | Reviewer |
|---|:---:|:---:|:---:|:---:|:---:|
| Create/submit own application | ✓ | – | – | – | – |
| Administrative/substantive review | – | ✓ | view | view | – |
| Approve/reject decision | – | – | ✓ | per authority | – |
| Issue/manage permit templates | – | – | ✓ | ✓ | – |
| Upload research output | ✓ | – | – | – | – |
| Review research output | – | optional | – | view | ✓ |
| Configure master data/users | – | – | – | ✓ | – |
| View audit trail | – | limited | limited | ✓ | limited |

Implement this matrix as seed data / config, not as scattered `if (role === ...)` checks.

---

## 13. External Dependencies

| Dependency | Prerequisite | Note |
|---|---|---|
| Domain & DNS | Provided/approved by the institution | Official institution subdomain recommended |
| Production VPS | 4 vCPU, 8GB RAM, 160GB+ SSD/NVMe | Scalable based on user/file volume |
| Outbound email | SMTP or transactional email service | For verification and notifications |
| Permit template | Format, letter numbering, logo, signatory, wording | Must be approved by institution before UAT |
| Data policy | Retention, public/internal classification, authority | Basis for research-output access configuration |
| E-signature | Optional | Requires separate decision/integration if certified |

The coding agent should treat these as **inputs it cannot fabricate** — flag them as blockers rather than inventing values (see `AGENT_GUIDELINES.md`).

---

## 14. Delivery Phases

| Phase | Timeline | Output |
|---|---:|---|
| 1. Discovery & Design | Week 1–3 | Validated requirements, process flows, wireframes, data spec, confirmed tech stack |
| 2. Core Development | Week 4–10 | Accounts, application submission, file handling, back-office review, status engine, notifications |
| 3. Issuance & Outputs | Week 11–13 | Permit document generation, QR/verification page, output upload/review, reports |
| 4. Testing, Training & Go-Live | Week 14–16 | UAT, bug fixes, deployment, documentation, operator training |
| 5. Maintenance | 12 months post go-live | Support, monitoring, backups, fixes, minor changes |

Detailed, checkable tasks per phase are in `IMPLEMENTATION_STEPS.md`. The coding agent should work phase-by-phase and not start Phase N+1 work until Phase N's Definition of Done (see `IMPLEMENTATION_STEPS.md`) is met.

---

## 15. Go-Live Acceptance Criteria

The application is ready for go-live only when **all** of the following hold:

1. UAT scenario for application → permit issuance passes with institution representatives.
2. UAT scenario for research-output upload/review passes.
3. Role/permission configuration tested, including cross-applicant access denial.
4. Permit PDF and QR/verification page produce consistent data.
5. Core notifications are delivered, or failures are correctly logged.
6. Application-list reports export correctly and match in-app data.
7. Backup and recovery procedures are configured and proven via a limited recovery test.
8. No unresolved critical security findings or critical defects (unless explicitly deferred by the product owner).
9. Admin documentation and user guide exist; operator training completed.
10. Source code, deployment config, VPS access, and service credentials are handed over per contract.

---

## 16. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Permit requirements/format not finalized | Rework, delays | Validate SRS, templates, and requirement matrix before core development |
| Many permit-type variations | Overly complex forms | Use permit-type configuration; prioritize v1 scope |
| Large files or traffic spikes | Insufficient VPS capacity/cost | File size limits, capacity monitoring, VPS scaling plan |
| Unclear public-access policy for research outputs | Data exposure risk | Default to "internal" classification until policy is set |
| Slow institutional review turnaround | Applications stuck | Queue dashboard, staff notifications, internal SLA |
| Mid-project requests for external integrations | Scope creep | Document as a scope-change/addendum, do not silently implement |

---

## 17. Open Decisions (Must Be Confirmed Before Scope Lock)

These items are **inputs from the institution**, not something the coding agent should invent:

1. Official application name, domain, visual identity, responsible unit.
2. Permit types available in v1.
3. Required forms/documents per permit type.
4. Role structure, approving officials, authority chain.
5. Application-number and permit-number patterns.
6. Permit validity period and renewal/cancellation policy.
7. File size limits and accepted formats.
8. Research-output upload deadline and non-compliance consequences.
9. Access policy for research outputs (internal/restricted/public).
10. E-signature and other external integration requirements.
11. Data retention, backup, and disaster-recovery policy.

Until these are confirmed, use clearly-labeled placeholder values (e.g., `[Institution Name]`, `APP-{YYYY}-{seq}`) and keep them centrally configurable — never hardcode institution-specific assumptions into business logic.

---

## 18. How This Plan Should Be Used by the Coding Agent

1. Read this file (`PROJECT_PLAN.md`) fully before writing any code.
2. Read `AGENT_GUIDELINES.md` for operating rules, scope boundaries, and Definition of Done per task.
3. Use `DATA_MODEL.md` and `API_SPEC.md` as the technical contract — do not redesign schemas or endpoints ad hoc; propose changes explicitly if needed.
4. Follow `IMPLEMENTATION_STEPS.md` sequentially, phase by phase, checking off tasks as completed.
5. When a requirement is unclear or an Open Decision (Section 17) is unresolved, stop and ask rather than assume.
