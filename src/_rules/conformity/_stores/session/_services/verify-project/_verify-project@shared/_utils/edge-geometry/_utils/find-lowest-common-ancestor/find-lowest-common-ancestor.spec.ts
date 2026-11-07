import { describe, expect, it } from 'vitest';

import type { TInventoryItem } from '../../../../_types/_primitives/inventory.type.js';

import { findLowestCommonAncestor } from './find-lowest-common-ancestor.util.js';

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

describe('findLowestCommonAncestor', () => {
  it('returns index of common ancestor in parallel chains', () => {
    const root = createItem({
      depth: 0,
      id: 0,
      kind: 'directory',
      parentId: null,
      path: 'src',
      preorderEnd: 3,
      preorderStart: 0,
    });
    const directory = createItem({
      depth: 1,
      id: 1,
      kind: 'directory',
      parentId: 0,
      path: 'src/components',
      preorderEnd: 2,
      preorderStart: 1,
    });
    const fileA = createItem({
      depth: 2,
      id: 2,
      parentId: 1,
      path: 'src/components/a.ts',
      preorderEnd: 1,
      preorderStart: 1,
    });
    const fileB = createItem({
      depth: 2,
      id: 3,
      parentId: 1,
      path: 'src/components/b.ts',
      preorderEnd: 2,
      preorderStart: 2,
    });

    const index = findLowestCommonAncestor(
      [root, directory, fileA],
      [root, directory, fileB]
    );
    expect(index).toBe(1);
  });

  it('returns -1 when root items do not match or arrays are empty', () => {
    const rootA = createItem({
      depth: 0,
      id: 0,
      kind: 'directory',
      parentId: null,
      path: 'src',
      preorderEnd: 0,
      preorderStart: 0,
    });
    const rootB = createItem({
      depth: 0,
      id: 1,
      kind: 'directory',
      parentId: null,
      path: 'lib',
      preorderEnd: 1,
      preorderStart: 1,
    });

    expect(findLowestCommonAncestor([], [])).toBe(-1);
    expect(findLowestCommonAncestor([rootA], [rootB])).toBe(-1);
  });
});
