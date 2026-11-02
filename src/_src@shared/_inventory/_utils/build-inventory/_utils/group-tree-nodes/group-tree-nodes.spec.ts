import { describe, expect, it } from 'vitest';

import type { TInProgressInventoryEntry } from '../../build-inventory.type.js';

import { groupTreeNodes } from './index.js';

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
});
