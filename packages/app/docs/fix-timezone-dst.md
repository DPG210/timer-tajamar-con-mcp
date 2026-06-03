# Fix: Timezone y DST (Europe/Madrid)

**Fecha:** 2026-05-25
**Afecta:** `src/views/TemporizadoresView.tsx:20`
**Prioridad:** Alta — aplicar antes de v1

---

## Contexto

España cambia de hora dos veces al año:

- **Último domingo de marzo** — relojes avanzan de 02:00 a 03:00 (UTC+1 → UTC+2)
- **Último domingo de octubre** — relojes retroceden de 03:00 a 02:00 (UTC+2 → UTC+1)

Luxon con zona `Europe/Madrid` gestiona el cambio automáticamente en todas las rutas del código, **excepto** el bug documentado abajo.

---

## Lo que ya funciona (no tocar)

| Función | Código | ¿DST correcto? |
|---|---|---|
| `ahora()` | `DateTime.now().setZone(TIMEZONE)` | Sí — instante UTC + offset correcto |
| `parseTimerInicio()` | `DateTime.fromISO(iso, { zone: TIMEZONE })` | Sí |
| `timerYaPaso()` | Compara instantes UTC absolutos | Sí |
| Countdown Socket.IO (`envio`) | Servidor emite segundos restantes en UTC | Inmune — el cliente solo muestra el número |

---

## Bug a corregir

**Archivo:** `src/views/TemporizadoresView.tsx`, línea 20

```typescript
// ANTES (bug) — parsea en timezone del navegador, no en Europe/Madrid
function esFechaFutura(value: string): boolean {
  return DateTime.fromISO(value) > ahora()
}

// DESPUÉS (fix) — una línea
function esFechaFutura(value: string): boolean {
  return DateTime.fromISO(value, { zone: TIMEZONE }) > ahora()
}
```

**Impacto del bug:** hasta ±2h de error en la validación de fecha futura para usuarios cuyo navegador esté en una zona distinta de Europe/Madrid, o exactamente ±1h durante las noches de cambio de hora.

---

## Edge cases conocidos (deuda UX — no bloqueante v1)

### Hora fantasma (spring forward)

Timer creado con `inicio = 2025-03-30T02:30` — esa hora no existe.

- Luxon la desplaza silenciosamente al instante UTC más cercano
- El timer se crea sin error, pero se activa a una hora distinta de la esperada
- **Acción v2:** mostrar aviso al usuario si la hora introducida cae en el hueco DST

### Hora ambigua (fall back)

Timer creado con `inicio = 2025-10-26T02:30` — esa hora existe dos veces.

- Luxon elige la primera ocurrencia (CEST, +02:00) sin preguntar
- El timer puede activarse 1h antes de lo esperado
- **Acción v2:** preguntar al usuario qué ocurrencia quiere, o forzar siempre la primera

---

## Pregunta pendiente de verificar

¿El servidor devuelve `inicio` con offset explícito (ej. `2025-03-30T01:30:00Z`) o sin él (ej. `2025-03-30T02:30:00`)?

- **Con offset:** el bug de `esFechaFutura` tiene impacto solo potencial (Luxon respeta el offset del string)
- **Sin offset:** el bug tiene impacto real hoy en cualquier cliente fuera de Europe/Madrid

---

## Checklist de cierre

- [ ] Aplicar fix en `TemporizadoresView.tsx:20`
- [ ] Verificar formato ISO que devuelve el servidor para `inicio`
- [ ] Añadir edge cases de hora fantasma y ambigua a `tech-debt.md`
