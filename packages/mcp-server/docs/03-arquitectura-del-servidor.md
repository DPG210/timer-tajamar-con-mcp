# 03 — Arquitectura del servidor

## Estructura de archivos

```
timer-mcp-server/
├── src/
│   ├── index.ts      <-- Punto de entrada. Registra todas las herramientas y arranca el servidor.
│   └── client.ts     <-- Cliente HTTP. Gestiona el token JWT y crea la instancia de axios.
├── dist/             <-- Codigo JavaScript compilado (generado por tsc, no se edita a mano)
├── package.json
└── tsconfig.json
```

### Por que solo dos ficheros en src/

El diseno original previa separar las herramientas en ficheros por dominio (`tools/salas.ts`, `tools/empresas.ts`, etc.), un patron comun en proyectos grandes. Para este proyecto, con 24 herramientas relativamente simples y sin logica de negocio compleja, esa separacion habria creado indirecciones sin beneficio real: un lector del codigo habria tenido que saltar entre varios ficheros para entender algo tan basico como "que hace `eliminar_sala`".

La decision fue mantener todo en `index.ts` con secciones separadas por comentarios. Si el proyecto crece y se anaden dominios nuevos, la separacion en ficheros se puede aplicar en ese momento con una refactorizacion minima.

---

## Responsabilidad de cada modulo

### `src/client.ts` — El cliente HTTP

Este modulo tiene una responsabilidad unica: proporcionar una instancia de axios configurada con la URL base, el timeout, el header Content-Type y el interceptor de autenticacion.

```typescript
let currentToken: string | null = process.env.TIMER_API_TOKEN ?? null;
const BASE_URL = process.env.TIMER_API_URL ?? 'http://localhost:5000/';
```

El token se inicializa desde la variable de entorno `TIMER_API_TOKEN` si existe. Si no, empieza como `null` y las llamadas a la API fallaran con 401 hasta que se invoque la herramienta `login`.

La URL base se lee de `TIMER_API_URL`. El valor por defecto (`http://localhost:5000/`) asume que la REST API corre en la misma maquina. En un entorno real, esta variable se configura en Claude Desktop.

El modulo exporta tres cosas:

- `httpClient`: la instancia de axios lista para usar.
- `setToken(token)`: funcion que actualiza el token en memoria. La llama `index.ts` cuando el usuario hace `login`.
- `getToken()`: funcion que devuelve el token actual. No se usa internamente pero esta disponible para depuracion.

### `src/index.ts` — El servidor MCP

Este modulo hace todo lo demas. Sus responsabilidades son:

1. Crear el servidor MCP con su nombre y version.
2. Definir la funcion `formatError`, que convierte cualquier error en una respuesta MCP valida.
3. Registrar las 24 herramientas, agrupadas por dominio (Auth, Salas, Empresas, Categorias, Temporizadores, TES, Eventos).
4. Arrancar el servidor conectandolo al transporte stdio.

---

## Flujo completo de una llamada a herramienta

El siguiente diagrama muestra que ocurre desde que el usuario escribe hasta que Claude responde, usando `listar_salas` como ejemplo:

```
Usuario escribe en Claude Desktop:
"Cuales son las salas disponibles?"
          |
          v
+---------------------+
|   Claude (LLM)      |
|  Decide llamar a    |
|  'listar_salas'     |
|  sin parametros     |
+---------------------+
          |
          | JSON-RPC por stdin del proceso MCP
          | {
          |   "method": "tools/call",
          |   "params": {
          |     "name": "listar_salas",
          |     "arguments": {}
          |   }
          | }
          v
+---------------------+
|  McpServer (SDK)    |
|  Recibe el mensaje, |
|  busca la funcion   |
|  registrada para    |
|  'listar_salas'     |
+---------------------+
          |
          | Llama a la funcion anonima registrada
          v
+---------------------+
|  Funcion handler    |
|  en index.ts:       |
|                     |
|  httpClient         |
|  .get('api/salas')  |
+---------------------+
          |
          | HTTP GET con header
          | Authorization: Bearer <token>
          v
+---------------------+
|   REST API backend  |
|   Devuelve JSON:    |
|   [                 |
|     { id:1,         |
|       nombre:"A" }, |
|     ...             |
|   ]                 |
+---------------------+
          |
          | axios deserializa el JSON
          v
+---------------------+
|  Funcion handler    |
|  Formatea respuesta |
|  como texto JSON    |
|  indentado          |
+---------------------+
          |
          | JSON-RPC por stdout del proceso MCP
          | {
          |   "result": {
          |     "content": [{
          |       "type": "text",
          |       "text": "[\n  {\n    \"id\": 1,..."
          |     }]
          |   }
          | }
          v
+---------------------+
|  Claude Desktop     |
|  Lee la respuesta,  |
|  la pasa a Claude   |
+---------------------+
          |
          v
Claude responde al usuario:
"Hay 3 salas disponibles: Sala A (id: 1),
Sala B (id: 2) y Sala C (id: 3)."
```

---

## El patron de token JWT en memoria

### Como funciona

El token JWT se almacena como una variable de modulo en `client.ts`:

```typescript
let currentToken: string | null = process.env.TIMER_API_TOKEN ?? null;
```

Es una variable `let` en el scope del modulo. Cuando Node.js carga el modulo por primera vez, la variable se inicializa. Las llamadas posteriores a `setToken()` actualizan esa variable.

El interceptor de request de axios lee `currentToken` en cada peticion:

```typescript
instance.interceptors.request.use((config) => {
  if (currentToken) {
    config.headers.Authorization = `Bearer ${currentToken}`;
  }
  return config;
});
```

Esto significa que, una vez que el usuario llama a `login` y el token se guarda en memoria, todas las llamadas siguientes lo incluyen automaticamente. El usuario no tiene que proporcionar el token en cada herramienta.

### Por que en memoria y no en disco

**El servidor MCP es un proceso efimero.** Claude Desktop lo arranca cuando lo necesita y lo mata cuando cierra la ventana o reinicia. No hay un servidor siempre activo. Guardar el token en disco introduciria complejidad (gestion del fichero, permisos, limpieza) sin ningun beneficio real, porque el proceso vive exactamente lo que dura la sesion de Claude Desktop.

**El token se puede precargar desde la variable de entorno.** Si el operador configura `TIMER_API_TOKEN` en la configuracion de Claude Desktop, el servidor arranca ya autenticado y no necesita llamar a `login` en cada sesion. Esta es la forma recomendada en produccion.

### Por que no en Redis u otro cache externo

Redis es una solucion valida para compartir estado entre multiples instancias de un servidor. Este servidor MCP es un proceso unico, sin replicas, sin escalado horizontal. Introducir Redis habria sido una dependencia externa innecesaria (YAGNI: You Aren't Gonna Need It) que aumenta la complejidad de instalacion y mantenimiento sin resolver ningun problema real.

### Riesgo: el token expira

Si el token JWT tiene una caducidad corta y el servidor MCP esta corriendo durante horas, el token puede expirar y las llamadas a la API comenzaran a fallar con 401. La funcion `formatError` detecta esto y devuelve un mensaje que sugiere llamar a `login`:

```
[Error en listar_salas] HTTP 401: {"message":"Token invalido o expirado"}
```

La solucion a largo plazo seria implementar un refresh automatico del token, pero eso requiere que la REST API soporte refresh tokens. Documentado como deuda tecnica.
