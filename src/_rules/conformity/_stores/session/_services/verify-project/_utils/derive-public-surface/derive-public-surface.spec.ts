import { describe, expect, it } from 'vitest';

import type { TProjectBasis } from '../../_verify-project@shared/_types/_aggregates/project-basis.type.js';
import type {
  TItemClassification,
  TTaxonomyModel,
} from '../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEffectiveTree } from '../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { derivePublicSurface } from './derive-public-surface.util.js';

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
  localHorizontalHierarchies: [],
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
  configPath: '/project/fafconfig.ts',
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

  it('exposes zero designated Root Nodes without requiring an origin barrel', () => {
    const records = [
      owned('app', 'directory', 'app'),
      owned('app/main.ts', 'file', 'app'),
    ];
    const classifications = [
      classified('app', 'directory', 'root-fragment', null),
      classified('app/main.ts', 'file', null, 'root-node'),
    ];
    const result = derive(
      [treeOf('root-fragment', 'app', [])],
      records,
      classifications
    );
    expect(result.outcomes).toEqual([]);
    expect(result.surface).toEqual({
      trees: [{ nodes: [], originPath: 'app' }],
    });
  });

  it('exposes one designated Root Node and no other node of the tree', () => {
    const records = [
      owned('app', 'directory', 'app'),
      owned('app/main.ts', 'file', 'app'),
      owned('app/extra.ts', 'file', 'app'),
    ];
    const classifications = [
      classified('app', 'directory', 'root-fragment', null),
      classified('app/main.ts', 'file', null, 'root-node'),
      classified('app/extra.ts', 'file', null, 'root-node'),
    ];
    const result = derive(
      [treeOf('root-fragment', 'app', ['app/main.ts'])],
      records,
      classifications
    );
    expect(result.surface.trees).toEqual([
      { nodes: ['app/main.ts'], originPath: 'app' },
    ]);
  });

  it('exposes several designated Root Nodes, including nested Root Fragments', () => {
    const records = [
      owned('app', 'directory', 'app'),
      owned('app/main.ts', 'file', 'app'),
      owned('app/extra.ts', 'file', 'app'),
      owned('app/hidden.ts', 'file', 'app'),
      owned('app/nested', 'directory', 'app'),
      owned('app/nested/portal.ts', 'file', 'app'),
      owned('app/nested/closed.ts', 'file', 'app'),
      owned('app/_utils', 'directory', 'app'),
      owned('app/_utils/widget', 'directory', 'app'),
      owned('app/_utils/widget/index.ts', 'file', 'app'),
      owned('lib/open.ts', 'file', 'lib'),
    ];
    const classifications = [
      classified('app', 'directory', 'root-fragment', null),
      classified('app/main.ts', 'file', null, 'root-node'),
      classified('app/extra.ts', 'file', null, 'root-node'),
      classified('app/hidden.ts', 'file', null, 'root-node'),
      classified('app/nested', 'directory', 'root-fragment', null),
      classified('app/nested/portal.ts', 'file', null, 'root-node'),
      classified('app/nested/closed.ts', 'file', null, 'root-node'),
      classified('app/_utils', 'directory', 'category', null),
      classified('app/_utils/widget', 'directory', 'fragment', null),
      classified('app/_utils/widget/index.ts', 'file', null, 'access-node'),
      classified('lib/open.ts', 'file', null, 'root-node'),
    ];
    const result = derive(
      [
        treeOf('root-fragment', 'app', [
          'app/nested/portal.ts',
          'app/_utils/widget/index.ts',
          'lib/open.ts',
          'app/main.ts',
          'app/extra.ts',
        ]),
      ],
      records,
      classifications
    );
    expect(result.outcomes).toEqual([]);
    expect(result.surface.trees).toEqual([
      {
        nodes: ['app/extra.ts', 'app/main.ts', 'app/nested/portal.ts'],
        originPath: 'app',
      },
    ]);
  });

  it('exposes the Access Nodes and Category Nodes of the reference Root Layer', () => {
    const records = [
      owned('src', 'directory', 'src'),
      owned('src/_components', 'directory', 'src'),
      owned('src/_components/button', 'directory', 'src'),
      owned('src/_components/button/button.component.tsx', 'file', 'src'),
      owned('src/_components/button/index.ts', 'file', 'src'),
      owned('src/_hooks', 'directory', 'src'),
      owned('src/_hooks/use-toggle', 'directory', 'src'),
      owned('src/_hooks/use-toggle/index.ts', 'file', 'src'),
      owned('src/_hooks/use-toggle/use-toggle.hook.ts', 'file', 'src'),
      owned('src/_types', 'directory', 'src'),
      owned('src/_types/size.type.ts', 'file', 'src'),
    ];
    const classifications = [
      classified('src', 'directory', 'root-layer', null),
      classified('src/_components', 'directory', 'category', null),
      classified('src/_components/button', 'directory', 'fragment', null),
      classified(
        'src/_components/button/button.component.tsx',
        'file',
        null,
        'fragment-node'
      ),
      classified(
        'src/_components/button/index.ts',
        'file',
        null,
        'access-node'
      ),
      classified('src/_hooks', 'directory', 'category', null),
      classified('src/_hooks/use-toggle', 'directory', 'fragment', null),
      classified('src/_hooks/use-toggle/index.ts', 'file', null, 'access-node'),
      classified(
        'src/_hooks/use-toggle/use-toggle.hook.ts',
        'file',
        null,
        'fragment-node'
      ),
      classified('src/_types', 'directory', 'category', null),
      classified('src/_types/size.type.ts', 'file', null, 'category-node'),
    ];
    const result = derive(
      [
        treeOf('root-layer', 'src', [
          'src/_components/button/button.component.tsx',
        ]),
      ],
      records,
      classifications
    );
    expect(result.outcomes).toEqual([]);
    expect(result.surface).toEqual({
      trees: [
        {
          nodes: [
            'src/_components/button/index.ts',
            'src/_hooks/use-toggle/index.ts',
            'src/_types/size.type.ts',
          ],
          originPath: 'src',
        },
      ],
    });
  });

  it('exposes units classified by Categories of Layers and Sub-Layers', () => {
    const records = [
      owned('src', 'directory', 'src'),
      owned('src/_domain', 'directory', 'src'),
      owned('src/_domain/_schemas', 'directory', 'src'),
      owned('src/_domain/_schemas/user', 'directory', 'src'),
      owned('src/_domain/_schemas/user/index.ts', 'file', 'src'),
      owned('src/_domain/_types', 'directory', 'src'),
      owned('src/_domain/_types/id.type.ts', 'file', 'src'),
      owned('src/_ui', 'directory', 'src'),
      owned('src/_ui/_presentation', 'directory', 'src'),
      owned('src/_ui/_presentation/_components', 'directory', 'src'),
      owned('src/_ui/_presentation/_components/button', 'directory', 'src'),
      owned('src/_ui/_presentation/_components/button/index.ts', 'file', 'src'),
    ];
    const classifications = [
      classified('src', 'directory', 'root-layer', null),
      classified('src/_domain', 'directory', 'layer', null),
      classified('src/_domain/_schemas', 'directory', 'category', null),
      classified('src/_domain/_schemas/user', 'directory', 'fragment', null),
      classified(
        'src/_domain/_schemas/user/index.ts',
        'file',
        null,
        'access-node'
      ),
      classified('src/_domain/_types', 'directory', 'category', null),
      classified(
        'src/_domain/_types/id.type.ts',
        'file',
        null,
        'category-node'
      ),
      classified('src/_ui', 'directory', 'layer', null),
      classified('src/_ui/_presentation', 'directory', 'layer', null),
      classified(
        'src/_ui/_presentation/_components',
        'directory',
        'category',
        null
      ),
      classified(
        'src/_ui/_presentation/_components/button',
        'directory',
        'fragment',
        null
      ),
      classified(
        'src/_ui/_presentation/_components/button/index.ts',
        'file',
        null,
        'access-node'
      ),
    ];
    const result = derive(
      [treeOf('root-layer', 'src', [])],
      records,
      classifications
    );
    expect(result.surface.trees[0]?.nodes).toEqual([
      'src/_domain/_schemas/user/index.ts',
      'src/_domain/_types/id.type.ts',
      'src/_ui/_presentation/_components/button/index.ts',
    ]);
  });

  it('includes Sub-Categories and Path Sub-Categories of non-private Categories', () => {
    const records = [
      owned('src', 'directory', 'src'),
      owned('src/_domain', 'directory', 'src'),
      owned('src/_domain/_types', 'directory', 'src'),
      owned('src/_domain/_types/_ids', 'directory', 'src'),
      owned('src/_domain/_types/_ids/user-id.type.ts', 'file', 'src'),
      owned('src/_ui', 'directory', 'src'),
      owned('src/_ui/_pages', 'directory', 'src'),
      owned('src/_ui/_pages/_routes', 'directory', 'src'),
      owned('src/_ui/_pages/_routes/_users', 'directory', 'src'),
      owned('src/_ui/_pages/_routes/_users/get-user', 'directory', 'src'),
      owned('src/_ui/_pages/_routes/_users/get-user/index.ts', 'file', 'src'),
      owned(
        'src/_ui/_pages/_routes/_users/get-user/get-user.adapter.ts',
        'file',
        'src'
      ),
    ];
    const classifications = [
      classified('src', 'directory', 'root-layer', null),
      classified('src/_domain', 'directory', 'layer', null),
      classified('src/_domain/_types', 'directory', 'category', null),
      classified('src/_domain/_types/_ids', 'directory', 'sub-category', null),
      classified(
        'src/_domain/_types/_ids/user-id.type.ts',
        'file',
        null,
        'category-node'
      ),
      classified('src/_ui', 'directory', 'layer', null),
      classified('src/_ui/_pages', 'directory', 'layer', null),
      classified('src/_ui/_pages/_routes', 'directory', 'category', null),
      classified(
        'src/_ui/_pages/_routes/_users',
        'directory',
        'path-sub-category',
        null
      ),
      classified(
        'src/_ui/_pages/_routes/_users/get-user',
        'directory',
        'fragment',
        null
      ),
      classified(
        'src/_ui/_pages/_routes/_users/get-user/index.ts',
        'file',
        null,
        'access-node'
      ),
      classified(
        'src/_ui/_pages/_routes/_users/get-user/get-user.adapter.ts',
        'file',
        null,
        'fragment-node'
      ),
    ];
    const result = derive(
      [treeOf('root-layer', 'src', [])],
      records,
      classifications
    );
    expect(result.surface.trees[0]?.nodes).toEqual([
      'src/_domain/_types/_ids/user-id.type.ts',
      'src/_ui/_pages/_routes/_users/get-user/index.ts',
    ]);
  });

  it('does not cross Private Categories, nested Fragments, or Fractal Branches', () => {
    const records = [
      owned('src', 'directory', 'src'),
      owned('src/_components', 'directory', 'src'),
      owned('src/_components/button', 'directory', 'src'),
      owned('src/_components/button/index.ts', 'file', 'src'),
      owned('src/_components/button/button.component.tsx', 'file', 'src'),
      owned('src/_components/button/button.spec.ts', 'file', 'src'),
      owned('src/_components/button/panel', 'directory', 'src'),
      owned('src/_components/button/panel/index.ts', 'file', 'src'),
      owned('src/_components/button/_utils', 'directory', 'src'),
      owned('src/_components/button/_utils/format', 'directory', 'src'),
      owned('src/_components/button/_utils/format/index.ts', 'file', 'src'),
      owned('src/_src@shared', 'directory', 'src'),
      owned('src/_src@shared/_types', 'directory', 'src'),
      owned('src/_src@shared/_types/shared.type.ts', 'file', 'src'),
      owned('src/_domain', 'directory', 'src'),
      owned('src/_domain/_domain@shared', 'directory', 'src'),
      owned('src/_domain/_domain@shared/_utils', 'directory', 'src'),
      owned('src/_domain/_domain@shared/_utils/helper', 'directory', 'src'),
      owned('src/_domain/_domain@shared/_utils/helper/index.ts', 'file', 'src'),
      owned('src/_components/notes.md', 'file', 'src'),
    ];
    const classifications = [
      classified('src', 'directory', 'root-layer', null),
      classified('src/_components', 'directory', 'category', null),
      classified('src/_components/button', 'directory', 'fragment', null),
      classified(
        'src/_components/button/index.ts',
        'file',
        null,
        'access-node'
      ),
      classified(
        'src/_components/button/button.component.tsx',
        'file',
        null,
        'fragment-node'
      ),
      classified(
        'src/_components/button/button.spec.ts',
        'file',
        null,
        'sub-graph-node'
      ),
      classified('src/_components/button/panel', 'directory', 'fragment', null),
      classified(
        'src/_components/button/panel/index.ts',
        'file',
        null,
        'access-node'
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
      classified('src/_src@shared', 'directory', 'fractal-branch', null),
      classified('src/_src@shared/_types', 'directory', 'category', null),
      classified(
        'src/_src@shared/_types/shared.type.ts',
        'file',
        null,
        'category-node'
      ),
      classified('src/_domain', 'directory', 'layer', null),
      classified(
        'src/_domain/_domain@shared',
        'directory',
        'fractal-branch',
        null
      ),
      classified(
        'src/_domain/_domain@shared/_utils',
        'directory',
        'category',
        null
      ),
      classified(
        'src/_domain/_domain@shared/_utils/helper',
        'directory',
        'fragment',
        null
      ),
      classified(
        'src/_domain/_domain@shared/_utils/helper/index.ts',
        'file',
        null,
        'access-node'
      ),
      classified('src/_components/notes.md', 'file', null, 'foreign-node'),
    ];
    const result = derive(
      [treeOf('root-layer', 'src', [])],
      records,
      classifications
    );
    expect(result.outcomes).toEqual([]);
    expect(result.surface.trees[0]?.nodes).toEqual([
      'src/_components/button/index.ts',
    ]);
  });

  it('keeps an empty Root Layer opaque and does not let publicRootNodes change it', () => {
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

  it('derives each tree independently, preserves declaration order, and is deterministic', () => {
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
    const again = derive(trees, records, classifications);
    expect(result.outcomes).toEqual([]);
    expect(result.surface.trees).toEqual([
      { nodes: ['src/_types/size.type.ts'], originPath: 'src' },
      { nodes: ['lib/open.ts'], originPath: 'lib' },
    ]);
    expect(again).toEqual(result);
  });
});
