import { describe, expect, it } from 'vitest';

import { applyPathAliasSuffix } from './apply-path-alias-suffix.util.js';

describe('applyPathAliasSuffix', () => {
  it('returns target unchanged when suffix is empty', () => {
    expect(applyPathAliasSuffix('src/_src@shared', '')).toBe('src/_src@shared');
  });

  it('returns suffix when target is dot', () => {
    expect(applyPathAliasSuffix('.', 'unit')).toBe('unit');
  });

  it('returns suffix when target is empty string', () => {
    expect(applyPathAliasSuffix('', 'unit')).toBe('unit');
  });

  it('strips trailing slash from target before appending suffix', () => {
    expect(applyPathAliasSuffix('src/_src@shared/', 'unit')).toBe(
      'src/_src@shared/unit'
    );
  });

  it('joins normal target with suffix separated by slash', () => {
    expect(applyPathAliasSuffix('src/_src@shared', 'unit/client.ts')).toBe(
      'src/_src@shared/unit/client.ts'
    );
  });
});
