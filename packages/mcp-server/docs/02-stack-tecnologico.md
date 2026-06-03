# 02 — Stack tecnologico

Este documento explica cada tecnologia del proyecto, por que se eligio y que problema concreto resuelve.

---

## Node.js

### Que es

Node.js es un entorno de ejecucion de JavaScript en el servidor, construido sobre el motor V8 de Chrome. Permite escribir logica de servidor en JavaScript (o TypeScript) sin necesidad de un lenguaje diferente al que se usa en el frontend.

### Por que se eligio

El SDK oficial de MCP (`@modelcontextprotocol/sdk`) esta publicado como paquete npm y esta disenado para Node.js. Usar cualquier otro entorno de ejecucion (Deno, Bun, un runtime de otro lenguaje) habria requerido adaptar o portar el SDK, lo cual introduce complejidad innecesaria.

Ademas, este servidor MCP es fundamentalmente un proceso de I/O: recibe mensajes por stdin, hace peticiones HTTP y escribe respuestas por stdout. Node.js esta especialmente optimizado para I/O no bloqueante, lo cual es exactamente el patron de uso de este servidor.

### Que alternativas se descartaron

Un servidor MCP puede implementarse en cualquier lenguaje que pueda leer/escribir JSON por stdio. Existen SDKs oficiales para Python, Kotlin y TypeScript/Node.js. Python habria sido una alternativa valida, pero el ecosistema de tipado estatico (mypy, pyright) es menos maduro que TypeScript para proyectos de este tamano. Se eligio Node.js + TypeScript por la combinacion de SDK oficial, tipado nativo y ecosistema de herramientas.

---

## TypeScript

### Que es

TypeScript es un superconjunto de JavaScript que anade un sistema de tipos estatico. El codigo TypeScript se compila a JavaScript estandar antes de ejecutarse. Los tipos desaparecen en tiempo de ejecucion; lo que aportan es seguridad durante el desarrollo.

### Por que se eligio

El servidor MCP maneja multiples estructuras de datos: el esquema de cada herramienta, el formato de los mensajes del protocolo, las respuestas de la REST API. Sin tipos, un error tan simple como escribir `idTimer` cuando la propiedad se llama `idTemporizador` no se detecta hasta que el codigo falla en produccion. Con TypeScript en modo estricto, ese error se detecta en el momento de escribirlo.

El SDK de MCP esta escrito en TypeScript y exporta tipos completos. Usarlo desde TypeScript permite que el editor complete los nombres de los metodos, infiera los tipos de retorno y avise si se usa mal la API del SDK.

### Configuracion de tsconfig.json explicada

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

| Opcion | Valor | Por que |
|---|---|---|
| `target` | `ES2022` | Permite usar `async/await`, `??`, `?.` y otras caracteristicas modernas sin transpilacion extra. Node.js 18+ soporta ES2022 de forma nativa. |
| `module` | `ESNext` | Genera codigo con `import`/`export` nativos (ESM), coherente con `"type": "module"` en package.json. |
| `moduleResolution` | `bundler` | Modo de resolucion moderno que permite importar sin extension `.js` en el fuente TypeScript y que el compilador infiera la extension correcta. Es el modo que recomienda el SDK de MCP. |
| `rootDir` | `src` | El codigo fuente vive en `src/`. El compilador falla si se importa algo de fuera de esa carpeta. |
| `outDir` | `dist` | El JavaScript compilado se emite en `dist/`. El campo `main` del package.json apunta a `dist/index.js`. |
| `strict` | `true` | Activa todas las comprobaciones de strictness: `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, etc. Captura mas errores en compilacion. |
| `esModuleInterop` | `true` | Permite importar modulos CommonJS (como axios) con la sintaxis `import axios from 'axios'` en lugar de `import * as axios from 'axios'`. |
| `skipLibCheck` | `true` | No valida los `.d.ts` de las dependencias. Evita errores de tipo en paquetes de terceros mal tipados. |
| `types` | `["node"]` | Incluye los tipos de la API de Node.js (`process.env`, `console`, etc.) sin que TypeScript incluya tipos del navegador que no existen en Node. |

---

## @modelcontextprotocol/sdk

### Que es

El SDK oficial de Anthropic para construir servidores MCP en TypeScript/Node.js. Proporciona la clase `McpServer`, que gestiona el protocolo de mensajes, el registro de herramientas y el ciclo de vida del servidor. Tambien proporciona `StdioServerTransport`, que conecta el servidor al canal stdio.

### Por que se eligio

Es la implementacion de referencia del protocolo. Usarlo garantiza compatibilidad con Claude Desktop y con cualquier otro cliente MCP que siga la especificacion. Implementar el protocolo MCP a mano seria posible (es JSON sobre stdio), pero innecesario y propenso a errores en los detalles del protocolo (negociacion de capacidades, formato de errores, tipos de contenido en las respuestas).

### Como se usa en este proyecto

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new McpServer({
  name: 'timer-api-server',
  version: '1.0.0',
});

// Registrar una herramienta
server.tool('nombre_herramienta', 'descripcion', { parametros }, async (args) => {
  return { content: [{ type: 'text', text: 'respuesta' }] };
});

// Conectar al transporte
const transport = new StdioServerTransport();
await server.connect(transport);
```

El metodo `server.tool()` recibe cuatro argumentos: nombre, descripcion, esquema de parametros (un objeto Zod) y la funcion que ejecuta la logica. El SDK se encarga del resto: serializar el catalogo de herramientas, recibir las llamadas, deserializar los argumentos y serializar las respuestas.

