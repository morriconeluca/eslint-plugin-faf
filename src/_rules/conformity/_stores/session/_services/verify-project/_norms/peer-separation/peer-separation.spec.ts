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
import type { THorizontalHierarchies } from '../../_verify-project@shared/_types/_compounds/horizontal-hierarchies.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyPeerSeparation } from './peer-separation.norm.js';

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
  readonly treeOrigin?: string;
};

const createEdge = (
  from: string,
  to: string,
  specifier: string,
  importIndex = 0
): TEdgeMetadata => ({
  aliasAlternatives: [],
  aliasUsed: null,
  destinationPath: to,
  importIndex,
  isTypeOnly: false,
  position: { column: 1, line: importIndex + 1 },
  sourcePath: from,
  specifier,
  syntaxKind: 'named-import',
});

const defaultHierarchies: THorizontalHierarchies = {
  conflicts: [],
  sets: [],
};

const buildTestModel = (
  entries: readonly TModelEntry[],
  edges: readonly TEdgeMetadata[],
  hierarchies: THorizontalHierarchies = defaultHierarchies
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
      treeOrigin: entry.treeOrigin ?? 'src',
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
  const base = verificationModel();

  const graph: TDependencyGraph = {
    ...base.graph,
    edgeCount: edges.length,
    edgeMetadata: edges,
  };

  return {
    ...base,
    basis: {
      ...base.basis,
      inventory,
    },
    graph,
    hierarchies,
    taxonomy,
  };
};

