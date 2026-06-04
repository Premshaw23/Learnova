import { describe, it, expect } from 'vitest';
import {
  calculateAttendancePercentage,
  countAttendanceByStatus,
  isBelowThreshold,
  getAttendanceStatus,
} from '@/lib/attendanceUtils';

describe('calculateAttendancePercentage', () => {
  it('returns 100 when all classes attended', () => {
    expect(calculateAttendancePercentage(30, 30)).toBe(100);
  });

  it('returns 0 when no classes attended', () => {
    expect(calculateAttendancePercentage(0, 30)).toBe(0);
  });

  it('returns correct percentage rounded to 2 decimal places', () => {
    expect(calculateAttendancePercentage(20, 30)).toBeCloseTo(66.67, 1);
  });

  it('returns 75 for 3 out of 4 classes', () => {
    expect(calculateAttendancePercentage(3, 4)).toBe(75);
  });

  it('throws error when total is 0 — division by zero', () => {
    expect(() => calculateAttendancePercentage(0, 0)).toThrow(
      'Total classes cannot be zero'
    );
  });

  it('throws error when attended is negative', () => {
    expect(() => calculateAttendancePercentage(-1, 30)).toThrow(
      'Attendance values cannot be negative'
    );
  });

  it('throws error when attended exceeds total', () => {
    expect(() => calculateAttendancePercentage(31, 30)).toThrow(
      'Attended classes cannot exceed total classes'
    );
  });

  it('handles single class attended out of 1', () => {
    expect(calculateAttendancePercentage(1, 1)).toBe(100);
  });
});

describe('countAttendanceByStatus', () => {
  it('counts present, absent, late correctly', () => {
    const records = [
      { status: 'present' },
      { status: 'present' },
      { status: 'absent' },
      { status: 'late' },
    ];
    expect(countAttendanceByStatus(records)).toEqual({
      present: 2,
      absent: 1,
      late: 1,
    });
  });

  it('returns zeros for empty array', () => {
    expect(countAttendanceByStatus([])).toEqual({
      present: 0,
      absent: 0,
      late: 0,
    });
  });

  it('is case-insensitive for status values', () => {
    const records = [
      { status: 'Present' },
      { status: 'ABSENT' },
      { status: 'Late' },
    ];
    expect(countAttendanceByStatus(records)).toEqual({
      present: 1,
      absent: 1,
      late: 1,
    });
  });

  it('ignores unknown status values', () => {
    const records = [
      { status: 'holiday' },
      { status: 'present' },
    ];
    expect(countAttendanceByStatus(records)).toEqual({
      present: 1,
      absent: 0,
      late: 0,
    });
  });

  it('throws error when records is not an array', () => {
    expect(() => countAttendanceByStatus(null)).toThrow(
      'Records must be an array'
    );
  });
});

describe('isBelowThreshold', () => {
  it('returns true when below default 75% threshold', () => {
    expect(isBelowThreshold(70)).toBe(true);
  });

  it('returns false when above default threshold', () => {
    expect(isBelowThreshold(80)).toBe(false);
  });

  it('returns false when exactly at threshold', () => {
    expect(isBelowThreshold(75)).toBe(false);
  });

  it('uses custom threshold correctly', () => {
    expect(isBelowThreshold(80, 85)).toBe(true);
  });

  it('throws error for non-number inputs', () => {
    expect(() => isBelowThreshold('70')).toThrow();
  });
});

describe('getAttendanceStatus', () => {
  it('returns excellent for >= 90%', () => {
    expect(getAttendanceStatus(95)).toBe('excellent');
    expect(getAttendanceStatus(90)).toBe('excellent');
  });

  it('returns good for 75-89%', () => {
    expect(getAttendanceStatus(80)).toBe('good');
    expect(getAttendanceStatus(75)).toBe('good');
  });

  it('returns warning for 60-74%', () => {
    expect(getAttendanceStatus(65)).toBe('warning');
    expect(getAttendanceStatus(60)).toBe('warning');
  });

  it('returns critical for below 60%', () => {
    expect(getAttendanceStatus(50)).toBe('critical');
    expect(getAttendanceStatus(0)).toBe('critical');
  });
});
