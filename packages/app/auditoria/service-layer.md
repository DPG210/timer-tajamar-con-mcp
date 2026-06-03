# Capa de Servicio — Análisis de service.js

## Ubicación y dependencias

- Archivo único: `src/services/service.js`
- Importa: `axios` (^1.2.2), `../Global`, `sweetalert2`, `socket.io-client`
- Exporta: `default class service`

---

## Estructura general

```js
import axios from 'axios';
import Global from '../Global';
import Swal from 'sweetalert2';
import io from "socket.io-client";

const socket = io(Global.SocketUrl, { withCredentials: true }); // Nivel de módulo

export default class service {
    metodoCRUD(...) {
        var url = Global.mainUrl + "ruta/del/endpoint";
        return new Promise(function(resolve) {
            axios.verbo(url[, body]).then(response => {
                resolve(response[.data]);
            }).catch((error) => {
                console.log('Error:', error.message);
            });
        });
    }
}
```

---

## Cliente HTTP

- **Librería:** axios 1.2.2
- **Instancia:** No hay instancia personalizada (`axios.create()`). Se usa el objeto global de axios directamente.
- **Cabeceras globales:** Ninguna configurada (no hay `axios.defaults.headers`).
- **Interceptores:** Ninguno.
- **Timeout:** No configurado.
- **Base URL:** No configurada centralmente. Cada método construye la URL completa concatenando `Global.mainUrl + "ruta"`.
- **Token de autenticación:** No se adjunta en ninguna petición.

---

## Patrón de promesas

Todos los métodos siguen el mismo patrón:

```js
metodo(param) {
    var url = Global.mainUrl + "segmento/" + param;
    return new Promise(function(resolve) {
        axios.get(url).then(response => {
            resolve(response.data);   // o resolve(response) para mutaciones
        }).catch((error) => {
            console.log('Error:', error.message);
        });
    });
}
```

Observaciones sobre este patrón:

1. **Promise constructor antipattern.** Se envuelve innecesariamente una promesa (la de axios) dentro de `new Promise`. Esto no aporta nada y hace el código más difícil de razonar. La forma correcta es devolver directamente la promesa de axios.

2. **Nunca se llama a `reject`.** Si axios lanza un error, el `.catch` lo captura, loguea por consola, y la promesa exterior queda en estado `pending` para siempre. Los componentes que hacen `.then(result => ...)` nunca reciben notificación de error (salvo el caso de login 401 que usa Swal). Esto provoca que los componentes se queden en estado de carga indefinido si la API falla.

3. **Excepción parcial en `generateToken`.** Es el único método que distingue entre error 401 (muestra Swal) y otros errores (solo consola). En el caso 401, la promesa exterior también queda pending indefinidamente, porque la rama de error no llama a `resolve` ni a `reject`.

4. **Resolución inconsistente para mutaciones.** Los métodos de lectura (GET) resuelven con `response.data`. Los métodos de escritura (POST, PUT, DELETE) resuelven con `response` (el objeto completo). Los componentes no usan el resultado de las mutaciones, pero la inconsistencia dificulta añadir manejo de errores más tarde.

---

## Integración WebSocket en el servicio

La conexión WebSocket se crea a nivel de módulo (fuera de la clase), lo que tiene varias implicaciones:

```js
const socket = io(Global.SocketUrl, { withCredentials: true });
```

- Se crea una vez cuando el módulo se importa por primera vez.
- Permanece abierta durante toda la vida de la aplicación.
- Se comparte entre todas las instancias de la clase `service`.

Los métodos que emiten `syncData` tras operaciones de escritura:

| Método | Endpoint | Evento emitido |
|---|---|---|
| `postTemporizador` | POST `api/timers` | `syncData` |
| `putTemporizador` | PUT `api/timers` | `syncData` |
| `deleteTemporizador` | DELETE `api/timers/:id` | `syncData` |
| `updateIncreaseTimers` | PUT `api/timers/increasetimers/:n` | `syncData` |
| `postCategoria` | POST `api/categoriastimer` | `syncData` |
| `putCategoria` | PUT `api/categoriastimer` | `syncData` |
| `deleteCategoria` | DELETE `api/categoriastimer/:id` | `syncData` |

