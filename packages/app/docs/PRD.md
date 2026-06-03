# PRD — Migración AppTimersFinal a React 19

**Versión:** 1.0  
**Fecha:** 2026-05-27  
**Estado:** Aprobado — listo para ejecución

---

## Problema

La aplicación AppTimersFinal gestiona los turnos de presentación de empresas en eventos presenciales con múltiples salas. El frontend actual (React 17, CRA, class components, JavaScript) acumula deuda técnica bloqueante que impide evolucionar el producto de forma segura:

- El token JWT obtenido en login **nunca se envía** en cabeceras REST. Si el backend activa autenticación, todas las escrituras fallarán silenciosamente (M-01).
- Los errores de red producen promesas que quedan en estado `pending` indefinidamente: el usuario ve un spinner eterno sin mensaje de error (M-02).
- Hasta 4 conexiones WebSocket simultáneas abiertas desde el mismo cliente producen listeners duplicados y comportamientos inconsistentes en producción (M-03).
- La lógica de solapamiento de timers está duplicada en 5 componentes; un bug en un sitio no se propaga a los otros (M-05).
- URLs construidas con concatenación de strings rompen con caracteres especiales en nombres de salas o empresas (M-04).

Evidencia: análisis estático completo de la codebase original documentado en `/auditoria/`.

---

## Usuarios y personas

### Admin del evento (usuario primario)
Responsable de configurar salas, empresas, categorías y temporizadores antes del evento. Durante el evento controla el inicio y supervisa el horario. Trabaja desde un portátil o tablet conectado a la misma red del evento.

**Necesidades clave:** crear/editar entidades sin errores silenciosos; ver el horario completo por sala; iniciar el evento con un clic.

### Operador de sala (usuario secundario)
Persona que proyecta la pantalla del temporizador en una sala. Accede a la vista TimerView en una pantalla grande, selecciona su sala y no necesita login. No realiza ninguna escritura.

**Necesidades clave:** pantalla limpia con tiempo restante visible a distancia; actualización en tiempo real sin refrescos manuales; que el selector de sala funcione sin caracteres especiales rotos.

### Empresa participante (observador)
Representante que quiere ver cuándo le toca hablar y en qué sala. Accede al horario de empresas (/empresastimersnew o /horario). Solo lectura.

**Necesidades clave:** ver su turno actual y el siguiente; nombre de sala claramente legible.

---

## Hipótesis de éxito

> Creemos que reescribir el frontend con React 19 + TypeScript + TanStack Query + Zustand + singleton WebSocket resultará en cero regresiones funcionales, cero errores silenciosos de red, y una base mantenible, porque la auditoría técnica ha identificado con precisión los 12 problemas a resolver y el equipo tiene acceso completo al backend y a los datos de comportamiento del original.

---

## Métrica de éxito (única, primaria)

**Zero regressions:** todas las funcionalidades del original que están activas en producción funcionan igual o mejor en el nuevo frontend, verificado mediante la suite de tests de integración y revisión manual del checklist de componentes.

Métricas guardrail (no deben empeorar):
- Tiempo de carga inicial de TimerView < 2 s en conexión del evento.
- Latencia de actualización WebSocket (envio → pantalla) < 100 ms.
- Sin errores de consola en flujo normal de operación.

---

## Scope del MVP — qué entra y qué no

### MUST (en scope, bloqueante para lanzar)

| # | Funcionalidad | Componente | Prioridad |
|---|---|---|---|
| 1 | Login con JWT + interceptor Bearer | Login.tsx | Must |
| 2 | Logout limpio (solo borrar key "token") | authStore.ts | Must |
| 3 | Vista principal de temporizador en tiempo real | TimerView.tsx | Must |
| 4 | Selector de sala funcional | SalaPopUp.tsx | Must |
| 5 | Display MM:SS con WebSocket singleton | Tiempo.tsx | Must |
| 6 | Vista de horario completo por sala | Horario.tsx | Must |
| 7 | Asignar/desasignar empresa a slot en horario | Horario.tsx | Must |
| 8 | CRUD de Salas con validación de nombre | Salas.tsx | Must |
| 9 | CRUD de Empresas con validación de nombre | Empresas.tsx | Must |
| 10 | CRUD de Categorías con validación solapamiento | Categorias.tsx | Must |
| 11 | CRUD de Temporizadores con validación solapamiento | Temporizadores.tsx | Must |
| 12 | Borrado en cascada correcto (Promise.all) | todos los CRUD | Must |
| 13 | Vista de empresas con timers (rehabilitada) | EmpresasEventoTimers.tsx | Must |
| 14 | Vista nueva de seguimiento de empresas | EmpresasEventoTimersNew.tsx | Must |
| 15 | Menú lateral + menú móvil | Menu.tsx, MenuPopUp.tsx | Must |
| 16 | Rutas protegidas (admin) | ProtectedRoute.tsx | Must |
| 17 | Variables de entorno (VITE_API_URL, VITE_SOCKET_URL) | config/env.ts | Must |

