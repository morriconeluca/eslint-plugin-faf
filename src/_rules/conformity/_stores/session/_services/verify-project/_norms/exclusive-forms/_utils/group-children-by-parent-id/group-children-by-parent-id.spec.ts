import { describe, expect, it } from 'vitest';

import type { TInventoryItem } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { groupChildrenByParentId } from './index.js';

const createItem = (
  id: number,
  parentId: null | number,
  path: string
): TInventoryItem => ({
  depth: 1,
  id,
  isSymlink: false,
  kind: 'directory',
  parentId,
  path,
  preorderEnd: id,
  preorderStart: id,
  realPath: path,
  treeOrigin: 'src',
});

describe('groupChildrenByParentId', () => {
  it('returns an empty map for empty items', () => {
    expect(groupChildrenByParentId([])).toEqual(new Map());
  });

  it('ignores root items with null parentId', () => {
    const root = createItem(0, null, 'src');
    expect(groupChildrenByParentId([root])).toEqual(new Map());
  });

  it('groups items by their parentId into lists of siblings', () => {
    const root = createItem(0, null, 'src');
    const child1 = createItem(1, 0, 'src/_types');
    const child2 = createItem(2, 0, 'src/_utils');
    const grandChild = createItem(3, 1, 'src/_types/item.type.ts');

    const result = groupChildrenByParentId([root, child1, child2, grandChild]);
    expect(result.get(0)).toEqual([child1, child2]);
    expect(result.get(1)).toEqual([grandChild]);
    expect(result.get(2)).toBeUndefined();
  });
});
