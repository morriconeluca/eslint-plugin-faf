import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TTaxonomyModel,
} from '../../_verify-project@shared/_types/_compounds/classification.type.js';
import type {
  TEffectiveRole,
  TEffectiveTree,
} from '../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyCategoryRole } from './category-role.norm.js';

const qualifications = {
  isParentCategory: false,
  isPathFragment: false,
  isPrivateCategory: false,
  isSubFragment: false,
  isSubLayer: false,
  parentFragmentPath: null,
};

const createItem = (
  overrides: Partial<TItemClassification> &
    Pick<TItemClassification, 'entryKind' | 'itemId' | 'path'>
): TItemClassification => ({
  domainKind: null,
  fragmentInternalRank: null,
  imposedRoleName: null,
  nodeKind: null,
  relationalQualifications: qualifications,
  role: { kind: 'absent', roleName: null },
  ...overrides,
});

const createInventoryItem = (
  id: number,
  path: string,
  kind: 'directory' | 'file',
  parentId: null | number
): TInventoryItem => ({
  depth: path.split('/').length - 1,
  id,
  isSymlink: false,
  kind,
  parentId,
  path,
  preorderEnd: id,
  preorderStart: id,
  realPath: path,
  treeOrigin: 'src',
});

const buildModel = (options: {
  classifications: readonly TItemClassification[];
  inventoryItems: readonly TInventoryItem[];
  mimeticPaths?: readonly string[];
  roles: readonly TEffectiveRole[];
}): TVerificationModel => {
  const { classifications, inventoryItems, roles } = options;
  const mimeticPaths = options.mimeticPaths ?? [];

  const taxonomy: TTaxonomyModel = {
    byItemId: new Map(classifications.map((c) => [c.itemId, c])),
    byPath: new Map(classifications.map((c) => [c.path, c])),
    classifications,
  };

  const inventory: TInventory = {
    items: inventoryItems,
    pathToId: new Map(inventoryItems.map((item) => [item.path, item.id])),
    realPathToId: new Map(),
  };

  const tree: TEffectiveTree = {
    catalog: {
      categoryToRole: new Map(),
      extensionToRole: new Map(),
      roles,
      subGraphRoles: ['spec', 'story'],
      topRank: 10,
    },
    externalDependencyPairs: [],
    foreignDomains: [],
    foreignNodes: { families: [], individualPaths: [] },
    horizontalHierarchies: [],
    localHorizontalHierarchies: [],
    mimeticPathStructures:
      mimeticPaths.length > 0 ? [{ actions: null, paths: mimeticPaths }] : [],
    originKind: 'root-layer',
    originPath: 'src',
    publicRootNodes: [],
    rootFragments: [],
    treeDependencyPairs: [],
  };

  return {
    ...verificationModel(),
    basis: {
      ...verificationModel().basis,
      declarations: {
        aliases: [],
        baseDirectory: '/project',
        trees: [tree],
      },
      inventory,
    },
    taxonomy,
  };
};

