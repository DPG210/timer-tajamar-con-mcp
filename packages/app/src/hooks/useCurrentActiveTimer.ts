/**
 * useCurrentActiveTimer — calculates the currently active timer from REST data.
 *
 * Used as a fallback in TimerView when the socket has not yet emitted a timerID
 * (e.g. on initial page load while an event is already running).
 *
 * The socket value takes precedence; this hook only provides the initial value.
 *
 * IMPORTANT: comparison is time-of-day only (minutes from midnight), NOT full
 * datetime. The `inicio` field often carries a historical date (e.g. 2024-06-01)
 * that does not match today, but the HH:mm schedule is always current.
 *
 * Timezone: pinned to Europe/Madrid via Intl.DateTimeFormat (nowMadridMinutes).
 * The browser OS clock is NOT consulted for timezone offset — the IANA tzdata
 * bundled with the browser engine is used instead. DST (CET↔CEST) is handled
 * automatically.
 */

import { useState, useEffect } from 'react';
import { useTimers } from './useTimers';
import { useCategorias } from './useCategorias';
import { parseInicio } from '../utils/time';
import { nowMadridMinutes } from '../utils/timezone';
import type { Temporizador, Categoria } from '../types/models';

export function useCurrentActiveTimer(): number | null {
  const { data: timers = [] } = useTimers();
  const { data: categorias = [] } = useCategorias();

  const [activeId, setActiveId] = useState<number | null>(() => compute(timers, categorias));

  useEffect(() => {
    // Recalculate immediately when data changes
    setActiveId(compute(timers, categorias));

    // Then align next tick to the next full minute boundary
    const msToNextMinute = 60_000 - (Date.now() % 60_000);
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const timeoutId = setTimeout(() => {
      setActiveId(compute(timers, categorias));
      intervalId = setInterval(() => {
        setActiveId(compute(timers, categorias));
      }, 60_000);
    }, msToNextMinute);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId !== null) clearInterval(intervalId);
    };
  }, [timers, categorias]);

  return activeId;
}

function compute(timers: Temporizador[], categorias: Categoria[]): number | null {
  const nowMinutes = nowMadridMinutes();
  for (const timer of timers) {
    const categoria = categorias.find((c) => c.idCategoria === timer.idCategoria);
    if (!categoria) continue;
    const { hours, minutes } = parseInicio(timer.inicio);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + categoria.duracion;
    const MINUTES_IN_DAY = 1440;
    const crossesMidnight = endMinutes > MINUTES_IN_DAY;
    const isActive = crossesMidnight
      ? nowMinutes >= startMinutes || nowMinutes < endMinutes - MINUTES_IN_DAY
      : nowMinutes >= startMinutes && nowMinutes < endMinutes;
    if (isActive) return timer.idTemporizador;
  }
  return null;
}
