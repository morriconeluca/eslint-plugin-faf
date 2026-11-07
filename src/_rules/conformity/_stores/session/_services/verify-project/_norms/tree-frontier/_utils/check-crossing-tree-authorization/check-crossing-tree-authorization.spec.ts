import { describe, expect, it } from 'vitest';

import type { TExternalCrossing } from '../../../../_verify-project@shared/_types/_compounds/external-crossing.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { checkCrossingTreeAuthorization } from './check-crossing-tree-authorization.util.js';

const makeCrossing = (
  sourcePath: string,
  destinationPath: string,
  chain: readonly string[] = [sourcePath, 'ext.ts', destinationPath]
): TExternalCrossing => ({
  chain,
  destinationPath,
  importIndex: 0,
  position: { column: 1, line: 2 },
  sourcePath,
  specifier: './ext.js',
});

const buildInventory = (
  entries: readonly {
    readonly path: string;
    readonly treeOrigin: null | string;
  }[]
): TInventory => {
  const items: TInventoryItem[] = [];
  const pathToId = new Map<string, number>();
  const realPathToId = new Map<string, number>();

  for (const [index, entry] of entries.entries()) {
    const item: TInventoryItem = {
      depth: 1,
      id: index,
      isSymlink: false,
      kind: 'file',
      parentId: null,
      path: entry.path,
      preorderEnd: index,
      preorderStart: index,
      realPath: `/repo/${entry.path}`,
      treeOrigin: entry.treeOrigin,
    };
    items.push(item);
    pathToId.set(entry.path, index);
    realPathToId.set(item.realPath, index);
  }

  return { items, pathToId, realPathToId };
};

describe('checkCrossingTreeAuthorization', () => {
  it('returns undefined when source is missing from inventory', () => {
    const inventory = buildInventory([{ path: 'b/dest.ts', treeOrigin: 'b' }]);
    const crossing = makeCrossing('a/source.ts', 'b/dest.ts');
    const result = checkCrossingTreeAuthorization(
      crossing,
      inventory,
      new Set()
    );
    expect(result).toBeUndefined();
  });

  it('returns undefined when source treeOrigin is null', () => {
    const inventory = buildInventory([
      { path: 'external.ts', treeOrigin: null },
      { path: 'b/dest.ts', treeOrigin: 'b' },
    ]);
    const crossing = makeCrossing('external.ts', 'b/dest.ts');
    const result = checkCrossingTreeAuthorization(
      crossing,
      inventory,
      new Set()
    );
    expect(result).toBeUndefined();
  });

  it('returns undefined when source item is missing from items list', () => {
    const inventory: TInventory = {
      items: [],
      pathToId: new Map([['a/source.ts', 0]]),
      realPathToId: new Map(),
    };
    const crossing = makeCrossing('a/source.ts', 'b/dest.ts');
    const result = checkCrossingTreeAuthorization(
      crossing,
      inventory,
      new Set()
    );
    expect(result).toBeUndefined();
  });

  it('returns undefined when destination is missing from inventory', () => {
    const inventory = buildInventory([
      { path: 'a/source.ts', treeOrigin: 'a' },
    ]);
    const crossing = makeCrossing('a/source.ts', 'b/dest.ts');
    const result = checkCrossingTreeAuthorization(
      crossing,
      inventory,
      new Set()
    );
    expect(result).toBeUndefined();
  });

  it('returns undefined when destination treeOrigin is null', () => {
    const inventory = buildInventory([
      { path: 'a/source.ts', treeOrigin: 'a' },
      { path: 'external.ts', treeOrigin: null },
    ]);
    const crossing = makeCrossing('a/source.ts', 'external.ts');
    const result = checkCrossingTreeAuthorization(
      crossing,
      inventory,
      new Set()
    );
    expect(result).toBeUndefined();
  });

  it('returns undefined when destination item is missing from items list', () => {
    const inventory: TInventory = {
      items: [
        {
          depth: 1,
          id: 0,
          isSymlink: false,
          kind: 'file',
          parentId: null,
          path: 'a/source.ts',
          preorderEnd: 0,
          preorderStart: 0,
          realPath: '/repo/a/source.ts',
          treeOrigin: 'a',
        },
      ],
      pathToId: new Map([
        ['a/source.ts', 0],
        ['b/dest.ts', 1],
      ]),
      realPathToId: new Map(),
    };
    const crossing = makeCrossing('a/source.ts', 'b/dest.ts');
    const result = checkCrossingTreeAuthorization(
      crossing,
      inventory,
      new Set()
    );
    expect(result).toBeUndefined();
  });

  it('returns undefined when source and destination are in the same tree', () => {
    const inventory = buildInventory([
      { path: 'a/source.ts', treeOrigin: 'a' },
      { path: 'a/dest.ts', treeOrigin: 'a' },
    ]);
    const crossing = makeCrossing('a/source.ts', 'a/dest.ts');
    const result = checkCrossingTreeAuthorization(
      crossing,
      inventory,
      new Set()
    );
    expect(result).toBeUndefined();
  });

  it('returns undefined when crossing between different trees is authorized', () => {
    const inventory = buildInventory([
      { path: 'a/source.ts', treeOrigin: 'a' },
      { path: 'b/dest.ts', treeOrigin: 'b' },
    ]);
    const crossing = makeCrossing('a/source.ts', 'b/dest.ts');
    const result = checkCrossingTreeAuthorization(
      crossing,
      inventory,
      new Set(['a\0b'])
    );
    expect(result).toBeUndefined();
  });

  it('reports tree-authorization with chain when crossing is unauthorized', () => {
    const inventory = buildInventory([
      { path: 'a/source.ts', treeOrigin: 'a' },
      { path: 'b/dest.ts', treeOrigin: 'b' },
    ]);
    const chain = ['a/source.ts', 'ext1.ts', 'ext2.ts', 'b/dest.ts'] as const;
    const crossing = makeCrossing('a/source.ts', 'b/dest.ts', chain);
    const result = checkCrossingTreeAuthorization(
      crossing,
      inventory,
      new Set()
    );
    expect(result).toBeDefined();
    expect(result?.constraint).toBe('dependency/tree-authorization');
    expect(result?.from).toBe('a/source.ts');
    expect(result?.to).toBe('b/dest.ts');
    expect(result?.chain).toEqual(chain);
    expect(result?.specifier).toBe('./ext.js');
    expect(result?.importIndex).toBe(0);
    expect(result?.position).toEqual({ column: 1, line: 2 });
  });
});
