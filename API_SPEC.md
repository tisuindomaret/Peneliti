# API Specification — Research Permit Licensing Web Application

> Technical contract for the backend REST API. Update this file in the same change set as any endpoint addition/change.
> Stack Confirmed: TypeScript monorepo, Next.js, NestJS, PostgreSQL, Redis/BullMQ, Docker Compose. (see `PROJECT_PLAN.md` §10).
> Auth: Bearer JWT or session cookie (confirm choice in Phase 0/1). All endpoints except explicitly marked `Public` require authentication. All non-`Public` endpoints must additionally enforce role/ownership checks per `PROJECT_PLAN.md` §12.

Conventions:

- Base path: `/api/v1`
- Errors: `{ "error": { "code": string, "message": string, "details"?: object } }`
- Pagination: `?page=&pageSize=` with response `{ data: [...], meta: { total, page, pageSize } }`
- All mutating endpoints must produce corresponding `audit_logs` / `status_history` entries per `DATA_MODEL.md`.

---

## Auth & Accounts (FR-01)

| Method | Path                     | Role          | Description                                                   |
| ------ | ------------------------ | ------------- | ------------------------------------------------------------- |
| POST   | `/auth/register`         | Public        | Create account (name, email, phone, password, applicant_type) |
| POST   | `/auth/verify-email`     | Public        | Confirm email via token/OTP                                   |
| POST   | `/auth/login`            | Public        | Login, returns token/session                                  |
| POST   | `/auth/logout`           | Authenticated | Invalidate session/token                                      |
| POST   | `/auth/change-password`  | Authenticated | Change password using the current password                    |
| POST   | `/auth/forgot-password`  | Public        | Send reset link                                               |
| POST   | `/auth/reset-password`   | Public        | Reset with token                                              |
| PATCH  | `/users/{id}/deactivate` | Admin         | Soft-deactivate account                                       |
| GET    | `/users/me`              | Authenticated | Current user profile + roles                                  |

## Applicant Profile (FR-02)

| Method | Path            | Role      | Description                           |
| ------ | --------------- | --------- | ------------------------------------- |
| GET    | `/profile`      | Applicant | Get own profile                       |
| PUT    | `/profile`      | Applicant | Update individual/institution profile |
| POST   | `/institutions` | Applicant | Create/link institution record        |

## Permit Type & Requirement Config (FR-03)

| Method | Path                                           | Role                 | Description                                           |
| ------ | ---------------------------------------------- | -------------------- | ----------------------------------------------------- |
| GET    | `/permit-types`                                | Public/Authenticated | List active permit types (public sees limited fields) |
| POST   | `/permit-types`                                | Admin                | Create permit type                                    |
| PUT    | `/permit-types/{id}`                           | Admin                | Update permit type                                    |
| PATCH  | `/permit-types/{id}/activate` \| `/deactivate` | Admin                | Toggle availability                                   |
| POST   | `/permit-types/{id}/requirements`              | Admin                | Add requirement document rule                         |
| PUT    | `/requirements/{id}`                           | Admin                | Update requirement rule                               |

## Applications (FR-04, FR-05)

| Method | Path                                  | Role                                                   | Description                                                                                                        |
| ------ | ------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| POST   | `/applications`                       | Applicant                                              | Create draft application                                                                                           |
| PUT    | `/applications/{id}`                  | Applicant (owner, draft/needs_revision only)           | Update draft/revision content                                                                                      |
| POST   | `/applications/{id}/documents`        | Applicant (owner)                                      | Upload a requirement document                                                                                      |
| GET    | `/applications/{id}/checklist`        | Applicant/Verifier                                     | Get completeness checklist status                                                                                  |
| POST   | `/applications/{id}/submit`           | Applicant (owner)                                      | Submit; blocked if checklist incomplete; assigns application_number                                                |
| GET    | `/applications`                       | Applicant (own) / Verifier / Official / Admin (scoped) | List with filters (status, permit_type, date, search)                                                              |
| GET    | `/applications/{id}`                  | Owner / Verifier / Official / Admin                    | Get full detail                                                                                                    |
| POST   | `/applications/{id}/reviews`          | Verifier                                               | Add review note / mark completeness                                                                                |
| POST   | `/applications/{id}/request-revision` | Verifier                                               | Transition to `needs_revision` with action list                                                                    |
| POST   | `/applications/{id}/forward`          | Verifier                                               | Transition to `admin_verification` or `substantive_verification` or `awaiting_approval` depending on current phase |
| POST   | `/applications/{id}/approve`          | Official                                               | Approve; triggers permit issuance workflow                                                                         |
| POST   | `/applications/{id}/reject`           | Official                                               | Reject; requires `reason`                                                                                          |
| GET    | `/applications/{id}/history`          | Owner / Verifier / Official / Admin                    | Status history timeline                                                                                            |

