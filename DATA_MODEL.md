# Data Model — Research Permit Licensing Web Application

> Technical contract for the database schema. Update this file in the same change set as any migration.
> Stack Confirmed: TypeScript monorepo, Next.js, NestJS, PostgreSQL, Redis/BullMQ, Docker Compose. (see `PROJECT_PLAN.md` §10). Field names are illustrative snake_case; adapt to project ORM conventions but keep this file in sync.

---

## Conventions

- Every table has: `id` (UUID or bigint PK), `created_at`, `updated_at`.
- Soft-delete via `deactivated_at` / `deleted_at` where history must be preserved (never hard-delete rows referenced by audit trail or applications).
- Foreign keys are NOT NULL unless explicitly optional.
- Status fields are constrained via enum type or lookup table, never free text.
- Money/dates/timezones: store all timestamps in UTC; convert for display only.

---

## 1. `users`

| Column                    | Type                          | Notes                                 |
| ------------------------- | ----------------------------- | ------------------------------------- |
| id                        | UUID PK                       |                                       |
| name                      | text                          |                                       |
| email                     | text UNIQUE                   |                                       |
| phone                     | text                          |                                       |
| password_hash             | text                          | bcrypt/argon2                         |
| applicant_type            | enum(individual, institution) | nullable for internal staff           |
| email_verified_at         | timestamp                     | null until verified                   |
| status                    | enum(active, deactivated)     | soft-delete via this + deactivated_at |
| deactivated_at            | timestamp                     | nullable                              |
| verification_token        | text                          | nullable; never returned or logged    |
| reset_password_token      | text                          | nullable; never returned or logged    |
| reset_password_expires_at | timestamp                     | nullable                              |
| created_at                | timestamp                     |                                       |
| updated_at                | timestamp                     |                                       |

## 2. `roles` and `permissions` (RBAC)

- `roles`: id (UUID PK), name (applicant, verifier, official, admin, output_reviewer), created_at, updated_at
- `permissions`: id (UUID PK), code (e.g., `application.approve`, `permit.issue`), created_at, updated_at
- `role_permissions`: id (UUID PK), role_id (FK → roles), permission_id (FK → permissions), created_at, updated_at
- `user_roles`: id (UUID PK), user_id (FK → users), role_id (FK → roles), created_at, updated_at

## 3. `institutions`

| Column                 | Type       | Notes                                     |
| ---------------------- | ---------- | ----------------------------------------- |
| id                     | UUID PK    |                                           |
| name                   | text       |                                           |
| address                | text       |                                           |
| contact                | text       |                                           |
| responsible_officer    | text       |                                           |
| legal_document_file_id | FK → files | nullable                                  |
| owner_user_id          | FK → users | primary account managing this institution |
| created_at             | timestamp  |                                           |
| updated_at             | timestamp  |                                           |

## 4. `applicant_profiles`

| Column          | Type              | Notes                |
| --------------- | ----------------- | -------------------- |
| id              | UUID PK           |                      |
| user_id         | FK → users UNIQUE | 1:1 relationship     |
| identity_number | text              | nullable, per policy |
| address         | text              |                      |
| affiliation     | text              |                      |
| institution_id  | FK → institutions | nullable             |
| created_at      | timestamp         |                      |
| updated_at      | timestamp         |                      |

## 5. `permit_types`

| Column               | Type                    | Notes                               |
| -------------------- | ----------------------- | ----------------------------------- |
| id                   | UUID PK                 |                                     |
| name                 | text                    |                                     |
| description          | text                    |                                     |
| is_active            | boolean                 |                                     |
| validity_period_days | integer                 | configurable per type               |
| numbering_pattern    | text                    | e.g. `{PREFIX}/{TYPE}/{YYYY}/{SEQ}` |
| pdf_template_id      | FK → document_templates |                                     |
| created_at           | timestamp               |                                     |
| updated_at           | timestamp               |                                     |

## 6. `permit_requirements`

| Column           | Type              | Notes                    |
| ---------------- | ----------------- | ------------------------ |
| id               | UUID PK           |                          |
| permit_type_id   | FK → permit_types |                          |
| name             | text              | e.g. "Research proposal" |
| is_mandatory     | boolean           |                          |
| accepted_formats | text[]            | e.g. {pdf,docx}          |
| max_size_mb      | integer           |                          |
| created_at       | timestamp         |                          |
| updated_at       | timestamp         |                          |

