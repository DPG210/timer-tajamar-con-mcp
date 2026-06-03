# Prompts utilizados — Registro de conversación técnica

Catálogo de todas las intervenciones del usuario que provocaron una decisión técnica, un cambio en el código o la identificación de un defecto. Los prompts se reproducen en español, tal y como fueron escritos. Cada entrada incluye el contexto en el que se produjo, la decisión que desencadenó y el enlace a los archivos afectados.

---

## Fase 0 — Auditoría del proyecto original

No hay prompts registrados en esta fase: fue un trabajo de análisis estático sobre el código fuente original (AppTimersFinal) que produjo los siete documentos de auditoría. El disparador fue la necesidad de migrar sin perder funcionalidad.

---

## Fase 1 — Stack y arquitectura

### Prompt 1-A — Elección de stack

**Contexto:** Inicio de la migración. El usuario necesitaba decidir qué tecnologías usar para la reescritura.

> (Petición implícita: migrar AppTimersFinal a un stack moderno y mantenible resolviendo los 12 defectos identificados)

**Decisión desencadenada:**  
Selección del stack completo documentado en ADR-001: React 19, TypeScript strict, Vite, TanStack Query v5, Zustand, Axios con interceptores, Socket.io-client singleton, Zod, Tailwind CSS 4, SweetAlert2, Vitest.

**Archivos afectados:** `docs/decisions/ADR-001-stack.md`, `package.json`

---

## Fase 2 — Bugs UX encontrados durante pruebas

### Prompt 2-A — Patrón Swal y detección de idEvento activo

**Contexto:** El componente `EmpresasEventoTimersNew` mostraba el horario de cada empresa dentro de un SweetAlert2. La implementación inicial copiaba el antipatrón del original: manipulación del DOM dentro del callback `didOpen`.

> "quiero el swal con el patron correcto, el idevento es activo"

**Decisión desencadenada:**  
Se sustituyó la manipulación DOM dentro de `didOpen` por un `queryClient.fetchQuery()` que carga los datos antes de abrir el Swal. El contenido del diálogo se construye síncronamente a partir de los datos ya disponibles.

**Archivos afectados:** `src/components/eventos/EmpresasEventoTimersNew.tsx`

---

### Prompt 2-B — Enfoque web y móvil, login y roles de administrador

**Contexto:** Tras las primeras pruebas funcionales, el usuario evaluó la experiencia de uso real. La pantalla de temporizador iba a usarse proyectada en salas, en pantallas grandes. El login era automático (sin credenciales). Las rutas de administración no estaban protegidas.

> "tenemos que darle un enfoque mas comodo para el usuario, ya que va a ser tanto de web como de movil, luego hay que hacer el login, el admin es el unico que puede gestionar todo"

**Decisiones desencadenadas:**

1. `TimerView` y `Login` pasan a ser rutas standalone sin `AppLayout`.
2. Las rutas de administración (CRUD) se protegen con `ProtectedRoute`.
3. Se crea el componente `TimerMenu`: un drawer hamburguesa con tema oscuro específicamente para las páginas standalone.
4. El tamaño de fuente del temporizador se aumenta: `text-6xl` → `text-8xl md:text-9xl`.
5. El login pasa de automático (sin credenciales) a formulario real con `useLogin` hook, usuario y contraseña.
6. Los usuarios no autenticados pueden ver todos los datos (lectura pública) pero no pueden crear, editar ni eliminar.

**Archivos afectados:** `src/App.tsx`, `src/components/timer/TimerView.tsx`, `src/components/auth/Login.tsx`, `src/components/timer/TimerMenu.tsx` (nuevo), `src/components/auth/ProtectedRoute.tsx`

---

### Prompt 2-C — Navegación desde Login

**Contexto:** Tras separar Login como ruta standalone, el usuario descubrió que una vez en `/login` no había forma de navegar a ninguna otra parte de la aplicación.

> "cuando haces el login, no tienes el menu hamburguesa para viajar al resto de menus y te quedas ahi atrapado"

**Decisión desencadenada:**  
Se añadió el componente `TimerMenu` en la cabecera de `Login`, exactamente con el mismo patrón que en `TimerView`. La cabecera de Login tiene ahora: texto "Timers" a la izquierda, botón hamburguesa a la derecha.

