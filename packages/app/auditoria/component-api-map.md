# Mapa Componente → Servicio → Endpoint

Convenciones:
- `currentService` es siempre una instancia de `new service()` creada como campo de clase.
- Los métodos del servicio que emiten `syncData` se marcan con `[WS]`.
- Los componentes que también emiten eventos WebSocket directamente (sin pasar por el servicio) se marcan con `[WS-directo]`.

---

## Login

**Ruta:** `/login`
**Propósito:** Autenticación del administrador. Tras login muestra botones de gestión. También contiene controles de evento (inicio, reseteo de emergencia).

| Método del componente | Función del servicio | Endpoint | Notas |
|---|---|---|---|
| `setLogin()` | `generateToken(user, password)` | POST `Auth/Login` | Guarda `result.response` en `localStorage.setItem("token", ...)` |
| `signout()` | — | — | Solo hace `localStorage.clear()` y setState |
| `resetEmergency()` | — | — | `[WS-directo]` emite `socket.emit("start")` — botón comentado en UI |
| `startTimers()` | — | — | `[WS-directo]` emite `socket.emit("vamos")` |

---

## TimerView

**Ruta:** `/` (pantalla principal)
**Propósito:** Muestra el temporizador actual, la sala activa, la empresa que habla, y los dos próximos turnos.

| Método del componente | Función del servicio | Endpoint | Notas |
|---|---|---|---|
| `componentDidMount` → `getSalas()` | `getSalas()` | GET `api/salas` | Carga la primera sala al montar |
| `changeRoom()` → `getTemporizadores()` | `getTemporizadores()` | GET `api/timers` | Recarga timers al cambiar sala |
| `checkCompany()` | `getTES()` | GET `api/TiempoEmpresaSala` | Comprueba si hay empresa hablando en este momento |
| `checkCompany()` → `getCompanyName()` | `getEmpresa(idempresa)` | GET `api/empresas/:id` | Obtiene nombre de empresa actual |
| `getLineName()` | `getTES()` | GET `api/TiempoEmpresaSala` | Obtiene qué empresa tiene el timer dado en esta sala |
| `getLineName()` → (condicional) | `getEmpresa(idcompany)` | GET `api/empresas/:id` | Obtiene nombre de empresa del timer siguiente |
| `getCategoryName()` | `getCategoria(idcategoria)` | GET `api/categoriastimer/:id` | Obtiene nombre de categoría del timer siguiente |

Nota: `checkCompany()` y `getLineName()` llaman a `getTES()` por separado. Esto provoca dos peticiones GET redundantes al mismo endpoint en cada cambio de `timerID`.

Subcomponentes renderizados:
- `SalaPopUp` — se muestra al pulsar el botón de sala
- `Tiempo` — siempre visible en el header y cuerpo
- `HorarioEmpresaPopUp` — comentado en el render, nunca se muestra

---

## Horario

**Ruta:** `/horario`
**Propósito:** Vista de tabla del horario completo por sala. Permite asignar/desasignar empresas a cada slot (si hay token).

| Método del componente | Función del servicio | Endpoint | Notas |
|---|---|---|---|
| `loadRooms()` | `getSalas()` | GET `api/salas` | — |
| `loadTimers()` | `getTemporizadores()` | GET `api/timers` | Ordena por `inicio` tras recibir |
| `loadCategories()` | `getCategorias()` | GET `api/categoriastimer` | — |
| `loadCompanies()` | `getEmpresas()` | GET `api/empresas` | — |
| `loadTiemposEmpresasSalas()` | `getTES()` | GET `api/TiempoEmpresaSala` | — |
| `createTES()` | `postTES(newRegister)` | POST `api/TiempoEmpresaSala` | newRegister: `{ id:0, idTimer, idEmpresa, idSala, idEvento:1 }` |
| `deleteTES()` | `deleteTES(idTes)` | DELETE `api/TiempoEmpresaSala/:id` | — |
| `iniciarEventoTimers()` | `updateIncreaseTimers(2)` `[WS]` | PUT `api/timers/increasetimers/2` | Botón comentado en UI; el método permanece activo |

