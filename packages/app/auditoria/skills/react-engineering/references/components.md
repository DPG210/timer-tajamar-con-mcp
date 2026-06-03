# Component Patterns

Source: react.dev — Thinking in React, Composing Components, Render Props, React 19 ref as prop.

## Function component anatomy

```tsx
interface OrderCardProps {
  order: Order;
  onCancel?: (orderId: string) => void;
}

export function OrderCard({ order, onCancel }: OrderCardProps) {
  const formattedTotal = formatCurrency(order.total, order.currency);

  return (
    <article className="order-card">
      <h3>Order #{order.id}</h3>
      <p>{formattedTotal}</p>
      {onCancel && (
        <button onClick={() => onCancel(order.id)}>Cancel</button>
      )}
    </article>
  );
}
```

Rules:
1. **Named exports** (not default) — enables grep, refactor tools, and tree-shaking clarity.
2. **Props as interface** — `interface` for public API, `type` for unions/intersections.
3. **Destructure props in parameter** — avoids `props.x` noise.
4. **Derive during render** — `formattedTotal` is computed, not stored in state.
5. **Semantic HTML** — `<article>`, `<button>`, not `<div onClick>`.

## Composition with children

The primary extension mechanism. Avoids mega-components with dozens of props.

```tsx
// BAD: mega-component
<Card
  title="Settings"
  subtitle="Account preferences"
  icon={<SettingsIcon />}
  footer={<SaveButton />}
  headerAction={<CloseButton />}
  variant="elevated"
  padding="lg"
/>

// GOOD: composition
<Card variant="elevated" padding="lg">
  <Card.Header>
    <SettingsIcon />
    <div>
      <h2>Settings</h2>
      <p>Account preferences</p>
    </div>
    <CloseButton />
  </Card.Header>
  <Card.Body>
    {/* content */}
  </Card.Body>
  <Card.Footer>
    <SaveButton />
  </Card.Footer>
</Card>
```

Why composition wins: the consumer controls layout, order, and what goes where. The mega-component forces the author to predict every layout variation upfront.

## Compound components

Pattern for components that share implicit state — tabs, accordions, selects, disclosure groups.

```tsx
import { createContext, useContext, useState, type ReactNode } from "react";

// Shared context
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tab components must be used within <Tabs>");
  return ctx;
}

// Root
interface TabsProps {
  defaultTab: string;
  children: ReactNode;
}

export function Tabs({ defaultTab, children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return (
    <TabsContext value={{ activeTab, setActiveTab }}>
      <div role="tablist">{children}</div>
    </TabsContext>
  );
}

// Sub-components
interface TabProps {
  id: string;
  children: ReactNode;
}

function Tab({ id, children }: TabProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  return (
    <button
      role="tab"
      aria-selected={activeTab === id}
      onClick={() => setActiveTab(id)}
    >
      {children}
    </button>
  );
}

function Panel({ id, children }: TabProps) {
  const { activeTab } = useTabsContext();
  if (activeTab !== id) return null;
  return (
    <div role="tabpanel" aria-labelledby={id}>
      {children}
    </div>
  );
}

// Attach sub-components
Tabs.Tab = Tab;
Tabs.Panel = Panel;
```

Usage:
```tsx
<Tabs defaultTab="general">
  <Tabs.Tab id="general">General</Tabs.Tab>
  <Tabs.Tab id="security">Security</Tabs.Tab>
  <Tabs.Panel id="general"><GeneralSettings /></Tabs.Panel>
  <Tabs.Panel id="security"><SecuritySettings /></Tabs.Panel>
</Tabs>
```

When to use: multiple components that must share state but the consumer controls composition (tabs, accordion, dropdown menu, combobox).

## Render props (slot pattern)

When a parent needs to pass data DOWN to a child whose rendering it doesn't control:

```tsx
interface DataListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  renderEmpty?: () => ReactNode;
}

export function DataList<T>({ items, renderItem, renderEmpty }: DataListProps<T>) {
  if (items.length === 0) {
    return renderEmpty?.() ?? <p>No items found.</p>;
  }
  return <ul>{items.map((item, i) => <li key={i}>{renderItem(item, i)}</li>)}</ul>;
}

// Usage
<DataList
  items={orders}
  renderItem={(order) => <OrderCard order={order} />}
  renderEmpty={() => <EmptyState message="No orders yet" />}
/>
```

When to use: generic containers (lists, tables, virtualized lists) that render caller-provided content with data the container owns (index, scroll position, selection state).

When NOT to use: if `children` suffices. Render props add complexity — only use when the parent needs to pass data to the render function.

## React 19: ref as a prop

React 19 removed `forwardRef`. Refs are now regular props:

```tsx
// React 19 — ref is a prop
interface InputProps {
  label: string;
  ref?: React.Ref<HTMLInputElement>;
}

export function Input({ label, ref }: InputProps) {
  return (
    <label>
      {label}
      <input ref={ref} />
    </label>
  );
}

// React 18 — forwardRef (legacy)
// const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => { ... });
```

This is a breaking change from React 18. If the codebase uses `forwardRef`, migrate when touching the file.

## Component organization

```
src/
  components/          # Shared/reusable components
    ui/                # Design system primitives (Button, Input, Card)
    layout/            # Layout components (Sidebar, PageHeader)
  features/            # Feature modules
    orders/
      components/      # Components specific to orders
      hooks/           # Hooks specific to orders
      api.ts           # API calls for orders
      types.ts         # Types for orders
      index.ts         # Public API barrel
  hooks/               # Shared custom hooks
  lib/                 # Utilities, helpers, constants
```

Rules:
1. **Co-locate by feature** — components, hooks, types, and API calls for a feature live together.
2. **Shared components in `components/`** — only when used by 2+ features.
3. **Barrel exports** — each feature has an `index.ts` that exports only the public API.
4. **One component per file** — exception: small helper components used only by the parent.

## Conditional rendering patterns

```tsx
// Boolean — short-circuit
{isAdmin && <AdminPanel />}

// Ternary — two branches
{isLoading ? <Skeleton /> : <Content data={data} />}

// Complex — extract to variable or early return
function OrderStatus({ order }: { order: Order }) {
  if (order.status === "cancelled") {
    return <CancelledBanner reason={order.cancellationReason} />;
  }
  if (order.status === "shipped") {
    return <ShippingTracker trackingId={order.trackingId!} />;
  }
  return <OrderProgress steps={order.steps} />;
}
```

**Gotcha with `&&`:** `{count && <List />}` renders `0` when count is 0. Fix: `{count > 0 && <List />}`.

## Lists and keys

```tsx
// GOOD: stable, unique ID
{orders.map((order) => (
  <OrderCard key={order.id} order={order} />
))}

// BAD: array index as key for dynamic lists
{orders.map((order, index) => (
  <OrderCard key={index} order={order} />  // ← breaks on reorder, insert, delete
))}
```

Index as key is only safe for **static lists that never reorder**. For any list with add/remove/sort/filter, use a stable unique identifier.
