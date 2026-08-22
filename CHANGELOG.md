# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [Unreleased]
### Added
- Phase 3.1: Configurable, unique sequential permit-number generation.
- Phase 3.1: PDF generation from an admin-approved template.
- Phase 3.1: Embedded QR code / verification URL in generated PDF.
- Phase 3.1: Public verification endpoint and page showing public FR-06.4 fields.
- Phase 3.1: Immutable issued permits with cancellation/revision workflow producing full history.
### Added
- Phase 2.6 Notifications (FR-07, partial):
  - Created `notifications` and `notification_templates` entities for managing event-driven notifications.
  - Implemented BullMQ processor `NotificationsProcessor` for background email and in-app notification processing.
  - Added triggers in `AuthService`, `ApplicationsService`, and `StatusTransitionService` for `account_created`, `application_received`, `revision_requested`, and `status_changed` events.
  - Created client endpoints (`GET /api/v1/notifications`, `PATCH /api/v1/notifications/:id/read`) to list and mark notifications as read.
  - Created admin endpoints (`GET /admin/notifications/failed`, `POST /admin/notifications/:id/retry`, `PUT /admin/notification-templates/:event`) to manage failed notifications and template settings.


### Added

- Phase 0 Project Bootstrap
- Configured NPM workspaces monorepo structure.
- Scaffolded Next.js (TypeScript) frontend under `apps/frontend`.
- Scaffolded NestJS backend under `apps/backend`.
- Added `docker-compose.yml` for local development (PostgreSQL, Redis, MailHog, Frontend, Backend).
- Created `.env.example` with comprehensive placeholders.
- Initialized Husky and lint-staged for pre-commit hooks.
- Configured ESLint and Prettier at the root level.
- Added GitHub Actions CI workflow for linting, testing, and building.
- Updated `DATA_MODEL.md` and `API_SPEC.md` headers to record the confirmed technical stack.

## [1.1.0] - 2026-08-17

### Added

- **Phase 2.1 — Authentication & Accounts:**
  - Implemented `User`, `Role`, `Permission`, `RolePermission`, and `UserRole` entities in TypeORM.
  - Implemented `AuthModule` with `/auth/register`, `/auth/login`, `/auth/verify-email`, `/auth/forgot-password`, and `/auth/reset-password` endpoints.
  - Implemented `UsersModule` for finding and deactivating users, and assigning roles.
  - Implemented `RolesModule` to seed standard user roles on startup (`admin`, `applicant`, `verifier`, `official`, `output_reviewer`).
  - Implemented `MailerModule` to send Nodemailer SMTP emails for verifications and password resets.
  - Added strict ValidationPipes and an `HttpExceptionFilter` to match the agreed API contract format.
  - Added `JwtAuthGuard` and `RolesGuard` (`@Roles()`) to enforce Role-Based Access Control on endpoints.
  - Scaffolded Next.js frontend pages (`/register`, `/login`, `/verify-email`, `/forgot-password`, `/reset-password`) using custom `fetchWithAuth` wrapper.
  - Added full e2e test suite for authentication endpoints using mocked services.

### Fixed

- Fixed missing `/auth/change-password` feature. Added `changePassword` method in `AuthService`, mapped it to `AuthController` with `JwtAuthGuard` protection.
- Created `ChangePasswordPage` in frontend (`apps/frontend/src/app/change-password/page.tsx`).
- Added utility `logout` function to `api.ts` frontend helper.
- Expanded backend testing to include missing specs: duplicate-email rejection, email-verification gating upon login, and authenticated change-password endpoint check.
- Added missing `/auth/logout` API route to match `API_SPEC.md`, audit-log persistence for critical account actions, and default permission seed placeholders for data-driven RBAC.

## [Unreleased]
### Added
- Phase 3.1: Configurable, unique sequential permit-number generation.
- Phase 3.1: PDF generation from an admin-approved template.
- Phase 3.1: Embedded QR code / verification URL in generated PDF.
- Phase 3.1: Public verification endpoint and page showing public FR-06.4 fields.
- Phase 3.1: Immutable issued permits with cancellation/revision workflow producing full history.

### Added
- Implemented Phase 2.2 — Applicant Profile (FR-02) backend services (`profiles`, `institutions`, `files`) including schema, security validation, and role-based guards.
- Implemented frontend UI for Applicant Profile (`/profile`) dynamically supporting institutional applicants and file uploads.
- **Phase 2.3 — Permit Type & Requirement Configuration (FR-03):**
  - Implemented `PermitType`, `PermitRequirement`, and `DocumentTemplate` (placeholder) entities.
  - Implemented API endpoints for admin CRUD on permit types and requirements, with activate/deactivate toggles.
  - Configured server-side validation and audit logging for all mutations.
  - Seeded a "Demo Research Permit" and "Demo Template" with placeholder sample data for development.
  - Implemented frontend Admin UI (`/admin/permit-types` and sub-routes) for listing, creating, editing permit types, and managing their requirements.
  - Configurable placeholders introduced: `validity_period_days`, `numbering_pattern` (e.g. `{PREFIX}/{TYPE}/{YYYY}/{SEQ}`), and `pdf_template_id`.
