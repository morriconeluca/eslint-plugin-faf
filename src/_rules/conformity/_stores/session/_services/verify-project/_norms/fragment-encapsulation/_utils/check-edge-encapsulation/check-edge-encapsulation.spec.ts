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

import { checkEdgeEncapsulation } from './check-edge-encapsulation.util.js';

const createEdge = (from: string, to: string): TEdgeMetadata => ({
  aliasAlternatives: [],
  aliasUsed: null,
  destinationPath: to,
  importIndex: 0,
  isTypeOnly: false,
  position: { column: 1, line: 1 },
  sourcePath: from,
  specifier: './target.js',
  syntaxKind: 'named-import',
});

const createClassification = (
  id: number,
  path: string,
  domainKind: 'category' | 'fragment' | null,
  nodeKind: 'master-node' | null
): TItemClassification => ({
  domainKind,
  entryKind: domainKind === null ? 'file' : 'directory',
  fragmentInternalRank: null,
  imposedRoleName: null,
  itemId: id,
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

describe('checkEdgeEncapsulation', () => {
  it('returns outcome when importing a fragment node from outside the fragment', () => {
    const root: TInventoryItem = {
      depth: 0,
      id: 0,
      isSymlink: false,
      kind: 'directory',
      parentId: null,
      path: 'src',
      preorderEnd: 3,
      preorderStart: 0,
      realPath: 'src',
      treeOrigin: 'src',
    };
    const consumer: TInventoryItem = {
      depth: 1,
      id: 1,
      isSymlink: false,
      kind: 'file',
      parentId: 0,
      path: 'src/main.ts',
      preorderEnd: 1,
      preorderStart: 1,
      realPath: 'src/main.ts',
      treeOrigin: 'src',
    };
    const fragment: TInventoryItem = {
      depth: 1,
      id: 2,
      isSymlink: false,
      kind: 'directory',
      parentId: 0,
      path: 'src/widget',
      preorderEnd: 3,
      preorderStart: 2,
      realPath: 'src/widget',
      treeOrigin: 'src',
    };
    const master: TInventoryItem = {
      depth: 2,
      id: 3,
      isSymlink: false,
      kind: 'file',
      parentId: 2,
      path: 'src/widget/widget.util.ts',
      preorderEnd: 3,
      preorderStart: 3,
      realPath: 'src/widget/widget.util.ts',
      treeOrigin: 'src',
    };

    const items = [root, consumer, fragment, master];
    const inventory: TInventory = {
      items,
      pathToId: new Map(items.map((item) => [item.path, item.id])),
      realPathToId: new Map(items.map((item) => [item.realPath, item.id])),
    };

    const fragmentClass = createClassification(
      2,
      'src/widget',
      'fragment',
      null
    );
    const masterClass = createClassification(
      3,
      'src/widget/widget.util.ts',
      null,
      'master-node'
    );

    const taxonomy: TTaxonomyModel = {
      byItemId: new Map([
        [2, fragmentClass],
        [3, masterClass],
      ]),
      byPath: new Map([
        ['src/widget', fragmentClass],
        ['src/widget/widget.util.ts', masterClass],
      ]),
      classifications: [fragmentClass, masterClass],
    };

    const edge = createEdge('src/main.ts', 'src/widget/widget.util.ts');
    const outcome = checkEdgeEncapsulation(edge, inventory, taxonomy);

    expect(outcome?.constraint).toBe('dependency/fragment-encapsulation');
    expect(outcome?.from).toBe('src/main.ts');
    expect(outcome?.to).toBe('src/widget/widget.util.ts');
  });

  it('returns undefined when destination is not in inventory or not a fragment node', () => {
    const inventory: TInventory = {
      items: [],
      pathToId: new Map(),
      realPathToId: new Map(),
    };
    const taxonomy: TTaxonomyModel = {
      byItemId: new Map(),
      byPath: new Map(),
      classifications: [],
    };
    expect(
      checkEdgeEncapsulation(
        createEdge('src/main.ts', 'src/missing.ts'),
        inventory,
        taxonomy
      )
    ).toBeUndefined();
  });

  it('returns undefined when destination node has null parentId or invalid parent item', () => {
    const rootFile: TInventoryItem = {
      depth: 0,
      id: 0,
      isSymlink: false,
      kind: 'file',
      parentId: null,
      path: 'src/main.ts',
      preorderEnd: 0,
      preorderStart: 0,
      realPath: 'src/main.ts',
      treeOrigin: 'src',
    };
    const orphanFile: TInventoryItem = {
      depth: 1,
      id: 1,
      isSymlink: false,
      kind: 'file',
      parentId: 99,
      path: 'src/orphan.ts',
      preorderEnd: 1,
      preorderStart: 1,
      realPath: 'src/orphan.ts',
      treeOrigin: 'src',
    };
    const items = [rootFile, orphanFile];
    const inventory: TInventory = {
      items,
      pathToId: new Map([
        ...items.map((item) => [item.path, item.id] as const),
        ['src/unindexed-item.ts', 50],
      ]),
      realPathToId: new Map(items.map((item) => [item.realPath, item.id])),
    };
    const masterClassRoot = createClassification(
      0,
      'src/main.ts',
      null,
      'master-node'
    );
    const masterClassOrphan = createClassification(
      1,
      'src/orphan.ts',
      null,
      'master-node'
    );
    const masterClassMissingItem = createClassification(
      50,
      'src/unindexed-item.ts',
      null,
      'master-node'
    );
    const taxonomy: TTaxonomyModel = {
      byItemId: new Map([
        [0, masterClassRoot],
        [1, masterClassOrphan],
        [50, masterClassMissingItem],
      ]),
      byPath: new Map([
        ['src/main.ts', masterClassRoot],
        ['src/orphan.ts', masterClassOrphan],
        ['src/unindexed-item.ts', masterClassMissingItem],
      ]),
      classifications: [
        masterClassRoot,
        masterClassOrphan,
        masterClassMissingItem,
      ],
    };

    expect(
      checkEdgeEncapsulation(
        createEdge('src/other.ts', 'src/main.ts'),
        inventory,
        taxonomy
      )
    ).toBeUndefined();
    expect(
      checkEdgeEncapsulation(
        createEdge('src/other.ts', 'src/orphan.ts'),
        inventory,
        taxonomy
      )
    ).toBeUndefined();
    expect(
      checkEdgeEncapsulation(
        createEdge('src/other.ts', 'src/unindexed-item.ts'),
        inventory,
        taxonomy
      )
    ).toBeUndefined();
  });

  it('returns undefined when destination parent is not a fragment domain or unclassified', () => {
    const root: TInventoryItem = {
      depth: 0,
      id: 0,
      isSymlink: false,
      kind: 'directory',
      parentId: null,
      path: 'src',
      preorderEnd: 3,
      preorderStart: 0,
      realPath: 'src',
      treeOrigin: 'src',
    };
    const consumer: TInventoryItem = {
      depth: 1,
      id: 1,
      isSymlink: false,
      kind: 'file',
      parentId: 0,
      path: 'src/main.ts',
      preorderEnd: 1,
      preorderStart: 1,
      realPath: 'src/main.ts',
      treeOrigin: 'src',
    };
    const category: TInventoryItem = {
      depth: 1,
      id: 2,
      isSymlink: false,
      kind: 'directory',
      parentId: 0,
      path: 'src/_utils',
      preorderEnd: 3,
      preorderStart: 2,
      realPath: 'src/_utils',
      treeOrigin: 'src',
    };
    const file: TInventoryItem = {
      depth: 2,
      id: 3,
      isSymlink: false,
      kind: 'file',
      parentId: 2,
      path: 'src/_utils/file.ts',
      preorderEnd: 3,
      preorderStart: 3,
      realPath: 'src/_utils/file.ts',
      treeOrigin: 'src',
    };
    const items = [root, consumer, category, file];
    const inventory: TInventory = {
      items,
      pathToId: new Map(items.map((item) => [item.path, item.id])),
      realPathToId: new Map(items.map((item) => [item.realPath, item.id])),
    };
    const catClass = createClassification(2, 'src/_utils', 'category', null);
    const masterClass = createClassification(
      3,
      'src/_utils/file.ts',
      null,
      'master-node'
    );
    const taxonomyWithCategory: TTaxonomyModel = {
      byItemId: new Map([
        [2, catClass],
        [3, masterClass],
      ]),
      byPath: new Map([
        ['src/_utils', catClass],
        ['src/_utils/file.ts', masterClass],
      ]),
      classifications: [catClass, masterClass],
    };
    const taxonomyWithoutParent: TTaxonomyModel = {
      byItemId: new Map([[3, masterClass]]),
      byPath: new Map([['src/_utils/file.ts', masterClass]]),
      classifications: [masterClass],
    };

    expect(
      checkEdgeEncapsulation(
        createEdge('src/main.ts', 'src/_utils/file.ts'),
        inventory,
        taxonomyWithCategory
      )
    ).toBeUndefined();
    expect(
      checkEdgeEncapsulation(
        createEdge('src/main.ts', 'src/_utils/file.ts'),
        inventory,
        taxonomyWithoutParent
      )
    ).toBeUndefined();
  });

  it('returns undefined when source is inside the destination fragment or cross-tree', () => {
    const fragment: TInventoryItem = {
      depth: 0,
      id: 0,
      isSymlink: false,
      kind: 'directory',
      parentId: null,
      path: 'src/widget',
      preorderEnd: 2,
      preorderStart: 0,
      realPath: 'src/widget',
      treeOrigin: 'src',
    };
    const internalSource: TInventoryItem = {
      depth: 1,
      id: 1,
      isSymlink: false,
      kind: 'file',
      parentId: 0,
      path: 'src/widget/index.ts',
      preorderEnd: 1,
      preorderStart: 1,
      realPath: 'src/widget/index.ts',
      treeOrigin: 'src',
    };
    const targetMaster: TInventoryItem = {
      depth: 1,
      id: 2,
      isSymlink: false,
      kind: 'file',
      parentId: 0,
      path: 'src/widget/widget.util.ts',
      preorderEnd: 2,
      preorderStart: 2,
      realPath: 'src/widget/widget.util.ts',
      treeOrigin: 'src',
    };
    const crossTreeConsumer: TInventoryItem = {
      depth: 0,
      id: 3,
      isSymlink: false,
      kind: 'file',
      parentId: null,
      path: 'lib/main.ts',
      preorderEnd: 3,
      preorderStart: 3,
      realPath: 'lib/main.ts',
      treeOrigin: 'lib',
    };

    const items = [fragment, internalSource, targetMaster, crossTreeConsumer];
    const inventory: TInventory = {
      items,
      pathToId: new Map(items.map((item) => [item.path, item.id])),
      realPathToId: new Map(items.map((item) => [item.realPath, item.id])),
    };
    const fragmentClass = createClassification(
      0,
      'src/widget',
      'fragment',
      null
    );
    const masterClass = createClassification(
      2,
      'src/widget/widget.util.ts',
      null,
      'master-node'
    );
    const taxonomy: TTaxonomyModel = {
      byItemId: new Map([
        [0, fragmentClass],
        [2, masterClass],
      ]),
      byPath: new Map([
        ['src/widget', fragmentClass],
        ['src/widget/widget.util.ts', masterClass],
      ]),
      classifications: [fragmentClass, masterClass],
    };

    expect(
      checkEdgeEncapsulation(
        createEdge('src/widget/index.ts', 'src/widget/widget.util.ts'),
        inventory,
        taxonomy
      )
    ).toBeUndefined();
    expect(
      checkEdgeEncapsulation(
        createEdge('lib/main.ts', 'src/widget/widget.util.ts'),
        inventory,
        taxonomy
      )
    ).toBeUndefined();
  });
});
