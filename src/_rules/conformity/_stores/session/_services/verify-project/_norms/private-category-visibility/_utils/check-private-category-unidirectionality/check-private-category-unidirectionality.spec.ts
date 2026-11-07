import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TTaxonomyModel,
} from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEdgeMetadata } from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { checkPrivateCategoryUnidirectionality } from './check-private-category-unidirectionality.util.js';

type TModelEntry = {
  readonly depth: number;
  readonly domainKind?: 'category' | 'fragment' | 'root-fragment';
  readonly id: number;
  readonly isPrivateCategory?: boolean;
  readonly kind: 'directory' | 'file';
  readonly nodeKind?:
    | 'access-node'
    | 'foreign-node'
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

const buildInventoryAndTaxonomy = (
  entries: readonly TModelEntry[],
  options?: {
    readonly phantomPath?: string;
    readonly skipClassificationId?: number;
  }
): {
  readonly inventory: TInventory;
  readonly taxonomy: TTaxonomyModel;
} => {
  const items: TInventoryItem[] = [];
  const pathToId = new Map<string, number>();
  const realPathToId = new Map<string, number>();
  const byItemId = new Map<number, TItemClassification>();
  const byPath = new Map<string, TItemClassification>();
  const classifications: TItemClassification[] = [];

  if (options?.phantomPath !== undefined) {
    pathToId.set(options.phantomPath, 999);
  }

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

    if (options?.skipClassificationId === entry.id) {
      continue;
    }

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

  return {
    inventory: { items, pathToId, realPathToId },
    taxonomy: { byItemId, byPath, classifications },
  };
};

const createEdge = (
  from: string,
  to: string,
  specifier = './target.js'
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

describe('checkPrivateCategoryUnidirectionality', () => {
  it('returns undefined when destination is not in inventory', () => {
    const { inventory, taxonomy } = buildInventoryAndTaxonomy([
      {
        depth: 0,
        id: 0,
        kind: 'file',
        nodeKind: 'root-node',
        parentId: null,
        path: 'src/main.ts',
        preorderEnd: 0,
        preorderStart: 0,
      },
    ]);
    const edge = createEdge('src/main.ts', 'src/missing.ts');
    expect(
      checkPrivateCategoryUnidirectionality(edge, inventory, taxonomy)
    ).toBeUndefined();
  });

  it('returns undefined when destination is a directory', () => {
    const { inventory, taxonomy } = buildInventoryAndTaxonomy([
      {
        depth: 0,
        domainKind: 'fragment',
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src/table',
        preorderEnd: 2,
        preorderStart: 0,
      },
      {
        depth: 1,
        domainKind: 'category',
        id: 1,
        isPrivateCategory: true,
        kind: 'directory',
        parentId: 0,
        path: 'src/table/_components',
        preorderEnd: 2,
        preorderStart: 1,
      },
      {
        depth: 2,
        id: 2,
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 1,
        path: 'src/table/_components/cell.ts',
        preorderEnd: 2,
        preorderStart: 2,
      },
    ]);
    const edge = createEdge('src/table/_components/cell.ts', 'src/table');
    expect(
      checkPrivateCategoryUnidirectionality(edge, inventory, taxonomy)
    ).toBeUndefined();
  });

  it('returns undefined when endpoints belong to different trees', () => {
    const { inventory, taxonomy } = buildInventoryAndTaxonomy([
      {
        depth: 0,
        id: 0,
        kind: 'file',
        nodeKind: 'root-node',
        parentId: null,
        path: 'src/main.ts',
        preorderEnd: 0,
        preorderStart: 0,
        treeOrigin: 'src',
      },
      {
        depth: 0,
        id: 1,
        kind: 'file',
        nodeKind: 'root-node',
        parentId: null,
        path: 'pkg/index.ts',
        preorderEnd: 1,
        preorderStart: 1,
        treeOrigin: 'pkg',
      },
    ]);
    const edge = createEdge('src/main.ts', 'pkg/index.ts');
    expect(
      checkPrivateCategoryUnidirectionality(edge, inventory, taxonomy)
    ).toBeUndefined();
  });

  it('returns undefined when source is LCA itself or destination is not a direct child of LCA', () => {
    const { inventory, taxonomy } = buildInventoryAndTaxonomy([
      {
        depth: 0,
        domainKind: 'fragment',
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src/table',
        preorderEnd: 4,
        preorderStart: 0,
      },
      {
        depth: 1,
        id: 1,
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 0,
        path: 'src/table/table.component.ts',
        preorderEnd: 1,
        preorderStart: 1,
      },
      {
        depth: 1,
        domainKind: 'category',
        id: 2,
        isPrivateCategory: true,
        kind: 'directory',
        parentId: 0,
        path: 'src/table/_components',
        preorderEnd: 4,
        preorderStart: 2,
      },
      {
        depth: 2,
        domainKind: 'fragment',
        id: 3,
        kind: 'directory',
        parentId: 2,
        path: 'src/table/_components/cell',
        preorderEnd: 4,
        preorderStart: 3,
      },
      {
        depth: 3,
        id: 4,
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 3,
        path: 'src/table/_components/cell/index.ts',
        preorderEnd: 4,
        preorderStart: 4,
      },
    ]);

    const outwardEdge = createEdge(
      'src/table/table.component.ts',
      'src/table/_components/cell/index.ts'
    );
    expect(
      checkPrivateCategoryUnidirectionality(outwardEdge, inventory, taxonomy)
    ).toBeUndefined();

    const notDirectChildEdge = createEdge(
      'src/table/table.component.ts',
      'src/table/table.component.ts'
    );
    expect(
      checkPrivateCategoryUnidirectionality(
        notDirectChildEdge,
        inventory,
        taxonomy
      )
    ).toBeUndefined();
  });

  it('returns undefined when first step from LCA towards source is not a Private Category', () => {
    const { inventory, taxonomy } = buildInventoryAndTaxonomy([
      {
        depth: 0,
        domainKind: 'fragment',
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src/table',
        preorderEnd: 3,
        preorderStart: 0,
      },
      {
        depth: 1,
        id: 1,
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 0,
        path: 'src/table/table.component.ts',
        preorderEnd: 1,
        preorderStart: 1,
      },
      {
        depth: 1,
        domainKind: 'category',
        id: 2,
        isPrivateCategory: false,
        kind: 'directory',
        parentId: 0,
        path: 'src/table/_table@shared',
        preorderEnd: 3,
        preorderStart: 2,
      },
      {
        depth: 2,
        id: 3,
        kind: 'file',
        nodeKind: 'fragment-node',
        parentId: 2,
        path: 'src/table/_table@shared/data.ts',
        preorderEnd: 3,
        preorderStart: 3,
      },
    ]);

    const edge = createEdge(
      'src/table/_table@shared/data.ts',
      'src/table/table.component.ts'
    );
    expect(
      checkPrivateCategoryUnidirectionality(edge, inventory, taxonomy)
    ).toBeUndefined();
  });

  it('returns undefined when destination nodeKind is foreign-node or missing', () => {
    const { inventory, taxonomy } = buildInventoryAndTaxonomy([
      {
        depth: 0,
        domainKind: 'root-fragment',
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src/app',
        preorderEnd: 3,
        preorderStart: 0,
      },
      {
        depth: 1,
        id: 1,
        kind: 'file',
        nodeKind: 'foreign-node',
        parentId: 0,
        path: 'src/app/alien.ts',
        preorderEnd: 1,
        preorderStart: 1,
      },
      {
        depth: 1,
        domainKind: 'category',
        id: 2,
        isPrivateCategory: true,
        kind: 'directory',
        parentId: 0,
        path: 'src/app/_utils',
        preorderEnd: 3,
        preorderStart: 2,
      },
      {
        depth: 2,
        id: 3,
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 2,
        path: 'src/app/_utils/helper.ts',
        preorderEnd: 3,
        preorderStart: 3,
      },
    ]);

    const edge = createEdge('src/app/_utils/helper.ts', 'src/app/alien.ts');
    expect(
      checkPrivateCategoryUnidirectionality(edge, inventory, taxonomy)
    ).toBeUndefined();
  });

  it('produces unidirectionality outcome for flows from private details to direct nodes of parent', () => {
    const { inventory, taxonomy } = buildInventoryAndTaxonomy([
      {
        depth: 0,
        domainKind: 'fragment',
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src/table',
        preorderEnd: 7,
        preorderStart: 0,
      },
      {
        depth: 1,
        id: 1,
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 0,
        path: 'src/table/table.component.ts',
        preorderEnd: 1,
        preorderStart: 1,
      },
      {
        depth: 1,
        id: 2,
        kind: 'file',
        nodeKind: 'fragment-node',
        parentId: 0,
        path: 'src/table/table.type.ts',
        preorderEnd: 2,
        preorderStart: 2,
      },
      {
        depth: 1,
        id: 3,
        kind: 'file',
        nodeKind: 'sub-graph-node',
        parentId: 0,
        path: 'src/table/table.spec.ts',
        preorderEnd: 3,
        preorderStart: 3,
      },
      {
        depth: 1,
        id: 4,
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 0,
        path: 'src/table/index.ts',
        preorderEnd: 4,
        preorderStart: 4,
      },
      {
        depth: 1,
        domainKind: 'category',
        id: 5,
        isPrivateCategory: true,
        kind: 'directory',
        parentId: 0,
        path: 'src/table/_components',
        preorderEnd: 7,
        preorderStart: 5,
      },
      {
        depth: 2,
        domainKind: 'fragment',
        id: 6,
        kind: 'directory',
        parentId: 5,
        path: 'src/table/_components/cell',
        preorderEnd: 7,
        preorderStart: 6,
      },
      {
        depth: 3,
        id: 7,
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 6,
        path: 'src/table/_components/cell/cell.component.ts',
        preorderEnd: 7,
        preorderStart: 7,
      },
    ]);

    const source = 'src/table/_components/cell/cell.component.ts';

    const edgeMaster = createEdge(
      source,
      'src/table/table.component.ts',
      '../table.component.js'
    );
    expect(
      checkPrivateCategoryUnidirectionality(edgeMaster, inventory, taxonomy)
    ).toEqual({
      constraint: 'dependency/private-category-unidirectionality',
      element: source,
      family: 'dependency',
      from: source,
      importIndex: 0,
      message:
        "'src/table/_components/cell/cell.component.ts' imports 'src/table/table.component.ts' through '../table.component.js': a Private Category must not import the direct Logical Nodes of its parent",
      normativeReference: 'FAF §6.3.3',
      position: { column: 1, line: 1 },
      specifier: '../table.component.js',
      to: 'src/table/table.component.ts',
    });

    const edgeType = createEdge(source, 'src/table/table.type.ts');
    expect(
      checkPrivateCategoryUnidirectionality(edgeType, inventory, taxonomy)
        ?.constraint
    ).toBe('dependency/private-category-unidirectionality');

    const edgeSpec = createEdge(source, 'src/table/table.spec.ts');
    expect(
      checkPrivateCategoryUnidirectionality(edgeSpec, inventory, taxonomy)
        ?.constraint
    ).toBe('dependency/private-category-unidirectionality');

    const edgeAccess = createEdge(source, 'src/table/index.ts');
    expect(
      checkPrivateCategoryUnidirectionality(edgeAccess, inventory, taxonomy)
        ?.constraint
    ).toBe('dependency/private-category-unidirectionality');
  });

  it('produces unidirectionality outcome for flows to direct Root Node of Root Fragment', () => {
    const { inventory, taxonomy } = buildInventoryAndTaxonomy([
      {
        depth: 0,
        domainKind: 'root-fragment',
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src/app',
        preorderEnd: 3,
        preorderStart: 0,
      },
      {
        depth: 1,
        id: 1,
        kind: 'file',
        nodeKind: 'root-node',
        parentId: 0,
        path: 'src/app/app.ts',
        preorderEnd: 1,
        preorderStart: 1,
      },
      {
        depth: 1,
        domainKind: 'category',
        id: 2,
        isPrivateCategory: true,
        kind: 'directory',
        parentId: 0,
        path: 'src/app/_components',
        preorderEnd: 3,
        preorderStart: 2,
      },
      {
        depth: 2,
        id: 3,
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 2,
        path: 'src/app/_components/shell.ts',
        preorderEnd: 3,
        preorderStart: 3,
      },
    ]);

    const edge = createEdge('src/app/_components/shell.ts', 'src/app/app.ts');
    expect(
      checkPrivateCategoryUnidirectionality(edge, inventory, taxonomy)
        ?.constraint
    ).toBe('dependency/private-category-unidirectionality');
  });

  it('returns undefined when destinationItem is absent from items array', () => {
    const { inventory, taxonomy } = buildInventoryAndTaxonomy(
      [
        {
          depth: 0,
          id: 0,
          kind: 'file',
          nodeKind: 'root-node',
          parentId: null,
          path: 'src/main.ts',
          preorderEnd: 0,
          preorderStart: 0,
        },
      ],
      { phantomPath: 'src/phantom.ts' }
    );
    const edge = createEdge('src/main.ts', 'src/phantom.ts');
    expect(
      checkPrivateCategoryUnidirectionality(edge, inventory, taxonomy)
    ).toBeUndefined();
  });

  it('returns undefined when destination classification is missing from taxonomy', () => {
    const { inventory, taxonomy } = buildInventoryAndTaxonomy(
      [
        {
          depth: 0,
          domainKind: 'fragment',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src/table',
          preorderEnd: 3,
          preorderStart: 0,
        },
        {
          depth: 1,
          id: 1,
          kind: 'file',
          nodeKind: 'master-node',
          parentId: 0,
          path: 'src/table/table.component.ts',
          preorderEnd: 1,
          preorderStart: 1,
        },
        {
          depth: 1,
          domainKind: 'category',
          id: 2,
          isPrivateCategory: true,
          kind: 'directory',
          parentId: 0,
          path: 'src/table/_components',
          preorderEnd: 3,
          preorderStart: 2,
        },
        {
          depth: 2,
          id: 3,
          kind: 'file',
          nodeKind: 'master-node',
          parentId: 2,
          path: 'src/table/_components/cell.ts',
          preorderEnd: 3,
          preorderStart: 3,
        },
      ],
      { skipClassificationId: 1 }
    );
    const edge = createEdge(
      'src/table/_components/cell.ts',
      'src/table/table.component.ts'
    );
    expect(
      checkPrivateCategoryUnidirectionality(edge, inventory, taxonomy)
    ).toBeUndefined();
  });

  it('returns undefined when destination nodeKind is null', () => {
    const { inventory, taxonomy } = buildInventoryAndTaxonomy([
      {
        depth: 0,
        domainKind: 'fragment',
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src/table',
        preorderEnd: 3,
        preorderStart: 0,
      },
      {
        depth: 1,
        id: 1,
        kind: 'file',
        parentId: 0,
        path: 'src/table/table.unknown.ts',
        preorderEnd: 1,
        preorderStart: 1,
      },
      {
        depth: 1,
        domainKind: 'category',
        id: 2,
        isPrivateCategory: true,
        kind: 'directory',
        parentId: 0,
        path: 'src/table/_components',
        preorderEnd: 3,
        preorderStart: 2,
      },
      {
        depth: 2,
        id: 3,
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 2,
        path: 'src/table/_components/cell.ts',
        preorderEnd: 3,
        preorderStart: 3,
      },
    ]);
    const edge = createEdge(
      'src/table/_components/cell.ts',
      'src/table/table.unknown.ts'
    );
    expect(
      checkPrivateCategoryUnidirectionality(edge, inventory, taxonomy)
    ).toBeUndefined();
  });
});
