# Testing Strategy — AppTimersFinal React 19 Migration

**Agente:** senior-testing-agent  
**Fecha:** 2026-05-27

---

## Pyramid / Trophy

```
          E2E (Playwright)
              ───
        Integration (Vitest + MSW)
            ─────────────
     Component (Vitest + @testing-library/react)
        ─────────────────────────────
           Unit (Vitest — pure functions)
    ─────────────────────────────────────────
```

**Ratio objetivo:** 70% unit, 20% component+integration, 10% E2E.

---

## Suite budget

| Layer | Max duration | Flakiness limit |
|---|---|---|
| Unit | < 2 s | 0% |
| Component | < 15 s | 0% |
| Integration | < 30 s | < 1% |
| E2E | < 3 min | < 5% |

---

## Implemented tests

### Unit — `src/utils/time.test.ts` [DONE — 30 tests]

All exported functions from `utils/time.ts` are covered. Critical:
- `haySolapamiento`: 6 test cases including boundary exclusion (shared boundary = no overlap), commutativity, identical ranges.
- `formatCountdown`: negative clamping, fractional seconds.
- `transformDuration`/`transformMinutes`: roundtrip inverse property.

---

## Pending test files (to implement)

### Component tests — `src/components/auth/Login.test.tsx`

```typescript
// Arrange: render Login, mock useLogin mutation
// Act: submit with wrong credentials
// Assert: Swal.fire called with 'error' icon
// Assert: no token in localStorage

// Act: submit with correct credentials
// Assert: useNavigate called with '/'
// Assert: localStorage contains token
```

### Component tests — `src/components/admin/Salas.test.tsx`

```typescript
// Arrange: render Salas with mocked salas query
// Act: create sala with name that already exists
// Assert: Swal.fire 'warning' called, no mutation triggered

// Act: delete sala with TES dependencies
// Assert: Swal confirmation shown
// Assert: Promise.all called for TES deletions before sala DELETE
```

### Hook tests — `src/hooks/useTES.test.ts`

```typescript
// findTESForTimerInSala: returns correct record
// getEmpresaForActiveTimer: returns null when no TES matches
// hasTESForTimerSala: excludeId param works correctly
```

### Hook tests — `src/hooks/useTimerSocket.test.ts`

```typescript
// Arrange: mock socket module, render hook
// Act: emit 'timerID' with value 42
// Assert: activeTimerId === 42
// Assert: queryClient.invalidateQueries called with ['tes']

// Act: unmount hook
// Assert: socket.off called for all 4 listeners (no memory leak)
```

### Integration test — login → admin flow

```typescript
// MSW handler: POST Auth/Login → 200 { response: 'fake-jwt' }
// MSW handler: GET api/salas → 200 [{ idSala: 1, nombreSala: 'Sala 1' }]
// 1. Render App at /login
// 2. Fill credentials, submit
// 3. Assert redirect to /
// 4. Navigate to /salas
// 5. Assert sala list renders with 'Sala 1'
// 6. Assert Authorization header in intercepted requests === 'Bearer fake-jwt'
```

---

## Critical test cases (from PRD acceptance criteria)

| ID | Test | Layer | Status |
|---|---|---|---|
| T-01 | `haySolapamiento` boundary exclusion | Unit | DONE |
| T-02 | `calcularFin` wraps past midnight | Unit | DONE |
| T-03 | `formatCountdown` clamps negatives | Unit | DONE |
| T-04 | Login 401 shows Swal error, no token stored | Component | Pending |
| T-05 | Delete sala with TES uses Promise.all | Component | Pending |
| T-06 | `timerID` socket event invalidates TES query | Hook | Pending |
| T-07 | Socket listeners removed on hook unmount | Hook | Pending |
| T-08 | Characters especiales in sala name encoded correctly | Integration | Pending |
| T-09 | Bearer token present in all POST/PUT/DELETE requests | Integration | Pending |
| T-10 | 401 response clears token and redirects to /login | Integration | Pending |
| T-11 | EmpresasEventoTimers shows fin calculated from duracion (M-11 fix) | Component | Pending |
| T-12 | Full login → create timer → see in TimerView flow | E2E | Pending |

---

## Tools

- **Vitest** (4.x) — unit and component tests, co-located with Vite
- **@testing-library/react** — component rendering and user interactions
- **MSW (Mock Service Worker)** — API mocking for integration tests
- **Playwright** — E2E tests with real browser, WebSocket mocked via `page.route`
- **@vitest/coverage-v8** — coverage reports

---

## Flaky test policy

A flaky test is a blocker. Before adding `skip` or retry:
1. Root cause must be identified.
2. Fix first, then re-enable.
3. If root cause is infrastructure (network timeout in CI), add `vi.useFakeTimers()` or increase timeout explicitly — never add unconditional `skip`.

---

## What NOT to test

- Implementation details of TanStack Query internals.
- Swal rendering (third-party, they test it).
- Socket.io reconnection logic (socket.io-client tests it).
- Zod schema validation shapes (covered by type system at compile time + the parse in each hook).
