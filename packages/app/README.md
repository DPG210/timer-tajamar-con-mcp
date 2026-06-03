# AppTimersFinal — React 19 Frontend

Aplicacion de gestion de temporizadores para eventos presenciales con multiples salas y empresas. El frontend ha sido reconstruido desde cero con React 19 + TypeScript. El backend no cambia.

---

## Requisitos previos

- Node.js 20+ (LTS)
- npm 10+
- Acceso al backend en `https://apitimerstesting.azurewebsites.net/` (o una instancia local)

---

## Configuracion inicial

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Edita .env con las URLs correctas para tu entorno
```

### Variables de entorno requeridas

| Variable | Descripcion | Ejemplo |
|---|---|---|
| `VITE_API_URL` | URL base del backend REST | `https://apitimerstesting.azurewebsites.net/` |
| `VITE_SOCKET_URL` | URL del servidor WebSocket | `https://timertajamarback.azurewebsites.net/` |

Ambas variables son obligatorias. La app lanza un error en consola si alguna falta al arrancar.

---

## Scripts disponibles

```bash
npm run dev            # Servidor de desarrollo (HMR)
npm run build          # Build de produccion (TypeScript + Vite)
npm run preview        # Previsualizar el build de produccion
npm run test           # Ejecutar tests unitarios (Vitest)
npm run test:watch     # Tests en modo watch
npm run test:coverage  # Tests con informe de cobertura
npm run lint           # ESLint
```

---

## Estructura del proyecto

```
src/
  api/
    client.ts              Axios instance + interceptors (Bearer token, 401 redirect)
  config/
    env.ts                 Variables de entorno validadas
  hooks/
    useAuth.ts             Login mutation
    useSalas.ts
    useEmpresas.ts
    useCategorias.ts
    useTimers.ts
    useTES.ts
    useTimerEventos.ts
    useTimerSocket.ts      WebSocket event -> Query invalidation
  socket/
    index.ts               Singleton socket.io-client
  stores/
    authStore.ts           JWT token (Zustand)
    uiStore.ts             Sala activa (Zustand + persist)
  types/
    models.ts              TypeScript types + Zod schemas
  utils/
    time.ts                Funciones puras de tiempo
    time.test.ts           Tests unitarios (Vitest)
  components/
    auth/                  Login, ProtectedRoute
    layout/                AppLayout, Menu, MenuPopUp
    timer/                 TimerView, Tiempo, SalaPopUp
    admin/                 Salas, Empresas, Categorias, Temporizadores
    horario/               Horario, HorarioActualEmpresaPopUp
    eventos/               EmpresasEventoTimers, EmpresasEventoTimersNew
  App.tsx                  Router (React Router v7)
  main.tsx                 Entry point (QueryClientProvider)
```

---

## Rutas de la aplicacion

| Ruta | Componente | Auth requerida |
|---|---|---|
| `/` | TimerView | No |
| `/horario` | Horario | No (lectura) / Si (escritura) |
| `/empresastimers` | EmpresasEventoTimers | No |
| `/empresastimersnew` | EmpresasEventoTimersNew | No |
| `/login` | Login | No |
| `/salas` | Salas | Si |
| `/empresas` | Empresas | Si |
| `/categorias` | Categorias | Si |
| `/temporizadores` | Temporizadores | Si |

---

## Como anadir un nuevo CRUD

1. Define el tipo en `src/types/models.ts` (schema Zod + tipo TypeScript).

2. Crea el hook en `src/hooks/use<Entidad>.ts` siguiendo el patron de `useSalas.ts`.
   - `useQuery` para lectura, `useMutation` + `invalidateQueries` para escritura.
   - Emite `socket.emit('syncData')` en mutations de timers y categorias.

3. Crea el componente en `src/components/<carpeta>/<Entidad>.tsx`.
   - Solo hooks de TanStack Query, sin fetch manual.
   - Swal solo en el componente, nunca en hooks.

4. Anade la ruta en `src/App.tsx`.

5. Anade el enlace en `src/components/layout/Menu.tsx`.

---

## Decisiones tecnicas (ADRs)

Ver `/docs/decisions/` para el razonamiento completo de cada decision.

| ADR | Decision |
|---|---|
| ADR-001 | Stack: React 19 + Vite + TypeScript + TanStack Query + Zustand |
| ADR-002 | WebSocket singleton en `src/socket/index.ts` |
| ADR-003 | Auth: axios interceptor Bearer + `authStore.clearToken()` |
| ADR-004 | Estado: TanStack Query (server) + Zustand (client) |

---

## Problemas resueltos en esta migracion

| # | Problema original | Solucion |
|---|---|---|
| M-01 | Token JWT nunca enviado en REST | Interceptor axios en `api/client.ts` |
| M-02 | Promesas que nunca rechazan | TanStack Query |
| M-03 | 4 conexiones WebSocket | Singleton ES module |
| M-04 | Caracteres especiales en URLs | `encodeURIComponent` en hooks |
| M-05 | Logica de tiempo duplicada | `utils/time.ts` |
| M-06 | getTES() llamado 2 veces | Una query, filtrado en memoria |
| M-07 | Borrados fire-and-forget | `Promise.all` en hooks de delete |
| M-08 | Swal en capa de servicio | Swal solo en componentes |
| M-09 | URLs hardcodeadas | `VITE_API_URL` / `VITE_SOCKET_URL` |
| M-10 | Class components | Functional components con hooks |
| M-11 | EmpresasEventoTimers: bug categorias | `duracion` usado directamente |

M-12 (idEvento hardcodeado a 1) permanece como deuda tecnica conocida.

---

## Stack

| Libreria | Version | Rol |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | ~6.0 | Tipos estaticos strict |
| Vite | 8 | Build tool |
| React Router | v7 | Navegacion |
| TanStack Query | v5 | Server state + cache |
| Zustand | v5 | Client state |
| Axios | v1 | HTTP client |
| Socket.io-client | v4 | WebSocket |
| Zod | v4 | Validacion de API responses |
| Tailwind CSS | v4 | Estilos |
| SweetAlert2 | v11 | Dialogos de confirmacion |
| Vitest | v4 | Tests unitarios |
