# Technical Debt and Bug Audit

This folder contains the results of a full technical debt and bug audit of `timer-tajamar-V2`. Findings are grouped by severity and complemented by a prioritized action plan.

## Architecture Note

The application has two distinct access tiers:

- **Timer view (public)** — `TimerView`, the socket connection, and all timer hooks are intentionally accessible without authentication. Any visitor can view timers without logging in.
- **Admin section (authenticated)** — Login and auth exist exclusively for admin users who manage salas, empresas, categorias, temporizadores, eventos, and horarios.

The 401 redirect in `src/api/client.ts` fires only for admin API calls. It is correct and intentional. Findings that reference authentication must be read in this context: they apply to the admin section only, not to the public timer view.

## Contents

| File | Description |
|---|---|
| [critical.md](./critical.md) | C-01, C-03, C-04 — findings that risk data loss, security exposure, or persistent UI corruption |
| [high.md](./high.md) | H-01 through H-08 — bugs and design flaws that degrade reliability, accessibility, or correctness |
| [medium.md](./medium.md) | M-01 through M-11 — code quality and maintainability issues with moderate production impact |
| [low.md](./low.md) | L-01 through L-07 — low-risk tech debt, minor accessibility gaps, and brittle patterns |
| [action-plan.md](./action-plan.md) | Prioritized action plan grouping all findings into immediate, short-term, medium-term, and backlog work |
