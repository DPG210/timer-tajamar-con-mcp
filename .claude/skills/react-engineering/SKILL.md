---
name: react-engineering
description: Professional React engineering knowledge for React 19+. Use this skill whenever the user asks for help building, reviewing, refactoring, or designing React code — components, hooks, state management, forms, routing, data fetching, performance, accessibility, testing, or Server Components. Trigger on any mention of React, JSX, TSX, hooks, useState, useEffect, useContext, React Server Components, Suspense, React Query, TanStack, Zustand, Redux, Next.js, Remix, Vite, or .tsx/.jsx files that look like React. Use this even if the user doesn't explicitly ask for "React best practices" — apply it whenever React code is involved so the output follows current idioms (Server Components where applicable, composition over inheritance, custom hooks for logic extraction, proper effect cleanup, strict TypeScript) rather than legacy patterns (class components, HOCs, render props for simple cases, uncontrolled useEffect chains, any as escape hatch).
---

# React Engineering

A reference skill for writing professional React code that follows the official React documentation (react.dev), TypeScript best practices, and the conventions that have settled across the ecosystem since React 18 introduced concurrent features and React 19 stabilized Server Components.

This skill exists to keep two failure modes out of the output:

1. **Stale patterns** — class components, HOCs when a custom hook is cleaner, `useEffect` for data fetching instead of a data-fetching library, `useEffect` to sync derived state that should be computed during render, prop drilling through 8 levels when composition or context solves it, `any` sprinkled across TypeScript.
2. **Hype-driven patterns** — reaching for Redux when `useState` + context suffices, Server Components for a purely client-side SPA, signals libraries that fight React's rendering model, premature `useMemo`/`useCallback` on everything without measuring, micro-frontends for a 3-person team.

The goal is to write React the way the React team recommends: function components, hooks for logic, composition for structure, TypeScript for safety, Server Components when the framework supports them, and data-fetching libraries for async data.

## When to consult this skill

- Writing or reviewing React components (function components, hooks, JSX/TSX).
- State management decisions (local state, context, Zustand, TanStack Query, Redux Toolkit).
- Data fetching (TanStack Query, SWR, Server Components, route loaders).
- Forms (React Hook Form, controlled vs. uncontrolled, validation).
- Routing (React Router, TanStack Router, Next.js App Router).
- Performance (React.memo, useMemo, useCallback, code splitting, lazy, Suspense).
- Accessibility (ARIA, keyboard, focus management, semantic HTML).
- Testing (Vitest, React Testing Library, MSW, Playwright).
- Server Components and server-side rendering patterns.
- Migrations from class components or older patterns.

## Core principles — apply in order

1. **Understand the project before writing code.** React 19 with Next.js App Router is different from React 18 with Vite SPA. Server Components change everything about data fetching and component architecture. Ask or state the assumption.

2. **react.dev is the source of truth.** Not Medium posts from 2020, not "10 React tips" articles, not tutorials that pre-date hooks. For TanStack Query: tanstack.com/query. For React Router: reactrouter.com.

3. **Function components only in new code.** Class components are legacy. Every new component is a function component with hooks. Class components in existing code should be migrated when the file is touched.

4. **TypeScript strict mode, no `any`.** `strict: true` in tsconfig. Props are typed with interfaces or type aliases. No `any` — use `unknown` and narrow, or define the actual type. Generic components when the type varies.

5. **Composition over configuration.** Components that accept `children`, render props for flexibility, compound components for complex patterns. Not mega-components with 30 props.

6. **Custom hooks for reusable logic.** If logic is used in more than one component, or if a component's logic is complex enough to test independently, extract it into a custom hook. Hooks are the reuse primitive.

7. **Let the URL be the source of truth for navigation state.** Filters, pagination, sort order, selected tab — these belong in the URL (search params), not in React state. The URL is shareable, bookmarkable, and survives refresh.

8. **Data fetching belongs in a library, not in useEffect.** TanStack Query, SWR, route loaders, or Server Components. Raw `useEffect` + `fetch` misses: caching, deduplication, background refetching, error/loading states, race conditions, and cancellation.