### SHOULD (en scope, puede salir si hay restricción de tiempo)

| # | Funcionalidad | Nota |
|---|---|---|
| 18 | Popup horario empresa desde TimerView | HorarioActualEmpresaPopUp.tsx — estaba comentado en original, se rehabilita |
| 19 | Vibración de dispositivo en cuenta regresiva | navigator.vibrate(). Solo funciona en móviles; el original lo tenía |
| 20 | Iniciar evento (botón "Vamos") | Presupone coordinación con el backend WebSocket |

### WONT (fuera de scope en esta iteración)

| # | Funcionalidad | Razón |
|---|---|---|
| 21 | Reseteo de emergencia (botón "start") | Estaba comentado en el original. Riesgo alto, requiere análisis separado |
| 22 | Gestión de múltiples eventos (idEvento dinámico) | M-12: idEvento sigue siendo 1 por ahora. Se deja como deuda conocida |
| 23 | Autenticación WebSocket en handshake | El backend no expone mecanismo de auth WS. Se deja para siguiente iteración |
| 24 | httpOnly cookies en lugar de localStorage | Requiere cambio en el backend. Fuera de scope |
| 25 | imagen de empresa editable | No existe endpoint para ello en el backend actual |

### Decisión sobre EmpresasEventoTimers (pregunta clave del plan)

**Decisión: SE REHABILITA** `EmpresasEventoTimers` arreglando el bug de categorías nunca cargadas.

Justificación: el componente tiene toda la lógica correcta excepto que nunca llama a `getCategorias()` en su `componentDidMount`. En el nuevo stack, el hook `useCategorias` cargará las categorías automáticamente. El endpoint que usa (`GET api/timereventos/eventosempresa/:id`) está activo. La ruta `/empresastimers` se habilita en el menú.

---

## User stories con criterios de aceptación

### US-01 — Login con token Bearer

**Como** admin del evento,  
**quiero** autenticarme con usuario y contraseña,  
**para** poder crear y modificar salas, empresas, categorías y temporizadores.

**Criterios de aceptación (BDD):**

```
Dado que estoy en /login
Cuando introduzco credenciales correctas y pulso "Iniciar sesión"
Entonces el token JWT se guarda en localStorage bajo la clave "token"
Y soy redirigido a la ruta /
Y todas las peticiones REST posteriores incluyen Authorization: Bearer <token>

Dado que estoy en /login
Cuando introduzco credenciales incorrectas
Entonces veo un mensaje de error visible (SweetAlert2)
Y no se guarda ningún token en localStorage

Dado que tengo sesión activa
Cuando pulso "Cerrar sesión"
Entonces solo se elimina la clave "token" de localStorage
Y soy redirigido a /login
```

### US-02 — Vista de temporizador en tiempo real

**Como** operador de sala,  
**quiero** ver el nombre de la empresa que habla, la sala, y el tiempo restante en formato MM:SS actualizado en tiempo real,  
**para** coordinar los turnos sin tener que refrescar la página.

**Criterios de aceptación:**

```
Dado que accedo a / sin login
Cuando el servidor emite el evento WebSocket "envio" con N segundos
Entonces el display muestra el formato MM:SS correcto

Dado que hay una sala seleccionada
Cuando el servidor emite "timerID" con un ID de timer
Entonces se muestra el nombre de la empresa asignada a ese timer en esa sala
Y se muestra el nombre del timer siguiente si existe

Dado que no hay sala seleccionada
Cuando accedo a /
Entonces veo el selector de sala (SalaPopUp)
```

