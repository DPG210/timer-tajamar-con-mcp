# 04 — Guia paso a paso: construir el servidor desde cero

Este tutorial muestra como construir el servidor MCP desde un directorio vacio. Cada paso incluye el codigo y la explicacion de por que se hace de esa manera.

Se asume que tienes instalados Node.js 18 o superior y npm.

---

## Paso 1: Inicializar el proyecto npm con ESM

```bash
mkdir timer-mcp-server
cd timer-mcp-server
npm init -y
```

Despues, edita `package.json` para anadir `"type": "module"` y los scripts:

```json
{
  "name": "timer-mcp-server",
  "version": "1.0.0",
  "description": "Servidor MCP para la API de gestion de temporizadores",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx src/index.ts"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
```

**Por que `"type": "module"`?**

Node.js soporta dos sistemas de modulos: CommonJS (el antiguo, con `require()`) y ESM (el moderno, con `import`/`export`). El SDK de MCP esta publicado como ESM. Si no declaras `"type": "module"`, Node.js interpreta los ficheros `.js` como CommonJS y la importacion del SDK falla con un error crip tico de incompatibilidad de modulos.

Con `"type": "module"`, todos los `.js` del proyecto se tratan como ESM por defecto.

---

## Paso 2: Instalar dependencias

```bash
# Dependencias de produccion
npm install @modelcontextprotocol/sdk axios zod

# Dependencias de desarrollo
npm install --save-dev typescript @types/node tsx
```

**Que instala cada grupo:**

- `@modelcontextprotocol/sdk`: el SDK de Anthropic para crear servidores MCP.
- `axios`: el cliente HTTP para llamar a la REST API.
- `zod`: validacion de esquemas en tiempo de ejecucion.
- `typescript`: el compilador de TypeScript.
- `@types/node`: los tipos de la API de Node.js (process.env, console, etc.).
- `tsx`: herramienta para ejecutar TypeScript directamente durante el desarrollo.

---

## Paso 3: Configurar tsconfig.json

Crea el fichero `tsconfig.json` en la raiz del proyecto:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["src"]
}
```

**Por que cada opcion (resumen):**

- `target: ES2022`: genera codigo compatible con Node.js 18+. Permite `async/await`, operador `??` y demas sin polyfills.
- `module: ESNext`: emite `import`/`export` nativos, coherente con `"type": "module"`.
- `moduleResolution: bundler`: modo moderno que funciona bien con ESM y con el SDK de MCP. Sin esta opcion, TypeScript puede quejarse de que no encuentra los modulos del SDK.
- `rootDir: src`: limita el codigo fuente al directorio `src/`.
- `outDir: dist`: el compilador escribe el JavaScript en `dist/`.
- `strict: true`: activa todas las comprobaciones de tipos. Captura errores antes de que lleguen a produccion.
- `esModuleInterop: true`: permite importar modulos CommonJS (como axios) con la sintaxis de ESM.
- `skipLibCheck: true`: no valida los `.d.ts` de las dependencias. Evita errores en paquetes de terceros.
- `types: ["node"]`: incluye solo los tipos de Node.js, sin contaminar con tipos de navegador.

**Error comun:** si omites `moduleResolution: bundler`, TypeScript no resolvera los paths del SDK de MCP y el compilador reportara errores de importacion aunque el paquete este instalado.

---

## Paso 4: Crear el cliente HTTP (client.ts)

Crea el fichero `src/client.ts`:

```typescript
import axios, { type AxiosInstance } from 'axios';

let currentToken: string | null = process.env.TIMER_API_TOKEN ?? null;
const BASE_URL = process.env.TIMER_API_URL ?? 'http://localhost:5000/';

function createAxiosInstance(): AxiosInstance {
  const instance = axios.create({
    baseURL: BASE_URL,
    timeout: 15_000,
    headers: { 'Content-Type': 'application/json' },
  });

  instance.interceptors.request.use((config) => {
    if (currentToken) {
      config.headers.Authorization = `Bearer ${currentToken}`;
    }
    return config;
  });

  return instance;
}

export const httpClient = createAxiosInstance();