describe('verifyPeerSeparation', () => {
  const referenceInternalRanks: readonly (readonly [
    string,
    number,
    string,
    number,
    boolean,
  ])[] = [
    ['component', 16, 'hook', 15, true],
    ['component', 16, 'type', 6, true],
    ['hook', 15, 'constant', 2, true],
    ['type', 6, 'component', 16, false],
    ['hook', 15, 'handler', 15, false],
    ['handler', 15, 'hook', 15, false],
    ['index', 17, 'component', 16, true],
    ['spec', 17, 'component', 16, true],
    ['story', 17, 'type', 6, true],
    ['component', 16, 'index', 17, false],
    ['spec', 17, 'index', 17, false],
    ['story', 17, 'index', 17, false],
    ['index', 17, 'spec', 17, false],
    ['spec', 17, 'story', 17, false],
    ['markup', 1, 'constant', 2, false],
    ['constant', 2, 'markup', 1, true],
    ['module', 1, 'constant', 2, false],
    ['style', 1, 'constant', 2, false],
    ['constant', 2, 'module', 1, true],
    ['constant', 2, 'style', 1, true],
  ];

  it.each(referenceInternalRanks)(
    'evaluates reference internal rank row: %s (rank %d) to %s (rank %d) -> allowed: %s',
    (fromName, fromRank, toName, toRank, allowed) => {
      const fromFile =
        fromName === 'index' ? 'index.ts' : `unit.${fromName}.ts`;
      const toFile = toName === 'index' ? 'index.ts' : `unit.${toName}.ts`;
      const fromPath = `src/_components/unit/${fromFile}`;
      const toPath = `src/_components/unit/${toFile}`;

      const entries: TModelEntry[] = [
        {
          depth: 0,
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
          preorderEnd: 4,
          preorderStart: 0,
        },
        {
          depth: 1,
          domainKind: 'category',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_components',
          preorderEnd: 4,
          preorderStart: 1,
        },
        {
          depth: 2,
          domainKind: 'fragment',
          id: 2,
          kind: 'directory',
          parentId: 1,
          path: 'src/_components/unit',
          preorderEnd: 4,
          preorderStart: 2,
        },
        {
          depth: 3,
          id: 3,
          kind: 'file',
          nodeKind: fromName === 'index' ? 'access-node' : 'fragment-node',
          parentId: 2,
          path: fromPath,
          preorderEnd: 3,
          preorderStart: 3,
        },
        {
          depth: 3,
          id: 4,
          kind: 'file',
          nodeKind: toName === 'index' ? 'access-node' : 'fragment-node',
          parentId: 2,
          path: toPath,
          preorderEnd: 4,
          preorderStart: 4,
        },
      ];

      const hierarchies: THorizontalHierarchies = {
        conflicts: [],
        sets: [
          {
            id: 1,
            isOrderable: true,
            origin: 'fragment-internal',
            parentPath: 'src/_components/unit',
            repetitions: [],
            siblings: [
              { itemId: 3, rank: fromRank },
              { itemId: 4, rank: toRank },
            ],
          },
        ],
      };

      const edge = createEdge(fromPath, toPath, `./${toFile}`);
      const model = buildTestModel(entries, [edge], hierarchies);
      const outcomes = verifyPeerSeparation(model);

      if (allowed) {
        expect(outcomes).toEqual([]);
      } else {
        expect(outcomes).toEqual([
          expect.objectContaining({
            constraint: 'dependency/peer-separation',
            from: fromPath,
            to: toPath,
          }),
        ]);
      }
    }
  );

  it.each([
    {
      expectedViolation: true,
      hierarchies: {
        conflicts: [],
        sets: [
          {
            id: 1,
            isOrderable: true,
            origin: 'general' as const,
            parentPath: 'src',
            repetitions: [],
            siblings: [
              { itemId: 1, rank: 1 },
              { itemId: 2, rank: 1 },
            ],
          },
        ],
      },
      name: 'equal ranks',
    },
    {
      expectedViolation: true,
      hierarchies: {
        conflicts: [],
        sets: [
          {
            id: 1,
            isOrderable: true,
            origin: 'general' as const,
            parentPath: 'src',
            repetitions: [],
            siblings: [
              { itemId: 1, rank: 0 },
              { itemId: 2, rank: 2 },
            ],
          },
        ],
      },
      name: 'ascending ranks',
    },
    {
      expectedViolation: true,
      hierarchies: {
        conflicts: [],
        sets: [
          {
            id: 1,
            isOrderable: true,
            origin: 'general' as const,
            parentPath: 'src',
            repetitions: [],
            siblings: [{ itemId: 1, rank: 1 }],
          },
        ],
      },
      name: 'unselected partition',
    },
  ])(
    'enforces adversary hierarchy conditions: $name',
    ({ expectedViolation, hierarchies }) => {
      const entries: TModelEntry[] = [
        {
          depth: 0,
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
          preorderEnd: 4,
          preorderStart: 0,
        },
        {
          depth: 1,
          domainKind: 'category',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_high',
          preorderEnd: 2,
          preorderStart: 1,
        },
        {
          depth: 1,
          domainKind: 'category',
          id: 2,
          kind: 'directory',
          parentId: 0,
          path: 'src/_low',
          preorderEnd: 4,
          preorderStart: 3,
        },
        {
          depth: 2,
          id: 3,
          kind: 'file',
          nodeKind: 'category-node',
          parentId: 1,
          path: 'src/_high/a.type.ts',
          preorderEnd: 2,
          preorderStart: 2,
        },
        {
          depth: 2,
          id: 4,
          kind: 'file',
          nodeKind: 'category-node',
          parentId: 2,
          path: 'src/_low/b.type.ts',
          preorderEnd: 4,
          preorderStart: 4,
        },
      ];

      const edge = createEdge(
        'src/_high/a.type.ts',
        'src/_low/b.type.ts',
        '../_low/b.type.js'
      );
      const model = buildTestModel(entries, [edge], hierarchies);
      const outcomes = verifyPeerSeparation(model);

      if (expectedViolation) {
        expect(outcomes).toHaveLength(1);
        expect(outcomes[0]?.constraint).toBe('dependency/peer-separation');
      } else {
        expect(outcomes).toEqual([]);
      }
    }
  );

  it('rejects dependency between disjoint hierarchies under the same parent', () => {
    const entries: TModelEntry[] = [
      {
        depth: 0,
        domainKind: 'root-layer',
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src',
        preorderEnd: 8,
        preorderStart: 0,
      },
      {
        depth: 1,
        domainKind: 'layer',
        id: 1,
        kind: 'directory',
        parentId: 0,
        path: 'src/_domain',
        preorderEnd: 2,
        preorderStart: 1,
      },
      {
        depth: 1,
        domainKind: 'layer',
        id: 2,
        kind: 'directory',
        parentId: 0,
        path: 'src/_ui',
        preorderEnd: 4,
        preorderStart: 3,
      },
      {
        depth: 1,
        domainKind: 'category',
        id: 3,
        kind: 'directory',
        parentId: 0,
        path: 'src/_left',
        preorderEnd: 6,
        preorderStart: 5,
      },
      {
        depth: 1,
        domainKind: 'category',
        id: 4,
        kind: 'directory',
        parentId: 0,
        path: 'src/_right',
        preorderEnd: 8,
        preorderStart: 7,
      },
      {
        depth: 2,
        id: 5,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 2,
        path: 'src/_ui/view.ts',
        preorderEnd: 4,
        preorderStart: 4,
      },
      {
        depth: 2,
        id: 6,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 3,
        path: 'src/_left/data.ts',
        preorderEnd: 6,
        preorderStart: 6,
      },
    ];

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
            { itemId: 1, rank: 0 },
            { itemId: 2, rank: 1 },
          ],
        },
        {
          id: 2,
          isOrderable: true,
          origin: 'general',
          parentPath: 'src',
          repetitions: [],
          siblings: [
            { itemId: 3, rank: 0 },
            { itemId: 4, rank: 1 },
          ],
        },
      ],
    };

    const edge = createEdge(
      'src/_ui/view.ts',
      'src/_left/data.ts',
      '../_left/data.js'
    );
    const model = buildTestModel(entries, [edge], hierarchies);
    const outcomes = verifyPeerSeparation(model);

    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.constraint).toBe('dependency/peer-separation');
  });

  it('does not let an ancestor Layer hierarchy order internal Category Node peers', () => {
    const entries: TModelEntry[] = [
      {
        depth: 0,
        domainKind: 'root-layer',
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src',
        preorderEnd: 5,
        preorderStart: 0,
      },
      {
        depth: 1,
        domainKind: 'layer',
        id: 1,
        kind: 'directory',
        parentId: 0,
        path: 'src/_low',
        preorderEnd: 1,
        preorderStart: 1,
      },
      {
        depth: 1,
        domainKind: 'layer',
        id: 2,
        kind: 'directory',
        parentId: 0,
        path: 'src/_high',
        preorderEnd: 5,
        preorderStart: 2,
      },
      {
        depth: 2,
        domainKind: 'category',
        id: 3,
        kind: 'directory',
        parentId: 2,
        path: 'src/_high/_types',
        preorderEnd: 5,
        preorderStart: 3,
      },
      {
        depth: 3,
        id: 4,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 3,
        path: 'src/_high/_types/a.type.ts',
        preorderEnd: 4,
        preorderStart: 4,
      },
      {
        depth: 3,
        id: 5,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 3,
        path: 'src/_high/_types/b.type.ts',
        preorderEnd: 5,
        preorderStart: 5,
      },
    ];

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
            { itemId: 1, rank: 0 },
            { itemId: 2, rank: 1 },
          ],
        },
      ],
    };

    const edge = createEdge(
      'src/_high/_types/a.type.ts',
      'src/_high/_types/b.type.ts',
      './b.type.js'
    );
    const model = buildTestModel(entries, [edge], hierarchies);
    const outcomes = verifyPeerSeparation(model);

    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.constraint).toBe('dependency/peer-separation');
  });

  it('rejects dependency between Path Fragments at different coordinate depths', () => {
    const entries: TModelEntry[] = [
      {
        depth: 0,
        domainKind: 'root-layer',
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src',
        preorderEnd: 7,
        preorderStart: 0,
      },
      {
        depth: 1,
        domainKind: 'category',
        id: 1,
        kind: 'directory',
        parentId: 0,
        path: 'src/_apis',
        preorderEnd: 7,
        preorderStart: 1,
      },
      {
        depth: 2,
        domainKind: 'path-sub-category',
        id: 2,
        kind: 'directory',
        parentId: 1,
        path: 'src/_apis/_todos',
        preorderEnd: 7,
        preorderStart: 2,
      },
      {
        depth: 3,
        domainKind: 'fragment',
        id: 3,
        kind: 'directory',
        parentId: 2,
        path: 'src/_apis/_todos/get-todos',
        preorderEnd: 4,
        preorderStart: 3,
      },
      {
        depth: 4,
        id: 4,
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 3,
        path: 'src/_apis/_todos/get-todos/get-todos.api.ts',
        preorderEnd: 4,
        preorderStart: 4,
      },
      {
        depth: 3,
        domainKind: 'path-sub-category',
        id: 5,
        kind: 'directory',
        parentId: 2,
        path: 'src/_apis/_todos/_[todo-id]',
        preorderEnd: 7,
        preorderStart: 5,
      },
      {
        depth: 4,
        domainKind: 'fragment',
        id: 6,
        kind: 'directory',
        parentId: 5,
        path: 'src/_apis/_todos/_[todo-id]/get-todo',
        preorderEnd: 7,
        preorderStart: 6,
      },
      {
        depth: 5,
        id: 7,
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 6,
        path: 'src/_apis/_todos/_[todo-id]/get-todo/index.ts',
        preorderEnd: 7,
        preorderStart: 7,
      },
    ];

    const edge = createEdge(
      'src/_apis/_todos/get-todos/get-todos.api.ts',
      'src/_apis/_todos/_[todo-id]/get-todo/index.ts',
      '../_[todo-id]/get-todo/index.js'
    );
    const model = buildTestModel(entries, [edge]);
    const outcomes = verifyPeerSeparation(model);

    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.constraint).toBe('dependency/peer-separation');
  });

  it('rejects CSS import between sibling Category Nodes', () => {
    const entries: TModelEntry[] = [
      {
        depth: 0,
        domainKind: 'root-layer',
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src',
        preorderEnd: 3,
        preorderStart: 0,
      },
      {
        depth: 1,
        domainKind: 'category',
        id: 1,
        kind: 'directory',
        parentId: 0,
        path: 'src/_styles',
        preorderEnd: 3,
        preorderStart: 1,
      },
      {
        depth: 2,
        id: 2,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 1,
        path: 'src/_styles/a.css',
        preorderEnd: 2,
        preorderStart: 2,
      },
      {
        depth: 2,
        id: 3,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 1,
        path: 'src/_styles/b.css',
        preorderEnd: 3,
        preorderStart: 3,
      },
    ];

    const edge = createEdge(
      'src/_styles/a.css',
      'src/_styles/b.css',
      './b.css'
    );
    const model = buildTestModel(entries, [edge]);
    const outcomes = verifyPeerSeparation(model);

    expect(outcomes).toEqual([
      expect.objectContaining({
        constraint: 'dependency/peer-separation',
        from: 'src/_styles/a.css',
        to: 'src/_styles/b.css',
      }),
    ]);
  });

  it('maintains deterministic outcome ordering under any permutation of input edges', () => {
    const entries: TModelEntry[] = [
      {
        depth: 0,
        domainKind: 'root-layer',
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src',
        preorderEnd: 6,
        preorderStart: 0,
      },
      {
        depth: 1,
        domainKind: 'category',
        id: 1,
        kind: 'directory',
        parentId: 0,
        path: 'src/_utils',
        preorderEnd: 6,
        preorderStart: 1,
      },
      {
        depth: 2,
        domainKind: 'fragment',
        id: 2,
        kind: 'directory',
        parentId: 1,
        path: 'src/_utils/first',
        preorderEnd: 3,
        preorderStart: 2,
      },
      {
        depth: 3,
        id: 3,
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 2,
        path: 'src/_utils/first/first.util.ts',
        preorderEnd: 3,
        preorderStart: 3,
      },
      {
        depth: 2,
        domainKind: 'fragment',
        id: 4,
        kind: 'directory',
        parentId: 1,
        path: 'src/_utils/second',
        preorderEnd: 5,
        preorderStart: 4,
      },
      {
        depth: 3,
        id: 5,
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 4,
        path: 'src/_utils/second/second.util.ts',
        preorderEnd: 5,
        preorderStart: 5,
      },
      {
        depth: 2,
        domainKind: 'fragment',
        id: 6,
        kind: 'directory',
        parentId: 1,
        path: 'src/_utils/third',
        preorderEnd: 6,
        preorderStart: 6,
      },
      {
        depth: 3,
        id: 7,
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 6,
        path: 'src/_utils/third/third.util.ts',
        preorderEnd: 6,
        preorderStart: 6,
      },
    ];

    const edgeA = createEdge(
      'src/_utils/first/first.util.ts',
      'src/_utils/second/second.util.ts',
      '../second/second.util.js',
      0
    );
    const edgeB = createEdge(
      'src/_utils/first/first.util.ts',
      'src/_utils/third/third.util.ts',
      '../third/third.util.js',
      1
    );

    const modelDirect = buildTestModel(entries, [edgeA, edgeB]);
    const modelReversed = buildTestModel(entries, [edgeB, edgeA]);

    const outcomesDirect = verifyPeerSeparation(modelDirect);
    const outcomesReversed = verifyPeerSeparation(modelReversed);

    expect(outcomesDirect).toEqual(outcomesReversed);
    expect(outcomesDirect).toHaveLength(2);
  });

  it('does not mutate the verification model', () => {
    const entries: TModelEntry[] = [
      {
        depth: 0,
        domainKind: 'root-layer',
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src',
        preorderEnd: 4,
        preorderStart: 0,
      },
      {
        depth: 1,
        domainKind: 'category',
        id: 1,
        kind: 'directory',
        parentId: 0,
        path: 'src/_utils',
        preorderEnd: 4,
        preorderStart: 1,
      },
      {
        depth: 2,
        domainKind: 'fragment',
        id: 2,
        kind: 'directory',
        parentId: 1,
        path: 'src/_utils/unit',
        preorderEnd: 4,
        preorderStart: 2,
      },
      {
        depth: 3,
        id: 3,
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 2,
        path: 'src/_utils/unit/unit.util.ts',
        preorderEnd: 3,
        preorderStart: 3,
      },
      {
        depth: 3,
        id: 4,
        kind: 'file',
        nodeKind: 'fragment-node',
        parentId: 2,
        path: 'src/_utils/unit/unit.type.ts',
        preorderEnd: 4,
        preorderStart: 4,
      },
    ];

    const model = buildTestModel(entries, [
      createEdge(
        'src/_utils/unit/unit.util.ts',
        'src/_utils/unit/unit.type.ts',
        './unit.type.js'
      ),
    ]);

    const snapshot = JSON.stringify(model);
    verifyPeerSeparation(model);
    expect(JSON.stringify(model)).toBe(snapshot);
  });
});
