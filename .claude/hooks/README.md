# `.claude/hooks/` — automatizaciones de Claude Code (timer-tajamar)

Los hooks se **registran** en `.claude/settings.json`; los **scripts** viven en esta carpeta.
Dejar un script aqui no lo activa: tiene que estar referenciado desde `settings.json`. La
carpeta es solo orden.

## Qué hay activo

| Evento | Matcher | Script | Para qué |
|---|---|---|---|
| `SessionStart` | — | `inject-mcp-context.sh` | Reinyecta el contrato de uso del MCP `timer-mcp` en el contexto al iniciar/reanudar sesion. |
| `PreToolUse` | `mcp__timer-mcp__.*` | `guard-mcp-readonly.sh` | Refuerza el SOLO LECTURA: permite `login` + `listar_*`, deniega cualquier otra tool del MCP. |
| `PostToolUse` | `Edit\|Write` | `run-tests-on-change.sh` | Corre `npm run test:app` cuando cambia `.ts/.tsx` de `packages/app/src`; si fallan, devuelve el error a Claude. |

## Notas

- Los scripts parsean el JSON de entrada con **node** (no requieren `jq` instalado).
- `guard-mcp-readonly.sh` deniega incluso en modo bypass: un `permissionDecision: "deny"` en
  `PreToolUse` no se puede saltar cambiando el modo de permisos.
- Rendimiento: `run-tests-on-change.sh` corre la suite en cada edicion de codigo de la app. Si se
  hace lento durante refactors grandes, acota el `case` a solo ficheros `*.test.ts(x)` o cambialo a
  un hook `Stop` que corra los tests una vez al final del turno.
- Para revisar/depurar: ejecuta `/hooks` dentro de Claude Code, o arranca con
  `claude --debug-file /tmp/claude.log` y mira el log.
- Desactivar todo temporalmente: `"disableAllHooks": true` en `settings.json`.

## Requisitos

- Scripts ejecutables: `chmod +x .claude/hooks/*.sh`.
- En Windows, Claude Code ejecuta estos scripts bash por la shell, asi que necesitas Git Bash o
  WSL disponible.