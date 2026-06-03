# 05 — Catalogo de herramientas MCP

Este documento describe las 24 herramientas MCP implementadas en el servidor, organizadas por grupo funcional. Para cada herramienta se indica el nombre MCP, el endpoint HTTP que invoca, los parametros que acepta y notas relevantes de implementacion.

---

## Grupo 1: Autenticacion

### `login`

**Descripcion:** Autentica con la API de temporizadores y guarda el token JWT para las llamadas subsiguientes.

**Endpoint:** `POST Auth/Login`

**Parametros:**

| Parametro | Tipo | Obligatorio | Descripcion |
|---|---|---|---|
| `userName` | string (min 1) | Si | Nombre de usuario |
| `password` | string (min 1) | Si | Contrasena |

**Notas:** Esta es la unica herramienta que modifica el estado interno del servidor. Llama a `setToken()` para guardar el JWT en memoria. Las herramientas siguientes no necesitan el token como parametro: lo aplican automaticamente gracias al interceptor de axios.

La respuesta de la API se valida con zod antes de extraer el token: se espera `{ response: string }`. Si la API cambia el nombre del campo, el error de validacion indicara exactamente que campo falta.

---

## Grupo 2: Salas

Las salas son los espacios fisicos del evento (stands, aulas, cabinas). Cada sala puede tener multiples asignaciones TES (empresa + timer).

### `listar_salas`

**Descripcion:** Devuelve la lista completa de salas fisicas.

**Endpoint:** `GET api/salas`

**Parametros:** ninguno.

**Notas:** Devuelve el JSON de la API formateado con 2 espacios de indentacion para que Claude pueda leerlo facilmente.

---

### `crear_sala`

**Descripcion:** Crea una nueva sala fisica en el sistema.

**Endpoint:** `POST api/salas/createsala/{nombre}`

**Parametros:**

| Parametro | Tipo | Obligatorio | Descripcion |
|---|---|---|---|
| `nombreSala` | string (min 1) | Si | Nombre de la nueva sala |

**Notas:** El nombre va en el path URL, no en el body. Se aplica `encodeURIComponent` para permitir nombres con espacios y caracteres especiales. Por ejemplo, "Sala A&B" se codifica como "Sala%20A%26B".

---

### `actualizar_sala`

**Descripcion:** Cambia el nombre de una sala existente.

**Endpoint:** `PUT api/salas/updatesala/{id}/{nombre}`

**Parametros:**

| Parametro | Tipo | Obligatorio | Descripcion |
|---|---|---|---|
| `idSala` | integer (min 1) | Si | ID de la sala |
| `nombreSala` | string (min 1) | Si | Nuevo nombre |

**Notas:** Mismo patron que `crear_sala`: nombre en path URL con `encodeURIComponent`.

---

### `eliminar_sala`

**Descripcion:** Elimina una sala y todas sus asignaciones TES dependientes en cascada.

**Endpoint:** `DELETE api/salas/{id}` (precedido de DELETEs en `api/TiempoEmpresaSala`)

**Parametros:**

| Parametro | Tipo | Obligatorio | Descripcion |
|---|---|---|---|
| `idSala` | integer (min 1) | Si | ID de la sala a eliminar |

**Notas:** Proceso de 3 pasos:
1. GET `api/TiempoEmpresaSala` para obtener todos los TES.
2. Filtrar los TES cuyo `idSala` coincide con el parametro.
3. DELETE en paralelo de todos los TES filtrados, luego DELETE de la sala.

Riesgo de inconsistencia si falla a mitad. Ver `06-decisiones-tecnicas.md`, decision 3.

---

## Grupo 3: Empresas

Las empresas son las organizaciones que participan en el evento. Cada empresa puede tener multiples asignaciones TES en distintas salas y turnos.

### `listar_empresas`

**Descripcion:** Devuelve la lista completa de empresas.

**Endpoint:** `GET api/empresas`

**Parametros:** ninguno.

---

### `crear_empresa`

**Descripcion:** Registra una nueva empresa en el sistema.

**Endpoint:** `POST api/empresas/createempresa/{nombre}`

**Parametros:**

| Parametro | Tipo | Obligatorio | Descripcion |
|---|---|---|---|
| `nombreEmpresa` | string (min 1) | Si | Nombre de la empresa |

**Notas:** Mismo patron de `encodeURIComponent` que `crear_sala`.

---

### `actualizar_empresa`

**Descripcion:** Cambia el nombre de una empresa existente.

**Endpoint:** `PUT api/empresas/updateempresa/{id}/{nombre}`

**Parametros:**

| Parametro | Tipo | Obligatorio | Descripcion |
|---|---|---|---|
| `idEmpresa` | integer (min 1) | Si | ID de la empresa |
| `nombreEmpresa` | string (min 1) | Si | Nuevo nombre |

---

### `eliminar_empresa`

**Descripcion:** Elimina una empresa y todas sus asignaciones TES dependientes en cascada.

**Endpoint:** `DELETE api/empresas/{id}` (precedido de DELETEs en `api/TiempoEmpresaSala`)

**Parametros:**

