import { describe, expect, it } from 'vitest';

import type {
  TInventory,
  TInventoryItem,
} from '../../../../../../../../../../../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { isPhysicalDirectChild } from './is-physical-direct-child.util.js';

function item(id: number, parentId: null | number): TInventoryItem {
  return {
    depth: 1,
    id,
    isSymlink: false,
    kind: 'directory',
    parentId,
    path: `p${id}`,
    preorderEnd: id,
    preorderStart: id,
    realPath: `/p${id}`,
    treeOrigin: 'src',
  };
}

describe('isPhysicalDirectChild', () => {
  it('accepts a missing child and rejects a present child whose parent is missing', () => {
    const missingParent: TInventory = {
      items: [item(0, null)],
      pathToId: new Map([['src/app', 0]]),
      realPathToId: new Map(),
    };
    expect(isPhysicalDirectChild(missingParent, 'missing', 'src')).toBe(true);
    expect(isPhysicalDirectChild(missingParent, 'src/app', 'src')).toBe(false);
  });

  it('accepts a dangling child id and rejects a dangling parent id', () => {
    const danglingChild: TInventory = {
      items: [],
      pathToId: new Map([
        ['src', 0],
        ['src/app', 1],
      ]),
      realPathToId: new Map(),
    };
    const danglingParent: TInventory = {
      items: [item(0, null)],
      pathToId: new Map([
        ['src', 3],
        ['src/app', 0],
      ]),
      realPathToId: new Map(),
    };
    expect(isPhysicalDirectChild(danglingChild, 'src/app', 'src')).toBe(true);
    expect(isPhysicalDirectChild(danglingParent, 'src/app', 'src')).toBe(false);
  });

  it('compares the stored parent id when both items exist', () => {
    const inventory: TInventory = {
      items: [item(0, null), item(1, 0), item(2, 9)],
      pathToId: new Map([
        ['src', 0],
        ['src/app', 1],
        ['src/other', 2],
      ]),
      realPathToId: new Map(),
    };
    expect(isPhysicalDirectChild(inventory, 'src/app', 'src')).toBe(true);
    expect(isPhysicalDirectChild(inventory, 'src/other', 'src')).toBe(false);
  });
});
