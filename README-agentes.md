# Equipo de agentes IA — Guía del equipo

Este repo lleva un "equipo" de agentes especializados (un **orquestador** + 9
especialistas senior) más un fichero de **reglas y contexto compartido**. Funciona
en dos entornos: **Claude Code** y **GitHub Copilot**. Esta guía explica dónde vive
cada cosa, cómo arrancar el orquestador y cómo encadenar el trabajo entre agentes.

La idea base es siempre la misma: el orquestador no resuelve, **decide quién resuelve,
en qué orden y con qué contexto**. Los especialistas hacen el trabajo de su dominio.
El contexto del proyecto (stack, convenciones, "el backend no se toca", idioma) se
declara **una sola vez** en el fichero de reglas compartido y llega a todos.

---

## Roster

| Agente | Para qué | Cuándo entra |
|---|---|---|
| `principal-staff-engineer` | Orquestador: desambigua, planifica, asigna y arbitra | Tarea multidisciplinar o "¿quién debería tocar esto?" |
| `senior-product-manager` | Qué construir y por qué (PRD, historias, métricas) | Antes de diseñar nada |
| `senior-architect-agent` | Forma del sistema, AMV, ADRs, trade-offs | Tras el PM, al definir la topología |
| `senior-frontend-agent` | Implementación de UI (React/TS, a11y, performance) | Construir o revisar frontend |
| `senior-frontend-auditor-agent` | Auditar y comparar dos frontends (migración) | Reescritura: extraer la base de lo viejo |
| `senior-data-engineer` | Pipelines, modelado, idempotencia, FinOps | Cuando hay volumen analítico real |
| `senior-code-quality-agent` | Revisión de calidad, SOLID, smells, refactor | En cada PR significativo |
| `senior-testing-agent` | Estrategia de test, suites, cobertura, flakiness | Diseñar o revisar tests |
| `senior-security-agent` | Threat model, OWASP, authn/authz, hardening | Diseño y review pre-producción (transversal) |
| `senior-technical-writer-agent` | Documentación verificable (Diátaxis) | En paralelo a todo lo demás |

UX/UI, Backend, DevOps y SRE **no tienen agente propio**: el orquestador sintetiza su
voz cuando hacen falta, declarándolo.

---

## Diferencia clave entre los dos entornos

En **Claude Code**, si el orquestador corre como agente **principal**, puede convocar
de verdad a los especialistas (cada uno en su propia ventana). En **GitHub Copilot**
no hay convocatoria automática entre agentes: el orquestador **planifica y te dice a
quién invocar**, y tú haces el hand-off a mano con `@`. En ambos casos el resultado es
el mismo equipo; cambia quién pulsa el botón de la delegación.

---

## Uso en Claude Code

### Estructura

```
repo/
├─ CLAUDE.md                          # reglas + contexto del proyecto (se carga en todos)
└─ .claude/
   ├─ settings.json                   # { "agent": "principal-staff-engineer" }  (opcional)
   └─ agents/
      ├─ principal-staff-engineer.md  # orquestador (frontmatter con Agent(...))
      └─ senior-*.md                   # los 9 especialistas
```

`CLAUDE.md` se carga automáticamente en la sesión principal y en cada subagente que se
levante. No hay que hacer nada para que se aplique.

### Arrancar el orquestador (para que delegue de verdad)

Solo el **hilo principal** puede convocar subagentes; un `@subagente` no puede. Por eso
el orquestador tiene que ser el agente principal. Dos formas:

```bash
# Opción A — por sesión (explícito):
claude --agent principal-staff-engineer
```

```jsonc
// Opción B — por defecto en el proyecto: .claude/settings.json
{ "agent": "principal-staff-engineer" }
```

Si pones ambas, la flag `--agent` gana. En este modo el orquestador ya tiene en su
frontmatter el permiso `Agent(...)` para levantar a los 9 especialistas.

> Si invocas al orquestador con `@principal-staff-engineer` dentro de una sesión
> normal, **no** delega: razona él solo todos los roles (modo síntesis, "el 80%").
> Sirve para planes rápidos, pero no usa a los especialistas reales.

### Flujo de trabajo

1. Arranca el orquestador como principal (arriba).
2. Descríbele el objetivo de negocio. Te devuelve el plan: quién entra, en qué orden y con qué contexto.
3. Él convoca a cada especialista en su ventana y sintetiza las salidas.
4. Para profundizar en una pieza concreta tú también puedes `@`-mencionar directamente a un especialista (`@senior-security-agent`, etc.).

### Mantenimiento

- Cambia el stack, el backend o una convención **una sola vez en `CLAUDE.md`**; llega a todos.
- Mantén `CLAUDE.md` **corto**: se carga en cada invocación de cada agente.
- Tras editar cualquier `.md` de `.claude/agents/` a mano, **reinicia la sesión** para que se recargue.

---

## Uso en GitHub Copilot

### Estructura

```
repo/
└─ .github/
   ├─ copilot-instructions.md         # reglas + contexto (equivalente a CLAUDE.md)
   └─ agents/
      ├─ principal-staff-engineer.agent.md
      └─ senior-*.agent.md             # los 9 especialistas
```

`.github/copilot-instructions.md` se aplica solo a todas las interacciones de Copilot
en el repo. Puedes confirmar que se está usando mirando la lista de *References* de una
respuesta del chat.

### Flujo de trabajo

Copilot invoca los agentes uno a uno con `@`; no hay delegación automática entre ellos.

1. En el chat de Copilot, recarga los agentes ("Configure Custom Agents") si acabas de añadirlos.
2. `@principal-staff-engineer` + tu objetivo → te devuelve el plan y **a quién @-mencionar a continuación**.
3. Tú haces el hand-off: `@senior-architect-agent` para la arquitectura, luego `@senior-frontend-agent`, etc., pasándole el contexto que el orquestador indicó.
4. Repite hasta cerrar la iniciativa.

### Notas

- En los `.agent.md` el frontmatter solo lleva `name` y `description`. Si quieres fijar modelo o restringir herramientas, añádelos con los nombres propios de Copilot.
- El mismo `copilot-instructions.md` lo lee cualquier compañero del equipo que use Copilot en el repo.
- Si usas **Copilot CLI**, también lee `CLAUDE.md` y `AGENTS.md` como alternativa, sin renombrar.

---

## Regla de oro

El contexto del proyecto vive en **un solo sitio por entorno** (`CLAUDE.md` /
`.github/copilot-instructions.md`). Los agentes solo contienen lo propio de su rol. Si
algo del proyecto cambia, se toca ahí y nada más.
