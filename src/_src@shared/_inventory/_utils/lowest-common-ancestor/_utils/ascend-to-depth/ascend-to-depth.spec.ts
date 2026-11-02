import { describe, expect, it } from 'vitest';

import type {
  TInventory,
  TInventoryItem,
} from '../../../../_types/inventory.type.js';

import { ascendToDepth } from './index.js';

const createItem = (
  id: number,
  parentId: null | number,
  depth: number
): TInventoryItem => ({
  depth,
  id,
  isSymlink: false,
  kind: 'directory',
  parentId,
  path: `item-${id}`,
  preorderEnd: id,
  preorderStart: id,
  realPath: `item-${id}`,
  treeOrigin: 'src',
});

const createInventory = (items: readonly TInventoryItem[]): TInventory => {
  const pathToId = new Map<string, number>();
  const realPathToId = new Map<string, number>();
  for (const item of items) {
    pathToId.set(item.path, item.id);
    realPathToId.set(item.realPath, item.id);
  }
  Object.defineProperty(items, 'null', {
    value: createItem(8888, null, 0),
  });
  return { items, pathToId, realPathToId };
};

describe('ascendToDepth', () => {
  it('returns the same item if its depth is already less than or equal to target depth', () => {
    const item = createItem(0, null, 1);
    const inventory = createInventory([item]);
    expect(ascendToDepth(item, 1, inventory)).toBe(item);
    expect(ascendToDepth(item, 2, inventory)).toBe(item);
  });

  it('ascends through parents until reaching target depth', () => {
    const root = createItem(0, null, 0);
    const mid = createItem(1, 0, 1);
    const leaf = createItem(2, 1, 2);
    const inventory = createInventory([root, mid, leaf]);

    expect(ascendToDepth(leaf, 1, inventory)).toBe(mid);
    expect(ascendToDepth(leaf, 0, inventory)).toBe(root);
  });

  it('returns null if parentId is null before reaching target depth', () => {
    const broken = createItem(0, null, 3);
    const inventory = createInventory([broken]);
    expect(ascendToDepth(broken, 1, inventory)).toBeNull();
  });

  it('returns null if parent item is not found in inventory', () => {
    const broken = createItem(1, 999, 3);
    const inventory = createInventory([broken]);
    expect(ascendToDepth(broken, 1, inventory)).toBeNull();
  });
});