**Archivos afectados:** `src/components/auth/Login.tsx`

---

## Fase 3 — Timer activo no detectado al cargar la página

### Prompt 3-A — (Problema detectado durante pruebas de integración con el backend)

**Contexto:** Durante las pruebas con el servidor real, se observó que al cargar `TimerView` mientras un evento ya estaba en curso, la pantalla mostraba 00:00 y ninguna empresa. El WebSocket solo emitía `timerID` cuando el timer cambiaba, no al conectarse.

> (Problema identificado internamente al observar el comportamiento en prueba real con backend activo)

**Decisión desencadenada:**  
Creación del hook `useCurrentActiveTimer` que calcula el timer activo desde los datos REST (`timers` + `categorias`) sin esperar al WebSocket. Usa `nowMadridMinutes()` para comparar hora actual con el rango `[startMinutes, endMinutes)` de cada timer. Comparación solo por hora del día (no datetime completo) porque los `inicio` llevan fechas de 2024.

**Archivos creados:** `src/hooks/useCurrentActiveTimer.ts`  
**Archivos modificados:** `src/components/timer/TimerView.tsx`

---

## Fase 4 — Nombre de empresa no aparecía en TimerView

### Prompt 4-A — Primer reporte del fallo de nombre de empresa

**Contexto:** Con el timer activo detectado correctamente, el siguiente síntoma era que el nombre de la empresa no aparecía en pantalla, a pesar de que sí había registros TES en la base de datos.

> "otro fallo que encontre, es que en el timer no se representa la empresa que esta"

**Decisión desencadenada:**  
Se inició el proceso de debug. Se añadió un `console.group` con `JSON.stringify` explícito de todos los valores relevantes: `socketTimerId`, `calculatedTimerId`, `activeTimerId`, `idSalaActiva`, `currentEmpresaId`, `currentEmpresaNombre`, `timers` (todos los `idTemporizador`), `tesList` (todos los `idTimer`).

**Archivos modificados:** `src/components/timer/TimerView.tsx` (añadido bloque de debug)

---

### Prompt 4-B — Confirmación de que el fallo es de ID de empresa

**Contexto:** Tras añadir el debug, el usuario revisó los logs y confirmó que el problema era de identificadores: el `activeTimerId` que se usaba para buscar en TES no correspondía con el `idTimer` que TES tenía en sus registros.

> "revisa bien el fallo porque al final es un problema de no coger bien el id de la empresa"

**Decisión desencadenada:**

Dos fixes simultáneos:

**Fix 1 — Prioridad de fuente del ID:**  
Se cambió la prioridad de `socketTimerId ?? calculatedTimerId` a `calculatedTimerId ?? socketTimerId`. El ID calculado desde REST usa `idTemporizador`, que es exactamente la FK `idTimer` en TES. El ID del socket puede seguir un esquema interno diferente del backend.

```typescript
// ANTES
const activeTimerId = socketTimerId ?? calculatedTimerId;

// DESPUÉS
const activeTimerId = calculatedTimerId ?? socketTimerId;
```

**Fix 2 — getEmpresaNombre devuelve '' vs null:**  
`getEmpresaNombre()` devolvía `''` cuando la lista de empresas aún no había cargado. Se añadió `|| null` para que el valor sea `null` (semánticamente "desconocido / cargando") en lugar de `''` (semánticamente "cadena vacía").

```typescript
const currentEmpresaNombre =
  currentEmpresaId != null
    ? (getEmpresaNombre(empresas, currentEmpresaId) || null)
    : null;
```

**Archivos modificados:** `src/components/timer/TimerView.tsx`

---

## Fase 5 — Timezone y horario de verano (DST)

### Prompt 5-A — Contexto del documento heredado de zona horaria

**Contexto:** En el repositorio existía el archivo `docs/fix-timezone-dst.md` heredado del proyecto original. Describía un bug con Luxon y los cambios de hora en España. El usuario quería saber si ese problema era aplicable al nuevo proyecto.

> "es orientativo al problema, no quiere decir que este en nuestro proyecto, es heredado del anterior proyecto, habia un problema con las zonas horarias y las horas y no se si se resolvio ya"

