import { describe, expect, it } from 'vitest';

import type {
  TInventory,
  TInventoryItem,
} from '../../_types/inventory.type.js';

import { lowestCommonAncestor } from './index.js';

const createItem = (
  id: number,
  parentId: null | number,
  depth: number,
  treeOrigin: null | string = 'src'
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
  treeOrigin,
});

const createInventory = (items: readonly TInventoryItem[]): TInventory => {
  const pathToId = new Map<string, number>();
  const realPathToId = new Map<string, number>();
  for (const item of items) {
    pathToId.set(item.path, item.id);
    realPathToId.set(item.realPath, item.id);
  }
  return { items, pathToId, realPathToId };
};

describe('lowestCommonAncestor', () => {
  it('returns the item itself when itemA and itemB are identical in the same tree', () => {
    const item = createItem(0, null, 0);
    const inventory = createInventory([item]);
    expect(lowestCommonAncestor(item, item, inventory)).toBe(item);
  });

  it('returns null when single item evaluated with itself has null treeOrigin', () => {
    const item = createItem(0, null, 0, null);
    const inventory = createInventory([item]);
    expect(lowestCommonAncestor(item, item, inventory)).toBeNull();
  });

  it('returns null when items with shared parent in inventory belong to different tree origins', () => {
    const sharedParent = createItem(0, null, 0, 'shared');
    const itemA = createItem(1, 0, 1, 'src');
    const itemB = createItem(2, 0, 1, 'packages/lib');
    const inventory = createInventory([sharedParent, itemA, itemB]);
    expect(lowestCommonAncestor(itemA, itemB, inventory)).toBeNull();
  });

  it('returns null when items with shared parent both have null treeOrigin', () => {
    const sharedParent = createItem(0, null, 0, null);
    const itemA = createItem(1, 0, 1, null);
    const itemB = createItem(2, 0, 1, null);
    const inventory = createInventory([sharedParent, itemA, itemB]);
    expect(lowestCommonAncestor(itemA, itemB, inventory)).toBeNull();
  });

  it('returns null when itemA has a null treeOrigin and itemB has a valid treeOrigin even with shared parent', () => {
    const sharedParent = createItem(0, null, 0, 'src');
    const itemA = createItem(1, 0, 1, null);
    const itemB = createItem(2, 0, 1, 'src');
    const inventory = createInventory([sharedParent, itemA, itemB]);
    expect(lowestCommonAncestor(itemA, itemB, inventory)).toBeNull();
  });

  it('returns null when itemB has a null treeOrigin and itemA has a valid treeOrigin even with shared parent', () => {
    const sharedParent = createItem(0, null, 0, 'src');
    const itemA = createItem(1, 0, 1, 'src');
    const itemB = createItem(2, 0, 1, null);
    const inventory = createInventory([sharedParent, itemA, itemB]);
    expect(lowestCommonAncestor(itemA, itemB, inventory)).toBeNull();
  });

  it('finds ancestor when itemA is deeper than itemB and itemB is the ancestor', () => {
    const root = createItem(0, null, 0);
    const child = createItem(1, 0, 1);
    const grandchild = createItem(2, 1, 2);
    const inventory = createInventory([root, child, grandchild]);

    expect(lowestCommonAncestor(grandchild, child, inventory)).toBe(child);
  });

  it('finds ancestor when itemB is deeper than itemA and itemA is the ancestor', () => {
    const root = createItem(0, null, 0);
    const child = createItem(1, 0, 1);
    const grandchild = createItem(2, 1, 2);
    const inventory = createInventory([root, child, grandchild]);

    expect(lowestCommonAncestor(root, grandchild, inventory)).toBe(root);
  });

  it('finds common parent of two sibling items at the same depth', () => {
    const root = createItem(0, null, 0);
    const childA = createItem(1, 0, 1);
    const childB = createItem(2, 0, 1);
    const inventory = createInventory([root, childA, childB]);

    expect(lowestCommonAncestor(childA, childB, inventory)).toBe(root);
  });

  it('finds lowest common ancestor for cousins at different depths', () => {
    const root = createItem(0, null, 0);
    const branchA = createItem(1, 0, 1);
    const branchB = createItem(2, 0, 1);
    const leafA = createItem(3, 1, 2);
    const subBranchB = createItem(4, 2, 2);
    const leafB = createItem(5, 4, 3);
    const inventory = createInventory([
      root,
      branchA,
      branchB,
      leafA,
      subBranchB,
      leafB,
    ]);

    expect(lowestCommonAncestor(leafA, leafB, inventory)).toBe(root);
  });

  it('returns null when ascendToDepth for itemA returns null due to broken parent', () => {
    const brokenGrandchild = createItem(2, 999, 2);
    const sibling = createItem(1, 0, 1);
    const root = createItem(0, null, 0);
    const inventory = createInventory([root, sibling, brokenGrandchild]);

    expect(
      lowestCommonAncestor(brokenGrandchild, sibling, inventory)
    ).toBeNull();
  });

  it('returns null when ascendToDepth for itemB returns null due to broken parent', () => {
    const brokenGrandchild = createItem(2, 999, 2);
    const sibling = createItem(1, 0, 1);
    const root = createItem(0, null, 0);
    const inventory = createInventory([root, sibling, brokenGrandchild]);

    expect(
      lowestCommonAncestor(sibling, brokenGrandchild, inventory)
    ).toBeNull();
  });
});
