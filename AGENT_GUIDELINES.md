# Agent Guidelines — Operating Rules for the AI Coding Agent

> Purpose: keep the AI Coding Agent on-track, prevent scope drift, and enforce consistent engineering decisions across a multi-week project. Read this before starting any task and re-check it whenever unsure.

---

## 1. Source of Truth Hierarchy

When documents conflict, resolve in this order:

1. Explicit, current instruction from the user/product owner (always wins).
2. `PROJECT_PLAN.md` (scope, requirements, roles, statuses, NFRs).
3. `DATA_MODEL.md` and `API_SPEC.md` (technical contracts).
4. `IMPLEMENTATION_STEPS.md` (execution order and DoD).
5. This file (`AGENT_GUIDELINES.md`) for process/behavior rules.

If `DATA_MODEL.md`/`API_SPEC.md` need to change to satisfy a new requirement, update them explicitly as part of the same task — never let code and docs drift apart.

---

## 2. Scope Discipline

- Treat `PROJECT_PLAN.md` §4.2 ("Out of scope for v1") as a hard boundary. Do not implement e-signature, payment gateways, SSO/population-registry/SMS/WhatsApp integration, native mobile apps, or a full-text public research portal unless the user explicitly changes scope.
- If a request seems to require out-of-scope work, say so explicitly and ask whether it should be logged as a scope-change addendum (see `PROJECT_PLAN.md` §15 risk table) rather than silently building it.
- Do not add speculative features "for completeness." Every feature must map to a Functional Requirement (FR-xx) or Non-Functional Requirement (NFR-xx) in `PROJECT_PLAN.md`.

---

## 3. Handling Ambiguity and Missing Institutional Input

`PROJECT_PLAN.md` §17 lists Open Decisions that only the institution/product owner can confirm (permit-numbering pattern, permit types, validity periods, file limits, access-classification policy, retention policy, etc.).

Rules:
- Never invent institution-specific business rules (e.g., "permits are valid for 1 year" or "public access is allowed by default") — these must come from the user or be clearly marked as a placeholder.
- Default to the **most conservative/safe option** when a placeholder is unavoidable (e.g., default research-output visibility = `internal`, not `public`).
- Make every such placeholder a configuration value (database row, config file, or admin-editable setting) — never a hardcoded constant in business logic — so it can be corrected without a code change.
- Explicitly list any assumption made in the PR/commit description or task summary so a human can review it.

---

## 4. Definition of Done (Applies to Every Task, Not Just Phase-Level)

A task is not done until:

1. The corresponding FR/NFR or step in `IMPLEMENTATION_STEPS.md` is satisfied.
2. RBAC is verified for the feature (who can/cannot access it) — see Access Control Matrix in `PROJECT_PLAN.md` §12.
3. Any state transition introduced writes a correct audit/history entry.
4. Input validation exists for all user-supplied data (required fields, file type/size, format).
5. At least one automated test covers the happy path and at least one covers a rejection/edge case.
6. `DATA_MODEL.md` / `API_SPEC.md` are updated if the task touched schema or endpoints.
7. No secrets, credentials, or institution-specific real data are committed.

---

## 5. Security & Data Handling Rules (Non-Negotiable)

- Never log or display full passwords, tokens, or OTPs.
- Hash passwords with a strong algorithm (bcrypt/argon2); never store plaintext or reversible encryption for passwords.
- All file uploads must be validated by extension AND MIME type AND size; stored files must never be served as executable content.
- All personally identifiable information (PII) must be filtered out of the **public** verification page — only show what `PROJECT_PLAN.md` §8 FR-06.4 explicitly allows.
- Every API endpoint must check both authentication (who is this) and authorization (are they allowed to touch this specific resource, including ownership checks for applicants).
- Do not disable CSRF/XSS/SQL-injection protections for convenience, even temporarily, even in development branches that might get merged.

---

## 6. Working With Statuses and Audit Trails

- Application and Research Output statuses must only change through the defined state machine (`PROJECT_PLAN.md` §7). Do not allow arbitrary status writes from generic "update" endpoints.
- Any code path that changes a status must call the shared audit-logging function — do not duplicate ad hoc logging per feature.
- Issued permits are immutable. "Editing" an issued permit must always mean: create a new version + mark the old one superseded/cancelled + log the change. Never allow an UPDATE that mutates an already-issued permit's core fields in place.

---

## 7. Communication & Reporting Back to the User

When reporting progress, the agent should:

- State which phase/step (per `IMPLEMENTATION_STEPS.md`) was completed.
- Flag any assumption made due to an unresolved Open Decision.
- Flag any deviation from `DATA_MODEL.md`/`API_SPEC.md` and why.
- Note any new risk discovered that isn't already in `PROJECT_PLAN.md` §16.
- Avoid declaring "done" or "production ready" unless the relevant Definition of Done (Section 4 here, or the phase DoD in `IMPLEMENTATION_STEPS.md`) is fully met.

---

## 8. Anti-Patterns to Avoid

- Hardcoding permit types, form fields, or document requirements directly in UI/business logic instead of driving them from configuration tables.
- Scattering `if (user.role === 'admin')` checks throughout the codebase instead of using a centralized RBAC/permission-check utility.
- Silent schema changes without updating `DATA_MODEL.md`.
- Building notification sending synchronously inside request handlers (blocks response, no retry) instead of via a queue/background worker.
- Skipping the completeness checklist enforcement "to save time" during early development — this is a core FR (FR-04.4), not a nice-to-have.
- Allowing public verification page queries to leak more data than explicitly permitted.
- Treating this document set as static: if scope or decisions change, update `PROJECT_PLAN.md`/`IMPLEMENTATION_STEPS.md` in the same change, not as an afterthought.

---

## 9. Quick Reference Checklist Before Marking Any Feature Complete

- [ ] Maps to an FR/NFR in `PROJECT_PLAN.md`
- [ ] RBAC enforced at API level, not just UI
- [ ] Status changes (if any) go through the shared state machine + audit log
- [ ] Input validated (required fields, file type/size)
- [ ] Tests written for happy path + at least one failure case
- [ ] `DATA_MODEL.md` / `API_SPEC.md` updated if schema/endpoints changed
- [ ] No hardcoded institution-specific assumptions; placeholders are configurable
- [ ] No secrets or real PII committed
