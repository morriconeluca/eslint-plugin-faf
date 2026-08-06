import { describe, expect, it } from 'vitest';

import { getFractalBranchOwner } from './get-fractal-branch-owner.util.js';

describe('getFractalBranchOwner', () => {
  it('should return the parent of the fractal branch as owner', () => {
    expect(getFractalBranchOwner('src/_rules/_rules@shared')).toBe(
      'src/_rules'
    );
    expect(getFractalBranchOwner('src/_rules/_rules@shared/foo/bar')).toBe(
      'src/_rules'
    );
  });

  it('should return null if no fractal branch owner exists', () => {
    expect(getFractalBranchOwner('src/foo/bar')).toBeNull();
    expect(getFractalBranchOwner('.')).toBeNull();
  });
});
