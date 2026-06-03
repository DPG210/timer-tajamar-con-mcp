# Fase 3 — Medium Term (correcciones a medio plazo)

Cambios aplicados en la tercera fase del plan de mejora. Abordan problemas estructurales de autenticación, sockets, accesibilidad y calidad de herramientas.

---

## M-09 + H-07 — `isAuthenticated` como campo booleano y validación de token JWT en `authStore.ts`

**Qué se cambió**
- `src/stores/authStore.ts`: `isAuthenticated` cambiado de función `() => boolean` a campo `boolean`. Añadido helper `isValidToken(token)` que valida que el token no sea `null`, no sea la cadena `"undefined"` y tenga exactamente 3 partes separadas por punto (estructura JWT).
- `setToken` y `clearToken` actualizan `isAuthenticated` de forma síncrona al cambiar el token.
- 5 sitios de llamada actualizados:
  - `src/components/auth/ProtectedRoute.tsx`: `s.isAuthenticated()` → `s.isAuthenticated`
  - `src/components/layout/Menu.tsx`: ídem
  - `src/components/horario/Horario.tsx`: ídem
  - `src/components/auth/Login.tsx`: destructurado como `isAuthenticated: authenticated`
  - `src/components/timer/TimerMenu.tsx`: `const { isAuthenticated } = useAuthStore(); const auth = isAuthenticated()` → `const { isAuthenticated: auth } = useAuthStore()`

**Por qué se cambió**
- M-09: llamar a una función en cada actualización de la store es un coste innecesario; un booleano plano es más idiomático en Zustand.
- H-07: la comprobación anterior solo rechazaba `""` y la cadena `"undefined"`. Un token malformado almacenado en localStorage (p.ej. corrupción parcial) era tratado como válido hasta el primer 401 del backend, lo que permitía navegar a rutas protegidas con una sesión inválida.

**Qué mejora**
`isAuthenticated` es un booleano reactivo sin overhead de función. Un token malformado es rechazado en el momento de cargarse desde localStorage, redirigiendo al login antes de intentar cualquier petición autenticada.

---

## H-01 — Redirección post-login con `next` param y `replace` en `client.ts` / `Login.tsx`

**Qué se cambió**
- `src/api/client.ts`: cambiado `window.location.href = '/login'` por `window.location.replace('/login?next=' + encodeURIComponent(pathname+search))`. Cambiado el guard de `!url.includes('Auth/Login')` a `!url.endsWith('Auth/Login')`.
- `src/components/auth/Login.tsx`: añadido `useSearchParams`, el `navigate` en `onSuccess` pasa a `navigate(searchParams.get('next') ?? '/horario')`.

**Por qué se cambió**
La recarga completa a `/login` descartaba el stack de React Router y la caché de Zustand. Tras el re-login, los administradores aterrizaban siempre en la ruta por defecto (`/horario`), sin volver a la página donde estaban cuando expiró la sesión.

**Qué mejora**
Tras re-autenticarse, el usuario vuelve exactamente a la URL desde la que fue redirigido al login. `replace` evita que la URL de login quede en el historial del navegador.

---

## H-05 — Socket de timer centralizado en store Zustand en lugar de hook multi-instancia

**Qué se cambió**
- Creado `src/stores/timerSocketStore.ts`: store Zustand con `activeTimerId` e `isConnected`.
- Reescrito `src/hooks/useTimerSocket.ts`: actualiza la store directamente; el hook no devuelve nada.
- `src/App.tsx`: añadida llamada `useTimerSocket()` en el componente raíz (único punto de montaje).
- `src/components/timer/TimerView.tsx`: pasa a importar `useTimerSocketStore` en lugar de llamar a `useTimerSocket`.

**Por qué se cambió**
Si dos componentes llamaban a `useTimerSocket` simultáneamente, se registraban dos conjuntos independientes de listeners de socket, provocando doble invalidación de caché e inconsistencia de estado.

