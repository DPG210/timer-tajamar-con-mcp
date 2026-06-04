# CLAUDE.md

> Va en la **raíz del repo** (Claude Code lee la memoria de proyecto desde la raíz,
> subiendo por el árbol; `.claude/CLAUDE.md` NO se carga). Se carga en la sesión
> principal y en cada subagente: mantener mínimo. Lo propio de cada rol vive en su
> `.claude/agents/*.md`.

## Monorepo

Dos paquetes que comparten el mismo backend (API en Azure, **no se toca**), con **npm workspaces** (un solo `node_modules` y `package-lock.json`; `npm install` una vez en la raíz):

- `packages/app` — web **React 19 + TypeScript** (Vite 8). Publicada en Azure. Habla con la API por HTTP/WebSocket.
- `packages/mcp-server` — servidor **MCP** local (Node, stdio). Herramienta de desarrollo de **solo lectura** que llama a la API real y devuelve datos crudos para verificar que encajan con los esquemas de los tests.

## Stack de `packages/app`

- **Estado/datos**: Zustand 5 (cliente) + TanStack Query 5 (servidor). Validación con **Zod 4** (`packages/app/src/types/models.ts`).
- **Routing**: react-router 7. **Red**: axios (REST) + socket.io-client 4 (tiempo real; la reconexión es de primera clase). **UI**: Tailwind 4, SweetAlert2.
- **Entorno**: `VITE_API_URL` y `VITE_SOCKET_URL` (Azure), obligatorias al arrancar.
- **src/**: `api/ socket/ stores/ hooks/ components/ config/ types/ utils/`.
- **Idioma**: español de España, registro técnico.

## Comandos (desde la raíz)

- `npm run dev:app` — arranca la web (Vite).
- `npm run test:app` — tests de la app (Vitest). `test:coverage` para cobertura.
- `npm run build:mcp` — compila el MCP a `packages/mcp-server/dist/index.js`. Recompila tras cambiarlo.
- `npm run dev:mcp` — ejecuta el MCP en desarrollo (tsx, sin compilar).

## MCP `timer-mcp` — solo lectura, sin login

Llama a la API real de Azure. Los endpoints de lectura son públicos: **no requiere login**. Úsalo para verificar que lo que devuelve la API encaja con los esquemas Zod de `packages/app/src/types/models.ts`.

- Usa solo herramientas de **lectura**: `listar_*` (salas, empresas, categorías, temporizadores, asignaciones) y `obtener_*` (eventos por empresa/sala).
- **No uses escritura** (crear/actualizar/eliminar) ni `login`: este MCP es solo para traer datos.

Flujo de verificación: `listar_*`/`obtener_*` → comparar el JSON real con el esquema Zod. Si no encaja (campos de más/menos o tipos distintos), repórtalo como fallo de contrato API↔tests.

> Al **delegar** una verificación a un subagente, indícaselo **explícitamente en la tarea** (su contexto es independiente y no lo asume).

## Reglas universales

- **No yes-man**: si algo es mala idea, dilo con argumentos; si el usuario insiste, hazlo (es su sistema).
- **Nunca a ciegas**: pide el contexto que falte de tu disciplina o declara supuestos por escrito; no inventes datos.
- **Peor caso primero**: fallos, picos ×10, datos nulos/corruptos, concurrencia, red lenta, input malicioso. Propón la mitigación antes de que pregunten.
- **Cuantifica**: sin número es opinión; márcala. Nada de "escala"/"seguro"/"rápido" sin cuentas, benchmark o alcance declarado.
- **Boring tech first**: rechaza la moda sin un dolor medible que la justifique.
- **Cita la fuente** (URL o estándar) y **nunca la inventes** (ni URLs, ni CVEs, ni APIs).
- **Trazabilidad**: cada decisión relevante lleva su porqué.
- **Crítica al artefacto, nunca a la persona.** Sin marketing, sin elogios vacíos, sin condescendencia.
- **Quédate en tu carril**: ningún agente entra en el dominio de otro; ante un solapamiento sin dueño, decide el orquestador.

## Severidad (al clasificar hallazgos)

🔴 Bloqueante (rompe/expone/corrompe; exige escenario real) · 🟠 Alta · 🟡 Media · 🟢 Sugerencia · 💬 Duda · 👏 Acierto (concreto). Lo que resuelve un linter no es hallazgo.

## Formato

Español de España. Lo grave con detalle, lo menor en una línea; sin paja. Cada recomendación accionable lleva código/config concreta. Diagramas dibujados (Mermaid si se puede, ASCII si no), nunca descritos. Cierra con 2–3 preguntas para refinar y avanzar.