| Parametro | Tipo | Obligatorio | Descripcion |
|---|---|---|---|
| `idEmpresa` | integer (min 1) | Si | ID de la empresa a eliminar |

**Notas:** Mismo patron de cascada que `eliminar_sala`, filtrando por `idEmpresa`.

---

## Grupo 4: Categorias de temporizador

Las categorias definen la duracion de un turno. Por ejemplo, "Entrevista rapida" podria tener 15 minutos, y "Presentacion larga" podria tener 45 minutos. Los temporizadores referencian una categoria.

### `listar_categorias`

**Descripcion:** Devuelve la lista completa de categorias de temporizador.

**Endpoint:** `GET api/categoriastimer`

**Parametros:** ninguno.

---

### `crear_categoria`

**Descripcion:** Crea una nueva categoria de temporizador con nombre y duracion en minutos.

**Endpoint:** `POST api/categoriastimer`

**Parametros:**

| Parametro | Tipo | Obligatorio | Descripcion |
|---|---|---|---|
| `categoria` | string (min 1) | Si | Nombre de la categoria |
| `duracion` | integer (min 1) | Si | Duracion en minutos |

**Notas:** El body enviado a la API incluye `idCategoria: 0`. El valor `0` es la convencion de la API para indicar que se debe generar un nuevo ID automaticamente.

---

### `actualizar_categoria`

**Descripcion:** Modifica el nombre y duracion de una categoria existente.

**Endpoint:** `PUT api/categoriastimer`

**Parametros:**

| Parametro | Tipo | Obligatorio | Descripcion |
|---|---|---|---|
| `idCategoria` | integer (min 0) | Si | ID de la categoria |
| `categoria` | string (min 1) | Si | Nuevo nombre |
| `duracion` | integer (min 1) | Si | Nueva duracion en minutos |

**Notas:** La API de actualizacion recibe el objeto completo en el body, no solo los campos que cambian.

---

### `eliminar_categoria`

**Descripcion:** Elimina una categoria y en cascada: TES dependientes y temporizadores que la referencian.

**Endpoint:** `DELETE api/categoriastimer/{id}` (precedido de multiples DELETEs)

**Parametros:**

| Parametro | Tipo | Obligatorio | Descripcion |
|---|---|---|---|
| `idCategoria` | integer (min 1) | Si | ID de la categoria a eliminar |

**Notas:** Esta es la eliminacion en cascada mas compleja del servidor. Tres pasos:

1. GET paralelo de `api/TiempoEmpresaSala` y `api/timers` para obtener todos los TES y temporizadores.
2. Filtrar los temporizadores cuyo `idCategoria` coincide. De esos temporizadores, filtrar los TES cuyo `idTimer` coincide.
3. DELETE en paralelo de todos los TES. Luego DELETE en paralelo de todos los temporizadores. Luego DELETE de la categoria.

El orden de los pasos es importante: primero se borran los TES (que referencian los timers), luego los timers (que referencian la categoria), luego la categoria.

---

## Grupo 5: Temporizadores

Los temporizadores son los slots de tiempo del evento. Cada temporizador tiene una hora de inicio y una categoria (que define la duracion). Las asignaciones TES conectan un temporizador con una empresa y una sala.

### `listar_temporizadores`

**Descripcion:** Devuelve la lista completa de temporizadores.

**Endpoint:** `GET api/timers`

**Parametros:** ninguno.

---

### `crear_temporizador`

**Descripcion:** Crea un nuevo temporizador con hora de inicio y categoria.

**Endpoint:** `POST api/timers`

**Parametros:**

| Parametro | Tipo | Obligatorio | Descripcion |
|---|---|---|---|
| `inicio` | string (ISO 8601) | Si | Fecha y hora de inicio: "YYYY-MM-DDTHH:mm:ss" |
| `idCategoria` | integer (min 1) | Si | ID de la categoria que define la duracion |

**Notas:** El body incluye `idTemporizador: 0` (nuevo ID automatico) y `pausa: false` (los timers nuevos no estan en pausa).

---

### `actualizar_temporizador`

**Descripcion:** Actualiza un temporizador existente.

**Endpoint:** `PUT api/timers`

**Parametros:**

| Parametro | Tipo | Obligatorio | Descripcion |
|---|---|---|---|
| `idTemporizador` | integer (min 1) | Si | ID del temporizador |
| `inicio` | string (ISO 8601) | Si | Nueva fecha y hora de inicio |
| `idCategoria` | integer (min 1) | Si | ID de la categoria |
| `pausa` | boolean | Si | Estado de pausa |

---

### `adelantar_todos_los_temporizadores`

**Descripcion:** Adelanta el horario de TODOS los temporizadores en un numero de minutos.

**Endpoint:** `PUT api/timers/increasetimers/{min}`

**Parametros:**

| Parametro | Tipo | Obligatorio | Descripcion |
|---|---|---|---|
| `minutes` | integer (min 1) | Si | Minutos a adelantar |

