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
import { verifyPrivateCategoryVisibility } from './index.js';

type TModelEntry = {
  readonly depth: number;
  readonly domainKind?: 'category' | 'fragment' | 'root-fragment';
  readonly id: number;
  readonly isPrivateCategory?: boolean;
  readonly kind: 'directory' | 'file';
  readonly nodeKind?:
    | 'access-node'
    | 'fragment-node'
    | 'master-node'
    | 'root-node'
    | 'sub-graph-node';
  readonly parentId: null | number;
  readonly path: string;
  readonly preorderEnd: number;
  readonly preorderStart: number;
  readonly treeOrigin?: string;
};

const buildTestModel = (
  entries: readonly TModelEntry[],
  edges: readonly TEdgeMetadata[]
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
        isPrivateCategory: entry.isPrivateCategory ?? false,
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
  specifier = './target.js',
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

const compoundEntries: readonly TModelEntry[] = [
  {
    depth: 0,
    id: 0,
    kind: 'directory',
    parentId: null,
    path: 'src',
    preorderEnd: 18,
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
    domainKind: 'fragment',
    id: 2,
    kind: 'directory',
    parentId: 0,
    path: 'src/table',
    preorderEnd: 18,
    preorderStart: 2,
  },
  {
    depth: 2,
    id: 3,
    kind: 'file',
    nodeKind: 'master-node',
    parentId: 2,
    path: 'src/table/table.component.ts',
    preorderEnd: 3,
    preorderStart: 3,
  },
  {
    depth: 2,
    id: 4,
    kind: 'file',
    nodeKind: 'fragment-node',
    parentId: 2,
    path: 'src/table/table.type.ts',
    preorderEnd: 4,
    preorderStart: 4,
  },
  {
    depth: 2,
    id: 5,
    kind: 'file',
    nodeKind: 'sub-graph-node',
    parentId: 2,
    path: 'src/table/table.spec.ts',
    preorderEnd: 5,
    preorderStart: 5,
  },
  {
    depth: 2,
    id: 6,
    kind: 'file',
    nodeKind: 'access-node',
    parentId: 2,
    path: 'src/table/index.ts',
    preorderEnd: 6,
    preorderStart: 6,
  },
  {
    depth: 2,
    domainKind: 'category',
    id: 7,
    isPrivateCategory: true,
    kind: 'directory',
    parentId: 2,
    path: 'src/table/_components',
    preorderEnd: 13,
    preorderStart: 7,
  },
  {
    depth: 3,
    domainKind: 'fragment',
    id: 8,
    kind: 'directory',
    parentId: 7,
    path: 'src/table/_components/table-body',
    preorderEnd: 13,
    preorderStart: 8,
  },
  {
    depth: 4,
    id: 9,
    kind: 'file',
    nodeKind: 'master-node',
    parentId: 8,
    path: 'src/table/_components/table-body/table-body.component.ts',
    preorderEnd: 9,
    preorderStart: 9,
  },
  {
    depth: 4,
    id: 10,
    kind: 'file',
    nodeKind: 'access-node',
    parentId: 8,
    path: 'src/table/_components/table-body/index.ts',
    preorderEnd: 10,
    preorderStart: 10,
  },
  {
    depth: 4,
    domainKind: 'category',
    id: 11,
    isPrivateCategory: true,
    kind: 'directory',
    parentId: 8,
    path: 'src/table/_components/table-body/_utils',
    preorderEnd: 13,
    preorderStart: 11,
  },
  {
    depth: 5,
    domainKind: 'fragment',
    id: 12,
    kind: 'directory',
    parentId: 11,
    path: 'src/table/_components/table-body/_utils/deep',
    preorderEnd: 13,
    preorderStart: 12,
  },
  {
    depth: 6,
    id: 13,
    kind: 'file',
    nodeKind: 'access-node',
    parentId: 12,
    path: 'src/table/_components/table-body/_utils/deep/index.ts',
    preorderEnd: 13,
    preorderStart: 13,
  },
  {
    depth: 2,
    domainKind: 'category',
    id: 14,
    isPrivateCategory: true,
    kind: 'directory',
    parentId: 2,
    path: 'src/table/_utils',
    preorderEnd: 16,
    preorderStart: 14,
  },
  {
    depth: 3,
    domainKind: 'fragment',
    id: 15,
    kind: 'directory',
    parentId: 14,
    path: 'src/table/_utils/sort-rows',
    preorderEnd: 16,
    preorderStart: 15,
  },
  {
    depth: 4,
    id: 16,
    kind: 'file',
    nodeKind: 'master-node',
    parentId: 15,
    path: 'src/table/_utils/sort-rows/sort-rows.util.ts',
    preorderEnd: 16,
    preorderStart: 16,
  },
  {
    depth: 2,
    domainKind: 'category',
    id: 17,
    isPrivateCategory: false,
    kind: 'directory',
    parentId: 2,
    path: 'src/table/_table@shared',
    preorderEnd: 18,
    preorderStart: 17,
  },
  {
    depth: 3,
    id: 18,
    kind: 'file',
    nodeKind: 'fragment-node',
    parentId: 17,
    path: 'src/table/_table@shared/shared.type.ts',
    preorderEnd: 18,
    preorderStart: 18,
  },
];

const rootEntries: readonly TModelEntry[] = [
  {
    depth: 0,
    id: 0,
    kind: 'directory',
    parentId: null,
    path: 'src',
    preorderEnd: 12,
    preorderStart: 0,
  },
  {
    depth: 1,
    id: 1,
    kind: 'file',
    nodeKind: 'root-node',
    parentId: 0,
    path: 'src/root-main.ts',
    preorderEnd: 1,
    preorderStart: 1,
  },
  {
    depth: 1,
    domainKind: 'root-fragment',
    id: 2,
    kind: 'directory',
    parentId: 0,
    path: 'src/app',
    preorderEnd: 12,
    preorderStart: 2,
  },
  {
    depth: 2,
    id: 3,
    kind: 'file',
    nodeKind: 'root-node',
    parentId: 2,
    path: 'src/app/app.ts',
    preorderEnd: 3,
    preorderStart: 3,
  },
  {
    depth: 2,
    domainKind: 'category',
    id: 4,
    isPrivateCategory: true,
    kind: 'directory',
    parentId: 2,
    path: 'src/app/_components',
    preorderEnd: 6,
    preorderStart: 4,
  },
  {
    depth: 3,
    domainKind: 'fragment',
    id: 5,
    kind: 'directory',
    parentId: 4,
    path: 'src/app/_components/shell',
    preorderEnd: 6,
    preorderStart: 5,
  },
  {
    depth: 4,
    id: 6,
    kind: 'file',
    nodeKind: 'access-node',
    parentId: 5,
    path: 'src/app/_components/shell/index.ts',
    preorderEnd: 6,
    preorderStart: 6,
  },
  {
    depth: 2,
    domainKind: 'category',
    id: 7,
    isPrivateCategory: true,
    kind: 'directory',
    parentId: 2,
    path: 'src/app/_utils',
    preorderEnd: 8,
    preorderStart: 7,
  },
  {
    depth: 3,
    id: 8,
    kind: 'file',
    nodeKind: 'fragment-node',
    parentId: 7,
    path: 'src/app/_utils/helper.ts',
    preorderEnd: 8,
    preorderStart: 8,
  },
  {
    depth: 2,
    domainKind: 'category',
    id: 9,
    isPrivateCategory: false,
    kind: 'directory',
    parentId: 2,
    path: 'src/app/_app@shared',
    preorderEnd: 10,
    preorderStart: 9,
  },
  {
    depth: 3,
    id: 10,
    kind: 'file',
    nodeKind: 'fragment-node',
    parentId: 9,
    path: 'src/app/_app@shared/local.type.ts',
    preorderEnd: 10,
    preorderStart: 10,
  },
  {
    depth: 2,
    domainKind: 'root-fragment',
    id: 11,
    kind: 'directory',
    parentId: 2,
    path: 'src/app/child',
    preorderEnd: 12,
    preorderStart: 11,
  },
  {
    depth: 3,
    id: 12,
    kind: 'file',
    nodeKind: 'root-node',
    parentId: 11,
    path: 'src/app/child/child.ts',
    preorderEnd: 12,
    preorderStart: 12,
  },
];

describe('verifyPrivateCategoryVisibility', () => {
  it('verifies Fragment table consumers: direct Fragment and Sub-Graph nodes are admitted', () => {
    const target = 'src/table/_components/table-body/index.ts';
    const edges = [
      createEdge(
        'src/table/table.component.ts',
        target,
        './_components/table-body/index.js',
        0
      ),
      createEdge(
        'src/table/table.type.ts',
        target,
        './_components/table-body/index.js',
        1
      ),
      createEdge(
        'src/table/table.spec.ts',
        target,
        './_components/table-body/index.js',
        2
      ),
    ];
    const model = buildTestModel(compoundEntries, edges);
    expect(verifyPrivateCategoryVisibility(model)).toEqual([]);
  });

  it('verifies Fragment table consumers: Access Node, sibling Private Category, direct Branch, and external nodes are forbidden', () => {
    const target = 'src/table/_components/table-body/index.ts';
    const edges = [
      createEdge(
        'src/table/index.ts',
        target,
        './_components/table-body/index.js',
        0
      ),
      createEdge(
        'src/table/_utils/sort-rows/sort-rows.util.ts',
        target,
        '../_components/table-body/index.js',
        1
      ),
      createEdge(
        'src/table/_table@shared/shared.type.ts',
        target,
        '../_components/table-body/index.js',
        2
      ),
      createEdge(
        'src/main.ts',
        target,
        './table/_components/table-body/index.js',
        3
      ),
    ];
    const model = buildTestModel(compoundEntries, edges);
    const outcomes = verifyPrivateCategoryVisibility(model);
    expect(outcomes).toHaveLength(4);
    for (const outcome of outcomes) {
      expect(outcome.constraint).toBe('dependency/private-category-visibility');
      expect(outcome.family).toBe('dependency');
      expect(outcome.normativeReference).toBe('FAF §6.3.3');
    }
  });

  it('verifies Root Fragment consumers: direct Root Node is admitted; child, ancestor, sibling and branch are forbidden', () => {
    const target = 'src/app/_components/shell/index.ts';
    const edges = [
      createEdge('src/app/app.ts', target, './_components/shell/index.js', 0),
      createEdge(
        'src/app/child/child.ts',
        target,
        '../_components/shell/index.js',
        1
      ),
      createEdge(
        'src/root-main.ts',
        target,
        './app/_components/shell/index.js',
        2
      ),
      createEdge(
        'src/app/_utils/helper.ts',
        target,
        '../_components/shell/index.js',
        3
      ),
      createEdge(
        'src/app/_app@shared/local.type.ts',
        target,
        '../_components/shell/index.js',
        4
      ),
    ];
    const model = buildTestModel(rootEntries, edges);
    const outcomes = verifyPrivateCategoryVisibility(model);
    expect(outcomes).toHaveLength(4);
    const fromPaths = outcomes.map((outcome) => outcome.element);
    expect(fromPaths).not.toContain('src/app/app.ts');
    expect(fromPaths).toContain('src/app/child/child.ts');
    expect(fromPaths).toContain('src/root-main.ts');
    expect(fromPaths).toContain('src/app/_utils/helper.ts');
    expect(fromPaths).toContain('src/app/_app@shared/local.type.ts');
  });

  it('forbids crossing a second nested Private Category under a Sub-Fragment', () => {
    const target = 'src/table/_components/table-body/_utils/deep/index.ts';
    const edges = [
      createEdge(
        'src/table/table.component.ts',
        target,
        './_components/table-body/_utils/deep/index.js'
      ),
    ];
    const model = buildTestModel(compoundEntries, edges);
    const outcomes = verifyPrivateCategoryVisibility(model);
    expect(outcomes).toEqual([
      {
        constraint: 'dependency/private-category-visibility',
        element: 'src/table/table.component.ts',
        family: 'dependency',
        from: 'src/table/table.component.ts',
        importIndex: 0,
        message:
          "'src/table/table.component.ts' imports 'src/table/_components/table-body/_utils/deep/index.ts' through './_components/table-body/_utils/deep/index.js': a Private Category is importable from outside only by the enabled direct Logical Nodes of its parent",
        normativeReference: 'FAF §6.3.3',
        position: { column: 1, line: 1 },
        specifier: './_components/table-body/_utils/deep/index.js',
        to: 'src/table/_components/table-body/_utils/deep/index.ts',
      },
    ]);
  });

  it('forbids return flow from private details to direct nodes of the parent: Master, Fragment Node, Sub-Graph, Access, Root Node', () => {
    const source = 'src/table/_components/table-body/table-body.component.ts';
    const compoundEdges = [
      createEdge(
        source,
        'src/table/table.component.ts',
        '../../table.component.js',
        0
      ),
      createEdge(source, 'src/table/table.type.ts', '../../table.type.js', 1),
      createEdge(source, 'src/table/table.spec.ts', '../../table.spec.js', 2),
      createEdge(source, 'src/table/index.ts', '../../index.js', 3),
    ];
    const compoundModel = buildTestModel(compoundEntries, compoundEdges);
    const compoundOutcomes = verifyPrivateCategoryVisibility(compoundModel);
    expect(compoundOutcomes).toHaveLength(4);
    for (const outcome of compoundOutcomes) {
      expect(outcome.constraint).toBe(
        'dependency/private-category-unidirectionality'
      );
      expect(outcome.family).toBe('dependency');
      expect(outcome.normativeReference).toBe('FAF §6.3.3');
    }

    const rootEdge = [
      createEdge(
        'src/app/_components/shell/index.ts',
        'src/app/app.ts',
        '../../app.js',
        0
      ),
    ];
    const rootModel = buildTestModel(rootEntries, rootEdge);
    const rootOutcomes = verifyPrivateCategoryVisibility(rootModel);
    expect(rootOutcomes).toHaveLength(1);
    expect(rootOutcomes[0]?.constraint).toBe(
      'dependency/private-category-unidirectionality'
    );
  });

  it('allows private details to import parent direct Fractal Branch', () => {
    const edges = [
      createEdge(
        'src/table/_components/table-body/table-body.component.ts',
        'src/table/_table@shared/shared.type.ts',
        '../../_table@shared/shared.type.js'
      ),
    ];
    const model = buildTestModel(compoundEntries, edges);
    expect(verifyPrivateCategoryVisibility(model)).toEqual([]);
  });

  it('preserves determinism regardless of edge input permutation', () => {
    const target = 'src/table/_components/table-body/index.ts';
    const edgeA = createEdge('src/main.ts', target, './target.js', 0);
    const edgeB = createEdge('src/table/index.ts', target, './target.js', 0);
    const edgeC = createEdge(
      'src/table/_components/table-body/table-body.component.ts',
      'src/table/table.component.ts',
      '../table.js',
      0
    );

    const modelNormal = buildTestModel(compoundEntries, [edgeA, edgeB, edgeC]);
    const modelPermuted = buildTestModel(compoundEntries, [
      edgeC,
      edgeA,
      edgeB,
    ]);

    const outcomesNormal = verifyPrivateCategoryVisibility(modelNormal);
    const outcomesPermuted = verifyPrivateCategoryVisibility(modelPermuted);

    expect(outcomesNormal).toEqual(outcomesPermuted);
  });

  it('does not mutate the verification model', () => {
    const target = 'src/table/_components/table-body/index.ts';
    const edges = [createEdge('src/main.ts', target, './target.js', 0)];
    const model = buildTestModel(compoundEntries, edges);

    Object.freeze(model);
    Object.freeze(model.basis);
    Object.freeze(model.basis.inventory);
    Object.freeze(model.taxonomy);
    Object.freeze(model.graph);
    Object.freeze(model.graph.edgeMetadata);

    expect(() => verifyPrivateCategoryVisibility(model)).not.toThrow();
  });
});