**Qué mejora**
Un único conjunto de listeners de socket activo en toda la aplicación. La store centraliza el estado derivado del socket y cualquier componente puede suscribirse sin registrar listeners adicionales.

---

## H-06 — Extraída lógica de `queryFn` duplicada a helper en `useTimerEventos.ts`

**Qué se cambió**
- `src/hooks/useTimerEventos.ts`: exportado helper `fetchEventosActualesEmpresa(queryClient, idEmpresa)` que encapsula la lógica de la `queryFn`.
- `src/components/eventos/EmpresasEventoTimersNew.tsx`: reemplazado el bloque inline `queryClient.fetchQuery({...queryFn...})` por una llamada al helper. Eliminados imports duplicados `eventosActualesEmpresaKey`, `apiClient`, `EventoActualArraySchema`.

**Por qué se cambió**
La `queryFn` estaba duplicada: en el hook y en el componente de forma inline. Cualquier cambio de endpoint o schema requería actualizarse en dos sitios. La divergencia silenciosa era posible en cualquier refactor.

**Qué mejora**
Una única implementación canónica de la query. El componente no importa detalles de la capa de API. Cambios de endpoint o schema se aplican en un solo lugar.

---

## M-06 — Focus trap correcto en `MenuPopUp.tsx`

**Qué se cambió**
- `src/components/layout/MenuPopUp.tsx`: añadido `useRef<HTMLElement>` sobre el `<aside>` del drawer. Añadido `useEffect` que, cuando `isOpen`, recoge todos los elementos enfocables, enfoca el primero y adjunta un listener de `keydown` que atrapa Tab/Shift+Tab dentro del drawer y cierra con Escape. Movido el `if (!isOpen) return null` tras los hooks.

**Por qué se cambió**
El drawer tenía `role="dialog"` y `aria-modal="true"` pero el foco podía salir con Tab hacia el contenido de la página detrás del backdrop. Esto invalida el comportamiento esperado de un modal según ARIA Authoring Practices Guide.

**Qué mejora**
El foco queda atrapado dentro del drawer mientras está abierto. Escape cierra el drawer. El comportamiento cumple con el patrón de diálogo modal de ARIA APG y es usable con teclado y lectores de pantalla.

---

## H-02 — Eliminados roles ARIA inválidos de `SalaPopUp.tsx`

**Qué se cambió**
- `src/components/timer/SalaPopUp.tsx`, lista de salas: eliminado `role="listbox"` del `<ul>`, eliminados `role="option"` y `aria-selected={false}` de los `<button>` dentro de cada `<li>`.

**Por qué se cambió**
`button[role=option]` anidado dentro de `li` dentro de `ul[role=listbox]` es ARIA inválido: `role=option` debe ser hijo directo de `role=listbox`, y elementos interactivos dentro de options no están permitidos. Los lectores de pantalla ignoraban el rol o lo anunciaban incorrectamente.

**Qué mejora**
La estructura semántica es válida. Los lectores de pantalla anuncian los botones de sala como botones navegables, sin roles contradictorios. Elimina advertencias de validadores de accesibilidad automáticos.

---

## M-10 — Activado `recommendedTypeChecked` en `eslint.config.js`

**Qué se cambió**
- `eslint.config.js`: cambiado `tseslint.configs.recommended` a `...tseslint.configs.recommendedTypeChecked`. Añadido `parserOptions: { project: true, tsconfigRootDir: import.meta.dirname }` en `languageOptions`.

**Por qué se cambió**
Sin información de tipos, reglas como `no-floating-promises` y `no-misused-promises` no están disponibles. Una promesa rechazada sin `void` ni `await` ni `.catch()` producía un bug silencioso sin ninguna advertencia de linting.

**Qué mejora**
ESLint tiene acceso a los tipos del proyecto. Las reglas de análisis de promesas están activas, detectando `async` mal usado y promesas flotantes antes de que lleguen a producción.