**Decisión desencadenada:**  
Se realizó una auditoría de zona horaria del nuevo código. Conclusión: Luxon no existe en el nuevo proyecto, pero se identificaron dos puntos equivalentes de riesgo:
1. `new Date().toISOString().split('T')[0]` en `Temporizadores.tsx` devuelve fecha UTC.
2. `new Date().getHours()` en `useCurrentActiveTimer.ts` usa la timezone del SO del navegador.

Se documentó el diagnóstico completo al usuario antes de proponer solución.

**Archivos analizados:** `src/components/admin/Temporizadores.tsx`, `src/hooks/useCurrentActiveTimer.ts`

---

### Prompt 5-B — Blindar timezone al 100%

**Contexto:** Tras el diagnóstico, el usuario validó la importancia del problema y solicitó una solución robusta y definitiva.

> "quiero blindarlo al 100%, es el mayor reto de este proyecto"

**Decisión desencadenada:**  
Creación de `src/utils/timezone.ts` con tres exports:
- `nowMadridMinutes()`: minutos desde medianoche en Europe/Madrid.
- `todayMadrid()`: fecha de hoy como `YYYY-MM-DD` en Madrid.
- `nowMadridHHMM()`: hora y minuto en Madrid.

Implementación con `Intl.DateTimeFormat` + `formatToParts()`. Sin librerías externas. Singleton formatter. 22 tests Vitest cubriendo CET, CEST, spring-forward, fall-back y regresiones.

Sustituciones en el código existente:
- `new Date().getHours() * 60 + ...` → `nowMadridMinutes()` en `useCurrentActiveTimer.ts`
- `new Date().toISOString().split('T')[0]` → `todayMadrid()` en `Temporizadores.tsx`
- Efecto de debug en `TimerView.tsx` actualizado.

**Archivos creados:** `src/utils/timezone.ts`  
**Archivos modificados:** `src/hooks/useCurrentActiveTimer.ts`, `src/components/admin/Temporizadores.tsx`, `src/components/timer/TimerView.tsx`

---

## Fase 6 — Display 00:00 cuando no hay evento activo

### Prompt 6-A — Timer activado cuando no hay evento

**Contexto:** El usuario observó que el componente `Tiempo` mostraba algún valor aunque no hubiera ningún evento en curso.

> "si no hay evento, no quiero que el timer se active en la principal, quiero que este a 00:00"

**Decisión desencadenada:**  
En `TimerView`, se condicionó el valor pasado a `<Tiempo>` al estado de `activeTimerId`:

```typescript
<Tiempo remainingSeconds={activeTimerId !== null ? remainingSeconds : 0} />
```

Se añadió también la guarda `remainingSeconds > 0` en el disparador de vibración.

**Archivos modificados:** `src/components/timer/TimerView.tsx`

---

## Fase 7 — Fuente de verdad del countdown: desde "vamos" vs desde el inicio programado

### Prompt 7-A — Discrepancia entre tiempo mostrado y tiempo real del evento

**Contexto:** Durante una prueba en vivo con el evento corriendo, el usuario observó que el tiempo mostrado en pantalla era inferior al tiempo real restante según el horario programado.

> "ahora por ejemplo hay un timer corriendo que pone que quedan 26 minutos, pero el evento acabo a las 18:50, quedan 35 minutos"

**Decisión desencadenada:**

Diagnóstico: el backend emite `envio` con los segundos restantes contados desde el momento en que el operador pulsó "Vamos", no desde el `inicio` programado del timer. Si "Vamos" se presionó 9 minutos tarde, el countdown del socket ya nace con 9 minutos de déficit.

Solución: eliminar el listener de `envio` del socket por completo y crear `useCalculatedRemainingSeconds` que calcula los segundos restantes desde:

```
endMinutes = startMinutes + categoria.duracion
remaining = (endMinutes - nowMadridMinutes()) * 60
```

El hook corre `setInterval(1000)` y recalcula cada segundo. Se exporta también `computeRemainingSeconds(timer, categoria, nowMinutes)` como función pura testeable.

**Archivos creados:** `src/hooks/useCalculatedRemainingSeconds.ts`  
**Archivos modificados:** `src/hooks/useTimerSocket.ts` (eliminado listener `envio`), `src/components/timer/TimerView.tsx` (usa nuevo hook)

---

## Fase 8 — Selección y persistencia de sala

