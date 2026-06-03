# State Management

Source: react.dev — Managing State, Context, React Router search params. Zustand docs, Redux Toolkit docs.

## State categories — where does each type live?

| Type | Owner | Tool |
|---|---|---|
| **UI state** (modal open, accordion expanded) | The component that toggles it | `useState` |
| **Form state** (input values, validation) | The form component | React Hook Form or `useState` |
| **Shared UI state** (theme, locale, sidebar) | App-wide | Context |
| **Server state** (API data, cached responses) | Server | TanStack Query / SWR |
| **URL state** (filters, pagination, tabs, search) | Browser URL | `useSearchParams` / router |
| **Complex client state** (shopping cart, multi-step wizard, offline-first) | Client, shared | Zustand or Redux Toolkit |

The most common mistake is putting server state in client state managers. API responses belong in TanStack Query — not in Redux, not in Zustand, not in Context.

## Local state (useState)

Default choice. If the state is used by ONE component and doesn't need to survive navigation, use `useState`.

```tsx
function Disclosure({ title, children }: { title: string; children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen}>
        {title}
      </button>
      {isOpen && children}
    </div>
  );
}
```

### Lifting state

When TWO siblings need the same state, lift it to their nearest common parent. Not higher.

```tsx
function ProductPage() {
  const [selectedColor, setSelectedColor] = useState("red");
  return (
    <>
      <ColorPicker value={selectedColor} onChange={setSelectedColor} />
      <ProductImage color={selectedColor} />
    </>
  );
}
```

## Context

For state that is **read by many components at different depths** and **changes infrequently** (theme, locale, auth user, feature flags).

```tsx
import { createContext, useContext, useState, type ReactNode } from "react";

interface AuthContextValue {
  user: User | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (credentials: Credentials) => {
    const user = await authApi.login(credentials);
    setUser(user);
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext value={{ user, login, logout }}>
      {children}
    </AuthContext>
  );
}
```

### Context performance trap

Context re-renders ALL consumers when the value changes. If you put fast-changing state (mouse position, scroll, input text) in context, every consumer re-renders.

**Fix 1: Split contexts** — separate fast-changing from slow-changing.

```tsx
// BAD: one big context
const AppContext = createContext({ theme: "dark", locale: "en", sidebarOpen: false, mouseX: 0 });

// GOOD: separate concerns
const ThemeContext = createContext({ theme: "dark" });
const LayoutContext = createContext({ sidebarOpen: false });
```

**Fix 2: Use Zustand** for state that changes frequently and is consumed by many components.

### When NOT to use Context

- **Server data** — use TanStack Query.
- **Frequently updating state** — context re-renders all consumers.
- **State used by 2 siblings** — lift state to parent.
- **State that should survive browser refresh** — use URL params or localStorage.

## URL state (search params)

Filters, pagination, sort order, selected tab, search query — these belong in the URL. The URL is shareable, bookmarkable, and survives refresh.

### React Router v6+

```tsx
import { useSearchParams } from "react-router-dom";

function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get("page") ?? "1");
  const sort = searchParams.get("sort") ?? "newest";
  const category = searchParams.get("category");

  // Update one param without losing others
  function setPage(newPage: number) {
    setSearchParams((prev) => {
      prev.set("page", String(newPage));
      return prev;
    });
  }

  function setSort(newSort: string) {
    setSearchParams((prev) => {
      prev.set("sort", newSort);
      prev.set("page", "1"); // reset page on sort change
      return prev;
    });
  }

  const { data } = useQuery({
    queryKey: ["products", { page, sort, category }],
    queryFn: () => fetchProducts({ page, sort, category }),
  });

  // ...
}
```

### TanStack Router (type-safe)

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const productSearchSchema = z.object({
  page: z.number().default(1),
  sort: z.enum(["newest", "price-asc", "price-desc"]).default("newest"),
  category: z.string().optional(),
});

export const Route = createFileRoute("/products")({
  validateSearch: productSearchSchema,
});

function ProductList() {
  const { page, sort, category } = Route.useSearch();
  const navigate = Route.useNavigate();

  function setPage(newPage: number) {
    navigate({ search: (prev) => ({ ...prev, page: newPage }) });
  }
}
```

Type-safe search params with Zod validation — impossible to pass an invalid sort value.

## Zustand

For complex client state that is **not server data** and is **shared across components** — shopping cart, multi-step wizard, collaborative editing, offline queue.

```tsx
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  total: () => number;
  clear: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === product.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === product.id
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { productId: product.id, name: product.name, price: product.price, quantity: 1 },
            ],
          };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: quantity === 0
            ? state.items.filter((i) => i.productId !== productId)
            : state.items.map((i) =>
                i.productId === productId ? { ...i, quantity } : i
              ),
        })),

      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      clear: () => set({ items: [] }),
    }),
    { name: "cart-storage" } // localStorage key
  )
);

// Usage — no Provider needed
function CartIcon() {
  const itemCount = useCartStore((state) => state.items.length);
  return <span>Cart ({itemCount})</span>;
}
```

### Why Zustand over Redux Toolkit

| Factor | Zustand | Redux Toolkit |
|---|---|---|
| Boilerplate | Minimal — one `create` call | Slices, store config, Provider |
| Bundle size | ~1 KB | ~11 KB (RTK) |
| Provider required | No | Yes |
| DevTools | Plugin | Built-in |
| Best for | Most apps | Very large teams needing strict conventions |

Use Redux Toolkit when: the team is large (10+), needs strict unidirectional data flow enforcement, or has significant existing Redux investment.

## Decision flowchart

1. Is it server data (comes from an API)? → **TanStack Query**
2. Is it URL-representable (filter, page, tab, search)? → **URL search params**
3. Is it used by ONE component? → **useState**
4. Is it used by 2 siblings? → **Lift state to parent**
5. Is it read-mostly, changes rarely, many consumers (theme, auth)? → **Context**
6. Is it complex, changes often, shared across distant components? → **Zustand**
7. Is the team large (10+) with existing Redux? → **Redux Toolkit**
