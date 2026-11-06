import { describe, expect, it } from 'vitest';

import type { TEdgeMetadata } from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { checkEdgeTreeFrontier } from './index.js';

const makeEdge = (
  sourcePath: string,
  destinationPath: string,
  specifier = './target.js'
): TEdgeMetadata => ({
  aliasAlternatives: [],
  aliasUsed: null,
  destinationPath,
  importIndex: 0,
  isTypeOnly: false,
  position: { column: 1, line: 2 },
  sourcePath,
  specifier,
  syntaxKind: 'side-effect-import',
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

describe('checkEdgeTreeFrontier', () => {
  it('returns empty array when destination is missing from inventory', () => {
    const inventory = buildInventory([
      { path: 'a/source.ts', treeOrigin: 'a' },
    ]);
    const edge = makeEdge('a/source.ts', 'b/dest.ts');
    const result = checkEdgeTreeFrontier(
      edge,
      inventory,
      new Set(['b/dest.ts']),
      new Set(['a\0b'])
    );
    expect(result).toEqual([]);
  });

  it('returns empty array when destination has treeOrigin null', () => {
    const inventory = buildInventory([
      { path: 'a/source.ts', treeOrigin: 'a' },
      { path: 'external.ts', treeOrigin: null },
    ]);
    const edge = makeEdge('a/source.ts', 'external.ts');
    const result = checkEdgeTreeFrontier(
      edge,
      inventory,
      new Set(),
      new Set(['a\0b'])
    );
    expect(result).toEqual([]);
  });

  it('returns empty array when destination item is missing from items list', () => {
    const inventory: TInventory = {
      items: [],
      pathToId: new Map([['b/dest.ts', 0]]),
      realPathToId: new Map(),
    };
    const edge = makeEdge('a/source.ts', 'b/dest.ts');
    const result = checkEdgeTreeFrontier(
      edge,
      inventory,
      new Set(),
      new Set(['a\0b'])
    );
    expect(result).toEqual([]);
  });

  it('returns empty array when source and destination are in the same tree', () => {
    const inventory = buildInventory([
      { path: 'a/source.ts', treeOrigin: 'a' },
      { path: 'a/dest.ts', treeOrigin: 'a' },
    ]);
    const edge = makeEdge('a/source.ts', 'a/dest.ts');
    const result = checkEdgeTreeFrontier(edge, inventory, new Set(), new Set());
    expect(result).toEqual([]);
  });

  it('handles external source importing public destination without outcomes', () => {
    const inventory = buildInventory([
      { path: 'external.ts', treeOrigin: null },
      { path: 'b/public.ts', treeOrigin: 'b' },
    ]);
    const edge = makeEdge('external.ts', 'b/public.ts');
    const result = checkEdgeTreeFrontier(
      edge,
      inventory,
      new Set(['b/public.ts']),
      new Set()
    );
    expect(result).toEqual([]);
  });

  it('reports tree-opacity when external source imports unpublished destination', () => {
    const inventory = buildInventory([
      { path: 'external.ts', treeOrigin: null },
      { path: 'b/private.ts', treeOrigin: 'b' },
    ]);
    const edge = makeEdge('external.ts', 'b/private.ts', './b/private.js');
    const result = checkEdgeTreeFrontier(edge, inventory, new Set(), new Set());
    expect(result).toHaveLength(1);
    expect(result[0]?.constraint).toBe('dependency/tree-opacity');
    expect(result[0]?.from).toBe('external.ts');
    expect(result[0]?.to).toBe('b/private.ts');
    expect(result[0]?.specifier).toBe('./b/private.js');
  });

  it('handles source missing from inventory as external file', () => {
    const inventory = buildInventory([
      { path: 'b/private.ts', treeOrigin: 'b' },
    ]);
    const edge = makeEdge('untracked.ts', 'b/private.ts');
    const result = checkEdgeTreeFrontier(edge, inventory, new Set(), new Set());
    expect(result).toHaveLength(1);
    expect(result[0]?.constraint).toBe('dependency/tree-opacity');
  });

  it('returns empty array when inter-tree edge is published and authorized', () => {
    const inventory = buildInventory([
      { path: 'a/source.ts', treeOrigin: 'a' },
      { path: 'b/public.ts', treeOrigin: 'b' },
    ]);
    const edge = makeEdge('a/source.ts', 'b/public.ts');
    const result = checkEdgeTreeFrontier(
      edge,
      inventory,
      new Set(['b/public.ts']),
      new Set(['a\0b'])
    );
    expect(result).toEqual([]);
  });

  it('reports tree-opacity only when inter-tree edge is authorized but unpublished', () => {
    const inventory = buildInventory([
      { path: 'a/source.ts', treeOrigin: 'a' },
      { path: 'b/private.ts', treeOrigin: 'b' },
    ]);
    const edge = makeEdge('a/source.ts', 'b/private.ts');
    const result = checkEdgeTreeFrontier(
      edge,
      inventory,
      new Set(),
      new Set(['a\0b'])
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.constraint).toBe('dependency/tree-opacity');
  });

  it('reports tree-authorization only when inter-tree edge is published but unauthorized', () => {
    const inventory = buildInventory([
      { path: 'a/source.ts', treeOrigin: 'a' },
      { path: 'b/public.ts', treeOrigin: 'b' },
    ]);
    const edge = makeEdge('a/source.ts', 'b/public.ts');
    const result = checkEdgeTreeFrontier(
      edge,
      inventory,
      new Set(['b/public.ts']),
      new Set()
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.constraint).toBe('dependency/tree-authorization');
  });

  it('reports both tree-opacity and tree-authorization conjunctively when inter-tree edge is unpublished and unauthorized', () => {
    const inventory = buildInventory([
      { path: 'a/source.ts', treeOrigin: 'a' },
      { path: 'b/private.ts', treeOrigin: 'b' },
    ]);
    const edge = makeEdge('a/source.ts', 'b/private.ts');
    const result = checkEdgeTreeFrontier(edge, inventory, new Set(), new Set());
    expect(result).toHaveLength(2);
    expect(result[0]?.constraint).toBe('dependency/tree-opacity');
    expect(result[1]?.constraint).toBe('dependency/tree-authorization');
  });
});
