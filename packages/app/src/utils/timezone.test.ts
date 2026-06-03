/**
 * Unit tests for src/utils/timezone.ts
 *
 * Testing strategy:
 *   Layer: Unit — pure functions, deterministic via vi.setSystemTime.
 *   Framework: Vitest (bundled with the project).
 *   Pattern: Arrange / Act / Assert.
 *   Approach: vi.useFakeTimers + vi.setSystemTime pins new Date() to a known
 *   UTC instant; the Intl.DateTimeFormat formatter then converts that instant
 *   to Europe/Madrid wallclock time using the browser's IANA tzdata.
 *
 * IMPORTANT: These tests verify the *Europe/Madrid* output, not UTC.
 * The assertions are written in terms of what a person in Madrid sees on their
 * clock — that is the point of the whole module.
 *
 * DST reference dates used:
 *   CET  (UTC+1): 2024-01-15 — standard winter time
 *   CEST (UTC+2): 2024-07-15 — summer time (DST active)
 *   Spring-forward: 2024-03-31 01:59 UTC → 03:00 CEST (clocks jump forward)
 *   Fall-back:      2024-10-27 01:00 UTC → 02:00 CET  (clocks fall back)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { nowMadridMinutes, todayMadrid, nowMadridHHMM } from './timezone';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Set the fake system clock to a specific UTC ISO string and return it.
 * Vitest's fake timers intercept `new Date()` so the timezone module always
 * reads from a controlled instant.
 */
