import { describe, expect, it } from 'vitest';

import type {
  TInventory,
  TInventoryItem,
} from '../../../../../../../../../../../../../_verify-project@shared/_types/verification-model.type.js';

import { isDirectChildDirectory } from './is-direct-child-directory.util.js';

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

describe('isDirectChildDirectory', () => {
  it('checks string segment boundaries under dot root and named parents', () => {
    const empty: TInventory = {
      items: [],
      pathToId: new Map(),
      realPathToId: new Map(),
    };
    expect(isDirectChildDirectory(empty, '', '.')).toBe(false);
    expect(isDirectChildDirectory(empty, 'src/app', '.')).toBe(false);
    expect(isDirectChildDirectory(empty, 'src', '.')).toBe(true);
    expect(isDirectChildDirectory(empty, 'lib', 'src')).toBe(false);
    expect(isDirectChildDirectory(empty, 'src/app/routes', 'src')).toBe(false);
    expect(isDirectChildDirectory(empty, 'src/app', 'src')).toBe(true);
  });

  it('verifies physical parentId matching and missing/dangling inventory cases', () => {
    const missingParent: TInventory = {
      items: [item(0, null)],
      pathToId: new Map([['src/app', 0]]),
      realPathToId: new Map(),
    };
    expect(isDirectChildDirectory(missingParent, 'src/app', 'src')).toBe(false);

    const danglingChild: TInventory = {
      items: [],
      pathToId: new Map([
        ['src', 0],
        ['src/app', 1],
      ]),
      realPathToId: new Map(),
    };
    expect(isDirectChildDirectory(danglingChild, 'src/app', 'src')).toBe(true);

    const danglingParent: TInventory = {
      items: [item(0, null)],
      pathToId: new Map([
        ['src', 3],
        ['src/app', 0],
      ]),
      realPathToId: new Map(),
    };
    expect(isDirectChildDirectory(danglingParent, 'src/app', 'src')).toBe(
      false
    );

    const inventory: TInventory = {
      items: [item(0, null), item(1, 0), item(2, 9)],
      pathToId: new Map([
        ['src', 0],
        ['src/app', 1],
        ['src/other', 2],
      ]),
      realPathToId: new Map(),
    };
    expect(isDirectChildDirectory(inventory, 'src/app', 'src')).toBe(true);
    expect(isDirectChildDirectory(inventory, 'src/other', 'src')).toBe(false);
  });
});