## 6.5 `document_templates`

| Column           | Type              | Notes                    |
| ---------------- | ----------------- | ------------------------ |
| id               | UUID PK           |                          |
| name             | text              |                          |
| file_id          | FK → files        | nullable                 |
| created_at       | timestamp         |                          |
| updated_at       | timestamp         |                          |

## 7. `applications` (Permohonan)

| Column                 | Type                         | Notes                                         |
| ---------------------- | ---------------------------- | --------------------------------------------- |
| id                     | UUID PK                      |                                               |
| application_number     | text UNIQUE                  | generated at submission, nullable while draft |
| permit_type_id         | FK → permit_types            |                                               |
| applicant_id           | FK → users                   |                                               |
| institution_id         | FK → institutions            | nullable                                      |
| title                  | text                         | research title                                |
| field_topic            | text                         |                                               |
| location               | text                         |                                               |
| period_start           | date                         |                                               |
| period_end             | date                         |                                               |
| objective              | text                         |                                               |
| method_summary         | text                         |                                               |
| principal_investigator | text                         |                                               |
| team_members           | jsonb                        | array of names/roles                          |
| status                 | enum (see status list below) |                                               |
| assigned_verifier_id   | FK → users                   | nullable                                      |
| assigned_official_id   | FK → users                   | nullable                                      |
| submitted_at           | timestamp                    | nullable while draft                          |
| decided_at             | timestamp                    | nullable                                      |
| created_at             | timestamp                    |                                               |
| updated_at             | timestamp                    |                                               |

**Status enum:** `draft, submitted, needs_revision, admin_verification, substantive_verification, awaiting_approval, approved, rejected, expired, completed`

## 8. `application_documents`

| Column         | Type                                              | Notes                      |
| -------------- | ------------------------------------------------- | -------------------------- |
| id             | UUID PK                                           |                            |
| application_id | FK → applications                                 |                            |
| requirement_id | FK → permit_requirements                          | nullable if ad hoc upload  |
| file_id        | FK → files                                        |                            |
| version        | integer                                           | increments on resubmission |
| review_status  | enum(pending, accepted, needs_revision, rejected) |                            |
| created_at     | timestamp                                         |                            |
| updated_at     | timestamp                                         |                            |

## 9. `files`

| Column            | Type       | Notes                    |
| ----------------- | ---------- | ------------------------ |
| id                | UUID PK    |                          |
| original_filename | text       |                          |
| storage_path      | text       | non-web-executable path  |
| mime_type         | text       |                          |
| size_bytes        | bigint     |                          |
| uploaded_by       | FK → users |                          |
| checksum          | text       | optional integrity check |
| created_at        | timestamp  |                          |
| updated_at        | timestamp  |                          |

## 10. `reviews`

| Column         | Type                                                 | Notes                   |
| -------------- | ---------------------------------------------------- | ----------------------- |
| id             | UUID PK                                              |                         |
| application_id | FK → applications                                    |                         |
| reviewer_id    | FK → users                                           |                         |
| review_type    | enum(administrative, substantive, official_decision) |                         |
| decision       | enum(approve, reject, request_revision)              | nullable if just a note |
| notes          | text                                                 |                         |
| created_at     | timestamp                                            |                         |
| updated_at     | timestamp                                            |                         |

## 11. `permits` (Izin)

| Column                  | Type                                         | Notes                                  |
| ----------------------- | -------------------------------------------- | -------------------------------------- |
| id                      | UUID PK                                      |                                        |
| application_id          | FK → applications UNIQUE                     |                                        |
| permit_number           | text UNIQUE                                  |                                        |
| issued_at               | timestamp                                    |                                        |
| valid_from              | date                                         |                                        |
| valid_until             | date                                         |                                        |
| pdf_file_id             | FK → files                                   |                                        |
| verification_token      | text UNIQUE                                  | used in QR/verification URL            |
| status                  | enum(active, expired, cancelled, superseded) |                                        |
| superseded_by_permit_id | FK → permits                                 | nullable, self-reference for revisions |
| created_at              | timestamp                                    |                                        |
| updated_at              | timestamp                                    |                                        |

