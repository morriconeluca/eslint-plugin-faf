import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TLogicalDomainKind,
  TNodeKind,
  TTaxonomyModel,
} from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEdgeMetadata } from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { checkBranchVisibility } from './index.js';

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
  domainKind: null | TLogicalDomainKind,
  nodeKind: null | TNodeKind
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

const buildTaxonomy = (
  classifications: readonly TItemClassification[]
): TTaxonomyModel => ({
  byItemId: new Map(classifications.map((item) => [item.itemId, item])),
  byPath: new Map(classifications.map((item) => [item.path, item])),
  classifications,
});

describe('checkBranchVisibility', () => {
  it('returns undefined when destination is not in inventory', () => {
    const source: TInventoryItem = {
      depth: 1,
      id: 0,
      isSymlink: false,
      kind: 'file',
      parentId: null,
      path: 'src/main.ts',
      preorderEnd: 1,
      preorderStart: 1,
      realPath: 'src/main.ts',
      treeOrigin: 'src',
    };
    const inventory: TInventory = {
      items: [source],
      pathToId: new Map([['src/main.ts', 0]]),
      realPathToId: new Map([['src/main.ts', 0]]),
    };
    const taxonomy = buildTaxonomy([
      createClassification(0, 'src/main.ts', null, 'root-node'),
    ]);
    const edge = createEdge('src/main.ts', 'src/missing.ts');
    expect(checkBranchVisibility(edge, inventory, taxonomy)).toBeUndefined();
  });

  it('returns undefined when source is not in inventory', () => {
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
    const branch: TInventoryItem = {
      depth: 1,
      id: 1,
      isSymlink: false,
      kind: 'directory',
      parentId: 0,
      path: 'src/_src@shared',
      preorderEnd: 3,
      preorderStart: 1,
      realPath: 'src/_src@shared',
      treeOrigin: 'src',
    };
    const cat: TInventoryItem = {
      depth: 2,
      id: 2,
      isSymlink: false,
      kind: 'directory',
      parentId: 1,
      path: 'src/_src@shared/_types',
      preorderEnd: 3,
      preorderStart: 2,
      realPath: 'src/_src@shared/_types',
      treeOrigin: 'src',
    };
    const destinationItem: TInventoryItem = {
      depth: 3,
      id: 3,
      isSymlink: false,
      kind: 'file',
      parentId: 2,
      path: 'src/_src@shared/_types/a.type.ts',
      preorderEnd: 3,
      preorderStart: 3,
      realPath: 'src/_src@shared/_types/a.type.ts',
      treeOrigin: 'src',
    };
    const items = [root, branch, cat, destinationItem];
    const inventory: TInventory = {
      items,
      pathToId: new Map(items.map((item) => [item.path, item.id])),
      realPathToId: new Map(items.map((item) => [item.realPath, item.id])),
    };
    const taxonomy = buildTaxonomy([
      createClassification(0, 'src', 'root-fragment', null),
      createClassification(1, 'src/_src@shared', 'fractal-branch', null),
      createClassification(2, 'src/_src@shared/_types', 'category', null),
      createClassification(
        3,
        'src/_src@shared/_types/a.type.ts',
        null,
        'category-node'
      ),
    ]);
    const edge = createEdge('outside.ts', 'src/_src@shared/_types/a.type.ts');
    expect(checkBranchVisibility(edge, inventory, taxonomy)).toBeUndefined();
  });

  it('returns undefined when destination item is missing from items array', () => {
    const sourceItem: TInventoryItem = {
      depth: 1,
      id: 1,
      isSymlink: false,
      kind: 'file',
      parentId: null,
      path: 'src/main.ts',
      preorderEnd: 1,
      preorderStart: 1,
      realPath: 'src/main.ts',
      treeOrigin: 'src',
    };
    const items: TInventoryItem[] = [];
    items[1] = sourceItem;
    const inventory: TInventory = {
      items,
      pathToId: new Map([
        ['src/dest.ts', 0],
        ['src/main.ts', 1],
      ]),
      realPathToId: new Map([
        ['src/dest.ts', 0],
        ['src/main.ts', 1],
      ]),
    };
    const taxonomy = buildTaxonomy([]);
    const edge = createEdge('src/main.ts', 'src/dest.ts');
    expect(checkBranchVisibility(edge, inventory, taxonomy)).toBeUndefined();
  });

  it('skips branch when branch parentId is null', () => {
    const rootBranch: TInventoryItem = {
      depth: 0,
      id: 0,
      isSymlink: false,
      kind: 'directory',
      parentId: null,
      path: '_shared',
      preorderEnd: 1,
      preorderStart: 0,
      realPath: '_shared',
      treeOrigin: '_shared',
    };
    const destination: TInventoryItem = {
      depth: 1,
      id: 1,
      isSymlink: false,
      kind: 'file',
      parentId: 0,
      path: '_shared/a.type.ts',
      preorderEnd: 1,
      preorderStart: 1,
      realPath: '_shared/a.type.ts',
      treeOrigin: '_shared',
    };
    const source: TInventoryItem = {
      depth: 1,
      id: 2,
      isSymlink: false,
      kind: 'file',
      parentId: null,
      path: 'other/main.ts',
      preorderEnd: 2,
      preorderStart: 2,
      realPath: 'other/main.ts',
      treeOrigin: 'other',
    };
    const items = [rootBranch, destination, source];
    const inventory: TInventory = {
      items,
      pathToId: new Map(items.map((item) => [item.path, item.id])),
      realPathToId: new Map(items.map((item) => [item.realPath, item.id])),
    };
    const taxonomy = buildTaxonomy([
      createClassification(0, '_shared', 'fractal-branch', null),
      createClassification(1, '_shared/a.type.ts', null, 'category-node'),
      createClassification(2, 'other/main.ts', null, 'root-node'),
    ]);
    const edge = createEdge('other/main.ts', '_shared/a.type.ts');
    expect(checkBranchVisibility(edge, inventory, taxonomy)).toBeUndefined();
  });

  it('skips branch when parent item is missing from inventory', () => {
    const branch: TInventoryItem = {
      depth: 1,
      id: 1,
      isSymlink: false,
      kind: 'directory',
      parentId: 99,
      path: 'src/_src@shared',
      preorderEnd: 3,
      preorderStart: 1,
      realPath: 'src/_src@shared',
      treeOrigin: 'src',
    };
    const cat: TInventoryItem = {
      depth: 2,
      id: 2,
      isSymlink: false,
      kind: 'directory',
      parentId: 1,
      path: 'src/_src@shared/_types',
      preorderEnd: 3,
      preorderStart: 2,
      realPath: 'src/_src@shared/_types',
      treeOrigin: 'src',
    };
    const destination: TInventoryItem = {
      depth: 3,
      id: 3,
      isSymlink: false,
      kind: 'file',
      parentId: 2,
      path: 'src/_src@shared/_types/a.type.ts',
      preorderEnd: 3,
      preorderStart: 3,
      realPath: 'src/_src@shared/_types/a.type.ts',
      treeOrigin: 'src',
    };
    const source: TInventoryItem = {
      depth: 1,
      id: 4,
      isSymlink: false,
      kind: 'file',
      parentId: 0,
      path: 'src/main.ts',
      preorderEnd: 4,
      preorderStart: 4,
      realPath: 'src/main.ts',
      treeOrigin: 'src',
    };
    const inventory: TInventory = {
      items: [
        {
          depth: 0,
          id: 0,
          isSymlink: false,
          kind: 'directory',
          parentId: null,
          path: 'src',
          preorderEnd: 4,
          preorderStart: 0,
          realPath: 'src',
          treeOrigin: 'src',
        },
        branch,
        cat,
        destination,
        source,
      ],
      pathToId: new Map([
        ['src/_src@shared/_types/a.type.ts', 3],
        ['src/main.ts', 4],
      ]),
      realPathToId: new Map([
        ['src/_src@shared/_types/a.type.ts', 3],
        ['src/main.ts', 4],
      ]),
    };
    const taxonomy = buildTaxonomy([
      createClassification(1, 'src/_src@shared', 'fractal-branch', null),
      createClassification(2, 'src/_src@shared/_types', 'category', null),
      createClassification(
        3,
        'src/_src@shared/_types/a.type.ts',
        null,
        'category-node'
      ),
      createClassification(4, 'src/main.ts', null, 'root-node'),
    ]);
    const edge = createEdge('src/main.ts', 'src/_src@shared/_types/a.type.ts');
    expect(checkBranchVisibility(edge, inventory, taxonomy)).toBeUndefined();
  });

  it('returns undefined when destination is not inside any Fractal Branch', () => {
    const root: TInventoryItem = {
      depth: 0,
      id: 0,
      isSymlink: false,
      kind: 'directory',
      parentId: null,
      path: 'src',
      preorderEnd: 2,
      preorderStart: 0,
      realPath: 'src',
      treeOrigin: 'src',
    };
    const source: TInventoryItem = {
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
    const destination: TInventoryItem = {
      depth: 1,
      id: 2,
      isSymlink: false,
      kind: 'file',
      parentId: 0,
      path: 'src/other.ts',
      preorderEnd: 2,
      preorderStart: 2,
      realPath: 'src/other.ts',
      treeOrigin: 'src',
    };

    const items = [root, source, destination];
    const inventory: TInventory = {
      items,
      pathToId: new Map(items.map((item) => [item.path, item.id])),
      realPathToId: new Map(items.map((item) => [item.realPath, item.id])),
    };

    const taxonomy = buildTaxonomy([
      createClassification(0, 'src', 'root-layer', null),
      createClassification(1, 'src/main.ts', null, 'root-node'),
      createClassification(2, 'src/other.ts', null, 'root-node'),
    ]);

    const edge = createEdge('src/main.ts', 'src/other.ts');
    expect(checkBranchVisibility(edge, inventory, taxonomy)).toBeUndefined();
  });

  it('admits source inside parent of the Fractal Branch', () => {
    const root: TInventoryItem = {
      depth: 0,
      id: 0,
      isSymlink: false,
      kind: 'directory',
      parentId: null,
      path: 'src',
      preorderEnd: 4,
      preorderStart: 0,
      realPath: 'src',
      treeOrigin: 'src',
    };
    const source: TInventoryItem = {
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
    const branch: TInventoryItem = {
      depth: 1,
      id: 2,
      isSymlink: false,
      kind: 'directory',
      parentId: 0,
      path: 'src/_src@shared',
      preorderEnd: 4,
      preorderStart: 2,
      realPath: 'src/_src@shared',
      treeOrigin: 'src',
    };
    const destinationDirectory: TInventoryItem = {
      depth: 2,
      id: 3,
      isSymlink: false,
      kind: 'directory',
      parentId: 2,
      path: 'src/_src@shared/_types',
      preorderEnd: 4,
      preorderStart: 3,
      realPath: 'src/_src@shared/_types',
      treeOrigin: 'src',
    };
    const destination: TInventoryItem = {
      depth: 3,
      id: 4,
      isSymlink: false,
      kind: 'file',
      parentId: 3,
      path: 'src/_src@shared/_types/shared.type.ts',
      preorderEnd: 4,
      preorderStart: 4,
      realPath: 'src/_src@shared/_types/shared.type.ts',
      treeOrigin: 'src',
    };

    const items = [root, source, branch, destinationDirectory, destination];
    const inventory: TInventory = {
      items,
      pathToId: new Map(items.map((item) => [item.path, item.id])),
      realPathToId: new Map(items.map((item) => [item.realPath, item.id])),
    };

    const taxonomy = buildTaxonomy([
      createClassification(0, 'src', 'root-fragment', null),
      createClassification(1, 'src/main.ts', null, 'root-node'),
      createClassification(2, 'src/_src@shared', 'fractal-branch', null),
      createClassification(3, 'src/_src@shared/_types', 'category', null),
      createClassification(
        4,
        'src/_src@shared/_types/shared.type.ts',
        null,
        'category-node'
      ),
    ]);

    const edge = createEdge(
      'src/main.ts',
      'src/_src@shared/_types/shared.type.ts'
    );
    expect(checkBranchVisibility(edge, inventory, taxonomy)).toBeUndefined();
  });

  it('rejects source outside parent of the Fractal Branch', () => {
    const root: TInventoryItem = {
      depth: 0,
      id: 0,
      isSymlink: false,
      kind: 'directory',
      parentId: null,
      path: 'src',
      preorderEnd: 6,
      preorderStart: 0,
      realPath: 'src',
      treeOrigin: 'src',
    };
    const source: TInventoryItem = {
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
    const app: TInventoryItem = {
      depth: 1,
      id: 2,
      isSymlink: false,
      kind: 'directory',
      parentId: 0,
      path: 'src/app',
      preorderEnd: 6,
      preorderStart: 2,
      realPath: 'src/app',
      treeOrigin: 'src',
    };
    const appBranch: TInventoryItem = {
      depth: 2,
      id: 3,
      isSymlink: false,
      kind: 'directory',
      parentId: 2,
      path: 'src/app/_app@shared',
      preorderEnd: 6,
      preorderStart: 3,
      realPath: 'src/app/_app@shared',
      treeOrigin: 'src',
    };
    const appTypes: TInventoryItem = {
      depth: 3,
      id: 4,
      isSymlink: false,
      kind: 'directory',
      parentId: 3,
      path: 'src/app/_app@shared/_types',
      preorderEnd: 6,
      preorderStart: 4,
      realPath: 'src/app/_app@shared/_types',
      treeOrigin: 'src',
    };
    const appLocalType: TInventoryItem = {
      depth: 4,
      id: 5,
      isSymlink: false,
      kind: 'file',
      parentId: 4,
      path: 'src/app/_app@shared/_types/local.type.ts',
      preorderEnd: 5,
      preorderStart: 5,
      realPath: 'src/app/_app@shared/_types/local.type.ts',
      treeOrigin: 'src',
    };

    const items = [root, source, app, appBranch, appTypes, appLocalType];
    const inventory: TInventory = {
      items,
      pathToId: new Map(items.map((item) => [item.path, item.id])),
      realPathToId: new Map(items.map((item) => [item.realPath, item.id])),
    };

    const taxonomy = buildTaxonomy([
      createClassification(0, 'src', 'root-fragment', null),
      createClassification(1, 'src/main.ts', null, 'root-node'),
      createClassification(2, 'src/app', 'root-fragment', null),
      createClassification(3, 'src/app/_app@shared', 'fractal-branch', null),
      createClassification(4, 'src/app/_app@shared/_types', 'category', null),
      createClassification(
        5,
        'src/app/_app@shared/_types/local.type.ts',
        null,
        'category-node'
      ),
    ]);

    const edge = createEdge(
      'src/main.ts',
      'src/app/_app@shared/_types/local.type.ts'
    );
    const outcome = checkBranchVisibility(edge, inventory, taxonomy);
    expect(outcome).toBeDefined();
    expect(outcome?.constraint).toBe('dependency/fractal-branch-visibility');
    expect(outcome?.from).toBe('src/main.ts');
    expect(outcome?.to).toBe('src/app/_app@shared/_types/local.type.ts');
  });

  it('rejects access node of the parent fragment importing the branch', () => {
    const root: TInventoryItem = {
      depth: 0,
      id: 0,
      isSymlink: false,
      kind: 'directory',
      parentId: null,
      path: 'src',
      preorderEnd: 5,
      preorderStart: 0,
      realPath: 'src',
      treeOrigin: 'src',
    };
    const fragment: TInventoryItem = {
      depth: 1,
      id: 1,
      isSymlink: false,
      kind: 'directory',
      parentId: 0,
      path: 'src/button',
      preorderEnd: 5,
      preorderStart: 1,
      realPath: 'src/button',
      treeOrigin: 'src',
    };
    const accessNode: TInventoryItem = {
      depth: 2,
      id: 2,
      isSymlink: false,
      kind: 'file',
      parentId: 1,
      path: 'src/button/index.ts',
      preorderEnd: 2,
      preorderStart: 2,
      realPath: 'src/button/index.ts',
      treeOrigin: 'src',
    };
    const branch: TInventoryItem = {
      depth: 2,
      id: 3,
      isSymlink: false,
      kind: 'directory',
      parentId: 1,
      path: 'src/button/_button@shared',
      preorderEnd: 5,
      preorderStart: 3,
      realPath: 'src/button/_button@shared',
      treeOrigin: 'src',
    };
    const category: TInventoryItem = {
      depth: 3,
      id: 4,
      isSymlink: false,
      kind: 'directory',
      parentId: 3,
      path: 'src/button/_button@shared/_types',
      preorderEnd: 5,
      preorderStart: 4,
      realPath: 'src/button/_button@shared/_types',
      treeOrigin: 'src',
    };
    const targetFile: TInventoryItem = {
      depth: 4,
      id: 5,
      isSymlink: false,
      kind: 'file',
      parentId: 4,
      path: 'src/button/_button@shared/_types/btn.type.ts',
      preorderEnd: 5,
      preorderStart: 5,
      realPath: 'src/button/_button@shared/_types/btn.type.ts',
      treeOrigin: 'src',
    };

    const items = [root, fragment, accessNode, branch, category, targetFile];
    const inventory: TInventory = {
      items,
      pathToId: new Map(items.map((item) => [item.path, item.id])),
      realPathToId: new Map(items.map((item) => [item.realPath, item.id])),
    };

    const taxonomy = buildTaxonomy([
      createClassification(0, 'src', 'root-layer', null),
      createClassification(1, 'src/button', 'fragment', null),
      createClassification(2, 'src/button/index.ts', null, 'access-node'),
      createClassification(
        3,
        'src/button/_button@shared',
        'fractal-branch',
        null
      ),
      createClassification(
        4,
        'src/button/_button@shared/_types',
        'category',
        null
      ),
      createClassification(
        5,
        'src/button/_button@shared/_types/btn.type.ts',
        null,
        'category-node'
      ),
    ]);

    const edge = createEdge(
      'src/button/index.ts',
      'src/button/_button@shared/_types/btn.type.ts'
    );
    const outcome = checkBranchVisibility(edge, inventory, taxonomy);
    expect(outcome).toBeDefined();
    expect(outcome?.constraint).toBe('dependency/fractal-branch-visibility');
  });

  it('admits master node of the parent fragment importing the branch', () => {
    const root: TInventoryItem = {
      depth: 0,
      id: 0,
      isSymlink: false,
      kind: 'directory',
      parentId: null,
      path: 'src',
      preorderEnd: 5,
      preorderStart: 0,
      realPath: 'src',
      treeOrigin: 'src',
    };
    const fragment: TInventoryItem = {
      depth: 1,
      id: 1,
      isSymlink: false,
      kind: 'directory',
      parentId: 0,
      path: 'src/button',
      preorderEnd: 5,
      preorderStart: 1,
      realPath: 'src/button',
      treeOrigin: 'src',
    };
    const master: TInventoryItem = {
      depth: 2,
      id: 2,
      isSymlink: false,
      kind: 'file',
      parentId: 1,
      path: 'src/button/button.component.ts',
      preorderEnd: 2,
      preorderStart: 2,
      realPath: 'src/button/button.component.ts',
      treeOrigin: 'src',
    };
    const branch: TInventoryItem = {
      depth: 2,
      id: 3,
      isSymlink: false,
      kind: 'directory',
      parentId: 1,
      path: 'src/button/_button@shared',
      preorderEnd: 5,
      preorderStart: 3,
      realPath: 'src/button/_button@shared',
      treeOrigin: 'src',
    };
    const category: TInventoryItem = {
      depth: 3,
      id: 4,
      isSymlink: false,
      kind: 'directory',
      parentId: 3,
      path: 'src/button/_button@shared/_types',
      preorderEnd: 5,
      preorderStart: 4,
      realPath: 'src/button/_button@shared/_types',
      treeOrigin: 'src',
    };
    const targetFile: TInventoryItem = {
      depth: 4,
      id: 5,
      isSymlink: false,
      kind: 'file',
      parentId: 4,
      path: 'src/button/_button@shared/_types/btn.type.ts',
      preorderEnd: 5,
      preorderStart: 5,
      realPath: 'src/button/_button@shared/_types/btn.type.ts',
      treeOrigin: 'src',
    };

    const items = [root, fragment, master, branch, category, targetFile];
    const inventory: TInventory = {
      items,
      pathToId: new Map(items.map((item) => [item.path, item.id])),
      realPathToId: new Map(items.map((item) => [item.realPath, item.id])),
    };

    const taxonomy = buildTaxonomy([
      createClassification(0, 'src', 'root-layer', null),
      createClassification(1, 'src/button', 'fragment', null),
      createClassification(
        2,
        'src/button/button.component.ts',
        null,
        'master-node'
      ),
      createClassification(
        3,
        'src/button/_button@shared',
        'fractal-branch',
        null
      ),
      createClassification(
        4,
        'src/button/_button@shared/_types',
        'category',
        null
      ),
      createClassification(
        5,
        'src/button/_button@shared/_types/btn.type.ts',
        null,
        'category-node'
      ),
    ]);

    const edge = createEdge(
      'src/button/button.component.ts',
      'src/button/_button@shared/_types/btn.type.ts'
    );
    expect(checkBranchVisibility(edge, inventory, taxonomy)).toBeUndefined();
  });

  it('rejects foreign node source even within parent directory', () => {
    const root: TInventoryItem = {
      depth: 0,
      id: 0,
      isSymlink: false,
      kind: 'directory',
      parentId: null,
      path: 'src',
      preorderEnd: 4,
      preorderStart: 0,
      realPath: 'src',
      treeOrigin: 'src',
    };
    const foreignSource: TInventoryItem = {
      depth: 1,
      id: 1,
      isSymlink: false,
      kind: 'file',
      parentId: 0,
      path: 'src/foreign.ts',
      preorderEnd: 1,
      preorderStart: 1,
      realPath: 'src/foreign.ts',
      treeOrigin: 'src',
    };
    const branch: TInventoryItem = {
      depth: 1,
      id: 2,
      isSymlink: false,
      kind: 'directory',
      parentId: 0,
      path: 'src/_src@shared',
      preorderEnd: 4,
      preorderStart: 2,
      realPath: 'src/_src@shared',
      treeOrigin: 'src',
    };
    const cat: TInventoryItem = {
      depth: 2,
      id: 3,
      isSymlink: false,
      kind: 'directory',
      parentId: 2,
      path: 'src/_src@shared/_types',
      preorderEnd: 4,
      preorderStart: 3,
      realPath: 'src/_src@shared/_types',
      treeOrigin: 'src',
    };
    const targetFile: TInventoryItem = {
      depth: 3,
      id: 4,
      isSymlink: false,
      kind: 'file',
      parentId: 3,
      path: 'src/_src@shared/_types/shared.type.ts',
      preorderEnd: 4,
      preorderStart: 4,
      realPath: 'src/_src@shared/_types/shared.type.ts',
      treeOrigin: 'src',
    };

    const items = [root, foreignSource, branch, cat, targetFile];
    const inventory: TInventory = {
      items,
      pathToId: new Map(items.map((item) => [item.path, item.id])),
      realPathToId: new Map(items.map((item) => [item.realPath, item.id])),
    };

    const taxonomy = buildTaxonomy([
      createClassification(0, 'src', 'root-layer', null),
      createClassification(1, 'src/foreign.ts', null, 'foreign-node'),
      createClassification(2, 'src/_src@shared', 'fractal-branch', null),
      createClassification(3, 'src/_src@shared/_types', 'category', null),
      createClassification(
        4,
        'src/_src@shared/_types/shared.type.ts',
        null,
        'category-node'
      ),
    ]);

    const edge = createEdge(
      'src/foreign.ts',
      'src/_src@shared/_types/shared.type.ts'
    );
    const outcome = checkBranchVisibility(edge, inventory, taxonomy);
    expect(outcome).toBeDefined();
    expect(outcome?.constraint).toBe('dependency/fractal-branch-visibility');
  });

  it('rejects cross-tree import to a fractal branch', () => {
    const rootA: TInventoryItem = {
      depth: 0,
      id: 0,
      isSymlink: false,
      kind: 'directory',
      parentId: null,
      path: 'a',
      preorderEnd: 3,
      preorderStart: 0,
      realPath: 'a',
      treeOrigin: 'a',
    };
    const branchA: TInventoryItem = {
      depth: 1,
      id: 1,
      isSymlink: false,
      kind: 'directory',
      parentId: 0,
      path: 'a/_a@shared',
      preorderEnd: 3,
      preorderStart: 1,
      realPath: 'a/_a@shared',
      treeOrigin: 'a',
    };
    const catA: TInventoryItem = {
      depth: 2,
      id: 2,
      isSymlink: false,
      kind: 'directory',
      parentId: 1,
      path: 'a/_a@shared/_types',
      preorderEnd: 3,
      preorderStart: 2,
      realPath: 'a/_a@shared/_types',
      treeOrigin: 'a',
    };
    const targetA: TInventoryItem = {
      depth: 3,
      id: 3,
      isSymlink: false,
      kind: 'file',
      parentId: 2,
      path: 'a/_a@shared/_types/a.type.ts',
      preorderEnd: 3,
      preorderStart: 3,
      realPath: 'a/_a@shared/_types/a.type.ts',
      treeOrigin: 'a',
    };
    const rootB: TInventoryItem = {
      depth: 0,
      id: 4,
      isSymlink: false,
      kind: 'directory',
      parentId: null,
      path: 'b',
      preorderEnd: 5,
      preorderStart: 4,
      realPath: 'b',
      treeOrigin: 'b',
    };
    const sourceB: TInventoryItem = {
      depth: 1,
      id: 5,
      isSymlink: false,
      kind: 'file',
      parentId: 4,
      path: 'b/main.ts',
      preorderEnd: 5,
      preorderStart: 5,
      realPath: 'b/main.ts',
      treeOrigin: 'b',
    };

    const items = [rootA, branchA, catA, targetA, rootB, sourceB];
    const inventory: TInventory = {
      items,
      pathToId: new Map(items.map((item) => [item.path, item.id])),
      realPathToId: new Map(items.map((item) => [item.realPath, item.id])),
    };

    const taxonomy = buildTaxonomy([
      createClassification(0, 'a', 'root-layer', null),
      createClassification(1, 'a/_a@shared', 'fractal-branch', null),
      createClassification(2, 'a/_a@shared/_types', 'category', null),
      createClassification(
        3,
        'a/_a@shared/_types/a.type.ts',
        null,
        'category-node'
      ),
      createClassification(4, 'b', 'root-layer', null),
      createClassification(5, 'b/main.ts', null, 'root-node'),
    ]);

    const edge = createEdge('b/main.ts', 'a/_a@shared/_types/a.type.ts');
    const outcome = checkBranchVisibility(edge, inventory, taxonomy);
    expect(outcome).toBeDefined();
    expect(outcome?.constraint).toBe('dependency/fractal-branch-visibility');
  });

  it('returns undefined for cross-tree import when destination is not inside any branch', () => {
    const rootA: TInventoryItem = {
      depth: 0,
      id: 0,
      isSymlink: false,
      kind: 'directory',
      parentId: null,
      path: 'a',
      preorderEnd: 1,
      preorderStart: 0,
      realPath: 'a',
      treeOrigin: 'a',
    };
    const targetA: TInventoryItem = {
      depth: 1,
      id: 1,
      isSymlink: false,
      kind: 'file',
      parentId: 0,
      path: 'a/main.ts',
      preorderEnd: 1,
      preorderStart: 1,
      realPath: 'a/main.ts',
      treeOrigin: 'a',
    };
    const rootB: TInventoryItem = {
      depth: 0,
      id: 2,
      isSymlink: false,
      kind: 'directory',
      parentId: null,
      path: 'b',
      preorderEnd: 3,
      preorderStart: 2,
      realPath: 'b',
      treeOrigin: 'b',
    };
    const sourceB: TInventoryItem = {
      depth: 1,
      id: 3,
      isSymlink: false,
      kind: 'file',
      parentId: 2,
      path: 'b/main.ts',
      preorderEnd: 3,
      preorderStart: 3,
      realPath: 'b/main.ts',
      treeOrigin: 'b',
    };

    const items = [rootA, targetA, rootB, sourceB];
    const inventory: TInventory = {
      items,
      pathToId: new Map(items.map((item) => [item.path, item.id])),
      realPathToId: new Map(items.map((item) => [item.realPath, item.id])),
    };

    const taxonomy = buildTaxonomy([
      createClassification(0, 'a', 'root-layer', null),
      createClassification(1, 'a/main.ts', null, 'root-node'),
      createClassification(2, 'b', 'root-layer', null),
      createClassification(3, 'b/main.ts', null, 'root-node'),
    ]);

    const edge = createEdge('b/main.ts', 'a/main.ts');
    expect(checkBranchVisibility(edge, inventory, taxonomy)).toBeUndefined();
  });
});
