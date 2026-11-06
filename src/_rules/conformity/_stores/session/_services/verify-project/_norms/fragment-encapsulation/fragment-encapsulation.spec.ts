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
import { verifyFragmentEncapsulation } from './index.js';

type TModelEntry = {
  readonly depth: number;
  readonly domainKind?: 'category' | 'fragment';
  readonly id: number;
  readonly kind: 'directory' | 'file';
  readonly nodeKind?:
    | 'access-node'
    | 'fragment-node'
    | 'master-node'
    | 'root-node';
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

describe('verifyFragmentEncapsulation', () => {
  it('returns no outcomes when fragments are imported through their access node', () => {
    const entries: TModelEntry[] = [
      {
        depth: 0,
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src',
        preorderEnd: 4,
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
        path: 'src/_utils',
        preorderEnd: 4,
        preorderStart: 2,
      },
      {
        depth: 2,
        domainKind: 'fragment',
        id: 3,
        kind: 'directory',
        parentId: 2,
        path: 'src/_utils/widget',
        preorderEnd: 4,
        preorderStart: 3,
      },
      {
        depth: 3,
        id: 4,
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 3,
        path: 'src/_utils/widget/index.ts',
        preorderEnd: 4,
        preorderStart: 4,
      },
    ];
    const model = buildTestModel(entries, [
      createEdge(
        'src/main.ts',
        'src/_utils/widget/index.ts',
        './_utils/widget/index.js'
      ),
    ]);

    expect(verifyFragmentEncapsulation(model)).toEqual([]);
  });

  it('rejects direct import of Master node and Fragment node by authorized consumers', () => {
    const entries: TModelEntry[] = [
      {
        depth: 0,
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
        domainKind: 'category',
        id: 2,
        kind: 'directory',
        parentId: 0,
        path: 'src/_utils',
        preorderEnd: 6,
        preorderStart: 2,
      },
      {
        depth: 2,
        domainKind: 'fragment',
        id: 3,
        kind: 'directory',
        parentId: 2,
        path: 'src/_utils/widget',
        preorderEnd: 6,
        preorderStart: 3,
      },
      {
        depth: 3,
        id: 4,
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 3,
        path: 'src/_utils/widget/index.ts',
        preorderEnd: 4,
        preorderStart: 4,
      },
      {
        depth: 3,
        id: 5,
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 3,
        path: 'src/_utils/widget/widget.util.ts',
        preorderEnd: 5,
        preorderStart: 5,
      },
      {
        depth: 3,
        id: 6,
        kind: 'file',
        nodeKind: 'fragment-node',
        parentId: 3,
        path: 'src/_utils/widget/widget.type.ts',
        preorderEnd: 6,
        preorderStart: 6,
      },
    ];
    const model = buildTestModel(entries, [
      createEdge(
        'src/main.ts',
        'src/_utils/widget/widget.util.ts',
        './_utils/widget/widget.util.js',
        0
      ),
      createEdge(
        'src/main.ts',
        'src/_utils/widget/widget.type.ts',
        './_utils/widget/widget.type.js',
        1
      ),
    ]);

    const outcomes = verifyFragmentEncapsulation(model);
    expect(outcomes).toEqual([
      expect.objectContaining({
        constraint: 'dependency/fragment-encapsulation',
        element: 'src/main.ts',
        from: 'src/main.ts',
        to: 'src/_utils/widget/widget.util.ts',
      }),
      expect.objectContaining({
        constraint: 'dependency/fragment-encapsulation',
        element: 'src/main.ts',
        from: 'src/main.ts',
        to: 'src/_utils/widget/widget.type.ts',
      }),
    ]);
  });

  it('does not report fragment-encapsulation when importing an internal Sub-Fragment index.ts from outside', () => {
    const entries: TModelEntry[] = [
      {
        depth: 0,
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src',
        preorderEnd: 7,
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
        preorderEnd: 7,
        preorderStart: 2,
      },
      {
        depth: 2,
        domainKind: 'fragment',
        id: 3,
        kind: 'directory',
        parentId: 2,
        path: 'src/_components/button',
        preorderEnd: 7,
        preorderStart: 3,
      },
      {
        depth: 3,
        id: 4,
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 3,
        path: 'src/_components/button/index.ts',
        preorderEnd: 4,
        preorderStart: 4,
      },
      {
        depth: 3,
        domainKind: 'category',
        id: 5,
        kind: 'directory',
        parentId: 3,
        path: 'src/_components/button/_utils',
        preorderEnd: 7,
        preorderStart: 5,
      },
      {
        depth: 4,
        domainKind: 'fragment',
        id: 6,
        kind: 'directory',
        parentId: 5,
        path: 'src/_components/button/_utils/helper',
        preorderEnd: 7,
        preorderStart: 6,
      },
      {
        depth: 5,
        id: 7,
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 6,
        path: 'src/_components/button/_utils/helper/index.ts',
        preorderEnd: 7,
        preorderStart: 7,
      },
    ];
    const model = buildTestModel(entries, [
      createEdge(
        'src/main.ts',
        'src/_components/button/_utils/helper/index.ts',
        './_components/button/_utils/helper/index.js'
      ),
    ]);

    expect(verifyFragmentEncapsulation(model)).toEqual([]);
  });

  it('rejects an import when directory resolves to Master instead of index.ts', () => {
    const entries: TModelEntry[] = [
      {
        depth: 0,
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src',
        preorderEnd: 4,
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
        path: 'src/_utils',
        preorderEnd: 4,
        preorderStart: 2,
      },
      {
        depth: 2,
        domainKind: 'fragment',
        id: 3,
        kind: 'directory',
        parentId: 2,
        path: 'src/_utils/widget',
        preorderEnd: 4,
        preorderStart: 3,
      },
      {
        depth: 3,
        id: 4,
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 3,
        path: 'src/_utils/widget/widget.util.ts',
        preorderEnd: 4,
        preorderStart: 4,
      },
    ];
    const model = buildTestModel(entries, [
      createEdge(
        'src/main.ts',
        'src/_utils/widget/widget.util.ts',
        './_utils/widget'
      ),
    ]);

    const outcomes = verifyFragmentEncapsulation(model);
    expect(outcomes).toEqual([
      expect.objectContaining({
        constraint: 'dependency/fragment-encapsulation',
        element: 'src/main.ts',
        specifier: './_utils/widget',
        to: 'src/_utils/widget/widget.util.ts',
      }),
    ]);
  });

  it('ignores internal edges within the same Fragment', () => {
    const entries: TModelEntry[] = [
      {
        depth: 0,
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
        path: 'src/_utils/widget',
        preorderEnd: 4,
        preorderStart: 2,
      },
      {
        depth: 3,
        id: 3,
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 2,
        path: 'src/_utils/widget/index.ts',
        preorderEnd: 3,
        preorderStart: 3,
      },
      {
        depth: 3,
        id: 4,
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 2,
        path: 'src/_utils/widget/widget.util.ts',
        preorderEnd: 4,
        preorderStart: 4,
      },
    ];
    const model = buildTestModel(entries, [
      createEdge(
        'src/_utils/widget/index.ts',
        'src/_utils/widget/widget.util.ts',
        './widget.util.js'
      ),
    ]);

    expect(verifyFragmentEncapsulation(model)).toEqual([]);
  });

  it('ignores edges crossing between different Fractal Trees', () => {
    const entries: TModelEntry[] = [
      {
        depth: 0,
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src',
        preorderEnd: 2,
        preorderStart: 0,
        treeOrigin: 'src',
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
        treeOrigin: 'src',
      },
      {
        depth: 0,
        id: 2,
        kind: 'directory',
        parentId: null,
        path: 'lib',
        preorderEnd: 4,
        preorderStart: 2,
        treeOrigin: 'lib',
      },
      {
        depth: 1,
        domainKind: 'fragment',
        id: 3,
        kind: 'directory',
        parentId: 2,
        path: 'lib/widget',
        preorderEnd: 4,
        preorderStart: 3,
        treeOrigin: 'lib',
      },
      {
        depth: 2,
        id: 4,
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 3,
        path: 'lib/widget/widget.util.ts',
        preorderEnd: 4,
        preorderStart: 4,
        treeOrigin: 'lib',
      },
    ];
    const model = buildTestModel(entries, [
      createEdge(
        'src/main.ts',
        'lib/widget/widget.util.ts',
        '../lib/widget/widget.util.js'
      ),
    ]);

    expect(verifyFragmentEncapsulation(model)).toEqual([]);
  });

  it('maintains deterministic outcome ordering under any permutation of input edges', () => {
    const entries: TModelEntry[] = [
      {
        depth: 0,
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
        domainKind: 'category',
        id: 2,
        kind: 'directory',
        parentId: 0,
        path: 'src/_utils',
        preorderEnd: 6,
        preorderStart: 2,
      },
      {
        depth: 2,
        domainKind: 'fragment',
        id: 3,
        kind: 'directory',
        parentId: 2,
        path: 'src/_utils/widget',
        preorderEnd: 4,
        preorderStart: 3,
      },
      {
        depth: 3,
        id: 4,
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 3,
        path: 'src/_utils/widget/widget.util.ts',
        preorderEnd: 4,
        preorderStart: 4,
      },
      {
        depth: 2,
        domainKind: 'fragment',
        id: 5,
        kind: 'directory',
        parentId: 2,
        path: 'src/_utils/other',
        preorderEnd: 6,
        preorderStart: 5,
      },
      {
        depth: 3,
        id: 6,
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 5,
        path: 'src/_utils/other/other.util.ts',
        preorderEnd: 6,
        preorderStart: 6,
      },
    ];
    const edgeA = createEdge(
      'src/main.ts',
      'src/_utils/widget/widget.util.ts',
      './_utils/widget/widget.util.js',
      0
    );
    const edgeB = createEdge(
      'src/main.ts',
      'src/_utils/other/other.util.ts',
      './_utils/other/other.util.js',
      1
    );

    const modelNormal = buildTestModel(entries, [edgeA, edgeB]);
    const modelReversed = buildTestModel(entries, [edgeB, edgeA]);

    const outcomesNormal = verifyFragmentEncapsulation(modelNormal);
    const outcomesReversed = verifyFragmentEncapsulation(modelReversed);

    expect(outcomesNormal).toEqual(outcomesReversed);
  });

  it('does not mutate the verification model', () => {
    const entries: TModelEntry[] = [
      {
        depth: 0,
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src',
        preorderEnd: 4,
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
        path: 'src/_utils',
        preorderEnd: 4,
        preorderStart: 2,
      },
      {
        depth: 2,
        domainKind: 'fragment',
        id: 3,
        kind: 'directory',
        parentId: 2,
        path: 'src/_utils/widget',
        preorderEnd: 4,
        preorderStart: 3,
      },
      {
        depth: 3,
        id: 4,
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 3,
        path: 'src/_utils/widget/widget.util.ts',
        preorderEnd: 4,
        preorderStart: 4,
      },
    ];
    const model = buildTestModel(entries, [
      createEdge(
        'src/main.ts',
        'src/_utils/widget/widget.util.ts',
        './_utils/widget/widget.util.js'
      ),
    ]);

    const snapshot = JSON.stringify(model);
    verifyFragmentEncapsulation(model);
    expect(JSON.stringify(model)).toBe(snapshot);
  });
});
