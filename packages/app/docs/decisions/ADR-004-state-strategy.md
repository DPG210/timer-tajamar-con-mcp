# ADR-004 — Estrategia de estado: TanStack Query (server) + Zustand (client)

**Estado:** Aceptado  
**Fecha:** 2026-05-27

---

## Contexto

El original no tiene gestión de estado global. Cada componente carga su propio estado en `componentDidMount`, sin caché, sin invalidación coordinada. `getTES()` se llama dos veces por evento `timerID` (M-06).

## Decisión

### División de responsabilidades

| Tipo de estado | Librería | Ejemplos |
|---|---|---|
| Server state | TanStack Query | Salas, Empresas, Categorias, Timers, TES, TimerEventos |
| Auth state | Zustand (authStore) | token, isAuthenticated |
| Socket state | Zustand (socketStore) | isConnected |
| UI state local | useState | modales abiertos, input values |
| Sala activa | Zustand (uiStore) | idSalaActiva (persiste entre navegaciones) |

### Query keys canónicas

```typescript
const QUERY_KEYS = {
  salas: ['salas'] as const,
  empresas: ['empresas'] as const,
  categorias: ['categorias'] as const,
  timers: ['timers'] as const,
  tes: ['tes'] as const,
  empresasTimers: ['empresasTimers'] as const,
  eventosEmpresa: (id: number) => ['eventosEmpresa', id] as const,
  eventosActualesEmpresa: (id: number) => ['eventosActualesEmpresa', id] as const,
  eventosSala: (id: number) => ['eventosSala', id] as const,
} as const;
```

### Invalidación tras WebSocket `timerID`

Cuando llega `timerID`, el hook `useTimerSocket` invalida `['tes']`. Esto resuelve M-06: TanStack Query hace una sola petición GET con los resultados en caché disponibles inmediatamente para todos los componentes que consuman el hook `useTES`.

### Invalidación tras mutations

Cada mutation hook invalida su query key correspondiente al completar con éxito:

```typescript
useMutation({
  mutationFn: createSala,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.salas });
  },
});
```

Las mutations de timers y categorias también emiten `syncData` via socket tras invalidar.

### staleTime

- Entidades de configuración (salas, empresas, categorias): `staleTime: 30_000` (30 s). Cambian poco durante el evento.
- TES y timers: `staleTime: 0`. Cambian frecuentemente por acción del admin.
- TimerEventos (solo lectura): `staleTime: 5_000`.

## Consecuencias

**Positivas:**
- Resuelve M-06: un solo GET a TES por evento timerID; el resultado está en caché para todos los hooks que lo consuman.
- Loading/error/success gestionados por TanStack Query; resuelve M-02 (no más spinners eternos).
- Devtools de TanStack Query facilitan debug durante desarrollo.

**Negativas:**
- Curva de aprendizaje de TanStack Query v5 (API ligeramente distinta a v4: `useQuery({ queryKey, queryFn })`).
- El `QueryClient` debe ser singleton en el árbol de la app. Se instancia en `main.tsx`.
