# Auditoria AppTimersFinal-master

Proyecto React (CRA) para la gestión de temporizadores de un evento presencial con múltiples salas y empresas participantes.

Fecha de auditoria: 2026-05-26

## Estructura de este directorio

| Archivo | Contenido |
|---|---|
| `api-endpoints.md` | Inventario completo de endpoints HTTP y eventos WebSocket |
| `data-models.md` | Modelos de datos deducidos del código fuente |
| `component-api-map.md` | Mapa componente → función de servicio → endpoint |
| `auth-flow.md` | Flujo de autenticación y gestión de sesión |
| `service-layer.md` | Análisis de service.js: estructura, patrones, cliente HTTP |
| `migration-notes.md` | Problemas detectados y recomendaciones para migración |

## Resumen ejecutivo

- **HTTP client**: axios 1.2.2, sin instancia personalizada, sin interceptores.
- **WebSocket**: socket.io-client 4.5.3, una conexión persistente por cada archivo que importe Global.SocketUrl (al menos 5 conexiones simultáneas abiertas).
- **Autenticación**: JWT almacenado en `localStorage`. No hay header Authorization enviado en las peticiones REST (el token solo controla la visibilidad de UI).
- **URLs**: dos URLs hardcodeadas en `src/Global.js` (API REST y servidor de sockets), con alternativas comentadas.
- **Entidades principales**: Sala, Empresa, Temporizador (Timer), Categoria, TiempoEmpresaSala (TES), TimerEvento.
- **Patrón de servicio**: clase ES6 con métodos que devuelven `new Promise` envolviendo `axios`. Sin estado, sin token, sin caché.
- **Problemas críticos para migración**: ausencia de token en cabeceras REST, múltiples instancias de socket, error handling incompleto, lógica de negocio mezclada en componentes.
