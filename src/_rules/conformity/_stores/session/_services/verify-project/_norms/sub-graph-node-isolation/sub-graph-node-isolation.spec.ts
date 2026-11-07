import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
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
import { verifySubGraphNodeIsolation } from './sub-graph-node-isolation.norm.js';

type TModelEntry = {
  readonly depth: number;
  readonly domainKind?: 'category' | 'fragment';
  readonly id: number;
  readonly kind: 'directory' | 'file';
  readonly nodeKind?:
    | 'access-node'
    | 'category-node'
    | 'foreign-node'
    | 'fragment-node'
    | 'master-node'
    | 'root-node'
    | 'sub-graph-node'
    | 'unauthorized-logical-node';
  readonly parentId: null | number;
  readonly path: string;
  readonly preorderEnd: number;
  readonly preorderStart: number;
  readonly treeOrigin?: string;
};

const baseEntries: readonly TModelEntry[] = [
  {
    depth: 0,
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
    domainKind: 'category',
    id: 2,
    kind: 'directory',
    parentId: 0,
    path: 'src/_components',
    preorderEnd: 10,
    preorderStart: 2,
  },
  {
    depth: 2,
    domainKind: 'fragment',
    id: 3,
    kind: 'directory',
    parentId: 2,
    path: 'src/_components/table',
    preorderEnd: 10,
    preorderStart: 3,
  },
  {
    depth: 3,
    id: 4,
    kind: 'file',
    nodeKind: 'master-node',
    parentId: 3,
    path: 'src/_components/table/table.component.ts',
    preorderEnd: 4,
    preorderStart: 4,
  },
  {
    depth: 3,
    id: 5,
    kind: 'file',
    nodeKind: 'access-node',
    parentId: 3,
    path: 'src/_components/table/index.ts',
    preorderEnd: 5,
    preorderStart: 5,
  },
  {
    depth: 3,
    id: 6,
    kind: 'file',
    nodeKind: 'sub-graph-node',
    parentId: 3,
    path: 'src/_components/table/table.spec.ts',
    preorderEnd: 6,
    preorderStart: 6,
  },
  {
    depth: 3,
    id: 7,
    kind: 'file',
    nodeKind: 'sub-graph-node',
    parentId: 3,
    path: 'src/_components/table/table.story.ts',
    preorderEnd: 7,
    preorderStart: 7,
  },
  {
    depth: 3,
    domainKind: 'category',
    id: 8,
    kind: 'directory',
    parentId: 3,
    path: 'src/_components/table/_components',
    preorderEnd: 10,
    preorderStart: 8,
  },
  {
    depth: 4,
    domainKind: 'fragment',
    id: 9,
    kind: 'directory',
    parentId: 8,
    path: 'src/_components/table/_components/child',
    preorderEnd: 10,
    preorderStart: 9,
  },
  {
    depth: 5,
    id: 10,
    kind: 'file',
    nodeKind: 'master-node',
    parentId: 9,
    path: 'src/_components/table/_components/child/child.component.ts',
    preorderEnd: 10,
    preorderStart: 10,
  },
  {
    depth: 1,
    domainKind: 'category',
    id: 11,
    kind: 'directory',
    parentId: 0,
    path: 'src/_utils',
    preorderEnd: 14,
    preorderStart: 11,
  },
  {
    depth: 2,
    domainKind: 'fragment',
    id: 12,
    kind: 'directory',
    parentId: 11,
    path: 'src/_utils/other',
    preorderEnd: 14,
    preorderStart: 12,
  },
  {
    depth: 3,
    id: 13,
    kind: 'file',
    nodeKind: 'master-node',
    parentId: 12,
    path: 'src/_utils/other/other.util.ts',
    preorderEnd: 13,
    preorderStart: 13,
  },
  {
    depth: 3,
    id: 14,
    kind: 'file',
    nodeKind: 'sub-graph-node',
    parentId: 12,
    path: 'src/_utils/other/other.spec.ts',
    preorderEnd: 14,
    preorderStart: 14,
  },
  {
    depth: 1,
    id: 15,
    kind: 'file',
    nodeKind: 'foreign-node',
    parentId: 0,
    path: 'src/README.md',
    preorderEnd: 15,
    preorderStart: 15,
  },
];

