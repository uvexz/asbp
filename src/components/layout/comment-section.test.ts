import { describe, expect, it } from 'vitest';
import { formatDate } from './comment-section';

describe('formatDate', () => {
  const date = new Date('2024-03-08T13:05:00.000Z');

  it('formats comment timestamps with the active English locale', () => {
    expect(formatDate(date, 'en-US')).toBe(new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date));
  });

  it('formats comment timestamps with the active Chinese locale', () => {
    expect(formatDate(date, 'zh-CN')).toBe(new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date));
  });
});
