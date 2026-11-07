import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TLogicalDomainKind,
  TTaxonomyModel,
} from '../../../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TEdgeGeometry } from '../../../../../../_verify-project@shared/_utils/edge-geometry/index.js';

import { collectCrossedBranches } from './collect-crossed-branches.util.js';

const createClassification = (
  id: number,
  path: string,
  domainKind: null | TLogicalDomainKind
): TItemClassification => ({
  domainKind,
  entryKind: domainKind === null ? 'file' : 'directory',
  fragmentInternalRank: null,
  imposedRoleName: null,
  itemId: id,
  nodeKind: null,
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

describe('collectCrossedBranches', () => {
  it('collects branches from descendingDomains when sameTree is true', () => {
    const branchItem: TInventoryItem = {
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
    const catItem: TInventoryItem = {
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

    const geometry: TEdgeGeometry = {
      descendingDomains: [branchItem, catItem],
      differentTrees: false,
      firstStepDestination: branchItem,
      firstStepSource: null,
      isSourceInside: () => true,
      lowestCommonAncestor: {
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
      },
      sameTree: true,
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

    const inventory: TInventory = {
      items: [
        geometry.lowestCommonAncestor,
        branchItem,
        catItem,
        destinationItem,
      ],
      pathToId: new Map(),
      realPathToId: new Map(),
    };

    const taxonomy = buildTaxonomy([
      createClassification(0, 'src', 'root-fragment'),
      createClassification(1, 'src/_src@shared', 'fractal-branch'),
      createClassification(2, 'src/_src@shared/_types', 'category'),
      createClassification(3, 'src/_src@shared/_types/a.type.ts', null),
    ]);

    const result = collectCrossedBranches(
      destinationItem,
      geometry,
      inventory,
      taxonomy
    );
    expect(result).toEqual([branchItem]);
  });

  it('collects ancestor branches in root-to-destination order when differentTrees is true', () => {
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

    const inventory: TInventory = {
      items: [root, branch, cat, destinationItem],
      pathToId: new Map(),
      realPathToId: new Map(),
    };

    const geometry: TEdgeGeometry = {
      descendingDomains: [],
      differentTrees: true,
      firstStepDestination: null,
      firstStepSource: null,
      isSourceInside: () => false,
      lowestCommonAncestor: null,
      sameTree: false,
    };

    const taxonomy = buildTaxonomy([
      createClassification(0, 'src', 'root-fragment'),
      createClassification(1, 'src/_src@shared', 'fractal-branch'),
      createClassification(2, 'src/_src@shared/_types', 'category'),
      createClassification(3, 'src/_src@shared/_types/a.type.ts', null),
    ]);

    const result = collectCrossedBranches(
      destinationItem,
      geometry,
      inventory,
      taxonomy
    );
    expect(result).toEqual([branch]);
  });

  it('stops climbing when parent item is not found in inventory', () => {
    const destinationItem: TInventoryItem = {
      depth: 1,
      id: 1,
      isSymlink: false,
      kind: 'file',
      parentId: 99,
      path: 'src/file.ts',
      preorderEnd: 1,
      preorderStart: 1,
      realPath: 'src/file.ts',
      treeOrigin: 'src',
    };

    const dummyItem: TInventoryItem = {
      depth: 0,
      id: 0,
      isSymlink: false,
      kind: 'directory',
      parentId: null,
      path: 'src',
      preorderEnd: 0,
      preorderStart: 0,
      realPath: 'src',
      treeOrigin: 'src',
    };

    const inventory: TInventory = {
      items: [dummyItem, destinationItem],
      pathToId: new Map(),
      realPathToId: new Map(),
    };

    const geometry: TEdgeGeometry = {
      descendingDomains: [],
      differentTrees: true,
      firstStepDestination: null,
      firstStepSource: null,
      isSourceInside: () => false,
      lowestCommonAncestor: null,
      sameTree: false,
    };

    const taxonomy = buildTaxonomy([]);

    const result = collectCrossedBranches(
      destinationItem,
      geometry,
      inventory,
      taxonomy
    );
    expect(result).toEqual([]);
  });

  it('safely handles parent domain without classification in taxonomy', () => {
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
    const parent: TInventoryItem = {
      depth: 1,
      id: 1,
      isSymlink: false,
      kind: 'directory',
      parentId: 0,
      path: 'src/_unclassified',
      preorderEnd: 2,
      preorderStart: 1,
      realPath: 'src/_unclassified',
      treeOrigin: 'src',
    };
    const destinationItem: TInventoryItem = {
      depth: 2,
      id: 2,
      isSymlink: false,
      kind: 'file',
      parentId: 1,
      path: 'src/_unclassified/a.ts',
      preorderEnd: 2,
      preorderStart: 2,
      realPath: 'src/_unclassified/a.ts',
      treeOrigin: 'src',
    };

    const inventory: TInventory = {
      items: [root, parent, destinationItem],
      pathToId: new Map(),
      realPathToId: new Map(),
    };

    const geometry: TEdgeGeometry = {
      descendingDomains: [],
      differentTrees: true,
      firstStepDestination: null,
      firstStepSource: null,
      isSourceInside: () => false,
      lowestCommonAncestor: null,
      sameTree: false,
    };

    const taxonomy = buildTaxonomy([]);

    const result = collectCrossedBranches(
      destinationItem,
      geometry,
      inventory,
      taxonomy
    );
    expect(result).toEqual([]);
  });
});
