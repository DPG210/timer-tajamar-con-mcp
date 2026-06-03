# Notas de Migración

Problemas detectados en el código actual, clasificados por severidad, con recomendación concreta para cada uno.

---

## Problemas bloqueantes para migración

### M-01 — Token JWT nunca enviado al backend en peticiones REST

**Severidad:** Bloqueante  
**Ubicación:** `src/services/service.js`, todos los métodos axios excepto `generateToken`

El token guardado en `localStorage` nunca se adjunta a las peticiones REST. Si el backend protege los endpoints de escritura con autenticación Bearer, todas las peticiones POST, PUT y DELETE fallaran en una migración sin este fix.

**Acción requerida antes de migrar:**
1. Confirmar con el equipo de backend si los endpoints de escritura requieren `Authorization: Bearer <token>`.
2. Si es así, añadir un interceptor de request en axios:

```js
// En la nueva capa de servicio
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
```

---

### M-02 — Promise constructor antipattern + promesas que nunca rechazan

**Severidad:** Bloqueante  
**Ubicación:** `src/services/service.js`, todos los métodos

Todos los métodos del servicio envuelven la promesa de axios en `new Promise(resolve => ...)` sin nunca llamar a `reject`. Si axios lanza un error, la promesa externa queda en estado `pending` indefinidamente, lo que hace imposible manejar errores en los componentes.

Ejemplo de lo que ocurre ahora cuando la API devuelve 500:
```
componente.entonces(result => usar result)  // nunca se ejecuta
// componente queda en estado de carga infinita, sin mensaje al usuario
```

**Acción requerida:**
Reescribir el servicio devolviendo las promesas de axios directamente y usando `async/await` en los componentes:

```js
// Antes
getSalas() {
    return new Promise(function(resolve) {
        axios.get(url).then(response => resolve(response.data)).catch(e => console.log(e));
    });
}

// Después
async getSalas() {
    const response = await axiosInstance.get("api/salas");
    return response.data;
}
```

---

### M-03 — Múltiples instancias de socket.io-client abiertas

**Severidad:** Bloqueante  
**Ubicación:** `src/services/service.js`, `src/components/Login.js`, `src/components/TimerView.js`, `src/components/Tiempo.js`

Cada archivo crea su propia conexión WebSocket con `io(Global.SocketUrl, { withCredentials: true })` a nivel de módulo. Esto puede resultar en hasta 4 conexiones abiertas simultáneamente desde el mismo cliente.

Adicionalmente, `Tiempo.js` registra el listener `socket.on('envio', ...)` dos veces: una dentro de `useEffect` (sin dependencias, se re-registra en cada render) y otra fuera del hook directamente en el cuerpo del componente.

**Acción requerida:**
Centralizar la conexión WebSocket en un único módulo singleton o en un Context de React:

```js
// src/socket.js — módulo singleton
import io from 'socket.io-client';
import Global from './Global';

const socket = io(Global.SocketUrl, { withCredentials: true });
export default socket;
```

Todos los archivos importan `socket` desde este módulo en lugar de crear instancias nuevas.

---

## Problemas de diseño importantes

### M-04 — URLs construidas con concatenación de strings (parámetros en ruta)

**Severidad:** Alta  
**Ubicación:** `postSala`, `putSala`, `postEmpresa`, `putEmpresa`

Los endpoints de creación y actualización de salas y empresas pasan los datos como segmentos de URL:

```
POST api/salas/createsala/Mi Sala Nueva       <- espacio en URL
PUT  api/empresas/updateempresa/3/Café & Co   <- & en URL
```

Esto no es REST estándar y falla con caracteres que necesitan codificación URL. Si el nombre contiene `/`, la petición rompe el routing del servidor.

**Acción requerida:**
Cambiar los endpoints de creación/actualización para que acepten body JSON:
```
POST api/salas       body: { nombreSala: string }
PUT  api/salas/:id   body: { nombreSala: string }
```
Esto requiere cambio coordinado en el backend.