---

## Salas

**Ruta:** `/salas`
**Propósito:** CRUD de salas.

| Método del componente | Función del servicio | Endpoint | Notas |
|---|---|---|---|
| `loadRooms()` | `getSalas()` | GET `api/salas` | — |
| `generateRoom()` | `postSala(nombreSala)` | POST `api/salas/createsala/:nombre` | nombre pasa en URL |
| `modifyRoom()` (confirm) | `putSala(idSala, nombreSala)` | PUT `api/salas/updatesala/:id/:nombre` | Solo si el nombre cambió |
| `modifyRoom()` (deny) | `getTES()` | GET `api/TiempoEmpresaSala` | Pre-check antes de borrar |
| `modifyRoom()` (deny) | `deleteTES(registro.id)` (loop) | DELETE `api/TiempoEmpresaSala/:id` | Borra dependencias primero |
| `modifyRoom()` (deny) | `deleteSala(idSala)` | DELETE `api/salas/:id` | Tras borrar TES dependientes |

---

## Empresas

**Ruta:** `/empresas`
**Propósito:** CRUD de empresas.

| Método del componente | Función del servicio | Endpoint | Notas |
|---|---|---|---|
| `loadCompanies()` | `getEmpresas()` | GET `api/empresas` | — |
| `generateCompany()` | `postEmpresa(nombreEmpresa)` | POST `api/empresas/createempresa/:nombre` | nombre en URL |
| `modifyCompany()` (confirm) | `putEmpresa(idEmpresa, nombre)` | PUT `api/empresas/updateempresa/:id/:nombre` | Solo si nombre cambió |
| `modifyCompany()` (deny) | `getTES()` | GET `api/TiempoEmpresaSala` | Pre-check antes de borrar |
| `modifyCompany()` (deny) | `deleteTES(registro.id)` (loop) | DELETE `api/TiempoEmpresaSala/:id` | Borra dependencias |
| `modifyCompany()` (deny) | `deleteEmpresa(idEmpresa)` | DELETE `api/empresas/:id` | Tras borrar TES |

---

## Categorias

**Ruta:** `/categorias`
**Propósito:** CRUD de categorías. Incluye validación de solapamiento de timers antes de aumentar duración.

| Método del componente | Función del servicio | Endpoint | Notas |
|---|---|---|---|
| `loadcategories()` | `getCategorias()` | GET `api/categoriastimer` | — |
| `generateCategories()` | `postCategoria(newCategory)` `[WS]` | POST `api/categoriastimer` | body: `{ idCategoria:0, categoria, duracion }` |
| `ejecutarPutCategoria()` | `putCategoria(newCategory)` `[WS]` | PUT `api/categoriastimer` | body: `{ idCategoria, categoria, duracion }` |
| `modifyCategory()` (confirm, duración aumenta) | `getTemporizadores()` | GET `api/timers` | Pre-check solapamiento |
| `ejecutarDeleteCategoria()` | `deleteCategoria(idcategoria)` `[WS]` | DELETE `api/categoriastimer/:id` | — |
| `modifyCategory()` (deny) | `getTemporizadores()` | GET `api/timers` | Pre-check antes de borrar categoría |
| `modifyCategory()` (deny, hay TES) | `getTES()` | GET `api/TiempoEmpresaSala` | — |
| `modifyCategory()` (deny) | `deleteTES(registro.id)` (loop) `[WS implícito]` | DELETE `api/TiempoEmpresaSala/:id` | Sin syncData en deleteTES |
| `modifyCategory()` (deny) | `deleteTemporizador(timer.id)` `[WS]` | DELETE `api/timers/:id` | — |

---

## Temporizadores

**Ruta:** `/temporizadores`
**Propósito:** CRUD de temporizadores. Incluye validación de solapamiento de rangos horarios.

