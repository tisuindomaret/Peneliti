# Open Decisions

This document lists the unresolved decisions that require institutional input (as per `PROJECT_PLAN.md` §17). Until these decisions are made, the system uses conservative, configurable placeholders.

These items **must** be confirmed before the application can go to production.

| ID | Open Decision | Required Input From | Placeholder / Strategy | Blocker Impact |
| :--- | :--- | :--- | :--- | :--- |
| OD-01 | Official App Identity | Institution | Domain: `localhost`, Name: `[Institution Name] Permit System`, Logo: generic text. | Low for development, High for Go-Live. (UI & Emails will look generic). |
| OD-02 | Permit Types Available in v1 | Institution | Seed database with one "Research Permit" and one "Survey Permit" type. | Medium. Need real types to structure forms and requirements. |
| OD-03 | Required Forms/Documents | Institution | For the placeholder types, require a "Proposal" and "ID Card" (KTP/Passport) with standard PDF/JPG formats, max 5MB. | Medium. Form validation and file storage capacity depend on this. |
| OD-04 | Role Structure & Authority | Institution | Implement standard `verifier` and `official` roles. Assume single approval tier. | High. If there are multiple approval tiers (e.g., Dept Head -> Director), the state machine needs modification. |
| OD-05 | Numbering Patterns | Institution | Application: `APP/{YYYY}/{SEQ}`. Permit: `PER/{YYYY}/{SEQ}`. Configurable in `permit_types`. | Low for development, High for Go-Live. Must match institutional legal standards. |
| OD-06 | Validity & Renewal Policy | Institution | Placeholder: 1 year (365 days) from issuance. Renewal not supported in v1 (requires new application). | Medium. Affects expiration logic and notification triggers. |
| OD-07 | File Limits & Formats | Institution (IT/Ops) | Max 5MB per file. Allowed: PDF, JPG, PNG. Stored on local disk. | Medium. Needs to align with VPS capacity and security policy. |
| OD-08 | Output Upload Deadline | Institution | Placeholder: 30 days after permit expiration. | Low. Configurable setting. |
| OD-09 | Output Access Policy | Institution | Placeholder: Default to `internal`. Public visibility must be manually selected by reviewer. | High. Risk of data exposure if policy isn't clearly defined. |
| OD-10 | External Integrations (E-Sig) | Institution | Placeholder: None. Generated PDF is unsigned, relies solely on QR code for verification. | High. If certified E-signature (BSrE) is required, it represents significant out-of-scope work. |
| OD-11 | Data Retention & Backup | Institution (IT/Ops) | Placeholder: Soft-delete for users, no automated hard-deletion of records. Backups outside system scope. | High for Go-Live. Required for operational security and compliance. |
