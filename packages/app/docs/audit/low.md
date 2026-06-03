# Low Findings

Findings at this severity are low-risk technical debt, minor accessibility gaps, and brittle patterns. They carry no immediate production risk but accumulate maintenance cost if left unaddressed.

---

## L-01 — DarkToggle duplicated in AppLayout and Login

| Field | Detail |
|---|---|
| **Files** | `src/components/layout/AppLayout.tsx:12-22`, `src/components/auth/Login.tsx:23-43` |
| **Severity** | Low |

### Description

Identical dark mode toggle behavior is implemented independently in two components. Any change to toggle logic, icon, or animation must be applied in both places.

### Fix

Extract the shared implementation to `src/components/common/DarkToggle.tsx` and import it from both locations.

---

## L-02 — getLineEmpresaId and getEmpresaForActiveTimer are identical functions

| Field | Detail |
|---|---|
| **File** | `src/hooks/useTES.ts:83-99` |
| **Severity** | Low |

### Description

Both functions find a TES record by `(idTimer, idSala)` and return `idEmpresa ?? null`. They were written at different times under different names and now coexist as duplicates. Any future change to the lookup logic must be applied twice.

### Fix

Delete `getLineEmpresaId`. Update its caller at `TimerView.tsx:125` to use `getEmpresaForActiveTimer`.

---

## L-03 — buildInicioString accepts HH:mm:ss and produces invalid ISO

| Field | Detail |
|---|---|
| **File** | `src/utils/time.ts:89-91` |
| **Severity** | Low |

### Description

The template literal `` `${date}T${time}:00` `` appends `:00` unconditionally. If `time` is already in `HH:mm:ss` format, the result is `YYYY-MM-DDTHH:mm:ss:00`, which is not valid ISO 8601. This is currently safe because the caller uses `<input type="time">` which always produces `HH:mm`, but the assumption is not enforced in the function itself.

### Fix

Normalise the time portion before appending:

```ts
const timePart = time.length === 5 ? time : time.slice(0, 5);
return `${date}T${timePart}:00`;
```

---

## L-04 — O(n²) overlap check in Categorias could be slow if moved to onChange

| Field | Detail |
|---|---|
| **File** | `src/components/admin/Categorias.tsx:45-66` |
| **Severity** | Low |

### Description

The overlap check performs a pairwise comparison of all timers. With 50 timers this produces 1225 comparisons. In a submit handler this is acceptable. If the check is ever moved to `onChange` (for real-time feedback), it will run on every keystroke without debouncing and will noticeably degrade input responsiveness.

### Fix

No action required now. Add a comment on the function stating: do not move to `onChange` without debouncing or replacing with an O(n log n) algorithm.

---

## L-05 — Missing aria-controls linking hamburger to drawer

| Field | Detail |
|---|---|
| **Files** | `src/components/layout/AppLayout.tsx:78`, `src/components/auth/Login.tsx:111` |
| **Severity** | Low |

### Description

The hamburger button has `aria-label` but neither `aria-controls` nor `aria-expanded`. Screen readers cannot associate the button with the drawer it controls, and cannot announce whether the drawer is open or closed.

### Fix

Add `id="mobile-menu"` to the drawer element. Add `aria-controls="mobile-menu"` and `aria-expanded={mobileMenuOpen}` to the hamburger button.

---

## L-06 — No ErrorBoundary anywhere in component tree

| Field | Detail |
|---|---|
| **Files** | `src/App.tsx`, `src/main.tsx` |
| **Severity** | Low |

### Description

There is no React `ErrorBoundary` wrapping any part of the component tree. Any Zod parse error, unexpected null dereference, or render-phase exception crashes the entire React tree and produces a blank white page with no user-facing message.

### Fix

Wrap the application root with an `ErrorBoundary`:

```tsx
<ErrorBoundary fallback={<div>Error inesperado. Recarga la página.</div>}>
  <App />
</ErrorBoundary>
```

---

## L-07 — useTimers sorts by localeCompare (lexicographic, assumes ISO format)

| Field | Detail |
|---|---|
| **File** | `src/hooks/useTimers.ts:29` |
| **Severity** | Low |

### Description

`a.inicio.localeCompare(b.inicio)` produces a correct chronological sort only when `inicio` is an ISO 8601 string, because ISO 8601 strings sort lexicographically in the same order as chronologically. If the backend ever returns a differently-formatted datetime, the sort will silently produce incorrect ordering with no type error or runtime warning.

### Fix

Add a comment stating that this sort assumes ISO 8601 format. Alternatively, replace with an explicit numeric comparator:

```ts
new Date(a.inicio).getTime() - new Date(b.inicio).getTime()
```
