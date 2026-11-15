import { describe, expect, it } from 'vitest';

import type {
  TInventory,
  TInventoryItem,
} from '../../../../../../_verify-project@shared/_types/verification-model.type.js';

import { collectIndividualForeignNodes } from './collect-individual-foreign-nodes.util.js';

const buildItem = (
  id: number,
  path: string,
  kind: 'directory' | 'file',
  preorderStart: number,
  preorderEnd: number
): TInventoryItem => ({
  depth: 1,
  id,
  isSymlink: false,
  kind,
  parentId: null,
  path,
  preorderEnd,
  preorderStart,
  realPath: `/project/${path}`,
  treeOrigin: 'src',
});

describe('collectIndividualForeignNodes', () => {
  it('collects only files descending from the tree origin', () => {
    const origin = buildItem(0, 'src', 'directory', 0, 2);
    const insideDirectory = buildItem(1, 'src/_notes', 'directory', 1, 2);
    const insideFile = buildItem(2, 'src/env.d.ts', 'file', 2, 2);
    const outsideFile = buildItem(3, 'docs/readme.md', 'file', 3, 3);
    const items = [origin, insideDirectory, insideFile, outsideFile];
    const inventory: TInventory = {
      items,
      pathToId: new Map(items.map((item) => [item.path, item.id])),
      realPathToId: new Map(items.map((item) => [item.realPath, item.id])),
    };

    const collected = collectIndividualForeignNodes(inventory, origin, [
      'src/missing.ts',
      'src/_notes',
      'docs/readme.md',
      'src/env.d.ts',
    ]);

    expect([...collected.nodeItemIds]).toEqual([2]);
    expect([...collected.nodePaths]).toEqual(['src/env.d.ts']);
  });
});
