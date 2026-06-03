# Fase 4 — Backlog (mejoras de mantenibilidad y accesibilidad)

Cambios aplicados en la cuarta y última fase del plan de mejora.

---

## L-01 — Extraído `DarkToggle` a componente compartido

**Qué se cambió**
- Creado `src/components/layout/DarkToggle.tsx`: componente exportado con prop `variant?: 'compact' | 'sidebar'`.
  - `variant="compact"` (defecto): botón icono para topbars. Icono relleno SVG (`fill`), tamaño `sm`.
  - `variant="sidebar"`: botón de ancho completo con etiqueta de texto. Icono relleno SVG (`fill`), tamaño `md`.
- `src/components/layout/AppLayout.tsx`:
  - Eliminados `SunIcon`, `MoonIcon` y la función local `DarkToggle`.
  - Eliminado `import { useThemeStore }` (ya no se usa directamente en este fichero).
  - Añadido `import { DarkToggle } from './DarkToggle'`.
- `src/components/auth/Login.tsx`:
  - Eliminada la función local `DarkToggle` (usaba iconos de trazo `stroke`, distinta de la de AppLayout).
  - Eliminado `import { useThemeStore }` (ya no se usa directamente en este fichero).
  - Añadido `import { DarkToggle } from '../layout/DarkToggle'`.

**Por qué se cambió**
Existían dos implementaciones locales de `DarkToggle` en `AppLayout.tsx` y `Login.tsx`. Eran funcionalmente equivalentes (mismo `aria-label`, misma lógica de toggle) pero con iconos SVG distintos (relleno vs. trazo) y sin variante de sidebar en Login. Cualquier cambio de comportamiento o estilo requería actualizarse en dos ficheros. La divergencia estética entre ambas versiones era involuntaria.

**Qué mejora**
Un único componente canónico con dos variantes declaradas explícitamente. El icono relleno (más legible a tamaño pequeño) se aplica de forma uniforme en todos los contextos. Cualquier cambio futuro (nuevo icono, nuevo `aria-label`, nuevo tema) se aplica en un solo fichero.

---

## L-05 — Añadidos `aria-controls` y `aria-expanded` a botones hamburguesa

**Qué se cambió**

### `src/components/layout/AppLayout.tsx`
- Añadida constante `const MOBILE_MENU_ID = 'app-mobile-menu'`.
- Botón hamburguesa del topbar móvil: añadidos `aria-controls={MOBILE_MENU_ID}` y `aria-expanded={mobileMenuOpen}`.
- `<MenuPopUp>`: pasada la nueva prop `id={MOBILE_MENU_ID}`.

### `src/components/layout/MenuPopUp.tsx`
- Añadida prop opcional `id?: string` a `MenuPopUpProps`.
- El `<aside>` del drawer recibe `id={id}`.

### `src/components/auth/Login.tsx`
- Añadida constante `const LOGIN_TIMER_MENU_ID = 'login-timer-menu'`.
- Botón hamburguesa del header: añadidos `aria-controls={LOGIN_TIMER_MENU_ID}` y `aria-expanded={showMenu}`.
- `<TimerMenu>`: pasada la nueva prop `id={LOGIN_TIMER_MENU_ID}`.

### `src/components/timer/TimerMenu.tsx`
- Añadida prop opcional `id?: string` a `TimerMenuProps`.
- El `<div role="dialog">` raíz recibe `id={id}`.

### `src/components/timer/TimerView.tsx`
- Botón hamburguesa: añadido `aria-controls="timer-view-menu"` (ya tenía `aria-expanded`).
- `<TimerMenu>`: pasada `id="timer-view-menu"`.

**Por qué se cambió**
Los botones hamburguesa en `AppLayout.tsx`, `Login.tsx` y `TimerView.tsx` abrían un drawer pero no declaraban a qué elemento controlaban (`aria-controls`) ni si ese elemento estaba visible en ese momento (`aria-expanded`). Sin `aria-controls`, los lectores de pantalla no pueden asociar el botón con el drawer que controla. Sin `aria-expanded`, no anuncian el estado abierto/cerrado del drawer al activar el botón.

**Qué mejora**
Los lectores de pantalla asocian correctamente el botón hamburguesa con el drawer que controla y anuncian el cambio de estado (`expandido` / `contraído`) al activarlo. Se cumple el patrón de botón de divulgación de ARIA APG. La mejora aplica a los tres contextos donde existe un hamburguesa: layout autenticado (AppLayout), página de login (Login) y vista de timer (TimerView).
