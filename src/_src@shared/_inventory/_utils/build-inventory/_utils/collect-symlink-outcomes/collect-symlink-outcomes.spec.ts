import { describe, expect, it } from 'vitest';

import type { TInventoryItem } from '../../../../_types/inventory.type.js';

import { collectSymlinkOutcomes } from './index.js';

const createItem = (
  isSymlink: boolean,
  path: string,
  realPath: string,
  treeOrigin: null | string
): TInventoryItem => ({
  depth: 0,
  id: 0,
  isSymlink,
  kind: 'file',
  parentId: null,
  path,
  preorderEnd: 0,
  preorderStart: 0,
  realPath,
  treeOrigin,
});

describe('collectSymlinkOutcomes', () => {
  it('returns empty array when items list is empty', () => {
    expect(collectSymlinkOutcomes([])).toEqual([]);
  });

  it('produces unverified outcome for symlink within a tree', () => {
    const item = createItem(true, 'src/link.ts', 'src/target.ts', 'src');
    const outcomes = collectSymlinkOutcomes([item]);

    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]).toEqual({
      constraint: 'unverified/symbolic-link',
      element: 'src/link.ts',
      family: 'unverified',
      message:
        "Symbolic link 'src/link.ts' within tree creates ambiguous physical identity (resolves to 'src/target.ts').",
      normativeReference: '§6',
      reason: 'src/target.ts',
    });
  });

  it('ignores non-symlink items within a tree', () => {
    const item = createItem(false, 'src/main.ts', 'src/main.ts', 'src');
    expect(collectSymlinkOutcomes([item])).toEqual([]);
  });

  it('ignores symlink items located outside all trees', () => {
    const item = createItem(true, 'scripts/link.ts', 'scripts/real.ts', null);
    expect(collectSymlinkOutcomes([item])).toEqual([]);
  });

  it('collects multiple symlink outcomes preserving item order', () => {
    const symlink1 = createItem(true, 'src/a.ts', 'src/target-a.ts', 'src');
    const regular = createItem(false, 'src/b.ts', 'src/b.ts', 'src');
    const symlink2 = createItem(true, 'src/c.ts', 'src/target-c.ts', 'src');

    const outcomes = collectSymlinkOutcomes([symlink1, regular, symlink2]);
    expect(outcomes).toHaveLength(2);
    expect(outcomes[0]?.element).toBe('src/a.ts');
    expect(outcomes[1]?.element).toBe('src/c.ts');
  });
});
