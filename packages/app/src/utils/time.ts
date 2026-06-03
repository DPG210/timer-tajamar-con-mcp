/**
 * Time utility functions — pure, no side effects.
 * Extracted from Horario.js, Temporizadores.js, Categorias.js,
 * EmpresasEventoTimers.js, EmpresasEventoTimersNew.js.
 * Resolves M-05: single source of truth for all time logic.
 *
 * All functions are exported individually for tree-shaking.
 */

/**
 * Convert total minutes to "HH:mm" display string.
 *
 * @example transformDuration(90) === "01:30"
 */
export function transformDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Convert a "HH:mm" string to total minutes as a number.
 *
 * @example transformMinutes("01:30") === 90
 */
export function transformMinutes(hhMm: string): number {
  const [hoursStr, minsStr] = hhMm.split(':');
  const hours = parseInt(hoursStr ?? '0', 10);
  const mins = parseInt(minsStr ?? '0', 10);
  return hours * 60 + mins;
}

/**
 * Parse the "inicio" field of a Temporizador into hours and minutes.
 * Input: ISO-like string "YYYY-MM-DDTHH:mm:ss" or "HH:mm:ss" or "HH:mm".
 * Returns { hours, minutes } — the date part is ignored.
 *
 * Timezone note: this function is purely string-splitting; it has no knowledge
 * of timezones. The caller (useCurrentActiveTimer) is responsible for comparing
 * the result against Europe/Madrid wallclock time via nowMadridMinutes().
 *
 * DST admin warning: do not schedule timers between 02:00–03:00 on the last
 * Sunday of March (spring-forward phantom hour) or October (fall-back duplicate
 * hour). See src/utils/timezone.ts for details.
 */
export function parseInicio(inicio: string): { hours: number; minutes: number } {
  // Handle full ISO "2024-06-01T10:30:00" and bare "10:30:00" / "10:30"
  const timePart = inicio.includes('T') ? inicio.split('T')[1] ?? '' : inicio;
  const [hStr, mStr] = timePart.split(':');
  return {
    hours: parseInt(hStr ?? '0', 10),
    minutes: parseInt(mStr ?? '0', 10),
  };
}

/**
 * Given an "inicio" string and a duration in minutes, compute the end time
 * as a "HH:mm" display string.
 *
 * Wraps past midnight (e.g. 23:30 + 90 min = "01:00").
 *
 * @example calcularFin("2024-06-01T10:30:00", 90) === "12:00"
 */
export function calcularFin(inicio: string, duracionMinutos: number): string {
  const { hours, minutes } = parseInicio(inicio);
  const totalMins = hours * 60 + minutes + duracionMinutos;
  const endHours = Math.floor(totalMins / 60) % 24;
  const endMins = totalMins % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
}

/**
 * Format an "inicio" string as "HH:mm" for display purposes.
 *
 * @example formatInicio("2024-06-01T10:30:00") === "10:30"
 */
export function formatInicio(inicio: string): string {
  const { hours, minutes } = parseInicio(inicio);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Build the ISO datetime string expected by the backend from date + time parts.
 *
 * @param date "YYYY-MM-DD"
 * @param time "HH:mm"
 * @returns "YYYY-MM-DDTHH:mm:ss"
 */
export function buildInicioString(date: string, time: string): string {
  return `${date}T${time}:00`;
}

/**
 * A time range expressed in total minutes from midnight.
 */
export interface TimeRange {
  startMinutes: number;
  endMinutes: number;
}

/**
 * Convert a Temporizador inicio + duration into a TimeRange.
 */
export function toTimeRange(inicio: string, duracionMinutos: number): TimeRange {
  const { hours, minutes } = parseInicio(inicio);
  const startMinutes = hours * 60 + minutes;
  return {
    startMinutes,
    endMinutes: startMinutes + duracionMinutos,
  };
}

/**
 * Check whether two time ranges overlap (exclusive on boundaries).
 * Two ranges that share only a boundary point (start === end) do NOT overlap.
 *
 * Resolves M-05: replaces the duplicated haysolapamiento logic.
 *
 * @example
 * haySolapamiento({ startMinutes: 60, endMinutes: 120 }, { startMinutes: 90, endMinutes: 150 }) === true
 * haySolapamiento({ startMinutes: 60, endMinutes: 120 }, { startMinutes: 120, endMinutes: 180 }) === false
 */
export function haySolapamiento(a: TimeRange, b: TimeRange): boolean {
  return a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes;
}

/**
 * Format remaining seconds as "MM:SS".
 *
 * @example formatCountdown(125) === "02:05"
 */
export function formatCountdown(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
