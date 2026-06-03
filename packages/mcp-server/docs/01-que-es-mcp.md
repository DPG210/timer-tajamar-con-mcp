# 01 — Que es el Model Context Protocol (MCP)

## Que es MCP

El **Model Context Protocol** es un estandar abierto publicado por Anthropic que define como un modelo de lenguaje (como Claude) puede invocar herramientas externas de forma estructurada y segura. Antes de MCP, cada integracion era ad hoc: un plugin de ChatGPT, una funcion de OpenAI, una Action de Gemini. Cada plataforma tenia su propio formato. MCP estandariza el protocolo para que cualquier herramienta escrita una sola vez pueda funcionar con cualquier cliente que entienda MCP.

La idea central es simple: el servidor MCP expone una lista de **herramientas** (tools). Cada herramienta tiene un nombre, una descripcion en lenguaje natural y un esquema de parametros. Claude lee esa descripcion y decide, en funcion de la conversacion, que herramienta llamar y con que argumentos. El servidor ejecuta la logica y devuelve una respuesta de texto que Claude incorpora en su siguiente mensaje.

MCP no es una API REST. No es un webhook. Es un protocolo de mensajes JSON sobre un canal de transporte (en nuestro caso, stdio). El cliente (Claude Desktop) y el servidor (este proyecto) intercambian mensajes siguiendo el protocolo, y cada mensaje tiene un formato definido por la especificacion.

## Como interactua Claude con un servidor MCP

El ciclo de vida completo de una llamada a herramienta es el siguiente:

1. El usuario escribe algo en Claude Desktop: "Lista todas las salas disponibles".
2. Claude analiza el mensaje y decide que debe llamar a la herramienta `listar_salas`.
3. Claude Desktop serializa esa decision en un mensaje JSON con el formato del protocolo MCP y lo escribe en el stdin del proceso servidor.
4. El servidor MCP recibe el mensaje, ejecuta la logica (en este caso, una peticion GET a la REST API), y escribe la respuesta en su stdout.
5. Claude Desktop lee la respuesta del stdout, la incorpora al contexto de Claude, y Claude genera el mensaje final para el usuario: "Hay 3 salas: Sala A, Sala B, Sala C".

Todo esto ocurre en milisegundos y es invisible para el usuario.

## Por que este proyecto usa MCP

La alternativa habria sido dar a Claude acceso directo a la REST API mediante una integracion personalizada o simplemente pedirle al operador que use curl o Postman. Ninguna de las dos opciones es ergonomica para un operador no tecnico en plena jornada.

Con MCP, el operador puede decir en lenguaje natural: "El evento empieza 10 minutos tarde, adelanta todos los temporizadores". Claude invoca `adelantar_todos_los_temporizadores` con `minutes: 10` y la operacion se ejecuta. El operador no necesita conocer la API, los IDs de los recursos ni el formato JSON.

Ademas, MCP permite que Claude **razone** sobre que herramientas tiene disponibles. Si el operador pregunta "Cuantas empresas estan asignadas a la sala 2?", Claude puede encadenar `listar_asignaciones` y filtrar el resultado, sin que el servidor MCP tenga que implementar ese filtro explicitamente.

## Diagrama de la arquitectura completa

```
+------------------+        stdio (JSON-RPC)       +----------------------+
|                  |  <-------------------------->  |                      |
|  Claude Desktop  |                               |  timer-mcp-server    |
|  (cliente MCP)   |                               |  (este proyecto)     |
|                  |                               |                      |
+------------------+                               +----------+-----------+
                                                              |
                                                   HTTP REST  |  Bearer JWT
                                                   (axios)    |
                                                              v
                                                   +----------+-----------+
                                                   |                      |
                                                   |  REST API backend    |
                                                   |  (ASP.NET / similar) |
                                                   |                      |
                                                   +----------+-----------+
                                                              |
                                                        SQL   |
                                                              v
                                                   +----------+-----------+
                                                   |                      |
                                                   |  Base de datos       |
                                                   |  (SQL Server)        |
                                                   |                      |
                                                   +----------------------+

                         (canal separado, sin pasar por el MCP)

+------------------+      WebSocket (socket.io)    +----------------------+
|                  |  <-------------------------->  |                      |
|  Cliente React   |                               |  REST API backend    |
|  (pantalla publ) |                               |  (mismo backend)     |
|                  |                               |                      |
+------------------+                               +----------------------+
```

### Que hace cada pieza

**Claude Desktop** es la aplicacion de escritorio de Anthropic. Actua como cliente MCP: arranca el proceso servidor, gestiona el canal de comunicacion stdio y convierte las decisiones de Claude en mensajes del protocolo.

**timer-mcp-server** (este proyecto) es el servidor MCP. Su unica responsabilidad es traducir las llamadas MCP en peticiones HTTP a la REST API y devolver la respuesta formateada. No tiene base de datos propia, no tiene estado persistente (salvo el token JWT en memoria), y no tiene interfaz grafica.

**REST API backend** es el servidor que implementa la logica de negocio: validaciones, persistencia, calculo de slots activos. El servidor MCP no conoce esa logica; solo llama a los endpoints.

**Cliente React** es la pantalla publica del evento. Se conecta directamente al backend via WebSocket para mostrar el contador en tiempo real. No pasa por el servidor MCP. El servidor MCP y el cliente React son sistemas independientes que comparten el mismo backend.

## Que NO es MCP en este proyecto

MCP no es el canal de visualizacion en tiempo real. Los eventos WebSocket (el contador regresivo que se muestra en pantalla) no son herramientas MCP. Esa decision se explica en detalle en `07-websocket-y-mcp.md`.

MCP no es una capa de seguridad. La autenticacion la gestiona la REST API mediante JWT. El servidor MCP simplemente transporta el token que recibe de `login` o de la variable de entorno.

MCP no es una base de datos ni un cache. Cada llamada a herramienta es una peticion HTTP fresca a la REST API. No hay cache, no hay persistencia entre llamadas (salvo el token en memoria).
