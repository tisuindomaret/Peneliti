# State Transition Tables

This document defines the legal state transitions for Applications and Research Outputs, acting as the logic spec for the shared state-machine service.

## General Rules

1.  **Audit Requirement**: Every transition must generate a record in `status_history`. The record must include the `from_status`, `to_status`, `actor_id` (the user triggering it, or null if system-triggered), and a `note` (required for rejections and revision requests, optional otherwise).
2.  **Invalid Transition Behavior**: If an API endpoint attempts a transition not defined in these tables, the system must abort the operation, return HTTP 409 (Conflict), and log a warning.
3.  **Entity Locking**: When an application is in `admin_verification`, `substantive_verification`, or `awaiting_approval`, the applicant cannot edit the data or upload new documents (except in response to a `needs_revision` state).

---

## 1. Application (Permohonan) Transitions

Initial state upon creation: `draft`

| Current State (`from`) | Trigger Action | New State (`to`) | Actor Role | Required Input / Condition |
| :--- | :--- | :--- | :--- | :--- |
| `draft` | Submit | `submitted` | `applicant` (owner) | All mandatory `permit_requirements` must be fulfilled (documents uploaded). |
| `submitted` | Begin Admin Review | `admin_verification` | `verifier` | - |
| `admin_verification` | Request Revision | `needs_revision` | `verifier` | Must provide a list of actions/notes. |
| `admin_verification` | Complete Admin Review | `substantive_verification` | `verifier` | Administrative completeness marked as true. |
| `admin_verification` | Complete Review (Fast-track) | `awaiting_approval` | `verifier` | For simple permit types bypassing substantive review. |
| `needs_revision` | Resubmit | `admin_verification` or `substantive_verification` | `applicant` (owner) | Returns to the phase that requested the revision. |
| `substantive_verification` | Request Revision | `needs_revision` | `verifier` | Must provide a list of actions/notes. |
| `substantive_verification` | Recommend Approval | `awaiting_approval` | `verifier` | - |
| `awaiting_approval` | Approve | `approved` | `official` | System simultaneously issues permit document. |
| `awaiting_approval` | Reject | `rejected` | `official` | Must provide a rejection reason. |
| `approved` | Time elapsed | `expired` | `system` (cron/worker) | Current date > `valid_until` date on the permit. |
| `approved` | Output Accepted | `completed` | `system` (event hook) | Triggered when all required research outputs are in `accepted` state. |
| `expired` | Output Accepted | `completed` | `system` (event hook) | Triggered when all required research outputs are in `accepted` state. |

---

## 2. Research Output Transitions

Initial state upon permit issuance: `not_uploaded` (or system doesn't create record until first upload). Let's assume `not_uploaded` exists logically if a requirement is known, but practically the first physical state is `uploaded`.

| Current State (`from`) | Trigger Action | New State (`to`) | Actor Role | Required Input / Condition |
| :--- | :--- | :--- | :--- | :--- |
| `not_uploaded` | Upload | `uploaded` | `applicant` (permit holder) | Output file or link must be provided. |
| `uploaded` | Begin Review | `under_review` | `output_reviewer` | - |
| `under_review` | Request Revision | `needs_revision` | `output_reviewer` | Must provide notes/reason. |
| `needs_revision` | Re-upload/Update | `uploaded` | `applicant` (permit holder) | - |
| `under_review` | Accept | `accepted` | `output_reviewer` | - |
| `under_review` | Reject | `rejected` | `output_reviewer` | Must provide reason. |

## 3. Permit Status (Izin)

Initial state upon issuance: `active`

| Current State (`from`) | Trigger Action | New State (`to`) | Actor Role | Required Input / Condition |
| :--- | :--- | :--- | :--- | :--- |
| `active` | Time elapsed | `expired` | `system` | Current date > `valid_until`. |
| `active` | Cancel | `cancelled` | `admin`, `official` | Must provide reason. |
| `active` | Revise | `superseded` | `admin`, `official` | Creates a new active permit version, links via `superseded_by_permit_id`. |
| `expired` | Cancel | `cancelled` | `admin`, `official` | In cases of post-expiration invalidation. |
