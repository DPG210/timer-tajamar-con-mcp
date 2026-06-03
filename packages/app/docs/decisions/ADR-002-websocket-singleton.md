# ADR-002 — Estrategia WebSocket: singleton en módulo + Zustand store

**Estado:** Aceptado  
**Fecha:** 2026-05-27

---

## Contexto

El original abre hasta 4 conexiones WebSocket simultáneas (M-03): `service.js`, `Login.js`, `TimerView.js`, `Tiempo.js`. Cada importación del módulo con `io(...)` a nivel de módulo puede crear una conexión nueva dependiendo del entorno.

Eventos críticos:
- `timerID` (number): qué timer está activo. Escuchado en TimerView.
- `envio` (number): segundos restantes. Escuchado en Tiempo.
- Emit `syncData`: tras mutaciones de timers/categorias.
- Emit `vamos`: iniciar evento.

## Decisión

Crear `src/socket/index.ts` como módulo singleton que exporta una única instancia de socket. Los módulos ES son evaluados una sola vez por el bundler; la instancia se crea en el primer import y se reutiliza en todos los demás.

```
src/socket/index.ts  →  única instancia  →  importada por
  ├── stores/socketStore.ts     (guarda estado isConnected)
  ├── hooks/useTimerSocket.ts   (escucha timerID + envio)
  └── api/client.ts             (emit syncData tras mutations)
```

El store de Zustand `socketStore` expone:
- `isConnected: boolean`
- `connect()` / `disconnect()` — para controlar el lifecycle si se necesita.

La invalidación de TanStack Query al recibir `syncData` se hace desde `useTimerSocket`: cuando llega `timerID`, se invalida `queryClient.invalidateQueries({ queryKey: ['tes'] })`.

## Consecuencias

**Positivas:**
- Una sola conexión TCP. Elimina M-03 completamente.
- Los listeners se registran una sola vez en el hook con cleanup en useEffect return.
- El socket es testeable: se puede mockear el módulo en tests.

**Negativas:**
- El singleton vive mientras el tab esté abierto. Si el usuario navega a /login (sin socket necesario), la conexión persiste. Es aceptable para esta app.

**Alternativas descartadas:**
- React Context para el socket: añade un Provider y un hook `useContext`, más boilerplate que un módulo singleton sin ventaja real para este caso.
- Reconexión manual: socket.io-client maneja la reconexión automáticamente con backoff exponencial. No hay que implementar nada extra.