### Prompt 8-A — Selección de sala con persistencia entre recargas

**Contexto:** `TimerView` filtra los registros TES por sala activa. Sin una sala seleccionada, la pantalla no puede determinar qué empresa mostrar. La pantalla es una ruta standalone sin componente padre que inyecte la sala.

> "el usuario tiene que poder elegir su sala y que se recuerde al recargar"

**Decisiones desencadenadas:**

1. Creación de `SalaPopUp`: modal accesible (`role="dialog"`, `aria-modal`, `aria-label`) que carga las salas vía `useSalas()`. Cierre al pulsar fuera con la guarda `e.target === e.currentTarget`. No puede cerrarse si `idSalaActiva` sigue siendo `null`.
2. Creación de `uiStore`: Zustand con middleware `persist` (clave `'ui-store'`). Solo persiste `idSalaActiva` mediante `partialize`. Acciones: `setIdSalaActiva(id)` y `clearIdSalaActiva()`.
3. `TimerView` inicializa `showSalaPopup` como `idSalaActiva === null`. El botón del header "Seleccionar sala" reabre el modal.

**Archivos creados:** `src/components/timer/SalaPopUp.tsx`, `src/stores/uiStore.ts`  
**Archivos modificados:** `src/components/timer/TimerView.tsx`

---

## Fase 9 — Próximos turnos en TimerView

### Prompt 9-A — Mostrar los turnos siguientes en la pantalla de sala

**Contexto:** Operadores y empresas necesitan saber qué turnos llegan después del activo para prepararse. La pantalla del temporizador es el único punto de información compartido durante el evento.

> "en el timerview, deberia verse quien viene despues y el slot siguiente"

**Decisiones desencadenadas:**

Sección de pie de página (`aria-label="Próximos turnos"`) con los dos temporizadores siguientes al activo. Derivación de datos en memoria:

```typescript
const sortedTimers = [...timers];
const currentTimerIndex = sortedTimers.findIndex((t) => t.idTemporizador === activeTimerId);
const nextTimer = sortedTimers[currentTimerIndex + 1] ?? null;
const afterNextTimer = sortedTimers[currentTimerIndex + 2] ?? null;
```

Función `getLineInfo(timer)` resuelve empresa (`getLineEmpresaId` + `getEmpresaNombre`), categoría (`getCategoriaNombre`) e intervalo horario (`formatInicio` + `calcularFin`) para cada fila. La sección no se renderiza si ninguno de los dos turnos tiene datos para la sala activa.

**Archivos modificados:** `src/components/timer/TimerView.tsx`

---

## Fase 10 — Rehabilitación de EmpresasEventoTimers (M-11)

### Prompt 10-A — Rehabilitar ruta comentada y corregir bug de categorías

**Contexto:** La ruta `/empresastimers` estaba comentada en el `Router.js` original porque `getFinal()` siempre devolvía `""`. Causa raíz: `componentDidMount` nunca llamaba a `getCategorias()`, por lo que `this.state.categorias` siempre era `[]`.

> (Rehabilitación de la ruta comentada en Router.js original, según decisión del PRD)

**Decisiones desencadenadas:**

Creación de `EmpresasEventoTimers.tsx` con la corrección de M-11:

- `duracion` se obtiene directamente de `EventoActual` (el backend lo incluye como campo propio), sin necesidad de buscar la categoría.
- `calcularFin(ev.inicioTimer, ev.duracion)` sustituye al camino largo `idCategoria → categorias → duracion`.
- La ruta `/empresastimers` se re-habilita en `App.tsx`.

```typescript
// Antes (original — categorias nunca cargaba)
getFinal(ev) {
  const cat = this.state.categorias.find(c => c.idCategoria === ev.idCategoria);
  return cat ? calcularFin(ev.inicioTimer, cat.duracion) : "";
}

// Después (migrado — duracion viene directo en EventoActual)
calcularFin(ev.inicioTimer, ev.duracion)
```

**Archivos creados:** `src/components/eventos/EmpresasEventoTimers.tsx`  
**Archivos modificados:** `src/App.tsx`

---

## Fase 11 — Revisión de calidad de código

### Prompt 11-A — Revisión de calidad con senior-code-quality-agent

