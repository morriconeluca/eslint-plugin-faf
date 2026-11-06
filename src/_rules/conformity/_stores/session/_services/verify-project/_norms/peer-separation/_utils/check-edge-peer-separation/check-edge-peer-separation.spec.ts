import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TLogicalDomainKind,
  TNodeKind,
  TTaxonomyModel,
} from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEdgeMetadata } from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type { THorizontalHierarchies } from '../../../../_verify-project@shared/_types/_compounds/horizontal-hierarchies.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { checkEdgePeerSeparation } from './index.js';

const createEdge = (from: string, to: string): TEdgeMetadata => ({
  aliasAlternatives: [],
  aliasUsed: null,
  destinationPath: to,
  importIndex: 0,
  isTypeOnly: false,
  position: { column: 1, line: 1 },
  sourcePath: from,
  specifier: './target.js',
  syntaxKind: 'named-import',
});

const createClassification = (
  id: number,
  path: string,
  domainKind: null | TLogicalDomainKind,
  nodeKind: null | TNodeKind
): TItemClassification => ({
  domainKind,
  entryKind: domainKind === null ? 'file' : 'directory',
  fragmentInternalRank: null,
  imposedRoleName: null,
  itemId: id,
  nodeKind,
  path,
  relationalQualifications: {
    isParentCategory: false,
    isPathFragment: false,
    isPrivateCategory: false,
    isSubFragment: false,
    isSubLayer: false,
    parentFragmentPath: null,
  },
  role: { kind: 'absent', roleName: null },
});

