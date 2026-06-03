# Inventario de Endpoints API

## Configuración base

| Parámetro | Valor actual (producción) | Valor alternativo (comentado) |
|---|---|---|
| REST base URL | `https://apitimerstesting.azurewebsites.net/` | `https://localhost:7004/` |
| WebSocket URL | `https://timertajamarback.azurewebsites.net/` | `https://syncserver-production.up.railway.app/` / `http://localhost:3002/` |

La URL base se concatena directamente con la ruta en cada método de `service.js`, sin ningún cliente axios configurado centralmente.

---

## Endpoints REST

### Autenticación

| # | Método | Path | Descripción | Request body | Response body |
|---|---|---|---|---|---|
| 1 | POST | `Auth/Login` | Obtener JWT | `{ userName: string, password: string }` | `{ response: string }` (el token es `response.data.response`) |

Notas:
- No hay prefijo `api/` en este endpoint.
- Un error 401 muestra un Swal de "Acceso denegado". Cualquier otro error se loguea por consola sin notificar al usuario.

---

### Salas (`api/salas`)

| # | Método | Path | Descripción | Params URL | Request body | Response body |
|---|---|---|---|---|---|---|
| 2 | GET | `api/salas` | Listar todas las salas | — | — | `Sala[]` |
| 3 | GET | `api/salas/:idsala` | Obtener una sala por ID | `idsala: number` | — | `Sala` |
| 4 | POST | `api/salas/createsala/:nombreSala` | Crear sala | `nombreSala: string` | — | Response HTTP |
| 5 | PUT | `api/salas/updatesala/:idSala/:nombreSala` | Renombrar sala | `idSala: number`, `nombreSala: string` | — | Response HTTP |
| 6 | DELETE | `api/salas/:idSala` | Eliminar sala | `idSala: number` | — | Response HTTP |

Notas:
- Los endpoints de creación y actualización de sala pasan los datos como segmentos de URL, no en el body. Esto es inusual y puede causar problemas con nombres que contengan caracteres especiales (espacios, tildes, `/`).

---

### Empresas (`api/empresas`)

| # | Método | Path | Descripción | Params URL | Request body | Response body |
|---|---|---|---|---|---|---|
| 7 | GET | `api/empresas` | Listar todas las empresas | — | — | `Empresa[]` |
| 8 | GET | `api/empresas/:idempresa` | Obtener una empresa por ID | `idempresa: number` | — | `Empresa` |
| 9 | POST | `api/empresas/createempresa/:nombreEmpresa` | Crear empresa | `nombreEmpresa: string` | — | Response HTTP |
| 10 | PUT | `api/empresas/updateempresa/:idEmpresa/:nombreEmpresa` | Renombrar empresa | `idEmpresa: number`, `nombreEmpresa: string` | — | Response HTTP |
| 11 | DELETE | `api/empresas/:idEmpresa` | Eliminar empresa | `idEmpresa: number` | — | Response HTTP |

Notas:
- Mismo patrón de parámetros en URL que las salas. El mismo problema con caracteres especiales aplica.

---

### Temporizadores (`api/timers`)

| # | Método | Path | Descripción | Params URL | Request body | Response body |
|---|---|---|---|---|---|---|
| 12 | GET | `api/timers` | Listar todos los temporizadores | — | — | `Temporizador[]` |
| 13 | POST | `api/timers` | Crear temporizador | — | `Temporizador` (sin id) | Response HTTP |
| 14 | PUT | `api/timers` | Actualizar temporizador | — | `Temporizador` (con id) | Response HTTP |
| 15 | DELETE | `api/timers/:idTimer` | Eliminar temporizador | `idTimer: number` | — | Response HTTP |
| 16 | PUT | `api/timers/increasetimers/:minutes` | Incrementar todos los timers en N minutos | `minutes: number` | — | Response HTTP |

Notas:
- Los endpoints POST y PUT comparten la misma URL base `api/timers`; el backend distingue por método HTTP.
- Tras POST, PUT y DELETE se emite el evento WebSocket `syncData`.
- El endpoint `increasetimers` fue usado en `Horario.js` y está comentado en la UI; sin embargo el método `updateIncreaseTimers` permanece activo en el servicio.

---

### Categorias (`api/categoriastimer`)

