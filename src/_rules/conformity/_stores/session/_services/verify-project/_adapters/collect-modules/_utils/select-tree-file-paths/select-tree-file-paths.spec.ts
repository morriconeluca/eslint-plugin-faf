import { describe, expect, it } from 'vitest';

import type { TInventoryItem } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { selectTreeFilePaths } from './select-tree-file-paths.util.js';

const item = (
  path: string,
  kind: TInventoryItem['kind'],
  treeOrigin: null | string
): TInventoryItem => ({
  depth: 1,
  id: 0,
  isSymlink: false,
  kind,
  parentId: null,
  path,
  preorderEnd: 1,
  preorderStart: 0,
  realPath: path,
  treeOrigin,
});

describe('selectTreeFilePaths', () => {
  it('returns sorted unique POSIX paths of Tree files only', () => {
    const inventory = {
      items: [
        item('src/z.ts', 'file', 'src'),
        item('src', 'directory', 'src'),
        item('outside/a.ts', 'file', null),
        item('src\\b.ts', 'file', 'src'),
        item('src/z.ts', 'file', 'src'),
        item('src/a.ts', 'file', 'src'),
      ],
      pathToId: new Map<string, number>(),
      realPathToId: new Map<string, number>(),
    };

    expect(selectTreeFilePaths(inventory)).toEqual([
      'src/a.ts',
      'src/b.ts',
      'src/z.ts',
    ]);
  });
});
