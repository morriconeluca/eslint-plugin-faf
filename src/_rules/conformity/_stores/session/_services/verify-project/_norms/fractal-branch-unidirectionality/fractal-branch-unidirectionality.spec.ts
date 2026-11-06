import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TLogicalDomainKind,
  TNodeKind,
  TTaxonomyModel,
} from '../../_verify-project@shared/_types/_compounds/classification.type.js';
import type {
  TDependencyGraph,
  TEdgeMetadata,
} from '../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyFractalBranchUnidirectionality } from './index.js';

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
  extraPaths: readonly string[] = []
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
  const allVertices = [...new Set([...fileEntries, ...extraPaths])];
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
  specifier: string
): TEdgeMetadata => ({
  aliasAlternatives: [],
  aliasUsed: null,
  destinationPath: to,
  importIndex: 0,
  isTypeOnly: false,
  position: { column: 1, line: 1 },
  sourcePath: from,
  specifier,
  syntaxKind: 'named-import',
});

const branchTreeEntries: readonly TModelEntry[] = [
  {
    depth: 0,
    domainKind: 'root-fragment',
    id: 0,
    kind: 'directory',
    parentId: null,
    path: 'src',
    preorderEnd: 15,
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
    domainKind: 'root-fragment',
    id: 2,
    kind: 'directory',
    parentId: 0,
    path: 'src/child',
    preorderEnd: 3,
    preorderStart: 2,
  },
  {
    depth: 2,
    id: 3,
    kind: 'file',
    nodeKind: 'root-node',
    parentId: 2,
    path: 'src/child/entry.ts',
    preorderEnd: 3,
    preorderStart: 3,
  },
  {
    depth: 1,
    domainKind: 'category',
    id: 4,
    kind: 'directory',
    parentId: 0,
    path: 'src/_types',
    preorderEnd: 5,
    preorderStart: 4,
  },
  {
    depth: 2,
    id: 5,
    kind: 'file',
    nodeKind: 'category-node',
    parentId: 4,
    path: 'src/_types/other.type.ts',
    preorderEnd: 5,
    preorderStart: 5,
  },
  {
    depth: 1,
    domainKind: 'fractal-branch',
    id: 6,
    kind: 'directory',
    parentId: 0,
    path: 'src/_src@shared',
    preorderEnd: 8,
    preorderStart: 6,
  },
  {
    depth: 2,
    domainKind: 'category',
    id: 7,
    kind: 'directory',
    parentId: 6,
    path: 'src/_src@shared/_types',
    preorderEnd: 8,
    preorderStart: 7,
  },
  {
    depth: 3,
    id: 8,
    kind: 'file',
    nodeKind: 'category-node',
    parentId: 7,
    path: 'src/_src@shared/_types/start.type.ts',
    preorderEnd: 8,
    preorderStart: 8,
  },
  {
    depth: 1,
    domainKind: 'category',
    id: 9,
    kind: 'directory',
    parentId: 0,
    path: 'src/_utils',
    preorderEnd: 15,
    preorderStart: 9,
  },
  {
    depth: 2,
    domainKind: 'fragment',
    id: 10,
    kind: 'directory',
    parentId: 9,
    path: 'src/_utils/unit',
    preorderEnd: 15,
    preorderStart: 10,
  },
  {
    depth: 3,
    id: 11,
    kind: 'file',
    nodeKind: 'access-node',
    parentId: 10,
    path: 'src/_utils/unit/index.ts',
    preorderEnd: 11,
    preorderStart: 11,
  },
  {
    depth: 3,
    id: 12,
    kind: 'file',
    nodeKind: 'master-node',
    parentId: 10,
    path: 'src/_utils/unit/unit.util.ts',
    preorderEnd: 12,
    preorderStart: 12,
  },
  {
    depth: 3,
    domainKind: 'fractal-branch',
    id: 13,
    kind: 'directory',
    parentId: 10,
    path: 'src/_utils/unit/_unit@shared',
    preorderEnd: 15,
    preorderStart: 13,
  },
  {
    depth: 4,
    domainKind: 'category',
    id: 14,
    kind: 'directory',
    parentId: 13,
    path: 'src/_utils/unit/_unit@shared/_types',
    preorderEnd: 15,
    preorderStart: 14,
  },
  {
    depth: 5,
    id: 15,
    kind: 'file',
    nodeKind: 'category-node',
    parentId: 14,
    path: 'src/_utils/unit/_unit@shared/_types/deep.type.ts',
    preorderEnd: 15,
    preorderStart: 15,
  },
];

