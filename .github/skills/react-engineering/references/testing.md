# Testing

Source: testing-library.com/docs/react-testing-library, vitest.dev, mswjs.io, playwright.dev.

## Testing philosophy

1. **Test user behavior, not implementation.** Query by role, label, text — not by class name, test ID, or component internals.
2. **Don't test implementation details.** Never assert on state values, hook return values, or internal method calls.
3. **One assertion per behavior.** A test named "submits order" should test the submit flow, not also verify the input renders.
4. **The more a test resembles how the user uses the software, the more confidence it gives.**

## Vitest + React Testing Library setup

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
});
```

```ts
// src/test/setup.ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
```

## Component tests

### Rendering and querying

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrderCard } from "./OrderCard";

test("displays order details", () => {
  const order = { id: "ORD-1", status: "active", total: 99.99 };
  render(<OrderCard order={order} />);

  expect(screen.getByRole("heading", { name: /ORD-1/ })).toBeInTheDocument();
  expect(screen.getByText("$99.99")).toBeInTheDocument();
});
```

### Query priority (from testing-library docs)

Use in this order — earlier = more accessible, more resilient:

1. **`getByRole`** — `getByRole("button", { name: "Submit" })` — matches accessible role and name. Best choice.
2. **`getByLabelText`** — for form inputs associated with a label.
3. **`getByPlaceholderText`** — if no label exists (not ideal, but pragmatic).
4. **`getByText`** — for non-interactive elements with visible text.
5. **`getByDisplayValue`** — for inputs with a current value.
6. **`getByAltText`** — for images.
7. **`getByTitle`** — rarely needed.
8. **`getByTestId`** — **last resort.** If you need this, the component probably has an accessibility problem.

### User interactions

```tsx
test("calls onCancel when cancel button is clicked", async () => {
  const user = userEvent.setup();
  const onCancel = vi.fn();
  const order = { id: "ORD-1", status: "active", total: 99.99 };

  render(<OrderCard order={order} onCancel={onCancel} />);

  await user.click(screen.getByRole("button", { name: /cancel/i }));

  expect(onCancel).toHaveBeenCalledWith("ORD-1");
  expect(onCancel).toHaveBeenCalledTimes(1);
});
```

**Always use `userEvent` over `fireEvent`.** `userEvent` simulates real user behavior (focus, keydown, keyup, click sequence). `fireEvent` dispatches a single synthetic event.

### Form testing

```tsx
test("shows validation error for empty name", async () => {
  const user = userEvent.setup();
  render(<CreateOrderForm onSubmit={vi.fn()} />);

  await user.click(screen.getByRole("button", { name: /create/i }));

  expect(screen.getByRole("alert")).toHaveTextContent(/name is required/i);
});

test("submits form with valid data", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  render(<CreateOrderForm onSubmit={onSubmit} />);

  await user.type(screen.getByLabelText(/customer name/i), "Alice");
  await user.type(screen.getByLabelText(/email/i), "alice@example.com");
  await user.clear(screen.getByLabelText(/items/i));
  await user.type(screen.getByLabelText(/items/i), "5");
  await user.click(screen.getByRole("button", { name: /create/i }));

  expect(onSubmit).toHaveBeenCalledWith({
    customerName: "Alice",
    email: "alice@example.com",
    items: 5,
    notes: "",
  });
});
```

### Async content (loading states, API data)

```tsx
test("shows orders after loading", async () => {
  render(<OrderList />);

  // Initially shows loading
  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  // Wait for data to appear
  const orderItem = await screen.findByText("ORD-1");
  expect(orderItem).toBeInTheDocument();

  // Loading should be gone
  expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
});
```

`findBy*` = `waitFor` + `getBy*`. Use for async content. Default timeout: 1000ms.

## Mocking API calls with MSW

MSW intercepts network requests at the service worker level — your components use real `fetch`, and MSW intercepts them:

```ts
// src/test/mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/orders", () => {
    return HttpResponse.json([
      { id: "ORD-1", status: "active", total: 99.99 },
      { id: "ORD-2", status: "shipped", total: 149.50 },
    ]);
  }),

  http.post("/api/orders", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      { id: "ORD-3", ...body },
      { status: 201 }
    );
  }),

  http.get("/api/orders/:id", ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      status: "active",
      total: 99.99,
    });
  }),
];

// src/test/mocks/server.ts
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);

// src/test/setup.ts
import { server } from "./mocks/server";

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Per-test overrides

```tsx
import { server } from "../test/mocks/server";
import { http, HttpResponse } from "msw";

test("shows error when API fails", async () => {
  // Override for this test only
  server.use(
    http.get("/api/orders", () => {
      return HttpResponse.json(
        { message: "Internal server error" },
        { status: 500 }
      );
    })
  );

  render(<OrderList />);

  const error = await screen.findByRole("alert");
  expect(error).toHaveTextContent(/failed/i);
});
```

## Testing with TanStack Query

Wrap components in a fresh `QueryClient` per test:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false }, // don't retry in tests
    },
  });
}

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

test("displays fetched orders", async () => {
  renderWithQuery(<OrderList />);
  expect(await screen.findByText("ORD-1")).toBeInTheDocument();
});
```

## Custom hook testing

```tsx
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "./useDebounce";

test("returns debounced value after delay", async () => {
  vi.useFakeTimers();

  const { result, rerender } = renderHook(
    ({ value }) => useDebounce(value, 300),
    { initialProps: { value: "hello" } }
  );

  expect(result.current).toBe("hello");

  rerender({ value: "hello world" });
  expect(result.current).toBe("hello"); // not updated yet

  act(() => vi.advanceTimersByTime(300));
  expect(result.current).toBe("hello world"); // now updated

  vi.useRealTimers();
});
```

## E2E with Playwright

```ts
// e2e/orders.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Order management", () => {
  test("creates a new order", async ({ page }) => {
    await page.goto("/orders/new");

    await page.getByLabel("Customer Name").fill("Alice");
    await page.getByLabel("Email").fill("alice@example.com");
    await page.getByRole("button", { name: /create/i }).click();

    // Wait for navigation to order detail
    await expect(page).toHaveURL(/\/orders\/ORD-/);
    await expect(page.getByRole("heading")).toContainText("ORD-");
  });

  test("shows validation errors", async ({ page }) => {
    await page.goto("/orders/new");
    await page.getByRole("button", { name: /create/i }).click();

    await expect(page.getByText(/name is required/i)).toBeVisible();
  });
});
```

## What NOT to test

- **React itself** — don't test that `useState` updates state.
- **Third-party libraries** — don't test that React Hook Form validates.
- **Implementation details** — don't assert on CSS classes, internal state, or hook internals.
- **Snapshot tests** — fragile, noisy, low signal. Test behavior instead.
