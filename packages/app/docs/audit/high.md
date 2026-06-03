# High Findings

Findings at this severity represent bugs and design flaws that degrade reliability, accessibility, or correctness in ways that affect real users or make the codebase hazardous to extend.

---

## H-01 — Hard redirect on 401 bypasses React Router (admin routes)

| Field | Detail |
|---|---|
| **File** | `src/api/client.ts:49` |
| **Severity** | High |

### Architecture context

The 401 interceptor fires exclusively for admin API calls. The timer view is public and does not require authentication — unauthenticated users reaching `/timer` is correct behavior, not an error. The concerns below apply only to the admin section of the application.

### Description

When an admin API call returns 401 (expired or missing token), the interceptor sets `window.location.href = '/login'`. This triggers a full browser reload, discarding the React Router navigation stack, the TanStack Query cache, and all Zustand in-memory state. There is no `?next=` redirect parameter, so the admin user always lands at the default route after re-login regardless of which admin page they were on.

The guard condition `!url.includes('Auth/Login')` uses substring matching. Any future endpoint whose path happens to contain that substring will bypass the redirect silently.

### Fix

Use `navigate('/login', { replace: true, state: { next: window.location.pathname } })` via a shared navigator instance exported from the router module. Read the `next` state after login to restore the admin user's previous location. Replace the substring check with a strict path comparison:

```ts
!url.endsWith('Auth/Login')
```

---

## H-02 — Invalid ARIA listbox pattern in SalaPopUp

| Field | Detail |
|---|---|
| **File** | `src/components/timer/SalaPopUp.tsx:49` |
| **Severity** | High |

### Description

`aria-selected={false}` is hardcoded on every option at all times. A screen reader cannot determine which sala is currently active. Additionally, `<button role="option">` nested inside `<li>` inside `<ul role="listbox">` is invalid ARIA — `role="option"` must be a direct child of `role="listbox"`, and interactive elements inside options are not permitted.

### Fix

Replace with a valid pattern. Either use proper list semantics:

```tsx
<li role="option" tabIndex={0} aria-selected={idSalaActiva === sala.idSala}>
  {sala.nombreSala}
</li>
```

Or drop the listbox role entirely and use plain buttons with `aria-current`:

```tsx
<button aria-current={idSalaActiva === sala.idSala ? 'true' : undefined}>
  {sala.nombreSala}
</button>
```

---

## H-03 — Silent null/0 during loading indistinguishable from "no active timer"

| Field | Detail |
|---|---|
| **Files** | `src/hooks/useCurrentActiveTimer.ts:35`, `src/hooks/useCalculatedRemainingSeconds.ts:120-124` |
| **Severity** | High |

### Description

During the TanStack Query loading window both hooks return `null`/`0`. The component renders "Sin eventos en este momento", which is factually incorrect during the 100-300ms loading window. A user who loads the page mid-session sees a flash of the empty state before the real data arrives.

### Fix

Expose `isLoading` state from both hooks. Render a loading skeleton instead of the "Sin eventos" message while loading is in progress.

---

## H-04 — Overlap check on category create is a no-op

| Field | Detail |
|---|---|
| **File** | `src/components/admin/Categorias.tsx:45-66` |
| **Severity** | High |

### Description

`checkOverlapForDuration` on category create is called with all existing timers and performs a pairwise check — it checks whether existing timers overlap with each other, not whether the new category's duration would cause overlap with anything. Because the new category has no timers yet, the check always returns `false`. An admin can create any duration with no overlap warning.

### Fix

Remove the overlap check from the create path entirely. No timers reference the new category at creation time, so there is nothing to check. Document that overlap validation is only meaningful on edit.

---

## H-05 — Multiple useTimerSocket mounts register duplicate socket listeners

| Field | Detail |
|---|---|
| **File** | `src/hooks/useTimerSocket.ts:33-58` |
| **Severity** | High |

### Description

If two components mount `useTimerSocket` simultaneously, two independent sets of `timerID` listeners are registered. Each listener calls `setState` and each independently invalidates the TES cache, resulting in double invalidation and potentially inconsistent state updates.

### Fix

Move socket-to-query-cache bridging to a single `useEffect` at app root level, inside `App.tsx` or `main.tsx`. Expose the resulting state via a Zustand store or Context so all consumers read from one source.

---

## H-06 — Inline queryFn in EmpresasEventoTimersNew duplicates hook logic

| Field | Detail |
|---|---|
| **File** | `src/components/eventos/EmpresasEventoTimersNew.tsx:61-69` |
| **Severity** | High |

### Description

`handleEmpresaClick` calls `queryClient.fetchQuery` with an inline `queryFn` that manually calls `apiClient.get` and parses the result with `EventoActualArraySchema`. This is an exact duplicate of the `queryFn` defined in `useEventosActualesEmpresa` at `src/hooks/useTimerEventos.ts:54-64`. Any endpoint path or schema change must be applied in two places. A missed update will cause a silent runtime mismatch.

### Fix

Extract a standalone `fetchEventosActualesEmpresa(queryClient, idEmpresa)` helper function and call it from both locations.

---

## H-07 — Weak token validation in isAuthenticated (admin routes only)

| Field | Detail |
|---|---|
| **File** | `src/stores/authStore.ts:49-52` |
| **Severity** | High |

### Architecture context

`isAuthenticated` guards admin routes only. The public timer view does not consult this check — unauthenticated access to the timer is intentional and correct.

### Description

The `isAuthenticated` check guards only against the string literals `"undefined"` and `""`. A malformed or expired JWT stored in localStorage is treated as valid until the first admin API call returns a 401. At that point the interceptor triggers a full page reload to `/login` with no redirect-back parameter (see H-01), losing the admin user's current location.

### Fix

Store `isAuthenticated` as a derived boolean rather than a function. At minimum, validate basic JWT structure before accepting a stored token as valid:

```ts
token.split('.').length === 3
```

Combine with the H-01 fix so that when the stale token is detected early (at route guard time rather than at first API call), the admin user is redirected to `/login` with a `?next=` parameter that restores their previous admin page after re-login.

---

## H-08 — newCategoriaId initializes to 0 before categorias load

| Field | Detail |
|---|---|
| **File** | `src/components/admin/Temporizadores.tsx:34` |
| **Severity** | High |

### Description

`useState<number>(categorias[0]?.idCategoria ?? 0)` is evaluated when `categorias` is still the initial empty array `[]`. The state is never updated when categorias eventually load. When the user submits the create form without manually selecting a category, `catId` is `0`, `categorias.find(c => c.idCategoria === 0)` returns `undefined`, and `handleCreate` returns silently with no error shown to the user.

### Fix

```ts
const [newCategoriaId, setNewCategoriaId] = useState<number | null>(null);
const effectiveCategoriaId = newCategoriaId ?? categorias[0]?.idCategoria ?? null;
```

Alternatively, use a `useEffect` to set the initial value when categorias first load.
