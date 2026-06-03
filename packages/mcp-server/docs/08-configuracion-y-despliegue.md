# 08 — Configuracion y despliegue

---

## Variables de entorno

El servidor lee dos variables de entorno al arrancar. Ambas se leen en `src/client.ts`.

| Variable | Descripcion | Obligatorio | Valor por defecto | Ejemplo |
|---|---|---|---|---|
| `TIMER_API_URL` | URL base de la REST API. Debe terminar con `/`. | No | `http://localhost:5000/` | `http://192.168.1.10:5000/` |
| `TIMER_API_TOKEN` | Token JWT para autenticarse con la API desde el inicio. Si se configura, no es necesario llamar a la herramienta `login` al comenzar la sesion. | No | `null` (sin token) | `eyJhbGciOiJIUzI1NiJ9...` |

### Notas sobre `TIMER_API_URL`

La URL debe incluir el esquema (`http://` o `https://`), el host, el puerto si es diferente al estandar (80/443), y terminar con `/`. El cliente HTTP (axios) concatena los paths de los endpoints directamente despues de esta URL base. Si la URL no termina en `/`, los paths resultantes son incorrectos:

```
URL base: http://localhost:5000       + api/salas = http://localhost:5000api/salas  (INCORRECTO)
URL base: http://localhost:5000/      + api/salas = http://localhost:5000/api/salas (CORRECTO)
```

### Notas sobre `TIMER_API_TOKEN`

Si no se configura esta variable, el servidor arranca sin token. La primera herramienta que el usuario invoque que requiera autenticacion fallara con HTTP 401. El operador debe llamar a la herramienta `login` para obtener un token.

Si se configura con un token valido, el servidor arranca ya autenticado. Esta es la configuracion recomendada para produccion, siempre que el token tenga duracion suficiente para cubrir la sesion de trabajo.

---

## Configuracion de Claude Desktop

El fichero de configuracion de Claude Desktop se encuentra en:

- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

Para anadir el servidor MCP, edita el fichero JSON y anade una entrada dentro del objeto `mcpServers`. Si el fichero no existe, crealo con el siguiente contenido:

```json
{
  "mcpServers": {
    "timer-api": {
      "command": "node",
      "args": [
        "C:\\Users\\diego\\OneDrive\\Documentos\\Tajamar\\timer-mcp-server\\dist\\index.js"
      ],
      "env": {
        "TIMER_API_URL": "http://localhost:5000/",
        "TIMER_API_TOKEN": ""
      }
    }
  }
}
```

### Descripcion de cada campo

| Campo | Descripcion |
|---|---|
| `"timer-api"` | Nombre identificador del servidor MCP en Claude Desktop. Puede ser cualquier string sin espacios. |
| `command` | Ejecutable que Claude Desktop lanzara como proceso hijo. Debe ser `"node"` o la ruta completa a node.exe si no esta en el PATH. |
| `args` | Array de argumentos para el comando. El primer argumento es la ruta completa al fichero JavaScript compilado (`dist/index.js`). En Windows, usa barras invertidas dobles `\\` o barras normales `/`. |
| `env` | Objeto con las variables de entorno que Claude Desktop inyectara en el proceso del servidor MCP. |

### Ejemplo con la ruta real del proyecto

```json
{
  "mcpServers": {
    "timer-api": {
      "command": "node",
      "args": [
        "C:/Users/diego/OneDrive/Documentos/Tajamar/timer-mcp-server/dist/index.js"
      ],
      "env": {
        "TIMER_API_URL": "http://localhost:5000/",
        "TIMER_API_TOKEN": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ejemplo"
      }
    }
  }
}
```

### Como encontrar la ruta completa

En PowerShell, dentro del directorio del proyecto:

```powershell
(Resolve-Path "dist\index.js").Path
```

En Bash (Git Bash en Windows):

```bash
realpath dist/index.js
```

### Reiniciar Claude Desktop

Despues de modificar `claude_desktop_config.json`, **es necesario reiniciar Claude Desktop completamente** para que los cambios surtan efecto. En Windows, esto significa cerrar la aplicacion desde la bandeja del sistema (icono en la esquina inferior derecha), no solo cerrar la ventana.

---

## Comandos de desarrollo

### Instalar dependencias

```bash
npm install
```

Instala todas las dependencias declaradas en `package.json`. Necesario la primera vez y cada vez que se modifique `package.json`.