describe('checkEdgePeerSeparation', () => {
  const emptyHierarchies: THorizontalHierarchies = {
    conflicts: [],
    sets: [],
  };

  it('returns undefined when edge endpoints are in different trees', () => {
    const itemA: TInventoryItem = {
      depth: 1,
      id: 0,
      isSymlink: false,
      kind: 'file',
      parentId: null,
      path: 'treeA/a.ts',
      preorderEnd: 0,
      preorderStart: 0,
      realPath: 'treeA/a.ts',
      treeOrigin: 'treeA',
    };
    const itemB: TInventoryItem = {
      depth: 1,
      id: 1,
      isSymlink: false,
      kind: 'file',
      parentId: null,
      path: 'treeB/b.ts',
      preorderEnd: 1,
      preorderStart: 1,
      realPath: 'treeB/b.ts',
      treeOrigin: 'treeB',
    };
    const inventory: TInventory = {
      items: [itemA, itemB],
      pathToId: new Map([
        ['treeA/a.ts', 0],
        ['treeB/b.ts', 1],
      ]),
      realPathToId: new Map([
        ['treeA/a.ts', 0],
        ['treeB/b.ts', 1],
      ]),
    };
    const taxonomy: TTaxonomyModel = {
      byItemId: new Map([
        [0, createClassification(0, 'treeA/a.ts', null, 'master-node')],
        [1, createClassification(1, 'treeB/b.ts', null, 'master-node')],
      ]),
      byPath: new Map(),
      classifications: [],
    };
    const edge = createEdge('treeA/a.ts', 'treeB/b.ts');
    expect(
      checkEdgePeerSeparation(edge, inventory, taxonomy, emptyHierarchies)
    ).toBeUndefined();
  });

  it('returns undefined when source is the lowest common ancestor', () => {
    const root: TInventoryItem = {
      depth: 0,
      id: 0,
      isSymlink: false,
      kind: 'directory',
      parentId: null,
      path: 'src',
      preorderEnd: 2,
      preorderStart: 0,
      realPath: 'src',
      treeOrigin: 'src',
    };
    const compFile: TInventoryItem = {
      depth: 1,
      id: 1,
      isSymlink: false,
      kind: 'file',
      parentId: 0,
      path: 'src/main.ts',
      preorderEnd: 1,
      preorderStart: 1,
      realPath: 'src/main.ts',
      treeOrigin: 'src',
    };
    const inventory: TInventory = {
      items: [root, compFile],
      pathToId: new Map([
        ['src', 0],
        ['src/main.ts', 1],
      ]),
      realPathToId: new Map(),
    };
    const taxonomy: TTaxonomyModel = {
      byItemId: new Map([
        [0, createClassification(0, 'src', 'root-layer', null)],
        [1, createClassification(1, 'src/main.ts', null, 'category-node')],
      ]),
      byPath: new Map(),
      classifications: [],
    };
    const edge = createEdge('src', 'src/main.ts');
    expect(
      checkEdgePeerSeparation(edge, inventory, taxonomy, emptyHierarchies)
    ).toBeUndefined();
  });

  it('returns undefined when destination is the lowest common ancestor', () => {
    const root: TInventoryItem = {
      depth: 0,
      id: 0,
      isSymlink: false,
      kind: 'directory',
      parentId: null,
      path: 'src',
      preorderEnd: 2,
      preorderStart: 0,
      realPath: 'src',
      treeOrigin: 'src',
    };
    const compFile: TInventoryItem = {
      depth: 1,
      id: 1,
      isSymlink: false,
      kind: 'file',
      parentId: 0,
      path: 'src/main.ts',
      preorderEnd: 1,
      preorderStart: 1,
      realPath: 'src/main.ts',
      treeOrigin: 'src',
    };
    const inventory: TInventory = {
      items: [root, compFile],
      pathToId: new Map([
        ['src', 0],
        ['src/main.ts', 1],
      ]),
      realPathToId: new Map(),
    };
    const taxonomy: TTaxonomyModel = {
      byItemId: new Map([
        [0, createClassification(0, 'src', 'root-layer', null)],
        [1, createClassification(1, 'src/main.ts', null, 'category-node')],
      ]),
      byPath: new Map(),
      classifications: [],
    };
    const edge = createEdge('src/main.ts', 'src');
    expect(
      checkEdgePeerSeparation(edge, inventory, taxonomy, emptyHierarchies)
    ).toBeUndefined();
  });

  it('returns undefined when destination is a fractal branch', () => {
    const root: TInventoryItem = {
      depth: 0,
      id: 0,
      isSymlink: false,
      kind: 'directory',
      parentId: null,
      path: 'src',
      preorderEnd: 4,
      preorderStart: 0,
      realPath: 'src',
      treeOrigin: 'src',
    };
    const compDirectory: TInventoryItem = {
      depth: 1,
      id: 1,
      isSymlink: false,
      kind: 'directory',
      parentId: 0,
      path: 'src/_components',
      preorderEnd: 2,
      preorderStart: 1,
      realPath: 'src/_components',
      treeOrigin: 'src',
    };
    const compFile: TInventoryItem = {
      depth: 2,
      id: 2,
      isSymlink: false,
      kind: 'file',
      parentId: 1,
      path: 'src/_components/comp.ts',
      preorderEnd: 2,
      preorderStart: 2,
      realPath: 'src/_components/comp.ts',
      treeOrigin: 'src',
    };
    const branchDirectory: TInventoryItem = {
      depth: 1,
      id: 3,
      isSymlink: false,
      kind: 'directory',
      parentId: 0,
      path: 'src/_src@shared',
      preorderEnd: 4,
      preorderStart: 3,
      realPath: 'src/_src@shared',
      treeOrigin: 'src',
    };
    const branchFile: TInventoryItem = {
      depth: 2,
      id: 4,
      isSymlink: false,
      kind: 'file',
      parentId: 3,
      path: 'src/_src@shared/shared.ts',
      preorderEnd: 4,
      preorderStart: 4,
      realPath: 'src/_src@shared/shared.ts',
      treeOrigin: 'src',
    };
    const inventory: TInventory = {
      items: [root, compDirectory, compFile, branchDirectory, branchFile],
      pathToId: new Map([
        ['src', 0],
        ['src/_components', 1],
        ['src/_components/comp.ts', 2],
        ['src/_src@shared', 3],
        ['src/_src@shared/shared.ts', 4],
      ]),
      realPathToId: new Map(),
    };
    const taxonomy: TTaxonomyModel = {
      byItemId: new Map([
        [0, createClassification(0, 'src', 'root-layer', null)],
        [1, createClassification(1, 'src/_components', 'category', null)],
        [
          2,
          createClassification(
            2,
            'src/_components/comp.ts',
            null,
            'category-node'
          ),
        ],
        [3, createClassification(3, 'src/_src@shared', 'fractal-branch', null)],
        [
          4,
          createClassification(
            4,
            'src/_src@shared/shared.ts',
            null,
            'category-node'
          ),
        ],
      ]),
      byPath: new Map(),
      classifications: [],
    };
    const edge = createEdge(
      'src/_components/comp.ts',
      'src/_src@shared/shared.ts'
    );
    expect(
      checkEdgePeerSeparation(edge, inventory, taxonomy, emptyHierarchies)
    ).toBeUndefined();
  });

  it('returns outcome when source lateral step is a fractal branch', () => {
    const root: TInventoryItem = {
      depth: 0,
      id: 0,
      isSymlink: false,
      kind: 'directory',
      parentId: null,
      path: 'src',
      preorderEnd: 4,
      preorderStart: 0,
      realPath: 'src',
      treeOrigin: 'src',
    };
    const branchDirectory: TInventoryItem = {
      depth: 1,
      id: 1,
      isSymlink: false,
      kind: 'directory',
      parentId: 0,
      path: 'src/_src@shared',
      preorderEnd: 2,
      preorderStart: 1,
      realPath: 'src/_src@shared',
      treeOrigin: 'src',
    };
    const branchFile: TInventoryItem = {
      depth: 2,
      id: 2,
      isSymlink: false,
      kind: 'file',
      parentId: 1,
      path: 'src/_src@shared/shared.ts',
      preorderEnd: 2,
      preorderStart: 2,
      realPath: 'src/_src@shared/shared.ts',
      treeOrigin: 'src',
    };
    const compDirectory: TInventoryItem = {
      depth: 1,
      id: 3,
      isSymlink: false,
      kind: 'directory',
      parentId: 0,
      path: 'src/_components',
      preorderEnd: 4,
      preorderStart: 3,
      realPath: 'src/_components',
      treeOrigin: 'src',
    };
    const compFile: TInventoryItem = {
      depth: 2,
      id: 4,
      isSymlink: false,
      kind: 'file',
      parentId: 3,
      path: 'src/_components/comp.ts',
      preorderEnd: 4,
      preorderStart: 4,
      realPath: 'src/_components/comp.ts',
      treeOrigin: 'src',
    };
    const inventory: TInventory = {
      items: [root, branchDirectory, branchFile, compDirectory, compFile],
      pathToId: new Map([
        ['src', 0],
        ['src/_components', 3],
        ['src/_components/comp.ts', 4],
        ['src/_src@shared', 1],
        ['src/_src@shared/shared.ts', 2],
      ]),
      realPathToId: new Map(),
    };
    const taxonomy: TTaxonomyModel = {
      byItemId: new Map([
        [0, createClassification(0, 'src', 'root-layer', null)],
        [1, createClassification(1, 'src/_src@shared', 'fractal-branch', null)],
        [
          2,
          createClassification(
            2,
            'src/_src@shared/shared.ts',
            null,
            'category-node'
          ),
        ],
        [3, createClassification(3, 'src/_components', 'category', null)],
        [
          4,
          createClassification(
            4,
            'src/_components/comp.ts',
            null,
            'category-node'
          ),
        ],
      ]),
      byPath: new Map(),
      classifications: [],
    };
    const edge = createEdge(
      'src/_src@shared/shared.ts',
      'src/_components/comp.ts'
    );
    const outcome = checkEdgePeerSeparation(
      edge,
      inventory,
      taxonomy,
      emptyHierarchies
    );
    expect(outcome).toBeDefined();
    expect(outcome?.constraint).toBe('dependency/peer-separation');
  });

  it('returns undefined when both lateral steps are root nodes', () => {
    const root: TInventoryItem = {
      depth: 0,
      id: 0,
      isSymlink: false,
      kind: 'directory',
      parentId: null,
      path: 'src',
      preorderEnd: 2,
      preorderStart: 0,
      realPath: 'src',
      treeOrigin: 'src',
    };
    const mainA: TInventoryItem = {
      depth: 1,
      id: 1,
      isSymlink: false,
      kind: 'file',
      parentId: 0,
      path: 'src/main.ts',
      preorderEnd: 1,
      preorderStart: 1,
      realPath: 'src/main.ts',
      treeOrigin: 'src',
    };
    const mainB: TInventoryItem = {
      depth: 1,
      id: 2,
      isSymlink: false,
      kind: 'file',
      parentId: 0,
      path: 'src/other.ts',
      preorderEnd: 2,
      preorderStart: 2,
      realPath: 'src/other.ts',
      treeOrigin: 'src',
    };
    const inventory: TInventory = {
      items: [root, mainA, mainB],
      pathToId: new Map([
        ['src', 0],
        ['src/main.ts', 1],
        ['src/other.ts', 2],
      ]),
      realPathToId: new Map(),
    };
    const taxonomy: TTaxonomyModel = {
      byItemId: new Map([
        [0, createClassification(0, 'src', 'root-fragment', null)],
        [1, createClassification(1, 'src/main.ts', null, 'root-node')],
        [2, createClassification(2, 'src/other.ts', null, 'root-node')],
      ]),
      byPath: new Map(),
      classifications: [],
    };
    const edge = createEdge('src/main.ts', 'src/other.ts');
    expect(
      checkEdgePeerSeparation(edge, inventory, taxonomy, emptyHierarchies)
    ).toBeUndefined();
  });

  it('returns undefined when lateral steps are a node and a domain', () => {
    const root: TInventoryItem = {
      depth: 0,
      id: 0,
      isSymlink: false,
      kind: 'directory',
      parentId: null,
      path: 'src',
      preorderEnd: 3,
      preorderStart: 0,
      realPath: 'src',
      treeOrigin: 'src',
    };
    const mainNode: TInventoryItem = {
      depth: 1,
      id: 1,
      isSymlink: false,
      kind: 'file',
      parentId: 0,
      path: 'src/main.ts',
      preorderEnd: 1,
      preorderStart: 1,
      realPath: 'src/main.ts',
      treeOrigin: 'src',
    };
    const compDirectory: TInventoryItem = {
      depth: 1,
      id: 2,
      isSymlink: false,
      kind: 'directory',
      parentId: 0,
      path: 'src/_components',
      preorderEnd: 3,
      preorderStart: 2,
      realPath: 'src/_components',
      treeOrigin: 'src',
    };
    const compFile: TInventoryItem = {
      depth: 2,
      id: 3,
      isSymlink: false,
      kind: 'file',
      parentId: 2,
      path: 'src/_components/comp.ts',
      preorderEnd: 3,
      preorderStart: 3,
      realPath: 'src/_components/comp.ts',
      treeOrigin: 'src',
    };
    const inventory: TInventory = {
      items: [root, mainNode, compDirectory, compFile],
      pathToId: new Map([
        ['src', 0],
        ['src/_components', 2],
        ['src/_components/comp.ts', 3],
        ['src/main.ts', 1],
      ]),
      realPathToId: new Map(),
    };
    const taxonomy: TTaxonomyModel = {
      byItemId: new Map([
        [0, createClassification(0, 'src', 'root-layer', null)],
        [1, createClassification(1, 'src/main.ts', null, 'root-node')],
        [2, createClassification(2, 'src/_components', 'category', null)],
        [
          3,
          createClassification(
            3,
            'src/_components/comp.ts',
            null,
            'category-node'
          ),
        ],
      ]),
      byPath: new Map(),
      classifications: [],
    };
    const edge = createEdge('src/main.ts', 'src/_components/comp.ts');
    expect(
      checkEdgePeerSeparation(edge, inventory, taxonomy, emptyHierarchies)
    ).toBeUndefined();
  });

  it('returns an outcome when sibling domains have no horizontal hierarchy', () => {
    const root: TInventoryItem = {
      depth: 0,
      id: 0,
      isSymlink: false,
      kind: 'directory',
      parentId: null,
      path: 'src',
      preorderEnd: 4,
      preorderStart: 0,
      realPath: 'src',
      treeOrigin: 'src',
    };
    const directoryA: TInventoryItem = {
      depth: 1,
      id: 1,
      isSymlink: false,
      kind: 'directory',
      parentId: 0,
      path: 'src/_a',
      preorderEnd: 2,
      preorderStart: 1,
      realPath: 'src/_a',
      treeOrigin: 'src',
    };
    const fileA: TInventoryItem = {
      depth: 2,
      id: 2,
      isSymlink: false,
      kind: 'file',
      parentId: 1,
      path: 'src/_a/a.ts',
      preorderEnd: 2,
      preorderStart: 2,
      realPath: 'src/_a/a.ts',
      treeOrigin: 'src',
    };
    const directoryB: TInventoryItem = {
      depth: 1,
      id: 3,
      isSymlink: false,
      kind: 'directory',
      parentId: 0,
      path: 'src/_b',
      preorderEnd: 4,
      preorderStart: 3,
      realPath: 'src/_b',
      treeOrigin: 'src',
    };
    const fileB: TInventoryItem = {
      depth: 2,
      id: 4,
      isSymlink: false,
      kind: 'file',
      parentId: 3,
      path: 'src/_b/b.ts',
      preorderEnd: 4,
      preorderStart: 4,
      realPath: 'src/_b/b.ts',
      treeOrigin: 'src',
    };
    const inventory: TInventory = {
      items: [root, directoryA, fileA, directoryB, fileB],
      pathToId: new Map([
        ['src', 0],
        ['src/_a', 1],
        ['src/_a/a.ts', 2],
        ['src/_b', 3],
        ['src/_b/b.ts', 4],
      ]),
      realPathToId: new Map(),
    };
    const taxonomy: TTaxonomyModel = {
      byItemId: new Map([
        [0, createClassification(0, 'src', 'root-layer', null)],
        [1, createClassification(1, 'src/_a', 'category', null)],
        [2, createClassification(2, 'src/_a/a.ts', null, 'category-node')],
        [3, createClassification(3, 'src/_b', 'category', null)],
        [4, createClassification(4, 'src/_b/b.ts', null, 'category-node')],
      ]),
      byPath: new Map(),
      classifications: [],
    };
    const edge = createEdge('src/_a/a.ts', 'src/_b/b.ts');
    const outcome = checkEdgePeerSeparation(
      edge,
      inventory,
      taxonomy,
      emptyHierarchies
    );
    expect(outcome).toBeDefined();
    expect(outcome?.constraint).toBe('dependency/peer-separation');
    expect(outcome?.from).toBe('src/_a/a.ts');
    expect(outcome?.to).toBe('src/_b/b.ts');
  });

  it('permits dependency when source rank is strictly greater than destination rank', () => {
    const root: TInventoryItem = {
      depth: 0,
      id: 0,
      isSymlink: false,
      kind: 'directory',
      parentId: null,
      path: 'src',
      preorderEnd: 4,
      preorderStart: 0,
      realPath: 'src',
      treeOrigin: 'src',
    };
    const directoryA: TInventoryItem = {
      depth: 1,
      id: 1,
      isSymlink: false,
      kind: 'directory',
      parentId: 0,
      path: 'src/_high',
      preorderEnd: 2,
      preorderStart: 1,
      realPath: 'src/_high',
      treeOrigin: 'src',
    };
    const fileA: TInventoryItem = {
      depth: 2,
      id: 2,
      isSymlink: false,
      kind: 'file',
      parentId: 1,
      path: 'src/_high/a.ts',
      preorderEnd: 2,
      preorderStart: 2,
      realPath: 'src/_high/a.ts',
      treeOrigin: 'src',
    };
    const directoryB: TInventoryItem = {
      depth: 1,
      id: 3,
      isSymlink: false,
      kind: 'directory',
      parentId: 0,
      path: 'src/_low',
      preorderEnd: 4,
      preorderStart: 3,
      realPath: 'src/_low',
      treeOrigin: 'src',
    };
    const fileB: TInventoryItem = {
      depth: 2,
      id: 4,
      isSymlink: false,
      kind: 'file',
      parentId: 3,
      path: 'src/_low/b.ts',
      preorderEnd: 4,
      preorderStart: 4,
      realPath: 'src/_low/b.ts',
      treeOrigin: 'src',
    };
    const inventory: TInventory = {
      items: [root, directoryA, fileA, directoryB, fileB],
      pathToId: new Map([
        ['src', 0],
        ['src/_high', 1],
        ['src/_high/a.ts', 2],
        ['src/_low', 3],
        ['src/_low/b.ts', 4],
      ]),
      realPathToId: new Map(),
    };
    const taxonomy: TTaxonomyModel = {
      byItemId: new Map([
        [0, createClassification(0, 'src', 'root-layer', null)],
        [1, createClassification(1, 'src/_high', 'category', null)],
        [2, createClassification(2, 'src/_high/a.ts', null, 'category-node')],
        [3, createClassification(3, 'src/_low', 'category', null)],
        [4, createClassification(4, 'src/_low/b.ts', null, 'category-node')],
      ]),
      byPath: new Map(),
      classifications: [],
    };
    const hierarchies: THorizontalHierarchies = {
      conflicts: [],
      sets: [
        {
          id: 1,
          isOrderable: true,
          origin: 'general',
          parentPath: 'src',
          repetitions: [],
          siblings: [
            { itemId: 3, rank: 0 },
            { itemId: 1, rank: 1 },
          ],
        },
      ],
    };
    const edge = createEdge('src/_high/a.ts', 'src/_low/b.ts');
    expect(
      checkEdgePeerSeparation(edge, inventory, taxonomy, hierarchies)
    ).toBeUndefined();

    const reverseEdge = createEdge('src/_low/b.ts', 'src/_high/a.ts');
    expect(
      checkEdgePeerSeparation(reverseEdge, inventory, taxonomy, hierarchies)
    ).toBeDefined();
  });

  it('rejects dependency when an item is in conflicts', () => {
    const root: TInventoryItem = {
      depth: 0,
      id: 0,
      isSymlink: false,
      kind: 'directory',
      parentId: null,
      path: 'src',
      preorderEnd: 4,
      preorderStart: 0,
      realPath: 'src',
      treeOrigin: 'src',
    };
    const directoryA: TInventoryItem = {
      depth: 1,
      id: 1,
      isSymlink: false,
      kind: 'directory',
      parentId: 0,
      path: 'src/_high',
      preorderEnd: 2,
      preorderStart: 1,
      realPath: 'src/_high',
      treeOrigin: 'src',
    };
    const fileA: TInventoryItem = {
      depth: 2,
      id: 2,
      isSymlink: false,
      kind: 'file',
      parentId: 1,
      path: 'src/_high/a.ts',
      preorderEnd: 2,
      preorderStart: 2,
      realPath: 'src/_high/a.ts',
      treeOrigin: 'src',
    };
    const directoryB: TInventoryItem = {
      depth: 1,
      id: 3,
      isSymlink: false,
      kind: 'directory',
      parentId: 0,
      path: 'src/_low',
      preorderEnd: 4,
      preorderStart: 3,
      realPath: 'src/_low',
      treeOrigin: 'src',
    };
    const fileB: TInventoryItem = {
      depth: 2,
      id: 4,
      isSymlink: false,
      kind: 'file',
      parentId: 3,
      path: 'src/_low/b.ts',
      preorderEnd: 4,
      preorderStart: 4,
      realPath: 'src/_low/b.ts',
      treeOrigin: 'src',
    };
    const inventory: TInventory = {
      items: [root, directoryA, fileA, directoryB, fileB],
      pathToId: new Map([
        ['src', 0],
        ['src/_high', 1],
        ['src/_high/a.ts', 2],
        ['src/_low', 3],
        ['src/_low/b.ts', 4],
      ]),
      realPathToId: new Map(),
    };
    const taxonomy: TTaxonomyModel = {
      byItemId: new Map([
        [0, createClassification(0, 'src', 'root-layer', null)],
        [1, createClassification(1, 'src/_high', 'category', null)],
        [2, createClassification(2, 'src/_high/a.ts', null, 'category-node')],
        [3, createClassification(3, 'src/_low', 'category', null)],
        [4, createClassification(4, 'src/_low/b.ts', null, 'category-node')],
      ]),
      byPath: new Map(),
      classifications: [],
    };
    const hierarchies: THorizontalHierarchies = {
      conflicts: [{ hierarchyIds: [1, 2], itemId: 1 }],
      sets: [
        {
          id: 1,
          isOrderable: true,
          origin: 'general',
          parentPath: 'src',
          repetitions: [],
          siblings: [
            { itemId: 3, rank: 0 },
            { itemId: 1, rank: 1 },
          ],
        },
      ],
    };
    const edge = createEdge('src/_high/a.ts', 'src/_low/b.ts');
    expect(
      checkEdgePeerSeparation(edge, inventory, taxonomy, hierarchies)
    ).toBeDefined();
  });
});
