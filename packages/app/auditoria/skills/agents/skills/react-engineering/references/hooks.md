# Hooks Deep Dive

Source: react.dev — Rules of Hooks, useState, useEffect, useRef, useMemo, useCallback, custom hooks. React 19: use(), useActionState, useOptimistic.

## Rules of hooks (non-negotiable)

1. **Only call hooks at the top level** — never inside conditions, loops, or nested functions.
2. **Only call hooks from React functions** — function components or custom hooks.

The compiler enforces this in React 19 with the React Compiler (formerly React Forget).

## useState

```tsx
const [count, setCount] = useState(0);

// Functional update — when new state depends on previous state
setCount((prev) => prev + 1);

// Object state — always spread
const [form, setForm] = useState({ name: "", email: "" });
setForm((prev) => ({ ...prev, name: "Alice" }));
```

### When NOT to use useState

| Situation | Instead |
|---|---|
| Derived value (`fullName = first + last`) | Compute during render |
| Storing a DOM reference | `useRef` |
| Value that doesn't affect rendering (timer ID) | `useRef` |
| Shared across distant components | Context or state library |
| URL state (filters, pagination, tab) | URL search params |
| Server data (API responses) | TanStack Query / SWR |

### Lazy initialization

```tsx
// BAD: runs expensive function on EVERY render
const [data, setData] = useState(parseExpensiveData(raw));

// GOOD: runs only on mount
const [data, setData] = useState(() => parseExpensiveData(raw));
```

Pass a function (initializer) when the initial value is expensive to compute.

## useEffect

Effects are for **synchronizing with external systems** — NOT for derived state, NOT for data fetching (use a library), NOT for event handling.

```tsx
useEffect(() => {
  // Setup: connect to external system
  const connection = createConnection(roomId);
  connection.connect();

  // Cleanup: disconnect when roomId changes or component unmounts
  return () => connection.disconnect();
}, [roomId]); // Dependency array: re-run when roomId changes
```

### Dependency array rules

| Array | Behavior |
|---|---|
| `[a, b]` | Runs on mount + when `a` or `b` changes |
| `[]` | Runs on mount only |
| Omitted | Runs on EVERY render (almost never correct) |

### Common useEffect mistakes

**1. Syncing derived state**

```tsx
// BAD — derived state in effect
const [firstName, setFirstName] = useState("Alice");
const [fullName, setFullName] = useState("Alice Smith");

useEffect(() => {
  setFullName(firstName + " Smith");
}, [firstName]);

// GOOD — compute during render
const fullName = firstName + " Smith";
```

**2. Fetching data without cleanup**

```tsx
// BAD — race condition, no cancellation
useEffect(() => {
  fetch(`/api/user/${id}`)
    .then((r) => r.json())
    .then(setUser);
}, [id]);

// LESS BAD — with abort controller (but still missing caching, dedup, etc.)
useEffect(() => {
  const controller = new AbortController();
  fetch(`/api/user/${id}`, { signal: controller.signal })
    .then((r) => r.json())
    .then(setUser)
    .catch((e) => {
      if (e.name !== "AbortError") throw e;
    });
  return () => controller.abort();
}, [id]);

// GOOD — use TanStack Query
const { data: user } = useQuery({
  queryKey: ["user", id],
  queryFn: () => fetchUser(id),
});
```

**3. Missing cleanup for subscriptions**

```tsx
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler); // ← required
}, [onClose]);
```

**4. Running on every render**

```tsx
// BAD — object dependency recreated every render → infinite loop
useEffect(() => {
  fetchData(options);
}, [options]); // ← if options is { page: 1 }, new object every render

// GOOD — depend on primitives
useEffect(() => {
  fetchData({ page, sort });
}, [page, sort]);
```

## useRef

Two distinct uses:

### 1. DOM references

```tsx
function SearchInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleClick() {
    inputRef.current?.focus();
  }

  return (
    <>
      <input ref={inputRef} />
      <button onClick={handleClick}>Focus</button>
    </>
  );
}
```

### 2. Mutable values that don't trigger re-render

```tsx
function Timer() {
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  function start() {
    intervalRef.current = setInterval(() => console.log("tick"), 1000);
  }

  function stop() {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  useEffect(() => {
    return () => stop(); // cleanup
  }, []);

  return <>{/* ... */}</>;
}
```

Use `useRef` for: timer IDs, previous values, any mutable value that shouldn't trigger a re-render when changed.

## useMemo and useCallback

**`useMemo`** — memoize a computed value. **`useCallback`** — memoize a function.

```tsx
// useMemo: expensive computation
const sortedItems = useMemo(
  () => items.toSorted((a, b) => a.price - b.price),
  [items]
);

// useCallback: stable function reference for child components
const handleDelete = useCallback(
  (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  },
  [] // no dependencies — setItems is stable
);
```

### When to use (and when NOT to)

| Use when | Don't use when |
|---|---|
| Computation is genuinely expensive (sort 10k items) | Simple operations (string concat, basic math) |
| Reference equality matters (dependency of useEffect, memo'd child) | The component renders rarely |
| Passing callback to a `React.memo`'d child | The child isn't memoized |
| Profiler shows the component is slow | You haven't profiled |

**React 19 + React Compiler:** The compiler auto-memoizes values and functions. In new React 19 projects with the compiler enabled, manual `useMemo`/`useCallback` is largely unnecessary. The compiler does it better because it can memoize at a finer granularity.

## React 19: use()

The `use` API reads resources (Promises, Context) during render:

```tsx
import { use } from "react";

// Reading context (replaces useContext)
function Theme() {
  const theme = use(ThemeContext);
  return <div className={theme} />;
}

// Reading a promise (with Suspense)
function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise); // suspends until resolved
  return <h1>{user.name}</h1>;
}

// Wrapped in Suspense
<Suspense fallback={<Skeleton />}>
  <UserProfile userPromise={fetchUser(id)} />
</Suspense>
```

Unlike hooks, `use` CAN be called inside conditions and loops.

## React 19: useActionState

For form actions with pending state:

```tsx
import { useActionState } from "react";

async function submitForm(prevState: FormState, formData: FormData): Promise<FormState> {
  const name = formData.get("name") as string;
  if (!name) return { error: "Name is required" };
  await saveUser(name);
  return { success: true };
}

function SignupForm() {
  const [state, action, isPending] = useActionState(submitForm, { error: null });

  return (
    <form action={action}>
      <input name="name" />
      {state.error && <p role="alert">{state.error}</p>}
      <button disabled={isPending}>
        {isPending ? "Saving..." : "Submit"}
      </button>
    </form>
  );
}
```

Replaces the manual `useState` + `handleSubmit` + `setLoading` + `try/catch` pattern.

## Custom hooks

Extract logic into a custom hook when:
- Logic is used by 2+ components.
- A single component's logic is complex enough to test independently.
- You want to name a behavior (e.g., `useDebounce`, `useLocalStorage`).

```tsx
function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

// Usage
function SearchPage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const { data } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () => searchApi(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  });
}
```

### Custom hook rules

1. Name starts with `use`.
2. Can call other hooks.
3. Should do ONE thing (single responsibility).
4. Return the minimal interface needed — an object for 3+ values, a tuple for 2 values, a single value for 1.
5. Always clean up subscriptions, timers, and event listeners.
