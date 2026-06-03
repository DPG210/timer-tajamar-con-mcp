# 07 — WebSocket y MCP: por que son incompatibles

Este documento explica la arquitectura de tiempo real del sistema, por que los eventos WebSocket no se exponen como herramientas MCP, y cual es la alternativa correcta para cada caso de uso.

---

## El problema de fondo: dos modelos de comunicacion distintos

El protocolo MCP es **request-response**: Claude invoca una herramienta, el servidor ejecuta la logica, devuelve una respuesta. La conversacion avanza. No hay nada entre medias.

Los WebSocket son **push-asincronos**: el servidor emite eventos cuando quiere, sin que el cliente los haya pedido. El cliente escucha y reacciona.

Estos dos modelos son fundamentalmente incompatibles. Un cliente MCP (Claude Desktop) no tiene mecanismo para recibir eventos "empujados" desde el servidor MCP. El transporte stdio es un canal de mensajes discretos, no un stream de eventos continuos.

---

## Los eventos WebSocket del sistema

El backend expone un servidor socket.io al que se conecta el cliente React. Los eventos son los siguientes:

### `timerID`

**Direccion:** servidor -> cliente (emit)

**Descripcion:** el servidor emite este evento para indicar que timer esta activo en este momento. Contiene el identificador del temporizador en curso.

**Para que sirve:** el cliente React usa este ID para saber que temporizador mostrar en la pantalla publica.

**Alternativa MCP:** la herramienta `obtener_eventos_sala` con el ID de la sala, o `obtener_eventos_actuales_empresa` con el ID de una empresa, permiten saber que timer esta activo ahora sin WebSocket.

---

### `envio`

**Direccion:** servidor -> cliente (emit)

**Descripcion:** el servidor emite el tiempo restante calculado desde el servidor, en tiempo real.

**Por que el cliente React lo ignora:** el backend calcula el tiempo restante desde el momento en que el operador pulsa "vamos", que puede ser antes o despues de la hora de inicio programada (`timer.inicio`). Si el operador es puntual, el valor coincide. Si no, el valor deriva con respecto al horario oficial. El cliente React recalcula el tiempo restante de forma independiente:

```javascript
// Logica del cliente React (referencia)
const horaFin = parseInicio(timer.inicio) + (categoria.duracion * 60 * 1000);
const tiempoRestante = horaFin - Date.now();
```

Esta logica usa la hora de inicio oficial del temporizador, no la hora en que el operador pulso el boton. Esto garantiza que la pantalla muestra el horario oficial aunque el operador sea impuntual.

**Para que sirve el evento `envio`:** para sistemas donde se necesita el tiempo real desde que el operador pulso "vamos", no desde el inicio programado. En este caso, el cliente lo ignora deliberadamente.

**Alternativa MCP:** no hay alternativa directa porque el tiempo que lleva desde que el operador pulso "vamos" no es informacion que el servidor MCP necesite para la gestion de datos.

---

### `syncData`

**Direccion:** servidor -> cliente (emit)

**Descripcion:** el servidor emite la lista completa de datos sincronizados (salas, empresas, timers, TES) cuando hay un cambio en la base de datos.

**Para que sirve:** permite que el cliente React actualice su estado local sin hacer un GET completo. Es una actualizacion push del estado del sistema.

**Alternativa MCP:** las herramientas de listado (`listar_salas`, `listar_empresas`, `listar_temporizadores`, `listar_asignaciones`) hacen lo equivalente via polling REST. Claude puede llamarlas cuando necesite el estado actual.

---

### `vamos`

**Direccion:** cliente -> servidor (emit)

**Descripcion:** el operador pulsa el boton "vamos" en la interfaz. El cliente React emite este evento al servidor para indicar que el turno ha comenzado fisicamente.

**Para que sirve:** el servidor registra el momento en que comienza realmente el turno (que puede diferir del `timer.inicio` programado). Este timestamp real es el que usa el evento `envio`.

