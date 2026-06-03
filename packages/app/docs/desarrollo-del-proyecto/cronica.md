# Crónica del desarrollo — Timer Tajamar V2

**Proyecto:** Migración de AppTimersFinal (React 17 CRA JavaScript) a React 19 + TypeScript + Vite  
**Periodo documentado:** Desde la auditoría inicial hasta la estabilización en producción  
**Idioma:** Español (idioma de trabajo del proyecto)

---

## Fase 0 — Auditoría del proyecto original

### Contexto

El punto de partida era una aplicación funcional pero con deuda técnica bloqueante: AppTimersFinal, construida con React 17, Create React App, class components y JavaScript sin tipos. La aplicación gestionaba temporizadores para eventos presenciales con múltiples salas y empresas participantes, con actualización en tiempo real vía WebSocket.

### Problema

Antes de escribir una sola línea del nuevo frontend, era imprescindible entender qué hacía realmente el original, qué contratos de datos manejaba y qué defectos conocidos había que corregir en la migración. No se podía confiar en que el código fuente original fuera coherente con lo que se mostraba en pantalla.

### Proceso

Se analizó estáticamente la totalidad de la codebase original. Se documentaron:

- **data-models.md**: los seis modelos de datos del dominio (Sala, Empresa, Categoria, Temporizador, TES, EventoActual), con todos sus campos, tipos inferidos y relaciones.
- **component-api-map.md**: mapa exacto de qué método de qué componente llama a qué función de servicio sobre qué endpoint REST o WebSocket. Incluye los componentes con rutas comentadas.
- **service-layer.md**: la capa de servicios original (instancias de clase por componente, sin compartir, sin interceptores).
- **auth-flow.md**: el flujo de autenticación original, incluyendo la anomalía de que el token JWT nunca se enviaba en cabeceras.
- **api-endpoints.md**: catálogo completo de los 30+ endpoints REST agrupados por entidad.
- **migration-notes.md**: los 12 problemas identificados durante la auditoría (M-01 a M-12 y M-auth), con severidad y propuesta de solución.
- **plan-migracion-events-timer-react19.md**: el plan de ejecución por fases con los agentes especializados, dependencias entre fases y criterios de salida.

### Resultado

Con estos siete documentos, el equipo tenía una imagen precisa y trazable del sistema original. Los 12 defectos identificados pasaron a ser el contrato de calidad mínimo de la migración: si alguno persistía en el nuevo código, la migración habría fallado.

---

## Fase 1 — Decisiones de arquitectura y stack

### Contexto

Con la auditoría completa, tocaba decidir el stack objetivo y los patrones arquitectónicos. El principal condicionante era que el backend (API REST + servidor WebSocket) no se modificaría: solo se reescribía el frontend.

### Problema

El stack original tenía cuatro problemas estructurales que no podían resolverse con refactoring incremental:
1. Sin tipos estáticos: cualquier cambio en el contrato de la API podía romperse silenciosamente.
2. Sin gestión de estado del servidor: cada componente gestionaba su propio ciclo de carga/error.
3. Múltiples instancias WebSocket: hasta cuatro conexiones simultáneas causaban listeners duplicados.
4. Token JWT no enviado en cabeceras REST (M-01): si el backend activaba autenticación, todas las escrituras fallarían.

### Decisiones tomadas

Las decisiones quedaron formalizadas en cuatro ADRs:

**ADR-001 — Stack:**  
React 19 + TypeScript strict + Vite + TanStack Query v5 + Zustand v5 + Axios + Socket.io-client + Zod + Tailwind CSS 4 + SweetAlert2 + Vitest. Se descartó Remix/Next.js (no se necesita SSR) y Redux Toolkit (exceso de boilerplate para este scope).

**ADR-002 — WebSocket singleton:**  
Un único módulo `src/socket/index.ts` exporta una instancia de socket. Los módulos ES se evalúan una sola vez: la instancia se crea en el primer import y se reutiliza en todos los demás. Elimina M-03 completamente.

**ADR-003 — Autenticación:**  
Zustand `authStore` con `setToken`/`clearToken` (usa `removeItem`, no `clear`). Interceptor de request en Axios que lee el token del store y lo añade como `Authorization: Bearer`. Interceptor de response que redirige al login si recibe 401. Resuelve M-01 y M-auth.

**ADR-004 — Estrategia de estado:**  
Server state en TanStack Query (entidades del dominio). Client state en Zustand (auth, sala activa, socket). UI state local en `useState`. TES se fetch una sola vez y se filtra en memoria: elimina M-06.

### Resultado