## 12. `research_outputs`

| Column                | Type                                                                           | Notes                 |
| --------------------- | ------------------------------------------------------------------------------ | --------------------- |
| id                    | UUID PK                                                                        |                       |
| permit_id             | FK → permits                                                                   |                       |
| title                 | text                                                                           |                       |
| authors               | text                                                                           |                       |
| year                  | integer                                                                        |                       |
| abstract              | text                                                                           |                       |
| keywords              | text[]                                                                         |                       |
| access_classification | enum(internal, restricted, public)                                             | default `internal`    |
| file_id               | FK → files                                                                     | nullable if link-only |
| external_link         | text                                                                           | nullable              |
| status                | enum(not_uploaded, uploaded, under_review, needs_revision, accepted, rejected) |                       |
| reviewed_by           | FK → users                                                                     | nullable              |
| reviewed_at           | timestamp                                                                      | nullable              |
| created_at            | timestamp                                                                      |                       |
| updated_at            | timestamp                                                                      |                       |

## 13. `notifications`

| Column          | Type                        | Notes                                 |
| --------------- | --------------------------- | ------------------------------------- |
| id              | UUID PK                     |                                       |
| recipient_id    | FK → users                  |                                       |
| channel         | enum(email, in_app)         |                                       |
| event_type      | text                        | e.g. `application.revision_requested` |
| content         | text                        |                                       |
| delivery_status | enum(pending, sent, failed) |                                       |
| sent_at         | timestamp                   | nullable                              |
| retry_count     | integer                     | default 0                             |
| created_at      | timestamp                   |                                       |
| updated_at      | timestamp                   |                                       |

## 14. `audit_logs`

| Column       | Type       | Notes                                           |
| ------------ | ---------- | ----------------------------------------------- |
| id           | UUID PK    |                                                 |
| actor_id     | FK → users | nullable for system-triggered events            |
| action       | text       | e.g. `application.status_changed`, `auth.login` |
| object_type  | text       | e.g. `user`, `application`, `permit`            |
| object_id    | UUID       | nullable for non-resource actions               |
| before_state | jsonb      | nullable                                        |
| after_state  | jsonb      | nullable                                        |
| ip_address   | text       | nullable                                        |
| created_at   | timestamp  |                                                 |

**Rule:** `audit_logs` has no UPDATE/DELETE endpoint anywhere in the API. Insert-only. (No `updated_at` needed)

## 15. `status_history` (shared, generic)

Used by both `applications` and `research_outputs` for granular transition history (separate from the broader `audit_logs`, which covers all entities):

| Column      | Type                               | Notes                 |
| ----------- | ---------------------------------- | --------------------- |
| id          | UUID PK                            |                       |
| entity_type | enum(application, research_output) |                       |
| entity_id   | UUID                               |                       |
| from_status | text                               | nullable for creation |
| to_status   | text                               |                       |
| actor_id    | FK → users                         |                       |
| note        | text                               | nullable              |
| created_at  | timestamp                          |                       |

**Rule:** `status_history` is insert-only. (No `updated_at` needed)

---

## Indexing Notes

- Unique indexes: `applications.application_number`, `permits.permit_number`, `permits.verification_token`, `users.email`, `applicant_profiles.user_id`.
- Composite index on `applications(status, permit_type_id, submitted_at)` for verifier queue filtering.
- Index `research_outputs(permit_id, status)` for compliance dashboards.
- Index `audit_logs(object_type, object_id, created_at)` for per-record history views.
- Index `status_history(entity_type, entity_id, created_at)` for querying status history timeline.

## Relationships Summary

`users` → `applications` (1:N as applicant) → `application_documents` (1:N) → `files` (N:1)
`applications` → `reviews` (1:N) → `permits` (1:1 on approval) → `research_outputs` (1:N)
`permits` → self-reference for versioning (`superseded_by_permit_id`)
`applications`/`research_outputs` → `status_history` (1:N, polymorphic via `entity_type`/`entity_id`)
All critical entities → `audit_logs` (1:N, polymorphic via `object_type`/`object_id`)

### Phase 2.1 Notes

- The `users` table has been extended with two additional fields: `verification_token` and `reset_password_token`, as well as `reset_password_expires_at` to support authentication flows, which are all `nullable`.