**Alternativa MCP:** esta accion no tiene equivalente en el servidor MCP. El servidor MCP gestiona la programacion (quien, donde, cuando segun el horario), no la ejecucion en tiempo real (cuando pulsa el operador). Son responsabilidades distintas.

---

### `start`

**Direccion:** servidor -> cliente (emit)

**Descripcion:** confirmacion del servidor al cliente de que el evento `vamos` se ha procesado y el timer ha comenzado.

**Para que sirve:** sincroniza el estado de todos los clientes conectados (si hay multiples pantallas).

**Alternativa MCP:** no aplicable. Este evento es parte del protocolo de tiempo real entre el backend y la pantalla publica.

---

## Por que no se puede implementar un "listener WebSocket" en el servidor MCP

Una propuesta intuitiva es: "que el servidor MCP se conecte al WebSocket y guarde el ultimo estado en memoria. Entonces una herramienta `obtener_estado_actual` devuelve ese estado."

Esta propuesta es tecnicamente posible pero introduce los siguientes problemas:

**1. Estado obsoleto entre eventos.** Los eventos WebSocket llegan cuando hay cambios. Entre dos eventos, el estado en memoria puede quedar obsoleto si el sistema no emite con suficiente frecuencia. Una herramienta MCP que devuelve estado en memoria puede devolver informacion desactualizada sin saberlo.

**2. Gestion de la conexion WebSocket.** La conexion WebSocket puede caer (el backend reinicia, hay un problema de red). El servidor MCP tendria que implementar reconexion automatica, manejar el estado durante la desconexion, y serializar acceso al estado compartido entre el thread del WebSocket y el handler de la herramienta.

**3. Complejidad sin beneficio proporcional.** El polling REST (`obtener_eventos_actuales_empresa`) resuelve el 95% de los casos de uso con una peticion HTTP simple. La ventaja del WebSocket es la latencia baja (milisegundos vs. el tiempo de una peticion HTTP). Para las decisiones que Claude toma durante una conversacion con el operador, esa diferencia de latencia no es relevante.

**4. El SDK de MCP no tiene primitivas para eventos asincronos.** El protocolo MCP no define un mensaje de tipo "evento entrante" que el servidor pueda empujar al cliente. Si se implementara un listener WebSocket, la unica forma de exponer esa informacion a Claude seria que Claude pregunte (herramienta de polling), no que el servidor notifique.

---

## Alternativas correctas por caso de uso

| Lo que el operador quiere saber | Alternativa correcta en MCP |
|---|---|
| Que empresa esta en la sala X ahora mismo | `obtener_eventos_sala` con `idSala` |
| Cuantos minutos le quedan a la empresa Y | `obtener_eventos_actuales_empresa` con `idEmpresa`. El campo de duracion viene de la categoria. |
| Que salas tienen evento activo ahora | `listar_empresas_con_timers` + calcular horario vs. hora actual |
| El estado general del evento | `listar_asignaciones` + `listar_temporizadores` |
| Si un timer especifico esta en pausa | `listar_temporizadores`. El campo `pausa` esta en la respuesta. |

---

## Diagrama: que procesa cada sistema

```
                  GESTION (planificacion)
                  
 Operador (via Claude Desktop)
          |
          | lenguaje natural
          v
    Claude (LLM)
          |
          | llamada MCP (stdio)
          v
  timer-mcp-server     <-- este proyecto
          |
          | HTTP REST (axios)
          v
    REST API backend
          |
          | SQL
          v
    Base de datos
    
    
                  VISUALIZACION (tiempo real)
                  
    REST API backend
          |
          | WebSocket (socket.io) push
          v
    Cliente React        <-- pantalla publica del evento
```

Los dos sistemas son independientes. Comparten el mismo backend pero sirven a propositos distintos: uno gestiona los datos, el otro los muestra en tiempo real. Mantenerlos separados hace que cada uno sea mas simple y mantenible.