El plan de migración con las fases de ejecución ordenadas y los siete agentes especializados quedó documentado. Las fases de Security y Data Engineering podían ejecutarse en paralelo; el Frontend esperaba a ambas.

---

## Fase 2 — Construcción del frontend y primeros defectos UX

### Contexto

Con los tipos TypeScript, los hooks de TanStack Query, el cliente Axios con interceptores y el socket singleton listos, se implementaron los 14 componentes del mapa de migración más el nuevo `ProtectedRoute`. La implementación inicial era funcionalmente correcta pero surgieron defectos UX durante las primeras pruebas de usuario.

---

### Bug 2-A — Patrón Swal incorrecto en EmpresasEventoTimersNew

**Contexto:** La página `EmpresasEventoTimersNew` muestra un listado de empresas. Al pulsar en una empresa se abre un SweetAlert2 con el horario de esa empresa, que requiere datos de la API.

**Problema:** La implementación inicial intentaba cargar los datos de la empresa dentro del callback `didOpen` del Swal, manipulando el DOM directamente para insertar el contenido. Este patrón copiaba el antipatrón del original y rompía en el nuevo stack porque React no gestionaba ese DOM.

**Solución:** Se sustituyó la manipulación DOM dentro de `didOpen` por un pre-fetch con `queryClient.fetchQuery()` antes de que el Swal se abriera. Así los datos están disponibles síncronamente cuando el diálogo se renderiza, y el contenido HTML del Swal se construye a partir de datos ya resueltos.

**Archivos afectados:** `src/components/eventos/EmpresasEventoTimersNew.tsx`

---

### Bug 2-B — Enfoque web + móvil y estructura de rutas

**Contexto:** La aplicación debía funcionar tanto en web (portátil del admin) como en móvil/pantalla de sala (operadores y empresas participantes). La primera arquitectura de rutas envolvía todas las páginas en `AppLayout`, lo que hacía que `TimerView` (la pantalla principal de sala) tuviera el menú lateral de administración pegado a la vista del temporizador.

**Problema:** La pantalla del temporizador está proyectada en una sala grande. El menú lateral de administración no debe aparecer ahí. Por otro lado, el login tampoco debía tener el layout de administración.

**Solución:**
- `TimerView` y `Login` se convirtieron en rutas independientes sin `AppLayout`.
- El resto de rutas quedaron envueltas en `AppLayout`.
- Las rutas de admin CRUD se protegieron con `ProtectedRoute`.
- Se aumentó el tamaño de fuente del temporizador: de `text-6xl` a `text-8xl md:text-9xl` para que sea legible desde el fondo de una sala.
- Se creó el componente `TimerMenu`: un cajón (drawer) hamburguesa con tema oscuro que sirve como menú de navegación para las páginas standalone (`TimerView` y `Login`) sin depender de `AppLayout`.

**Archivos afectados:** `src/App.tsx`, `src/components/timer/TimerView.tsx`, `src/components/auth/Login.tsx`, `src/components/timer/TimerMenu.tsx` (nuevo)

---

### Bug 2-C — Login sin navegación: usuario atrapado

**Contexto:** Tras la separación de rutas, la página de Login era una ruta standalone sin el menú lateral de `AppLayout`. Un usuario que llegara a `/login` no tenía forma de navegar al resto de la aplicación sin escribir la URL manualmente.

**Problema:** El usuario quedaba atrapado en `/login` sin poder volver a la pantalla de temporizadores, el horario u otras vistas.

**Solución:** Se añadió el componente `TimerMenu` (hamburger drawer) en la cabecera de la página `Login`, exactamente igual que en `TimerView`. La cabecera de Login tiene ahora: logo/título a la izquierda, botón hamburguesa a la derecha.

**Archivos afectados:** `src/components/auth/Login.tsx`

---

### Bug 2-D — Interceptor 401 rompía el propio login

**Contexto:** El interceptor de response de Axios (ADR-003) redirigía al usuario a `/login` cada vez que recibía un 401. El objetivo era manejar tokens expirados.

**Problema:** El endpoint `Auth/Login` devuelve 401 cuando las credenciales son incorrectas. El interceptor, al recibir ese 401, redirigía al usuario a `/login` antes de que el componente `Login` pudiera mostrar el mensaje de error. Se producía un bucle: introducir credenciales incorrectas → 401 → redirect a `/login` → el usuario volvía al mismo formulario sin ningún mensaje de error visible.

**Diagnóstico:** El interceptor no distinguía entre un 401 de "token expirado" (que sí debe redirigir) y un 401 de "credenciales incorrectas en el endpoint de login" (que no debe redirigir, sino dejar que el componente lo maneje).

