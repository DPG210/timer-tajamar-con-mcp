# Medium Findings

Findings at this severity are code quality and maintainability issues with moderate production impact. They do not require immediate hotfixes but should be resolved in the normal development cycle.

---

## M-01 — Array index as key in dynamic lists

| Field | Detail |
|---|---|
| **Files** | `EmpresasEventoTimers.tsx:57,82,106`, `HorarioActualEmpresaPopUp.tsx:57` |
| **Severity** | Medium |

### Description

`key={i}` is used as the React list key in multiple dynamic lists. When items are reordered, filtered, or updated via socket invalidation, React reconciles against the wrong DOM nodes, producing stale renders, incorrect state association, and missed animations.

### Fix

Use a stable composite key derived from the data:

```tsx
key={`${ev.sala}-${ev.inicioTimer}`}
```

---

## M-02 — imagenEmpresa in schema but never used

| Field | Detail |
|---|---|
| **File** | `src/types/models.ts:136` |
| **Severity** | Medium |

### Description

The `imagenEmpresa` field is validated and typed in the Zod schema but no component renders it. If the backend removes or renames the field, `z.string()` will throw a parse error on `undefined` and crash all `EventoActual` views.

### Fix

Change the field definition to make it safe against absence:

```ts
imagenEmpresa: z.string().optional()
// or
imagenEmpresa: z.string().default('')
```

---

## M-03 — Overlap validation ignores date, only checks time-of-day

| Field | Detail |
|---|---|
| **Files** | `src/components/admin/Temporizadores.tsx:40-49`, `src/utils/time.ts:104-110` |
| **Severity** | Medium |

### Description

`toTimeRange` extracts only the `HH:mm` portion of a datetime string. Two timers on different calendar dates are flagged as overlapping because only their time-of-day is compared. This blocks multi-day scheduling if that requirement is ever introduced.

### Fix

No code change is required now. Add an explicit comment in `checkOverlap` stating that date is intentionally ignored and that multi-day scheduling is not currently supported. Document as known architectural debt.

---

## M-04 — Redundant polling + socket invalidation in useTimers

| Field | Detail |
|---|---|
| **File** | `src/hooks/useTimers.ts:32-33` |
| **Severity** | Medium |

### Description

`staleTime: 0` combined with `refetchInterval: 60_000` means the timer list is polled every 60 seconds unconditionally. The socket `syncData` event already invalidates the cache on every relevant change. The polling is redundant and generates unnecessary network traffic.

### Fix

Remove `refetchInterval: 60_000`. Set `staleTime: 30_000`.

---

## M-05 — Redundant polling + socket invalidation in useCategorias

| Field | Detail |
|---|---|
| **File** | `src/hooks/useCategorias.ts:30-32` |
| **Severity** | Medium |

### Description

Same pattern as M-04. Categories change very rarely and socket invalidation already handles propagation of changes. The polling interval adds unnecessary requests.

### Fix

Remove `refetchInterval`. Keep `staleTime: 30_000`.

---

## M-06 — No focus trap in modal drawer

| Field | Detail |
|---|---|
| **File** | `src/components/layout/MenuPopUp.tsx:13-58` |
| **Severity** | Medium |

### Description

The drawer has `role="dialog"` and `aria-modal="true"` but does not trap focus. Keyboard Tab cycles through the page behind the backdrop. `TimerMenu` calls `panelRef.current?.focus()` on open but does not constrain Tab navigation to the drawer's contents, violating the ARIA authoring practices for modal dialogs.

### Fix

Use the native `<dialog>` element, which traps focus automatically. If `<dialog>` is not suitable for this layout, implement a focus trap manually by intercepting Tab and Shift+Tab keydown events at the drawer boundary.

---

## M-07 — async function with no await in Horario.tsx

| Field | Detail |
|---|---|
| **File** | `src/components/horario/Horario.tsx:46` |
| **Severity** | Medium |

### Description

`handleAssign` is declared `async` but never uses `await` inside its body. `handleRemove` in the same file correctly uses `await Swal.fire`. The spurious `async` on `handleAssign` produces an unnecessary Promise wrapper and triggers `@typescript-eslint/no-floating-promises` warnings when type-checked linting is enabled.

### Fix

Remove `async` from `handleAssign`.

---

## M-08 — Theme storage key duplicated between persist and initTheme

| Field | Detail |
|---|---|
| **File** | `src/stores/themeStore.ts:23-33` |
| **Severity** | Medium |

### Description

`initTheme()` reads the `'theme'` key from localStorage using a hardcoded string literal. The same key is written by Zustand persist. If the persist key is ever changed or namespaced, `initTheme()` will silently stop working and the flash of unstyled content (FOUC) will return without any obvious connection to the root cause.

### Fix

Extract the key to a shared constant and reference it in both places:

```ts
export const THEME_STORAGE_KEY = 'theme';
// use in persist: persist({ name: THEME_STORAGE_KEY })
// use in initTheme: localStorage.getItem(THEME_STORAGE_KEY)
```

---

## M-09 — isAuthenticated() called as function inside Zustand selector

| Field | Detail |
|---|---|
| **Files** | `ProtectedRoute.tsx:10`, `Menu.tsx:15`, `Login.tsx:48`, `Horario.tsx:31`, `TimerMenu.tsx:31` |
| **Severity** | Medium |

### Description

Selectors call `s.isAuthenticated()` — invoking it as a function on every store update. The comparison works because a boolean is returned, but the function reference is re-evaluated on every store change regardless of whether auth state has changed. This is a latent performance issue and will silently break if the function is replaced with a plain property.

### Fix

Store `isAuthenticated` as a boolean field rather than a getter function in the authStore. Update all 5 call sites to read `s.isAuthenticated` without parentheses.

---

## M-10 — No type-checked linting (floating promises undetected)

| Field | Detail |
|---|---|
| **File** | `eslint.config.js` |
| **Severity** | Medium |

### Description

The ESLint config uses `tseslint.configs.recommended` instead of `recommendedTypeChecked`. Without type information, rules such as `no-floating-promises` and `no-misused-promises` are not available. A forgotten `void` on a rejected promise produces a silent bug with no lint warning.

### Fix

Enable type-aware linting:

```js
tseslint.configs.recommendedTypeChecked
```

Add `parserOptions.project` pointing to the project's `tsconfig.json`.

---

## M-11 — @types/socket.io-client v1 installed for socket.io-client v4

| Field | Detail |
|---|---|
| **File** | `package.json:33` |
| **Severity** | Medium |

### Description

`@types/socket.io-client@1.4.36` contains types for socket.io-client v2. socket.io-client v4 bundles its own TypeScript types and does not use this DefinitelyTyped package. The stale package is never loaded by the TypeScript compiler but its presence is misleading and could cause confusion when troubleshooting type errors.

### Fix

Remove `"@types/socket.io-client"` from `devDependencies` and run `npm install`.
