# Role-Based Access Control (RBAC) & Transition-Authority Matrix

This document defines the centralized RBAC permission matrix and the transition-authority matrix for the Research Permit Licensing Web Application. This matrix expands on `PROJECT_PLAN.md` §12 and should be used to seed the `roles` and `permissions` tables.

## Roles

1.  **`applicant`**: Individual or institution representative requesting a permit.
2.  **`verifier`**: Institution staff performing administrative and substantive reviews.
3.  **`official`**: Authorized decision-maker who approves/rejects applications and authorizes permit issuance.
4.  **`admin`**: System administrator managing master data, configuration, and users.
5.  **`output_reviewer`**: Staff or committee evaluating submitted research outputs.

## General Permission Matrix

| Code | Description | `applicant` | `verifier` | `official` | `admin` | `output_reviewer` |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Authentication & Profile** |
| `profile.read` | Read own profile | ✓ | - | - | - | - |
| `profile.update` | Update own profile | ✓ | - | - | - | - |
| `institution.create` | Create institution profile | ✓ | - | - | - | - |
| **Applications** |
| `application.create` | Create a draft application | ✓ | - | - | - | - |
| `application.read_own` | Read own application | ✓ | - | - | - | - |
| `application.update_own` | Update own application (draft/needs_revision) | ✓ | - | - | - | - |
| `application.submit` | Submit application | ✓ | - | - | - | - |
| `application.read_all` | Read any application (scoped by assignment/role) | - | ✓ | ✓ | ✓ | - |
| `application.review` | Add review notes, mark completeness | - | ✓ | - | - | - |
| `application.request_revision`| Request revision from applicant | - | ✓ | - | - | - |
| `application.forward` | Forward to next step | - | ✓ | - | - | - |
| `application.approve` | Approve application | - | - | ✓ | - | - |
| `application.reject` | Reject application | - | - | ✓ | - | - |
| **Permits** |
| `permit.read_own` | Read/download own permit | ✓ | - | - | - | - |
| `permit.read_all` | Read/download any permit | - | - | ✓ | ✓ | - |
| `permit.issue` | Trigger permit issuance | - | - | ✓ | - | - |
| `permit.cancel` | Cancel an issued permit | - | - | ✓ | ✓ | - |
| `permit.revise` | Create a superseding permit | - | - | ✓ | ✓ | - |
| **Research Outputs** |
| `output.upload` | Upload research output | ✓ | - | - | - | - |
| `output.update_own`| Update own unaccepted output | ✓ | - | - | - | - |
| `output.read_own` | Read own output | ✓ | - | - | - | - |
| `output.read_all` | Read any output | - | - | - | ✓ | ✓ |
| `output.review` | Accept/reject/request revision for output | - | - | - | - | ✓ |
| **Administration** |
| `master_data.manage`| Manage permit types, fields, work units, etc. | - | - | - | ✓ | - |
| `users.manage` | Manage users and roles | - | - | - | ✓ | - |
| `audit.read` | View audit logs | - | scoped | scoped | ✓ | scoped |
| `dashboard.view` | View summary dashboards | - | scoped | scoped | ✓ | - |
| `reports.export` | Export reports | - | scoped | scoped | ✓ | - |

*(Note: "scoped" means the role can perform the action, but data visibility is restricted to their purview.)*

## State Transition Authority Matrix

### Application Transitions

| Current Status | Action | Next Status | Allowed Roles |
| :--- | :--- | :--- | :--- |
| `draft` | Submit | `submitted` | `applicant` (owner) |
| `submitted` | Begin Review | `admin_verification` | `verifier` |
| `admin_verification` | Request Revision | `needs_revision` | `verifier` |
| `admin_verification` | Forward | `substantive_verification` | `verifier` |
| `substantive_verification`| Request Revision | `needs_revision` | `verifier` |
| `substantive_verification`| Forward | `awaiting_approval` | `verifier` |
| `needs_revision` | Resubmit | `admin_verification` / `substantive_verification` | `applicant` (owner) |
| `awaiting_approval` | Approve | `approved` | `official` |
| `awaiting_approval` | Reject | `rejected` | `official` |
| `approved` | Expire | `expired` | `system` |
| `approved` | Fulfill Outputs| `completed` | `system` (trigger on output acceptance) |
| `expired` | Fulfill Outputs| `completed` | `system` (trigger on output acceptance) |

### Research Output Transitions

| Current Status | Action | Next Status | Allowed Roles |
| :--- | :--- | :--- | :--- |
| `not_uploaded` | Upload | `uploaded` | `applicant` (owner) |
| `uploaded` | Begin Review | `under_review` | `output_reviewer` |
| `under_review` | Request Revision | `needs_revision` | `output_reviewer` |
| `needs_revision` | Upload | `uploaded` | `applicant` (owner) |
| `under_review` | Accept | `accepted` | `output_reviewer` |
| `under_review` | Reject | `rejected` | `output_reviewer` |
