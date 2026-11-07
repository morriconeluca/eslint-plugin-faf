import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TTaxonomyModel,
} from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { collectLayerSurface } from './collect-layer-surface.util.js';

const absentRole = { kind: 'absent' as const, roleName: null };

const qualifications = {
  isParentCategory: false,
  isPathFragment: false,
  isPrivateCategory: false,
  isSubFragment: false,
  isSubLayer: false,
  parentFragmentPath: null,
};

const classified = (
  path: string,
  entryKind: 'directory' | 'file',
  domainKind: TItemClassification['domainKind'],
  nodeKind: TItemClassification['nodeKind']
): TItemClassification => ({
  domainKind,
  entryKind,
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
  kind: 'directory' | 'file',
  treeOrigin: null | string
): TInventoryItem => ({
  depth: path.split('/').length - 1,
  id,
  isSymlink: false,
  kind,
  parentId: null,
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

describe('collectLayerSurface', () => {
  it('returns no nodes when the Root Layer has no children', () => {
    const taxonomy = taxonomyOf([
      classified('src', 'directory', 'root-layer', null),
    ]);
    const inventory = inventoryOf([
      inventoryItem(0, 'src', 'directory', 'src'),
    ]);
    expect(collectLayerSurface('src', taxonomy, inventory)).toEqual([]);
  });

  it('collects structurally exposed nodes in ordinal order and ignores other trees', () => {
    const taxonomy = taxonomyOf([
      classified('src', 'directory', 'root-layer', null),
      classified('src/_types', 'directory', 'category', null),
      classified('src/_types/z-size.type.ts', 'file', null, 'category-node'),
      classified('src/_types/a-id.type.ts', 'file', null, 'category-node'),
      classified('src/_types/other.type.ts', 'file', null, 'category-node'),
      classified('src/_ui', 'directory', 'layer', null),
      classified('src/_ui/_components', 'directory', 'category', null),
      classified('src/_ui/_components/button', 'directory', 'fragment', null),
      classified(
        'src/_ui/_components/button/index.ts',
        'file',
        null,
        'access-node'
      ),
      classified(
        'src/_ui/_components/button/button.component.tsx',
        'file',
        null,
        'fragment-node'
      ),
    ]);
    const inventory = inventoryOf([
      inventoryItem(0, 'src', 'directory', 'src'),
      inventoryItem(1, 'src/_types', 'directory', 'src'),
      inventoryItem(2, 'src/_types/z-size.type.ts', 'file', 'src'),
      inventoryItem(3, 'src/_types/a-id.type.ts', 'file', 'src'),
      inventoryItem(4, 'src/_types/unclassified.ts', 'file', 'src'),
      inventoryItem(5, 'src/_types/other.type.ts', 'file', 'lib'),
      inventoryItem(6, 'src/_ui', 'directory', 'src'),
      inventoryItem(7, 'src/_ui/_components', 'directory', 'src'),
      inventoryItem(8, 'src/_ui/_components/button', 'directory', 'src'),
      inventoryItem(9, 'src/_ui/_components/button/index.ts', 'file', 'src'),
      inventoryItem(
        10,
        'src/_ui/_components/button/button.component.tsx',
        'file',
        'src'
      ),
    ]);
    expect(collectLayerSurface('src', taxonomy, inventory)).toEqual([
      'src/_types/a-id.type.ts',
      'src/_types/z-size.type.ts',
      'src/_ui/_components/button/index.ts',
    ]);
  });
});
