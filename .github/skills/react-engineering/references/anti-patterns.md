# Anti-patterns and Code Smells

Patterns to flag during code review. Symptom, why it's a problem, and the fix — specific to React.

## Hooks anti-patterns

### useEffect for derived state

**Symptom:** State that is computed from other state, synced via useEffect.

```tsx
// BAD
const [firstName, setFirstName] = useState("Alice");
const [lastName, setLastName] = useState("Smith");
const [fullName, setFullName] = useState("");

useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);

// GOOD — compute during render
const fullName = `${firstName} ${lastName}`;
```

**Why:** Extra re-render on every change (first render with stale value, then effect fires and triggers second render). Unnecessary state, unnecessary effect, unnecessary complexity.

### useEffect for data fetching without a library

**Symptom:** `useEffect` + `fetch` + `useState` for loading/error/data.

**Why:** Missing caching, deduplication, background refetching, race conditions, cancellation, retry, pagination. Every component reinvents these badly.

**Fix:** TanStack Query, SWR, or Server Components.

### useEffect for event handling

**Symptom:** Effect that sets up a state change in response to a prop change that should be handled inline.

```tsx
// BAD
useEffect(() => {
  if (selectedItem) {
    logAnalytics("item_selected", selectedItem.id);
  }
}, [selectedItem]);

// GOOD — handle in the event handler that sets selectedItem
function handleSelect(item: Item) {
  setSelectedItem(item);
  logAnalytics("item_selected", item.id);
}
```

### Missing cleanup

**Symptom:** Effects that subscribe to events, start timers, or open connections without returning a cleanup function.

```tsx
// BAD — memory leak
useEffect(() => {
  window.addEventListener("resize", handleResize);
}, []);

// GOOD
useEffect(() => {
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);
```

### Object/array dependencies causing infinite loops

**Symptom:** Effect runs on every render because a dependency is a new object/array reference.

```tsx
// BAD — options is new object every render → infinite loop
const options = { page, sort };
useEffect(() => { fetchData(options); }, [options]);

// GOOD — depend on primitives
useEffect(() => { fetchData({ page, sort }); }, [page, sort]);
```

## Component anti-patterns

### `<div onClick>` instead of `<button>`

**Symptom:** Click handlers on non-interactive elements.

**Why:** Not focusable, not keyboard-accessible, no button role for screen readers, no disabled state. Requires manual `tabIndex`, `role="button"`, `onKeyDown` for Enter/Space.

**Fix:** Use `<button>`. Always. If it looks like a link but doesn't navigate, it's a button. If it navigates, it's `<a>` or a router `<Link>`.

### Prop drilling past 3 levels

**Symptom:** Props passed through 4+ components that don't use them.

```tsx
// BAD
<App user={user}>
  <Layout user={user}>
    <Sidebar user={user}>
      <UserMenu user={user} />  // only UserMenu uses it
    </Sidebar>
  </Layout>
</App>
```

**Fix:** Composition (move `UserMenu` to App level via `children`), Context, or a state library.

### Index as key for dynamic lists

**Symptom:** `key={index}` on lists that can be reordered, filtered, or modified.

**Why:** React uses keys to match elements across renders. With index keys, inserting an item at position 0 causes React to re-render every item because all keys shifted. State attached to components (input values, focus) gets attached to the wrong item.

**Fix:** Use a stable, unique identifier from the data (`key={item.id}`).

### Giant components (200+ lines)

**Symptom:** A single component file with multiple concerns, multiple states, multiple effects.

**Fix:** Extract custom hooks for logic, extract sub-components for UI sections. A component should do one thing.

### Conditional hooks

**Symptom:** Hooks called inside conditions or loops.

```tsx
// BAD — violates rules of hooks
if (isLoggedIn) {
  const [name, setName] = useState("");
}

// GOOD — always call, use the value conditionally
const [name, setName] = useState("");
if (isLoggedIn) {
  // use name
}
```

## State anti-patterns

### Server state in client state managers

**Symptom:** Redux/Zustand store full of API response data, manual cache invalidation, loading/error booleans per entity.

**Why:** Reinventing what TanStack Query does — caching, deduplication, background refetch, stale-while-revalidate, cache invalidation, optimistic updates, pagination.

**Fix:** Move API data to TanStack Query. Keep Redux/Zustand for genuinely client-only state (cart, wizard, UI preferences).

### URL state in React state

**Symptom:** Filters, pagination, sort order, selected tab stored in `useState` instead of URL search params.

**Why:** Not shareable, not bookmarkable, lost on refresh, breaks browser back/forward.

**Fix:** `useSearchParams` (React Router) or `Route.useSearch` (TanStack Router).

### Premature global state

**Symptom:** Theme, modals, and every piece of shared state in a global store before it's needed by distant components.

**Fix:** Start with local state. Lift when needed. Use context for app-wide read-heavy state. Only reach for Zustand/Redux when the pattern of state sharing is clearly cross-cutting.

## TypeScript anti-patterns

### `any` as escape hatch

**Symptom:** `(data as any).user.name`, `props: any`, event handlers with `any`.

**Fix:** Use `unknown` and narrow with type guards, or define the actual type. For event handlers: `React.MouseEvent<HTMLButtonElement>`.

### `FC` / `FunctionComponent` type

**Symptom:** `const MyComponent: React.FC<Props> = (props) => { ... }`

**Why:** `FC` implicitly accepts `children` (confusing), adds complexity for no benefit, makes generic components harder.

**Fix:** Type the props directly: `function MyComponent(props: Props) { ... }` or destructure `({ name, value }: Props)`.

## Performance anti-patterns

### Premature memoization

**Symptom:** `useMemo` and `useCallback` on everything, without profiling.

**Why:** Each adds complexity, a dependency array to maintain, and a small overhead for the memoization check itself. In most cases, React's reconciliation is already fast enough.

**Fix:** Profile first with React DevTools. Memoize only the components/values that the profiler identifies as bottlenecks.

### Rendering 1000+ items without virtualization

**Symptom:** `.map()` over a large array rendering all items to the DOM.

**Fix:** `@tanstack/react-virtual` for virtual scrolling. Render only what's in the viewport.

## Legacy patterns to migrate

### Class components

**Symptom:** `class MyComponent extends React.Component<Props, State>`.

**Fix:** Convert to function component with hooks. Every lifecycle method has a hooks equivalent:
- `componentDidMount` → `useEffect(() => {}, [])`
- `componentDidUpdate` → `useEffect(() => {}, [deps])`
- `componentWillUnmount` → `useEffect(() => { return () => cleanup; }, [])`
- `shouldComponentUpdate` → `React.memo`

### `forwardRef` (React 18)

**Symptom:** `const Input = forwardRef<HTMLInputElement, Props>((props, ref) => { ... })`

**Fix:** In React 19, `ref` is a regular prop. Remove `forwardRef` and accept `ref` in the props interface.

### HOCs (Higher-Order Components)

**Symptom:** `export default withAuth(withTheme(withRouter(MyComponent)))`.

**Why:** Wrapper hell, props origin unclear, type inference breaks, testing is harder.

**Fix:** Custom hooks. `useAuth()`, `useTheme()`, router hooks. Clearer, composable, type-safe.
