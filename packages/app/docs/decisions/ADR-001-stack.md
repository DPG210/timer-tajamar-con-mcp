# ADR-001 — Elección de stack: React 19 + Vite + TypeScript + TanStack Query + Zustand

**Estado:** Aceptado  
**Fecha:** 2026-05-27  
**Decisores:** Staff Engineer + Frontend Lead

---

## Contexto

El frontend original usa React 17 (CRA), JavaScript puro, class components, sin gestión de estado global, sin caché de servidor, sin tipos estáticos. La auditoría identificó 12 problemas, tres de ellos bloqueantes.

## Decisión

Reconstruir el frontend con:

| Librería | Versión | Rol |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | ~6.0 | Tipos estáticos, strict mode |
| Vite | 8 | Build tool / dev server |
| React Router | v7 | Navegación SPA |
| TanStack Query | v5 | Server state + caché |
| Zustand | v5 | Client state (auth, sala activa) |
| Axios | v1 | HTTP client con interceptores |
| Socket.io-client | v4 | WebSocket (singleton) |
| Zod | v3 | Validación de respuestas API |
| Tailwind CSS | v4 | Utilidades CSS |
| SweetAlert2 | v11 | Diálogos de confirmación (solo en componentes) |

## Consecuencias

**Positivas:**
- TypeScript strict elimina la clase de bugs de acceso a propiedades undefined.
- TanStack Query gestiona loading/error/success sin boilerplate manual; resuelve M-02.
- Zustand es tree-shakeable y no requiere Provider en el árbol React para leer el store; simplifica el acceso al token desde el interceptor axios.
- Vite HMR es más rápido que CRA para el ciclo de desarrollo.

**Negativas:**
- Tailwind CSS 4 tiene API distinta a v3 (sin `tailwind.config.js`, directivas `@theme`). Requiere verificación de compatibilidad de patrones.
- React 19 elimina `forwardRef` como wrapper explícito. Los componentes que reciban `ref` deben declararlo como prop directo. Verificar en migración de Menu.

**Alternativas descartadas:**
- Remix/Next.js: el backend ya existe. No se necesita SSR ni file-based routing. Añade complejidad innecesaria.
- Redux Toolkit: demasiado boilerplate para el scope de estado de esta app. Zustand es suficiente.
- SWR: TanStack Query tiene mejor soporte para mutations con invalidación de caché, necesario para el patrón syncData → invalidate.
