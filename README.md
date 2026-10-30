# Synaptria

Synaptria is an enterprise AI SaaS platform for biotech organizations.

## Mission

Build the AI Operating System for Biotech.

## Repository Structure

- `apps/web` — primary Next.js application
- `apps/marketing` — public marketing site
- `apps/docs` — future documentation site
- `packages/ui` — shared UI components
- `packages/database` — Prisma client and database utilities
- `packages/auth` — authentication integration
- `packages/ai` — AI services and prompt infrastructure
- `packages/config` — shared configuration
- `packages/types` — shared TypeScript types
- `docs` — product and engineering source of truth
- `.cursor/rules` — persistent Cursor instructions

## Prerequisites

- Node.js 22+
- pnpm 10+
- Docker and Docker Compose
- Git

## Quick Start

```bash
cp .env.example .env
pnpm install
docker compose up -d postgres
pnpm db:generate
pnpm db:migrate
pnpm dev
```

Open `http://localhost:3000`.

## Development Rules

Read `AGENTS.md` and the relevant files in `docs/` before implementing significant changes.
