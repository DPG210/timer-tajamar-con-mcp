/**
 * Unit tests for src/utils/time.ts
 *
 * Testing strategy (senior-testing-agent):
 *   Layer: Unit — pure functions, no mocks needed.
 *   Framework: Vitest (co-located with Vite).
 *   Pattern: Arrange / Act / Assert.
 *   Coverage target: 100% of exported functions.
 *   Mutation-sensitive: boundary cases (solapamiento exclusive on boundaries).
 */

import { describe, it, expect } from 'vitest';
import {
  transformDuration,
  transformMinutes,
  parseInicio,
  calcularFin,
  formatInicio,
  buildInicioString,
  toTimeRange,
  haySolapamiento,
  formatCountdown,
} from './time';

// ---------------------------------------------------------------------------
// transformDuration
// ---------------------------------------------------------------------------

describe('transformDuration', () => {
  it('converts 0 minutes to 00:00', () => {
    expect(transformDuration(0)).toBe('00:00');
  });

  it('converts 30 minutes to 00:30', () => {
    expect(transformDuration(30)).toBe('00:30');
  });

  it('converts 60 minutes to 01:00', () => {
    expect(transformDuration(60)).toBe('01:00');
  });

  it('converts 90 minutes to 01:30', () => {
    expect(transformDuration(90)).toBe('01:30');
  });

  it('pads hours and minutes with leading zeros', () => {
    expect(transformDuration(5)).toBe('00:05');
    expect(transformDuration(65)).toBe('01:05');
  });
});

// ---------------------------------------------------------------------------
// transformMinutes
// ---------------------------------------------------------------------------

describe('transformMinutes', () => {
  it('converts 00:00 to 0', () => {
    expect(transformMinutes('00:00')).toBe(0);
  });

  it('converts 00:30 to 30', () => {
    expect(transformMinutes('00:30')).toBe(30);
  });

  it('converts 01:30 to 90', () => {
    expect(transformMinutes('01:30')).toBe(90);
  });

  it('is the inverse of transformDuration for whole-minute values', () => {
    for (const mins of [0, 15, 30, 45, 60, 90, 120, 75]) {
      expect(transformMinutes(transformDuration(mins))).toBe(mins);
    }
  });
});

// ---------------------------------------------------------------------------
// parseInicio
// ---------------------------------------------------------------------------

describe('parseInicio', () => {
  it('parses full ISO datetime string', () => {
    expect(parseInicio('2024-06-01T10:30:00')).toEqual({ hours: 10, minutes: 30 });
  });

  it('parses bare HH:mm:ss string', () => {
    expect(parseInicio('09:15:00')).toEqual({ hours: 9, minutes: 15 });
  });

  it('parses bare HH:mm string', () => {
    expect(parseInicio('23:45')).toEqual({ hours: 23, minutes: 45 });
  });
});

// ---------------------------------------------------------------------------
// calcularFin
// ---------------------------------------------------------------------------

describe('calcularFin', () => {
  it('calculates end time for a 90-minute slot starting at 10:30', () => {
    expect(calcularFin('2024-06-01T10:30:00', 90)).toBe('12:00');
  });

  it('wraps past midnight', () => {
    expect(calcularFin('2024-06-01T23:30:00', 60)).toBe('00:30');
  });

  it('handles 0 duration', () => {
    expect(calcularFin('2024-06-01T10:00:00', 0)).toBe('10:00');
  });
});

// ---------------------------------------------------------------------------
// formatInicio
// ---------------------------------------------------------------------------

describe('formatInicio', () => {
  it('formats ISO datetime to HH:mm', () => {
    expect(formatInicio('2024-06-01T09:05:00')).toBe('09:05');
  });

  it('formats bare time to HH:mm', () => {
    expect(formatInicio('14:30:00')).toBe('14:30');
  });
});

// ---------------------------------------------------------------------------
// buildInicioString
// ---------------------------------------------------------------------------

describe('buildInicioString', () => {
  it('builds ISO datetime from date and time parts', () => {
    expect(buildInicioString('2024-06-01', '10:30')).toBe('2024-06-01T10:30:00');
  });
});

// ---------------------------------------------------------------------------
// toTimeRange
// ---------------------------------------------------------------------------

describe('toTimeRange', () => {
  it('converts inicio and duration to a TimeRange in minutes', () => {
    const range = toTimeRange('2024-06-01T10:00:00', 60);
    expect(range).toEqual({ startMinutes: 600, endMinutes: 660 });
  });
});

// ---------------------------------------------------------------------------
// haySolapamiento — critical business logic
// ---------------------------------------------------------------------------

describe('haySolapamiento', () => {
  // A: 10:00–11:00 (600–660)
  // B: 11:00–12:00 (660–720) — adjacent, no overlap
  it('returns false for adjacent ranges (boundary exclusive)', () => {
    const a = { startMinutes: 600, endMinutes: 660 };
    const b = { startMinutes: 660, endMinutes: 720 };
    expect(haySolapamiento(a, b)).toBe(false);
  });

  // A: 10:00–11:00, B: 10:30–11:30 — overlapping
  it('returns true for overlapping ranges', () => {
    const a = { startMinutes: 600, endMinutes: 660 };
    const b = { startMinutes: 630, endMinutes: 690 };
    expect(haySolapamiento(a, b)).toBe(true);
  });

  // A: 10:00–12:00, B: 10:30–11:00 — B inside A
  it('returns true when one range is inside the other', () => {
    const a = { startMinutes: 600, endMinutes: 720 };
    const b = { startMinutes: 630, endMinutes: 660 };
    expect(haySolapamiento(a, b)).toBe(true);
  });

  // A: 10:00–11:00, B: 12:00–13:00 — no overlap, gap between them
  it('returns false for non-overlapping ranges with a gap', () => {
    const a = { startMinutes: 600, endMinutes: 660 };
    const b = { startMinutes: 720, endMinutes: 780 };
    expect(haySolapamiento(a, b)).toBe(false);
  });

  // Commutative property
  it('is commutative (haySolapamiento(a,b) === haySolapamiento(b,a))', () => {
    const a = { startMinutes: 600, endMinutes: 660 };
    const b = { startMinutes: 630, endMinutes: 690 };
    expect(haySolapamiento(a, b)).toBe(haySolapamiento(b, a));
  });

  // Exactly identical ranges
  it('returns true for identical ranges', () => {
    const r = { startMinutes: 600, endMinutes: 660 };
    expect(haySolapamiento(r, r)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// formatCountdown
// ---------------------------------------------------------------------------

describe('formatCountdown', () => {
  it('formats 0 seconds as 00:00', () => {
    expect(formatCountdown(0)).toBe('00:00');
  });

  it('formats 125 seconds as 02:05', () => {
    expect(formatCountdown(125)).toBe('02:05');
  });

  it('formats 60 seconds as 01:00', () => {
    expect(formatCountdown(60)).toBe('01:00');
  });

  it('clamps negative values to 00:00', () => {
    expect(formatCountdown(-5)).toBe('00:00');
  });

  it('floors fractional seconds', () => {
    expect(formatCountdown(59.9)).toBe('00:59');
  });
});