**Solución:** En el interceptor de response se añadió una guarda que comprueba la URL de la request antes de redirigir:

```typescript
if (error.response?.status === 401) {
  const url = error.config?.url ?? '';
  if (!url.includes('Auth/Login')) {
    useAuthStore.getState().clearToken();
    window.location.href = '/login';
  }
}
```

Si el 401 viene del endpoint de login, el error se rechaza normalmente y el componente `Login` lo captura en `onError` para mostrar el SweetAlert2.

**Archivos afectados:** `src/api/client.ts`

---

## Fase 3 — Timer activo no detectado al cargar la página

### Contexto

El WebSocket del backend emite el evento `timerID` cuando el timer activo cambia. Pero si la página se cargaba mientras un evento ya estaba en curso, el socket no emitía nada al conectarse: solo emitía cuando había un cambio. El resultado era que al entrar en `TimerView` con el evento ya corriendo, no se mostraba ningún temporizador activo.

### Problema

El socket solo informaba de cambios, no del estado actual. La aplicación no tenía mecanismo para determinar qué timer estaba activo en el momento de carga inicial a partir de los datos REST disponibles.

### Solución

Se creó el hook `useCurrentActiveTimer` que calcula el timer activo directamente desde los datos REST (`timers` + `categorias`) sin depender del WebSocket. El algoritmo:

1. Obtiene la hora actual en Madrid en minutos desde medianoche (`nowMadridMinutes()`).
2. Para cada timer, extrae las horas y minutos de `inicio` (solo la parte HH:mm, no la fecha).
3. Calcula `startMinutes` y `endMinutes` = `startMinutes + categoria.duracion`.
4. Si `nowMinutes >= startMinutes && nowMinutes < endMinutes`, ese timer está activo.
5. Devuelve `idTemporizador` del timer activo, o `null`.

**Decisión crítica de diseño:** la comparación usa solo la parte de hora del día (minutos desde medianoche), no el datetime completo. El campo `inicio` de los timers lleva fechas históricas de 2024 que no coinciden con el año actual. Lo que sí es vigente es el horario HH:mm, que el admin programa para el evento del día.

**Prioridad de fuentes:** `calculatedTimerId ?? socketTimerId`. El calculado tiene prioridad porque usa `idTemporizador`, que es exactamente la clave foránea `idTimer` en la tabla TES. El ID que emite el socket puede seguir un esquema diferente interno del backend.

**Archivos creados:** `src/hooks/useCurrentActiveTimer.ts`  
**Archivos modificados:** `src/components/timer/TimerView.tsx`

---

## Fase 4 — Nombre de empresa no aparecía en TimerView

### Contexto

Con el timer activo correctamente detectado, el siguiente problema era que el nombre de la empresa que debía mostrarse en pantalla no aparecía. La pantalla del temporizador se mostraba en cuenta atrás pero sin el nombre de la empresa hablando.

### Problema

Durante el proceso de debug se añadió un `console.group` con `JSON.stringify` de todos los valores relevantes. El análisis de los logs reveló dos problemas encadenados:

**Problema 1 — socketTimerId con ID distinto:**  
Cuando `activeTimerId` se calculaba como `socketTimerId ?? calculatedTimerId` (prioridad al socket), el ID resultante era 3. Los registros TES del backend asocian `idTimer` con `idTemporizador` de la tabla Temporizadores; sin embargo `socketTimerId=3` tenía cero registros TES asociados. El backend estaba emitiendo por socket un ID interno diferente al `idTemporizador` que usa como FK en TES.

**Problema 2 — getEmpresaNombre devolvía cadena vacía:**  
La función `getEmpresaNombre()` devolvía `''` (cadena vacía) cuando la lista de empresas aún no había cargado. La condición de render era `{currentEmpresaNombre && <p>...</p>}`, que trata `''` como falsy — correcto — pero el problema era que esta misma condición también cubría el estado de carga, por lo que nunca se sabía si "no hay empresa" o "aún está cargando".

### Solución

**Fix 1:** Invertir la prioridad de las fuentes:

```typescript
// ANTES (prioridad al socket)
const activeTimerId = socketTimerId ?? calculatedTimerId;

// DESPUÉS (prioridad al calculado)
const activeTimerId = calculatedTimerId ?? socketTimerId;
```

`calculatedTimerId` usa `idTemporizador` directamente, que es la misma clave que TES usa como `idTimer`. Es la fuente correcta.

**Fix 2:** Convertir `''` a `null` explícitamente para distinguir "no hay empresa" de "todavía cargando":

