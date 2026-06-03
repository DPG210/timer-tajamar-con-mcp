# timer-tajamar

Monorepo con dos paquetes que comparten el mismo backend (API en Azure):

- `packages/app` — aplicación web React + Vite. Publicada en Azure. Habla con la API por HTTP/WebSocket.
- `packages/mcp-server` — servidor MCP local (Node, stdio). Es una herramienta de desarrollo que
  llama a la API real y devuelve los datos crudos, para verificar que coinciden con lo que esperan
  los tests.

Gestionado con **npm workspaces**: ejecuta `npm install` una vez en la raíz; hay un único
`node_modules` y un único `package-lock.json`.

## Comandos

Desde la raíz del repo:

- `npm run dev:app` — arranca la web (Vite).
- `npm run test:app` — corre los tests de la app (Vitest).
- `npm run build:mcp` — compila el MCP a `packages/mcp-server/dist/index.js`. Recompila tras cambiar el MCP.
- `npm run dev:mcp` — ejecuta el MCP en modo desarrollo (tsx, sin compilar).

## MCP `timer-mcp` — uso de SOLO lectura

El servidor MCP `timer-mcp` llama a la API real de Azure. Úsalo para verificar que los datos que
devuelve la API encajan con los esquemas Zod de `packages/app/src/types/models.ts`.

Herramientas permitidas:

- `login` — autenticación. Es **obligatorio llamarlo primero**; si deniegan las credenciales, los metodos GET no necesitan JWT.
  Pide las credenciales al usuario; nunca las inventes ni las dejes escritas en el repo.
- `listar_salas`, `listar_empresas`, `listar_categorias`, `listar_temporizadores`, `listar_asignaciones`
  — consultas de lectura.

No uses herramientas de escritura (crear/actualizar/borrar). El usuario de prueba no tiene permisos
para ellas (la API las rechaza), así que solo gastarían una llamada y devolverían un error. Si una
tarea parece necesitarlas, párate y pregunta en vez de ejecutarlas.

Flujo típico de verificación:

1. `login` con credenciales válidas.
2. Llama al `listar_*` correspondiente.
3. Compara el JSON real con el esquema Zod de `packages/app/src/types/models.ts`. Si no encaja
   (campos de más, de menos, o tipos distintos), repórtalo como un fallo de contrato API↔tests.

## Verificación de datos con subagentes

Cuando delegues una verificación de datos a un subagente (p. ej. el de testing en
`.claude/agents/senior-testing-agent.md`), indícale **explícitamente en la tarea** que use el MCP
`timer-mcp`: que haga `login` y los `listar_*` necesarios, y compare contra los esquemas Zod. El
contexto del subagente es independiente, así que la instrucción debe ir en la petición de delegación,
no se asume.