describe('verifyFractalBranchUnidirectionality', () => {
  it.each([
    ['direct parent node', 'src/main.ts', '../../main.js'],
    [
      'private Access Node',
      'src/_utils/unit/index.ts',
      '../../_utils/unit/index.js',
    ],
    [
      'sibling Category Node',
      'src/_types/other.type.ts',
      '../../_types/other.type.js',
    ],
    ['child Root Node', 'src/child/entry.ts', '../../child/entry.js'],
    [
      'nested sibling Branch node',
      'src/_utils/unit/_unit@shared/_types/deep.type.ts',
      '../../_utils/unit/_unit@shared/_types/deep.type.js',
    ],
  ])('rejects a direct Branch return to a %s', (_label, target, specifier) => {
    const source = 'src/_src@shared/_types/start.type.ts';
    const edges = [createEdge(source, target, specifier)];
    const model = buildTestModel(branchTreeEntries, edges);
    const outcomes = verifyFractalBranchUnidirectionality(model);

    expect(outcomes).toEqual([
      expect.objectContaining({
        constraint: 'dependency/fractal-branch-unidirectionality',
        from: source,
        specifier,
        to: target,
      }),
    ]);
  });

  it('detects violations along a chain A -> X -> Y -> Z with three sources', () => {
    const chainEntries: TModelEntry[] = [
      ...branchTreeEntries,
      {
        depth: 3,
        id: 16,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 7,
        path: 'src/_src@shared/_types/middle.type.ts',
        preorderEnd: 8,
        preorderStart: 8,
      },
      {
        depth: 3,
        id: 17,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 7,
        path: 'src/_src@shared/_types/last.type.ts',
        preorderEnd: 8,
        preorderStart: 8,
      },
    ];

    const edges = [
      createEdge(
        'src/_src@shared/_types/start.type.ts',
        'src/_src@shared/_types/middle.type.ts',
        './middle.type.js'
      ),
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

    const model = buildTestModel(chainEntries, edges);
    const outcomes = verifyFractalBranchUnidirectionality(model);

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
      expect.objectContaining({
        chain: [
          'src/_src@shared/_types/start.type.ts',
          'src/_src@shared/_types/middle.type.ts',
          'src/_src@shared/_types/last.type.ts',
          'src/_types/other.type.ts',
        ],
        from: 'src/_src@shared/_types/start.type.ts',
        to: 'src/_types/other.type.ts',
      }),
    ]);
  });

  it('allows a local Branch to consume an accessible ancestor Branch', () => {
    const edges = [
      createEdge(
        'src/_utils/unit/_unit@shared/_types/deep.type.ts',
        'src/_src@shared/_types/start.type.ts',
        '../../../../_src@shared/_types/start.type.js'
      ),
    ];
    const model = buildTestModel(branchTreeEntries, edges);
    expect(verifyFractalBranchUnidirectionality(model)).toEqual([]);
  });

  it('detects returns through external code outside all Fractal Trees', () => {
    const edges = [
      createEdge(
        'src/_src@shared/_types/start.type.ts',
        'external.ts',
        '../../external.js'
      ),
      createEdge('external.ts', 'src/main.ts', './src/main.js'),
    ];
    const model = buildTestModel(branchTreeEntries, edges, ['external.ts']);
    const outcomes = verifyFractalBranchUnidirectionality(model);

    expect(outcomes).toEqual([
      expect.objectContaining({
        chain: [
          'src/_src@shared/_types/start.type.ts',
          'external.ts',
          'src/main.ts',
        ],
        from: 'src/_src@shared/_types/start.type.ts',
        to: 'src/main.ts',
      }),
    ]);
  });

  it('detects returns through another Fractal Tree', () => {
    const interTreeEntries: TModelEntry[] = [
      ...branchTreeEntries,
      {
        depth: 0,
        domainKind: 'root-fragment',
        id: 18,
        kind: 'directory',
        parentId: null,
        path: 'lib',
        preorderEnd: 20,
        preorderStart: 18,
        treeOrigin: 'lib',
      },
      {
        depth: 1,
        id: 19,
        kind: 'file',
        nodeKind: 'root-node',
        parentId: 18,
        path: 'lib/entry.ts',
        preorderEnd: 19,
        preorderStart: 19,
        treeOrigin: 'lib',
      },
    ];

    const edges = [
      createEdge(
        'src/_src@shared/_types/start.type.ts',
        'lib/entry.ts',
        '../../lib/entry.js'
      ),
      createEdge('lib/entry.ts', 'src/main.ts', '../src/main.js'),
    ];

    const model = buildTestModel(interTreeEntries, edges);
    const outcomes = verifyFractalBranchUnidirectionality(model);

    expect(outcomes).toEqual([
      expect.objectContaining({
        chain: [
          'src/_src@shared/_types/start.type.ts',
          'lib/entry.ts',
          'src/main.ts',
        ],
        from: 'src/_src@shared/_types/start.type.ts',
        to: 'src/main.ts',
      }),
    ]);
  });

  it('governs nested Branches correctly within Compound Component architecture', () => {
    const nestedEntries: TModelEntry[] = [
      {
        depth: 0,
        domainKind: 'root-fragment',
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src',
        preorderEnd: 20,
        preorderStart: 0,
      },
      {
        depth: 1,
        domainKind: 'category',
        id: 1,
        kind: 'directory',
        parentId: 0,
        path: 'src/_components',
        preorderEnd: 20,
        preorderStart: 1,
      },
      {
        depth: 2,
        domainKind: 'fragment',
        id: 2,
        kind: 'directory',
        parentId: 1,
        path: 'src/_components/table',
        preorderEnd: 20,
        preorderStart: 2,
      },
      {
        depth: 3,
        id: 3,
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 2,
        path: 'src/_components/table/table.component.ts',
        preorderEnd: 3,
        preorderStart: 3,
      },
      {
        depth: 3,
        domainKind: 'fractal-branch',
        id: 4,
        kind: 'directory',
        parentId: 2,
        path: 'src/_components/table/_table@shared',
        preorderEnd: 7,
        preorderStart: 4,
      },
      {
        depth: 4,
        domainKind: 'category',
        id: 5,
        kind: 'directory',
        parentId: 4,
        path: 'src/_components/table/_table@shared/_types',
        preorderEnd: 7,
        preorderStart: 5,
      },
      {
        depth: 5,
        id: 6,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 5,
        path: 'src/_components/table/_table@shared/_types/table-sort.type.ts',
        preorderEnd: 6,
        preorderStart: 6,
      },
      {
        depth: 3,
        domainKind: 'category',
        id: 7,
        kind: 'directory',
        parentId: 2,
        path: 'src/_components/table/_components',
        preorderEnd: 15,
        preorderStart: 7,
      },
      {
        depth: 4,
        domainKind: 'fractal-branch',
        id: 8,
        kind: 'directory',
        parentId: 7,
        path: 'src/_components/table/_components/_components@shared',
        preorderEnd: 11,
        preorderStart: 8,
      },
      {
        depth: 5,
        domainKind: 'category',
        id: 9,
        kind: 'directory',
        parentId: 8,
        path: 'src/_components/table/_components/_components@shared/_hooks',
        preorderEnd: 11,
        preorderStart: 9,
      },
      {
        depth: 6,
        domainKind: 'fragment',
        id: 10,
        kind: 'directory',
        parentId: 9,
        path: 'src/_components/table/_components/_components@shared/_hooks/use-table-context',
        preorderEnd: 11,
        preorderStart: 10,
      },
      {
        depth: 7,
        id: 11,
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 10,
        path: 'src/_components/table/_components/_components@shared/_hooks/use-table-context/use-table-context.hook.ts',
        preorderEnd: 11,
        preorderStart: 11,
      },
      {
        depth: 4,
        domainKind: 'fragment',
        id: 12,
        kind: 'directory',
        parentId: 7,
        path: 'src/_components/table/_components/table-row',
        preorderEnd: 15,
        preorderStart: 12,
      },
      {
        depth: 5,
        id: 13,
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 12,
        path: 'src/_components/table/_components/table-row/table-row.component.ts',
        preorderEnd: 13,
        preorderStart: 13,
      },
    ];

    const source =
      'src/_components/table/_components/_components@shared/_hooks/use-table-context/use-table-context.hook.ts';

    const ancestorAllowedEdges = [
      createEdge(
        source,
        'src/_components/table/_table@shared/_types/table-sort.type.ts',
        '../../../_table@shared/_types/table-sort.type.js'
      ),
    ];
    const allowedModel = buildTestModel(nestedEntries, ancestorAllowedEdges);
    expect(verifyFractalBranchUnidirectionality(allowedModel)).toEqual([]);

    const directParentViolationEdges = [
      createEdge(
        source,
        'src/_components/table/table.component.ts',
        '../../../../table.component.js'
      ),
    ];
    const parentViolationModel = buildTestModel(
      nestedEntries,
      directParentViolationEdges
    );
    const parentOutcomes =
      verifyFractalBranchUnidirectionality(parentViolationModel);
    expect(parentOutcomes).toEqual([
      expect.objectContaining({
        from: source,
        to: 'src/_components/table/table.component.ts',
      }),
    ]);

    const siblingSubtreeViolationEdges = [
      createEdge(
        source,
        'src/_components/table/_components/table-row/table-row.component.ts',
        '../../../table-row/table-row.component.js'
      ),
    ];
    const siblingViolationModel = buildTestModel(
      nestedEntries,
      siblingSubtreeViolationEdges
    );
    const siblingOutcomes = verifyFractalBranchUnidirectionality(
      siblingViolationModel
    );
    expect(siblingOutcomes).toEqual([
      expect.objectContaining({
        from: source,
        to: 'src/_components/table/_components/table-row/table-row.component.ts',
      }),
    ]);
  });

  it('guarantees deterministic output under input permutation', () => {
    const chainEntries: TModelEntry[] = [
      ...branchTreeEntries,
      {
        depth: 3,
        id: 16,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 7,
        path: 'src/_src@shared/_types/middle.type.ts',
        preorderEnd: 8,
        preorderStart: 8,
      },
      {
        depth: 3,
        id: 17,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 7,
        path: 'src/_src@shared/_types/last.type.ts',
        preorderEnd: 8,
        preorderStart: 8,
      },
    ];

    const edgeA = createEdge(
      'src/_src@shared/_types/start.type.ts',
      'src/_src@shared/_types/middle.type.ts',
      './middle.type.js'
    );
    const edgeB = createEdge(
      'src/_src@shared/_types/middle.type.ts',
      'src/_src@shared/_types/last.type.ts',
      './last.type.js'
    );
    const edgeC = createEdge(
      'src/_src@shared/_types/last.type.ts',
      'src/_types/other.type.ts',
      '../../_types/other.type.js'
    );

    const model1 = buildTestModel(chainEntries, [edgeA, edgeB, edgeC]);
    const model2 = buildTestModel(chainEntries, [edgeC, edgeA, edgeB]);

    const outcomes1 = verifyFractalBranchUnidirectionality(model1);
    const outcomes2 = verifyFractalBranchUnidirectionality(model2);

    expect(outcomes1).toEqual(outcomes2);
  });

  it('sorts multiple outcomes deterministically using compareBranchOutcomes', () => {
    const edges = [
      createEdge(
        'src/_src@shared/_types/start.type.ts',
        'src/main.ts',
        '../../main.js'
      ),
      createEdge(
        'src/_utils/unit/_unit@shared/_types/deep.type.ts',
        'src/main.ts',
        '../../../../main.js'
      ),
    ];
    const model = buildTestModel(branchTreeEntries, edges);
    const outcomes = verifyFractalBranchUnidirectionality(model);

    expect(outcomes.map((item) => ('from' in item ? item.from : ''))).toEqual([
      'src/_src@shared/_types/start.type.ts',
      'src/_utils/unit/_unit@shared/_types/deep.type.ts',
    ]);
  });

  it('does not mutate the verification model', () => {
    const edges = [
      createEdge(
        'src/_src@shared/_types/start.type.ts',
        'src/main.ts',
        '../../main.js'
      ),
    ];
    const model = buildTestModel(branchTreeEntries, edges);
    const snapshot = JSON.stringify(model);

    verifyFractalBranchUnidirectionality(model);

    expect(JSON.stringify(model)).toBe(snapshot);
  });
});
