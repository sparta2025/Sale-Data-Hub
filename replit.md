# Sales BI Platform

A unified Sales Business Intelligence platform combining a React+Vite frontend, Express 5 API with 39 KPI metrics, multi-user auth, 6 languages, 5 themes, demo mode, AI agents, Excel import/export, and a PostgreSQL database.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000/8080)
- `pnpm --filter @workspace/sales-bi run dev` — run the frontend (port 18182)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — HMAC secret for token signing

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite 7 + shadcn/ui + Tailwind + Recharts + Wouter
- API: Express 5 (port 8080, mounted at `/api`)
- DB: PostgreSQL + Drizzle ORM
- Auth: Custom opaque 64-char hex tokens (SHA256 HMAC + bcrypt rounds=12), stored in `access_tokens` table
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- AI: Anthropic Claude via `@anthropic-ai/sdk`

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (50+ endpoints, source of truth for API contract)
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks
- `lib/api-zod/src/generated/api.ts` — generated Zod schemas
- `lib/db/src/schema/` — Drizzle schema files (users, datasets, dashboards, agents, audit)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/kpi-engine.ts` — 39 KPI metrics engine
- `artifacts/api-server/src/lib/auth.ts` — token generation/validation
- `artifacts/sales-bi/src/` — React frontend (pages, components, lib)

## Architecture decisions

- **Token storage**: `localStorage` key `sbi_token`; demo mode stored as `sbi_demo=true`
- **KPI engine**: TypeScript port (no Python dependency) — `aggregateKpi()`, `applyScenario()`, `forecastTrendSeasonal()`
- **No JWT**: Opaque tokens (32 random bytes, hex-encoded) — faster revocation, simpler client
- **Multi-language**: 6 languages (ru, en, de, fr, zh, ko) via `I18nContext`, defaults to Russian
- **Demo mode**: Bypasses auth, uses client-side mock data, upload/edit disabled

## Product

- **Dashboard**: KPI scorecard (8 cards), trend/category/area charts, top products, KPI side panel
- **Datasets**: Upload Excel/CSV, manage sales data, view summary stats
- **AI Agents**: Chat interface with Claude AI, KPI analyst + scenario + price scout + strategy agents
- **Admin Panel**: User management, system stats, audit log access
- **Auth**: Register/login with token, demo mode (no credentials needed)

## Default credentials

- **Admin**: `admin@salesbi.com` / `Admin123!`
- **Demo Mode**: Click "Демо-режим" on login page — no credentials needed

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm run typecheck:libs` before checking artifact typechecks if you change a lib
- `req.params.*` in Express 5 routes must be cast `as string` before passing to Drizzle `eq()`
- Zod schema names from codegen: `CreateDashboardBody` not `DashboardInput`, `UpdateUserBody` not `AdminUserUpdate`, etc. — grep `lib/api-zod/src/generated/api.ts` to confirm
- Hook names from codegen: `useListUsers` not `useGetUsers`, `useListDatasets` not `useGetDatasets`
- DB schema push: `pnpm --filter @workspace/db run push` — run after schema changes
- Do NOT run `pnpm dev` at workspace root

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
