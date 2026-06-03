# Plan de reconstrucción: Events Timer → React 19

## Contexto

Reconstruir desde cero la aplicación AppTimersFinal (gestión de temporizadores para eventos presenciales con múltiples salas y empresas) usando React 19, TypeScript, y Vite. El backend (API REST + WebSocket server) se mantiene igual — solo se reconstruye el frontend.

La app original usa React 17, class components, axios sin interceptores, múltiples conexiones WebSocket, JWT en localStorage sin enviar en headers, y lógica de negocio mezclada en componentes. La auditoría completa está en los archivos adjuntos.

---

## Stack objetivo

- React 19 + TypeScript + Vite
- TanStack Query (React Query) para estado del servidor y caché
- Zustand para estado global (auth, socket, sala activa)
- Socket.io-client (singleton) para WebSocket
- Axios con instancia centralizada + interceptor Bearer
- React Router v7 para navegación
- Zod para validación de datos de la API
- Tailwind CSS 4 para estilos

---

## Entidades del dominio

```
Sala { idSala, nombreSala }
Empresa { idEmpresa, nombreEmpresa }
Categoria { idCategoria, categoria, duracion }
Temporizador { idTemporizador, inicio, idCategoria, pausa }
TES { id, idTimer, idEmpresa, idSala, idEvento }
EventoActual { empresa, sala, inicioTimer, idCategoria, duracion, imagenEmpresa }
```

Relaciones: Sala 1:N TES N:1 Empresa, TES N:1 Temporizador N:1 Categoria.

---

## Endpoints del backend (no cambian)

### REST (base: env VITE_API_URL)
- POST Auth/Login → JWT
- CRUD api/salas (GET, GET/:id, POST/createsala/:nombre, PUT/updatesala/:id/:nombre, DELETE/:id)
- CRUD api/empresas (mismo patrón que salas)
- CRUD api/timers (GET, POST body, PUT body, DELETE/:id, PUT/increasetimers/:minutes)
- CRUD api/categoriastimer (GET, GET/:id, POST body, PUT body, DELETE/:id)
- CRUD api/TiempoEmpresaSala (GET, POST body, DELETE/:id)
- READ api/timereventos (GET, GET/empresastimers, GET/eventosactualesempresa/:id, GET/eventosempresa/:id, GET/eventossala/:id)

### WebSocket (base: env VITE_SOCKET_URL)
- Emit: syncData, start, vamos
- Listen: timerID (number), envio (number = segundos restantes)

---

## Fases de ejecución con agentes

### Fase 0 — Product Manager

**Agente:** `senior-product-manager`
**Input:** Esta auditoría + los 6 documentos de análisis
**Entregable:** PRD con:
- User personas (admin del evento, espectador en sala, empresa participante)
- User stories priorizadas (MoSCoW)
- Criterios de aceptación por historia
- MVP scope: qué funcionalidades se mantienen, cuáles se eliminan (EmpresasEventoTimers comentado → eliminar), cuáles se mejoran
- Métricas de éxito (misma UX, zero regressions)

**Pregunta clave para el PM:** ¿El componente `EmpresasEventoTimers` (ruta comentada, con bugs) se incluye o se descarta? ¿El botón de reset de emergencia (comentado) se incluye?

---

### Fase 1 — Arquitectura

**Agente:** `senior-architect-agent`
**Input:** PRD del PM + auditoría
**Entregable:**
- Estructura de carpetas del proyecto
- ADR-001: Elección de stack (React 19 + Vite + TypeScript + TanStack Query + Zustand)
- ADR-002: Estrategia de WebSocket (singleton + Zustand store + React context)
- ADR-003: Estrategia de autenticación (axios interceptor + token rotation)
- ADR-004: Estrategia de estado (server state en TanStack Query, client state en Zustand)
- Diagrama de componentes y su relación con los endpoints
- Contrato de tipos TypeScript para todas las entidades

Estructura de carpetas propuesta:
```
src/
├── api/                    # Axios instance + interceptors
│   └── client.ts
├── hooks/                  # Custom hooks por entidad
│   ├── useSalas.ts
│   ├── useEmpresas.ts
│   ├── useTimers.ts
│   ├── useCategorias.ts
│   ├── useTES.ts
│   └── useTimerEventos.ts
├── stores/                 # Zustand stores
│   ├── authStore.ts
│   └── socketStore.ts
├── types/                  # Tipos TypeScript + schemas Zod
│   └── models.ts
├── utils/                  # Funciones puras compartidas
│   └── time.ts
├── socket/                 # Singleton socket.io
│   └── index.ts
├── components/
│   ├── layout/             # Menu, MenuPopUp, Layout
│   ├── timer/              # TimerView, Tiempo
│   ├── admin/              # Salas, Empresas, Categorias, Temporizadores
│   ├── horario/            # Horario, HorarioActualEmpresaPopUp
│   ├── eventos/            # EmpresasEventoTimersNew
│   └── auth/               # Login
├── pages/                  # Route pages (wrappers ligeros)
├── App.tsx
└── main.tsx
```