describe('verifyCategoryRole', () => {
  const utilRole: TEffectiveRole = {
    allowMultipleSymbols: false,
    category: '_utils',
    form: 'fragments',
    implicitExtensions: [],
    name: 'util',
    rank: 5,
  };

  const typeRoleNodes: TEffectiveRole = {
    allowMultipleSymbols: true,
    category: '_types',
    form: 'category-nodes',
    implicitExtensions: [],
    name: 'type',
    rank: 1,
  };

  const typeRoleFragments: TEffectiveRole = {
    allowMultipleSymbols: false,
    category: '_types',
    form: 'fragments',
    implicitExtensions: [],
    name: 'type',
    rank: 1,
  };

  const styleRoleNodes: TEffectiveRole = {
    allowMultipleSymbols: true,
    category: '_styles',
    form: 'category-nodes',
    implicitExtensions: ['.css'],
    name: 'style',
    rank: 2,
  };

  const fontRoleNodes: TEffectiveRole = {
    allowMultipleSymbols: true,
    category: '_fonts',
    form: 'category-nodes',
    implicitExtensions: ['.woff2'],
    name: 'font',
    rank: 3,
  };

  const apiRoleFragments: TEffectiveRole = {
    allowMultipleSymbols: false,
    category: '_apis',
    form: 'fragments',
    implicitExtensions: [],
    name: 'api',
    rank: 6,
  };

  it('emits no outcomes for a conforming project with Fragments and Category Nodes', () => {
    const model = buildModel({
      classifications: [
        createItem({
          domainKind: 'root-layer',
          entryKind: 'directory',
          itemId: 0,
          path: 'src',
        }),
        createItem({
          domainKind: 'category',
          entryKind: 'directory',
          imposedRoleName: 'util',
          itemId: 1,
          path: 'src/_utils',
        }),
        createItem({
          domainKind: 'fragment',
          entryKind: 'directory',
          imposedRoleName: 'util',
          itemId: 2,
          path: 'src/_utils/widget',
        }),
        createItem({
          entryKind: 'file',
          itemId: 3,
          nodeKind: 'master-node',
          path: 'src/_utils/widget/widget.util.ts',
          role: { kind: 'explicit', roleName: 'util' },
        }),
        createItem({
          domainKind: 'category',
          entryKind: 'directory',
          imposedRoleName: 'type',
          itemId: 4,
          path: 'src/_types',
        }),
        createItem({
          entryKind: 'file',
          itemId: 5,
          nodeKind: 'category-node',
          path: 'src/_types/user.type.ts',
          role: { kind: 'explicit', roleName: 'type' },
        }),
      ],
      inventoryItems: [
        createInventoryItem(0, 'src', 'directory', null),
        createInventoryItem(1, 'src/_utils', 'directory', 0),
        createInventoryItem(2, 'src/_utils/widget', 'directory', 1),
        createInventoryItem(3, 'src/_utils/widget/widget.util.ts', 'file', 2),
        createInventoryItem(4, 'src/_types', 'directory', 0),
        createInventoryItem(5, 'src/_types/user.type.ts', 'file', 4),
      ],
      roles: [utilRole, typeRoleNodes],
    });

    expect(verifyCategoryRole(model)).toEqual([]);
  });

  it('rejects a Category Node in Fragments form', () => {
    const model = buildModel({
      classifications: [
        createItem({
          domainKind: 'root-layer',
          entryKind: 'directory',
          itemId: 0,
          path: 'src',
        }),
        createItem({
          domainKind: 'category',
          entryKind: 'directory',
          imposedRoleName: 'type',
          itemId: 1,
          path: 'src/_types',
        }),
        createItem({
          entryKind: 'file',
          itemId: 2,
          nodeKind: 'unauthorized-logical-node',
          path: 'src/_types/user.type.ts',
          role: { kind: 'explicit', roleName: 'type' },
        }),
      ],
      inventoryItems: [
        createInventoryItem(0, 'src', 'directory', null),
        createInventoryItem(1, 'src/_types', 'directory', 0),
        createInventoryItem(2, 'src/_types/user.type.ts', 'file', 1),
      ],
      roles: [typeRoleFragments],
    });

    expect(verifyCategoryRole(model)).toEqual([
      {
        constraint: 'classification/category-role',
        element: 'src/_types/user.type.ts',
        family: 'classification',
        message:
          "'src/_types/user.type.ts' does not have the form or the Role imposed by its Category",
        normativeReference: 'FAF §6.3.1',
      },
    ]);
  });

  it('rejects divergent explicit role, absent role, index.ts, and dedicated sub-graph node in Category of Nodes', () => {
    const model = buildModel({
      classifications: [
        createItem({
          domainKind: 'category',
          entryKind: 'directory',
          imposedRoleName: 'type',
          itemId: 0,
          path: 'src/_types',
        }),
        createItem({
          entryKind: 'file',
          itemId: 1,
          nodeKind: 'unauthorized-logical-node',
          path: 'src/_types/user.schema.ts',
          role: { kind: 'explicit', roleName: 'schema' },
        }),
        createItem({
          entryKind: 'file',
          itemId: 2,
          nodeKind: 'unauthorized-logical-node',
          path: 'src/_types/user.ts',
          role: { kind: 'absent', roleName: null },
        }),
        createItem({
          entryKind: 'file',
          itemId: 3,
          nodeKind: 'unauthorized-logical-node',
          path: 'src/_types/index.ts',
          role: { kind: 'absent', roleName: null },
        }),
        createItem({
          entryKind: 'file',
          itemId: 4,
          nodeKind: 'unauthorized-logical-node',
          path: 'src/_types/user.spec.ts',
          role: { kind: 'explicit', roleName: 'spec' },
        }),
      ],
      inventoryItems: [
        createInventoryItem(0, 'src/_types', 'directory', null),
        createInventoryItem(1, 'src/_types/user.schema.ts', 'file', 0),
        createInventoryItem(2, 'src/_types/user.ts', 'file', 0),
        createInventoryItem(3, 'src/_types/index.ts', 'file', 0),
        createInventoryItem(4, 'src/_types/user.spec.ts', 'file', 0),
      ],
      roles: [typeRoleNodes],
    });

    const outcomes = verifyCategoryRole(model);
    expect(outcomes.map((o) => o.element)).toEqual([
      'src/_types/index.ts',
      'src/_types/user.schema.ts',
      'src/_types/user.spec.ts',
      'src/_types/user.ts',
    ]);
    expect(outcomes[0]?.message).toBe(
      "'src/_types/index.ts' does not have the form or the Role imposed by its Category"
    );
  });

  it('rejects an implicit Role outside a Category of Nodes and in the wrong Category', () => {
    const model = buildModel({
      classifications: [
        createItem({
          domainKind: 'fragment',
          entryKind: 'directory',
          imposedRoleName: 'util',
          itemId: 0,
          path: 'src/_utils/widget',
        }),
        createItem({
          entryKind: 'file',
          itemId: 1,
          nodeKind: 'unauthorized-logical-node',
          path: 'src/_utils/widget/theme.css',
          role: { kind: 'implicit', roleName: 'style' },
        }),
        createItem({
          domainKind: 'category',
          entryKind: 'directory',
          imposedRoleName: 'font',
          itemId: 2,
          path: 'src/_fonts',
        }),
        createItem({
          entryKind: 'file',
          itemId: 3,
          nodeKind: 'unauthorized-logical-node',
          path: 'src/_fonts/theme.css',
          role: { kind: 'implicit', roleName: 'style' },
        }),
      ],
      inventoryItems: [
        createInventoryItem(0, 'src/_utils/widget', 'directory', null),
        createInventoryItem(1, 'src/_utils/widget/theme.css', 'file', 0),
        createInventoryItem(2, 'src/_fonts', 'directory', null),
        createInventoryItem(3, 'src/_fonts/theme.css', 'file', 2),
      ],
      roles: [utilRole, fontRoleNodes, styleRoleNodes],
    });

    const outcomes = verifyCategoryRole(model);
    expect(outcomes.map((o) => o.element)).toEqual([
      'src/_fonts/theme.css',
      'src/_utils/widget/theme.css',
    ]);
  });

  it('propagates Role and form through nested Sub-Categories and Path Sub-Categories', () => {
    const model = buildModel({
      classifications: [
        createItem({
          domainKind: 'category',
          entryKind: 'directory',
          imposedRoleName: 'type',
          itemId: 0,
          path: 'src/_types',
        }),
        createItem({
          domainKind: 'sub-category',
          entryKind: 'directory',
          imposedRoleName: 'type',
          itemId: 1,
          path: 'src/_types/_dtos',
        }),
        createItem({
          domainKind: 'sub-category',
          entryKind: 'directory',
          imposedRoleName: 'type',
          itemId: 2,
          path: 'src/_types/_dtos/_requests',
        }),
        createItem({
          entryKind: 'file',
          itemId: 3,
          nodeKind: 'category-node',
          path: 'src/_types/_dtos/_requests/user.type.ts',
          role: { kind: 'explicit', roleName: 'type' },
        }),
        createItem({
          domainKind: 'category',
          entryKind: 'directory',
          imposedRoleName: 'api',
          itemId: 4,
          path: 'src/_apis',
        }),
        createItem({
          domainKind: 'path-sub-category',
          entryKind: 'directory',
          imposedRoleName: 'api',
          itemId: 5,
          path: 'src/_apis/_todos',
        }),
        createItem({
          domainKind: 'fragment',
          entryKind: 'directory',
          imposedRoleName: 'api',
          itemId: 6,
          path: 'src/_apis/_todos/get-todo',
          relationalQualifications: { ...qualifications, isPathFragment: true },
        }),
        createItem({
          entryKind: 'file',
          itemId: 7,
          nodeKind: 'fragment-node',
          path: 'src/_apis/_todos/get-todo/get-todo.util.ts',
          role: { kind: 'explicit', roleName: 'util' },
        }),
        createItem({
          domainKind: 'category',
          entryKind: 'directory',
          imposedRoleName: 'util',
          itemId: 8,
          path: 'src/_utils',
        }),
        createItem({
          domainKind: 'sub-category',
          entryKind: 'directory',
          imposedRoleName: 'util',
          itemId: 9,
          path: 'src/_utils/_helpers',
        }),
        createItem({
          entryKind: 'file',
          itemId: 10,
          nodeKind: 'unauthorized-logical-node',
          path: 'src/_utils/_helpers/format.util.ts',
          role: { kind: 'explicit', roleName: 'util' },
        }),
      ],
      inventoryItems: [
        createInventoryItem(0, 'src/_types', 'directory', null),
        createInventoryItem(1, 'src/_types/_dtos', 'directory', 0),
        createInventoryItem(2, 'src/_types/_dtos/_requests', 'directory', 1),
        createInventoryItem(
          3,
          'src/_types/_dtos/_requests/user.type.ts',
          'file',
          2
        ),
        createInventoryItem(4, 'src/_apis', 'directory', null),
        createInventoryItem(5, 'src/_apis/_todos', 'directory', 4),
        createInventoryItem(6, 'src/_apis/_todos/get-todo', 'directory', 5),
        createInventoryItem(
          7,
          'src/_apis/_todos/get-todo/get-todo.util.ts',
          'file',
          6
        ),
        createInventoryItem(8, 'src/_utils', 'directory', null),
        createInventoryItem(9, 'src/_utils/_helpers', 'directory', 8),
        createInventoryItem(
          10,
          'src/_utils/_helpers/format.util.ts',
          'file',
          9
        ),
      ],
      mimeticPaths: ['src/_apis'],
      roles: [typeRoleNodes, apiRoleFragments, utilRole],
    });

    const outcomes = verifyCategoryRole(model);
    expect(outcomes).toEqual([
      {
        constraint: 'classification/category-role',
        element: 'src/_utils/_helpers/format.util.ts',
        family: 'classification',
        message:
          "'src/_utils/_helpers/format.util.ts' does not have the form or the Role imposed by its Category",
        normativeReference: 'FAF §6.3.1',
      },
    ]);
  });

  it('resets the imposed role in a Category Fractal Branch', () => {
    const model = buildModel({
      classifications: [
        createItem({
          domainKind: 'category',
          entryKind: 'directory',
          imposedRoleName: 'style',
          itemId: 0,
          path: 'src/_styles',
        }),
        createItem({
          domainKind: 'fractal-branch',
          entryKind: 'directory',
          imposedRoleName: null,
          itemId: 1,
          path: 'src/_styles/_styles@shared',
        }),
        createItem({
          domainKind: 'category',
          entryKind: 'directory',
          imposedRoleName: 'font',
          itemId: 2,
          path: 'src/_styles/_styles@shared/_fonts',
        }),
        createItem({
          entryKind: 'file',
          itemId: 3,
          nodeKind: 'category-node',
          path: 'src/_styles/_styles@shared/_fonts/inter.woff2',
          role: { kind: 'implicit', roleName: 'font' },
        }),
      ],
      inventoryItems: [
        createInventoryItem(0, 'src/_styles', 'directory', null),
        createInventoryItem(1, 'src/_styles/_styles@shared', 'directory', 0),
        createInventoryItem(
          2,
          'src/_styles/_styles@shared/_fonts',
          'directory',
          1
        ),
        createInventoryItem(
          3,
          'src/_styles/_styles@shared/_fonts/inter.woff2',
          'file',
          2
        ),
      ],
      roles: [styleRoleNodes, fontRoleNodes],
    });

    expect(verifyCategoryRole(model)).toEqual([]);
  });

  it('sorts outcomes deterministically regardless of classification order', () => {
    const itemA = createItem({
      entryKind: 'file',
      itemId: 1,
      nodeKind: 'unauthorized-logical-node',
      path: 'src/_types/a.ts',
      role: { kind: 'absent', roleName: null },
    });
    const itemZ = createItem({
      entryKind: 'file',
      itemId: 2,
      nodeKind: 'unauthorized-logical-node',
      path: 'src/_types/z.ts',
      role: { kind: 'absent', roleName: null },
    });
    const parent = createItem({
      domainKind: 'category',
      entryKind: 'directory',
      imposedRoleName: 'type',
      itemId: 0,
      path: 'src/_types',
    });

    const inventoryItems = [
      createInventoryItem(0, 'src/_types', 'directory', null),
      createInventoryItem(1, 'src/_types/a.ts', 'file', 0),
      createInventoryItem(2, 'src/_types/z.ts', 'file', 0),
    ];

    const modelFirst = buildModel({
      classifications: [parent, itemZ, itemA],
      inventoryItems,
      roles: [typeRoleNodes],
    });
    const modelSecond = buildModel({
      classifications: [parent, itemA, itemZ],
      inventoryItems,
      roles: [typeRoleNodes],
    });

    const first = verifyCategoryRole(modelFirst);
    const second = verifyCategoryRole(modelSecond);

    expect(first.map((o) => o.element)).toEqual([
      'src/_types/a.ts',
      'src/_types/z.ts',
    ]);
    expect(first).toEqual(second);
  });

  it('deduplicates multiple violations on the same element path', () => {
    const itemA1 = createItem({
      entryKind: 'file',
      itemId: 1,
      nodeKind: 'unauthorized-logical-node',
      path: 'src/_types/duplicate.ts',
      role: { kind: 'absent', roleName: null },
    });
    const itemA2 = createItem({
      entryKind: 'file',
      itemId: 2,
      nodeKind: 'unauthorized-logical-node',
      path: 'src/_types/duplicate.ts',
      role: { kind: 'absent', roleName: null },
    });
    const parent = createItem({
      domainKind: 'category',
      entryKind: 'directory',
      imposedRoleName: 'type',
      itemId: 0,
      path: 'src/_types',
    });

    const inventoryItems = [
      createInventoryItem(0, 'src/_types', 'directory', null),
      createInventoryItem(1, 'src/_types/duplicate.ts', 'file', 0),
      createInventoryItem(2, 'src/_types/duplicate.ts', 'file', 0),
    ];

    const model = buildModel({
      classifications: [parent, itemA1, itemA2],
      inventoryItems,
      roles: [typeRoleNodes],
    });

    const outcomes = verifyCategoryRole(model);
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.element).toBe('src/_types/duplicate.ts');
  });

  it('does not mutate the verification model', () => {
    const model = buildModel({
      classifications: [
        createItem({
          domainKind: 'category',
          entryKind: 'directory',
          imposedRoleName: 'type',
          itemId: 0,
          path: 'src/_types',
        }),
        createItem({
          entryKind: 'file',
          itemId: 1,
          nodeKind: 'unauthorized-logical-node',
          path: 'src/_types/user.ts',
          role: { kind: 'absent', roleName: null },
        }),
      ],
      inventoryItems: [
        createInventoryItem(0, 'src/_types', 'directory', null),
        createInventoryItem(1, 'src/_types/user.ts', 'file', 0),
      ],
      roles: [typeRoleNodes],
    });

    Object.freeze(model);
    Object.freeze(model.basis);
    Object.freeze(model.taxonomy);
    Object.freeze(model.taxonomy.classifications);

    expect(() => verifyCategoryRole(model)).not.toThrow();
  });
});
