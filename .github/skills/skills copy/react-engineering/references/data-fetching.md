# Data Fetching

Source: tanstack.com/query, swr.vercel.app, react.dev — Server Components.

## Why not useEffect + fetch

Raw `useEffect` + `fetch` misses:

| Feature | useEffect+fetch | TanStack Query |
|---|---|---|
| Caching | Manual | Automatic (staleTime, gcTime) |
| Deduplication | None — 3 components = 3 requests | Automatic — same queryKey = 1 request |
| Background refetching | Manual | Automatic (window focus, interval) |
| Race conditions | Must handle AbortController | Handled internally |
| Loading/error states | Manual booleans | `isLoading`, `isError`, `error` |
| Optimistic updates | Manual rollback | `onMutate` with rollback |
| Pagination | Manual | `useInfiniteQuery`, `keepPreviousData` |
| Retry | None | 3 retries with exponential backoff |
| DevTools | None | TanStack Query DevTools |

## TanStack Query setup

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,       // Data fresh for 1 min — no refetch
      gcTime: 5 * 60_000,      // Cache kept for 5 min after unmount
      retry: 3,                 // Retry failed requests 3 times
      refetchOnWindowFocus: true,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

## Queries

### Basic query

```tsx
import { useQuery } from "@tanstack/react-query";

interface Order {
  id: string;
  status: string;
  total: number;
}

async function fetchOrders(): Promise<Order[]> {
  const res = await fetch("/api/orders");
  if (!res.ok) throw new Error(`Failed to fetch orders: ${res.status}`);
  return res.json();
}

function OrderList() {
  const { data: orders, isLoading, isError, error } = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
  });

  if (isLoading) return <OrderListSkeleton />;
  if (isError) return <ErrorBanner message={error.message} />;
  if (orders.length === 0) return <EmptyState message="No orders yet" />;

  return (
    <ul>
      {orders.map((order) => (
        <li key={order.id}>{order.id} — {order.status}</li>
      ))}
    </ul>
  );
}
```

### Query with parameters

```tsx
function useOrder(orderId: string) {
  return useQuery({
    queryKey: ["orders", orderId],   // cache key includes the ID
    queryFn: () => fetchOrder(orderId),
    enabled: !!orderId,              // don't fetch if ID is empty
  });
}
```

### Query key structure

```tsx
// Entity list
["orders"]
["orders", { status: "active", page: 2 }]

// Entity detail
["orders", orderId]

// Related sub-resource
["orders", orderId, "items"]

// Invalidation matches prefixes:
queryClient.invalidateQueries({ queryKey: ["orders"] });
// ↑ invalidates ALL of the above
```

### Dependent queries

```tsx
function useOrderWithCustomer(orderId: string) {
  const orderQuery = useQuery({
    queryKey: ["orders", orderId],
    queryFn: () => fetchOrder(orderId),
  });

  const customerQuery = useQuery({
    queryKey: ["customers", orderQuery.data?.customerId],
    queryFn: () => fetchCustomer(orderQuery.data!.customerId),
    enabled: !!orderQuery.data?.customerId, // wait for order
  });

  return { order: orderQuery, customer: customerQuery };
}
```

## Mutations

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";

function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newOrder: CreateOrderRequest) =>
      fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrder),
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to create order");
        return res.json() as Promise<Order>;
      }),

    onSuccess: () => {
      // Invalidate the orders list so it refetches
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

// Usage
function CreateOrderButton() {
  const createOrder = useCreateOrder();

  return (
    <button
      onClick={() => createOrder.mutate({ customerId: "123", items: [] })}
      disabled={createOrder.isPending}
    >
      {createOrder.isPending ? "Creating..." : "Create Order"}
    </button>
  );
}
```

### Optimistic updates

```tsx
useMutation({
  mutationFn: updateOrderStatus,

  onMutate: async (variables) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ["orders", variables.orderId] });

    // Snapshot previous value
    const previous = queryClient.getQueryData<Order>(["orders", variables.orderId]);

    // Optimistically update
    queryClient.setQueryData<Order>(["orders", variables.orderId], (old) =>
      old ? { ...old, status: variables.newStatus } : old
    );

    return { previous };
  },

  onError: (_err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(["orders", variables.orderId], context?.previous);
  },

  onSettled: (_data, _error, variables) => {
    // Always refetch to ensure server state
    queryClient.invalidateQueries({ queryKey: ["orders", variables.orderId] });
  },
});
```

## Pagination

### Offset pagination

```tsx
function useOrders(page: number) {
  return useQuery({
    queryKey: ["orders", { page }],
    queryFn: () => fetchOrders({ page, limit: 20 }),
    placeholderData: keepPreviousData, // keep showing old data while new page loads
  });
}
```

### Infinite scroll

```tsx
import { useInfiniteQuery } from "@tanstack/react-query";

function useOrdersInfinite() {
  return useInfiniteQuery({
    queryKey: ["orders"],
    queryFn: ({ pageParam }) => fetchOrders({ cursor: pageParam, limit: 20 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

function OrderFeed() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useOrdersInfinite();

  const allOrders = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <>
      {allOrders.map((order) => <OrderCard key={order.id} order={order} />)}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? "Loading..." : "Load more"}
        </button>
      )}
    </>
  );
}
```

## API layer organization

Keep fetch functions in a separate file per domain — not inline in components:

```tsx
// src/features/orders/api.ts
const BASE = "/api/orders";

export async function fetchOrders(params: OrderQueryParams): Promise<PaginatedResponse<Order>> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.status) searchParams.set("status", params.status);

  const res = await fetch(`${BASE}?${searchParams}`);
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json();
}

export async function fetchOrder(id: string): Promise<Order> {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json();
}

export async function createOrder(data: CreateOrderRequest): Promise<Order> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json();
}
```

Benefits: testable without React, reusable across hooks, single place to add auth headers or base URL.

## Server Components (Next.js App Router)

In Server Components, data fetching is synchronous at the component level — no hooks, no loading states in the component itself:

```tsx
// app/orders/page.tsx — Server Component (default)
async function OrdersPage() {
  const orders = await fetchOrders(); // direct async/await

  return (
    <Suspense fallback={<OrderListSkeleton />}>
      <OrderList orders={orders} />
    </Suspense>
  );
}
```

Rules for Server Components:
1. Cannot use hooks (`useState`, `useEffect`, etc.).
2. Cannot use browser APIs (`window`, `document`, `localStorage`).
3. Can directly access databases, file systems, environment variables.
4. Data fetched here is never sent to the client bundle.
5. Add `"use client"` directive only to components that need interactivity.