### Modo desarrollo (sin compilar)

```bash
npm run dev
```

Equivale a `tsx src/index.ts`. Ejecuta el TypeScript directamente usando esbuild. Util para probar cambios rapidamente. El servidor se queda escuchando en stdin; para probarlo manualmente, usa el Inspector MCP (ver mas abajo).

### Compilar para produccion

```bash
npm run build
```

Equivale a `tsc`. Lee `tsconfig.json` y compila `src/index.ts` y `src/client.ts` a JavaScript en `dist/`. Si hay errores de tipos, el compilador los reporta y no genera output.

El directorio `dist/` debe existir o el compilador lo crea. Si hay ficheros obsoletos en `dist/` de compilaciones anteriores, el compilador no los borra automaticamente; hay que borrar `dist/` manualmente si es necesario.

### Ejecutar el servidor compilado

```bash
npm start
```

Equivale a `node dist/index.js`. El servidor arranca, escribe en stderr el mensaje de confirmacion y queda esperando mensajes por stdin. En uso normal, Claude Desktop gestiona el proceso; este comando es util para verificar que el servidor arranca sin errores.

---

## Verificacion del arranque

### Verificar que el servidor arranca correctamente

Ejecuta el servidor en una terminal:

```bash
npm start
```

Debe aparecer en la terminal (en stderr):

```
[timer-mcp] Servidor MCP iniciado. Escuchando en stdio.
```

Si no aparece ese mensaje o aparece un error, los problemas mas comunes son:

| Error | Causa probable | Solucion |
|---|---|---|
| `Cannot find module ...` | La dependencia no esta instalada o la ruta de importacion es incorrecta | `npm install` y verificar las importaciones en el codigo fuente |
| `SyntaxError: ...` | Error de compilacion no detectado | `npm run build` y revisar los errores del compilador |
| `ERR_UNKNOWN_FILE_EXTENSION` | Node.js no reconoce el fichero como ESM | Verificar que `"type": "module"` esta en `package.json` |
| `ECONNREFUSED` en la primera llamada | La REST API no esta accesible en la URL configurada | Verificar `TIMER_API_URL` y que el backend esta corriendo |

### Probar con el Inspector MCP

El Inspector MCP es una herramienta oficial de Anthropic para probar servidores MCP sin necesidad de Claude Desktop:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

El inspector abre el navegador en `http://localhost:5173` con una interfaz donde puedes:

1. Ver la lista de herramientas registradas con sus parametros.
2. Invocar cualquier herramienta con los valores que elijas.
3. Ver la respuesta cruda del servidor.

Es la forma mas rapida de verificar que una herramienta nueva funciona antes de probarla desde Claude Desktop.

Para pasar variables de entorno al servidor durante la inspeccion:

```bash
TIMER_API_URL=http://localhost:5000/ TIMER_API_TOKEN=tu-token npx @modelcontextprotocol/inspector node dist/index.js
```

En PowerShell:

```powershell
$env:TIMER_API_URL = "http://localhost:5000/"
$env:TIMER_API_TOKEN = "tu-token"
npx @modelcontextprotocol/inspector node dist/index.js
```

### Verificar en Claude Desktop

Una vez configurado el servidor en `claude_desktop_config.json` y reiniciado Claude Desktop, abre una nueva conversacion y escribe:

```
Lista todas las salas disponibles
```

Si el servidor MCP esta funcionando, Claude invocara la herramienta `listar_salas` y mostrara el resultado. Si hay un error de conexion con la API, Claude mostrara el mensaje de error de la herramienta.

Para ver los logs del servidor MCP en Claude Desktop, busca el icono de herramientas en la interfaz (generalmente en la parte inferior de la ventana de chat) que indica que herramientas estan disponibles y si hay errores de conexion.

---

## Flujo completo desde instalacion hasta uso

```
1. git clone / copiar el proyecto
        |
        v
2. npm install
        |
        v
3. npm run build
        |
        v
4. Editar claude_desktop_config.json
   con la ruta a dist/index.js
   y las variables de entorno
        |
        v
5. Reiniciar Claude Desktop
        |
        v
6. Abrir conversacion en Claude Desktop
        |
        v
7. Escribir "login" si no se configuro
   TIMER_API_TOKEN, o empezar a usar
   las herramientas directamente
```
