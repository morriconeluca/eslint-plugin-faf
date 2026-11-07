import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TTaxonomyModel,
} from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { selectDesignatedRootNodes } from './select-designated-root-nodes.util.js';

const absentRole = { kind: 'absent' as const, roleName: null };

const qualifications = {
  isParentCategory: false,
  isPathFragment: false,
  isPrivateCategory: false,
  isSubFragment: false,
  isSubLayer: false,
  parentFragmentPath: null,
};

const classification = (
  path: string,
  nodeKind: TItemClassification['nodeKind']
): TItemClassification => ({
  domainKind: null,
  entryKind: 'file',
  fragmentInternalRank: null,
  imposedRoleName: null,
  itemId: 0,
  nodeKind,
  path,
  relationalQualifications: qualifications,
  role: absentRole,
});

const taxonomyOf = (
  classifications: readonly TItemClassification[]
): TTaxonomyModel => ({
  byItemId: new Map(
    classifications.map((entry, index) => [index, { ...entry, itemId: index }])
  ),
  byPath: new Map(classifications.map((entry) => [entry.path, entry])),
  classifications,
});

const inventoryItem = (
  id: number,
  path: string,
  treeOrigin: null | string
): TInventoryItem => ({
  depth: 1,
  id,
  isSymlink: false,
  kind: 'file',
  parentId: 0,
  path,
  preorderEnd: id,
  preorderStart: id,
  realPath: path,
  treeOrigin,
});

const inventoryOf = (items: readonly TInventoryItem[]): TInventory => ({
  items,
  pathToId: new Map(items.map((item) => [item.path, item.id])),
  realPathToId: new Map(items.map((item) => [item.realPath, item.id])),
});

describe('selectDesignatedRootNodes', () => {
  it('keeps designated Root Nodes of the tree, including nested Root Fragments, in ordinal order', () => {
    const taxonomy = taxonomyOf([
      classification('app/nested/portal.ts', 'root-node'),
      classification('app/main.ts', 'root-node'),
      classification('app/_utils/widget/index.ts', 'access-node'),
      classification('lib/open.ts', 'root-node'),
    ]);
    const inventory = inventoryOf([
      inventoryItem(0, 'app/nested/portal.ts', 'app'),
      inventoryItem(1, 'app/main.ts', 'app'),
      inventoryItem(2, 'app/_utils/widget/index.ts', 'app'),
      inventoryItem(3, 'lib/open.ts', 'lib'),
    ]);
    expect(
      selectDesignatedRootNodes(
        [
          'app/nested/portal.ts',
          'app/_utils/widget/index.ts',
          'missing.ts',
          'lib/open.ts',
          'app/main.ts',
        ],
        'app',
        taxonomy,
        inventory
      )
    ).toEqual(['app/main.ts', 'app/nested/portal.ts']);
  });

  it('returns no nodes when nothing is designated', () => {
    expect(
      selectDesignatedRootNodes([], 'app', taxonomyOf([]), inventoryOf([]))
    ).toEqual([]);
  });

  it('ignores a designation whose inventory id does not resolve', () => {
    const taxonomy = taxonomyOf([classification('app/main.ts', 'root-node')]);
    const inventory = {
      ...inventoryOf([]),
      pathToId: new Map([['app/main.ts', 4]]),
    };
    expect(
      selectDesignatedRootNodes(['app/main.ts'], 'app', taxonomy, inventory)
    ).toEqual([]);
  });
});
