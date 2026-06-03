# ADR-003 — Estrategia de autenticación: axios interceptor + Zustand authStore

**Estado:** Aceptado  
**Fecha:** 2026-05-27

---

## Contexto

El original almacena el JWT en `localStorage["token"]` pero nunca lo envía en headers REST (M-01). El check de "autenticado" es simplemente `localStorage.getItem("token") !== null`, lo que permite que un string "undefined" o un token expirado pase como válido.

El logout hace `localStorage.clear()` (M-auth), borrando todo el localStorage, no solo el token.

## Decisión

### authStore (Zustand)

```typescript
interface AuthState {
  token: string | null;
  setToken: (token: string) => void;
  clearToken: () => void;
  isAuthenticated: () => boolean;
}
```

- `setToken`: guarda en store + `localStorage.setItem('token', token)`.
- `clearToken`: limpia store + `localStorage.removeItem('token')` (solo la key del token, no `.clear()`).
- `isAuthenticated`: devuelve `token !== null && token !== 'undefined'`.
- Al inicializar, lee `localStorage.getItem('token')` para hidratar el store.

### Axios interceptor (request)

```typescript
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

Nota: `useAuthStore.getState()` funciona fuera de componentes React, lo que hace innecesario un custom hook para el interceptor.

### Axios interceptor (response)

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

Resuelve M-02 parcialmente: los errores ahora rechazan la promesa. TanStack Query captura el rechazo y pone la query en estado `error`.

### ProtectedRoute

Wrapper que comprueba `isAuthenticated()`. Si devuelve false, redirige a `/login` con `<Navigate>`.

## Consecuencias

**Positivas:**
- Resuelve M-01: todas las peticiones POST/PUT/DELETE llevan Bearer.
- Resuelve M-auth: logout limpio.
- El interceptor de response centraliza el manejo de 401: un solo lugar para redirigir.

**Negativas:**
- El token sigue en localStorage (vulnerable a XSS). La alternativa (httpOnly cookie) requiere cambio en el backend — fuera de scope. Se documenta como deuda conocida.
- Si el backend no requiere Bearer para ningún endpoint actualmente, el interceptor es inocuo (no rompe nada), pero tampoco añade seguridad real hasta que el backend lo valide.

**Riesgo a validar:**
El equipo debe confirmar si el backend valida el Bearer token en endpoints de escritura antes de que el nuevo frontend llegue a producción.
