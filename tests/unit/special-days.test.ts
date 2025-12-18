import { describe, expect, it } from 'vitest';
import {
  getAllSpecialDaySlugs,
  getMatchingSpecialDays,
  getSpecialDayBySlug,
} from '@/data/special-days';

describe('special-days', () => {
  it('getAllSpecialDaySlugs returns known slugs', () => {
    const slugs = getAllSpecialDaySlugs();
    expect(slugs).toContain('sevgililer-gunu');
    expect(slugs).toContain('anneler-gunu');
  });

  it('getSpecialDayBySlug returns the correct day', () => {
    const day = getSpecialDayBySlug('sevgililer-gunu');
    expect(day?.name).toBe('Sevgililer Günü');
  });

  it('getMatchingSpecialDays matches case-insensitively by tag inclusion', () => {
    const matches = getMatchingSpecialDays(['Kırmızı Gül Buketi', 'romantik']);
    const slugs = matches.map(m => m.slug);
    expect(slugs).toContain('sevgililer-gunu');
  });
});
