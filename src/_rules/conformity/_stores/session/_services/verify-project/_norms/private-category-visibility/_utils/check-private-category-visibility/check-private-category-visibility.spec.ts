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

import { checkPrivateCategoryVisibility } from './check-private-category-visibility.util.js';

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

describe('checkPrivateCategoryVisibility', () => {
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
      checkPrivateCategoryVisibility(edge, inventory, taxonomy)
    ).toBeUndefined();
  });

  it('returns undefined when source is not in inventory', () => {
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
    const edge = createEdge('src/missing.ts', 'src/main.ts');
    expect(
      checkPrivateCategoryVisibility(edge, inventory, taxonomy)
    ).toBeUndefined();
  });

  it('returns undefined when sourceItem is absent from items array', () => {
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
      { phantomPath: 'src/phantom-source.ts' }
    );
    const edge = createEdge('src/phantom-source.ts', 'src/main.ts');
    expect(
      checkPrivateCategoryVisibility(edge, inventory, taxonomy)
    ).toBeUndefined();
  });

  it('returns undefined when edge endpoints belong to different trees', () => {
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
      checkPrivateCategoryVisibility(edge, inventory, taxonomy)
    ).toBeUndefined();
  });

  it('returns undefined when destination path does not enter any Private Category', () => {
    const { inventory, taxonomy } = buildInventoryAndTaxonomy([
      {
        depth: 0,
        domainKind: 'fragment',
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src/button',
        preorderEnd: 2,
        preorderStart: 0,
      },
      {
        depth: 1,
        id: 1,
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 0,
        path: 'src/button/button.component.ts',
        preorderEnd: 1,
        preorderStart: 1,
      },
      {
        depth: 1,
        id: 2,
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 0,
        path: 'src/button/index.ts',
        preorderEnd: 2,
        preorderStart: 2,
      },
    ]);
    const edge = createEdge(
      'src/button/button.component.ts',
      'src/button/index.ts'
    );
    expect(
      checkPrivateCategoryVisibility(edge, inventory, taxonomy)
    ).toBeUndefined();
  });

  it('allows direct Fragment Node, Master Node and Sub-Graph Node of parent to import into Private Category', () => {
    const { inventory, taxonomy } = buildInventoryAndTaxonomy([
      {
        depth: 0,
        domainKind: 'fragment',
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src/button',
        preorderEnd: 6,
        preorderStart: 0,
      },
      {
        depth: 1,
        id: 1,
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 0,
        path: 'src/button/button.component.ts',
        preorderEnd: 1,
        preorderStart: 1,
      },
      {
        depth: 1,
        id: 2,
        kind: 'file',
        nodeKind: 'fragment-node',
        parentId: 0,
        path: 'src/button/button.type.ts',
        preorderEnd: 2,
        preorderStart: 2,
      },
      {
        depth: 1,
        id: 3,
        kind: 'file',
        nodeKind: 'sub-graph-node',
        parentId: 0,
        path: 'src/button/button.spec.ts',
        preorderEnd: 3,
        preorderStart: 3,
      },
      {
        depth: 1,
        domainKind: 'category',
        id: 4,
        isPrivateCategory: true,
        kind: 'directory',
        parentId: 0,
        path: 'src/button/_utils',
        preorderEnd: 6,
        preorderStart: 4,
      },
      {
        depth: 2,
        domainKind: 'fragment',
        id: 5,
        kind: 'directory',
        parentId: 4,
        path: 'src/button/_utils/normalize',
        preorderEnd: 6,
        preorderStart: 5,
      },
      {
        depth: 3,
        id: 6,
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 5,
        path: 'src/button/_utils/normalize/index.ts',
        preorderEnd: 6,
        preorderStart: 6,
      },
    ]);

    const target = 'src/button/_utils/normalize/index.ts';
    expect(
      checkPrivateCategoryVisibility(
        createEdge('src/button/button.component.ts', target),
        inventory,
        taxonomy
      )
    ).toBeUndefined();
    expect(
      checkPrivateCategoryVisibility(
        createEdge('src/button/button.type.ts', target),
        inventory,
        taxonomy
      )
    ).toBeUndefined();
    expect(
      checkPrivateCategoryVisibility(
        createEdge('src/button/button.spec.ts', target),
        inventory,
        taxonomy
      )
    ).toBeUndefined();
  });

  it('forbids Access Node of parent from importing into its own Private Category', () => {
    const { inventory, taxonomy } = buildInventoryAndTaxonomy([
      {
        depth: 0,
        domainKind: 'fragment',
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src/button',
        preorderEnd: 4,
        preorderStart: 0,
      },
      {
        depth: 1,
        id: 1,
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 0,
        path: 'src/button/index.ts',
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
        path: 'src/button/_utils',
        preorderEnd: 4,
        preorderStart: 2,
      },
      {
        depth: 2,
        domainKind: 'fragment',
        id: 3,
        kind: 'directory',
        parentId: 2,
        path: 'src/button/_utils/normalize',
        preorderEnd: 4,
        preorderStart: 3,
      },
      {
        depth: 3,
        id: 4,
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 3,
        path: 'src/button/_utils/normalize/index.ts',
        preorderEnd: 4,
        preorderStart: 4,
      },
    ]);

    const edge = createEdge(
      'src/button/index.ts',
      'src/button/_utils/normalize/index.ts',
      './_utils/normalize/index.js'
    );
    const outcome = checkPrivateCategoryVisibility(edge, inventory, taxonomy);
    expect(outcome).toEqual({
      constraint: 'dependency/private-category-visibility',
      element: 'src/button/index.ts',
      family: 'dependency',
      from: 'src/button/index.ts',
      importIndex: 0,
      message:
        "'src/button/index.ts' imports 'src/button/_utils/normalize/index.ts' through './_utils/normalize/index.js': a Private Category is importable from outside only by the enabled direct Logical Nodes of its parent",
      normativeReference: 'FAF §6.3.3',
      position: { column: 1, line: 1 },
      specifier: './_utils/normalize/index.js',
      to: 'src/button/_utils/normalize/index.ts',
    });
  });

  it('allows direct Root Node of Root Fragment and forbids foreign/nested nodes', () => {
    const { inventory, taxonomy } = buildInventoryAndTaxonomy([
      {
        depth: 0,
        domainKind: 'root-fragment',
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src/app',
        preorderEnd: 6,
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
        id: 2,
        kind: 'file',
        nodeKind: 'foreign-node',
        parentId: 0,
        path: 'src/app/alien.ts',
        preorderEnd: 2,
        preorderStart: 2,
      },
      {
        depth: 1,
        domainKind: 'category',
        id: 3,
        isPrivateCategory: true,
        kind: 'directory',
        parentId: 0,
        path: 'src/app/_components',
        preorderEnd: 5,
        preorderStart: 3,
      },
      {
        depth: 2,
        domainKind: 'fragment',
        id: 4,
        kind: 'directory',
        parentId: 3,
        path: 'src/app/_components/shell',
        preorderEnd: 5,
        preorderStart: 4,
      },
      {
        depth: 3,
        id: 5,
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 4,
        path: 'src/app/_components/shell/index.ts',
        preorderEnd: 5,
        preorderStart: 5,
      },
      {
        depth: 1,
        domainKind: 'root-fragment',
        id: 6,
        kind: 'directory',
        parentId: 0,
        path: 'src/app/child',
        preorderEnd: 6,
        preorderStart: 6,
      },
      {
        depth: 2,
        id: 7,
        kind: 'file',
        nodeKind: 'root-node',
        parentId: 6,
        path: 'src/app/child/child.ts',
        preorderEnd: 6,
        preorderStart: 6,
      },
    ]);

    const target = 'src/app/_components/shell/index.ts';
    expect(
      checkPrivateCategoryVisibility(
        createEdge('src/app/app.ts', target),
        inventory,
        taxonomy
      )
    ).toBeUndefined();

    const foreignOutcome = checkPrivateCategoryVisibility(
      createEdge('src/app/alien.ts', target),
      inventory,
      taxonomy
    );
    expect(foreignOutcome?.constraint).toBe(
      'dependency/private-category-visibility'
    );

    const childOutcome = checkPrivateCategoryVisibility(
      createEdge('src/app/child/child.ts', target),
      inventory,
      taxonomy
    );
    expect(childOutcome?.constraint).toBe(
      'dependency/private-category-visibility'
    );
  });

  it('forbids parent from crossing a second nested Private Category under a sub-fragment', () => {
    const { inventory, taxonomy } = buildInventoryAndTaxonomy([
      {
        depth: 0,
        domainKind: 'fragment',
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src/table',
        preorderEnd: 6,
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
        preorderEnd: 6,
        preorderStart: 2,
      },
      {
        depth: 2,
        domainKind: 'fragment',
        id: 3,
        kind: 'directory',
        parentId: 2,
        path: 'src/table/_components/table-body',
        preorderEnd: 6,
        preorderStart: 3,
      },
      {
        depth: 3,
        domainKind: 'category',
        id: 4,
        isPrivateCategory: true,
        kind: 'directory',
        parentId: 3,
        path: 'src/table/_components/table-body/_utils',
        preorderEnd: 6,
        preorderStart: 4,
      },
      {
        depth: 4,
        domainKind: 'fragment',
        id: 5,
        kind: 'directory',
        parentId: 4,
        path: 'src/table/_components/table-body/_utils/deep',
        preorderEnd: 6,
        preorderStart: 5,
      },
      {
        depth: 5,
        id: 6,
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 5,
        path: 'src/table/_components/table-body/_utils/deep/index.ts',
        preorderEnd: 6,
        preorderStart: 6,
      },
    ]);

    const edge = createEdge(
      'src/table/table.component.ts',
      'src/table/_components/table-body/_utils/deep/index.ts'
    );
    const outcome = checkPrivateCategoryVisibility(edge, inventory, taxonomy);
    expect(outcome?.constraint).toBe('dependency/private-category-visibility');
  });

  it('allows collaboration inside the same Private Category across sub-categories', () => {
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
        domainKind: 'category',
        id: 1,
        isPrivateCategory: true,
        kind: 'directory',
        parentId: 0,
        path: 'src/table/_components',
        preorderEnd: 7,
        preorderStart: 1,
      },
      {
        depth: 2,
        domainKind: 'category',
        id: 2,
        kind: 'directory',
        parentId: 1,
        path: 'src/table/_components/_molecules',
        preorderEnd: 4,
        preorderStart: 2,
      },
      {
        depth: 3,
        domainKind: 'fragment',
        id: 3,
        kind: 'directory',
        parentId: 2,
        path: 'src/table/_components/_molecules/consumer',
        preorderEnd: 4,
        preorderStart: 3,
      },
      {
        depth: 4,
        id: 4,
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 3,
        path: 'src/table/_components/_molecules/consumer/consumer.component.ts',
        preorderEnd: 4,
        preorderStart: 4,
      },
      {
        depth: 2,
        domainKind: 'category',
        id: 5,
        kind: 'directory',
        parentId: 1,
        path: 'src/table/_components/_atoms',
        preorderEnd: 7,
        preorderStart: 5,
      },
      {
        depth: 3,
        domainKind: 'fragment',
        id: 6,
        kind: 'directory',
        parentId: 5,
        path: 'src/table/_components/_atoms/unit',
        preorderEnd: 7,
        preorderStart: 6,
      },
      {
        depth: 4,
        id: 7,
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 6,
        path: 'src/table/_components/_atoms/unit/index.ts',
        preorderEnd: 7,
        preorderStart: 7,
      },
    ]);

    const edge = createEdge(
      'src/table/_components/_molecules/consumer/consumer.component.ts',
      'src/table/_components/_atoms/unit/index.ts'
    );
    expect(
      checkPrivateCategoryVisibility(edge, inventory, taxonomy)
    ).toBeUndefined();
  });
});
