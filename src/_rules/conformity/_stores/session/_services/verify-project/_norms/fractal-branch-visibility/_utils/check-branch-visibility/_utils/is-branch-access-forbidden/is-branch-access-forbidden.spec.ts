import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TLogicalDomainKind,
  TNodeKind,
  TTaxonomyModel,
} from '../../../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TInventoryItem } from '../../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TEdgeGeometry } from '../../../../../../_verify-project@shared/_utils/edge-geometry/index.js';

import { isBranchAccessForbidden } from './index.js';

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

describe('isBranchAccessForbidden', () => {
  const parentItem: TInventoryItem = {
    depth: 1,
    id: 1,
    isSymlink: false,
    kind: 'directory',
    parentId: 0,
    path: 'src/btn',
    preorderEnd: 3,
    preorderStart: 1,
    realPath: 'src/btn',
    treeOrigin: 'src',
  };

  const createGeometry = (isInside: boolean): TEdgeGeometry => ({
    descendingDomains: [],
    differentTrees: false,
    firstStepDestination: null,
    firstStepSource: null,
    isSourceInside: () => isInside,
    lowestCommonAncestor: parentItem,
    sameTree: true,
  });

  it('returns true when source classification is undefined', () => {
    const geometry = createGeometry(true);
    const taxonomy = buildTaxonomy([]);
    expect(
      isBranchAccessForbidden(
        parentItem,
        undefined,
        undefined,
        geometry,
        taxonomy
      )
    ).toBe(true);
  });

  it('returns true when source is a foreign node', () => {
    const geometry = createGeometry(true);
    const sourceClass = createClassification(
      2,
      'src/btn/foreign.ts',
      null,
      'foreign-node'
    );
    const taxonomy = buildTaxonomy([]);
    expect(
      isBranchAccessForbidden(
        parentItem,
        undefined,
        sourceClass,
        geometry,
        taxonomy
      )
    ).toBe(true);
  });

  it('returns true when source is not inside the parent item', () => {
    const geometry = createGeometry(false);
    const sourceClass = createClassification(
      2,
      'src/main.ts',
      null,
      'root-node'
    );
    const taxonomy = buildTaxonomy([]);
    expect(
      isBranchAccessForbidden(
        parentItem,
        undefined,
        sourceClass,
        geometry,
        taxonomy
      )
    ).toBe(true);
  });

  it('returns false when source is inside parent and parent is not a fragment', () => {
    const geometry = createGeometry(true);
    const sourceItem: TInventoryItem = {
      depth: 2,
      id: 2,
      isSymlink: false,
      kind: 'file',
      parentId: 1,
      path: 'src/btn/index.ts',
      preorderEnd: 2,
      preorderStart: 2,
      realPath: 'src/btn/index.ts',
      treeOrigin: 'src',
    };
    const sourceClass = createClassification(
      2,
      'src/btn/index.ts',
      null,
      'access-node'
    );
    const categoryParentClass = createClassification(
      1,
      'src/btn',
      'category',
      null
    );
    const taxonomy = buildTaxonomy([categoryParentClass]);

    expect(
      isBranchAccessForbidden(
        parentItem,
        sourceItem,
        sourceClass,
        geometry,
        taxonomy
      )
    ).toBe(false);
  });

  it('returns false when parent is a fragment and sourceItem is undefined even if classification is access-node', () => {
    const geometry = createGeometry(true);
    const sourceClass = createClassification(
      2,
      'src/btn/index.ts',
      null,
      'access-node'
    );
    const fragmentParentClass = createClassification(
      1,
      'src/btn',
      'fragment',
      null
    );
    const taxonomy = buildTaxonomy([fragmentParentClass]);

    expect(
      isBranchAccessForbidden(
        parentItem,
        undefined,
        sourceClass,
        geometry,
        taxonomy
      )
    ).toBe(false);
  });

  it('returns true when parent is a fragment and source is the direct access node of the parent', () => {
    const geometry = createGeometry(true);
    const sourceItem: TInventoryItem = {
      depth: 2,
      id: 2,
      isSymlink: false,
      kind: 'file',
      parentId: 1,
      path: 'src/btn/index.ts',
      preorderEnd: 2,
      preorderStart: 2,
      realPath: 'src/btn/index.ts',
      treeOrigin: 'src',
    };
    const sourceClass = createClassification(
      2,
      'src/btn/index.ts',
      null,
      'access-node'
    );
    const fragmentParentClass = createClassification(
      1,
      'src/btn',
      'fragment',
      null
    );
    const taxonomy = buildTaxonomy([fragmentParentClass]);

    expect(
      isBranchAccessForbidden(
        parentItem,
        sourceItem,
        sourceClass,
        geometry,
        taxonomy
      )
    ).toBe(true);
  });

  it('returns false when parent is a fragment and source is the master node of the parent', () => {
    const geometry = createGeometry(true);
    const sourceItem: TInventoryItem = {
      depth: 2,
      id: 2,
      isSymlink: false,
      kind: 'file',
      parentId: 1,
      path: 'src/btn/btn.component.ts',
      preorderEnd: 2,
      preorderStart: 2,
      realPath: 'src/btn/btn.component.ts',
      treeOrigin: 'src',
    };
    const sourceClass = createClassification(
      2,
      'src/btn/btn.component.ts',
      null,
      'master-node'
    );
    const fragmentParentClass = createClassification(
      1,
      'src/btn',
      'fragment',
      null
    );
    const taxonomy = buildTaxonomy([fragmentParentClass]);

    expect(
      isBranchAccessForbidden(
        parentItem,
        sourceItem,
        sourceClass,
        geometry,
        taxonomy
      )
    ).toBe(false);
  });

  it('returns false when parent classification is missing', () => {
    const geometry = createGeometry(true);
    const sourceItem: TInventoryItem = {
      depth: 2,
      id: 2,
      isSymlink: false,
      kind: 'file',
      parentId: 1,
      path: 'src/btn/index.ts',
      preorderEnd: 2,
      preorderStart: 2,
      realPath: 'src/btn/index.ts',
      treeOrigin: 'src',
    };
    const sourceClass = createClassification(
      2,
      'src/btn/index.ts',
      null,
      'access-node'
    );
    const taxonomy = buildTaxonomy([]);

    expect(
      isBranchAccessForbidden(
        parentItem,
        sourceItem,
        sourceClass,
        geometry,
        taxonomy
      )
    ).toBe(false);
  });
});