function pinTime(utcIso: string): Date {
  const d = new Date(utcIso);
  vi.setSystemTime(d);
  return d;
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// nowMadridMinutes — winter (CET = UTC+1)
// ---------------------------------------------------------------------------

describe('nowMadridMinutes — CET (UTC+1, winter)', () => {
  it('returns correct minutes at 10:30:00 Madrid (09:30 UTC)', () => {
    // 2024-01-15 09:30:00 UTC === 10:30:00 CET
    pinTime('2024-01-15T09:30:00.000Z');
    // 10*60 + 30 + 0/60 = 630
    expect(nowMadridMinutes()).toBeCloseTo(630, 1);
  });

  it('returns correct minutes at 00:00:00 Madrid (23:00 UTC prev day)', () => {
    // 2024-01-15 23:00:00 UTC === 2024-01-16 00:00:00 CET
    pinTime('2024-01-15T23:00:00.000Z');
    expect(nowMadridMinutes()).toBeCloseTo(0, 1);
  });

  it('returns correct minutes at 23:59:59 Madrid (22:59:59 UTC)', () => {
    // 2024-01-15 22:59:59 UTC === 23:59:59 CET
    pinTime('2024-01-15T22:59:59.000Z');
    // 23*60 + 59 + 59/60 ≈ 1439.98
    expect(nowMadridMinutes()).toBeCloseTo(1439.98, 1);
  });

  it('includes seconds as fractional minutes', () => {
    // 2024-01-15 09:30:30 UTC === 10:30:30 CET
    pinTime('2024-01-15T09:30:30.000Z');
    // 630 + 30/60 = 630.5
    expect(nowMadridMinutes()).toBeCloseTo(630.5, 1);
  });
});

// ---------------------------------------------------------------------------
// nowMadridMinutes — summer (CEST = UTC+2)
// ---------------------------------------------------------------------------

describe('nowMadridMinutes — CEST (UTC+2, summer)', () => {
  it('returns correct minutes at 10:30:00 Madrid (08:30 UTC)', () => {
    // 2024-07-15 08:30:00 UTC === 10:30:00 CEST
    pinTime('2024-07-15T08:30:00.000Z');
    expect(nowMadridMinutes()).toBeCloseTo(630, 1);
  });

  it('returns correct minutes at 00:00:00 Madrid (22:00 UTC prev day)', () => {
    // 2024-07-14 22:00:00 UTC === 2024-07-15 00:00:00 CEST
    pinTime('2024-07-14T22:00:00.000Z');
    expect(nowMadridMinutes()).toBeCloseTo(0, 1);
  });

  it('returns correct minutes at 23:00:00 Madrid (21:00 UTC)', () => {
    // 2024-07-15 21:00:00 UTC === 23:00:00 CEST
    pinTime('2024-07-15T21:00:00.000Z');
    expect(nowMadridMinutes()).toBeCloseTo(1380, 1);
  });
});

// ---------------------------------------------------------------------------
// nowMadridMinutes — DST transitions
// ---------------------------------------------------------------------------

describe('nowMadridMinutes — DST spring-forward boundary (2024-03-31)', () => {
  it('reads 01:59 CET just before spring-forward (00:59 UTC)', () => {
    // Spain spring-forward 2024: at 02:00 CET (01:00 UTC) clocks jump to 03:00 CEST.
    // One minute before: 00:59:00 UTC === 01:59:00 CET (still winter time)
    pinTime('2024-03-31T00:59:00.000Z');
    // 1*60 + 59 = 119
    expect(nowMadridMinutes()).toBeCloseTo(119, 1);
  });

  it('reads 03:00 CEST immediately after spring-forward (01:00 UTC)', () => {
    // 2024-03-31 01:00:00 UTC === 03:00:00 CEST (clocks just jumped forward)
    pinTime('2024-03-31T01:00:00.000Z');
    // 3*60 = 180
    expect(nowMadridMinutes()).toBeCloseTo(180, 1);
  });

  it('confirms the phantom hour: 02:30 Madrid time does not exist on spring-forward day', () => {
    // There is no UTC instant that maps to 02:30 CEST on 2024-03-31.
    // At 00:59 UTC it is 01:59 CET; at 01:00 UTC it is 03:00 CEST.
    // The hour 02:xx is skipped entirely. We verify the jump is 61 minutes wide.
    const before = (() => { pinTime('2024-03-31T00:59:00.000Z'); return nowMadridMinutes(); })();
    const after  = (() => { pinTime('2024-03-31T01:00:00.000Z'); return nowMadridMinutes(); })();
    // before = 119, after = 180 — gap is 61 min, confirming the phantom hour
    expect(after - before).toBeCloseTo(61, 0);
  });
});

describe('nowMadridMinutes — DST fall-back boundary (2024-10-27)', () => {
  it('reads 02:00 CEST at 00:00 UTC (first pass through 02:xx)', () => {
    // 2024-10-27 00:00:00 UTC === 02:00:00 CEST (first pass)
    pinTime('2024-10-27T00:00:00.000Z');
    expect(nowMadridMinutes()).toBeCloseTo(120, 1);
  });

  it('reads 02:00 CET at 01:00 UTC (second pass through 02:xx after clocks fall back)', () => {
    // 2024-10-27 01:00:00 UTC === 02:00:00 CET (second pass, clocks fell back)
    pinTime('2024-10-27T01:00:00.000Z');
    expect(nowMadridMinutes()).toBeCloseTo(120, 1);
  });
});

// ---------------------------------------------------------------------------
// todayMadrid — basic
// ---------------------------------------------------------------------------

describe('todayMadrid', () => {
  it('returns YYYY-MM-DD format in winter', () => {
    pinTime('2024-01-15T12:00:00.000Z');
    expect(todayMadrid()).toBe('2024-01-15');
  });

  it('returns YYYY-MM-DD format in summer', () => {
    pinTime('2024-07-15T12:00:00.000Z');
    expect(todayMadrid()).toBe('2024-07-15');
  });

  it('returns the Madrid date, not UTC, just after UTC midnight in summer (UTC ahead of Madrid by -2h, so Madrid is behind)', () => {
    // 2024-07-15 00:30:00 UTC === 2024-07-15 02:30:00 CEST — same Madrid day
    pinTime('2024-07-15T00:30:00.000Z');
    expect(todayMadrid()).toBe('2024-07-15');
  });

  it('returns Madrid date when UTC is still previous day (CEST context)', () => {
    // 2024-07-14 22:30:00 UTC === 2024-07-15 00:30:00 CEST — new Madrid day
    pinTime('2024-07-14T22:30:00.000Z');
    expect(todayMadrid()).toBe('2024-07-15');
  });

  it('returns Madrid date when UTC is still previous day (CET context)', () => {
    // 2024-01-14 23:30:00 UTC === 2024-01-15 00:30:00 CET — new Madrid day
    pinTime('2024-01-14T23:30:00.000Z');
    expect(todayMadrid()).toBe('2024-01-15');
  });

  it('returns correct day just before UTC midnight in winter', () => {
    // 2024-01-15 23:30:00 UTC === 2024-01-16 00:30:00 CET — Madrid is already next day
    pinTime('2024-01-15T23:30:00.000Z');
    expect(todayMadrid()).toBe('2024-01-16');
  });
});

// ---------------------------------------------------------------------------
// nowMadridHHMM
// ---------------------------------------------------------------------------

describe('nowMadridHHMM', () => {
  it('returns correct hours and minutes in winter', () => {
    // 2024-01-15 09:30:45 UTC === 10:30:45 CET
    pinTime('2024-01-15T09:30:45.000Z');
    expect(nowMadridHHMM()).toEqual({ hours: 10, minutes: 30 });
  });

  it('returns correct hours and minutes in summer', () => {
    // 2024-07-15 08:30:45 UTC === 10:30:45 CEST
    pinTime('2024-07-15T08:30:45.000Z');
    expect(nowMadridHHMM()).toEqual({ hours: 10, minutes: 30 });
  });

  it('returns midnight as 0:00', () => {
    // 2024-01-15 23:00:00 UTC === 2024-01-16 00:00:00 CET
    pinTime('2024-01-15T23:00:00.000Z');
    expect(nowMadridHHMM()).toEqual({ hours: 0, minutes: 0 });
  });
});

// ---------------------------------------------------------------------------
// Regression: verifies the old broken pattern would fail
// (documents what the fix prevents — not testing the Intl API itself)
// ---------------------------------------------------------------------------

describe('regression: old new Date() pattern would give wrong result in summer', () => {
  it('demonstrates that nowMadridMinutes gives UTC+2 offset, not UTC+0', () => {
    // 08:30 UTC in summer = 10:30 CEST
    // Old broken code: new Date().getHours() on a UTC-configured machine = 8 → 510 min
    // Correct code: nowMadridMinutes() = 630 min
    pinTime('2024-07-15T08:30:00.000Z');
    const result = nowMadridMinutes();
    // Must be 630 (10:30 Madrid), not 510 (08:30 UTC)
    expect(result).toBeCloseTo(630, 1);
    expect(result).not.toBeCloseTo(510, 1);
  });
});