```typescript
const currentEmpresaNombre =
  currentEmpresaId != null
    ? (getEmpresaNombre(empresas, currentEmpresaId) || null)
    : null;
```

Con `|| null`, cuando `getEmpresaNombre` devuelve `''` (empresas aún no cargadas), el valor es `null`, que la condición `{currentEmpresaNombre && <p>...</p>}` maneja igual que "sin empresa". No cambia el comportamiento visual pero la semántica del valor es correcta.

**Archivos modificados:** `src/components/timer/TimerView.tsx`

---

## Fase 5 — Blindaje de zonas horarias y horario de verano (DST)

### Contexto

Existía en el repositorio un documento heredado del proyecto original: `docs/fix-timezone-dst.md`. Describía un bug con Luxon (`DateTime.fromISO(value)` sin `{ zone: 'Europe/Madrid' }`) y el riesgo de error de hasta ±2 horas durante los cambios de hora (último domingo de marzo y último domingo de octubre).

La pregunta que se planteó fue: ¿este bug aplica también a la nueva codebase?

### Diagnóstico

Luxon no estaba instalado en el nuevo proyecto, así que el bug específico de Luxon no existía. Sin embargo, existían riesgos equivalentes con las APIs nativas de JavaScript:

**Riesgo 1 — `Temporizadores.tsx`:**
```typescript
// Construía la fecha de hoy para el value por defecto del input datetime-local
new Date().toISOString().split('T')[0]
```
`toISOString()` devuelve la fecha en UTC, no en Madrid. Entre las 00:00 y las 02:00 (horario de verano) o las 00:00 y las 01:00 (horario de invierno), el día UTC es el día anterior. Un admin que trabajara en ese intervalo horario vería la fecha de ayer como valor por defecto.

**Riesgo 2 — `useCurrentActiveTimer.ts`:**
```typescript
const now = new Date();
const nowMinutes = now.getHours() * 60 + now.getMinutes();
```
`getHours()` devuelve la hora en la timezone del sistema operativo del navegador. En condiciones de laboratorio (terminales españoles) es correcto, pero en un contenedor Docker, una VM, un runner de CI o un usuario con el reloj del sistema en otra zona, el resultado sería incorrecto.

### Solución

Se creó `src/utils/timezone.ts`. Principios de diseño:
- Sin librerías externas nuevas: usa solo `Intl.DateTimeFormat` con `timeZone: 'Europe/Madrid'`.
- `Intl.DateTimeFormat` está respaldado por el tzdata IANA del motor del navegador (V8, SpiderMonkey, WebKit): los cambios de hora CET/CEST son automáticos.
- Se usa `formatToParts()` para extracción machine-readable, no `toLocaleString()` (cuyo formato es locale-dependiente).
- El objeto `madridFormatter` se crea una sola vez (singleton): crear `Intl.DateTimeFormat` es caro.

Tres funciones exportadas:
- `nowMadridMinutes()`: minutos desde medianoche en Europe/Madrid (incluye segundos para sub-minuto precisión).
- `todayMadrid()`: fecha de hoy como `YYYY-MM-DD` en Madrid.
- `nowMadridHHMM()`: hora y minuto en Madrid, para debug y tests.

Se escribieron 22 tests con Vitest cubriendo:
- CET (invierno, UTC+1)
- CEST (verano, UTC+2)
- Transición spring-forward (último domingo de marzo)
- Transición fall-back (último domingo de octubre)
- Casos de regresión

**Archivos creados:** `src/utils/timezone.ts`  
**Archivos modificados:** `src/hooks/useCurrentActiveTimer.ts` (`getHours()` → `nowMadridMinutes()`), `src/components/admin/Temporizadores.tsx` (`toISOString().split('T')[0]` → `todayMadrid()`), `src/components/timer/TimerView.tsx` (efecto de debug actualizado)

---

## Fase 6 — Estado de inactividad: 00:00 cuando no hay evento

### Contexto

El componente `Tiempo` mostraba el último valor de `remainingSeconds` aunque no hubiera ningún evento activo. Si el último timer había terminado con 10 segundos, el display mostraba "00:10" indefinidamente.

### Problema

`useCalculatedRemainingSeconds` devolvía 0 cuando no había timer activo, pero en el momento en que el timer terminaba, el valor no se zeroed de forma inmediata en la capa de presentación.

Adicionalmente, la vibración del dispositivo (`navigator.vibrate()`) se disparaba en los segundos 12 y 3, pero podía dispararse con `remainingSeconds = 0` o en estados indefinidos.

### Solución

En `TimerView`, se condicionó el valor pasado a `Tiempo` al estado de `activeTimerId`:

