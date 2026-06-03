# Fase 2 — Short Term (correcciones a corto plazo)

Cambios aplicados en la segunda fase del plan de mejora. Corrigen bugs funcionales visibles para el usuario y deuda técnica de impacto medio.

---

## C-04 — `salaName` derivado de la store en lugar de estado local en `TimerView.tsx`

**Qué se cambió**
- `src/components/timer/TimerView.tsx`: eliminado `const [salaName, setSalaName] = useState<string>('')` y la llamada `setSalaName` en `handleSalaSelect`.
- Añadida llamada al hook `useSalas()`. El nombre se obtiene como `salas.find(s => s.idSala === idSalaActiva)?.nombreSala ?? ''`.

**Por qué se cambió**
`idSalaActiva` se persiste en Zustand (localStorage). Tras una recarga de página, el ID se restauraba correctamente pero `salaName` era `useState` inicializado a `''`, de modo que la cabecera mostraba "Seleccionar sala" aunque hubiera una sala ya activa.

**Qué mejora**
El nombre de la sala se resuelve siempre a partir del estado persistido, no de un estado efímero de React. La cabecera muestra el nombre correcto en la carga inicial sin necesidad de volver a seleccionar la sala.

---

## H-03 — Skeleton de carga para evitar flash de "Sin eventos" en `TimerView.tsx`

**Qué se cambió**
- `src/components/timer/TimerView.tsx`: destructurado `isLoading` de `useTimers()` y `useCategorias()`, combinados en `isTimerDataLoading`.
- Añadido elemento skeleton `<div className="h-4 w-40 bg-gray-700 animate-pulse rounded">` mientras se cargan los datos y hay una sala activa.
- Los párrafos "Sin eventos en este momento" y "Sin empresa activa" solo se renderizan cuando `!isTimerDataLoading`.

**Por qué se cambió**
Ambos hooks devuelven `null` / `0` durante la carga inicial. Esto provocaba un flash de "Sin eventos en este momento" en cada carga de página, incluso cuando había un evento activo, lo que desorientaba al usuario.

**Qué mejora**
Durante la carga se muestra un esqueleto animado en lugar de texto de estado erróneo. El usuario recibe retroalimentación visual de carga y no ve un mensaje incorrecto que desaparezca al llegar los datos.

---

## H-04 — Eliminada comprobación de solapamiento en creación de categoría en `Categorias.tsx`

**Qué se cambió**
- `src/components/admin/Categorias.tsx`, función `handleCreate`: eliminada la llamada `checkOverlapForDuration(duracionMinutos)` y el Swal de advertencia asociado.
- La comprobación en `handleUpdate` (con `excludeCategoriaId`) se mantiene intacta.

**Por qué se cambió**
En el momento de crear una categoría, no existe ningún timer que la referencie (aún no tiene ID en la BD). La comprobación siempre devolvía `false`, era una rama muerta que daba una falsa sensación de validación.

**Qué mejora**
Se elimina código muerto. La validación de solapamiento sigue activa en edición (donde sí puede haber timers que referencien la categoría). No se presenta al usuario una advertencia que nunca podía activarse legítimamente.

---

## H-08 — Inicialización correcta de `newCategoriaId` en `Temporizadores.tsx`

**Qué se cambió**
- `src/components/admin/Temporizadores.tsx`: cambiado `useState<number>(categorias[0]?.idCategoria ?? 0)` a `useState<number | null>(null)`.
- Añadida `const effectiveCategoriaId = newCategoriaId ?? categorias[0]?.idCategoria ?? null`.
- `handleCreate`, el `value` del `<select>` y el `disabled` del botón de envío usan `effectiveCategoriaId`.

**Por qué se cambió**
`categorias` es `[]` en el momento en que se ejecuta `useState` (el hook aún no ha devuelto datos). El estado siempre se inicializaba a `0`. Al enviar el formulario antes de que cargaran las categorías, `cat` era `undefined` y `handleCreate` retornaba silenciosamente sin hacer nada, sin feedback al usuario.

**Qué mejora**
El estado inicial es `null` (semánticamente "sin selección"). El ID efectivo se resuelve en el primer render con datos disponibles. El botón de envío queda deshabilitado mientras no haya una categoría válida seleccionada, impidiendo el envío silencioso inválido.

---

## M-02 — Campo `imagenEmpresa` marcado como opcional en `EventoActualSchema`

**Qué se cambió**
- `src/types/models.ts`, `EventoActualSchema`: cambiado `imagenEmpresa: z.string()` a `imagenEmpresa: z.string().optional()`.

**Por qué se cambió**
El campo no se usa en ningún componente. Si el backend lo eliminaba o lo volvía nullable, `z.string()` lanzaba error en el parseo y rompía todas las vistas de `EventoActual`.

**Qué mejora**
Un campo no usado y no crítico deja de ser un punto de rotura. El schema es más resiliente a variaciones del backend sin necesidad de cambios de frontend.

---

## C-03 (mitigación frontend) — Advertencia de no atomicidad en diálogos de confirmación de borrado

**Qué se cambió**
- `src/components/admin/Salas.tsx`, `Empresas.tsx`, `Temporizadores.tsx`, `Categorias.tsx`: añadido `footer` con aviso `<small>Esta operación no es atómica. Un fallo parcial puede requerir corrección manual.</small>` en los diálogos Swal de confirmación de borrado en cascada.
- Mensajes de `onError` cambiados a textos honestos que explican que puede haberse producido un borrado parcial.

**Por qué se cambió**
Los borrados en cascada usan `Promise.all` (no una transacción de backend). Un fallo a mitad de secuencia deja registros huérfanos. La UI anterior no informaba de este riesgo ni de la posibilidad de estado parcial en caso de error.

**Qué mejora**
El administrador recibe advertencia antes de confirmar un borrado con dependencias, y un mensaje honesto en caso de error parcial. Se reduce el riesgo de datos huérfanos no detectados.

---

## M-01 — Claves React compuestas en lugar de índice en listas de eventos

**Qué se cambió**
- `src/components/eventos/EmpresasEventoTimers.tsx`, `EmpresasEventoTimersNew.tsx`, `HorarioActualEmpresaPopUp.tsx`: reemplazado `key={i}` por `key={\`${ev.sala}-${ev.inicioTimer}-${i}\`}`.

**Por qué se cambió**
Las claves basadas en índice provocan reconciliación incorrecta de React cuando las listas se reordenan o actualizan vía invalidación de caché por socket. React reutilizaba nodos DOM equivocados, pudiendo mostrar datos de un elemento en la posición visual de otro.

**Qué mejora**
Las claves son estables e identifican unívocamente cada elemento. La reconciliación de React es correcta ante reordenaciones y actualizaciones por socket.

---

## L-02 — Eliminada función duplicada `getLineEmpresaId` de `useTES.ts`

**Qué se cambió**
- `src/hooks/useTES.ts`: eliminada la función `getLineEmpresaId`, duplicado exacto de `getEmpresaForActiveTimer`.
- `src/components/timer/TimerView.tsx`: actualizado import y uso para apuntar a `getEmpresaForActiveTimer`.

**Por qué se cambió**
Dos funciones con la misma lógica. Cualquier cambio en el endpoint o el schema requería aplicarse en dos lugares. La divergencia silenciosa era posible en cualquier refactor.

**Qué mejora**
Una única función canónica. Cualquier cambio futuro se aplica en un solo punto. El nombre `getEmpresaForActiveTimer` es más descriptivo que `getLineEmpresaId`.
