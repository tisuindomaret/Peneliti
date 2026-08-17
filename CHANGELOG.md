# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

- Implemented Phase 2.2 — Applicant Profile (FR-02) backend services (`profiles`, `institutions`, `files`) including schema, security validation, and role-based guards.
- Implemented frontend UI for Applicant Profile (`/profile`) dynamically supporting institutional applicants and file uploads.

## [Unreleased]
### Added
- Implemented Phase 2.2 — Applicant Profile (FR-02) backend services (`profiles`, `institutions`, `files`) including schema, security validation, and role-based guards.
- Implemented frontend UI for Applicant Profile (`/profile`) dynamically supporting institutional applicants and file uploads.