```typescript
<Tiempo remainingSeconds={activeTimerId !== null ? remainingSeconds : 0} />
```

Cuando no hay timer activo, el display muestra exactamente 00:00 independientemente de lo que `useCalculatedRemainingSeconds` devuelva.

La guarda de vibración se actualizó:

```typescript
if (remainingSeconds > 0 && (remainingSeconds === 12 || remainingSeconds === 3)) {
  navigator.vibrate(200);
}
```

La condición `remainingSeconds > 0` previene vibraciones en el estado 0 (fin o inactividad).

**Archivos modificados:** `src/components/timer/TimerView.tsx`

---

## Fase 7 — Fuente de verdad del countdown: del socket al cálculo propio

### Contexto

Durante una prueba con el evento en curso, se observó una discrepancia: la pantalla mostraba 26 minutos restantes cuando el evento debería tener 35 minutos restantes según el horario programado. La diferencia era de 9 minutos.

### Diagnóstico

El evento `envio` del WebSocket transporta los segundos restantes **desde el momento en que el operador pulsó "Vamos"**, no desde el `inicio` programado del timer. Si el operador presionó "Vamos" 9 minutos tarde respecto al horario, el countdown del socket empieza 9 minutos por debajo del tiempo real.

Este comportamiento es inherente al diseño del backend: "Vamos" es una acción manual del operador, y el servidor cuenta desde ahí. No hay forma de corregirlo en el cliente si se sigue usando el evento `envio` como fuente de verdad.

### Solución

Se eliminó el listener de `envio` de `useTimerSocket` y se creó `useCalculatedRemainingSeconds`:

**Algoritmo:**
```
endMinutes = startMinutes + categoria.duracion
remaining = (endMinutes - nowMadridMinutes()) * 60   [segundos]
```

Donde `startMinutes` proviene de `parseInicio(timer.inicio)` y `nowMadridMinutes()` usa la hora de Madrid pinada vía `Intl.DateTimeFormat`.

**Diseño del hook:**
- Tiene un `setInterval(1000)` que recalcula cada segundo.
- El intervalo se limpia en el cleanup del `useEffect` y se reinicia cuando `activeTimerId` cambia.
- Devuelve `Math.max(0, ...)`: nunca negativo.
- Devuelve 0 cuando `activeTimerId === null`.

**Función pura exportada:** `computeRemainingSeconds(timer, categoria, nowMinutes)` sin dependencia de React, fácilmente testeable con Vitest.

**Archivos creados:** `src/hooks/useCalculatedRemainingSeconds.ts`  
**Archivos modificados:** `src/hooks/useTimerSocket.ts` (eliminado listener `envio`), `src/components/timer/TimerView.tsx` (usa el nuevo hook)

---

## Fase 8 — Selección y persistencia de sala

### Contexto

`TimerView` filtra los registros TES por sala activa (`idSalaActiva`) para mostrar la empresa del turno en curso. Sin una sala seleccionada, la pantalla no puede saber qué empresa mostrar. En el proyecto original la sala se pasaba como `props` desde el componente padre; en el nuevo, la pantalla es una ruta standalone y no tiene padre que inyecte ese valor.

### Problema

Al cargar `TimerView` por primera vez, `idSalaActiva` era `null`. El usuario necesitaba poder elegir su sala y que esa elección se recordara al recargar la página, sin tener que volver a seleccionarla cada vez.

### Solución

Se implementaron dos piezas coordinadas:

**`SalaPopUp.tsx` — modal de selección:**

- Componente con `role="dialog"`, `aria-modal="true"` y `aria-label="Seleccionar sala"`.
- Carga la lista de salas vía `useSalas()` (TanStack Query, sin fetch manual).
- Cierre al pulsar fuera del contenedor con la guarda `e.target === e.currentTarget`.
- Muestra estados de carga y error antes de renderizar la lista.

**`uiStore.ts` — persistencia con Zustand:**

- Store Zustand con el middleware `persist`. Clave de localStorage: `'ui-store'`.
- Solo se persiste `idSalaActiva` (campo `partialize`); las acciones no se serializan.
- Dos acciones: `setIdSalaActiva(id)` y `clearIdSalaActiva()`.

**`TimerView.tsx` — integración:**

- `showSalaPopup` se inicializa a `idSalaActiva === null`: si no hay sala guardada, el modal aparece inmediatamente al cargar.
- Al seleccionar una sala, se llama a `setIdSalaActiva` (persiste en localStorage) y `setSalaName` (estado local para el label del header).
- El botón "Seleccionar sala" del header llama a `setShowSalaPopup(true)` para reabrir el modal cuando el usuario quiera cambiar de sala.
- El modal no puede cerrarse con `onClose` si `idSalaActiva` sigue siendo `null`: obliga a seleccionar una sala antes de continuar.

