import { describe, expect, it } from 'vitest';
import {
  ISTANBUL_CONTENT,
  createCitySlug,
  getAllDistrictSlugs,
  getDistrictContentBySlug,
} from '@/data/city-content';

describe('city-content', () => {
  it('createCitySlug normalizes Turkish characters and spaces', () => {
    expect(createCitySlug('İstanbul Şişli')).toBe('istanbul-sisli');
    expect(createCitySlug('Çiğdem Öztürk')).toBe('cigdem-ozturk');
  });

  it('getAllDistrictSlugs includes istanbul and known districts', () => {
    const slugs = getAllDistrictSlugs();
    expect(slugs[0]).toBe('istanbul');
    expect(slugs).toContain('kadikoy');
  });

  it('getDistrictContentBySlug returns ISTANBUL_CONTENT for istanbul', () => {
    const content = getDistrictContentBySlug('istanbul');
    expect(content).toBe(ISTANBUL_CONTENT);
    expect(content?.slug).toBe('istanbul');
  });
});
