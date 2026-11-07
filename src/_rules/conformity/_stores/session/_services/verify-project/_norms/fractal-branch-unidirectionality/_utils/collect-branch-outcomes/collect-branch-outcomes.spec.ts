import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TLogicalDomainKind,
  TNodeKind,
  TTaxonomyModel,
} from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type {
  TDependencyGraph,
  TEdgeMetadata,
} from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TVerificationModel } from '../../../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { verificationModel } from '../../../../_verify-project@shared/_mocks/verification-model.mock.js';
import { collectBranchOutcomes } from './collect-branch-outcomes.util.js';

type TModelEntry = {
  readonly depth: number;
  readonly domainKind?: TLogicalDomainKind;
  readonly id: number;
  readonly kind: 'directory' | 'file';
  readonly nodeKind?: TNodeKind;
  readonly parentId: null | number;
  readonly path: string;
  readonly preorderEnd: number;
  readonly preorderStart: number;
  readonly treeOrigin?: null | string;
};

const buildTestModel = (
  entries: readonly TModelEntry[],
  edges: readonly TEdgeMetadata[],
  extraVertices: readonly string[] = []
): TVerificationModel => {
  const items: TInventoryItem[] = [];
  const pathToId = new Map<string, number>();
  const realPathToId = new Map<string, number>();
  const byItemId = new Map<number, TItemClassification>();
  const byPath = new Map<string, TItemClassification>();
  const classifications: TItemClassification[] = [];

  for (const entry of entries) {
    const item: TInventoryItem = {
      depth: entry.depth,
      id: entry.id,
      isSymlink: false,
      kind: entry.kind,
      parentId: entry.parentId,
      path: entry.path,
      preorderEnd: entry.preorderEnd,
      preorderStart: entry.preorderStart,
      realPath: entry.path,
      treeOrigin: entry.treeOrigin === undefined ? 'src' : entry.treeOrigin,
    };
    items[entry.id] = item;
    pathToId.set(entry.path, entry.id);
    realPathToId.set(entry.path, entry.id);

    const classification: TItemClassification = {
      domainKind: entry.domainKind ?? null,
      entryKind: entry.kind,
      fragmentInternalRank: null,
      imposedRoleName: null,
      itemId: entry.id,
      nodeKind: entry.nodeKind ?? null,
      path: entry.path,
      relationalQualifications: {
        isParentCategory: false,
        isPathFragment: false,
        isPrivateCategory: false,
        isSubFragment: false,
        isSubLayer: false,
        parentFragmentPath: null,
      },
      role: { kind: 'absent', roleName: null },
    };
    byItemId.set(entry.id, classification);
    byPath.set(entry.path, classification);
    classifications.push(classification);
  }

  const inventory: TInventory = { items, pathToId, realPathToId };
  const taxonomy: TTaxonomyModel = { byItemId, byPath, classifications };

  const fileEntries = entries
    .filter((entry) => entry.kind === 'file')
    .map((entry) => entry.path);
  const allVertices = [...new Set([...fileEntries, ...extraVertices])];
  const pathToVertex = new Map<string, number>();
  for (const [index, vertexPath] of allVertices.entries()) {
    pathToVertex.set(vertexPath, index);
  }

  const rowOffsets = new Int32Array(allVertices.length + 1);
  const columnTargets: number[] = [];
  const orderedEdgeMetadata: TEdgeMetadata[] = [];

  let edgeOffset = 0;
  for (const [vIndex, vPath] of allVertices.entries()) {
    rowOffsets[vIndex] = edgeOffset;
    const outgoing = edges.filter(
      (edgeEntry) => edgeEntry.sourcePath === vPath
    );
    for (const edge of outgoing) {
      const destinationIndex = pathToVertex.get(edge.destinationPath);
      if (destinationIndex === undefined) {
        continue;
      }
      columnTargets.push(destinationIndex);
      orderedEdgeMetadata.push(edge);
      edgeOffset += 1;
    }
  }
  rowOffsets[allVertices.length] = edgeOffset;

  const base = verificationModel();
  const graph: TDependencyGraph = {
    ...base.graph,
    columnTargets: Int32Array.from(columnTargets),
    edgeCount: orderedEdgeMetadata.length,
    edgeMetadata: orderedEdgeMetadata,
    pathToVertex,
    rowOffsets,
    vertexCount: allVertices.length,
    vertexToPath: allVertices,
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

const createEdge = (
  from: string,
  to: string,
  specifier: string,
  options: {
    readonly importIndex?: number;
    readonly line?: number;
  } = {}
): TEdgeMetadata => ({
  aliasAlternatives: [],
  aliasUsed: null,
  destinationPath: to,
  importIndex: options.importIndex ?? 0,
  isTypeOnly: false,
  position: { column: 1, line: options.line ?? 1 },
  sourcePath: from,
  specifier,
  syntaxKind: 'named-import',
});

const baseBranchEntries: readonly TModelEntry[] = [
  {
    depth: 0,
    domainKind: 'root-fragment',
    id: 0,
    kind: 'directory',
    parentId: null,
    path: 'src',
    preorderEnd: 8,
    preorderStart: 0,
  },
  {
    depth: 1,
    id: 1,
    kind: 'file',
    nodeKind: 'root-node',
    parentId: 0,
    path: 'src/main.ts',
    preorderEnd: 1,
    preorderStart: 1,
  },
  {
    depth: 1,
    domainKind: 'fractal-branch',
    id: 2,
    kind: 'directory',
    parentId: 0,
    path: 'src/_src@shared',
    preorderEnd: 5,
    preorderStart: 2,
  },
  {
    depth: 2,
    domainKind: 'category',
    id: 3,
    kind: 'directory',
    parentId: 2,
    path: 'src/_src@shared/_types',
    preorderEnd: 5,
    preorderStart: 3,
  },
  {
    depth: 3,
    id: 4,
    kind: 'file',
    nodeKind: 'category-node',
    parentId: 3,
    path: 'src/_src@shared/_types/start.type.ts',
    preorderEnd: 4,
    preorderStart: 4,
  },
];

describe('collectBranchOutcomes', () => {
  it('returns empty outcomes when there are no candidate branch sources', () => {
    const entries: TModelEntry[] = [
      {
        depth: 0,
        domainKind: 'root-fragment',
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src',
        preorderEnd: 2,
        preorderStart: 0,
      },
      {
        depth: 1,
        id: 1,
        kind: 'file',
        nodeKind: 'root-node',
        parentId: 0,
        path: 'src/main.ts',
        preorderEnd: 1,
        preorderStart: 1,
      },
    ];
    const model = buildTestModel(entries, []);
    expect(collectBranchOutcomes(model)).toEqual([]);
  });

  it('detects a direct edge return from a branch node to a parent node', () => {
    const edges = [
      createEdge(
        'src/_src@shared/_types/start.type.ts',
        'src/main.ts',
        '../../main.js'
      ),
    ];
    const model = buildTestModel(baseBranchEntries, edges);
    const outcomes = collectBranchOutcomes(model);

    expect(outcomes).toEqual([
      expect.objectContaining({
        constraint: 'dependency/fractal-branch-unidirectionality',
        from: 'src/_src@shared/_types/start.type.ts',
        to: 'src/main.ts',
      }),
    ]);
  });

  it('detects multi-hop path violations through internal branch nodes', () => {
    const entries: TModelEntry[] = [
      {
        depth: 0,
        domainKind: 'root-fragment',
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src',
        preorderEnd: 8,
        preorderStart: 0,
      },
      {
        depth: 1,
        domainKind: 'category',
        id: 1,
        kind: 'directory',
        parentId: 0,
        path: 'src/_types',
        preorderEnd: 3,
        preorderStart: 1,
      },
      {
        depth: 2,
        id: 2,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 1,
        path: 'src/_types/other.type.ts',
        preorderEnd: 2,
        preorderStart: 2,
      },
      {
        depth: 1,
        domainKind: 'fractal-branch',
        id: 3,
        kind: 'directory',
        parentId: 0,
        path: 'src/_src@shared',
        preorderEnd: 8,
        preorderStart: 4,
      },
      {
        depth: 2,
        domainKind: 'category',
        id: 4,
        kind: 'directory',
        parentId: 3,
        path: 'src/_src@shared/_types',
        preorderEnd: 8,
        preorderStart: 5,
      },
      {
        depth: 3,
        id: 5,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 4,
        path: 'src/_src@shared/_types/last.type.ts',
        preorderEnd: 6,
        preorderStart: 6,
      },
      {
        depth: 3,
        id: 6,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 4,
        path: 'src/_src@shared/_types/middle.type.ts',
        preorderEnd: 7,
        preorderStart: 7,
      },
    ];

    const edges = [
      createEdge(
        'src/_src@shared/_types/middle.type.ts',
        'src/_src@shared/_types/last.type.ts',
        './last.type.js'
      ),
      createEdge(
        'src/_src@shared/_types/last.type.ts',
        'src/_types/other.type.ts',
        '../../_types/other.type.js'
      ),
    ];
    const model = buildTestModel(entries, edges);
    const outcomes = collectBranchOutcomes(model);

    expect(outcomes).toEqual([
      expect.objectContaining({
        from: 'src/_src@shared/_types/last.type.ts',
        to: 'src/_types/other.type.ts',
      }),
      expect.objectContaining({
        chain: [
          'src/_src@shared/_types/middle.type.ts',
          'src/_src@shared/_types/last.type.ts',
          'src/_types/other.type.ts',
        ],
        from: 'src/_src@shared/_types/middle.type.ts',
        to: 'src/_types/other.type.ts',
      }),
    ]);
  });

  it('orders candidate sources by depth descending, then path ascending', () => {
    const multiDepthEntries: TModelEntry[] = [
      ...baseBranchEntries,
      {
        depth: 3,
        id: 5,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 3,
        path: 'src/_src@shared/_types/a-start.type.ts',
        preorderEnd: 4,
        preorderStart: 4,
      },
      {
        depth: 4,
        domainKind: 'category',
        id: 6,
        kind: 'directory',
        parentId: 3,
        path: 'src/_src@shared/_types/nested',
        preorderEnd: 7,
        preorderStart: 6,
      },
      {
        depth: 5,
        id: 7,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 6,
        path: 'src/_src@shared/_types/nested/z-deep.type.ts',
        preorderEnd: 7,
        preorderStart: 7,
      },
    ];

    const edges = [
      createEdge(
        'src/_src@shared/_types/start.type.ts',
        'src/main.ts',
        '../../main.js'
      ),
      createEdge(
        'src/_src@shared/_types/a-start.type.ts',
        'src/main.ts',
        '../../main.js'
      ),
      createEdge(
        'src/_src@shared/_types/nested/z-deep.type.ts',
        'src/main.ts',
        '../../../main.js'
      ),
    ];
    const model = buildTestModel(multiDepthEntries, edges);
    const outcomes = collectBranchOutcomes(model);

    expect(outcomes.map((item) => item.from)).toEqual([
      'src/_src@shared/_types/nested/z-deep.type.ts',
      'src/_src@shared/_types/a-start.type.ts',
      'src/_src@shared/_types/start.type.ts',
    ]);
  });

  it('ignores foreign nodes as consumers', () => {
    const entries: TModelEntry[] = [
      ...baseBranchEntries,
      {
        depth: 1,
        id: 5,
        kind: 'file',
        nodeKind: 'foreign-node',
        parentId: 0,
        path: 'src/foreign.ts',
        preorderEnd: 8,
        preorderStart: 8,
      },
    ];

    const edges = [
      createEdge(
        'src/_src@shared/_types/start.type.ts',
        'src/foreign.ts',
        '../../foreign.js'
      ),
    ];
    const model = buildTestModel(entries, edges);
    expect(collectBranchOutcomes(model)).toEqual([]);
  });

  it('handles dependency cycles safely without infinite recursion', () => {
    const entries: TModelEntry[] = [
      {
        depth: 0,
        domainKind: 'root-fragment',
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src',
        preorderEnd: 6,
        preorderStart: 0,
      },
      {
        depth: 1,
        domainKind: 'fractal-branch',
        id: 1,
        kind: 'directory',
        parentId: 0,
        path: 'src/_src@shared',
        preorderEnd: 5,
        preorderStart: 1,
      },
      {
        depth: 2,
        domainKind: 'category',
        id: 2,
        kind: 'directory',
        parentId: 1,
        path: 'src/_src@shared/_types',
        preorderEnd: 5,
        preorderStart: 2,
      },
      {
        depth: 3,
        id: 3,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 2,
        path: 'src/_src@shared/_types/a.type.ts',
        preorderEnd: 3,
        preorderStart: 3,
      },
      {
        depth: 3,
        id: 4,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 2,
        path: 'src/_src@shared/_types/b.type.ts',
        preorderEnd: 4,
        preorderStart: 4,
      },
    ];

    const edges = [
      createEdge(
        'src/_src@shared/_types/a.type.ts',
        'src/_src@shared/_types/b.type.ts',
        './b.type.js'
      ),
      createEdge(
        'src/_src@shared/_types/b.type.ts',
        'src/_src@shared/_types/a.type.ts',
        './a.type.js'
      ),
    ];
    const model = buildTestModel(entries, edges);
    expect(collectBranchOutcomes(model)).toEqual([]);
  });

  it('ignores self-imports', () => {
    const entries: TModelEntry[] = [
      {
        depth: 0,
        domainKind: 'root-fragment',
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src',
        preorderEnd: 4,
        preorderStart: 0,
      },
      {
        depth: 1,
        domainKind: 'fractal-branch',
        id: 1,
        kind: 'directory',
        parentId: 0,
        path: 'src/_src@shared',
        preorderEnd: 4,
        preorderStart: 1,
      },
      {
        depth: 2,
        domainKind: 'category',
        id: 2,
        kind: 'directory',
        parentId: 1,
        path: 'src/_src@shared/_types',
        preorderEnd: 4,
        preorderStart: 2,
      },
      {
        depth: 3,
        id: 3,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 2,
        path: 'src/_src@shared/_types/self.type.ts',
        preorderEnd: 3,
        preorderStart: 3,
      },
    ];
    const edges = [
      createEdge(
        'src/_src@shared/_types/self.type.ts',
        'src/_src@shared/_types/self.type.ts',
        './self.type.js'
      ),
    ];
    const model = buildTestModel(entries, edges);
    expect(collectBranchOutcomes(model)).toEqual([]);
  });

  it('ignores access nodes as candidate sources', () => {
    const entries: TModelEntry[] = [
      {
        depth: 0,
        domainKind: 'root-fragment',
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src',
        preorderEnd: 6,
        preorderStart: 0,
      },
      {
        depth: 1,
        id: 1,
        kind: 'file',
        nodeKind: 'root-node',
        parentId: 0,
        path: 'src/main.ts',
        preorderEnd: 1,
        preorderStart: 1,
      },
      {
        depth: 1,
        domainKind: 'fractal-branch',
        id: 2,
        kind: 'directory',
        parentId: 0,
        path: 'src/_src@shared',
        preorderEnd: 6,
        preorderStart: 2,
      },
      {
        depth: 2,
        domainKind: 'category',
        id: 3,
        kind: 'directory',
        parentId: 2,
        path: 'src/_src@shared/_components',
        preorderEnd: 6,
        preorderStart: 3,
      },
      {
        depth: 3,
        domainKind: 'fragment',
        id: 4,
        kind: 'directory',
        parentId: 3,
        path: 'src/_src@shared/_components/widget',
        preorderEnd: 6,
        preorderStart: 4,
      },
      {
        depth: 4,
        id: 5,
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 4,
        path: 'src/_src@shared/_components/widget/index.ts',
        preorderEnd: 5,
        preorderStart: 5,
      },
    ];
    const edges = [
      createEdge(
        'src/_src@shared/_components/widget/index.ts',
        'src/main.ts',
        '../../../main.js'
      ),
    ];
    const model = buildTestModel(entries, edges);
    expect(collectBranchOutcomes(model)).toEqual([]);
  });

  it('prefers a shorter path when memoized paths offer an alternative', () => {
    const entries: TModelEntry[] = [
      {
        depth: 0,
        domainKind: 'root-fragment',
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src',
        preorderEnd: 8,
        preorderStart: 0,
      },
      {
        depth: 1,
        id: 1,
        kind: 'file',
        nodeKind: 'root-node',
        parentId: 0,
        path: 'src/main.ts',
        preorderEnd: 1,
        preorderStart: 1,
      },
      {
        depth: 1,
        domainKind: 'fractal-branch',
        id: 2,
        kind: 'directory',
        parentId: 0,
        path: 'src/_src@shared',
        preorderEnd: 8,
        preorderStart: 2,
      },
      {
        depth: 2,
        domainKind: 'category',
        id: 3,
        kind: 'directory',
        parentId: 2,
        path: 'src/_src@shared/_types',
        preorderEnd: 8,
        preorderStart: 3,
      },
      {
        depth: 3,
        id: 4,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 3,
        path: 'src/_src@shared/_types/a.type.ts',
        preorderEnd: 4,
        preorderStart: 4,
      },
      {
        depth: 3,
        id: 5,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 3,
        path: 'src/_src@shared/_types/b.type.ts',
        preorderEnd: 5,
        preorderStart: 5,
      },
      {
        depth: 3,
        id: 6,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 3,
        path: 'src/_src@shared/_types/c.type.ts',
        preorderEnd: 6,
        preorderStart: 6,
      },
    ];

    const edges = [
      createEdge(
        'src/_src@shared/_types/a.type.ts',
        'src/main.ts',
        '../../main.js'
      ),
      createEdge(
        'src/_src@shared/_types/a.type.ts',
        'src/_src@shared/_types/b.type.ts',
        './b.type.js'
      ),
      createEdge(
        'src/_src@shared/_types/b.type.ts',
        'src/_src@shared/_types/c.type.ts',
        './c.type.js'
      ),
      createEdge(
        'src/_src@shared/_types/c.type.ts',
        'src/main.ts',
        '../../main.js'
      ),
    ];
    const model = buildTestModel(entries, edges);
    const outcomes = collectBranchOutcomes(model);

    const outcomeA = outcomes.find(
      (item) => item.from === 'src/_src@shared/_types/a.type.ts'
    );
    expect(outcomeA?.chain).toBeUndefined();
    expect(outcomeA?.to).toBe('src/main.ts');
  });

  it('selects lexicographically smaller path when lengths match', () => {
    const entries: TModelEntry[] = [
      {
        depth: 0,
        domainKind: 'root-fragment',
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src',
        preorderEnd: 8,
        preorderStart: 0,
      },
      {
        depth: 1,
        id: 1,
        kind: 'file',
        nodeKind: 'root-node',
        parentId: 0,
        path: 'src/main.ts',
        preorderEnd: 1,
        preorderStart: 1,
      },
      {
        depth: 1,
        domainKind: 'fractal-branch',
        id: 2,
        kind: 'directory',
        parentId: 0,
        path: 'src/_src@shared',
        preorderEnd: 8,
        preorderStart: 2,
      },
      {
        depth: 2,
        domainKind: 'category',
        id: 3,
        kind: 'directory',
        parentId: 2,
        path: 'src/_src@shared/_types',
        preorderEnd: 8,
        preorderStart: 3,
      },
      {
        depth: 3,
        id: 4,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 3,
        path: 'src/_src@shared/_types/root.type.ts',
        preorderEnd: 4,
        preorderStart: 4,
      },
      {
        depth: 3,
        id: 5,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 3,
        path: 'src/_src@shared/_types/alt1.type.ts',
        preorderEnd: 5,
        preorderStart: 5,
      },
      {
        depth: 3,
        id: 6,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 3,
        path: 'src/_src@shared/_types/alt2.type.ts',
        preorderEnd: 6,
        preorderStart: 6,
      },
    ];

    const edges = [
      createEdge(
        'src/_src@shared/_types/root.type.ts',
        'external-a.ts',
        '../../../external-a.js'
      ),
      createEdge(
        'src/_src@shared/_types/root.type.ts',
        'src/_src@shared/_types/alt2.type.ts',
        './alt2.type.js'
      ),
      createEdge(
        'src/_src@shared/_types/root.type.ts',
        'src/_src@shared/_types/alt1.type.ts',
        './alt1.type.js'
      ),
      createEdge('external-a.ts', 'src/main.ts', './src/main.js'),
      createEdge(
        'src/_src@shared/_types/alt1.type.ts',
        'src/main.ts',
        '../../main.js'
      ),
      createEdge(
        'src/_src@shared/_types/alt2.type.ts',
        'src/main.ts',
        '../../main.js'
      ),
    ];
    const model = buildTestModel(entries, edges, ['external-a.ts']);
    const outcomes = collectBranchOutcomes(model);

    const rootOutcome = outcomes.find(
      (item) => item.from === 'src/_src@shared/_types/root.type.ts'
    );
    expect(rootOutcome?.chain).toEqual([
      'src/_src@shared/_types/root.type.ts',
      'external-a.ts',
      'src/main.ts',
    ]);
  });

  it('rejects longer memoized candidate when a shorter path already exists', () => {
    const entries: TModelEntry[] = [
      ...baseBranchEntries,
      {
        depth: 3,
        id: 5,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 3,
        path: 'src/_src@shared/_types/mid.type.ts',
        preorderEnd: 5,
        preorderStart: 5,
      },
      {
        depth: 3,
        id: 6,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 3,
        path: 'src/_src@shared/_types/long1.type.ts',
        preorderEnd: 5,
        preorderStart: 5,
      },
      {
        depth: 3,
        id: 7,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 3,
        path: 'src/_src@shared/_types/long2.type.ts',
        preorderEnd: 5,
        preorderStart: 5,
      },
    ];

    const edges = [
      createEdge(
        'src/_src@shared/_types/start.type.ts',
        'src/_src@shared/_types/mid.type.ts',
        './mid.type.js'
      ),
      createEdge(
        'src/_src@shared/_types/mid.type.ts',
        'src/main.ts',
        '../../main.js'
      ),
      createEdge(
        'src/_src@shared/_types/start.type.ts',
        'src/_src@shared/_types/long1.type.ts',
        './long1.type.js'
      ),
      createEdge(
        'src/_src@shared/_types/long1.type.ts',
        'src/_src@shared/_types/long2.type.ts',
        './long2.type.js'
      ),
      createEdge(
        'src/_src@shared/_types/long2.type.ts',
        'src/main.ts',
        '../../main.js'
      ),
    ];
    const model = buildTestModel(entries, edges);
    const outcomes = collectBranchOutcomes(model);

    const startOutcome = outcomes.find(
      (item) => item.from === 'src/_src@shared/_types/start.type.ts'
    );
    expect(startOutcome?.chain).toEqual([
      'src/_src@shared/_types/start.type.ts',
      'src/_src@shared/_types/mid.type.ts',
      'src/main.ts',
    ]);
  });

  it('rejects lexicographically larger candidate when path lengths match', () => {
    const entries: TModelEntry[] = [
      ...baseBranchEntries,
      {
        depth: 3,
        id: 5,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 3,
        path: 'src/_src@shared/_types/a.type.ts',
        preorderEnd: 5,
        preorderStart: 5,
      },
      {
        depth: 3,
        id: 6,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 3,
        path: 'src/_src@shared/_types/b.type.ts',
        preorderEnd: 5,
        preorderStart: 5,
      },
    ];

    const edges = [
      createEdge(
        'src/_src@shared/_types/start.type.ts',
        'src/_src@shared/_types/a.type.ts',
        './a.type.js'
      ),
      createEdge(
        'src/_src@shared/_types/start.type.ts',
        'src/_src@shared/_types/b.type.ts',
        './b.type.js'
      ),
      createEdge(
        'src/_src@shared/_types/a.type.ts',
        'src/main.ts',
        '../../main.js'
      ),
      createEdge(
        'src/_src@shared/_types/b.type.ts',
        'src/main.ts',
        '../../main.js'
      ),
    ];
    const model = buildTestModel(entries, edges);
    const outcomes = collectBranchOutcomes(model);

    const startOutcome = outcomes.find(
      (item) => item.from === 'src/_src@shared/_types/start.type.ts'
    );
    expect(startOutcome?.chain).toEqual([
      'src/_src@shared/_types/start.type.ts',
      'src/_src@shared/_types/a.type.ts',
      'src/main.ts',
    ]);
  });

  it('filters cycles in memoized paths', () => {
    const entries: TModelEntry[] = [
      {
        depth: 0,
        domainKind: 'root-fragment',
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src',
        preorderEnd: 8,
        preorderStart: 0,
      },
      {
        depth: 1,
        id: 1,
        kind: 'file',
        nodeKind: 'root-node',
        parentId: 0,
        path: 'src/main.ts',
        preorderEnd: 1,
        preorderStart: 1,
      },
      {
        depth: 1,
        domainKind: 'fractal-branch',
        id: 2,
        kind: 'directory',
        parentId: 0,
        path: 'src/_src@shared',
        preorderEnd: 8,
        preorderStart: 2,
      },
      {
        depth: 2,
        domainKind: 'category',
        id: 3,
        kind: 'directory',
        parentId: 2,
        path: 'src/_src@shared/_types',
        preorderEnd: 8,
        preorderStart: 3,
      },
      {
        depth: 3,
        id: 4,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 3,
        path: 'src/_src@shared/_types/a.type.ts',
        preorderEnd: 4,
        preorderStart: 4,
      },
      {
        depth: 3,
        id: 5,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 3,
        path: 'src/_src@shared/_types/b.type.ts',
        preorderEnd: 5,
        preorderStart: 5,
      },
    ];

    const edges = [
      createEdge(
        'src/_src@shared/_types/a.type.ts',
        'src/_src@shared/_types/b.type.ts',
        './b.type.js'
      ),
      createEdge(
        'src/_src@shared/_types/b.type.ts',
        'src/_src@shared/_types/a.type.ts',
        './a.type.js'
      ),
      createEdge(
        'src/_src@shared/_types/b.type.ts',
        'src/main.ts',
        '../../main.js'
      ),
    ];
    const model = buildTestModel(entries, edges);
    const outcomes = collectBranchOutcomes(model);

    expect(outcomes).toHaveLength(2);
    const outcomeA = outcomes.find(
      (item) => item.from === 'src/_src@shared/_types/a.type.ts'
    );
    expect(outcomeA?.chain).toEqual([
      'src/_src@shared/_types/a.type.ts',
      'src/_src@shared/_types/b.type.ts',
      'src/main.ts',
    ]);
  });

  it('allows importing an accessible ancestor Branch', () => {
    const entries: TModelEntry[] = [
      {
        depth: 0,
        domainKind: 'root-fragment',
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src',
        preorderEnd: 10,
        preorderStart: 0,
      },
      {
        depth: 1,
        domainKind: 'fractal-branch',
        id: 1,
        kind: 'directory',
        parentId: 0,
        path: 'src/_src@shared',
        preorderEnd: 3,
        preorderStart: 1,
      },
      {
        depth: 2,
        domainKind: 'category',
        id: 2,
        kind: 'directory',
        parentId: 1,
        path: 'src/_src@shared/_types',
        preorderEnd: 3,
        preorderStart: 2,
      },
      {
        depth: 3,
        id: 3,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 2,
        path: 'src/_src@shared/_types/ancestor.type.ts',
        preorderEnd: 3,
        preorderStart: 3,
      },
      {
        depth: 1,
        domainKind: 'category',
        id: 4,
        kind: 'directory',
        parentId: 0,
        path: 'src/_utils',
        preorderEnd: 10,
        preorderStart: 4,
      },
      {
        depth: 2,
        domainKind: 'fragment',
        id: 5,
        kind: 'directory',
        parentId: 4,
        path: 'src/_utils/unit',
        preorderEnd: 10,
        preorderStart: 5,
      },
      {
        depth: 3,
        domainKind: 'fractal-branch',
        id: 6,
        kind: 'directory',
        parentId: 5,
        path: 'src/_utils/unit/_unit@shared',
        preorderEnd: 10,
        preorderStart: 6,
      },
      {
        depth: 4,
        domainKind: 'category',
        id: 7,
        kind: 'directory',
        parentId: 6,
        path: 'src/_utils/unit/_unit@shared/_types',
        preorderEnd: 10,
        preorderStart: 7,
      },
      {
        depth: 5,
        id: 8,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 7,
        path: 'src/_utils/unit/_unit@shared/_types/local.type.ts',
        preorderEnd: 8,
        preorderStart: 8,
      },
    ];

    const edges = [
      createEdge(
        'src/_utils/unit/_unit@shared/_types/local.type.ts',
        'src/_src@shared/_types/ancestor.type.ts',
        '../../../../_src@shared/_types/ancestor.type.js'
      ),
    ];
    const model = buildTestModel(entries, edges);
    expect(collectBranchOutcomes(model)).toEqual([]);
  });

  it('sorts outgoing edges deterministically by destination, location, index, and specifier', () => {
    const entries: TModelEntry[] = [
      {
        depth: 0,
        domainKind: 'root-fragment',
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src',
        preorderEnd: 6,
        preorderStart: 0,
      },
      {
        depth: 1,
        id: 1,
        kind: 'file',
        nodeKind: 'root-node',
        parentId: 0,
        path: 'src/main.ts',
        preorderEnd: 1,
        preorderStart: 1,
      },
      {
        depth: 1,
        id: 2,
        kind: 'file',
        nodeKind: 'root-node',
        parentId: 0,
        path: 'src/alt.ts',
        preorderEnd: 2,
        preorderStart: 2,
      },
      {
        depth: 1,
        domainKind: 'fractal-branch',
        id: 3,
        kind: 'directory',
        parentId: 0,
        path: 'src/_src@shared',
        preorderEnd: 6,
        preorderStart: 3,
      },
      {
        depth: 2,
        domainKind: 'category',
        id: 4,
        kind: 'directory',
        parentId: 3,
        path: 'src/_src@shared/_types',
        preorderEnd: 6,
        preorderStart: 4,
      },
      {
        depth: 3,
        id: 5,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 4,
        path: 'src/_src@shared/_types/source.type.ts',
        preorderEnd: 5,
        preorderStart: 5,
      },
    ];

    const edges = [
      createEdge(
        'src/_src@shared/_types/source.type.ts',
        'src/main.ts',
        '../../main.js',
        { importIndex: 1, line: 2 }
      ),
      createEdge(
        'src/_src@shared/_types/source.type.ts',
        'src/main.ts',
        '../../main.js',
        { importIndex: 0, line: 1 }
      ),
      createEdge(
        'src/_src@shared/_types/source.type.ts',
        'src/alt.ts',
        '../../alt.js',
        { importIndex: 0, line: 1 }
      ),
      createEdge(
        'src/_src@shared/_types/source.type.ts',
        'src/main.ts',
        '../../main.js',
        { importIndex: 0, line: 2 }
      ),
      createEdge(
        'src/_src@shared/_types/source.type.ts',
        'src/main.ts',
        '../../main-alt.js',
        { importIndex: 0, line: 2 }
      ),
    ];
    const model = buildTestModel(entries, edges);
    const outcomes = collectBranchOutcomes(model);

    expect(outcomes).toHaveLength(2);
    expect(outcomes[0]?.to).toBe('src/alt.ts');
    expect(outcomes[1]?.to).toBe('src/main.ts');
  });

  it('sorts edges by location when destination matches', () => {
    const edges = [
      createEdge(
        'src/_src@shared/_types/start.type.ts',
        'src/main.ts',
        '../../main.js',
        { importIndex: 2, line: 3 }
      ),
      createEdge(
        'src/_src@shared/_types/start.type.ts',
        'src/main.ts',
        '../../main.js',
        { importIndex: 0, line: 1 }
      ),
      createEdge(
        'src/_src@shared/_types/start.type.ts',
        'src/main.ts',
        '../../main.js',
        { importIndex: 1, line: 2 }
      ),
    ];
    const model = buildTestModel(baseBranchEntries, edges);
    const outcomes = collectBranchOutcomes(model);
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.position?.line).toBe(1);
  });

  it('covers boundary fallback paths', () => {
    const base = buildTestModel(baseBranchEntries, []);

    const truncatedPathsGraph: TDependencyGraph = {
      ...base.graph,
      vertexCount: base.graph.vertexCount + 2,
    };
    expect(
      collectBranchOutcomes({ ...base, graph: truncatedPathsGraph })
    ).toEqual([]);

    const emptyOffsetsGraph: TDependencyGraph = {
      ...base.graph,
      rowOffsets: new Int32Array(0),
      vertexCount: 1,
    };
    expect(
      collectBranchOutcomes({ ...base, graph: emptyOffsetsGraph })
    ).toEqual([]);
  });

  it('covers fallback defaults on edge-case inputs', () => {
    const edgeCaseEntries: TModelEntry[] = [
      ...baseBranchEntries,
      {
        depth: 3,
        id: 5,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 999,
        path: 'src/_src@shared/_types/orphan.type.ts',
        preorderEnd: 5,
        preorderStart: 5,
      },
    ];
    const model = buildTestModel(edgeCaseEntries, []);
    expect(collectBranchOutcomes(model)).toEqual([]);

    const base = buildTestModel(baseBranchEntries, []);
    const emptyOffsetsGraph: TDependencyGraph = {
      ...base.graph,
      rowOffsets: new Int32Array(0),
      vertexCount: 0,
      vertexToPath: [],
    };
    const emptyModel: TVerificationModel = {
      ...base,
      graph: emptyOffsetsGraph,
    };
    expect(collectBranchOutcomes(emptyModel)).toEqual([]);
  });

  it('handles cross-tree imports without violation', () => {
    const crossTreeEntries: TModelEntry[] = [
      ...baseBranchEntries,
      {
        depth: 0,
        domainKind: 'root-fragment',
        id: 16,
        kind: 'directory',
        parentId: null,
        path: 'lib',
        preorderEnd: 18,
        preorderStart: 16,
        treeOrigin: 'lib',
      },
      {
        depth: 1,
        id: 17,
        kind: 'file',
        nodeKind: 'root-node',
        parentId: 16,
        path: 'lib/entry.ts',
        preorderEnd: 17,
        preorderStart: 17,
        treeOrigin: 'lib',
      },
    ];
    const edges = [
      createEdge(
        'src/_src@shared/_types/start.type.ts',
        'lib/entry.ts',
        '../../lib/entry.js'
      ),
    ];
    const model = buildTestModel(crossTreeEntries, edges);
    expect(collectBranchOutcomes(model)).toEqual([]);
  });

  it('handles non-file or unclassified candidates safely', () => {
    const unclassifiedEntries: TModelEntry[] = [
      ...baseBranchEntries,
      {
        depth: 3,
        id: 18,
        kind: 'file',
        parentId: 3,
        path: 'src/_src@shared/_types/unclassified.ts',
        preorderEnd: 5,
        preorderStart: 5,
      },
    ];
    const edges = [
      createEdge(
        'src/_src@shared/_types/start.type.ts',
        'src/_src@shared/_types/unclassified.ts',
        './unclassified.js'
      ),
    ];
    const model = buildTestModel(unclassifiedEntries, edges);
    expect(collectBranchOutcomes(model)).toEqual([]);
  });

  it('handles external vertices in dependency graph without crash', () => {
    const edges = [
      createEdge(
        'src/_src@shared/_types/start.type.ts',
        'external.ts',
        '../../external.js'
      ),
      createEdge('external.ts', 'src/main.ts', './src/main.js'),
    ];
    const model = buildTestModel(baseBranchEntries, edges, ['external.ts']);
    const outcomes = collectBranchOutcomes(model);

    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.chain).toEqual([
      'src/_src@shared/_types/start.type.ts',
      'external.ts',
      'src/main.ts',
    ]);
  });

  it('skips non-violating memoized targets in incorporateMemoized', () => {
    const entries: TModelEntry[] = [
      ...baseBranchEntries,
      {
        depth: 3,
        id: 5,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 3,
        path: 'src/_src@shared/_types/safe.type.ts',
        preorderEnd: 5,
        preorderStart: 5,
      },
      {
        depth: 3,
        id: 6,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 3,
        path: 'src/_src@shared/_types/inter.type.ts',
        preorderEnd: 5,
        preorderStart: 5,
      },
    ];

    const edges = [
      createEdge(
        'src/_src@shared/_types/inter.type.ts',
        'src/main.ts',
        '../../main.js'
      ),
      createEdge(
        'src/_src@shared/_types/inter.type.ts',
        'src/_src@shared/_types/safe.type.ts',
        './safe.type.js'
      ),
      createEdge(
        'src/_src@shared/_types/start.type.ts',
        'src/_src@shared/_types/inter.type.ts',
        './inter.type.js'
      ),
    ];
    const model = buildTestModel(entries, edges);
    const outcomes = collectBranchOutcomes(model);

    const startOutcome = outcomes.find(
      (item) => item.from === 'src/_src@shared/_types/start.type.ts'
    );
    expect(startOutcome?.to).toBe('src/main.ts');
  });

  it('handles items with invalid parent identifiers safely', () => {
    const invalidParentEntries: TModelEntry[] = [
      {
        depth: 0,
        domainKind: 'root-fragment',
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src',
        preorderEnd: 3,
        preorderStart: 0,
      },
      {
        depth: 1,
        id: 1,
        kind: 'file',
        nodeKind: 'root-node',
        parentId: 999,
        path: 'src/orphan.ts',
        preorderEnd: 1,
        preorderStart: 1,
      },
    ];
    const model = buildTestModel(invalidParentEntries, []);
    expect(collectBranchOutcomes(model)).toEqual([]);
  });

  it('handles directory destinations without considering them eligible', () => {
    const edges = [
      createEdge(
        'src/_src@shared/_types/start.type.ts',
        'src',
        '../../index.js'
      ),
      createEdge(
        'src/_src@shared/_types/start.type.ts',
        'src/dangling.ts',
        '../../dangling.js'
      ),
      createEdge('src/_src@shared/_types', 'src/main.ts', '../main.js'),
    ];
    const model = buildTestModel(baseBranchEntries, edges, [
      'src',
      'src/_src@shared/_types',
      'src/dangling.ts',
    ]);
    const danglingModel: TVerificationModel = {
      ...model,
      basis: {
        ...model.basis,
        inventory: {
          ...model.basis.inventory,
          pathToId: new Map([
            ...model.basis.inventory.pathToId,
            ['src/dangling.ts', 999],
          ]),
        },
      },
    };
    expect(collectBranchOutcomes(danglingModel)).toEqual([]);
  });

  it('handles sparse graph structures with missing edges or targets safely', () => {
    const base = buildTestModel(baseBranchEntries, []);
    const sparseGraphMissingEdge: TDependencyGraph = {
      ...base.graph,
      columnTargets: new Int32Array([0]),
      edgeCount: 1,
      edgeMetadata: [],
      rowOffsets: new Int32Array([0, 0, 2]),
      vertexCount: 2,
    };
    const sparseModelMissingEdge: TVerificationModel = {
      ...base,
      graph: sparseGraphMissingEdge,
    };
    expect(collectBranchOutcomes(sparseModelMissingEdge)).toEqual([]);

    const sparseGraphMissingTarget: TDependencyGraph = {
      ...base.graph,
      columnTargets: new Int32Array(0),
      edgeCount: 0,
      edgeMetadata: [
        createEdge(
          'src/_src@shared/_types/start.type.ts',
          'src/main.ts',
          '../../main.js'
        ),
      ],
      rowOffsets: new Int32Array([0, 0, 1]),
      vertexCount: 2,
    };
    const sparseModelMissingTarget: TVerificationModel = {
      ...base,
      graph: sparseGraphMissingTarget,
    };
    expect(collectBranchOutcomes(sparseModelMissingTarget)).toEqual([]);
  });

  it('allows a nested Fractal Branch node to import a sibling Layer of its ancestor', () => {
    const entries: TModelEntry[] = [
      {
        depth: 0,
        domainKind: 'root-fragment',
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src',
        preorderEnd: 11,
        preorderStart: 0,
      },
      {
        depth: 1,
        domainKind: 'fractal-branch',
        id: 1,
        kind: 'directory',
        parentId: 0,
        path: 'src/_src@shared',
        preorderEnd: 11,
        preorderStart: 1,
      },
      {
        depth: 2,
        domainKind: 'layer',
        id: 2,
        kind: 'directory',
        parentId: 1,
        path: 'src/_src@shared/_domain',
        preorderEnd: 4,
        preorderStart: 2,
      },
      {
        depth: 3,
        domainKind: 'category',
        id: 3,
        kind: 'directory',
        parentId: 2,
        path: 'src/_src@shared/_domain/_schemas',
        preorderEnd: 4,
        preorderStart: 3,
      },
      {
        depth: 4,
        id: 4,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 3,
        path: 'src/_src@shared/_domain/_schemas/dto.schema.ts',
        preorderEnd: 4,
        preorderStart: 4,
      },
      {
        depth: 2,
        domainKind: 'layer',
        id: 5,
        kind: 'directory',
        parentId: 1,
        path: 'src/_src@shared/_network',
        preorderEnd: 10,
        preorderStart: 5,
      },
      {
        depth: 3,
        domainKind: 'category',
        id: 6,
        kind: 'directory',
        parentId: 5,
        path: 'src/_src@shared/_network/_apis',
        preorderEnd: 10,
        preorderStart: 6,
      },
      {
        depth: 4,
        domainKind: 'fractal-branch',
        id: 7,
        kind: 'directory',
        parentId: 6,
        path: 'src/_src@shared/_network/_apis/_apis@shared',
        preorderEnd: 10,
        preorderStart: 7,
      },
      {
        depth: 5,
        domainKind: 'category',
        id: 8,
        kind: 'directory',
        parentId: 7,
        path: 'src/_src@shared/_network/_apis/_apis@shared/_schemas',
        preorderEnd: 10,
        preorderStart: 8,
      },
      {
        depth: 6,
        id: 9,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 8,
        path: 'src/_src@shared/_network/_apis/_apis@shared/_schemas/paged.schema.ts',
        preorderEnd: 9,
        preorderStart: 9,
      },
    ];
    const edges = [
      createEdge(
        'src/_src@shared/_network/_apis/_apis@shared/_schemas/paged.schema.ts',
        'src/_src@shared/_domain/_schemas/dto.schema.ts',
        '../../../../_domain/_schemas/dto.schema.js'
      ),
    ];
    const model = buildTestModel(entries, edges);
    expect(collectBranchOutcomes(model)).toEqual([]);
  });
});
