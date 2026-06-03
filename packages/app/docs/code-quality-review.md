# Code Quality Review — AppTimersFinal React 19 Migration

**Agente:** senior-code-quality-agent  
**Fecha:** 2026-05-27  
**Módulos revisados:** src/api/, src/stores/, src/hooks/, src/utils/, src/components/

---

## Resumen ejecutivo

| Severidad | Hallazgos |
|---|---|
| 🔴 Bloqueante | 0 |
| 🟠 Alta | 1 |
| 🟡 Media | 3 |
| ✅ Bien hecho | 8 |

---

## Problemas de migración — verificación de los 12 M-xx

| ID | Descripción | Estado | Ubicación |
|---|---|---|---|
| M-01 | Token JWT en headers REST | ✅ Resuelto | `api/client.ts` interceptor request |
| M-02 | Promise antipattern | ✅ Resuelto | TanStack Query; errores propagan |
| M-03 | 4 conexiones WebSocket | ✅ Resuelto | `socket/index.ts` singleton ES module |
| M-04 | Caracteres especiales en URL | ✅ Resuelto | `encodeURIComponent` en useSalas/useEmpresas |
| M-05 | Lógica duplicada en 5 componentes | ✅ Resuelto | `utils/time.ts` módulo compartido |
| M-06 | getTES() llamado 2 veces | ✅ Resuelto | Una sola query, filtrado en memoria |
| M-07 | Borrado en cascada fire-and-forget | ✅ Resuelto | Promise.all en todos los hooks de delete |
| M-08 | Swal en service layer | ✅ Resuelto | Swal solo en componentes |
| M-09 | URLs hardcodeadas | ✅ Resuelto | `config/env.ts` con VITE_API_URL |
| M-10 | Class components | ✅ Resuelto | Todos functional components con hooks |
| M-11 | EmpresasEventoTimers bug categorías | ✅ Resuelto | Hook useCategorias + duracion directo |
| M-12 | idEvento hardcodeado | 🟡 Deuda conocida | `useTES.ts:42` — documentado en PRD |

**Resultado: 11/12 resueltos. M-12 es deuda conocida documentada en el PRD.**

---

## Hallazgos

### 🟠 ALTA — `EmpresasEventoTimersNew`: Swal con HTML injection no reactivo

**Ubicación:** `src/components/eventos/EmpresasEventoTimersNew.tsx` método `showSchedule`

```typescript
// Problemático:
html: `<p id="swal-schedule-content">Cargando horario…</p>`,
didOpen: () => {
  const el = document.getElementById('swal-schedule-content');
  if (el) el.textContent = '...'; // DOM manipulation fuera de React
}
```

El contenido del Swal no se actualiza reactivamente cuando los datos de `useEventosActualesEmpresa` cargan. El usuario ve "Cargando horario…" aunque los datos ya estén disponibles en el panel inline debajo de la grid.

**Acción:** El Swal de detalle puede eliminarse completamente — el panel inline debajo de la grid ya muestra todos los datos necesarios. Si se quiere mantener el Swal, usar `SweetAlert2` con un componente React renderizado via `ReactDOM.createRoot` en el contenedor del Swal (patrón documentado en SweetAlert2 v11 con React).

**Urgencia:** Alta — no bloquea el build pero produce UX confusa en producción.

---

### 🟡 MEDIA — `useCategorias`: tipo de retorno de `getCategoriaDuracion` es `number | null`

**Ubicación:** `src/hooks/useCategorias.ts:61`

```typescript
export function getCategoriaDuracion(categorias: Categoria[], idCategoria: number): number | null {
  return categorias.find((c) => c.idCategoria === idCategoria)?.duracion ?? null;
}
```

Consumido en `Horario.tsx:71` con `?? 0` como fallback. El `0` como duración silencia el error de "categoría no encontrada" y produce filas con hora de inicio = hora de fin en la tabla.

**Acción:** Cambiar el fallback a un valor semántico (retornar `undefined` en lugar de `null`, o lanzar en Horario cuando la categoría no se encuentra — ambas opciones son válidas).

---

### 🟡 MEDIA — `Categorias.tsx`: función `checkOverlapForDuration` tiene complejidad O(n²)

**Ubicación:** `src/components/admin/Categorias.tsx`

El doble bucle sobre `affectedTimers` para verificar solapamiento tiene complejidad cuadrática. Con el número de timers que maneja esta app (típicamente < 50), no es un problema de rendimiento, pero la lógica es difícil de leer.

**Acción:** Extraer a `utils/time.ts` como `checkTimerOverlapForNewDuration(timers, categorias, newDuration, excludeCategoriaId)` con tests unitarios propios.

---

### 🟡 MEDIA — `void` operator en handlers async

**Ubicación:** Múltiples componentes (`Salas.tsx`, `Empresas.tsx`, etc.)

```typescript
onClick={() => void handleDelete(sala.idSala, sala.nombreSala)}
```

El uso de `void` es correcto para suprimir la advertencia de `no-floating-promises`, pero la intención no es evidente para un lector nuevo.

**Acción:** Añadir un comentario JSDoc o un helper `fireAndForget` que haga explícita la intención, o configurar el linter para que la regla `@typescript-eslint/no-misused-promises` no requiera `void` en handlers inline (configuración común para React projects).

---

## Puntos bien resueltos

1. **Singleton WebSocket con ES modules** (`socket/index.ts`): la solución más simple y correcta. No requiere Context, no requiere Provider, funciona en tests con `vi.mock`.

2. **`useAuthStore.getState()` en axios interceptor**: patrón correcto para acceder a Zustand fuera de componentes React. Evita el antipatrón de `useContext` fuera del árbol.

3. **Zod parse en cada queryFn**: las respuestas del backend se validan antes de entrar al caché. Errores de shape del backend se detectan inmediatamente y se propagan via TanStack Query.

4. **Promise.all en todos los delete hooks**: M-07 resuelto consistentemente en los 4 hooks que hacen borrado en cascada (useSalas, useEmpresas, useCategorias, useTimers).

5. **`utils/time.ts` con funciones puras exportadas individualmente**: tree-shakeable, testeable sin mocks, sin side effects. M-05 resuelto limpiamente.

6. **`Tiempo.tsx` recibe remainingSeconds como prop**: desacopla el display del WebSocket. Facilita tests del componente sin necesidad de mockear el socket.

7. **`ProtectedRoute` con `<Outlet>`**: patrón estándar de React Router v7. No re-implementa lógica de navegación; delega en el router.

8. **`authStore.clearToken()` usa `removeItem` no `clear()`**: M-auth resuelto correctamente en una línea.

---

## No hay en la codebase

- `any` en el código fuente (verificado por TypeScript strict).
- Fetch manual en componentes (todo via hooks de TanStack Query).
- Swal en la capa de servicio/hooks (M-08).
- Lógica de negocio de tiempo fuera de `utils/time.ts` (M-05).
- Múltiples instancias de socket (M-03).
- `localStorage.clear()` (M-auth).
- URLs hardcodeadas fuera de `config/env.ts` (M-09).