Los métodos de sala, empresa y TES NO emiten `syncData`. Esto puede ser intencional (esas entidades no requieren sincronización en tiempo real entre clientes) o un olvido de implementación.

---

## Inventario completo de métodos

| Método | Verbo HTTP | Ruta | Resuelve con |
|---|---|---|---|
| `generateToken(user, password)` | POST | `Auth/Login` | `response.data` |
| `getSalas()` | GET | `api/salas` | `response.data` |
| `getSala(idsala)` | GET | `api/salas/:id` | `response.data` |
| `postSala(nombreSala)` | POST | `api/salas/createsala/:nombre` | `response` |
| `putSala(idSala, nombreSala)` | PUT | `api/salas/updatesala/:id/:nombre` | `response` |
| `deleteSala(idSala)` | DELETE | `api/salas/:id` | `response` |
| `getTES()` | GET | `api/TiempoEmpresaSala` | `response.data` |
| `postTES(newRegister)` | POST | `api/TiempoEmpresaSala` | `response` |
| `deleteTES(idTES)` | DELETE | `api/TiempoEmpresaSala/:id` | `response` |
| `getEmpresas()` | GET | `api/empresas` | `response.data` |
| `getEmpresa(idempresa)` | GET | `api/empresas/:id` | `response.data` |
| `postEmpresa(nombreEmpresa)` | POST | `api/empresas/createempresa/:nombre` | `response` |
| `putEmpresa(idEmpresa, nombreEmpresa)` | PUT | `api/empresas/updateempresa/:id/:nombre` | `response` |
| `deleteEmpresa(idEmpresa)` | DELETE | `api/empresas/:id` | `response` |
| `getTemporizadores()` | GET | `api/timers` | `response.data` |
| `postTemporizador(newTimer)` | POST | `api/timers` | `response` + `[WS]syncData` |
| `putTemporizador(newTimer)` | PUT | `api/timers` | `response` + `[WS]syncData` |
| `deleteTemporizador(idTimer)` | DELETE | `api/timers/:id` | `response` + `[WS]syncData` |
| `getCategorias()` | GET | `api/categoriastimer` | `response.data` |
| `getCategoria(idcategoria)` | GET | `api/categoriastimer/:id` | `response.data` |
| `postCategoria(newCategory)` | POST | `api/categoriastimer` | `response` + `[WS]syncData` |
| `putCategoria(newCategory)` | PUT | `api/categoriastimer` | `response` + `[WS]syncData` |
| `deleteCategoria(idcategoria)` | DELETE | `api/categoriastimer/:id` | `response` + `[WS]syncData` |
| `updateIncreaseTimers(minutes)` | PUT | `api/timers/increasetimers/:n` | `response` + `[WS]syncData` |
| `getEmpresasTimers()` | GET | `api/timereventos/empresastimers` | `response.data` |
| `getTimersEventos()` | GET | `api/timereventos` | `response.data` |
| `findTimersActualesEmpresa(idempresa)` | GET | `api/timereventos/eventosactualesempresa/:id` | `response.data` |
| `findTimersEventosEmpresa(idempresa)` | GET | `api/timereventos/eventosempresa/:id` | `response.data` |
| `findTimersEventosSala(idsala)` | GET | `api/timereventos/eventossala/:id` | `response.data` |

Total: 29 métodos, 16 endpoints únicos.

---

## Mezcla de responsabilidades

`service.js` importa y usa `Swal` (librería de UI) para mostrar el diálogo de error de login. Esto acopla la capa de datos con la capa de presentación. El servicio debería propagar el error al componente que decida cómo presentarlo al usuario.
