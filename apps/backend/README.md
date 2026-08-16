# Research Permit Licensing - Backend

This is the NestJS REST API for the Research Permit Licensing system.
It manages application workflows, verifications, statuses, and acts as the data provider for the frontend application.

## Tech Stack
- NestJS
- TypeScript
- PostgreSQL (via Prisma or TypeORM eventually, depending on ORM choice in Phase 1)
- Redis / BullMQ (for background jobs)

## Getting Started

First, make sure your PostgreSQL and Redis instances are running (via `docker-compose up` at the project root).

Then run the development server:

```bash
# development
npm run start

# watch mode
npm run start:dev
```

## Running Tests

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e
```