---

### Fase 2 — Seguridad (paralela con Fase 3)

**Agente:** `senior-security-agent`
**Input:** auth-flow.md + api-endpoints.md + ADRs del arquitecto
**Entregable:**
- Threat model de la app
- Requisitos de seguridad para el interceptor axios (token refresh, expiración)
- Requisitos para el handshake WebSocket (auth en conexión)
- Política de sanitización de inputs (nombres de salas/empresas con caracteres especiales)
- Validación de respuestas de la API con Zod (no confiar en el shape del backend)

Problemas heredados que DEBEN resolverse:
1. Token JWT nunca enviado en headers REST → interceptor obligatorio
2. WebSocket sin auth en handshake → enviar token en auth del handshake
3. localStorage.clear() borra todo → solo borrar la key "token"
4. Validación de token inexistente → decodificar JWT y comprobar exp en cliente

---

### Fase 3 — Data Engineering (paralela con Fase 2)

**Agente:** `senior-data-engineer`
**Input:** data-models.md + service-layer.md + api-endpoints.md
**Entregable:**
- Tipos TypeScript + schemas Zod para las 6 entidades
- Capa de API: axios instance con baseURL, interceptor Bearer, timeout
- Hooks de TanStack Query para cada entidad (queries + mutations)
- Socket singleton con tipado de eventos
- Estrategia de invalidación de caché cuando llega syncData por WebSocket
- Utils de tiempo extraídos y testeados (transformDuration, transformMinutes, calcularFin, haySolapamiento)

Decisiones clave:
- Las mutations de timers/categorías invalidan queries al recibir syncData
- getTES() se llama UNA vez y el resultado se filtra en memoria (fix M-06)
- Los borrados en cascada usan Promise.all (fix M-07)

---

### Fase 4 — Frontend (después de Fase 1, 2, 3)

**Agente:** `senior-frontend-agent`
**Input:** ADRs + tipos + hooks + PRD
**Entregable:** Todos los componentes React 19, implementados como functional components con:
- TypeScript strict
- Hooks de TanStack Query (no fetch manual)
- Zustand para auth y socket state
- React Router v7
- Accesibilidad (ARIA, keyboard nav en tablas del horario)
- Responsive (TimerView debe funcionar en pantallas de sala grandes)
- SweetAlert2 solo en componentes, nunca en servicios

Mapa 1:1 de componentes (original → nuevo):

| # | Original (React 17) | Nuevo (React 19) | Ruta | Tipo |
|---|---|---|---|---|
| 1 | `Login.js` | `src/components/auth/Login.tsx` | `/login` | Página |
| 2 | `TimerView.js` | `src/components/timer/TimerView.tsx` | `/` | Página |
| 3 | `Horario.js` | `src/components/horario/Horario.tsx` | `/horario` | Página |
| 4 | `Salas.js` | `src/components/admin/Salas.tsx` | `/salas` | Página |
| 5 | `Empresas.js` | `src/components/admin/Empresas.tsx` | `/empresas` | Página |
| 6 | `Categorias.js` | `src/components/admin/Categorias.tsx` | `/categorias` | Página |
| 7 | `Temporizadores.js` | `src/components/admin/Temporizadores.tsx` | `/temporizadores` | Página |
| 8 | `EmpresasEventoTimers.js` | `src/components/eventos/EmpresasEventoTimers.tsx` | `/empresastimers` | Página (rehabilitar — estaba comentada, arreglar bug de categorías no cargadas) |
| 9 | `EmpresasEventoTimersNew.js` | `src/components/eventos/EmpresasEventoTimersNew.tsx` | `/empresastimersnew` | Página |
| 10 | `Tiempo.js` | `src/components/timer/Tiempo.tsx` | — | Subcomponente (WebSocket listener, display MM:SS) |
| 11 | `SalaPopUp.js` | `src/components/timer/SalaPopUp.tsx` | — | Subcomponente (modal selector de sala) |
| 12 | `HorarioActualEmpresaPopUp.js` | `src/components/horario/HorarioActualEmpresaPopUp.tsx` | — | Subcomponente (popup horario empresa) |
| 13 | `Menu.js` | `src/components/layout/Menu.tsx` | — | Layout (nav lateral) |
| 14 | `MenuPopUp.js` | `src/components/layout/MenuPopUp.tsx` | — | Layout (nav modal mobile) |
| 15 | `Router.js` | `src/App.tsx` (router integrado) | — | Router + Layout wrapper |
| 16 | `Global.js` | `src/config/env.ts` (env vars) | — | Config |
| 17 | — (no existía) | `src/components/auth/ProtectedRoute.tsx` | — | Nuevo: wrapper auth para rutas admin |

