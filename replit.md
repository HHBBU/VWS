# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains the **Veloce Wear SCM Simulation** — a full-stack web application for the SCM 4330 Supply Chain Management course.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Auth**: express-session + connect-pg-simple + bcryptjs
- **Charts**: Recharts

## Application: Veloce Wear Simulation

A Supply Chain Management course simulation for students and instructors.

### User Roles
- **Students**: Register with .edu email, complete 3 simulation modules sequentially
- **Instructors**: View gradebook, manage module time windows, grant per-student extensions

### Key Features
- Secure registration (`.edu` email required, bcrypt passwords)
- Module locking: M1 always open → M2 requires M1 submission → M3 requires M2 submission
- Practice runs (unlimited) + final submission (one per module)
- Student dashboard with achievement badges
- Instructor gradebook with search, filter, CSV export
- Module time windows with per-student extensions
- Dark mode support

### Default Credentials
- **Instructor**: instructor@ggc.edu / instructor123
- **Students**: Self-register at /register

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (auth, student, instructor routes)
│   └── veloce-scm/         # React+Vite frontend (served at /)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml     # pnpm workspace
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package
```

## API Routes

- `POST /api/auth/register` — Student registration
- `POST /api/auth/login` — Login (students + instructors)
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Get current user session

- `GET /api/student/dashboard` — Student dashboard data (modules, scores, achievements)
- `GET /api/student/modules/:key` — Module detail + run history
- `POST /api/student/modules/:key/practice` — Run practice simulation
- `POST /api/student/modules/:key/submit` — Submit final for module

- `GET /api/instructor/gradebook` — All students with scores (search/filter)
- `GET /api/instructor/gradebook/export` — CSV export
- `GET /api/instructor/settings` — Module windows + extensions
- `PUT /api/instructor/settings/windows` — Update module time windows
- `POST /api/instructor/extensions` — Add per-student extension
- `DELETE /api/instructor/extensions/:id` — Remove extension

## Database Tables

- `users` — Students and instructors (role enum)
- `module_settings` — Module time windows (M1/M2/M3)
- `module_extensions` — Per-student deadline extensions
- `module_submissions` — Final submissions with scores
- `simulation_runs` — All runs (practice + final)
- `config` — Key-value configuration

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`.

- **Always typecheck from the root** — run `pnpm run typecheck`
- Run codegen after OpenAPI spec changes: `pnpm --filter @workspace/api-spec run codegen`
- Push DB schema changes: `pnpm --filter @workspace/db run push`

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references
