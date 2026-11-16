import { describe, expect, it } from 'vitest';

import type {
  TInventory,
  TInventoryItem,
  TItemClassification,
  TTaxonomyModel,
} from '../../../../_conformity@shared/_types/verification-model.type.js';

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

  it('exposes Category Nodes under configuration-directory Root Layer, Sub-Categories, and Path Sub-Categories', () => {
    const dotTaxonomy = taxonomyOf([
      classified('.', 'directory', 'root-layer', null),
      classified('_types', 'directory', 'category', null),
      classified('_types/size.type.ts', 'file', null, 'category-node'),
    ]);
    const dotInventory = inventoryOf([
      inventoryItem(0, '.', 'directory', '.'),
      inventoryItem(1, '_types', 'directory', '.'),
      inventoryItem(2, '_types/size.type.ts', 'file', '.'),
    ]);
    expect(collectLayerSurface('.', dotTaxonomy, dotInventory)).toEqual([
      '_types/size.type.ts',
    ]);

    const nestedTaxonomy = taxonomyOf([
      classified('src', 'directory', 'root-layer', null),
      classified('src/_types', 'directory', 'category', null),
      classified('src/_types/_ids', 'directory', 'sub-category', null),
      classified(
        'src/_types/_ids/user-id.type.ts',
        'file',
        null,
        'category-node'
      ),
      classified('src/_routes', 'directory', 'category', null),
      classified('src/_routes/_users', 'directory', 'path-sub-category', null),
      classified('src/_routes/_users/get-user', 'directory', 'fragment', null),
      classified(
        'src/_routes/_users/get-user/index.ts',
        'file',
        null,
        'access-node'
      ),
    ]);
    const nestedInventory = inventoryOf([
      inventoryItem(0, 'src', 'directory', 'src'),
      inventoryItem(1, 'src/_types', 'directory', 'src'),
      inventoryItem(2, 'src/_types/_ids', 'directory', 'src'),
      inventoryItem(3, 'src/_types/_ids/user-id.type.ts', 'file', 'src'),
      inventoryItem(4, 'src/_routes', 'directory', 'src'),
      inventoryItem(5, 'src/_routes/_users', 'directory', 'src'),
      inventoryItem(6, 'src/_routes/_users/get-user', 'directory', 'src'),
      inventoryItem(7, 'src/_routes/_users/get-user/index.ts', 'file', 'src'),
    ]);
    expect(collectLayerSurface('src', nestedTaxonomy, nestedInventory)).toEqual(
      [
        'src/_routes/_users/get-user/index.ts',
        'src/_types/_ids/user-id.type.ts',
      ]
    );
  });

  it('does not cross Fractal Branches, Private Categories, nested Fragments, Foreign Nodes, or mismatched prefixes', () => {
    const taxonomy = taxonomyOf([
      classified('src', 'directory', 'root-layer', null),
      classified('src/_src@shared', 'directory', 'fractal-branch', null),
      classified('src/_src@shared/_types', 'directory', 'category', null),
      classified(
        'src/_src@shared/_types/shared.type.ts',
        'file',
        null,
        'category-node'
      ),
      classified('src/_components', 'directory', 'category', null),
      classified('src/_components/button', 'directory', 'fragment', null),
      classified(
        'src/_components/button/index.ts',
        'file',
        null,
        'access-node'
      ),
      classified(
        'src/_components/button/notes.md',
        'file',
        null,
        'foreign-node'
      ),
      classified(
        'src/_components/button/_utils',
        'directory',
        'category',
        null
      ),
      classified(
        'src/_components/button/_utils/format',
        'directory',
        'fragment',
        null
      ),
      classified(
        'src/_components/button/_utils/format/index.ts',
        'file',
        null,
        'access-node'
      ),
      classified('src/_components/button/panel', 'directory', 'fragment', null),
      classified(
        'src/_components/button/panel/index.ts',
        'file',
        null,
        'access-node'
      ),
      classified('other/file.ts', 'file', null, 'category-node'),
    ]);
    const inventory = inventoryOf([
      inventoryItem(0, 'src', 'directory', 'src'),
      inventoryItem(1, 'src/_src@shared', 'directory', 'src'),
      inventoryItem(2, 'src/_src@shared/_types', 'directory', 'src'),
      inventoryItem(3, 'src/_src@shared/_types/shared.type.ts', 'file', 'src'),
      inventoryItem(4, 'src/_components', 'directory', 'src'),
      inventoryItem(5, 'src/_components/button', 'directory', 'src'),
      inventoryItem(6, 'src/_components/button/index.ts', 'file', 'src'),
      inventoryItem(7, 'src/_components/button/notes.md', 'file', 'src'),
      inventoryItem(8, 'src/_components/button/_utils', 'directory', 'src'),
      inventoryItem(
        9,
        'src/_components/button/_utils/format',
        'directory',
        'src'
      ),
      inventoryItem(
        10,
        'src/_components/button/_utils/format/index.ts',
        'file',
        'src'
      ),
      inventoryItem(11, 'src/_components/button/panel', 'directory', 'src'),
      inventoryItem(12, 'src/_components/button/panel/index.ts', 'file', 'src'),
      inventoryItem(13, 'other/file.ts', 'file', 'src'),
      inventoryItem(14, 'src/_unclassified/_types/x.type.ts', 'file', 'src'),
    ]);
    expect(collectLayerSurface('src', taxonomy, inventory)).toEqual([
      'src/_components/button/index.ts',
    ]);
  });
});
