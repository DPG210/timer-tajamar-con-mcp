# 06 — Decisiones tecnicas (ADR)

Este documento recoge las decisiones tecnicas relevantes del proyecto en formato ADR (Architecture Decision Record) simplificado. Cada bloque responde a: que se decidio, en que contexto, que alternativas habia, por que se eligio esta opcion y que consecuencias tiene.

---

## Decision 1: StdioTransport en lugar de SSE o HTTP

### Decision

El servidor MCP usa `StdioServerTransport` como canal de comunicacion con Claude Desktop.

### Contexto

El protocolo MCP soporta multiples transportes. Los mas comunes son:

- **stdio**: el servidor es un proceso hijo que lee mensajes por stdin y escribe respuestas por stdout.
- **SSE (Server-Sent Events)**: el servidor expone un endpoint HTTP que mantiene una conexion de larga duracion con el cliente.
- **HTTP con polling**: el cliente hace peticiones HTTP periodicas al servidor.

El SDK de MCP proporciona implementaciones de `StdioServerTransport` y `SSEServerTransport`.

### Alternativas consideradas

**SSEServerTransport:** el servidor expone un puerto HTTP. Claude Desktop se conecta como cliente HTTP. Esta opcion permite que el servidor este siempre corriendo independientemente de Claude Desktop, y que multiples clientes se conecten al mismo tiempo.

**HTTP con polling:** no contemplado por el SDK de MCP; requeriria implementacion manual del protocolo.

### Razon de la eleccion

`StdioServerTransport` es la opcion mas simple y la recomendada para servidores MCP de proposito local. Razone:

1. **Sin puerto que gestionar.** No hay un puerto TCP que exponer, que proteger con firewall, que configurar en el SO o que puede colisionar con otra aplicacion.

2. **Ciclo de vida gestionado por Claude Desktop.** Claude Desktop arranca el proceso cuando necesita las herramientas y lo mata cuando termina. No hay un servidor zombie que hay que recordar apagar.

3. **Sin autenticacion de transporte.** Con SSE, habria que proteger el endpoint HTTP para que otros procesos de la maquina no puedan llamar al servidor MCP. Con stdio, el canal es privado entre Claude Desktop y el proceso hijo.

4. **Compatibilidad garantizada.** Claude Desktop, el Inspector MCP y la mayoria de clientes MCP soportan stdio. SSE tiene menos soporte en clientes alternativos.

### Consecuencias

El servidor no puede estar siempre corriendo en background. Si se necesita que el servidor MCP sea un servicio persistente accesible desde multiples maquinas o desde la red, habria que migrar a SSEServerTransport y gestionar el ciclo de vida del proceso manualmente.

Los logs de depuracion deben ir a `stderr`, no a `stdout`, para no contaminar el canal de comunicacion MCP.

---

## Decision 2: Token JWT en memoria, no en disco

### Decision

El token JWT de autenticacion se almacena como variable de modulo en `client.ts`. Se inicializa desde `process.env.TIMER_API_TOKEN` al arrancar el proceso. La herramienta `login` lo actualiza en memoria. No se persiste en ningun fichero.

### Contexto

El servidor MCP necesita autenticarse con la REST API en cada llamada. La REST API usa JWT Bearer tokens. El token tiene una duracion finita (segun la configuracion del backend, tipicamente horas o dias).

El servidor MCP es un proceso efimero: Claude Desktop lo arranca y lo mata segun necesidad. Entre sesiones de Claude Desktop, el proceso no existe.

### Alternativas consideradas

**Guardar el token en un fichero:** por ejemplo, `~/.timer-mcp/token.json`. El servidor lo leeria al arrancar y lo actualizaria cuando `login` se invoca.

**Guardar el token en Redis u otro store externo:** un proceso separado mantiene el token. El servidor MCP lo lee desde Redis al arrancar.

**No guardar el token; pedirlo en cada sesion:** el usuario llama a `login` al inicio de cada sesion de Claude Desktop.

### Razon de la eleccion

**La persistencia en fichero no aporta valor real.** El servidor MCP vive exactamente lo que dura la sesion de Claude Desktop. Al matar el proceso, la variable de memoria desaparece igual que lo haria el fichero en memoria. La diferencia es que el fichero sobrevive entre sesiones, pero eso ya lo resuelve `TIMER_API_TOKEN`: si el operador configura esa variable con un token de larga duracion, el servidor arranca ya autenticado en cada sesion.

**Redis es sobredimensionado.** Redis es util para compartir estado entre multiples instancias de un servicio. Este servidor MCP es siempre una instancia unica. Introducir Redis anade una dependencia externa (instalacion, configuracion, mantenimiento) para guardar un string.

**La variable de entorno es la solucion correcta para configuracion externalizada.** Es el patron estandar de twelve-factor app. El valor se inyecta desde el entorno sin modificar el codigo.

