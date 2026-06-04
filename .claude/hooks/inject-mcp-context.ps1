# SessionStart hook -- reinyecta el contrato de uso del MCP timer-mcp en el contexto.
# Lo que este script escribe en stdout se anade al contexto de la sesion (solo en SessionStart).

@'
[Contexto del proyecto - MCP timer-mcp]
timer-mcp es una herramienta de desarrollo de SOLO LECTURA conectada a la API real de Azure.
Uso: verificar que los datos de la API encajan con los esquemas Zod de
packages/app/src/types/models.ts.
Flujo:
  1) login primero (pide credenciales al usuario; nunca las inventes; si las deniegan, los GET
     no requieren JWT).
  2) listar_salas / listar_empresas / listar_categorias / listar_temporizadores /
     listar_asignaciones.
  3) Compara el JSON real con el Zod correspondiente; si no encaja (campos de mas/menos o tipos
     distintos), reportalo como FALLO DE CONTRATO API-tests, no como test a ajustar.
No uses herramientas de escritura del MCP: el usuario de prueba no tiene permisos.
Al delegar una verificacion de datos al subagente de testing, INCLUYE este flujo en la tarea:
su contexto es independiente y no lo hereda.
'@

exit 0