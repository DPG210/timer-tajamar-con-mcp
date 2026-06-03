# Forms

Source: react-hook-form.com, react.dev — Forms, React 19 form actions.

## Controlled vs uncontrolled

| Approach | How | When |
|---|---|---|
| **Controlled** | `value` + `onChange` on every input, state in React | Simple forms (1-3 fields), need real-time validation or derived values |
| **Uncontrolled** | `ref` or `FormData`, state in the DOM | Performance-critical forms (50+ fields), file uploads |
| **React Hook Form** | Uncontrolled under the hood, controlled API | Any form with validation, errors, complex fields |

For most forms, **React Hook Form** is the right choice — it avoids re-renders on every keystroke while providing a controlled-feeling API.

## React Hook Form

### Basic form

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const createOrderSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  email: z.string().email("Invalid email address"),
  items: z.number().int().min(1, "At least 1 item required").max(100),
  notes: z.string().optional(),
});

type CreateOrderForm = z.infer<typeof createOrderSchema>;

function CreateOrderForm({ onSubmit }: { onSubmit: (data: CreateOrderForm) => Promise<void> }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateOrderForm>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: { customerName: "", email: "", items: 1, notes: "" },
  });

  const submit = async (data: CreateOrderForm) => {
    await onSubmit(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <div>
        <label htmlFor="customerName">Customer Name</label>
        <input id="customerName" {...register("customerName")} aria-invalid={!!errors.customerName} />
        {errors.customerName && (
          <p role="alert" id="customerName-error">{errors.customerName.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" {...register("email")} aria-invalid={!!errors.email} />
        {errors.email && <p role="alert">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="items">Number of Items</label>
        <input id="items" type="number" {...register("items", { valueAsNumber: true })} />
        {errors.items && <p role="alert">{errors.items.message}</p>}
      </div>

      <div>
        <label htmlFor="notes">Notes (optional)</label>
        <textarea id="notes" {...register("notes")} />
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Order"}
      </button>
    </form>
  );
}
```

### Why Zod + zodResolver

- Single schema for validation AND TypeScript type (`z.infer`).
- Validation rules live outside the component — testable, reusable, shareable with backend.
- No more duplicating validation between `register` options and TypeScript types.

### Dynamic fields (useFieldArray)

```tsx
import { useFieldArray, useForm } from "react-hook-form";

interface OrderFormData {
  items: { productId: string; quantity: number }[];
}

function OrderItemsForm() {
  const { control, register, handleSubmit } = useForm<OrderFormData>({
    defaultValues: { items: [{ productId: "", quantity: 1 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {fields.map((field, index) => (
        <div key={field.id}> {/* field.id, NOT index */}
          <input {...register(`items.${index}.productId`)} />
          <input type="number" {...register(`items.${index}.quantity`, { valueAsNumber: true })} />
          <button type="button" onClick={() => remove(index)}>Remove</button>
        </div>
      ))}
      <button type="button" onClick={() => append({ productId: "", quantity: 1 })}>
        Add Item
      </button>
      <button type="submit">Submit</button>
    </form>
  );
}
```

Critical: use `field.id` as the `key`, not the array index. `useFieldArray` generates stable IDs.

### Watching values

```tsx
const { watch, control } = useForm<OrderForm>();

// Watch one field (re-renders on change)
const quantity = watch("quantity");
const total = quantity * unitPrice;

// For performance: useWatch with control (isolates re-renders)
import { useWatch } from "react-hook-form";

function TotalDisplay({ control }: { control: Control<OrderForm> }) {
  const quantity = useWatch({ control, name: "quantity" });
  return <span>Total: {quantity * unitPrice}</span>;
}
```

### Server errors

```tsx
const { setError } = useForm<LoginForm>();

const onSubmit = async (data: LoginForm) => {
  try {
    await login(data);
  } catch (err) {
    if (err instanceof ApiError && err.status === 422) {
      // Set field-level errors from server response
      for (const [field, message] of Object.entries(err.errors)) {
        setError(field as keyof LoginForm, { message });
      }
    } else {
      // Set root-level error for non-field errors
      setError("root", { message: "Login failed. Please try again." });
    }
  }
};

// Display root error
{errors.root && <p role="alert">{errors.root.message}</p>}
```

## React 19 form actions

React 19 introduces `<form action={fn}>` for progressive enhancement:

```tsx
import { useActionState } from "react";

interface FormState {
  error?: string;
  success?: boolean;
}

async function createOrder(prev: FormState, formData: FormData): Promise<FormState> {
  const name = formData.get("name") as string;
  if (!name) return { error: "Name is required" };

  const res = await fetch("/api/orders", {
    method: "POST",
    body: JSON.stringify({ name }),
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) return { error: "Failed to create order" };
  return { success: true };
}

function OrderForm() {
  const [state, action, isPending] = useActionState(createOrder, {});

  return (
    <form action={action}>
      <input name="name" required />
      {state.error && <p role="alert">{state.error}</p>}
      {state.success && <p>Order created!</p>}
      <button disabled={isPending}>
        {isPending ? "Creating..." : "Create"}
      </button>
    </form>
  );
}
```

### When to use form actions vs React Hook Form

| Use case | Choice |
|---|---|
| Simple form (1-3 fields, basic validation) | React 19 form actions |
| Complex validation (conditional, cross-field) | React Hook Form + Zod |
| Dynamic fields (add/remove rows) | React Hook Form `useFieldArray` |
| Progressive enhancement / Server Components | React 19 form actions |
| Wizard / multi-step forms | React Hook Form (persist state across steps) |

## Accessibility checklist for forms

1. Every input has a `<label>` with `htmlFor` matching `id`.
2. Error messages use `role="alert"` and are associated via `aria-describedby`.
3. Invalid fields have `aria-invalid={true}`.
4. Submit button shows loading state and is `disabled` during submission.
5. Focus moves to the first error field on validation failure.
6. Required fields use `aria-required="true"` or the `required` attribute.