### Consecuencias

Si el token expira durante una sesion larga, las llamadas a la API comenzaran a fallar con 401. El usuario debe invocar `login` para renovarlo. Una mejora futura seria detectar el 401 automaticamente en el interceptor de axios y renovar el token, pero requiere que la REST API soporte refresh tokens.

El token es visible en texto plano en las variables de entorno del proceso, que en Windows puede consultarse con `tasklist /v` o herramientas similares. Esto es aceptable para un servidor local de uso por operadores de confianza.

---

## Decision 3: Eliminacion en cascada manual en el servidor MCP

### Decision

Cuando se elimina una Sala, Empresa, Categoria o Temporizador que tiene TES dependientes, el servidor MCP borra primero los TES en paralelo con `Promise.all` y luego borra el recurso padre.

### Contexto

La REST API no implementa eliminacion en cascada. Si se intenta borrar una Sala que tiene TES referenciandola, la API devuelve un error de constraint de base de datos (tipicamente HTTP 500 o 409). El cliente React original no implementa eliminacion de entidades padre directamente; la interfaz de usuario requiere borrar los TES manualmente antes de borrar la sala.

### Alternativas consideradas

**Implementar la cascada en la REST API:** la solucion correcta a largo plazo. El backend configura la relacion de cascada en el ORM o en la base de datos.

**No implementar cascada en el servidor MCP:** devolver el error de la API y pedir al usuario que borre los dependientes primero.

**Implementar cascada con transacciones:** usar un endpoint de transaccion del backend (si existiera) para que el borrado sea atomico.

### Razon de la eleccion

La implementacion de cascada en la REST API requiere acceso al codigo del backend, que esta fuera del alcance de este proyecto. El servidor MCP puede implementar la cascada de forma pragmatica desde el lado cliente.

No implementar cascada significaria que Claude tendria que hacer varias llamadas en orden correcto para borrar una entidad, y el usuario tendria que conocer ese orden. Esto complica la interaccion y traslada complejidad accidental al usuario.

La cascada manual con `Promise.all` es aceptable para el tamano de datos esperado (decenas de TES, no millones).

### Consecuencias

**Riesgo de inconsistencia:** si `Promise.all` lanza (porque una de las DELETEs falla), algunas DELETEs se habran ejecutado y otras no. El recurso padre no se borra (porque el codigo no llega a ese paso). El resultado es TES huerfanos si los DELETEs de TES fallan parcialmente, o TES borrados pero sala intacta si falla despues de los TES.

Este riesgo es bajo en condiciones normales (conexion estable a la API) pero existe. La solucion definitiva es implementar la cascada en el backend. Documentado como deuda tecnica.

**Latencia adicional:** cada eliminacion requiere un GET previo de todos los TES. Para datasets grandes, esto puede ser lento. Aceptable para el caso de uso actual.

---

## Decision 4: No exponer WebSocket como herramientas MCP

### Decision

Los eventos WebSocket del backend (timerID, envio, syncData, vamos, start) no se implementan como herramientas MCP. El servidor MCP no abre conexiones WebSocket.

### Contexto

El backend expone un canal WebSocket (socket.io) que emite eventos en tiempo real: el timer activo, el tiempo restante, el estado de pausa. El cliente React se conecta a este canal para mostrar el contador regresivo en pantalla.

Claude podria necesitar saber "cual es el timer activo ahora mismo" para responder a preguntas del operador.

### Alternativas consideradas

**Abrir una conexion WebSocket persistente en el servidor MCP:** el servidor se conecta al WebSocket al arrancar y mantiene el ultimo estado en memoria. Una herramienta `obtener_estado_actual` devuelve ese estado sin hacer peticion HTTP.

**Implementar un endpoint de polling REST:** que ya existe en el backend (`/api/timereventos/eventosactualesempresa/{id}`), y que el servidor MCP ya expone como herramienta.

### Razon de la eleccion

El transporte `StdioServerTransport` es sincrono: Claude hace una llamada de herramienta y espera una respuesta. No hay mecanismo para que el servidor MCP le "empuje" informacion a Claude de forma asincrona. Los eventos WebSocket son push-asincronos: el backend emite cuando quiere, no cuando Claude pregunta.

Para manejar eventos WebSocket correctamente, el servidor MCP tendria que:

1. Mantener una conexion WebSocket persistente.
2. Almacenar el ultimo estado recibido en memoria.
3. Exponer una herramienta que devuelva ese estado almacenado.

Esto es tecnicamente posible, pero introduce complejidad: gestion de reconexiones, estado obsoleto si el WebSocket cae, sincronizacion entre el thread del WebSocket y el handler de la herramienta.

