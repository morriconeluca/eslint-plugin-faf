import { describe, expect, it } from 'vitest';

import { getLcaAndSubBranches } from './get-lca-and-sub-branches.util.js';

describe('getLcaAndSubBranches', () => {
  it('should find LCA and sub branches for different paths', () => {
    const res = getLcaAndSubBranches('src/foo/bar', 'src/foo/baz');
    expect(res).toEqual({
      lca: 'src/foo',
      subA: 'bar',
      subB: 'baz',
    });
  });

  it('should return null if there is no common prefix', () => {
    const res = getLcaAndSubBranches('src/foo', 'tests/bar');
    expect(res).toBeNull();
  });
});
