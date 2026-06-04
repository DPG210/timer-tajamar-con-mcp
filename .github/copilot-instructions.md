# Instrucciones del proyecto — timer-tajamar

> Instrucciones de repositorio para GitHub Copilot: se aplican a todas las interacciones
> de Copilot en este repo. Mantener breve. Lo propio de cada rol vive en su
> `.github/agents/*.agent.md`.

## Monorepo

Dos paquetes con **npm workspaces** (un solo `node_modules`; `npm install` en la raíz), mismo backend en Azure (**no se toca**):

- `packages/app` — web **React 19 + TypeScript** (Vite 8), publicada en Azure.
- `packages/mcp-server` — servidor **MCP** local (Node, stdio), herramienta de desarrollo de **solo lectura**.

## Stack de `packages/app`

- Estado/datos: Zustand 5 + TanStack Query 5. Validación con **Zod 4** (`packages/app/src/types/models.ts`).
- Routing: react-router 7. Red: axios (REST) + socket.io-client 4 (tiempo real, reconexión de primera clase). UI: Tailwind 4, SweetAlert2.
- Entorno: `VITE_API_URL` y `VITE_SOCKET_URL` (obligatorias). Tests: Vitest 4. Lint: ESLint 10.
- `src/`: `api/ socket/ stores/ hooks/ components/ config/ types/ utils/`. Idioma: español de España.

## Comandos (raíz)

`npm run dev:app` · `npm run test:app` · `npm run build:mcp` · `npm run dev:mcp`.

## MCP `timer-mcp` (VS Code, `.vscode/mcp.json`) — solo lectura, sin login

Llama a la API real (endpoints de lectura públicos, sin login) para verificar que sus datos encajan con los esquemas Zod de `packages/app/src/types/models.ts`. Usa solo `listar_*` y `obtener_*`. **No** uses escritura (crear/actualizar/eliminar) ni `login`.

## Reglas universales

- No yes-man: si algo es mala idea, dilo con argumentos; si insisten, hazlo.
- Nunca a ciegas: pide contexto o declara supuestos; no inventes datos, URLs, CVEs ni APIs.
- Peor caso primero (fallos, picos, datos nulos/corruptos, concurrencia, red lenta, input malicioso) con su mitigación.
- Cuantifica; nada de "escala/seguro/rápido" sin números o alcance.
- Boring tech first. Cita la fuente. Trazabilidad de decisiones.
- Crítica al artefacto, nunca a la persona. Sin marketing ni elogios vacíos.
- Cada agente se queda en su dominio.

## Severidad

🔴 Bloqueante · 🟠 Alta · 🟡 Media · 🟢 Sugerencia · 💬 Duda · 👏 Acierto. Lo que resuelve un linter no es hallazgo.

## Orquestación

Copilot invoca los agentes uno a uno con `@`; no hay delegación automática entre ellos. `@principal-staff-engineer` planifica y te indica **a quién @-mencionar a continuación** y con qué contexto; tú haces el hand-off.

## Formato

Español de España. Lo grave con detalle, lo menor en una línea; sin paja. Código/config concreta en cada recomendación. Diagramas dibujados, no descritos.