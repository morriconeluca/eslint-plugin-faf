import { describe, expect, it } from 'vitest';

import type {
  TInventory,
  TInventoryItem,
} from '../../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { findInventoryItem } from './find-inventory-item.util.js';

const item = (id: number, path: string): TInventoryItem => ({
  depth: 0,
  id,
  isSymlink: false,
  kind: 'file',
  parentId: null,
  path,
  preorderEnd: id,
  preorderStart: id,
  realPath: path,
  treeOrigin: 'src',
});

const inventory: TInventory = {
  items: [item(0, 'src/a.ts')],
  pathToId: new Map([['src/a.ts', 0]]),
  realPathToId: new Map([['src/a.ts', 0]]),
};

describe('findInventoryItem', () => {
  it('finds a relative path, an absolute path, and a missing path', () => {
    expect(findInventoryItem(inventory, '/repo', 'src/a.ts')?.path).toBe(
      'src/a.ts'
    );
    expect(findInventoryItem(inventory, '/repo', '/repo/src/a.ts')?.id).toBe(0);
    expect(findInventoryItem(inventory, '/repo', 'src\\a.ts')?.id).toBe(0);
    expect(
      findInventoryItem(inventory, '/repo', 'src/missing.ts')
    ).toBeUndefined();
    expect(
      findInventoryItem(inventory, '/repo', '/repo/src/missing.ts')
    ).toBeUndefined();
  });

  it('does not resolve a relative miss against the current working directory', () => {
    expect(
      findInventoryItem(inventory, process.cwd(), './src/a.ts')
    ).toBeUndefined();
  });
});
