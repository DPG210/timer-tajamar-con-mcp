# Documentacion tecnica — timer-mcp-server

Este directorio contiene la documentacion tecnica completa del servidor MCP para la API de gestion de temporizadores. Cada documento explica no solo el _que_ sino el _por que_ de cada decision.

---

## Que es este proyecto?

Este proyecto es un **servidor MCP** (Model Context Protocol) que actua como puente entre Claude y una API REST de gestion de eventos presenciales. En concreto, da a Claude la capacidad de crear salas, registrar empresas, programar temporizadores y asignar empresas a salas para slots de tiempo concretos, todo ello mediante lenguaje natural.

El caso de uso real es una jornada de networking o feria de empleo donde cada empresa dispone de un tiempo limitado en una sala para entrevistar o presentarse. Un operador habla con Claude y le dice, por ejemplo: "Crea tres salas, registra estas cinco empresas y asigna cada empresa a dos turnos de 20 minutos". Claude traduce eso en llamadas a las herramientas MCP, que a su vez llaman a la REST API que controla los temporizadores.

La pantalla publica del evento muestra en tiempo real el contador regresivo del turno activo. Esa pantalla es un cliente React separado que se conecta directamente a la REST API via WebSocket. El servidor MCP no participa en esa visualizacion: su rol es la gestion de datos, no la presentacion en tiempo real.

El servidor MCP corre como proceso hijo de Claude Desktop en la misma maquina del operador. Cuando Claude Desktop arranca, lanza el proceso del servidor MCP y se comunica con el mediante stdio (entrada/salida estandar). No hay un puerto HTTP que exponer ni un servidor que mantener en marcha manualmente.

---

## Indice de documentos

| Archivo | Descripcion |
|---|---|
| `01-que-es-mcp.md` | Que es el Model Context Protocol, como funciona la comunicacion entre Claude y un servidor MCP, y por que este proyecto lo usa en lugar de una integracion directa. |
| `02-stack-tecnologico.md` | Analisis de cada tecnologia del stack: Node.js, TypeScript, `@modelcontextprotocol/sdk`, axios, zod y tsx. Por que se eligio cada una y que alternativas se descartaron. |
| `03-arquitectura-del-servidor.md` | Estructura de archivos y responsabilidad de cada modulo. Flujo completo de una llamada herramienta desde Claude hasta la respuesta. Patron de token JWT en memoria. |
| `04-guia-paso-a-paso.md` | Tutorial de construccion del servidor desde cero. Cada paso incluye el codigo relevante y la explicacion de por que se hace de esa manera. |
| `05-herramientas-mcp.md` | Catalogo de las 24 herramientas MCP implementadas, organizadas por grupo funcional. Endpoint, parametros y notas de implementacion. |
| `06-decisiones-tecnicas.md` | Architecture Decision Records (ADR) informales. Para cada decision clave, el contexto, las alternativas consideradas, la razon de la eleccion y las consecuencias. |
| `07-websocket-y-mcp.md` | Por que los eventos WebSocket no se exponen como herramientas MCP. Descripcion de cada evento del sistema, su proposito y la alternativa correcta para cada caso de uso. |
| `08-configuracion-y-despliegue.md` | Variables de entorno, configuracion de Claude Desktop, comandos de desarrollo y produccion, y verificacion del arranque. |