const buildTestModel = (
  edges: readonly TEdgeMetadata[]
): TVerificationModel => {
  const items: TInventoryItem[] = [];
  const pathToId = new Map<string, number>();
  const realPathToId = new Map<string, number>();
  const byItemId = new Map<number, TItemClassification>();
  const byPath = new Map<string, TItemClassification>();
  const classifications: TItemClassification[] = [];

  for (const entry of baseEntries) {
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
    taxonomy,
  };
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

describe('verifySubGraphNodeIsolation', () => {
  it.each([
    [
      'Fragment Node of the same Fragment',
      'src/_components/table/table.component.ts',
      './table.spec.js',
    ],
    [
      'Access Node of the same Fragment',
      'src/_components/table/index.ts',
      './table.spec.js',
    ],
    [
      'another Sub-Graph Node of the same Fragment',
      'src/_components/table/table.story.ts',
      './table.spec.js',
    ],
    [
      'a node in a Sub-Fragment',
      'src/_components/table/_components/child/child.component.ts',
      '../../table.spec.js',
    ],
    ['a Root Node', 'src/main.ts', './_components/table/table.spec.js'],
    [
      'a node of another Execution Sub-Graph',
      'src/_utils/other/other.spec.ts',
      '../../_components/table/table.spec.js',
    ],
  ] as const)(
    'forbids any table consumer from importing a Sub-Graph Node: %s',
    (_label, sourcePath, specifier) => {
      const destinationPath = 'src/_components/table/table.spec.ts';
      const edge = createEdge(sourcePath, destinationPath, specifier, 0);
      const model = buildTestModel([edge]);
      const outcomes = verifySubGraphNodeIsolation(model);

      expect(outcomes).toHaveLength(1);
      const outcome = outcomes[0];
      expect(outcome?.constraint).toBe('dependency/sub-graph-node-isolation');
      expect(outcome?.family).toBe('dependency');
      expect(outcome?.element).toBe(sourcePath);
      expect(outcome?.normativeReference).toBe('FAF §4');
      if (outcome?.family !== 'dependency') {
        return;
      }
      expect(outcome.from).toBe(sourcePath);
      expect(outcome.to).toBe(destinationPath);
      expect(outcome.specifier).toBe(specifier);
      expect(outcome.importIndex).toBe(0);
      expect(outcome.position).toEqual({ column: 1, line: 1 });
      expect(outcome.message).toBe(
        `'${sourcePath}' imports '${destinationPath}' through '${specifier}': a Sub-Graph Node is not importable`
      );
    }
  );

  it('allows an external runner launch without codebase imports', () => {
    const edge = createEdge(
      'src/_components/table/table.spec.ts',
      'src/_components/table/table.component.ts',
      './table.component.js',
      0
    );
    const model = buildTestModel([edge]);
    const outcomes = verifySubGraphNodeIsolation(model);
    expect(outcomes).toEqual([]);
  });

  it('allows dependencies shared between Execution Sub-Graphs', () => {
    const mainEdge = createEdge(
      'src/main.ts',
      'src/_components/table/table.component.ts',
      './_components/table/table.component.js',
      0
    );
    const specEdge = createEdge(
      'src/_components/table/table.spec.ts',
      'src/_components/table/table.component.ts',
      './table.component.js',
      0
    );
    const model = buildTestModel([mainEdge, specEdge]);
    const outcomes = verifySubGraphNodeIsolation(model);
    expect(outcomes).toEqual([]);
  });

  it('does not report an import from a foreign-node to a Sub-Graph Node', () => {
    const edge = createEdge(
      'src/README.md',
      'src/_components/table/table.spec.ts',
      './_components/table/table.spec.js',
      0
    );
    const model = buildTestModel([edge]);
    const outcomes = verifySubGraphNodeIsolation(model);
    expect(outcomes).toEqual([]);
  });

  it('maintains deterministic outcome ordering under any permutation of input edges', () => {
    const edgeA = createEdge(
      'src/main.ts',
      'src/_components/table/table.spec.ts',
      './_components/table/table.spec.js',
      0
    );
    const edgeB = createEdge(
      'src/_utils/other/other.spec.ts',
      'src/_components/table/table.spec.ts',
      '../../_components/table/table.spec.js',
      1
    );

    const modelNormal = buildTestModel([edgeA, edgeB]);
    const modelReversed = buildTestModel([edgeB, edgeA]);

    const outcomesNormal = verifySubGraphNodeIsolation(modelNormal);
    const outcomesReversed = verifySubGraphNodeIsolation(modelReversed);

    expect(outcomesNormal).toEqual(outcomesReversed);
    expect(outcomesNormal).toHaveLength(2);
  });

  it('does not mutate the verification model', () => {
    const edge = createEdge(
      'src/main.ts',
      'src/_components/table/table.spec.ts',
      './_components/table/table.spec.js',
      0
    );
    const model = buildTestModel([edge]);
    const snapshot = JSON.stringify(model);

    verifySubGraphNodeIsolation(model);
    expect(JSON.stringify(model)).toBe(snapshot);
  });
});
