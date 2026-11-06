import { describe, expect, it } from 'vitest';

import type {
  TInventory,
  TInventoryItem,
} from '../../../../_types/_primitives/inventory.type.js';

import { collectAncestors } from './index.js';

const createItem = (parameters: {
  depth: number;
  id: number;
  kind?: 'directory' | 'file';
  parentId: null | number;
  path: string;
  preorderEnd: number;
  preorderStart: number;
}): TInventoryItem => ({
  depth: parameters.depth,
  id: parameters.id,
  isSymlink: false,
  kind: parameters.kind ?? 'file',
  parentId: parameters.parentId,
  path: parameters.path,
  preorderEnd: parameters.preorderEnd,
  preorderStart: parameters.preorderStart,
  realPath: parameters.path,
  treeOrigin: 'src',
});

const buildInventory = (items: readonly TInventoryItem[]): TInventory => {
  const pathToId = new Map<string, number>();
  const realPathToId = new Map<string, number>();
  for (const item of items) {
    pathToId.set(item.path, item.id);
    realPathToId.set(item.realPath, item.id);
  }
  return { items, pathToId, realPathToId };
};

describe('collectAncestors', () => {
  it('collects ascending chain from root to target item', () => {
    const root = createItem({
      depth: 0,
      id: 0,
      kind: 'directory',
      parentId: null,
      path: 'src',
      preorderEnd: 2,
      preorderStart: 0,
    });
    const directory = createItem({
      depth: 1,
      id: 1,
      kind: 'directory',
      parentId: 0,
      path: 'src/utils',
      preorderEnd: 2,
      preorderStart: 1,
    });
    const file = createItem({
      depth: 2,
      id: 2,
      parentId: 1,
      path: 'src/utils/file.ts',
      preorderEnd: 2,
      preorderStart: 2,
    });
    const inventory = buildInventory([root, directory, file]);

    const chain = collectAncestors(file, inventory);
    expect(chain.map((item) => item.path)).toEqual([
      'src',
      'src/utils',
      'src/utils/file.ts',
    ]);
  });
});
