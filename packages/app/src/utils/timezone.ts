/**
 * timezone.ts — Europe/Madrid-aware time helpers.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * `new Date().getHours()` returns hours in the *browser OS* timezone, which
 * is almost always correct on Spain lab terminals but is not guaranteed —
 * a VM, a Docker container, a CI runner, or a user who has changed their
 * system clock can all produce a different offset. The Intl API lets us pin
 * the timezone explicitly without adding a dependency.
 *
 * DESIGN DECISIONS
 * ----------------
 * 1. We use `Intl.DateTimeFormat` with `timeZone:'Europe/Madrid'`, which is
 *    backed by the IANA tzdata bundled with the browser engine (V8, SpiderMonkey,
 *    WebKit). DST transitions (CET↔CEST, UTC+1↔UTC+2) are handled automatically.
 *
 * 2. We do NOT use `Date.prototype.toLocaleString` directly for logic because
 *    its output format is locale-dependent and unreliable for parsing.
 *
 * 3. We use `formatToParts` for machine-readable extraction; that API is
 *    available in all browsers that support Intl (Chrome 57+, Firefox 51+,
 *    Safari 11+). Lab terminals running any modern Chrome are fine.
 *
 * DST EDGE CASES (documented, not handled in code)
 * -------------------------------------------------
 * Spring-forward (last Sunday March, 02:00 → 03:00):
 *   Times between 02:00 and 03:00 do not exist in Europe/Madrid. A timer
 *   scheduled at e.g. 02:30 by an admin will be treated as active starting
 *   at ~02:00 Madrid time (since that is when the clock jumps). This is an
 *   administrative concern: no timer should be scheduled in the phantom hour.
 *
 * Fall-back (last Sunday October, 03:00 → 02:00):
 *   Times between 02:00 and 03:00 occur twice. A timer at 02:30 will appear
 *   active for ~2× its configured duration. Also an administrative concern.
 *
 * Both edge cases affect at most two Sundays per year and zero scheduled lab
 * sessions (labs do not run at 02:30 AM). They are out-of-scope for v2.
 */

const MADRID_TZ = 'Europe/Madrid';

/**
 * A formatter instance that extracts date/time parts in Europe/Madrid.
 * Singleton — creating DateTimeFormat is expensive; reuse it.
 */
const madridFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: MADRID_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

/**
 * Extract the Europe/Madrid parts of a Date object as plain numbers.
 * All values are calendar/wallclock values in Madrid local time.
 */
function getMadridParts(date: Date): {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const parts = madridFormatter.formatToParts(date);
  const get = (type: string): number => {
    const part = parts.find((p) => p.type === type);
    return parseInt(part?.value ?? '0', 10);
  };
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hours: get('hour'),
    minutes: get('minute'),
    seconds: get('second'),
  };
}

/**
 * Return the current time in Europe/Madrid as total minutes elapsed since
 * midnight, with sub-minute precision via seconds.
 *
 * This is the direct replacement for:
 *   const now = new Date();
 *   const nowMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
 *
 * @example
 *   // At 10:30:45 Madrid time:
 *   nowMadridMinutes() // => 630.75
 */
export function nowMadridMinutes(): number {
  const now = new Date();
  const { hours, minutes } = getMadridParts(now);
  return hours * 60 + minutes + now.getSeconds() / 60;
}

/**
 * Return today's date in Europe/Madrid as a "YYYY-MM-DD" string.
 *
 * This is the direct replacement for:
 *   new Date().toLocaleDateString('en-CA')                   // wrong: no explicit tz
 *   new Date().toISOString().slice(0, 10)                    // wrong: UTC date
 *
 * Safe across midnight and DST transitions: uses the Madrid wallclock date,
 * not the UTC date.
 *
 * @example
 *   // In Spain at 00:30 local time (UTC 22:30 previous day in summer):
 *   todayMadrid() // => "2024-10-27" (correct Madrid date, not "2024-10-26")
 */
export function todayMadrid(): string {
  const { year, month, day } = getMadridParts(new Date());
  return [
    String(year).padStart(4, '0'),
    String(month).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-');
}

/**
 * Return the current hour (0–23) and minute (0–59) in Europe/Madrid.
 * Exposed for debugging and test assertions.
 */
export function nowMadridHHMM(): { hours: number; minutes: number } {
  const { hours, minutes } = getMadridParts(new Date());
  return { hours, minutes };
}