**Contexto:** Con la codebase completa tras las diez fases de implementación, se realizó una pasada de revisión de calidad sobre todos los módulos: `src/api/`, `src/stores/`, `src/hooks/`, `src/utils/`, `src/components/`.

> (Invocación del senior-code-quality-agent para revisión completa de la codebase)

**Resultado:**

- 0 hallazgos bloqueantes.
- 1 hallazgo de alta severidad: `EmpresasEventoTimersNew` usa manipulación DOM en `didOpen` (HTML injection no reactivo). El patrón del antipatrón original (Bug 2-A) persiste en este componente.
- 3 hallazgos de media severidad: tipo `null` en `getCategoriaDuracion`, O(n²) en `checkOverlapForDuration`, uso de `void` en handlers async.
- 8 positivos destacados: singleton WebSocket, `useAuthStore.getState()` en interceptor, Zod parse en cada `queryFn`, `Promise.all` en hooks de borrado, funciones puras en `utils/time.ts`, `Tiempo.tsx` desacoplado del socket.
- 11/12 defectos de migración verificados resueltos. M-12 es deuda conocida.

**Archivos producidos:** `docs/code-quality-review.md`

---

## Fase 12 — Estrategia de testing

### Prompt 12-A — Definición de estrategia de tests con senior-testing-agent

**Contexto:** Tras la revisión de calidad, se definió la estrategia de tests para la codebase migrada. Se estableció la pirámide objetivo, el presupuesto de suite, los tests ya implementados y la lista priorizada de tests pendientes.

> (Invocación del senior-testing-agent para definir la estrategia de tests del proyecto)

**Decisiones desencadenadas:**

- Pirámide objetivo: 70% unitarios / 20% componente + integración / 10% E2E.
- Herramientas: Vitest, `@testing-library/react`, MSW, Playwright, `@vitest/coverage-v8`.
- Tests implementados: 30 unitarios en `src/utils/time.test.ts` + 22 unitarios en `src/utils/timezone.test.ts` (CET, CEST, spring-forward, fall-back).
- Tests pendientes (T-04 a T-12): Login 401, borrado con Promise.all, socket invalidation, leak de listeners, codificación de caracteres especiales, Bearer token en peticiones, 401 redirect, fix M-11 en EmpresasEventoTimers, flujo E2E completo.
- Política de flakiness: un test flaky es un bloqueante. Prohibido `skip` indefinido.

**Archivos producidos:** `docs/testing-strategy.md`

---

## Resumen de prompts por impacto técnico

| Prompt | Fase | Impacto | Archivos nuevos | Archivos modificados |
|--------|------|---------|-----------------|----------------------|
| 2-A | UX | Patrón Swal correcto | — | EmpresasEventoTimersNew.tsx |
| 2-B | UX | Rutas standalone, TimerMenu, ProtectedRoute, roles | TimerMenu.tsx | App.tsx, TimerView.tsx, Login.tsx, ProtectedRoute.tsx |
| 2-C | UX | Navegación desde Login | — | Login.tsx |
| 4-A | Bug | Debug con JSON.stringify | — | TimerView.tsx |
| 4-B | Bug | Prioridad calculado>socket, `\|\| null` | — | TimerView.tsx |
| 5-A | Auditoría DST | Diagnóstico zona horaria | — | — |
| 5-B | DST | Timezone blindado al 100% | timezone.ts | useCurrentActiveTimer.ts, Temporizadores.tsx, TimerView.tsx |
| 6-A | UX | 00:00 sin evento activo | — | TimerView.tsx |
| 7-A | Bug crítico | Countdown desde inicio vs desde "vamos" | useCalculatedRemainingSeconds.ts | useTimerSocket.ts, TimerView.tsx |
| 8-A | Funcionalidad | Selección y persistencia de sala | SalaPopUp.tsx, uiStore.ts | TimerView.tsx |
| 9-A | Funcionalidad | Próximos turnos en footer de TimerView | — | TimerView.tsx |
| 10-A | Rehabilitación M-11 | EmpresasEventoTimers con `duracion` directo | EmpresasEventoTimers.tsx | App.tsx |
| 11-A | Calidad | Revisión completa codebase — 0 bloqueantes | docs/code-quality-review.md | — |
| 12-A | Testing | Estrategia pirámide + suite presupuesto | docs/testing-strategy.md | — |