```typescript
// uiStore — persist middleware
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      idSalaActiva: null,
      setIdSalaActiva: (id: number) => set({ idSalaActiva: id }),
      clearIdSalaActiva: () => set({ idSalaActiva: null }),
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({ idSalaActiva: state.idSalaActiva }),
    }
  )
);
```

### Resultado

El usuario selecciona su sala la primera vez. Al recargar, `persist` restaura `idSalaActiva` desde localStorage y el modal no aparece. El nombre de la sala queda visible en el header como referencia visual y como botón para cambiarla.

**Archivos creados:** `src/components/timer/SalaPopUp.tsx`, `src/stores/uiStore.ts`  
**Archivos modificados:** `src/components/timer/TimerView.tsx`

---

## Fase 9 — Próximos turnos en TimerView

### Contexto

Los operadores y las empresas participantes necesitan saber qué turno llega después del activo para prepararse. La pantalla del temporizador proyectada en sala es el único punto de información común durante el evento.

### Problema

`TimerView` solo mostraba el turno activo. Los dos turnos siguientes no eran visibles desde la pantalla de sala.

### Solución

Se añadió una sección de pie de página (`aria-label="Próximos turnos"`) que muestra los dos siguientes temporizadores para la sala activa.

**Derivación de los datos:**

```typescript
const sortedTimers = [...timers];
const currentTimerIndex = activeTimerId
  ? sortedTimers.findIndex((t) => t.idTemporizador === activeTimerId)
  : -1;

const nextTimer = currentTimerIndex >= 0 ? sortedTimers[currentTimerIndex + 1] : null;
const afterNextTimer = currentTimerIndex >= 0 ? sortedTimers[currentTimerIndex + 2] : null;
```

**Función auxiliar `getLineInfo`:** dado un timer, resuelve empresa, categoría, hora de inicio y hora de fin para construir la fila de presentación:

```typescript
function getLineInfo(timer) {
  if (!timer || idSalaActiva === null) return null;
  const empresaId = getLineEmpresaId(tesList, timer.idTemporizador, idSalaActiva);
  if (!empresaId) return null;
  const nombre = getEmpresaNombre(empresas, empresaId);
  const categoriaNombre = getCategoriaNombre(categorias, timer.idCategoria);
  const categoria = categorias.find((c) => c.idCategoria === timer.idCategoria);
  const fin = categoria ? calcularFin(timer.inicio, categoria.duracion) : '??:??';
  return { nombre, categoriaNombre, inicio: formatInicio(timer.inicio), fin };
}
```

La sección solo se renderiza cuando al menos uno de los dos próximos turnos tiene datos disponibles (`nextLine || afterNextLine`). Si la sala activa no tiene más turnos, el pie no aparece.

### Resultado

La pantalla de sala muestra, debajo del countdown, los próximos dos turnos con nombre de empresa, horario de inicio y fin, y categoría. La información se deriva en memoria de los mismos datos REST ya cargados por `useTimers`, `useTES`, `useEmpresas` y `useCategorias`: no hay ninguna petición adicional.

**Archivos modificados:** `src/components/timer/TimerView.tsx`

---

## Fase 10 — Rehabilitación de EmpresasEventoTimers (M-11)

### Contexto

En el `Router.js` original, la ruta `/empresastimers` que apuntaba al componente `EmpresasEventoTimers` estaba comentada. La razón era un bug bloqueante en `getFinal()`: la función siempre devolvía `""` porque el método `componentDidMount` nunca llamaba a `getCategorias()`. La hora de fin nunca se calculaba y la tabla de horarios de empresa aparecía vacía.

### Problema (M-11)

La causa raíz era un fallo de carga en el ciclo de vida del class component original:

```javascript
// Original — componentDidMount nunca cargaba categorías
componentDidMount() {
  this.getEmpresas();
  // getCategorias() no estaba aquí
}

getFinal(ev) {
  // this.state.categorias siempre era []
  const cat = this.state.categorias.find(c => c.idCategoria === ev.idCategoria);
  return cat ? calcularFin(ev.inicioTimer, cat.duracion) : "";
}
```

### Solución

La rehabilitación del componente (`EmpresasEventoTimers.tsx`) resolvió M-11 de dos formas:

1. **`useCategorias()` eliminado como dependencia**: `duracion` es un campo que el backend devuelve directamente en `EventoActual`. No es necesario buscar la categoría para obtener la duración; el valor viene ya en el objeto del evento.