9. **Derive state during render, don't sync with useEffect.** If `fullName` is `firstName + lastName`, compute it in the render function. Don't store it in state and sync with useEffect. Effects are for side effects (subscriptions, DOM manipulation, external systems), not for derived state.

10. **Accessibility is code, not afterthought.** Semantic HTML (`<button>`, `<nav>`, `<main>`), ARIA attributes when needed, keyboard support, focus management on route changes and modal open/close.

11. **Measure before optimizing.** React DevTools Profiler, not intuition. `React.memo`, `useMemo`, `useCallback` add complexity — use them when profiling shows a problem, not preventively on every component.

## Workflow — for any non-trivial React task

1. **Establish context.** React version. Framework (Next.js, Remix, Vite SPA, Astro). State library (none, Zustand, Redux Toolkit, TanStack Query). Router. Styling approach (CSS Modules, Tailwind, styled-components). Testing framework.

2. **Decide the component shape.** Smart (container) vs. presentational? What props does it take? What state does it own vs. receive? What data does it fetch?

3. **Map the state.** What's local state (useState)? What's shared state (context, Zustand, Redux)? What's server state (TanStack Query)? What's URL state (search params)?

4. **Read the relevant reference(s).** See the index below.

5. **Write the code.** Typed, composable, accessible, with proper error boundaries and loading states.

6. **Verify.** TypeScript compiles with zero errors. No `any`. No `useEffect` for derived state. No prop drilling past 3 levels. Keyboard navigation works. Tests cover user-visible behavior.

## Reference index — load on demand

| Topic | File | When to read |
|---|---|---|
| Component patterns (composition, compound, render props, custom hooks) | `references/components.md` | Writing or reviewing components, designing APIs |
| Hooks deep dive (useState, useEffect, useRef, useMemo, useCallback, custom hooks) | `references/hooks.md` | Any hooks work, effect cleanup, memoization decisions |
| State management (local, context, Zustand, Redux Toolkit, URL state) | `references/state-management.md` | Deciding where state lives, when to add a library |
| Data fetching (TanStack Query, SWR, Server Components, route loaders) | `references/data-fetching.md` | Fetching data, caching, mutations, optimistic updates |
| Forms (React Hook Form, controlled vs. uncontrolled, validation) | `references/forms.md` | Any form work, validation, complex form state |
| Performance (memo, lazy, Suspense, code splitting, profiling) | `references/performance.md` | Performance work, bundle analysis, rendering optimization |
| Testing (React Testing Library, Vitest, MSW, Playwright) | `references/testing.md` | Writing or reviewing tests |
| Anti-patterns and code smells | `references/anti-patterns.md` | Reviewing code, refactoring legacy patterns |

## Output expectations

When the agent produces React code from this skill, the code should:

- Use function components with hooks (no class components).
- Use TypeScript strict mode with proper typing (no `any`).
- Use composition (children, render props, compound components) over mega-props.
- Use custom hooks for reusable or complex logic.
- Use a data-fetching library (TanStack Query, SWR) or Server Components — not raw useEffect + fetch.
- Compute derived state during render, not via useEffect sync.
- Use semantic HTML and ARIA attributes for accessibility.
- Handle loading, error, and empty states explicitly.
- Use URL search params for navigation-relevant state.

When the agent reviews existing React code, it should call out:

- Class components that should be function components.
- `useEffect` used for derived state computation.
- `useEffect` used for data fetching without a library (missing caching, race conditions, cleanup).
- `any` types in TypeScript.
- Prop drilling past 3 levels (use composition, context, or state library).
- `useMemo` / `useCallback` on everything without profiling evidence.
- Missing error boundaries.
- Missing loading and error states.
- Non-semantic HTML (`<div onClick>` instead of `<button>`).
- Missing `key` prop or using array index as key for dynamic lists.
- Effects missing cleanup (subscriptions, timers, abort controllers).
- State that should live in the URL (filters, pagination, tabs).

## Closing each response

1. **What was assumed** (React version, framework, state library, styling approach).
2. **What was deliberately not included** (tests, SSR, error boundaries) and why.
3. **One follow-up question** on the most relevant adjacent topic.
