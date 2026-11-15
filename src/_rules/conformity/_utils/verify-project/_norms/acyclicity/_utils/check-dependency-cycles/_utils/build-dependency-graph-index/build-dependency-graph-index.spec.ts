import { describe, expect, it } from 'vitest';

import type {
  TDependencyGraph,
  TEdgeMetadata,
  TInventory,
  TItemClassification,
  TNodeKind,
  TTaxonomyModel,
  TVerificationModel,
} from '../../../../../../_verify-project@shared/_types/verification-model.type.js';

import { verificationModel } from '../../../../../_norms@shared/_mocks/verification-model.mock.js';
import { buildDependencyGraphIndex } from './build-dependency-graph-index.util.js';

const buildClassification = (
  path: string,
  nodeKind: null | TNodeKind,
  itemId: number
): TItemClassification => ({
  domainKind: null,
  entryKind: 'file',
  fragmentInternalRank: null,
  imposedRoleName: null,
  itemId,
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

const createEdge = (
  sourcePath: string,
  destinationPath: string
): TEdgeMetadata => ({
  aliasAlternatives: [],
  aliasUsed: null,
  destinationPath,
  importIndex: 0,
  isTypeOnly: false,
  position: { column: 1, line: 1 },
  sourcePath,
  specifier: `./${destinationPath}`,
  syntaxKind: 'side-effect-import',
});

const createModel = ({
  edges,
  files,
}: {
  readonly edges: readonly (readonly [string, string])[];
  readonly files: readonly (readonly [
    string,
    null | TNodeKind,
    null | string,
  ])[];
}): TVerificationModel => {
  const base = verificationModel();
  const inventoryItems = files.map(([path, , treeOrigin], id) => ({
    depth: 1,
    id,
    isSymlink: false,
    kind: 'file' as const,
    parentId: null,
    path,
    preorderEnd: id,
    preorderStart: id,
    realPath: `/workspace/${path}`,
    treeOrigin,
  }));
  const pathToId = new Map(inventoryItems.map((item) => [item.path, item.id]));
  const realPathToId = new Map(
    inventoryItems.map((item) => [item.realPath, item.id])
  );
  const inventory: TInventory = {
    items: inventoryItems,
    pathToId,
    realPathToId,
  };

  const classifications = files.map(([path, nodeKind], id) =>
    buildClassification(path, nodeKind, id)
  );
  const byItemId = new Map(
    classifications.map((classification) => [
      classification.itemId,
      classification,
    ])
  );
  const byPath = new Map(
    classifications.map((classification) => [
      classification.path,
      classification,
    ])
  );
  const taxonomy: TTaxonomyModel = {
    byItemId,
    byPath,
    classifications,
  };

  const edgeMetadata = edges.map(([sourcePath, destinationPath]) =>
    createEdge(sourcePath, destinationPath)
  );
  const graph: TDependencyGraph = {
    ...base.graph,
    edgeMetadata,
  };

  return {
    ...base,
    basis: {
      ...base.basis,
      inventory,
    },
    graph,
    taxonomy,
  };
};

describe('buildDependencyGraphIndex', () => {
  it('indexes empty graph', () => {
    const index = buildDependencyGraphIndex(
      createModel({ edges: [], files: [] })
    );
    expect(index.nodeCount).toBe(0);
    expect(index.logicalPaths).toEqual([]);
  });

  it('indexes graph with edges and self-loops', () => {
    const index = buildDependencyGraphIndex(
      createModel({
        edges: [
          ['src/a.ts', 'src/a.ts'],
          ['src/a.ts', 'src/b.ts'],
          ['src/a.ts', 'src/b.ts'],
        ],
        files: [
          ['src/a.ts', 'fragment-node', 'src'],
          ['src/b.ts', 'fragment-node', 'src'],
        ],
      })
    );
    expect(index.nodeCount).toBe(2);
    expect(index.selfLoopSet.has(0)).toBe(true);
    expect(index.adjacency[0]).toEqual([1]);
    expect(index.revAdjacency[1]).toEqual([0]);
  });

  it('indexes multiple connected nodes with deduped edges', () => {
    const index = buildDependencyGraphIndex(
      createModel({
        edges: [
          ['src/a.ts', 'src/b.ts'],
          ['src/b.ts', 'src/a.ts'],
        ],
        files: [
          ['src/a.ts', 'fragment-node', 'src'],
          ['src/b.ts', 'fragment-node', 'src'],
        ],
      })
    );
    expect(index.nodeCount).toBe(2);
    expect(index.adjacency[0]).toEqual([1]);
    expect(index.adjacency[1]).toEqual([0]);
  });

  it('ignores directories, external files, foreign nodes, unclassified nodes, sorts multi-neighbor rows, and preserves first parallel edge metadata', () => {
    const base = createModel({
      edges: [
        ['src/a.ts', 'src/c.ts'],
        ['src/a.ts', 'src/b.ts'],
        ['src/a.ts', 'src/b.ts'],
        ['src/a.ts', 'outside.ts'],
        ['src/foreign.ts', 'src/a.ts'],
      ],
      files: [
        ['src/a.ts', 'fragment-node', 'src'],
        ['src/b.ts', 'fragment-node', 'src'],
        ['src/c.ts', 'fragment-node', 'src'],
        ['src/foreign.ts', 'foreign-node', 'src'],
        ['src/unclassified.ts', null, 'src'],
        ['outside.ts', null, null],
      ],
    });

    const directoryItem = {
      depth: 0,
      id: 6,
      isSymlink: false,
      kind: 'directory' as const,
      parentId: null,
      path: 'src',
      preorderEnd: 6,
      preorderStart: 6,
      realPath: '/workspace/src',
      treeOrigin: 'src',
    };
    const model: TVerificationModel = {
      ...base,
      basis: {
        ...base.basis,
        inventory: {
          ...base.basis.inventory,
          items: [...base.basis.inventory.items, directoryItem],
          pathToId: new Map([...base.basis.inventory.pathToId, ['src', 6]]),
        },
      },
      graph: {
        ...base.graph,
        edgeMetadata: base.graph.edgeMetadata.map((edge, index_) => ({
          ...edge,
          position: { column: 1, line: index_ + 10 },
        })),
      },
    };

    const index = buildDependencyGraphIndex(model);
    expect(index.logicalPaths).toEqual(['src/a.ts', 'src/b.ts', 'src/c.ts']);
    expect(index.adjacency[0]).toEqual([1, 2]);
    expect(
      index.edgeBySourceAndDestination.get('src/a.ts\0src/b.ts')?.position
    ).toEqual({ column: 1, line: 11 });
  });
});
