# PreToolUse hook (matcher: mcp__timer-mcp__.*) -- refuerza el SOLO LECTURA del MCP.
# Permite solo las herramientas de lectura (login + listar_*) y deniega cualquier otra.

$raw = [Console]::In.ReadToEnd()
$tool = ""
try { $tool = ($raw | ConvertFrom-Json).tool_name } catch { $tool = "" }

$allowed = @(
  "mcp__timer-mcp__login",
  "mcp__timer-mcp__listar_salas",
  "mcp__timer-mcp__listar_empresas",
  "mcp__timer-mcp__listar_categorias",
  "mcp__timer-mcp__listar_temporizadores",
  "mcp__timer-mcp__listar_asignaciones"
)

if ($allowed -contains $tool) {
  exit 0
}

$reason = "timer-mcp es de SOLO LECTURA: la herramienta '$tool' no esta permitida. Usa login + listar_*. Si la tarea necesita escribir, parate y pregunta al usuario."
$out = @{
  hookSpecificOutput = @{
    hookEventName            = "PreToolUse"
    permissionDecision       = "deny"
    permissionDecisionReason = $reason
  }
}
$out | ConvertTo-Json -Compress -Depth 5
exit 0