import { describe, expect, it } from 'vitest';

import type {
  TEffectiveTree,
  TInventory,
  TInventoryItem,
  TItemClassification,
  TProjectBasis,
  TTaxonomyModel,
} from '../../_conformity@shared/_types/verification-model.type.js';

import { derivePublicSurface } from './derive-public-surface.stage.js';

const absentRole = { kind: 'absent' as const, roleName: null };

const qualifications = {
  isParentCategory: false,
  isPathFragment: false,
  isPrivateCategory: false,
  isSubFragment: false,
  isSubLayer: false,
  parentFragmentPath: null,
};

type TRecord = {
  readonly kind: 'directory' | 'file';
  readonly path: string;
  readonly treeOrigin: null | string;
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

const inventoryItem = (id: number, record: TRecord): TInventoryItem => ({
  depth: record.path.split('/').length - 1,
  id,
  isSymlink: false,
  kind: record.kind,
  parentId: null,
  path: record.path,
  preorderEnd: id,
  preorderStart: id,
  realPath: record.path,
  treeOrigin: record.treeOrigin,
});

const inventoryOf = (records: readonly TRecord[]): TInventory => {
  const items = records.map((record, id) => inventoryItem(id, record));
  return {
    items,
    pathToId: new Map(items.map((item) => [item.path, item.id])),
    realPathToId: new Map(items.map((item) => [item.realPath, item.id])),
  };
};

const treeOf = (
  originKind: TEffectiveTree['originKind'],
  originPath: string,
  publicRootNodes: readonly string[]
): TEffectiveTree => ({
  catalog: {
    categoryToRole: new Map(),
    extensionToRole: new Map(),
    roles: [],
    subGraphRoles: [],
    topRank: 0,
  },
  externalDependencyPairs: [],
  foreignDomains: [],
  foreignNodes: { families: [], individualPaths: [] },
  horizontalHierarchies: [],
  horizontalHierarchyModels: [],
  mimeticPathStructures: [],
  originKind,
  originPath,
  publicRootNodes,
  rootFragments: [],
  treeDependencyPairs: [],
});

const basisOf = (
  trees: readonly TEffectiveTree[],
  inventory: TInventory
): TProjectBasis => ({
  aliases: [],
  baseDirectory: '/project',
  configPath: '/project/faf.config.ts',
  declarations: {
    aliases: [],
    baseDirectory: '/project',
    trees,
  },
  inventory,
  inventoryOutcomes: [],
  kind: 'ready',
  loadedFiles: [],
});

const owned = (
  path: string,
  kind: 'directory' | 'file',
  origin: string
): TRecord => ({
  kind,
  path,
  treeOrigin: origin,
});

const derive = (
  trees: readonly TEffectiveTree[],
  records: readonly TRecord[],
  classifications: readonly TItemClassification[]
): ReturnType<typeof derivePublicSurface> =>
  derivePublicSurface(
    basisOf(trees, inventoryOf(records)),
    taxonomyOf(classifications)
  );

describe('derivePublicSurface', () => {
  it('returns no trees and no outcomes when the project declares no Fractal Tree', () => {
    const result = derive([], [], []);
    expect(result.outcomes).toEqual([]);
    expect(result.surface).toEqual({ trees: [] });
  });

  it('derives Root Layer surface structurally and Root Fragment surface from publicRootNodes in declaration order', () => {
    const trees = [
      treeOf('root-layer', 'src', ['src/ignored.ts']),
      treeOf('root-fragment', 'lib', ['lib/open.ts']),
    ];
    const records = [
      owned('src', 'directory', 'src'),
      owned('src/_types', 'directory', 'src'),
      owned('src/_types/size.type.ts', 'file', 'src'),
      owned('src/ignored.ts', 'file', 'src'),
      owned('lib', 'directory', 'lib'),
      owned('lib/open.ts', 'file', 'lib'),
      owned('lib/closed.ts', 'file', 'lib'),
    ];
    const classifications = [
      classified('src', 'directory', 'root-layer', null),
      classified('src/_types', 'directory', 'category', null),
      classified('src/_types/size.type.ts', 'file', null, 'category-node'),
      classified('src/ignored.ts', 'file', null, 'foreign-node'),
      classified('lib', 'directory', 'root-fragment', null),
      classified('lib/open.ts', 'file', null, 'root-node'),
      classified('lib/closed.ts', 'file', null, 'root-node'),
    ];
    const result = derive(trees, records, classifications);
    expect(result.outcomes).toEqual([]);
    expect(result.surface).toEqual({
      trees: [
        { nodes: ['src/_types/size.type.ts'], originPath: 'src' },
        { nodes: ['lib/open.ts'], originPath: 'lib' },
      ],
    });
  });

  it('ignores publicRootNodes on a Root Layer that has no exposed Category or Layer units', () => {
    const records = [
      owned('src', 'directory', 'src'),
      owned('src/_src@shared', 'directory', 'src'),
      owned('src/_src@shared/_types', 'directory', 'src'),
      owned('src/_src@shared/_types/shared.type.ts', 'file', 'src'),
    ];
    const classifications = [
      classified('src', 'directory', 'root-layer', null),
      classified('src/_src@shared', 'directory', 'fractal-branch', null),
      classified('src/_src@shared/_types', 'directory', 'category', null),
      classified(
        'src/_src@shared/_types/shared.type.ts',
        'file',
        null,
        'category-node'
      ),
    ];
    const result = derive(
      [treeOf('root-layer', 'src', ['src/_src@shared/_types/shared.type.ts'])],
      records,
      classifications
    );
    expect(result.outcomes).toEqual([]);
    expect(result.surface).toEqual({
      trees: [{ nodes: [], originPath: 'src' }],
    });
  });
});