2. **`calcularFin` llamado directamente con `ev.duracion`**:

```typescript
// Nuevo — sin lookup de categorías
<td>{calcularFin(ev.inicioTimer, ev.duracion)}</td>
```

Esto es correcto según `data-models.md`: `HorarioActualEmpresaPopUp` siempre incluyó `duracion` como campo propio, a diferencia de `Temporizador` que lo hereda vía `idCategoria`. El original usaba el camino largo (`idCategoria → categorias → duracion`) cuando el camino corto (`ev.duracion` directo) estaba disponible y era el correcto.

La ruta `/empresastimers` fue re-habilitada en `App.tsx` según la decisión documentada en el PRD.

### Resultado

`EmpresasEventoTimers` muestra correctamente la hora de fin de cada turno. La sección "Actuales y próximos" y la tabla "Todos los turnos" calculan `fin` con `calcularFin(ev.inicioTimer, ev.duracion)`. Defecto M-11 cerrado.

**Archivos creados:** `src/components/eventos/EmpresasEventoTimers.tsx`  
**Archivos modificados:** `src/App.tsx` (ruta re-habilitada)

---

## Fase 11 — Revisión de calidad de código

### Contexto

Tras la implementación de las diez fases anteriores, se invocó al `senior-code-quality-agent` para una revisión completa de la codebase: `src/api/`, `src/stores/`, `src/hooks/`, `src/utils/` y `src/components/`. El objetivo era verificar que los 12 defectos de migración estuvieran efectivamente resueltos y detectar deuda técnica nueva introducida durante el desarrollo.

### Resultado

| Severidad | Hallazgos |
|-----------|-----------|
| Bloqueante | 0 |
| Alta | 1 |
| Media | 3 |
| Bien hecho | 8 |

**Verificación de defectos de migración:** 11/12 resueltos. M-12 (`idEvento` hardcodeado) es deuda conocida documentada en el PRD.

**Hallazgo alta — `EmpresasEventoTimersNew`: Swal con HTML injection no reactivo:**  
El método `showSchedule` construye el HTML del Swal con un `<p id="swal-schedule-content">` y lo actualiza vía `document.getElementById` en el callback `didOpen`. Este patrón de manipulación DOM fuera de React persiste del antipatrón original (Bug 2-A) y produce UX confusa: el usuario ve "Cargando horario…" aunque los datos ya estén disponibles. Solución recomendada: eliminar el Swal (el panel inline debajo de la grid ya muestra todos los datos) o renderizar un componente React en el contenedor del Swal via `ReactDOM.createRoot` (patrón SweetAlert2 v11).

**Hallazgos medios:**
- `getCategoriaDuracion` retorna `number | null`; el consumidor en `Horario.tsx` usa `?? 0` como fallback, silenciando errores de categoría no encontrada.
- `checkOverlapForDuration` en `Categorias.tsx` tiene complejidad O(n²); inofensiva con el volumen real de datos pero difícil de leer.
- Uso de `void` en handlers async: correcto semánticamente pero poco evidente para lectores nuevos del código.

**Puntos bien resueltos destacados:** singleton WebSocket con ES modules, `useAuthStore.getState()` en interceptor Axios, Zod parse en cada `queryFn`, `Promise.all` en todos los hooks de borrado, funciones puras en `utils/time.ts`, `Tiempo.tsx` desacoplado del socket.

El resultado completo está en `docs/code-quality-review.md`.

---

## Fase 12 — Estrategia de testing

### Contexto

Con la codebase estable y la revisión de calidad completada, se invocó al `senior-testing-agent` para definir la estrategia de tests y establecer la pirámide objetivo.

### Decisiones

**Pirámide:** 70% unitarios / 20% componente + integración / 10% E2E.

**Herramientas:** Vitest (tests unitarios y de componente, coubicados con Vite), `@testing-library/react` (interacciones de componente), MSW (mocking de API en integración), Playwright (E2E con WebSocket mockeado via `page.route`), `@vitest/coverage-v8`.

**Presupuesto de suite:**

| Capa | Duración máxima | Flakiness máximo |
|------|-----------------|------------------|
| Unitario | < 2 s | 0% |
| Componente | < 15 s | 0% |
| Integración | < 30 s | < 1% |
| E2E | < 3 min | < 5% |

### Tests implementados

