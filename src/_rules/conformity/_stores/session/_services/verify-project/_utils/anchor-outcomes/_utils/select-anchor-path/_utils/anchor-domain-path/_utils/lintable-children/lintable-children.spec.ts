import { describe, expect, it } from 'vitest';

import type {
  TInventory,
  TInventoryItem,
} from '../../../../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { lintableChildren } from './lintable-children.util.js';

const item = (
  id: number,
  path: string,
  kind: TInventoryItem['kind'],
  parentId: null | number
): TInventoryItem => ({
  depth: 1,
  id,
  isSymlink: false,
  kind,
  parentId,
  path,
  preorderEnd: id,
  preorderStart: id,
  realPath: path,
  treeOrigin: 'src',
});

describe('lintableChildren', () => {
  it('returns lintable files of one parent in ordinal order', () => {
    const later = item(1, 'src/b.ts', 'file', 0);
    const earlier = item(2, 'src/a.ts', 'file', 0);
    const asset = item(3, 'src/logo.png', 'file', 0);
    const inventory: TInventory = {
      items: [item(0, 'src', 'directory', null), later, earlier, asset],
      pathToId: new Map(),
      realPathToId: new Map(),
    };
    expect(lintableChildren(inventory, 0).map((entry) => entry.path)).toEqual([
      'src/a.ts',
      'src/b.ts',
    ]);
  });
});
