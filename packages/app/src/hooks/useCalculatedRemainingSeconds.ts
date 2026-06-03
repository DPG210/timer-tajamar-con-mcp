/**
 * useCalculatedRemainingSeconds — client-side countdown derived from REST data.
 *
 * WHY THIS EXISTS
 * ---------------
 * The socket "envio" event carries remaining seconds as counted by the backend
 * from the moment "vamos" was pressed, not from the scheduled inicio time.
 * This makes the display drift whenever the operator presses "vamos" late or
 * early relative to the scheduled start.
 *
 * This hook ignores "envio" entirely and recomputes remaining time every second
 * from first principles:
 *
 *   endMinutes   = startMinutes + categoria.duracion
 *   remaining    = (endMinutes - nowMadridMinutes()) * 60   [seconds]
 *
 * where startMinutes comes from parseInicio(timer.inicio) and nowMadridMinutes()
 * is pinned to Europe/Madrid via Intl.DateTimeFormat (immune to browser OS offset).
 *
 * GUARANTEES
 * ----------
 * - Returns 0 (never negative) when the timer has overrun.
 * - Returns 0 when activeTimerId is null.
 * - Returns 0 when the active timer or its categoria cannot be found in the lists.
 * - Updates exactly once per second via setInterval; the interval is cleared on
 *   unmount and whenever activeTimerId changes (avoids stale-closure drift).
 *
 * PRECISION NOTE
 * --------------
 * nowMadridMinutes() includes seconds (hours * 60 + minutes + seconds / 60),
 * so the granularity of the countdown is ~1 second, matching the interval.
 * Sub-second jitter from setInterval scheduling is accepted — this is a display
 * countdown, not a billing clock.
 */

import { useState, useEffect } from 'react';
import type { Temporizador, Categoria } from '../types/models';
import { parseInicio } from '../utils/time';
import { nowMadridMinutes } from '../utils/timezone';

// ---------------------------------------------------------------------------
// Pure helper — no React dependency, easy to unit-test
// ---------------------------------------------------------------------------

/**
 * Compute remaining seconds for a single timer, given the current Madrid time
 * expressed as minutes from midnight.
 *
 * Returns 0 for overrun (never negative).
 */
export function computeRemainingSeconds(
  timer: Temporizador,
  categoria: Categoria,
  nowMinutes: number,
): number {
  const { hours, minutes } = parseInicio(timer.inicio);
  const startMinutes = hours * 60 + minutes;
  const endMinutes = startMinutes + categoria.duracion;

  // If timer crosses midnight and now is in the post-midnight window,
  // shift nowMinutes forward by a day so subtraction gives correct remaining time.
  const MINUTES_IN_DAY = 1440;
  const adjustedNow =
    endMinutes > MINUTES_IN_DAY && nowMinutes < endMinutes - MINUTES_IN_DAY
      ? nowMinutes + MINUTES_IN_DAY
      : nowMinutes;

  const remainingMinutes = endMinutes - adjustedNow;
  return Math.max(0, remainingMinutes * 60);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseCalculatedRemainingSecondsArgs {
  activeTimerId: number | null;
  timers: Temporizador[];
  categorias: Categoria[];
}

/**
 * Returns remaining seconds for the active timer, recalculated every second
 * from the scheduled inicio + duracion. Returns 0 when there is no active timer.
 */
export function useCalculatedRemainingSeconds({
  activeTimerId,
  timers,
  categorias,
}: UseCalculatedRemainingSecondsArgs): number {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() =>
    calculate(activeTimerId, timers, categorias),
  );

  useEffect(() => {
    // Recalculate immediately whenever the active timer (or the supporting data)
    // changes — avoids a 1-second stale display on timer transitions.
    setRemainingSeconds(calculate(activeTimerId, timers, categorias));

    if (activeTimerId === null) {
      // No active timer — no interval needed.
      return;
    }

    // Align the interval to the next real second boundary so all browser
    // windows fire at approximately the same wall-clock millisecond,
    // eliminating the visual phase misalignment between clients.
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const msToNextSecond = 1000 - (Date.now() % 1000);
    const timeoutId = setTimeout(() => {
      setRemainingSeconds(calculate(activeTimerId, timers, categorias));
      intervalId = setInterval(() => {
        setRemainingSeconds(calculate(activeTimerId, timers, categorias));
      }, 1000);
    }, msToNextSecond);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId !== null) clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTimerId, timers, categorias]);

  return remainingSeconds;
}

// ---------------------------------------------------------------------------
// Internal — not exported; only the hook and computeRemainingSeconds are public
// ---------------------------------------------------------------------------

function calculate(
  activeTimerId: number | null,
  timers: Temporizador[],
  categorias: Categoria[],
): number {
  if (activeTimerId === null) return 0;

  const timer = timers.find((t) => t.idTemporizador === activeTimerId);
  if (!timer) return 0;

  const categoria = categorias.find((c) => c.idCategoria === timer.idCategoria);
  if (!categoria) return 0;

  return computeRemainingSeconds(timer, categoria, nowMadridMinutes());
}