---

### M-05 — Lógica de negocio compleja en componentes

**Severidad:** Alta  
**Ubicación:** `Categorias.js`, `Temporizadores.js`

Los componentes `Categorias` y `Temporizadores` contienen lógica de validación de solapamiento de rangos horarios directamente en el componente. Esta lógica (comprobación de rangos, `transformDuration`, `transformMinutes`) está duplicada en al menos 5 archivos: `Horario.js`, `Temporizadores.js`, `Categorias.js`, `EmpresasEventoTimers.js`, `EmpresasEventoTimersNew.js`.

**Acción requerida:**
Extraer las funciones utilitarias de tiempo a un módulo compartido:
```js
// src/utils/timeUtils.js
export const transformDuration = (duration) => { ... }
export const transformMinutes = (duracion, legend) => { ... }
export const getInicio = (string_init) => { ... }
export const calcularFin = (inicio, duracion) => { ... }
export const haysolapamiento = (rangoA, rangoB) => { ... }
```

---

### M-06 — Peticiones GET redundantes al mismo endpoint

**Severidad:** Media  
**Ubicación:** `TimerView.js` métodos `checkCompany()` y `getLineName()`

Ambos métodos llaman a `getTES()` por separado cada vez que el socket emite `timerID`. Esto genera al menos 2 peticiones GET a `api/TiempoEmpresaSala` simultáneas para cada cambio de timer, sin ningún tipo de caché.

**Acción requerida:**
Llamar a `getTES()` una sola vez y pasar el resultado a ambas funciones:

```js
socket.on('timerID', async (idTimer) => {
    const tes = await this.currentService.getTES();
    this.checkCompanyFromData(tes, idTimer);
    this.getLineNameFromData(tes, idTimer, true);
    this.getLineNameFromData(tes, idTimer, false);
});
```

---

### M-07 — Sin manejo de errores en operaciones de borrado en cascada

**Severidad:** Media  
**Ubicación:** `Salas.js`, `Empresas.js`, `Temporizadores.js`, `Categorias.js`

Los borrados en cascada (borrar TES antes de borrar la entidad padre) se implementan con loops forEach sin await:

```js
result_tes.forEach(registro => {
    if (registro.idTimer === currentID) {
        this.currentService.deleteTES(registro.id);  // fire-and-forget
    }
    if (counter === result_tes.length) {
        this.currentService.deleteTemporizador(currentID); // puede ejecutarse antes de que los deleteTES terminen
    }
});
```

Las llamadas a `deleteTES` son fire-and-forget. El `deleteTemporizador` final podría ejecutarse antes de que todas las dependencias hayan sido borradas si el servidor no tiene restricciones de FK que fallen correctamente.

**Acción requerida:**
Usar `Promise.all` para esperar a que todas las eliminaciones de dependencias completen antes de borrar la entidad padre:

```js
const deletions = result_tes
    .filter(r => r.idTimer === currentID)
    .map(r => this.currentService.deleteTES(r.id));
await Promise.all(deletions);
await this.currentService.deleteTemporizador(currentID);
```

---

### M-08 — service.js importa Swal (acoplamiento UI en capa de datos)

**Severidad:** Media  
**Ubicación:** `src/services/service.js`

El único uso de Swal en service.js es el diálogo de error de login (401). Esto acopla la capa de datos con la capa de presentación.

**Acción requerida:**
Eliminar la importación de Swal de service.js. El método `generateToken` debe rechazar la promesa con un error tipado que el componente `Login` interprete y muestre el diálogo:

```js
// service.js
async generateToken(user, password) {
    const response = await axiosInstance.post("Auth/Login", { userName: user, password });
    return response.data;
    // Si status 401, axios lanzará un error — el componente lo captura
}

// Login.js
try {
    const result = await this.currentService.generateToken(user, pass);
    localStorage.setItem("token", result.response);
} catch (error) {
    if (error.response?.status === 401) {
        Swal.fire('Acceso denegado', 'Credenciales incorrectas', 'error');
    }
}
```

