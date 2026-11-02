import { describe, expect, it } from 'vitest';

import type {
  TInventory,
  TInventoryItem,
} from '../../../../_types/inventory.type.js';

import { climbToCommonAncestor } from './index.js';

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

describe('climbToCommonAncestor', () => {
  it('returns null when startA is null', () => {
    const item = createItem(0, null, 0);
    const inventory = createInventory([item]);
    expect(climbToCommonAncestor(null, item, inventory)).toBeNull();
  });

  it('returns null when startB is null', () => {
    const item = createItem(0, null, 0);
    const inventory = createInventory([item]);
    expect(climbToCommonAncestor(item, null, inventory)).toBeNull();
  });

  it('returns the item immediately when startA and startB already have identical id', () => {
    const item = createItem(0, null, 0);
    const inventory = createInventory([item]);
    expect(climbToCommonAncestor(item, item, inventory)).toBe(item);
  });

  it('climbs until finding the common ancestor of two sibling items', () => {
    const root = createItem(0, null, 0);
    const childA = createItem(1, 0, 1);
    const childB = createItem(2, 0, 1);
    const inventory = createInventory([root, childA, childB]);

    expect(climbToCommonAncestor(childA, childB, inventory)).toBe(root);
  });

  it('returns null if startA has null parentId during climb', () => {
    const rootA = createItem(0, null, 1);
    const rootB = createItem(1, 2, 1);
    const ancestorB = createItem(2, null, 0);
    const inventory = createInventory([rootA, rootB, ancestorB]);

    expect(climbToCommonAncestor(rootA, rootB, inventory)).toBeNull();
  });

  it('returns null if startB has null parentId during climb', () => {
    const rootA = createItem(0, 2, 1);
    const rootB = createItem(1, null, 1);
    const ancestorA = createItem(2, null, 0);
    const inventory = createInventory([rootA, rootB, ancestorA]);

    expect(climbToCommonAncestor(rootA, rootB, inventory)).toBeNull();
  });

  it('returns null if startA parent item is missing in inventory', () => {
    const childA = createItem(1, 999, 1);
    const childB = createItem(2, 0, 1);
    const root = createItem(0, null, 0);
    const inventory = createInventory([root, childA, childB]);

    expect(climbToCommonAncestor(childA, childB, inventory)).toBeNull();
  });

  it('returns null if startB parent item is missing in inventory', () => {
    const childA = createItem(1, 0, 1);
    const childB = createItem(2, 999, 1);
    const root = createItem(0, null, 0);
    const inventory = createInventory([root, childA, childB]);

    expect(climbToCommonAncestor(childA, childB, inventory)).toBeNull();
  });
});
