# Architecture & Design

This document outlines the high-level architecture and module boundaries for the Research Permit Licensing Web Application.

## 1. System Overview

The system is a TypeScript monorepo consisting of two primary applications:

1.  **Frontend (`apps/frontend`)**: A Next.js application responsible for the user interface (Applicant portal, Back-office, and Public Verification). It utilizes Server-Side Rendering (SSR) where beneficial (e.g., public verification page for SEO and fast initial load) and communicates with the backend via REST API.
2.  **Backend (`apps/backend`)**: A NestJS application providing the REST API. It handles business logic, database interactions, authorization, and background task coordination.

### Infrastructure (Phase 0 Setup)
*   **Database**: PostgreSQL for relational data, structured per `DATA_MODEL.md`.
*   **Message Broker / Cache**: Redis, used in conjunction with BullMQ for background job processing (notifications, PDF generation).
*   **Local Development**: Docker Compose manages PostgreSQL, Redis, and a local SMTP catcher (MailHog).

## 2. Module Boundaries (Backend)

The NestJS backend will be structured into distinct, cohesive modules to maintain separation of concerns.

### Core Business Modules
*   **`AuthModule`**: Handles user registration, login, JWT/session issuance, and password resets.
*   **`UsersModule`**: Manages user profiles (applicants and internal staff) and institution records.
*   **`ApplicationsModule`**: The core workflow engine for permit applications. Manages creation, submission, and verification workflows.
*   **`PermitsModule`**: Handles the issuance of permits, generation of PDFs, QR codes, and public verification endpoints.
*   **`ResearchOutputsModule`**: Manages the upload and review of research outputs linked to issued permits.
*   **`AdminModule`**: Handles master data configuration (permit types, requirements, forms, system settings).

### Shared Services (Cross-Cutting Concerns)
These services act as foundational utilities utilized across the business modules:

*   **`AuthorizationService` (RBAC)**: Centralized logic to evaluate if a user (based on their roles) has permission to perform an action on a specific resource, implementing the matrix in `docs/rbac.md`.
*   **`StatusTransitionService`**: A centralized state machine enforcer. Any endpoint aiming to change an application or output status must go through this service, which validates the transition against `docs/state_transitions.md`.
*   **`AuditLoggingService`**: Automatically invoked by the `StatusTransitionService` and other critical mutating endpoints to append records to `audit_logs` and `status_history`. It is insert-only.
*   **`FileValidationService`**: Intercepts file uploads to validate MIME types (via magic numbers, not just extensions), sizes, and moves files to secure, non-web-executable storage paths.
*   **`NotificationService` (Queue Worker)**: Interfaces with BullMQ to asynchronously dispatch emails or in-app notifications without blocking the API response cycle.

## 3. Frontend Architecture

The Next.js frontend will utilize the App Router (`src/app`) and should be structured by feature areas:

*   **`app/(public)`**: Public-facing pages (Landing, Login, Register, Verification Page).
*   **`app/(applicant)`**: The portal for applicants (Dashboard, Application Form, Profile, Output Submission).
*   **`app/(admin)`**: The back-office for verifiers, officials, and system administrators (Queues, Review screens, Config).

### Data Fetching
*   Use React Server Components (RSC) for initial data fetching where SEO or initial load performance is critical (e.g., the Public Verification page).
*   Use client-side fetching (e.g., SWR or React Query) for highly interactive, authenticated dashboards and forms.

## 4. Security Boundaries

*   **Authentication**: Enforced globally on the backend via NestJS guards, except for explicitly marked `@Public()` endpoints.
*   **Authorization**: Enforced at the endpoint level via custom decorators linking to the `AuthorizationService` (e.g., `@RequirePermission('application.review')`).
*   **Data Scoping**: Queries must always be filtered by the requesting user's identity/role. Applicants must never be able to fetch applications they do not own.
*   **File Storage**: Uploaded files must never be stored in the Next.js `public` directory. They must be stored outside the web root and served via secure, authorized backend endpoints.