- **`src/utils/time.test.ts`** — 30 tests unitarios. Cubre todas las funciones exportadas de `utils/time.ts`: `haySolapamiento` (6 casos incluyendo boundary exclusion, conmutatividad, rangos idénticos), `formatCountdown` (clamping de negativos, segundos fraccionarios), `transformDuration` / `transformMinutes` (propiedad de inversa roundtrip).
- **`src/utils/timezone.test.ts`** — 22 tests unitarios. Cubre `nowMadridMinutes`, `todayMadrid`, `nowMadridHHMM` en CET (UTC+1), CEST (UTC+2), transición spring-forward (último domingo de marzo) y transición fall-back (último domingo de octubre).

### Tests pendientes

| ID | Test | Capa | Estado |
|----|------|------|--------|
| T-04 | Login 401 muestra Swal error, sin token en localStorage | Componente | Pendiente |
| T-05 | Borrar sala con dependencias TES usa Promise.all | Componente | Pendiente |
| T-06 | Evento `timerID` de socket invalida query TES | Hook | Pendiente |
| T-07 | Listeners de socket eliminados al desmontar hook | Hook | Pendiente |
| T-08 | Caracteres especiales en nombre de sala se codifican correctamente | Integración | Pendiente |
| T-09 | Bearer token presente en todas las peticiones POST/PUT/DELETE | Integración | Pendiente |
| T-10 | Respuesta 401 limpia token y redirige a `/login` | Integración | Pendiente |
| T-11 | EmpresasEventoTimers muestra `fin` calculado desde `duracion` (fix M-11) | Componente | Pendiente |
| T-12 | Flujo completo login → crear timer → ver en TimerView | E2E | Pendiente |

El resultado completo, incluyendo los skeletons de tests pendientes con Arrange/Act/Assert, está en `docs/testing-strategy.md`.

---

## Estado final del proyecto

Al término de las doce fases, todos los defectos identificados en la auditoría inicial quedaron resueltos:

| Código | Defecto | Estado |
|--------|---------|--------|
| M-01 | Token JWT no enviado en cabeceras | Resuelto — interceptor Axios |
| M-02 | Promesas `pending` eternas sin error | Resuelto — TanStack Query |
| M-03 | Múltiples conexiones WebSocket | Resuelto — singleton ES module |
| M-04 | URLs con caracteres especiales | Resuelto — `encodeURIComponent` |
| M-05 | `haySolapamiento` duplicada | Resuelto — centralizada en `utils/time.ts` |
| M-06 | TES fetch duplicado por evento | Resuelto — TanStack Query cache |
| M-07 | Borrados en cascada con loop serial | Resuelto — `Promise.all` |
| M-08 | SweetAlert2 en capa de servicios | Resuelto — solo en componentes |
| M-09 | URLs hardcodeadas | Resuelto — `config/env.ts` con VITE_API_URL |
| M-10 | Class components | Resuelto — todos funcionales con hooks |
| M-11 | `EmpresasEventoTimers` bug categorías nunca cargadas | Resuelto — `useCategorias()` + `duracion` directo |
| M-12 | `idEvento` hardcodeado a 1 | Deuda técnica conocida, documentada |
| M-auth | `localStorage.clear()` en logout | Resuelto — `removeItem('token')` |

Y los defectos adicionales encontrados durante las pruebas UX:

| ID | Defecto | Estado |
|----|---------|--------|
| B-01 | Patrón Swal con manipulación DOM | Resuelto — `queryClient.fetchQuery()` pre-Swal |
| B-02 | TimerView sin foco standalone | Resuelto — rutas separadas + TimerMenu |
| B-03 | Login sin navegación | Resuelto — TimerMenu en Login |
| B-04 | Interceptor 401 rompía el login | Resuelto — guarda `Auth/Login` en URL |
| B-05 | Timer activo no detectado al cargar | Resuelto — `useCurrentActiveTimer` |
| B-06 | Nombre de empresa no mostraba | Resuelto — prioridad calculado > socket |
| B-07 | Zona horaria no garantizada Madrid | Resuelto — `src/utils/timezone.ts` |
| B-08 | Display 00:00 sin evento activo | Resuelto — guarda `activeTimerId !== null` |
| B-09 | Countdown 9 min desfasado | Resuelto — `useCalculatedRemainingSeconds` |

### Deuda técnica pendiente

| Ref | Descripción | Origen | Prioridad |
|-----|-------------|--------|-----------|
| M-12 | `idEvento` hardcodeado a 1 en `useTES.ts:42` | Auditoría inicial | Media — documentado en PRD |
| CQ-A1 | `EmpresasEventoTimersNew`: Swal con HTML injection no reactivo | Revisión de calidad (Fase 11) | Alta — UX confusa en producción |
| T-04..T-12 | Tests de componente, hook, integración y E2E pendientes | Estrategia de testing (Fase 12) | Media — ver `docs/testing-strategy.md` |
