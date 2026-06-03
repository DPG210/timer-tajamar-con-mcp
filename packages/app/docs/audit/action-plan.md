# Prioritized Action Plan

All findings from the audit grouped by effort and risk. Work through the groups in order.

---

## Immediate — low risk, high impact

These require minimal effort, carry no architectural risk, and should be done in the current sprint.

| # | Finding | Location |
|---|---|---|
| 1 | C-01 — Delete debug console.group block | `TimerView.tsx:89-111` |
| 2 | M-11 — Remove `@types/socket.io-client` from devDependencies | `package.json` |
| 3 | L-06 — Add `<ErrorBoundary>` in `main.tsx` | `src/main.tsx` |
| 4 | M-07 — Remove `async` from `handleAssign` | `Horario.tsx:46` |
| 5 | M-04 — Remove `refetchInterval` from `useTimers` | `src/hooks/useTimers.ts` |
| 5 | M-05 — Remove `refetchInterval` from `useCategorias` | `src/hooks/useCategorias.ts` |
| 6 | M-08 — Extract `THEME_STORAGE_KEY` constant | `src/stores/themeStore.ts` |

---

## Short term — moderate effort, avoid production bugs

These fix bugs that are already reachable by users in normal operation.

| # | Finding | Location |
|---|---|---|
| 7 | C-04 — Fix `salaName` desync after page reload | `TimerView.tsx:63-70` |
| 8 | H-08 — Fix `newCategoriaId = 0` init | `Temporizadores.tsx:34` |
| 9 | H-03 — Expose `isLoading` from active timer hooks | `useCurrentActiveTimer.ts`, `useCalculatedRemainingSeconds.ts` |
| 10 | M-02 — Change `imagenEmpresa` to `z.string().optional()` | `src/types/models.ts:136` |
| 11 | L-02 — Delete `getLineEmpresaId`, use `getEmpresaForActiveTimer` | `src/hooks/useTES.ts` |
| 12 | M-01 — Replace `key={i}` with composite keys | `EmpresasEventoTimers.tsx`, `HorarioActualEmpresaPopUp.tsx` |

---

## Medium term — architectural improvements

These require coordinated changes across multiple files or introduce a new pattern to the codebase.

| # | Finding | Location |
|---|---|---|
| 13 | H-01 — Replace `window.location.href` with React Router `navigate`; add `?next=` restore for admin routes | `src/api/client.ts:49` |
| 14 | H-05 — Move `useTimerSocket` to app root level (single instance) | `src/hooks/useTimerSocket.ts` |
| 15 | H-06 — Extract `fetchEventosActualesEmpresa` helper | `EmpresasEventoTimersNew.tsx`, `useTimerEventos.ts` |
| 16 | M-09 — Refactor `isAuthenticated` from function to boolean field | `src/stores/authStore.ts` |
| 17 | M-10 — Enable `tseslint.configs.recommendedTypeChecked` | `eslint.config.js` |
| 18 | M-06 — Add focus trap in `MenuPopUp` drawer | `src/components/layout/MenuPopUp.tsx` |

---

## Backlog — requires backend coordination or major refactor

These cannot be completed by frontend changes alone, or require significant rework.

| # | Finding | Notes |
|---|---|---|
| 20 | C-03 — Backend atomic cascade delete endpoint | Requires new backend transaction endpoint |
| 21 | H-04 — Fix overlap check logic for category create vs edit | Remove check on create; document on edit only |
| 22 | H-07 — Stronger token validation + graceful expired-token handling for admin routes | Validate JWT structure (3-part split) at route guard time; combine with H-01 `?next=` restore so admin users land back on the correct page after re-login |
| 23 | L-01 — Extract shared `DarkToggle` component | Low effort but touches two unrelated pages |
| 24 | L-05 — Add `aria-controls`/`aria-expanded` to hamburger buttons | `AppLayout.tsx`, `Login.tsx` |
| 25 | H-02 — Fix ARIA listbox pattern in `SalaPopUp` | Replace invalid `button[role=option]` pattern |
