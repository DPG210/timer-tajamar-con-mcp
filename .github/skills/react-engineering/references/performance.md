# Performance

Source: react.dev — Optimizing Performance, React Profiler, React.lazy, Suspense.

## Mental model: React renders are cheap until they're not

React's reconciliation is fast. A component re-rendering does NOT mean the DOM updates — React diffs the virtual DOM and only patches what changed. The problem is when:

1. A component renders **thousands of elements** (large lists without virtualization).
2. A component does **expensive computation during render** (sorting 10K items).
3. A parent re-renders and causes **unnecessary child re-renders** with expensive subtrees.
4. The bundle is **too large** (everything loaded upfront, no code splitting).

**Measure first.** React DevTools Profiler shows exactly which components render, how often, and how long each render takes. Don't optimize without data.

## React DevTools Profiler

```
React DevTools → Profiler tab → Record → Interact → Stop
```

What to look for:
- **Components rendering on every interaction** when they shouldn't (grey = didn't render = good).
- **Long render times** (>16ms = dropped frame at 60fps).
- **Cascade re-renders** — one state change triggers renders across the entire tree.

## React.memo

Prevents a component from re-rendering when its props haven't changed (shallow comparison).

```tsx
interface OrderCardProps {
  order: Order;
  onSelect: (id: string) => void;
}

// Without memo: re-renders every time parent renders
// With memo: only re-renders when order or onSelect changes
const OrderCard = memo(function OrderCard({ order, onSelect }: OrderCardProps) {
  return (
    <div onClick={() => onSelect(order.id)}>
      <h3>{order.id}</h3>
      <p>{order.status}</p>
    </div>
  );
});
```

### When to use memo

| Use | Don't use |
|---|---|
| Component renders often with same props | Component renders rarely |
| Component's render is expensive (complex DOM, calculations) | Component's render is trivial |
| Profiler shows it as a bottleneck | You haven't profiled |
| List items rendered in a large list | The parent passes new objects/functions every render (fix the parent first) |

### Common memo-breaking mistake

```tsx
// BAD: memo is useless — new object/function on every parent render
function Parent() {
  return (
    <MemoizedChild
      style={{ color: "red" }}           // ← new object every render
      onClick={() => handleClick()}       // ← new function every render
    />
  );
}

// GOOD: stable references
function Parent() {
  const style = useMemo(() => ({ color: "red" }), []);
  const onClick = useCallback(() => handleClick(), []);
  return <MemoizedChild style={style} onClick={onClick} />;
}
```

**React 19 + React Compiler:** The compiler auto-memoizes, making manual `memo`/`useMemo`/`useCallback` unnecessary in most cases. If the project uses the React Compiler, remove manual memoization — it adds noise without benefit.

## Code splitting with lazy + Suspense

Split the bundle so users only download what they need:

```tsx
import { lazy, Suspense } from "react";

// Lazy load heavy components
const AdminDashboard = lazy(() => import("./features/admin/AdminDashboard"));
const AnalyticsChart = lazy(() => import("./features/analytics/AnalyticsChart"));

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/admin"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <AdminDashboard />
          </Suspense>
        }
      />
      <Route
        path="/analytics"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <AnalyticsChart />
          </Suspense>
        }
      />
    </Routes>
  );
}
```

### Where to split

1. **Route level** — each page is a separate chunk (biggest win).
2. **Heavy libraries** — chart libraries, rich text editors, PDF viewers.
3. **Below the fold** — components not visible on initial viewport.
4. **Conditional UI** — admin panels, modals with complex content.

### Named chunks for debugging

```tsx
const AdminDashboard = lazy(() =>
  import(/* webpackChunkName: "admin" */ "./features/admin/AdminDashboard")
);
```

## List virtualization

For lists with 1000+ items, render only what's visible in the viewport:

```tsx
import { useVirtualizer } from "@tanstack/react-virtual";

function VirtualizedOrderList({ orders }: { orders: Order[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: orders.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72, // estimated row height in px
    overscan: 5,            // render 5 extra items above/below viewport
  });

  return (
    <div ref={parentRef} style={{ height: "600px", overflow: "auto" }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: "absolute",
              top: 0,
              transform: `translateY(${virtualRow.start}px)`,
              width: "100%",
            }}
          >
            <OrderCard order={orders[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

Use when: 500+ items in a scrollable list. Don't use for short lists — the complexity isn't worth it.

## Expensive computation

```tsx
// BAD: sorts on every render, even when items haven't changed
function OrderList({ orders }: { orders: Order[] }) {
  const sorted = orders.toSorted((a, b) => b.total - a.total); // ← runs every render
  return <>{sorted.map(...)}</>;
}

// GOOD: memoized
function OrderList({ orders }: { orders: Order[] }) {
  const sorted = useMemo(
    () => orders.toSorted((a, b) => b.total - a.total),
    [orders]
  );
  return <>{sorted.map(...)}</>;
}
```

## Transition API (React 18+)

Mark state updates as non-urgent so they don't block user input:

```tsx
import { useTransition } from "react";

function FilterableList({ items }: { items: Item[] }) {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase())
  );

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    // Input update is urgent — renders immediately
    setQuery(e.target.value);

    // List filtering is non-urgent — can be interrupted
    startTransition(() => {
      // If using a separate state for the displayed list:
      setDisplayedQuery(e.target.value);
    });
  }

  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending && <Spinner />}
      <ItemList items={filteredItems} />
    </>
  );
}
```

Use when: typing in a search box that filters a large list, navigating between tabs with heavy content.

## Bundle analysis

```bash
# Vite
npx vite-bundle-visualizer

# webpack
npx webpack-bundle-analyzer stats.json
```

What to look for:
- Large dependencies that could be lazy-loaded (moment.js → date-fns, lodash → lodash-es with tree shaking).
- Duplicate dependencies (two versions of the same library).
- Code that's in the main chunk but only used on one route.

## Performance checklist

1. Profile with React DevTools before optimizing.
2. Code-split at route boundaries (`lazy` + `Suspense`).
3. Virtualize lists with 500+ items (`@tanstack/react-virtual`).
4. `useMemo` for expensive computations (only after profiling).
5. `React.memo` for frequently re-rendered components with stable props.
6. Use `useTransition` for non-urgent updates (search filtering, tab switching).
7. Check bundle size with a visualizer — no single chunk >200KB gzipped.
8. Images: use `<img loading="lazy">` for below-the-fold images.
