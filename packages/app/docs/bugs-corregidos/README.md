# Bugs corregidos — Indice

Documentación de todos los cambios aplicados al frontend de `timer-tajamar-V2` organizados por fase. Cada fichero detalla qué se cambió, por qué y qué mejora aporta.

No se ha modificado el backend en ninguna fase. Todos los cambios son exclusivamente de frontend.

---

## Fases

| Fichero | Fase | Descripcion |
|---|---|---|
| [fase-1-immediate.md](./fase-1-immediate.md) | Immediate | Correcciones de bajo riesgo y alto impacto inmediato |
| [fase-2-short-term.md](./fase-2-short-term.md) | Short Term | Bugs funcionales visibles para el usuario |
| [fase-3-medium-term.md](./fase-3-medium-term.md) | Medium Term | Problemas estructurales de autenticacion, sockets y accesibilidad |
| [fase-4-backlog.md](./fase-4-backlog.md) | Backlog | Mantenibilidad y accesibilidad de componentes compartidos |

---

## Resumen de cambios por fase

### Fase 1 — Immediate

| ID | Fichero principal | Descripcion breve |
|---|---|---|
| C-01 | `TimerView.tsx` | Eliminado bloque `console.group` de depuracion que filtraba datos en produccion |
| M-11 | `package.json` | Eliminado `@types/socket.io-client` v1 obsoleto |
| L-06 | `ErrorBoundary.tsx`, `main.tsx` | Creado ErrorBoundary; la app ya no muestra pantalla en blanco ante errores de render |
| M-07 | `Horario.tsx` | Eliminada palabra clave `async` sin `await` en `handleAssign` |
| M-04 | `useTimers.ts` | Eliminado polling redundante; ajustado `staleTime` |
| M-05 | `useCategorias.ts` | Eliminado polling redundante |
| M-08 | `themeStore.ts` | Extraida constante `THEME_STORAGE_KEY` para evitar divergencia silenciosa |

### Fase 2 — Short Term

| ID | Fichero principal | Descripcion breve |
|---|---|---|
| C-04 | `TimerView.tsx` | `salaName` derivado de store; se elimina flash de "Seleccionar sala" tras recarga |
| H-03 | `TimerView.tsx` | Skeleton de carga; se elimina flash de "Sin eventos" en carga inicial |
| H-04 | `Categorias.tsx` | Eliminada comprobacion de solapamiento muerta en creacion de categoria |
| H-08 | `Temporizadores.tsx` | Inicializacion correcta de `newCategoriaId`; elimina envio silencioso invalido |
| M-02 | `models.ts` | `imagenEmpresa` marcado como opcional en schema Zod |
| C-03 | `Salas.tsx`, `Empresas.tsx`, `Temporizadores.tsx`, `Categorias.tsx` | Advertencia de no atomicidad en borrados en cascada |
| M-01 | `EmpresasEventoTimers.tsx`, `EmpresasEventoTimersNew.tsx`, `HorarioActualEmpresaPopUp.tsx` | Claves React compuestas en lugar de indice |
| L-02 | `useTES.ts`, `TimerView.tsx` | Eliminada funcion `getLineEmpresaId` duplicada de `getEmpresaForActiveTimer` |

### Fase 3 — Medium Term

| ID | Fichero principal | Descripcion breve |
|---|---|---|
| M-09 + H-07 | `authStore.ts` y 5 consumidores | `isAuthenticated` como booleano; validacion de estructura JWT en carga |
| H-01 | `client.ts`, `Login.tsx` | Redireccion post-login con parametro `next`; el usuario vuelve a su pagina |
| H-05 | `timerSocketStore.ts`, `useTimerSocket.ts`, `App.tsx`, `TimerView.tsx` | Socket centralizado en store; elimina listeners duplicados |
| H-06 | `useTimerEventos.ts`, `EmpresasEventoTimersNew.tsx` | Helper `fetchEventosActualesEmpresa` extrae `queryFn` duplicada |
| M-06 | `MenuPopUp.tsx` | Focus trap correcto en drawer; foco no escapa al contenido detrás del modal |
| H-02 | `SalaPopUp.tsx` | Eliminados roles ARIA invalidos `listbox`/`option` en lista de salas |
| M-10 | `eslint.config.js` | Activado `recommendedTypeChecked`; deteccion de promesas flotantes |

### Fase 4 — Backlog

| ID | Fichero principal | Descripcion breve |
|---|---|---|
| L-01 | `DarkToggle.tsx` (nuevo), `AppLayout.tsx`, `Login.tsx` | Extraido `DarkToggle` a componente compartido; elimina duplicacion entre dos implementaciones distintas |
| L-05 | `AppLayout.tsx`, `MenuPopUp.tsx`, `Login.tsx`, `TimerMenu.tsx`, `TimerView.tsx` | Anadidos `aria-controls` y `aria-expanded` a todos los botones hamburguesa |

---

## Convenciones de ID

Los IDs de cambio siguen el esquema del plan de revision de calidad original:

- `C-xx` — correcciones de comportamiento critico
- `H-xx` — correcciones de bugs funcionales (happy path roto)
- `M-xx` — mejoras de mantenibilidad y calidad de codigo
- `L-xx` — mejoras de legibilidad y estructura