### US-03 — CRUD de salas con caracteres especiales

**Como** admin,  
**quiero** crear, renombrar y eliminar salas cuyos nombres pueden contener acentos, espacios y caracteres especiales,  
**para** que los nombres se muestren correctamente en la UI.

**Criterios de aceptación:**

```
Dado que creo una sala con nombre "Sala Éxito & más"
Cuando confirmo la creación
Entonces la sala aparece en el listado con el nombre exacto

Dado que elimino una sala que tiene TES asociados
Cuando confirmo la eliminación
Entonces se eliminan todos los TES dependientes (Promise.all) antes de eliminar la sala
Y la operación no deja registros huérfanos
```

### US-04 — Horario completo por sala

**Como** admin,  
**quiero** ver el horario completo de timers por sala con la empresa asignada a cada slot,  
**para** gestionar las asignaciones durante la preparación del evento.

**Criterios de aceptación:**

```
Dado que estoy en /horario
Cuando cargo la página
Entonces veo una tabla con todos los timers ordenados por hora de inicio
Y cada fila muestra: hora inicio, duración, empresa asignada por sala

Dado que pulso una celda de empresa en una sala
Cuando selecciono una empresa del dropdown
Entonces se crea el TES correspondiente
Y la celda se actualiza con el nombre de la empresa

Dado que pulso una celda con empresa asignada
Cuando confirmo la eliminación
Entonces se elimina el TES y la celda queda vacía
```

### US-05 — EmpresasEventoTimers rehabilitado

**Como** admin,  
**quiero** ver la lista de empresas que tienen timers asignados y acceder al detalle de sus turnos,  
**para** hacer seguimiento durante el evento.

**Criterios de aceptación:**

```
Dado que accedo a /empresastimers
Cuando la página carga
Entonces veo la lista de empresas con timers asignados
Y puedo seleccionar una empresa para ver sus turnos actuales y futuros
Y el campo "fin" se calcula correctamente usando la duración de la categoría
```

---

## Riesgos identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| El backend requiere Bearer en REST y las pruebas con el interceptor fallan | Media | Alto | Confirmar con el equipo de backend antes de integrar. Si no requiere Bearer, el interceptor no hace daño |
| encodeURIComponent en nombres de salas/empresas no es suficiente (backend no decodifica) | Baja | Medio | Probar con nombre que contenga "&" antes de cerrar la fase de testing |
| La rehabilitación de EmpresasEventoTimers revela más bugs no documentados | Baja | Bajo | Se contempla en el budget de la Fase 4 |
| La versión de Tailwind CSS 4 tiene cambios de API que rompen patrones de v3 | Media | Bajo | Verificar documentación de Tailwind 4 antes de escribir los primeros componentes |

---

## Dependencias

- Backend sin cambios (contrato de API congelado).
- Acceso a `.env` con `VITE_API_URL` y `VITE_SOCKET_URL` para entorno de desarrollo.
- Acceso al servidor de sockets activo para tests de integración WebSocket.

---

## Lo que NO estamos haciendo (y por qué)

- **No migramos el backend.** El scope es exclusivamente el frontend.
- **No rediseñamos la UX.** El objetivo es reproducción funcional fiel, no rediseño.
- **No implementamos auth WebSocket** esta iteración. El backend no expone el mecanismo.
- **No hacemos idEvento dinámico** esta iteración. Deuda técnica conocida (M-12).
- **No movemos el token a httpOnly cookies** sin cambios en el backend.

---

## Supuestos críticos

- [ ] El backend no requiere `Authorization: Bearer` para los endpoints GET (lectura pública). Si los requiere, el interceptor ya lo cubre en todos los verbos.
- [ ] Las URLs de creación de salas/empresas por path parameter (`createsala/:nombre`) son el contrato actual del backend y no pueden cambiarse a body JSON esta iteración. `encodeURIComponent` se aplica en cliente.
- [ ] `idEvento = 1` es válido para el único evento activo en el sistema.
- [ ] La plataforma de despliegue admite las variables de entorno `VITE_*`.
