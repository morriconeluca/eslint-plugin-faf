import { describe, expect, it } from 'vitest';

import { normalizeOrigins } from './index.js';

describe('normalizeOrigins', () => {
  it('returns empty array when origins is empty', () => {
    expect(normalizeOrigins([])).toEqual([]);
  });

  it('strips leading dot-slash from origin path', () => {
    expect(normalizeOrigins(['./src', './apps/web'])).toEqual([
      'src',
      'apps/web',
    ]);
  });

  it('strips trailing slash from origin path when length is greater than 1', () => {
    expect(normalizeOrigins(['src/', 'apps/web/'])).toEqual([
      'src',
      'apps/web',
    ]);
  });

  it('preserves single slash when passed', () => {
    expect(normalizeOrigins(['/'])).toEqual(['/']);
  });

  it('converts Windows backslashes to POSIX forward slashes', () => {
    expect(normalizeOrigins(['apps\\web\\sub'])).toEqual(['apps/web/sub']);
  });
});
