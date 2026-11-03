import { describe, expect, it } from 'vitest';

import type { TInventoryItem } from '../../../../../../../../../_inventory/_types/inventory.type.js';

import { isTreeFilePath } from './index.js';

const item = (
  id: number,
  kind: TInventoryItem['kind'],
  treeOrigin: null | string
): TInventoryItem => ({
  depth: 1,
  id,
  isSymlink: false,
  kind,
  parentId: null,
  path: 'src/file.ts',
  preorderEnd: 1,
  preorderStart: 0,
  realPath: 'src/file.ts',
  treeOrigin,
});

describe('isTreeFilePath', () => {
  it('recognizes an inventoried Tree file', () => {
    const inventory = {
      items: [item(0, 'file', 'src')],
      pathToId: new Map([['src/file.ts', 0]]),
      realPathToId: new Map<string, number>(),
    };
    expect(isTreeFilePath(inventory, 'src/file.ts')).toBe(true);
  });

  it('rejects a missing path, a dangling id, a directory, and a file outside every Tree', () => {
    const inventory = {
      items: [item(0, 'directory', 'src'), item(1, 'file', null)],
      pathToId: new Map([
        ['outside/a.ts', 1],
        ['src', 0],
        ['src/missing-slot.ts', 9],
      ]),
      realPathToId: new Map<string, number>(),
    };
    expect(isTreeFilePath(inventory, 'absent.ts')).toBe(false);
    expect(isTreeFilePath(inventory, 'src/missing-slot.ts')).toBe(false);
    expect(isTreeFilePath(inventory, 'src')).toBe(false);
    expect(isTreeFilePath(inventory, 'outside/a.ts')).toBe(false);
  });
});