---

## axios

### Que es

axios es una libreria para hacer peticiones HTTP desde Node.js (y tambien desde el navegador). Es la libreria HTTP mas usada en el ecosistema JavaScript, con soporte para interceptores, timeout, transformacion automatica de JSON y gestion estructurada de errores.

### Por que se eligio sobre la alternativa nativa (fetch)

Node.js 18+ incluye `fetch` de forma nativa. Sin embargo, axios ofrece dos ventajas concretas para este proyecto:

**Interceptores de request**: axios permite registrar una funcion que se ejecuta antes de cada peticion. En este proyecto, ese interceptor aniade el header `Authorization: Bearer <token>` automaticamente, sin tener que pasarlo manualmente en cada llamada a herramienta.

```typescript
instance.interceptors.request.use((config) => {
  if (currentToken) {
    config.headers.Authorization = `Bearer ${currentToken}`;
  }
  return config;
});
```

Con `fetch` nativo se habria tenido que pasar el header en cada llamada o construir una funcion wrapper a mano.

**Gestion de errores estructurada**: cuando la REST API devuelve un HTTP 4xx o 5xx, axios lanza un error con la propiedad `error.response` que contiene el status y el body. Esto permite distinguir entre "la API respondio con error" (hay `response`) y "no se pudo conectar" (no hay `response`). Con `fetch` nativo, una respuesta 4xx no lanza error por defecto; hay que comprobar `response.ok` manualmente.

### Configuracion usada

```typescript
const instance = axios.create({
  baseURL: BASE_URL,    // URL base de la REST API
  timeout: 15_000,      // 15 segundos de timeout
  headers: { 'Content-Type': 'application/json' },
});
```

El timeout de 15 segundos evita que una herramienta se quede colgada indefinidamente si la REST API no responde.

---

## zod

### Que es

zod es una libreria de validacion de esquemas para TypeScript. Permite definir la forma esperada de un objeto y validar datos en tiempo de ejecucion, generando errores descriptivos si los datos no coinciden con el esquema.

### Por que se eligio

La REST API de este proyecto no tiene un contrato formal publicado (no hay un fichero OpenAPI/Swagger que garantice el formato de las respuestas). Esto significa que si el backend cambia la estructura de una respuesta (renombra un campo, cambia un tipo), el servidor MCP fallaria en tiempo de ejecucion con un error confuso.

Con zod, el servidor valida las respuestas criticas antes de usarlas:

```typescript
// En login: validar que la respuesta tiene { response: string }
const parsed = z.object({ response: z.string().min(1) }).parse(data);
setToken(parsed.response);

// En eliminacion en cascada: validar que el array TES tiene la forma esperada
const tesList = z.array(z.object({ id: z.number(), idSala: z.number() })).parse(data);
```

Si el backend devuelve un formato inesperado, zod lanza un `ZodError` con un mensaje que describe exactamente que campo falla y por que. Esto convierte un error opaco en un mensaje diagnosticable.

### Por que zod y no JSON Schema, io-ts, o validacion manual

zod es la libreria de validacion mas adoptada en el ecosistema TypeScript moderno. Su API es ergonomica y sus mensajes de error son legibles. `io-ts` es mas potente pero mas verboso. La validacion manual es propensa a olvidos. JSON Schema requiere un validador externo adicional. El SDK de MCP usa zod internamente para los esquemas de herramientas, por lo que ya era una dependencia transitiva del proyecto.

---

## tsx

### Que es

`tsx` es una herramienta de desarrollo que permite ejecutar ficheros TypeScript directamente con Node.js, sin compilar primero. Funciona como un wrapper sobre Node.js que transpila TypeScript al vuelo usando esbuild.

### Por que se usa solo en desarrollo

En produccion, el servidor se compila con `tsc` y se ejecuta con `node dist/index.js`. La compilacion previa garantiza que el codigo que se ejecuta es exactamente el que se ha revisado y que no hay sorpresas de transpilacion en tiempo de arranque.

En desarrollo, compilar antes de cada prueba seria lento. `tsx` permite ejecutar `npm run dev` y ver el resultado inmediatamente:

```json
"scripts": {
  "dev": "tsx src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js"
}
```

`tsx` es una `devDependency`: no se incluye en el paquete de produccion.

---

## Tabla comparativa de alternativas descartadas

| Tecnologia elegida | Alternativa descartada | Razon del descarte |
|---|---|---|
| Node.js | Python | SDK de MCP para Python existe, pero el ecosistema de tipos y herramientas para proyectos pequeños es menos ergonomico |
| Node.js | Deno / Bun | Compatibilidad no garantizada con el SDK de MCP en el momento del desarrollo |
| TypeScript | JavaScript puro | Sin tipos no se detectan errores como propiedades mal escritas o tipos incorrectos en los parametros de herramientas |
| axios | fetch nativo | fetch no tiene interceptores de request; los errores HTTP no se lanzan automaticamente |
| axios | node-fetch | Libreria wrapper obsoleta; fetch nativo de Node 18+ la sustituye, pero ambas pierden ante axios en ergonomia para este caso |
| zod | Validacion manual | Propensa a olvidos; los mensajes de error son menos descriptivos |
| zod | io-ts | API mas verbosa; curva de aprendizaje mayor para un proyecto de este tamano |
| tsx | ts-node | tsx es mas rapido (usa esbuild internamente) y tiene mejor compatibilidad con ESM |
| StdioTransport | SSE Transport | SSE requiere un servidor HTTP adicional; stdio es suficiente para Claude Desktop y es mas simple |