export function setToken(token: string): void {
  currentToken = token;
  httpClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export function getToken(): string | null {
  return currentToken;
}
```

**Decisiones de diseno:**

El interceptor de request es la clave de este modulo. En lugar de pasar `{ headers: { Authorization: '...' } }` en cada llamada a `httpClient.get()` o `httpClient.post()`, el interceptor lo hace automaticamente. Si el token cambia (porque el usuario llama a `login`), todas las llamadas futuras usaran el nuevo token sin ninguna modificacion adicional.

`setToken` actualiza tanto la variable `currentToken` (que usa el interceptor) como `httpClient.defaults.headers.common['Authorization']` (que garantiza que peticiones que no pasan por el interceptor tambien tengan el header). Esto es redundante pero seguro.

El timeout de 15 segundos evita que el servidor MCP se bloquee indefinidamente si la REST API tarda en responder o esta caida.

---

## Paso 5: Crear el punto de entrada (index.ts)

Crea `src/index.ts` con la estructura basica:

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { httpClient, setToken } from './client.js';

const server = new McpServer({
  name: 'timer-api-server',
  version: '1.0.0',
});

// Aqui iran las herramientas

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[timer-mcp] Servidor MCP iniciado. Escuchando en stdio.');
}

main().catch((err) => {
  console.error('[timer-mcp] Error fatal:', err);
  process.exit(1);
});
```

**Por que `console.error` y no `console.log`?**

El canal de comunicacion MCP usa `stdout`. Si el servidor escribe en `stdout` fuera del protocolo (por ejemplo, con `console.log`), Claude Desktop puede interpretar esos bytes como parte del protocolo MCP y fallar. `console.error` escribe en `stderr`, que es un canal separado que Claude Desktop no procesa. Todos los logs de depuracion deben ir a `stderr`.

**Por que las importaciones del SDK terminan en `.js`?**

En ESM, las importaciones relativas y de paquetes deben incluir la extension. El SDK de MCP esta distribuido como `.js` compilado. TypeScript con `moduleResolution: bundler` permite importar `./client.js` aunque el fichero fuente sea `client.ts`.

---

## Paso 6: Implementar la funcion de formateo de errores

Antes de registrar herramientas, implementa la funcion que convierte cualquier error en una respuesta MCP valida. Aniadela en `index.ts` antes del primer `server.tool()`:

```typescript
function formatError(tool: string, error: unknown) {
  let detail = error instanceof Error ? error.message : 'Error desconocido';
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { status?: number; data?: unknown } }).response;
    if (response) {
      detail = `HTTP ${response.status ?? '?'}: ${JSON.stringify(response.data)}`;
    }
  }
  return {
    content: [{ type: 'text' as const, text: `[Error en ${tool}] ${detail}` }],
    isError: true,
  };
}
```

**Por que `error: unknown` y no `error: any`?**

TypeScript con `strict: true` no permite usar `error: any` en bloques `catch` sin una asercion explicita. `unknown` es mas seguro: obliga a comprobar el tipo antes de acceder a propiedades. La funcion hace esas comprobaciones de forma explícita (`instanceof Error`, `'response' in error`).

**Por que `type: 'text' as const`?**

El SDK de MCP espera que el campo `type` sea el literal `'text'`, no el tipo `string`. Sin `as const`, TypeScript infiere el tipo `string`, lo cual causa un error de tipos con la firma esperada por el SDK.

---

## Paso 7: Registrar la primera herramienta (login)

```typescript
server.tool(
  'login',
  'Autentica con la API de temporizadores y guarda el token JWT para las llamadas subsiguientes.',
  {
    userName: z.string().min(1).describe('Nombre de usuario'),
    password: z.string().min(1).describe('Contrasena'),
  },
  async ({ userName, password }) => {
    try {
      const { data } = await httpClient.post<unknown>('Auth/Login', { userName, password });
      const parsed = z.object({ response: z.string().min(1) }).parse(data);
      setToken(parsed.response);
      return { content: [{ type: 'text', text: 'Autenticacion correcta. Token guardado.' }] };
    } catch (error) {
      return formatError('login', error);
    }
  }
);
```

**Anatomia de `server.tool()`:**

1. **Nombre** (`'login'`): identificador unico en `snake_case`. Claude usa este nombre para decidir que herramienta invocar.
2. **Descripcion**: texto en lenguaje natural que Claude lee para entender el proposito de la herramienta. Una descripcion buena hace que Claude la invoque cuando corresponde y no la invoque cuando no corresponde.
3. **Esquema de parametros**: un objeto con un campo zod por cada parametro. El SDK de MCP traduce esto al formato JSON Schema que Claude entiende.
4. **Handler**: la funcion `async` que ejecuta la logica. Recibe los parametros ya deserializados y tipados, y devuelve el objeto de respuesta MCP.

**Por que validar la respuesta del login con zod?**

La herramienta `login` extrae el token del campo `response` del JSON devuelto por la API. Si la API cambia ese campo a `token` o `accessToken`, el servidor fallaria con un error de propiedad `undefined`. Con la validacion zod, el error es claro: `Expected string, received undefined at path "response"`.

---

## Paso 8: Implementar herramientas de solo lectura (patron GET)

Las herramientas de lectura son las mas simples. El patron es identico en todos los casos:

```typescript
server.tool('listar_salas', 'Devuelve la lista completa de salas fisicas.', {}, async () => {
  try {
    const { data } = await httpClient.get<unknown>('api/salas');
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  } catch (error) {
    return formatError('listar_salas', error);
  }
});
```

**Por que `<unknown>` en `httpClient.get<unknown>()`?**

axios infiere el tipo de la respuesta a partir del parametro de tipo. Si pusieramos un tipo concreto (por ejemplo, `Sala[]`), estariamos diciendole a TypeScript que confiamos en que la API devuelve exactamente ese tipo, sin verificacion en tiempo de ejecucion. Como no tenemos contrato formal, usamos `unknown` para forzar que cualquier acceso a `data` sea seguro o este explicitamente validado con zod.

**Por que `JSON.stringify(data, null, 2)`?**

El argumento `2` es el nivel de indentacion. Produce JSON formateado y legible que Claude puede procesar y resumir para el usuario. Sin indentacion, el JSON seria una cadena de texto compacta dificil de leer.

**Por que el esquema de parametros es `{}`?**

Las herramientas de listado no necesitan parametros. El SDK acepta un objeto vacio y registra la herramienta sin parametros en el catalogo MCP.

---

## Paso 9: Implementar herramientas de escritura (patron POST/PUT)

```typescript
server.tool(
  'crear_sala',
  'Crea una nueva sala fisica en el sistema.',
  { nombreSala: z.string().min(1).describe('Nombre de la nueva sala') },
  async ({ nombreSala }) => {
    try {
      await httpClient.post(`api/salas/createsala/${encodeURIComponent(nombreSala)}`);
      return { content: [{ type: 'text', text: `Sala "${nombreSala}" creada correctamente.` }] };
    } catch (error) {
      return formatError('crear_sala', error);
    }
  }
);
```

**Por que `encodeURIComponent`?**

El endpoint de creacion de salas recibe el nombre en el path de la URL (`/api/salas/createsala/{nombre}`), no en el body. Si el nombre contiene espacios o caracteres especiales (como `&`, `+`, `#`), el servidor web los interpretaria de forma incorrecta. `encodeURIComponent('Sala A')` produce `'Sala%20A'`, que el servidor decodifica correctamente. El cliente React original hace lo mismo.

**Por que no se valida la respuesta de creacion?**

Los endpoints de creacion de esta API devuelven un body vacio o un mensaje de texto simple. No hay datos estructurados que extraer. Si la llamada tiene exito (HTTP 2xx), axios no lanza error y se devuelve el mensaje de confirmacion. Si falla, axios lanza y `formatError` captura el error HTTP.

---

## Paso 10: Implementar eliminacion en cascada (patron DELETE con Promise.all)

La API no soporta eliminacion en cascada nativa. Si intentas borrar una Sala que tiene TES dependientes, la API devuelve un error de constraint de base de datos. El servidor MCP resuelve esto borrando primero los dependientes:

```typescript
server.tool(
  'eliminar_sala',
  'Elimina una sala y todas sus asignaciones TES dependientes en cascada.',
  { idSala: z.number().int().min(1).describe('ID de la sala a eliminar') },
  async ({ idSala }) => {
    try {
      // Paso 1: obtener todos los TES
      const { data } = await httpClient.get<unknown>('api/TiempoEmpresaSala');

      // Paso 2: validar y filtrar los que pertenecen a esta sala
      const tesList = z.array(z.object({ id: z.number(), idSala: z.number() })).parse(data);
      const ids = tesList.filter((t) => t.idSala === idSala).map((t) => t.id);

      // Paso 3: borrar todos los TES en paralelo
      await Promise.all(ids.map((id) => httpClient.delete(`api/TiempoEmpresaSala/${id}`)));

      // Paso 4: borrar la sala
      await httpClient.delete(`api/salas/${idSala}`);

      return {
        content: [{
          type: 'text',
          text: `Sala ${idSala} eliminada. ${ids.length} asignacion(es) TES eliminadas en cascada.`,
        }],
      };
    } catch (error) {
      return formatError('eliminar_sala', error);
    }
  }
);
```

**Por que `Promise.all` y no un bucle `for`?**

Un bucle `for` secuencial esperaria a que cada peticion DELETE terminara antes de enviar la siguiente. Si hay 10 TES que borrar, el tiempo de espera seria 10 veces el tiempo de una peticion. `Promise.all` lanza todas las peticiones a la vez y espera a que todas terminen, reduciendo el tiempo total al de la peticion mas lenta.

**Limitacion documentada:**

Si `Promise.all` falla a mitad (por ejemplo, la tercera DELETE falla), los TES anteriores ya se han borrado pero los posteriores no. La sala tampoco se borra. El resultado es un estado inconsistente: algunos TES huerfanos que apuntan a una sala que sigue existiendo. Esto es una limitacion conocida (deuda tecnica) que requeriria transacciones a nivel de API para resolverse correctamente.

---

## Paso 11: Gestion de errores (las 3 categorias)

La funcion `formatError` maneja tres tipos de error distintos:

```typescript
function formatError(tool: string, error: unknown) {
  let detail = error instanceof Error ? error.message : 'Error desconocido';

  // Categoria 2 y 3: el error tiene una respuesta HTTP
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { status?: number; data?: unknown } }).response;
    if (response) {
      detail = `HTTP ${response.status ?? '?'}: ${JSON.stringify(response.data)}`;
    }
  }

  return {
    content: [{ type: 'text' as const, text: `[Error en ${tool}] ${detail}` }],
    isError: true,
  };
}
```

**Categoria 1: Error de red o timeout**

Axios lanza un `Error` sin propiedad `response` cuando no puede conectar con el servidor (la URL es incorrecta, el servidor esta caido, hay timeout). En este caso, `error instanceof Error` es `true` y `'response' in error` es `false`. El mensaje es el que proporciona axios directamente.

**Categoria 2: Error HTTP 4xx**

La API responde, pero con un error del cliente (401 no autorizado, 404 no encontrado, 422 validacion). Axios lanza un error con `error.response.status` y `error.response.data`. El mensaje resultante es: `HTTP 401: {"message":"Token invalido"}`.

**Categoria 3: Error HTTP 5xx**

La API responde con un error del servidor (500 error interno). Mismo comportamiento que categoria 2.

**Por que `isError: true`?**

El protocolo MCP distingue entre respuestas exitosas y respuestas de error. Cuando `isError: true`, Claude sabe que la herramienta fallo y puede informar al usuario o intentar una accion alternativa. Si devolvieramos el error como texto plano sin `isError`, Claude podria interpretarlo como una respuesta exitosa y continuar incorrectamente.

---

## Paso 12: Variables de entorno

El servidor lee dos variables de entorno:

```typescript
// En client.ts
let currentToken: string | null = process.env.TIMER_API_TOKEN ?? null;
const BASE_URL = process.env.TIMER_API_URL ?? 'http://localhost:5000/';
```

El operador `??` (nullish coalescing) usa el valor de la derecha solo si el de la izquierda es `null` o `undefined`. `process.env.TIMER_API_TOKEN` es `undefined` si la variable no esta definida, por lo que `?? null` lo convierte a `null`.

---

## Paso 13: Compilar y ejecutar

**En desarrollo** (ejecuta TypeScript directamente sin compilar):

```bash
npm run dev
# tsx src/index.ts
```

**En produccion** (compila primero, luego ejecuta el JavaScript):

```bash
npm run build
# tsc -> genera dist/index.js

npm start
# node dist/index.js
```

**Verificar que el servidor funciona:**

El servidor escribe en stderr cuando arranca:

```
[timer-mcp] Servidor MCP iniciado. Escuchando en stdio.
```

Si no aparece ese mensaje, hay un error de importacion o de sintaxis. Los errores van a stderr y son visibles en la terminal donde se ejecuto el comando.

---

## Paso 14: Configurar Claude Desktop

Edita el fichero de configuracion de Claude Desktop. En Windows, se encuentra en:

```
%APPDATA%\Claude\claude_desktop_config.json
```

Anade el servidor MCP dentro del campo `mcpServers`:

```json
{
  "mcpServers": {
    "timer-api": {
      "command": "node",
      "args": ["C:\\ruta\\completa\\al\\proyecto\\dist\\index.js"],
      "env": {
        "TIMER_API_URL": "http://tu-servidor-api.com/",
        "TIMER_API_TOKEN": "tu-token-jwt-si-lo-tienes"
      }
    }
  }
}
```

**Por que usar `dist/index.js` y no `tsx src/index.ts`?**

En produccion, `tsx` no deberia estar en la maquina del usuario final. Ademas, ejecutar TypeScript al vuelo con `tsx` es mas lento que ejecutar el JavaScript compilado. El campo `command` puede ser `node` o la ruta completa a node, y `args` son los argumentos que se pasan al comando.

Reinicia Claude Desktop despues de modificar la configuracion.

---

## Paso 15: Probar con el Inspector MCP

El SDK de MCP incluye una herramienta de inspeccion que permite probar el servidor sin Claude Desktop. Ejecuta:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

El inspector abre una interfaz web donde puedes:

1. Ver el catalogo de herramientas registradas.
2. Invocar herramientas manualmente con parametros.
3. Ver la respuesta cruda del servidor.

Es la forma mas rapida de verificar que una herramienta nueva funciona antes de probarla desde Claude Desktop.