| # | Método | Path | Descripción | Params URL | Request body | Response body |
|---|---|---|---|---|---|---|
| 17 | GET | `api/categoriastimer` | Listar todas las categorías | — | — | `Categoria[]` |
| 18 | GET | `api/categoriastimer/:idcategoria` | Obtener una categoría por ID | `idcategoria: number` | — | `Categoria` |
| 19 | POST | `api/categoriastimer` | Crear categoría | — | `Categoria` (sin id) | Response HTTP |
| 20 | PUT | `api/categoriastimer` | Actualizar categoría | — | `Categoria` (con id) | Response HTTP |
| 21 | DELETE | `api/categoriastimer/:idcategoria` | Eliminar categoría | `idcategoria: number` | — | Response HTTP |

Notas:
- Tras POST, PUT y DELETE se emite el evento WebSocket `syncData`.

---

### TiempoEmpresaSala — TES (`api/TiempoEmpresaSala`)

| # | Método | Path | Descripción | Params URL | Request body | Response body |
|---|---|---|---|---|---|---|
| 22 | GET | `api/TiempoEmpresaSala` | Listar todas las asignaciones | — | — | `TES[]` |
| 23 | POST | `api/TiempoEmpresaSala` | Crear asignación empresa-sala-timer | — | `TES` (sin id) | Response HTTP |
| 24 | DELETE | `api/TiempoEmpresaSala/:idTES` | Eliminar asignación | `idTES: number` | — | Response HTTP |

Notas:
- No existe endpoint PUT para TES. La actualización se realiza borrando y creando de nuevo.
- `TES` es la entidad pivote que une un timer, una empresa y una sala.

---

### TimerEventos (`api/timereventos`)

| # | Método | Path | Descripción | Params URL | Request body | Response body |
|---|---|---|---|---|---|---|
| 25 | GET | `api/timereventos` | Listar todos los timer-eventos | — | — | `TimerEvento[]` |
| 26 | GET | `api/timereventos/empresastimers` | Listar empresas que tienen timers asignados | — | — | `Empresa[]` |
| 27 | GET | `api/timereventos/eventosactualesempresa/:idempresa` | Eventos actuales y siguientes de una empresa | `idempresa: number` | — | `EventoActual[]` |
| 28 | GET | `api/timereventos/eventosempresa/:idempresa` | Todos los eventos de una empresa | `idempresa: number` | — | `EventoActual[]` |
| 29 | GET | `api/timereventos/eventossala/:idsala` | Eventos de una sala | `idsala: number` | — | `EventoActual[]` |

Notas:
- Estos endpoints son de solo lectura. Los métodos `findTimersEventosSala` y `getTimersEventos` están definidos en el servicio pero no se han encontrado en uso activo en ningún componente del código actual.
- `eventosactualesempresa` es el endpoint más complejo: devuelve una proyección enriquecida que incluye `empresa`, `sala`, `inicioTimer`, `idCategoria`, `duracion`, `imagenEmpresa`.

---

## Eventos WebSocket

La conexión WebSocket se establece contra `Global.SocketUrl` con `{ withCredentials: true }`.

### Eventos emitidos por el cliente (emit)

| Evento | Emitido desde | Descripción |
|---|---|---|
| `syncData` | `service.js` (postTemporizador, putTemporizador, deleteTemporizador, updateIncreaseTimers, postCategoria, putCategoria, deleteCategoria) | Notifica al servidor que los datos han cambiado para que propague a todos los clientes conectados |
| `start` | `Login.js` (resetEmergency, comentado en UI) | Reseteo de emergencia de la base de datos |
| `vamos` | `Login.js` (startTimers) | Inicia el evento / cuenta atrás |

### Eventos recibidos por el cliente (on)

| Evento | Recibido en | Descripción | Payload |
|---|---|---|---|
| `timerID` | `TimerView.js` | Notifica qué temporizador está activo en este momento | `idTimer: number` |
| `envio` | `Tiempo.js` | Envía el tiempo restante en segundos del temporizador activo | `num: number` (segundos) |

### Problema de instancias múltiples

La conexión WebSocket se crea con `io(...)` a nivel de módulo (fuera del componente) en los siguientes archivos:

- `src/services/service.js`
- `src/components/Login.js`
- `src/components/TimerView.js`
- `src/components/Tiempo.js`

Esto produce al menos 4 conexiones WebSocket simultáneas abiertas desde un mismo cliente, aunque socket.io-client puede reutilizar la misma conexión si la URL y las opciones coinciden exactamente. En este caso las opciones son idénticas (`{ withCredentials: true }`), por lo que socket.io-client puede o no deduplicar según su versión y el entorno. En producción se han observado comportamientos inconsistentes con múltiples listeners duplicados.