| Método del componente | Función del servicio | Endpoint | Notas |
|---|---|---|---|
| `loadTimers()` | `getTemporizadores()` | GET `api/timers` | Ordena por `inicio` tras recibir |
| `loadCategories()` | `getCategorias()` | GET `api/categoriastimer` | Para mostrar nombre y calcular fin |
| `generateTimer()` (sin solapamiento) | `postTemporizador(newTimer)` `[WS]` | POST `api/timers` | body: `{ idTemporizador:0, inicio, idCategoria, pausa:false }` |
| `modifyTimer()` (confirm, sin solapamiento) | `putTemporizador(newTimer)` `[WS]` | PUT `api/timers` | body: `{ idTemporizador, inicio, idCategoria, pausa:false }` |
| `modifyTimer()` (deny) | `getTES()` | GET `api/TiempoEmpresaSala` | Pre-check antes de borrar |
| `modifyTimer()` (deny) | `deleteTES(registro.id)` (loop) | DELETE `api/TiempoEmpresaSala/:id` | Sin syncData |
| `modifyTimer()` (deny) | `deleteTemporizador(idTimer)` `[WS]` | DELETE `api/timers/:id` | — |

---

## EmpresasEventoTimers (ruta comentada)

**Ruta:** `/empresastimers` — comentada en Router.js, no accesible por navegación normal.

| Método del componente | Función del servicio | Endpoint |
|---|---|---|
| `loadEmpresasTimer()` | `getEmpresasTimers()` | GET `api/timereventos/empresastimers` |
| `findTiemposEmpresa()` | `findTimersEventosEmpresa(id)` | GET `api/timereventos/eventosempresa/:id` |
| `findTiemposActualesEmpresa()` | `findTimersActualesEmpresa(id)` | GET `api/timereventos/eventosactualesempresa/:id` |

---

## EmpresasEventoTimersNew

**Ruta:** `/empresastimersnew`
**Propósito:** Vista de seguimiento de empresas. Al pulsar una empresa, muestra un Swal con su horario.

| Método del componente | Función del servicio | Endpoint |
|---|---|---|
| `loadEmpresasTimer()` | `getEmpresasTimers()` | GET `api/timereventos/empresastimers` |
| `findTiemposEmpresa()` | `findTimersEventosEmpresa(id)` | GET `api/timereventos/eventosempresa/:id` |
| `findTiemposActualesEmpresa()` | `findTimersActualesEmpresa(id)` | GET `api/timereventos/eventosactualesempresa/:id` |

Nota: `findTiemposEmpresa` llama a `findTimersEventosEmpresa` y luego encadena `findTiemposActualesEmpresa`. La primera llamada no se usa en el render (solo `console.log`). Efectivamente solo se utiliza el resultado de `findTimersActualesEmpresa`.

---

## SalaPopUp (subcomponente)

**Propósito:** Popup modal para seleccionar sala en TimerView.

| Método del componente | Función del servicio | Endpoint |
|---|---|---|
| `loadRooms()` | `getSalas()` | GET `api/salas` |

---

## HorarioActualEmpresaPopUp (subcomponente)

**Propósito:** Popup con el horario de una empresa. Recibe `idempresa` como prop.

| Método del componente | Función del servicio | Endpoint |
|---|---|---|
| `findTiemposActualesEmpresa()` | `findTimersActualesEmpresa(props.idempresa)` | GET `api/timereventos/eventosactualesempresa/:id` |
| `loadCategories()` | `getCategorias()` | GET `api/categoriastimer` |

Nota: este componente se instancia con `idempresa` hardcodeado a `1` en los comentarios del código (`EmpresasEventoTimers`, `TimerView`). El único uso real es desde `EmpresasEventoTimersNew` donde `idempresa` viene de `this.state.idempresa`.

---

## Tiempo (subcomponente)

**Propósito:** Muestra el tiempo restante del temporizador activo. No hace llamadas REST.

| Evento WebSocket recibido | Acción |
|---|---|
| `envio` (payload: segundos restantes `number`) | Actualiza el display `MM:SS`. Si segundos === 12 o 3, activa `navigator.vibrate()`. |

---

## Menu / MenuPopUp

No realizan llamadas de red. Solo gestionan la visibilidad del menú lateral y los NavLinks de navegación.
