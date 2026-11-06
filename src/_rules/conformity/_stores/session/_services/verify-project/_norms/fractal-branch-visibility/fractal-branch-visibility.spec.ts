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
import { verifyFractalBranchVisibility } from './index.js';

type TModelEntry = {
  readonly depth: number;
  readonly domainKind?: TLogicalDomainKind;
  readonly id: number;
  readonly isPrivateCategory?: boolean;
  readonly kind: 'directory' | 'file';
  readonly nodeKind?: TNodeKind;
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

describe('verifyFractalBranchVisibility', () => {
  it('verifies every consumer of the apical Branch src/_src@shared table', () => {
    const entries: readonly TModelEntry[] = [
      {
        depth: 0,
        domainKind: 'root-fragment',
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src',
        preorderEnd: 9,
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
        preorderEnd: 4,
        preorderStart: 2,
      },
      {
        depth: 2,
        domainKind: 'category',
        id: 3,
        kind: 'directory',
        parentId: 2,
        path: 'src/_src@shared/_types',
        preorderEnd: 4,
        preorderStart: 3,
      },
      {
        depth: 3,
        id: 4,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 3,
        path: 'src/_src@shared/_types/shared.type.ts',
        preorderEnd: 4,
        preorderStart: 4,
      },
      {
        depth: 1,
        domainKind: 'root-fragment',
        id: 5,
        kind: 'directory',
        parentId: 0,
        path: 'src/app',
        preorderEnd: 9,
        preorderStart: 5,
      },
      {
        depth: 2,
        id: 6,
        kind: 'file',
        nodeKind: 'root-node',
        parentId: 5,
        path: 'src/app/app.ts',
        preorderEnd: 6,
        preorderStart: 6,
      },
      {
        depth: 2,
        domainKind: 'category',
        id: 7,
        isPrivateCategory: true,
        kind: 'directory',
        parentId: 5,
        path: 'src/app/_components',
        preorderEnd: 9,
        preorderStart: 7,
      },
      {
        depth: 3,
        domainKind: 'fragment',
        id: 8,
        kind: 'directory',
        parentId: 7,
        path: 'src/app/_components/shell',
        preorderEnd: 9,
        preorderStart: 8,
      },
      {
        depth: 4,
        id: 9,
        kind: 'file',
        nodeKind: 'fragment-node',
        parentId: 8,
        path: 'src/app/_components/shell/shell.component.ts',
        preorderEnd: 9,
        preorderStart: 9,
      },
      {
        depth: 0,
        domainKind: 'root-fragment',
        id: 10,
        kind: 'directory',
        parentId: null,
        path: 'outside',
        preorderEnd: 11,
        preorderStart: 10,
        treeOrigin: 'outside',
      },
      {
        depth: 1,
        id: 11,
        kind: 'file',
        nodeKind: 'root-node',
        parentId: 10,
        path: 'outside/outside.ts',
        preorderEnd: 11,
        preorderStart: 11,
        treeOrigin: 'outside',
      },
    ];

    const target = 'src/_src@shared/_types/shared.type.ts';
    const allowedSources = [
      'src/main.ts',
      'src/app/app.ts',
      'src/app/_components/shell/shell.component.ts',
    ];

    for (const source of allowedSources) {
      const edge = createEdge(source, target, './shared.type.js');
      const model = buildTestModel(entries, [edge]);
      expect(verifyFractalBranchVisibility(model)).toEqual([]);
    }

    const outsideEdge = createEdge(
      'outside/outside.ts',
      target,
      './shared.type.js'
    );
    const outsideModel = buildTestModel(entries, [outsideEdge]);
    const outcomes = verifyFractalBranchVisibility(outsideModel);
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.constraint).toBe(
      'dependency/fractal-branch-visibility'
    );
    expect(outcomes[0]?.element).toBe('outside/outside.ts');
  });

  it('verifies every consumer of the local Branch table/_table@shared', () => {
    const entries: readonly TModelEntry[] = [
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
        preorderEnd: 8,
        preorderStart: 2,
      },
      {
        depth: 2,
        domainKind: 'fragment',
        id: 3,
        kind: 'directory',
        parentId: 2,
        path: 'src/_components/table',
        preorderEnd: 8,
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
        nodeKind: 'sub-graph-node',
        parentId: 3,
        path: 'src/_components/table/table.spec.ts',
        preorderEnd: 5,
        preorderStart: 5,
      },
      {
        depth: 3,
        id: 6,
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 3,
        path: 'src/_components/table/index.ts',
        preorderEnd: 6,
        preorderStart: 6,
      },
      {
        depth: 3,
        domainKind: 'fractal-branch',
        id: 7,
        kind: 'directory',
        parentId: 3,
        path: 'src/_components/table/_table@shared',
        preorderEnd: 8,
        preorderStart: 7,
      },
      {
        depth: 4,
        domainKind: 'category',
        id: 8,
        kind: 'directory',
        parentId: 7,
        path: 'src/_components/table/_table@shared/_types',
        preorderEnd: 8,
        preorderStart: 8,
      },
      {
        depth: 5,
        id: 9,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 8,
        path: 'src/_components/table/_table@shared/_types/sort.type.ts',
        preorderEnd: 8,
        preorderStart: 8,
      },
    ];

    const target = 'src/_components/table/_table@shared/_types/sort.type.ts';

    const masterEdge = createEdge(
      'src/_components/table/table.component.ts',
      target,
      './sort.type.js'
    );
    expect(
      verifyFractalBranchVisibility(buildTestModel(entries, [masterEdge]))
    ).toEqual([]);

    const specEdge = createEdge(
      'src/_components/table/table.spec.ts',
      target,
      './sort.type.js'
    );
    expect(
      verifyFractalBranchVisibility(buildTestModel(entries, [specEdge]))
    ).toEqual([]);

    const accessEdge = createEdge(
      'src/_components/table/index.ts',
      target,
      './sort.type.js'
    );
    const accessOutcomes = verifyFractalBranchVisibility(
      buildTestModel(entries, [accessEdge])
    );
    expect(accessOutcomes).toHaveLength(1);
    expect(accessOutcomes[0]?.constraint).toBe(
      'dependency/fractal-branch-visibility'
    );
    expect(accessOutcomes[0]?.element).toBe('src/_components/table/index.ts');

    const mainEdge = createEdge('src/main.ts', target, './sort.type.js');
    const mainOutcomes = verifyFractalBranchVisibility(
      buildTestModel(entries, [mainEdge])
    );
    expect(mainOutcomes).toHaveLength(1);
    expect(mainOutcomes[0]?.constraint).toBe(
      'dependency/fractal-branch-visibility'
    );
    expect(mainOutcomes[0]?.element).toBe('src/main.ts');
  });

  it('rejects access to nested Root Fragment Branch from parent, but admits consumption of apical Branch', () => {
    const entries: readonly TModelEntry[] = [
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
        preorderEnd: 4,
        preorderStart: 2,
      },
      {
        depth: 2,
        domainKind: 'category',
        id: 3,
        kind: 'directory',
        parentId: 2,
        path: 'src/_src@shared/_types',
        preorderEnd: 4,
        preorderStart: 3,
      },
      {
        depth: 3,
        id: 4,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 3,
        path: 'src/_src@shared/_types/global.type.ts',
        preorderEnd: 4,
        preorderStart: 4,
      },
      {
        depth: 1,
        domainKind: 'root-fragment',
        id: 5,
        kind: 'directory',
        parentId: 0,
        path: 'src/app',
        preorderEnd: 8,
        preorderStart: 5,
      },
      {
        depth: 2,
        domainKind: 'fractal-branch',
        id: 6,
        kind: 'directory',
        parentId: 5,
        path: 'src/app/_app@shared',
        preorderEnd: 8,
        preorderStart: 6,
      },
      {
        depth: 3,
        domainKind: 'category',
        id: 7,
        kind: 'directory',
        parentId: 6,
        path: 'src/app/_app@shared/_types',
        preorderEnd: 8,
        preorderStart: 7,
      },
      {
        depth: 4,
        id: 8,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 7,
        path: 'src/app/_app@shared/_types/local.type.ts',
        preorderEnd: 8,
        preorderStart: 8,
      },
    ];

    const parentToNestedEdge = createEdge(
      'src/main.ts',
      'src/app/_app@shared/_types/local.type.ts',
      './local.type.js'
    );
    const parentOutcomes = verifyFractalBranchVisibility(
      buildTestModel(entries, [parentToNestedEdge])
    );
    expect(parentOutcomes).toHaveLength(1);
    expect(parentOutcomes[0]?.constraint).toBe(
      'dependency/fractal-branch-visibility'
    );

    const nestedToApicalEdge = createEdge(
      'src/app/_app@shared/_types/local.type.ts',
      'src/_src@shared/_types/global.type.ts',
      './global.type.js'
    );
    const nestedOutcomes = verifyFractalBranchVisibility(
      buildTestModel(entries, [nestedToApicalEdge])
    );
    expect(nestedOutcomes).toEqual([]);
  });

  it('rejects access node of the parent Fragment', () => {
    const entries: readonly TModelEntry[] = [
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
        domainKind: 'fragment',
        id: 1,
        kind: 'directory',
        parentId: 0,
        path: 'src/widget',
        preorderEnd: 5,
        preorderStart: 1,
      },
      {
        depth: 2,
        id: 2,
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 1,
        path: 'src/widget/index.ts',
        preorderEnd: 2,
        preorderStart: 2,
      },
      {
        depth: 2,
        domainKind: 'fractal-branch',
        id: 3,
        kind: 'directory',
        parentId: 1,
        path: 'src/widget/_widget@shared',
        preorderEnd: 5,
        preorderStart: 3,
      },
      {
        depth: 3,
        domainKind: 'category',
        id: 4,
        kind: 'directory',
        parentId: 3,
        path: 'src/widget/_widget@shared/_types',
        preorderEnd: 5,
        preorderStart: 4,
      },
      {
        depth: 4,
        id: 5,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 4,
        path: 'src/widget/_widget@shared/_types/a.type.ts',
        preorderEnd: 5,
        preorderStart: 5,
      },
    ];

    const edge = createEdge(
      'src/widget/index.ts',
      'src/widget/_widget@shared/_types/a.type.ts',
      './a.type.js'
    );
    const outcomes = verifyFractalBranchVisibility(
      buildTestModel(entries, [edge])
    );
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.constraint).toBe(
      'dependency/fractal-branch-visibility'
    );
    expect(outcomes[0]?.element).toBe('src/widget/index.ts');
  });

  it('verifies Compound Component table with the two Branches', () => {
    const entries: readonly TModelEntry[] = [
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
        domainKind: 'category',
        id: 1,
        kind: 'directory',
        parentId: 0,
        path: 'src/_components',
        preorderEnd: 15,
        preorderStart: 1,
      },
      {
        depth: 2,
        domainKind: 'fragment',
        id: 2,
        kind: 'directory',
        parentId: 1,
        path: 'src/_components/table',
        preorderEnd: 15,
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
        id: 4,
        kind: 'file',
        nodeKind: 'fragment-node',
        parentId: 2,
        path: 'src/_components/table/table.hook.ts',
        preorderEnd: 4,
        preorderStart: 4,
      },
      {
        depth: 3,
        domainKind: 'fractal-branch',
        id: 5,
        kind: 'directory',
        parentId: 2,
        path: 'src/_components/table/_table@shared',
        preorderEnd: 8,
        preorderStart: 5,
      },
      {
        depth: 4,
        domainKind: 'category',
        id: 6,
        kind: 'directory',
        parentId: 5,
        path: 'src/_components/table/_table@shared/_contexts',
        preorderEnd: 8,
        preorderStart: 6,
      },
      {
        depth: 5,
        domainKind: 'fragment',
        id: 7,
        kind: 'directory',
        parentId: 6,
        path: 'src/_components/table/_table@shared/_contexts/table-context',
        preorderEnd: 8,
        preorderStart: 7,
      },
      {
        depth: 6,
        id: 8,
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 7,
        path: 'src/_components/table/_table@shared/_contexts/table-context/index.ts',
        preorderEnd: 8,
        preorderStart: 8,
      },
      {
        depth: 3,
        domainKind: 'category',
        id: 9,
        isPrivateCategory: true,
        kind: 'directory',
        parentId: 2,
        path: 'src/_components/table/_components',
        preorderEnd: 15,
        preorderStart: 9,
      },
      {
        depth: 4,
        domainKind: 'fragment',
        id: 10,
        kind: 'directory',
        parentId: 9,
        path: 'src/_components/table/_components/table-row',
        preorderEnd: 11,
        preorderStart: 10,
      },
      {
        depth: 5,
        id: 11,
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 10,
        path: 'src/_components/table/_components/table-row/table-row.component.ts',
        preorderEnd: 11,
        preorderStart: 11,
      },
      {
        depth: 4,
        domainKind: 'fractal-branch',
        id: 12,
        kind: 'directory',
        parentId: 9,
        path: 'src/_components/table/_components/_components@shared',
        preorderEnd: 15,
        preorderStart: 12,
      },
      {
        depth: 5,
        domainKind: 'category',
        id: 13,
        kind: 'directory',
        parentId: 12,
        path: 'src/_components/table/_components/_components@shared/_hooks',
        preorderEnd: 15,
        preorderStart: 13,
      },
      {
        depth: 6,
        domainKind: 'fragment',
        id: 14,
        kind: 'directory',
        parentId: 13,
        path: 'src/_components/table/_components/_components@shared/_hooks/use-table-context',
        preorderEnd: 15,
        preorderStart: 14,
      },
      {
        depth: 7,
        id: 15,
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 14,
        path: 'src/_components/table/_components/_components@shared/_hooks/use-table-context/index.ts',
        preorderEnd: 15,
        preorderStart: 15,
      },
    ];

    const readerHook =
      'src/_components/table/_components/_components@shared/_hooks/use-table-context/index.ts';
    const subComponentEdge = createEdge(
      'src/_components/table/_components/table-row/table-row.component.ts',
      readerHook,
      './use-table-context/index.js'
    );
    expect(
      verifyFractalBranchVisibility(buildTestModel(entries, [subComponentEdge]))
    ).toEqual([]);

    const tableMasterEdge = createEdge(
      'src/_components/table/table.component.ts',
      readerHook,
      './use-table-context/index.js'
    );
    const tableOutcomes = verifyFractalBranchVisibility(
      buildTestModel(entries, [tableMasterEdge])
    );
    expect(tableOutcomes).toHaveLength(1);
    expect(tableOutcomes[0]?.constraint).toBe(
      'dependency/fractal-branch-visibility'
    );

    const tableContext =
      'src/_components/table/_table@shared/_contexts/table-context/index.ts';
    const subCompToContextEdge = createEdge(
      'src/_components/table/_components/table-row/table-row.component.ts',
      tableContext,
      './table-context/index.js'
    );
    expect(
      verifyFractalBranchVisibility(
        buildTestModel(entries, [subCompToContextEdge])
      )
    ).toEqual([]);
  });

  it('guarantees deterministic ordering under edge permutation and does not mutate model', () => {
    const entries: readonly TModelEntry[] = [
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
        domainKind: 'fragment',
        id: 2,
        kind: 'directory',
        parentId: 0,
        path: 'src/app',
        preorderEnd: 6,
        preorderStart: 2,
      },
      {
        depth: 2,
        id: 3,
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 2,
        path: 'src/app/index.ts',
        preorderEnd: 3,
        preorderStart: 3,
      },
      {
        depth: 2,
        domainKind: 'fractal-branch',
        id: 4,
        kind: 'directory',
        parentId: 2,
        path: 'src/app/_app@shared',
        preorderEnd: 6,
        preorderStart: 4,
      },
      {
        depth: 3,
        domainKind: 'category',
        id: 5,
        kind: 'directory',
        parentId: 4,
        path: 'src/app/_app@shared/_types',
        preorderEnd: 6,
        preorderStart: 5,
      },
      {
        depth: 4,
        id: 6,
        kind: 'file',
        nodeKind: 'category-node',
        parentId: 5,
        path: 'src/app/_app@shared/_types/local.type.ts',
        preorderEnd: 6,
        preorderStart: 6,
      },
    ];

    const edgeA = createEdge(
      'src/main.ts',
      'src/app/_app@shared/_types/local.type.ts',
      './local.type.js',
      0
    );
    const edgeB = createEdge(
      'src/app/index.ts',
      'src/app/_app@shared/_types/local.type.ts',
      './local.type.js',
      1
    );

    const modelNormal = buildTestModel(entries, [edgeA, edgeB]);
    const modelPermuted = buildTestModel(entries, [edgeB, edgeA]);

    const serializedBefore = JSON.stringify(modelNormal);
    const outcomesNormal = verifyFractalBranchVisibility(modelNormal);
    const outcomesPermuted = verifyFractalBranchVisibility(modelPermuted);
    const serializedAfter = JSON.stringify(modelNormal);

    expect(serializedBefore).toBe(serializedAfter);
    expect(outcomesNormal).toEqual(outcomesPermuted);
    expect(outcomesNormal).toHaveLength(2);
    expect(outcomesNormal[0]?.element).toBe('src/app/index.ts');
    expect(outcomesNormal[1]?.element).toBe('src/main.ts');
  });
});