## Permit Issuance & Verification (FR-06)

| Method | Path                                 | Role                                     | Description                                                                                         |
| ------ | ------------------------------------ | ---------------------------------------- | --------------------------------------------------------------------------------------------------- |
| POST   | `/applications/{id}/issue-permit`    | System (triggered by approve) / Official | Generate permit number, PDF, QR token                                                               |
| GET    | `/permits/{id}`                      | Owner / Admin / Official                 | Get permit detail + PDF link                                                                        |
| GET    | `/permits/{id}/download`             | Owner / Admin                            | Download PDF                                                                                        |
| POST   | `/permits/{id}/cancel`               | Admin/Official                           | Cancel; creates history, marks cancelled                                                            |
| POST   | `/permits/{id}/revise`               | Admin/Official                           | Create superseding version                                                                          |
| GET    | `/verify/{permit_number}`            | **Public**                               | Return limited verification payload (status, permit number, applicant/institution, title, validity) |
| GET    | `/verify/token/{verification_token}` | **Public**                               | Same as above, resolved via QR token                                                                |

## Notifications (FR-07)

| Method | Path                                    | Role          | Description                           |
| ------ | --------------------------------------- | ------------- | ------------------------------------- |
| GET    | `/notifications`                        | Authenticated | List own in-app notifications         |
| PATCH  | `/notifications/{id}/read`              | Authenticated | Mark as read                          |
| GET    | `/admin/notifications/failed`           | Admin         | List failed deliveries                |
| POST   | `/admin/notifications/{id}/retry`       | Admin         | Retry failed delivery                 |
| PUT    | `/admin/notification-templates/{event}` | Admin         | Edit template/recipients for an event |

## Research Outputs (FR-08)

| Method | Path                    | Role                                 | Description                                                    |
| ------ | ----------------------- | ------------------------------------ | -------------------------------------------------------------- |
| POST   | `/permits/{id}/outputs` | Applicant (permit holder)            | Upload output + metadata                                       |
| PUT    | `/outputs/{id}`         | Applicant (owner, before acceptance) | Update metadata/file                                           |
| GET    | `/outputs/{id}`         | Owner / Reviewer / Admin             | Get detail                                                     |
| GET    | `/outputs`              | Reviewer / Admin (scoped)            | List with filters (status, permit_type, deadline)              |
| POST   | `/outputs/{id}/review`  | Reviewer                             | Accept / request_revision / reject with notes                  |
| GET    | `/outputs/public`       | **Public**                           | List/search outputs with `access_classification = public` only |

## Dashboard, Search & Reports (FR-09)

| Method | Path                                 | Role                              | Description                                                                     |
| ------ | ------------------------------------ | --------------------------------- | ------------------------------------------------------------------------------- |
| GET    | `/admin/dashboard/summary`           | Admin/Official/Verifier (scoped)  | Status counts, trends, processing time, compliance rate                         |
| GET    | `/applications/search`               | Internal roles                    | Search by number, applicant, institution, title, type, location, period, status |
| GET    | `/reports/applications/export`       | Internal roles (role-scoped data) | Export XLSX/PDF                                                                 |
| GET    | `/reports/outputs-compliance/export` | Internal roles                    | Export compliance report                                                        |

## Administration & Audit (FR-10)

| Method | Path                                                                                            | Role                                                | Description                                                                           |
| ------ | ----------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------- |
| CRUD   | `/admin/users`, `/admin/roles`, `/admin/work-units`, `/admin/regions`, `/admin/research-fields` | Admin                                               | Master data management                                                                |
| GET    | `/admin/audit-logs`                                                                             | Admin (limited: Verifier/Official for scoped views) | Read-only, filterable by object_type/actor/date; **no PUT/PATCH/DELETE ever exposed** |

---

## Cross-Cutting Rules for Every Endpoint

1. **AuthN then AuthZ then Ownership** — check identity, then role/permission, then whether the actor owns/relates to the specific resource (e.g., applicant can only touch their own application).
2. **Every status-changing endpoint** must call the shared status-transition service, which validates the transition is legal per the state machine in `PROJECT_PLAN.md` §7 and writes to `status_history` + `audit_logs`.
3. **File upload endpoints** must validate extension, MIME type, and size server-side (never trust client-reported type alone).
4. **Public endpoints** (`/verify/*`, `/outputs/public`, `/permit-types` public view) must be reviewed for PII leakage before merge — cross-check against `PROJECT_PLAN.md` FR-06.4.
5. New endpoints must be added to this table in the same PR that implements them.

### Phase 2.1 Notes

- The API format strictly outputs errors as `{ "error": { "code": string, "message": string, "details"?: object } }` globally.
- `UsersController` endpoints omit fields like `passwordHash`, `verificationToken`, and `resetPasswordToken` when returning the user profile.
