import { describe, expect, it } from 'vitest';

import { cleanBasePath } from './clean-base-path.util.js';

describe('cleanBasePath', () => {
  it('returns base unchanged when there is no trailing slash', () => {
    expect(cleanBasePath('src/_src@shared')).toBe('src/_src@shared');
  });

  it('strips trailing slash from base', () => {
    expect(cleanBasePath('src/_src@shared/')).toBe('src/_src@shared');
  });

  it('returns dot when base is empty string', () => {
    expect(cleanBasePath('')).toBe('.');
  });

  it('returns dot when base is a single trailing slash', () => {
    expect(cleanBasePath('/')).toBe('.');
  });
});
