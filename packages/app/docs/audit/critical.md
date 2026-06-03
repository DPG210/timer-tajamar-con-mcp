# Critical Findings

Findings at this severity risk security exposure, data loss, or persistent UI corruption. All must be resolved before the next production deployment.

---

## C-01 — Debug console.group block left in production

| Field | Detail |
|---|---|
| **File** | `src/components/timer/TimerView.tsx` lines 89-111 |
| **Severity** | Critical |

### Description

A `useEffect` fires `console.group`, 7x `console.log`, and `console.groupEnd` unconditionally on every render cycle. The block was never removed before production. It declares 11 dependencies and therefore fires frequently throughout normal usage.

### Impact

Information disclosure. Timer IDs, TES records, and empresa names are written to the browser console. Any user who opens DevTools in production can read this data without any additional privileges.

### Fix

Delete lines 89-111 entirely.

---

## C-03 — Cascade delete is not atomic

| Field | Detail |
|---|---|
| **Files** | `src/hooks/useSalas.ts:67-70`, `src/hooks/useEmpresas.ts:67-70`, `src/hooks/useTimers.ts:85-87`, `src/hooks/useCategorias.ts:83-89` |
| **Severity** | Critical |

### Description

Each delete hook uses `Promise.all(tesIds.map(...delete TES...))` followed by a separate `.delete(parentEntity)` call. This sequence is not atomic. If any individual TES DELETE fails mid-way, already-deleted TES records are gone but the parent entity remains, leaving the database in an inconsistent state.

In `useDeleteCategoria` there is a second `Promise.all` for timers. If all TES deletions succeed but a timer DELETE fails, orphaned timers remain with dangling TES references.

### Impact

Partial failures produce a database state that no subsequent request can clean up from the frontend alone. Data integrity is permanently compromised until manual intervention.

### Fix

Implement a backend endpoint for cascade delete that executes all deletions inside a single database transaction. The frontend should make one call to that endpoint.

In the interim, add a warning to the confirmation dialog explaining that deletion is not atomic and a partial failure will require manual data cleanup.

---

## C-04 — `salaName` desyncs from persisted `idSalaActiva` after page reload

| Field | Detail |
|---|---|
| **File** | `src/components/timer/TimerView.tsx` lines 63-70 |
| **Severity** | Critical |

### Description

`idSalaActiva` is restored from Zustand persist (localStorage) on page reload. `salaName` is a plain `useState('')` that is never initialized from the persisted ID. After a reload, `idSalaActiva` may be `3` while `salaName` remains `''`. The header displays "Seleccionar sala" even though a sala is already selected.

### Impact

Users who reload the page see stale UI state. Depending on downstream logic that reads `salaName`, this can silently cause incorrect behavior beyond just the display label.

### Fix

Derive `salaName` from the loaded salas list instead of storing it in independent state.

```tsx
const { data: salas = [] } = useSalas();
const salaName = salas.find(s => s.idSala === idSalaActiva)?.nombreSala ?? '';
// Remove salaName useState and setSalaName calls entirely
```