**Notas:** Esta es una operacion global que afecta a todos los temporizadores del sistema. Es util cuando el evento empieza tarde: en lugar de actualizar cada temporizador individualmente, una sola llamada adelanta todos. Esta operacion no tiene deshace; si se aplica por error, hay que llamarla de nuevo con un valor negativo (si la API lo soporta) o actualizar manualmente los temporizadores afectados.

---

### `eliminar_temporizador`

**Descripcion:** Elimina un temporizador y sus asignaciones TES dependientes en cascada.

**Endpoint:** `DELETE api/timers/{id}` (precedido de DELETEs en `api/TiempoEmpresaSala`)

**Parametros:**

| Parametro | Tipo | Obligatorio | Descripcion |
|---|---|---|---|
| `idTemporizador` | integer (min 1) | Si | ID del temporizador a eliminar |

---

## Grupo 6: Asignaciones TES (TiempoEmpresaSala)

Las asignaciones TES son el nucleo del modelo de datos. Cada TES conecta tres entidades: un temporizador (slot de tiempo), una empresa y una sala. Un TES representa "la empresa X estara en la sala Y durante el turno Z".

### `listar_asignaciones`

**Descripcion:** Devuelve todas las asignaciones TES (empresa-sala-timer).

**Endpoint:** `GET api/TiempoEmpresaSala`

**Parametros:** ninguno.

**Notas:** Esta herramienta se usa internamente por las operaciones de eliminacion en cascada para obtener los TES a borrar. El usuario tambien puede invocarla directamente para ver el estado actual de las asignaciones.

---

### `crear_asignacion`

**Descripcion:** Asigna una empresa a una sala para el slot de un temporizador concreto.

**Endpoint:** `POST api/TiempoEmpresaSala`

**Parametros:**

| Parametro | Tipo | Obligatorio | Descripcion |
|---|---|---|---|
| `idTimer` | integer (min 1) | Si | ID del temporizador (slot de tiempo) |
| `idEmpresa` | integer (min 1) | Si | ID de la empresa |
| `idSala` | integer (min 1) | Si | ID de la sala |

**Notas:** El body incluye `id: 0` (nuevo ID automatico) e `idEvento: 1` (valor fijo; el sistema actual solo soporta un evento a la vez).

---

### `eliminar_asignacion`

**Descripcion:** Elimina una asignacion TES por su ID.

**Endpoint:** `DELETE api/TiempoEmpresaSala/{id}`

**Parametros:**

| Parametro | Tipo | Obligatorio | Descripcion |
|---|---|---|---|
| `id` | integer (min 1) | Si | ID de la asignacion TES |

---

## Grupo 7: Eventos (solo lectura)

Estas herramientas consultan la vista agregada de eventos: que empresas tienen timers asignados, que slots tiene una empresa, y que slots tiene una sala. Son de solo lectura y no tienen efecto en la base de datos.

### `listar_empresas_con_timers`

**Descripcion:** Devuelve las empresas que tienen al menos un temporizador asignado.

**Endpoint:** `GET api/timereventos/empresastimers`

**Parametros:** ninguno.

---

### `obtener_eventos_empresa`

**Descripcion:** Devuelve todos los eventos (slots) asociados a una empresa concreta.

**Endpoint:** `GET api/timereventos/eventosempresa/{id}`

**Parametros:**

| Parametro | Tipo | Obligatorio | Descripcion |
|---|---|---|---|
| `idEmpresa` | integer (min 1) | Si | ID de la empresa |

---

### `obtener_eventos_actuales_empresa`

**Descripcion:** Devuelve los eventos actuales y proximos para una empresa.

**Endpoint:** `GET api/timereventos/eventosactualesempresa/{id}`

**Parametros:**

| Parametro | Tipo | Obligatorio | Descripcion |
|---|---|---|---|
| `idEmpresa` | integer (min 1) | Si | ID de la empresa |

**Notas:** La logica de "actual y proximo" la calcula el backend comparando la hora del servidor con el `inicio` y la duracion de los temporizadores. El servidor MCP simplemente retransmite la respuesta.

---

### `obtener_eventos_sala`

**Descripcion:** Devuelve todos los eventos programados para una sala.

**Endpoint:** `GET api/timereventos/eventossala/{id}`

**Parametros:**

| Parametro | Tipo | Obligatorio | Descripcion |
|---|---|---|---|
| `idSala` | integer (min 1) | Si | ID de la sala |

---

## Resumen de endpoints por metodo HTTP

| Metodo | Herramientas |
|---|---|
| GET | `listar_salas`, `listar_empresas`, `listar_categorias`, `listar_temporizadores`, `listar_asignaciones`, `listar_empresas_con_timers`, `obtener_eventos_empresa`, `obtener_eventos_actuales_empresa`, `obtener_eventos_sala` |
| POST | `login`, `crear_sala`, `crear_empresa`, `crear_categoria`, `crear_temporizador`, `crear_asignacion` |
| PUT | `actualizar_sala`, `actualizar_empresa`, `actualizar_categoria`, `actualizar_temporizador`, `adelantar_todos_los_temporizadores` |
| DELETE | `eliminar_sala`, `eliminar_empresa`, `eliminar_categoria`, `eliminar_temporizador`, `eliminar_asignacion` |