---

## Deuda técnica y configuración

### M-09 — URLs hardcodeadas en Global.js sin soporte de variables de entorno

**Severidad:** Media  
**Ubicación:** `src/Global.js`

```js
var Global = {
    mainUrl : "https://apitimerstesting.azurewebsites.net/",
    SocketUrl : "https://timertajamarback.azurewebsites.net/"
}
```

No hay uso de `process.env.REACT_APP_*`. Cambiar el entorno (dev → staging → producción) requiere editar el código fuente.

**Acción requerida:**
Crear `.env`, `.env.development` y `.env.production` con variables CRA:

```env
# .env.development
REACT_APP_API_URL=https://localhost:7004/
REACT_APP_SOCKET_URL=http://localhost:3002/

# .env.production
REACT_APP_API_URL=https://apitimerstesting.azurewebsites.net/
REACT_APP_SOCKET_URL=https://timertajamarback.azurewebsites.net/
```

```js
// Global.js (o eliminado y accedido directamente)
const Global = {
    mainUrl: process.env.REACT_APP_API_URL,
    SocketUrl: process.env.REACT_APP_SOCKET_URL
}
```

---

### M-10 — Clase de componente vs. función en componentes nuevos

**Severidad:** Baja  
**Ubicación:** Todos los componentes

Todos los componentes son Class Components (`extends Component`), con la excepción de `Tiempo.js` que usa hooks (`useState`, `useEffect`). Si la migración apunta a React moderno, todos los class components deberían reescribirse como functional components con hooks.

---

### M-11 — Ruta y componente EmpresasEventoTimers comentados pero no eliminados

**Severidad:** Baja  
**Ubicación:** `Router.js` (línea 29), `MenuPopUp.js` (línea 27)

El componente `EmpresasEventoTimers` existe y está importado en Router, pero la ruta está comentada. El enlace también está comentado en el menú. El componente contiene un bug (usa `this.state.categorias` que nunca se carga). Si se activa en una migración sin revisar, fallará.

---

### M-12 — idEvento hardcodeado a 1

**Severidad:** Baja  
**Ubicación:** `Horario.js` método `createTES` (línea 219)

```js
var newRegister = {
    id : 0,
    idTimer : ...,
    idEmpresa : ...,
    idSala : ...,
    idEvento : 1   // hardcodeado
}
```

Si el sistema evoluciona para gestionar múltiples eventos, este campo necesitará ser dinámico.

---

## Resumen de cambios para una migración limpia

| ID | Prioridad | Tipo | Cambio |
|---|---|---|---|
| M-01 | 1 - Bloqueante | Autenticación | Añadir interceptor axios con token Bearer |
| M-02 | 1 - Bloqueante | Service layer | Reescribir service.js sin Promise antipattern, con reject correcto |
| M-03 | 1 - Bloqueante | WebSocket | Centralizar conexión socket en singleton |
| M-04 | 2 - Alta | API contract | Cambiar endpoints de creación a body JSON (coordinado con backend) |
| M-05 | 2 - Alta | Refactor | Extraer utils de tiempo a módulo compartido |
| M-06 | 2 - Media | Performance | Eliminar peticiones GET duplicadas en TimerView |
| M-07 | 2 - Media | Correctitud | Usar Promise.all en borrados en cascada |
| M-08 | 2 - Media | Arquitectura | Eliminar Swal de service.js |
| M-09 | 2 - Media | Config | Implementar variables de entorno con process.env.REACT_APP_* |
| M-10 | 3 - Baja | Modernización | Convertir class components a functional components con hooks |
| M-11 | 3 - Baja | Limpieza | Eliminar o arreglar componente EmpresasEventoTimers |
| M-12 | 3 - Baja | Evolucionabilidad | Hacer idEvento dinámico |
