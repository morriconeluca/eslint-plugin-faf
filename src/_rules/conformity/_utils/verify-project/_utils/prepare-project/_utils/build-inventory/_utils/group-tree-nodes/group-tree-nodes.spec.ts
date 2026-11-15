import { describe, expect, it } from 'vitest';

import type { TInProgressInventoryEntry } from '../../_build-inventory@shared/_types/build-inventory.type.js';

import { groupTreeNodes } from './group-tree-nodes.util.js';

const inventoryEntry = (
  path: string,
  treeOrigin: string,
  kind: 'directory' | 'file'
): TInProgressInventoryEntry => ({
  isSymlink: false,
  kind,
  path,
  realPath: path,
  treeOrigin,
});

const groupOrderedEntries = (
  orderedRoots: readonly string[],
  orderedChildren: readonly string[]
) => {
  const entries: [string, TInProgressInventoryEntry][] = [
    ...orderedRoots.map((path): [string, TInProgressInventoryEntry] => [
      path,
      inventoryEntry(path, path, 'directory'),
    ]),
    ['src', inventoryEntry('src', 'src', 'directory')],
    ...orderedChildren.map((path): [string, TInProgressInventoryEntry] => [
      path,
      inventoryEntry(path, 'src', 'file'),
    ]),
  ];
  return groupTreeNodes(new Map(entries));
};

describe('groupTreeNodes', () => {
  it('groups items into root nodes and sorted children lists', () => {
    const map = new Map<string, TInProgressInventoryEntry>([
      [
        'src',
        {
          isSymlink: false,
          kind: 'directory',
          path: 'src',
          realPath: 'src',
          treeOrigin: 'src',
        },
      ],
      [
        'src/alpha.ts',
        {
          isSymlink: false,
          kind: 'file',
          path: 'src/alpha.ts',
          realPath: 'src/alpha.ts',
          treeOrigin: 'src',
        },
      ],
      [
        'src/zeta.ts',
        {
          isSymlink: false,
          kind: 'file',
          path: 'src/zeta.ts',
          realPath: 'src/zeta.ts',
          treeOrigin: 'src',
        },
      ],
    ]);

    const result = groupTreeNodes(map);
    expect(result.roots).toEqual(['src']);
    expect(result.childrenMap.get('src')).toEqual([
      'src/alpha.ts',
      'src/zeta.ts',
    ]);
  });

  it('handles top-level child with no slash under dot origin', () => {
    const map = new Map<string, TInProgressInventoryEntry>([
      [
        '.',
        {
          isSymlink: false,
          kind: 'directory',
          path: '.',
          realPath: '.',
          treeOrigin: '.',
        },
      ],
      [
        'root.ts',
        {
          isSymlink: false,
          kind: 'file',
          path: 'root.ts',
          realPath: 'root.ts',
          treeOrigin: '.',
        },
      ],
    ]);

    const result = groupTreeNodes(map);
    expect(result.roots).toEqual(['.']);
    expect(result.childrenMap.get('.')).toEqual(['root.ts']);
  });

  it('sorts multiple roots lexicographically', () => {
    const map = new Map<string, TInProgressInventoryEntry>([
      [
        'apps',
        {
          isSymlink: false,
          kind: 'directory',
          path: 'apps',
          realPath: 'apps',
          treeOrigin: 'apps',
        },
      ],
      [
        'libs',
        {
          isSymlink: false,
          kind: 'directory',
          path: 'libs',
          realPath: 'libs',
          treeOrigin: 'libs',
        },
      ],
    ]);

    const result = groupTreeNodes(map);
    expect(result.roots).toEqual(['apps', 'libs']);
  });

  it('orders roots and child names by UTF-16 code units regardless of map order', () => {
    const roots = ['btree', 'Btree', '_tree', '@tree', '[tree]'];
    const children = [
      'src/b.ts',
      'src/B.ts',
      'src/_a.ts',
      'src/@x.ts',
      'src/[id].ts',
    ];
    const forward = groupOrderedEntries(roots, children);
    const reversedRoots = [...roots];
    const reversedChildren = [...children];
    reversedRoots.reverse();
    reversedChildren.reverse();
    const backward = groupOrderedEntries(reversedRoots, reversedChildren);

    expect(forward.roots).toEqual([
      '@tree',
      'Btree',
      '[tree]',
      '_tree',
      'btree',
      'src',
    ]);
    expect(forward.childrenMap.get('src')).toEqual([
      'src/@x.ts',
      'src/B.ts',
      'src/[id].ts',
      'src/_a.ts',
      'src/b.ts',
    ]);
    expect(backward).toEqual(forward);
  });
});
