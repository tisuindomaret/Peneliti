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