Total: 14 componentes originales migrados 1:1 + 1 nuevo (ProtectedRoute) + config + router.

Orden de implementación:
1. Config + Router + Layout (env.ts, App.tsx, Menu.tsx, MenuPopUp.tsx)
2. Auth (Login.tsx, ProtectedRoute.tsx)
3. Timer principal (TimerView.tsx, Tiempo.tsx, SalaPopUp.tsx)
4. Horario (Horario.tsx, HorarioActualEmpresaPopUp.tsx)
5. CRUDs admin (Salas.tsx, Empresas.tsx, Categorias.tsx, Temporizadores.tsx)
6. Vistas de eventos (EmpresasEventoTimers.tsx — rehabilitado y arreglado, EmpresasEventoTimersNew.tsx)

Nota para el PM (Fase 0): decidir si `EmpresasEventoTimers` (componente #8) se rehabilita arreglando el bug de categorías, o se elimina definitivamente. Si se rehabilita, descomentar también su ruta y enlace en el menú.

---

### Fase 5 — Testing (después de Fase 4)

**Agente:** `senior-testing-agent`
**Input:** Componentes implementados + PRD con criterios de aceptación
**Entregable:**
- Tests unitarios: utils de tiempo (solapamiento, transformaciones)
- Tests de hooks: queries y mutations con MSW
- Tests de componentes: render, interacciones, estados de carga/error
- Tests de integración: flujo login → admin → crear timer → ver en TimerView
- Test E2E: flujo completo con Playwright (WebSocket mockeado)

Casos críticos a testear:
- Solapamiento de timers al crear/editar
- Borrado en cascada (borrar categoría que tiene timers que tienen TES)
- Token expirado → redirect a login
- WebSocket desconectado → reconexión + re-sync
- Caracteres especiales en nombres de salas/empresas

---

### Fase 6 — Code Quality Review

**Agente:** `senior-code-quality-agent`
**Input:** Todo el código generado en fases 2-5
**Entregable:**
- Revisión de SOLID, DRY, cohesión
- Verificar que no hay lógica de negocio en componentes
- Verificar que no hay fetch manual (todo via hooks)
- Verificar tipado estricto sin any
- Verificar manejo de errores completo (no más promises pending forever)
- Verificar que los 12 problemas de migration-notes.md están resueltos

---

### Fase 7 — Documentación

**Agente:** `senior-technical-writer-agent`
**Input:** Código final + ADRs + PRD
**Entregable:**
- README.md del proyecto (setup, env vars, scripts)
- Documentación de la API client layer
- Guía de desarrollo (cómo añadir un nuevo CRUD)
- CHANGELOG de la migración vs la app original

---

## Dependencias entre fases

```
Fase 0 (PM)
    │
    v
Fase 1 (Arquitecto)
    │
    ├──────────────┐
    v              v
Fase 2 (Security)  Fase 3 (Data Eng)
    │              │
    └──────┬───────┘
           v
    Fase 4 (Frontend)
           │
           v
    Fase 5 (Testing)
           │
           v
    Fase 6 (Code Quality)
           │
           v
    Fase 7 (Docs)
```

Las fases 2 y 3 pueden ejecutarse en paralelo.
Las fases 5 y 6 podrían solaparse parcialmente.

---

## Cómo usar este plan

### En Claude Code:
Pon este documento y los 6 archivos de auditoría en el contexto del proyecto. El orquestador en CLAUDE.md leerá el plan y delegará a cada agente según la fase. Puedes decirle:

- "Ejecuta la Fase 0 — genera el PRD con el PM"
- "Ejecuta las Fases 2 y 3 en paralelo"
- "Pasa a Fase 4 — implementa los componentes frontend"

### En GitHub Copilot:
Invoca al orquestador con @principal-staff-engineer y dale este plan. Él te guiará fase por fase y te ofrecerá handoffs al agente correspondiente.

---

## Archivos de referencia necesarios

Asegúrate de que estos archivos estén accesibles en el repositorio para que los agentes los lean:

- `docs/audit/api-endpoints.md`
- `docs/audit/data-models.md`
- `docs/audit/component-api-map.md`
- `docs/audit/auth-flow.md`
- `docs/audit/service-layer.md`
- `docs/audit/migration-notes.md`
