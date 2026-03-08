import { describe, expect, it } from 'vitest';
import { formatDate, formatLocalizedDate, formatLocalizedDateTime } from './date-utils';

describe('formatDate', () => {
  it('formats dates in the stable YYYY/MM/DD shape used across public and admin lists', () => {
    expect(formatDate(new Date('2024-03-08T13:05:00.000Z'))).toBe('2024/03/08');
  });

  it('accepts string inputs as well as Date instances', () => {
    expect(formatDate('2024-12-01T00:00:00.000Z')).toBe('2024/12/01');
  });
});

describe('localized date helpers', () => {
  const date = new Date('2024-03-08T13:05:00.000Z');

  it('formats public dates with the active English locale', () => {
    expect(formatLocalizedDate(date, 'en-US')).toBe(new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date));
  });

  it('formats public dates with the active Chinese locale', () => {
    expect(formatLocalizedDate(date, 'zh-CN')).toBe(new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date));
  });

  it('formats memo timestamps with the active locale', () => {
    expect(formatLocalizedDateTime(date, 'en-US')).toBe(new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date));
  });
});
