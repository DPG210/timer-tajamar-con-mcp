# Flujo de Autenticación y Gestión de Sesión

## Mecanismo utilizado

JWT almacenado en `localStorage`. La clave de almacenamiento es `"token"`.

No se usa ninguna librería de gestión de estado global (Redux, Context API, Zustand). Cada componente lee `localStorage.getItem("token")` directamente en su `componentDidMount` y lo guarda en su propio `state.token`.

---

## Flujo de login paso a paso

```
Usuario                      Login.js                    service.js                  API REST
  |                              |                             |                          |
  |-- introduce user/pass -----> |                             |                          |
  |-- pulsa "Iniciar sesión" --> |                             |                          |
  |                              |-- generateToken(u, p) ----> |                          |
  |                              |                             |-- POST Auth/Login ------> |
  |                              |                             |   body: { userName, password } |
  |                              |                             |<-- { response: "<JWT>" } --|
  |                              |<-- resolve(response.data) --|                          |
  |                              |                             |                          |
  |                              |-- localStorage.setItem("token", result.response)       |
  |                              |-- setState({ token: result.response })                 |
  |                              |                             |                          |
  |<-- render cambia: form       |                             |                          |
  |    oculto, botones de         |                             |                          |
  |    administración visibles -> |                             |                          |
```

Puntos clave:
1. El token se obtiene de `response.data.response`. La API devuelve un objeto con la propiedad `response` que contiene la cadena JWT.
2. El token se guarda con `localStorage.setItem("token", result.response)`. Si `result` es `undefined` (cuando la promesa en `generateToken` no resuelve por un error que no sea 401), la app lanza un error silencioso y `localStorage` queda con la clave `"token"` con valor `"undefined"` (string literal), lo que falsamente valida el token check en otros componentes.
3. No se envía el token en ninguna cabecera `Authorization` de las peticiones REST posteriores. El token solo controla la visibilidad de botones de edición en la UI.

---

## Flujo de logout

```js
signout = () => {
    localStorage.clear();                // Elimina TODAS las claves, no solo "token"
    this.setState({ token : null });
}
```

- `localStorage.clear()` elimina cualquier otro dato que pudiera estar almacenado en localStorage (no solo el token).
- Solo el componente `Login` actualiza su estado; los demás componentes que cargaron `token` en su `componentDidMount` no se enteran del logout hasta que se remontan.

---

## Comprobación del token en los componentes

Todos los componentes que requieren permisos de escritura siguen el mismo patrón:

```js
componentDidMount = () => {
    this.setState({
        token : (localStorage.getItem("token") !== null)
    });
}
```

Este check solo comprueba si la clave existe en localStorage, no si el JWT es válido, no ha expirado, ni tiene la firma correcta. Un valor `"undefined"` o cualquier string arbitrario pasa este check.

Los componentes que realizan este check son: `Login`, `TimerView`, `Horario`, `Salas`, `Empresas`, `Categorias`, `Temporizadores`, `EmpresasEventoTimers`, `EmpresasEventoTimersNew`.

---

## Eventos de control de sesión vía WebSocket

Desde `Login.js` se emiten dos eventos que controlan el estado del evento, no la sesión HTTP:

| Evento | Condición de emisión | Efecto en el sistema |
|---|---|---|
| `vamos` | Admin pulsa "Iniciar Evento" (con confirmación Swal) | El servidor de sockets inicia la cuenta atrás y empieza a emitir `envio` con segundos restantes |
| `start` | Admin pulsa "Resetear Temporizadores" (botón comentado en UI) | El servidor resetea el estado de la base de datos |

Estos eventos no están protegidos en el cliente por ningún mecanismo de autenticación WebSocket. Cualquier cliente que tenga la URL del servidor de sockets puede emitirlos.

---

## Problemas de seguridad identificados

### 1. Token no enviado en peticiones REST
El token JWT obtenido en el login nunca se adjunta como cabecera `Authorization: Bearer <token>` en ninguna petición axios. Esto significa que la API REST en el servidor actualmente o no requiere autenticación en sus endpoints, o la autenticación está implementada en el servidor de forma diferente y no se corresponde con lo que el cliente recibe.

**Impacto para migración:** Antes de migrar hay que confirmar con el equipo de backend si los endpoints de escritura (POST, PUT, DELETE) requieren token. Si lo requieren, hay que añadir el interceptor de axios que adjunte el token.

### 2. localStorage expuesto a XSS
JWT en `localStorage` es vulnerable a ataques XSS. La alternativa más segura es `httpOnly cookie`.

### 3. Sin validación del token en cliente
El check `localStorage.getItem("token") !== null` no valida expiración ni firma. Un token caducado o manipulado sigue habilitando la UI de administración.

### 4. WebSocket sin autenticación
La conexión WebSocket se abre con `{ withCredentials: true }` (envía cookies si las hay), pero no hay mecanismo de autenticación explícito en el handshake. Los eventos de control (`vamos`, `start`) pueden ser emitidos por cualquier cliente conectado.

### 5. localStorage.clear() en logout
Eliminar todas las claves de localStorage puede eliminar datos de otras aplicaciones o tabs que comparten el origen.
