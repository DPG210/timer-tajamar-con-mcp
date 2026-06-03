/**
 * Tiempo — countdown display subcomponent.
 * Migrated from Tiempo.js (functional component with hooks — was already React hooks).
 *
 * Resolves M-03: does NOT create its own socket. Receives remainingSeconds as prop.
 * The parent (TimerView) owns the socket via useTimerSocket.
 *
 * Vibration: navigator.vibrate() at 12 and 3 seconds remaining (same as original).
 */

import { useEffect } from 'react';
import { formatCountdown } from '../../utils/time';

interface TiempoProps {
  remainingSeconds: number;
  totalSeconds: number;
}

function getTimerColorClass(remainingSeconds: number, totalSeconds: number): string {
  if (totalSeconds === 0) return 'text-white';
  if (remainingSeconds <= 300) return 'text-red-500';
  if (remainingSeconds <= totalSeconds / 2) return 'text-orange-400';
  return 'text-white';
}

export function Tiempo({ remainingSeconds, totalSeconds }: TiempoProps) {
  // Vibration alerts at 12 and 3 seconds — matches original behavior.
  // Guard: remainingSeconds > 0 ensures no vibration fires when idle (parent passes 0).
  useEffect(() => {
    if (remainingSeconds > 0 && (remainingSeconds === 12 || remainingSeconds === 3)) {
      if ('vibrate' in navigator) {
        navigator.vibrate(200);
      }
    }
  }, [remainingSeconds]);

  const display = formatCountdown(remainingSeconds);
  const colorClass = getTimerColorClass(remainingSeconds, totalSeconds);

  return (
    <div
      className={`${colorClass} text-8xl md:text-9xl font-mono font-bold tabular-nums text-center`}
      aria-live="polite"
      aria-label={`Tiempo restante: ${display}`}
      role="timer"
    >
      {display}
    </div>
  );
}
