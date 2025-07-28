import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { formatDate, truncateText, pluralize } from '../cli/utils/formatters.js';

describe('Formatters', () => {
  // Use real dates for testing
  const now = new Date();
  const minutesAgo = (minutes: number) => new Date(now.getTime() - minutes * 60 * 1000);
  const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000);
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  describe('formatDate', () => {
    it('should format "just now" for recent dates', () => {
      const date = new Date();
      expect(formatDate(date)).toBe('just now');
    });

    it('should format minutes ago', () => {
      const date = minutesAgo(30);
      expect(formatDate(date)).toBe('30m ago');
    });

    it('should format hours ago', () => {
      const date = hoursAgo(3);
      expect(formatDate(date)).toBe('3h ago');
    });

    it('should format days ago', () => {
      const date = daysAgo(2);
      expect(formatDate(date)).toBe('2d ago');
    });

    it('should format older dates', () => {
      const date = daysAgo(60);
      const result = formatDate(date);
      // Just check that it returns a formatted date string
      expect(result).toMatch(/\w{3} \d{1,2}/);
    });
  });

  describe('truncateText', () => {
    it('should not truncate short text', () => {
      expect(truncateText('Hello', 10)).toBe('Hello');
    });

    it('should truncate long text', () => {
      expect(truncateText('This is a very long text', 10)).toBe('This is...');
    });

    it('should handle exact length', () => {
      expect(truncateText('Exactly 10', 10)).toBe('Exactly 10');
    });
  });

  describe('pluralize', () => {
    it('should return singular for count 1', () => {
      expect(pluralize(1, 'item')).toBe('1 item');
    });

    it('should return plural for count > 1', () => {
      expect(pluralize(5, 'item')).toBe('5 items');
    });

    it('should use custom plural', () => {
      expect(pluralize(2, 'child', 'children')).toBe('2 children');
    });

    it('should handle zero', () => {
      expect(pluralize(0, 'item')).toBe('0 items');
    });
  });
});