La alternativa de polling REST (herramienta `obtener_eventos_actuales_empresa`) resuelve el 95% de los casos de uso de Claude con una llamada HTTP simple. Si el operador pregunta "que empresa esta en la sala 3 ahora?", Claude puede llamar a `obtener_eventos_sala` con `idSala: 3` y obtener la respuesta.

### Consecuencias

Claude no puede "escuchar" eventos en tiempo real. Solo puede "preguntar" el estado actual mediante polling. Para el caso de uso de gestion de eventos (no de visualizacion en tiempo real), esto es suficiente.

La pantalla de visualizacion en tiempo real sigue siendo responsabilidad del cliente React, que usa WebSocket directamente. El servidor MCP y el cliente React tienen responsabilidades claramente separadas.

---

## Decision 5: Zod para validar respuestas de la API

### Decision

Se usa zod para validar las respuestas de la API en los casos en que el servidor MCP necesita extraer datos estructurados de la respuesta (login, eliminaciones en cascada).

### Contexto

La REST API no tiene un contrato formal publicado. No hay un fichero OpenAPI que especifique el formato exacto de cada respuesta. Si el backend cambia la estructura de una respuesta, el servidor MCP fallaria con un error en tiempo de ejecucion.

### Alternativas consideradas

**Sin validacion:** acceder a los campos directamente (`data.response`, `data[0].id`). Rapido de escribir, fragil ante cambios del backend.

**Validacion manual:** `if (typeof data.response !== 'string') throw new Error(...)`. Verbose, propenso a olvidos.

**JSON Schema + ajv:** esquemas en formato JSON Schema, validados con la libreria ajv. Mas verboso que zod.

**TypeScript types sin validacion runtime:** el compilador comprueba los tipos en build time, pero no en runtime. Si la API devuelve un formato diferente, el codigo compila pero falla en ejecucion.

### Razon de la eleccion

Zod ofrece la mejor relacion entre concision y seguridad. El schema se define en una linea y la validacion lanza un error descriptivo si falla:

```typescript
const tesList = z.array(z.object({ id: z.number(), idSala: z.number() })).parse(data);
```

Si `data` no es un array, o si los objetos no tienen `id` o `idSala` como numeros, zod lanza un `ZodError` que describe exactamente que falla. Eso convierte un error opaco de runtime en un mensaje diagnosticable.

Zod ya era una dependencia transitiva del SDK de MCP (el SDK lo usa para los schemas de herramientas), por lo que no se anade peso al bundle.

### Consecuencias

Las herramientas de listado simple (GET que devuelven datos a Claude sin procesarlos) no validan la respuesta con zod: simplemente la pasan como texto JSON. Si la API cambia el formato de esas respuestas, Claude recibira el nuevo formato sin error. Solo se validan las respuestas de las que el servidor MCP extrae datos para su logica interna.

---

## Decision 6: ESM en lugar de CommonJS

### Decision

El proyecto usa ESM (`"type": "module"` en package.json, `import`/`export` en el codigo) en lugar de CommonJS (`require`/`module.exports`).

### Contexto

Node.js soporta dos sistemas de modulos. CommonJS es el sistema historico, compatible con todas las versiones de Node.js. ESM es el estandar moderno, soportado de forma nativa desde Node.js 12 (estable desde Node.js 14).

El SDK de MCP esta publicado como ESM puro. No puede importarse con `require()` de CommonJS.

### Alternativas consideradas

**CommonJS con dynamic import:** se puede importar un modulo ESM desde CommonJS usando `import()` asincrono. Pero el punto de entrada del servidor (`index.ts`) tendria que ser un fichero CommonJS que hace `const { McpServer } = await import(...)`, lo cual complica la estructura y es poco ergonomico.

**Wrapper de CommonJS:** empaquetar el SDK con un bundler (webpack, esbuild, rollup) para producir un bundle CommonJS que incluye el SDK. Aniade un paso de build mas y complejidad de configuracion.

### Razon de la eleccion

La forma mas simple es usar ESM desde el inicio. El SDK lo requiere, Node.js lo soporta de forma nativa, y TypeScript con `module: ESNext` y `moduleResolution: bundler` lo gestiona correctamente. No hay razon para usar CommonJS en un proyecto nuevo que empieza con Node.js 18+.

### Consecuencias

Las importaciones de modulos propios deben incluir la extension `.js` aunque el fichero fuente sea `.ts`. Esto es una peculiaridad de ESM en TypeScript:

```typescript
// Correcto en ESM + TypeScript
import { httpClient, setToken } from './client.js';

// Incorrecto (falla en runtime aunque el fichero fuente sea client.ts)
import { httpClient, setToken } from './client';
```

Las importaciones del SDK deben incluir la extension `.js` tambien:

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
```

Algunos desarrolladores juniors se confunden porque el fichero fisico es `.ts` pero la importacion dice `.js`. Esto se debe a que TypeScript compila `.ts` a `.js` y la importacion debe referirse al fichero compilado.
