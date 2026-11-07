import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TTaxonomyModel,
} from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEffectiveTree } from '../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { isViolatingUnitName } from './is-violating-unit-name.util.js';

const qualifications = {
  isParentCategory: false,
  isPathFragment: false,
  isPrivateCategory: false,
  isSubFragment: false,
  isSubLayer: false,
  parentFragmentPath: null,
};

const createClassification = (
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
  parentId: null | number = null
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

const defaultTree: TEffectiveTree = {
  catalog: {
    categoryToRole: new Map(),
    extensionToRole: new Map(),
    roles: [],
    subGraphRoles: [],
    topRank: 1,
  },
  externalDependencyPairs: [],
  foreignDomains: [],
  foreignNodes: { families: [], individualPaths: [] },
  horizontalHierarchies: [],
  localHorizontalHierarchies: [],
  mimeticPathStructures: [
    { actions: ['get', 'post'], paths: ['src/_apis'] },
    { actions: null, paths: ['src/_pages'] },
  ],
  originKind: 'root-layer',
  originPath: 'src',
  publicRootNodes: [],
  rootFragments: [],
  treeDependencyPairs: [],
};

const createInventory = (items: readonly TInventoryItem[]): TInventory => ({
  items,
  pathToId: new Map(items.map((item) => [item.path, item.id])),
  realPathToId: new Map(items.map((item) => [item.realPath, item.id])),
});

const createTaxonomy = (
  classifications: readonly TItemClassification[]
): TTaxonomyModel => ({
  byItemId: new Map(classifications.map((item) => [item.itemId, item])),
  byPath: new Map(classifications.map((item) => [item.path, item])),
  classifications,
});

describe('isViolatingUnitName', () => {
  it('returns false when tree cannot be resolved or item is missing', () => {
    const classification = createClassification({
      entryKind: 'file',
      itemId: 99,
      nodeKind: 'category-node',
      path: 'src/_types/value.type.ts',
    });
    const taxonomy = createTaxonomy([classification]);
    const inventory = createInventory([]);

    expect(
      isViolatingUnitName(classification, taxonomy, inventory, [defaultTree])
    ).toBe(false);
  });

  it('exempts non-path-fragment directories', () => {
    const ordinaryDirectory = createClassification({
      domainKind: 'fragment',
      entryKind: 'directory',
      itemId: 0,
      path: 'src/_utils/widget',
    });
    const categoryDirectory = createClassification({
      domainKind: 'category',
      entryKind: 'directory',
      itemId: 1,
      path: 'src/_types',
    });
    const inventory = createInventory([
      createInventoryItem(0, 'src/_utils/widget', 'directory'),
      createInventoryItem(1, 'src/_types', 'directory'),
    ]);
    const taxonomy = createTaxonomy([ordinaryDirectory, categoryDirectory]);

    expect(
      isViolatingUnitName(ordinaryDirectory, taxonomy, inventory, [defaultTree])
    ).toBe(false);
    expect(
      isViolatingUnitName(categoryDirectory, taxonomy, inventory, [defaultTree])
    ).toBe(false);
  });

  it('exempts root nodes, foreign nodes, access nodes, and unauthorized nodes', () => {
    const rootNode = createClassification({
      entryKind: 'file',
      itemId: 0,
      nodeKind: 'root-node',
      path: 'src/main.ts',
    });
    const foreignNode = createClassification({
      entryKind: 'file',
      itemId: 1,
      nodeKind: 'foreign-node',
      path: 'src/Design.Notes.MD',
    });
    const accessNode = createClassification({
      entryKind: 'file',
      itemId: 2,
      nodeKind: 'access-node',
      path: 'src/_utils/widget/index.ts',
    });
    const unauthorized = createClassification({
      entryKind: 'file',
      itemId: 3,
      nodeKind: 'unauthorized-logical-node',
      path: 'src/_utils/widget/random.ts',
    });
    const unclassifiedFile = createClassification({
      entryKind: 'file',
      itemId: 4,
      nodeKind: null,
      path: 'src/unknown.ts',
    });
    const inventory = createInventory([
      createInventoryItem(0, 'src/main.ts', 'file'),
      createInventoryItem(1, 'src/Design.Notes.MD', 'file'),
      createInventoryItem(2, 'src/_utils/widget/index.ts', 'file'),
      createInventoryItem(3, 'src/_utils/widget/random.ts', 'file'),
      createInventoryItem(4, 'src/unknown.ts', 'file'),
    ]);
    const taxonomy = createTaxonomy([
      rootNode,
      foreignNode,
      accessNode,
      unauthorized,
      unclassifiedFile,
    ]);

    expect(
      isViolatingUnitName(rootNode, taxonomy, inventory, [defaultTree])
    ).toBe(false);
    expect(
      isViolatingUnitName(foreignNode, taxonomy, inventory, [defaultTree])
    ).toBe(false);
    expect(
      isViolatingUnitName(accessNode, taxonomy, inventory, [defaultTree])
    ).toBe(false);
    expect(
      isViolatingUnitName(unauthorized, taxonomy, inventory, [defaultTree])
    ).toBe(false);
    expect(
      isViolatingUnitName(unclassifiedFile, taxonomy, inventory, [defaultTree])
    ).toBe(false);
  });

  describe('category nodes', () => {
    it('accepts kebab-case stems and rejects non-kebab-case', () => {
      const valid = createClassification({
        entryKind: 'file',
        itemId: 0,
        nodeKind: 'category-node',
        path: 'src/_types/user-profile.type.ts',
      });
      const invalidCasing = createClassification({
        entryKind: 'file',
        itemId: 1,
        nodeKind: 'category-node',
        path: 'src/_types/userProfile.type.ts',
      });
      const noDot = createClassification({
        entryKind: 'file',
        itemId: 2,
        nodeKind: 'category-node',
        path: 'src/_styles/theme',
      });
      const inventory = createInventory([
        createInventoryItem(0, 'src/_types/user-profile.type.ts', 'file'),
        createInventoryItem(1, 'src/_types/userProfile.type.ts', 'file'),
        createInventoryItem(2, 'src/_styles/theme', 'file'),
      ]);
      const taxonomy = createTaxonomy([valid, invalidCasing, noDot]);

      expect(
        isViolatingUnitName(valid, taxonomy, inventory, [defaultTree])
      ).toBe(false);
      expect(
        isViolatingUnitName(invalidCasing, taxonomy, inventory, [defaultTree])
      ).toBe(true);
      expect(
        isViolatingUnitName(noDot, taxonomy, inventory, [defaultTree])
      ).toBe(false);
    });
  });

  describe('ordinary fragment nodes', () => {
    it('accepts kebab-case stems and rejects non-kebab-case', () => {
      const parent = createClassification({
        domainKind: 'fragment',
        entryKind: 'directory',
        itemId: 0,
        path: 'src/_utils/user-profile',
      });
      const valid = createClassification({
        entryKind: 'file',
        itemId: 1,
        nodeKind: 'master-node',
        path: 'src/_utils/user-profile/user-profile.util.ts',
      });
      const invalid = createClassification({
        entryKind: 'file',
        itemId: 2,
        nodeKind: 'fragment-node',
        path: 'src/_utils/user-profile/UserProfile.extra.ts',
      });
      const inventory = createInventory([
        createInventoryItem(0, 'src/_utils/user-profile', 'directory'),
        createInventoryItem(
          1,
          'src/_utils/user-profile/user-profile.util.ts',
          'file',
          0
        ),
        createInventoryItem(
          2,
          'src/_utils/user-profile/UserProfile.extra.ts',
          'file',
          0
        ),
      ]);
      const taxonomy = createTaxonomy([parent, valid, invalid]);

      expect(
        isViolatingUnitName(valid, taxonomy, inventory, [defaultTree])
      ).toBe(false);
      expect(
        isViolatingUnitName(invalid, taxonomy, inventory, [defaultTree])
      ).toBe(true);
    });
  });

  describe('path fragment directories and nodes', () => {
    it('verifies action-target naming for path fragment directories and files', () => {
      const parentDirectory = createClassification({
        domainKind: 'fragment',
        entryKind: 'directory',
        itemId: 0,
        path: 'src/_apis/get-todos',
        relationalQualifications: {
          ...qualifications,
          isPathFragment: true,
        },
      });
      const validMaster = createClassification({
        entryKind: 'file',
        itemId: 1,
        nodeKind: 'master-node',
        path: 'src/_apis/get-todos/get-todos.api.ts',
      });
      const invalidDirectory = createClassification({
        domainKind: 'fragment',
        entryKind: 'directory',
        itemId: 2,
        path: 'src/_apis/delete-todo',
        relationalQualifications: {
          ...qualifications,
          isPathFragment: true,
        },
      });
      const invalidMaster = createClassification({
        entryKind: 'file',
        itemId: 3,
        nodeKind: 'master-node',
        path: 'src/_apis/delete-todo/delete-todo.api.ts',
      });
      const inventory = createInventory([
        createInventoryItem(0, 'src/_apis/get-todos', 'directory'),
        createInventoryItem(
          1,
          'src/_apis/get-todos/get-todos.api.ts',
          'file',
          0
        ),
        createInventoryItem(2, 'src/_apis/delete-todo', 'directory'),
        createInventoryItem(
          3,
          'src/_apis/delete-todo/delete-todo.api.ts',
          'file',
          2
        ),
      ]);
      const taxonomy = createTaxonomy([
        parentDirectory,
        validMaster,
        invalidDirectory,
        invalidMaster,
      ]);

      expect(
        isViolatingUnitName(parentDirectory, taxonomy, inventory, [defaultTree])
      ).toBe(false);
      expect(
        isViolatingUnitName(validMaster, taxonomy, inventory, [defaultTree])
      ).toBe(false);
      expect(
        isViolatingUnitName(invalidDirectory, taxonomy, inventory, [
          defaultTree,
        ])
      ).toBe(true);
      expect(
        isViolatingUnitName(invalidMaster, taxonomy, inventory, [defaultTree])
      ).toBe(true);
    });

    it('verifies target-only path fragments', () => {
      const pageDirectory = createClassification({
        domainKind: 'fragment',
        entryKind: 'directory',
        itemId: 0,
        path: 'src/_pages/home',
        relationalQualifications: {
          ...qualifications,
          isPathFragment: true,
        },
      });
      const pageMaster = createClassification({
        entryKind: 'file',
        itemId: 1,
        nodeKind: 'master-node',
        path: 'src/_pages/home/home.page.ts',
      });
      const badPageDirectory = createClassification({
        domainKind: 'fragment',
        entryKind: 'directory',
        itemId: 2,
        path: 'src/_pages/BlogPost',
        relationalQualifications: {
          ...qualifications,
          isPathFragment: true,
        },
      });
      const badPageMaster = createClassification({
        entryKind: 'file',
        itemId: 3,
        nodeKind: 'master-node',
        path: 'src/_pages/BlogPost/BlogPost.page.ts',
      });
      const inventory = createInventory([
        createInventoryItem(0, 'src/_pages/home', 'directory'),
        createInventoryItem(1, 'src/_pages/home/home.page.ts', 'file', 0),
        createInventoryItem(2, 'src/_pages/BlogPost', 'directory'),
        createInventoryItem(
          3,
          'src/_pages/BlogPost/BlogPost.page.ts',
          'file',
          2
        ),
      ]);
      const taxonomy = createTaxonomy([
        pageDirectory,
        pageMaster,
        badPageDirectory,
        badPageMaster,
      ]);

      expect(
        isViolatingUnitName(pageDirectory, taxonomy, inventory, [defaultTree])
      ).toBe(false);
      expect(
        isViolatingUnitName(pageMaster, taxonomy, inventory, [defaultTree])
      ).toBe(false);
      expect(
        isViolatingUnitName(badPageDirectory, taxonomy, inventory, [
          defaultTree,
        ])
      ).toBe(true);
      expect(
        isViolatingUnitName(badPageMaster, taxonomy, inventory, [defaultTree])
      ).toBe(true);
    });
  });
});
