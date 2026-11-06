import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TTaxonomyModel,
} from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type {
  TEffectiveRole,
  TEffectiveTree,
} from '../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type { TInventory } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { isViolatingFragmentsForm } from './index.js';

const qualifications = {
  isParentCategory: false,
  isPathFragment: false,
  isPrivateCategory: false,
  isSubFragment: false,
  isSubLayer: false,
  parentFragmentPath: null,
};

const createClassification = (
  overrides: Partial<TItemClassification> = {}
): TItemClassification => ({
  domainKind: null,
  entryKind: 'file',
  fragmentInternalRank: null,
  imposedRoleName: 'component',
  itemId: 2,
  nodeKind: 'unauthorized-logical-node',
  path: 'src/_components/other.component.ts',
  relationalQualifications: qualifications,
  role: { kind: 'explicit', roleName: 'component' },
  ...overrides,
});

const createParent = (
  overrides: Partial<TItemClassification> = {}
): TItemClassification => ({
  domainKind: 'category',
  entryKind: 'directory',
  fragmentInternalRank: null,
  imposedRoleName: 'component',
  itemId: 1,
  nodeKind: null,
  path: 'src/_components',
  relationalQualifications: qualifications,
  role: { kind: 'absent', roleName: null },
  ...overrides,
});

const createTaxonomy = (
  items: readonly TItemClassification[]
): TTaxonomyModel => ({
  byItemId: new Map(
    items.map((itemClassification) => [
      itemClassification.itemId,
      itemClassification,
    ])
  ),
  byPath: new Map(
    items.map((itemClassification) => [
      itemClassification.path,
      itemClassification,
    ])
  ),
  classifications: items,
});

const createTree = (
  roles: readonly TEffectiveRole[],
  mimeticPaths: readonly string[] = []
): TEffectiveTree => ({
  catalog: {
    categoryToRole: new Map(),
    extensionToRole: new Map(),
    roles,
    subGraphRoles: ['spec'],
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
});

const createInventory = (filePath: string, parentPath: string): TInventory => ({
  items: [
    {
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
    {
      depth: 1,
      id: 1,
      isSymlink: false,
      kind: 'directory',
      parentId: 0,
      path: parentPath,
      preorderEnd: 2,
      preorderStart: 1,
      realPath: parentPath,
      treeOrigin: 'src',
    },
    {
      depth: 2,
      id: 2,
      isSymlink: false,
      kind: 'file',
      parentId: 1,
      path: filePath,
      preorderEnd: 1,
      preorderStart: 1,
      realPath: filePath,
      treeOrigin: 'src',
    },
  ],
  pathToId: new Map([
    ['src', 0],
    [filePath, 2],
    [parentPath, 1],
  ]),
  realPathToId: new Map(),
});

describe('isViolatingFragmentsForm', () => {
  const componentRole: TEffectiveRole = {
    allowMultipleSymbols: false,
    category: '_components',
    form: 'fragments',
    implicitExtensions: [],
    name: 'component',
    rank: 1,
  };

  const apiRole: TEffectiveRole = {
    allowMultipleSymbols: false,
    category: '_apis',
    form: 'fragments',
    implicitExtensions: [],
    name: 'api',
    rank: 1,
  };

  it('returns true when a direct file with a Role is in a Category of Fragments', () => {
    const file = createClassification();
    const parent = createParent();
    const taxonomy = createTaxonomy([parent, file]);
    const inventory = createInventory(file.path, parent.path);
    const trees = [createTree([componentRole])];

    expect(isViolatingFragmentsForm(file, taxonomy, inventory, trees)).toBe(
      true
    );
  });

  it('returns true when an index.ts file is directly in a Category of Fragments', () => {
    const file = createClassification({
      path: 'src/_components/index.ts',
      role: { kind: 'absent', roleName: null },
    });
    const parent = createParent();
    const taxonomy = createTaxonomy([parent, file]);
    const inventory = createInventory(file.path, parent.path);
    const trees = [createTree([componentRole])];

    expect(isViolatingFragmentsForm(file, taxonomy, inventory, trees)).toBe(
      true
    );
  });

  it('returns false for direct files in a mimetic parent category', () => {
    const file = createClassification({ path: 'src/_apis/value.type.ts' });
    const parent = createParent({ imposedRoleName: 'api', path: 'src/_apis' });
    const taxonomy = createTaxonomy([parent, file]);
    const inventory = createInventory(file.path, parent.path);
    const trees = [createTree([apiRole], ['src/_apis'])];

    expect(isViolatingFragmentsForm(file, taxonomy, inventory, trees)).toBe(
      false
    );
  });

  it('returns true when a Sub-Category of Fragments contains a file named after it', () => {
    const file = createClassification({
      path: 'src/_utils/_user-profile/_user-profile.util.ts',
      role: { kind: 'explicit', roleName: 'util' },
    });
    const parent = createParent({
      domainKind: 'sub-category',
      imposedRoleName: 'component',
      path: 'src/_utils/_user-profile',
    });
    const taxonomy = createTaxonomy([parent, file]);
    const inventory = createInventory(file.path, parent.path);
    const trees = [createTree([componentRole])];

    expect(isViolatingFragmentsForm(file, taxonomy, inventory, trees)).toBe(
      true
    );
  });

  it('returns false when a file in a Sub-Category does not match the directory stem', () => {
    const file = createClassification({
      path: 'src/_component/_atom/button.component.tsx',
      role: { kind: 'explicit', roleName: 'component' },
    });
    const parent = createParent({
      domainKind: 'sub-category',
      imposedRoleName: 'component',
      path: 'src/_component/_atom',
    });
    const taxonomy = createTaxonomy([parent, file]);
    const inventory = createInventory(file.path, parent.path);
    const trees = [createTree([componentRole])];

    expect(isViolatingFragmentsForm(file, taxonomy, inventory, trees)).toBe(
      false
    );
  });

  it('returns true when a Path Fragment Master has a role that differs from imposed role', () => {
    const file = createClassification({
      path: 'src/_apis/_todos/get-todo/get-todo.util.ts',
      role: { kind: 'explicit', roleName: 'util' },
    });
    const parent = createParent({
      domainKind: 'fragment',
      imposedRoleName: 'api',
      path: 'src/_apis/_todos/get-todo',
      relationalQualifications: { ...qualifications, isPathFragment: true },
    });
    const taxonomy = createTaxonomy([parent, file]);
    const inventory = createInventory(file.path, parent.path);
    const trees = [createTree([apiRole], ['src/_apis'])];

    expect(isViolatingFragmentsForm(file, taxonomy, inventory, trees)).toBe(
      true
    );
  });

  it('returns false when a Path Fragment Master matches the imposed role', () => {
    const file = createClassification({
      path: 'src/_apis/_todos/get-todo/get-todo.api.ts',
      role: { kind: 'explicit', roleName: 'api' },
    });
    const parent = createParent({
      domainKind: 'fragment',
      imposedRoleName: 'api',
      path: 'src/_apis/_todos/get-todo',
      relationalQualifications: { ...qualifications, isPathFragment: true },
    });
    const taxonomy = createTaxonomy([parent, file]);
    const inventory = createInventory(file.path, parent.path);
    const trees = [createTree([apiRole], ['src/_apis'])];

    expect(isViolatingFragmentsForm(file, taxonomy, inventory, trees)).toBe(
      false
    );
  });

  it('returns false when classification is not file or parent role form is not fragments', () => {
    const directoryClassification = createClassification({
      entryKind: 'directory',
    });
    const parent = createParent();
    const taxonomy = createTaxonomy([parent, directoryClassification]);
    const inventory = createInventory(
      directoryClassification.path,
      parent.path
    );
    const nodesRole: TEffectiveRole = {
      ...componentRole,
      form: 'category-nodes',
    };
    const trees = [createTree([nodesRole])];

    expect(
      isViolatingFragmentsForm(
        directoryClassification,
        taxonomy,
        inventory,
        trees
      )
    ).toBe(false);
  });

  it('returns false when entryKind is not file, nodeKind is null, or foreign-node', () => {
    const nullNode = createClassification({ nodeKind: null });
    const foreign = createClassification({ nodeKind: 'foreign-node' });
    const parent = createParent();
    const taxonomy = createTaxonomy([parent, nullNode, foreign]);
    const inventory = createInventory(nullNode.path, parent.path);
    const trees = [createTree([componentRole])];

    expect(isViolatingFragmentsForm(nullNode, taxonomy, inventory, trees)).toBe(
      false
    );
    expect(isViolatingFragmentsForm(foreign, taxonomy, inventory, trees)).toBe(
      false
    );
  });

  it('returns false when item is missing, has non-number parentId, or null treeOrigin', () => {
    const file = createClassification();
    const parent = createParent();
    const taxonomy = createTaxonomy([parent, file]);
    const trees = [createTree([componentRole])];

    const missingItemInventory: TInventory = {
      items: [],
      pathToId: new Map(),
      realPathToId: new Map(),
    };
    expect(
      isViolatingFragmentsForm(file, taxonomy, missingItemInventory, trees)
    ).toBe(false);

    const nullParentInventory: TInventory = {
      items: [
        {
          depth: 2,
          id: 2,
          isSymlink: false,
          kind: 'file',
          parentId: null,
          path: file.path,
          preorderEnd: 2,
          preorderStart: 2,
          realPath: file.path,
          treeOrigin: 'src',
        },
      ],
      pathToId: new Map([[file.path, 2]]),
      realPathToId: new Map(),
    };
    expect(
      isViolatingFragmentsForm(file, taxonomy, nullParentInventory, trees)
    ).toBe(false);

    const nullOriginInventory: TInventory = {
      items: [
        {
          depth: 2,
          id: 2,
          isSymlink: false,
          kind: 'file',
          parentId: 1,
          path: file.path,
          preorderEnd: 2,
          preorderStart: 2,
          realPath: file.path,
          treeOrigin: null,
        },
      ],
      pathToId: new Map([[file.path, 2]]),
      realPathToId: new Map(),
    };
    expect(
      isViolatingFragmentsForm(file, taxonomy, nullOriginInventory, trees)
    ).toBe(false);
  });

  it('returns false when parent has null imposedRoleName or tree is not found', () => {
    const file = createClassification();
    const parentNullRole = createParent({ imposedRoleName: null });
    const taxonomyNullRole = createTaxonomy([parentNullRole, file]);
    const inventory = createInventory(file.path, parentNullRole.path);
    const trees = [createTree([componentRole])];

    expect(
      isViolatingFragmentsForm(file, taxonomyNullRole, inventory, trees)
    ).toBe(false);

    const parent = createParent();
    const taxonomy = createTaxonomy([parent, file]);
    const otherInventory: TInventory = {
      ...inventory,
      items: inventory.items.map((item) => ({ ...item, treeOrigin: 'other' })),
    };
    expect(
      isViolatingFragmentsForm(file, taxonomy, otherInventory, trees)
    ).toBe(false);
  });

  it('returns false for files with absent role in a Category or Sub-Category of Fragments (except index.ts in Category)', () => {
    const nonIndexFile = createClassification({
      path: 'src/_components/notes.txt',
      role: { kind: 'absent', roleName: null },
    });
    const parentCategory = createParent();
    const taxonomyCat = createTaxonomy([parentCategory, nonIndexFile]);
    const inventoryCat = createInventory(
      nonIndexFile.path,
      parentCategory.path
    );
    const trees = [createTree([componentRole])];

    expect(
      isViolatingFragmentsForm(nonIndexFile, taxonomyCat, inventoryCat, trees)
    ).toBe(false);

    const subCategoryIndex = createClassification({
      path: 'src/_utils/_user-profile/index.ts',
      role: { kind: 'absent', roleName: null },
    });
    const subCategoryStemMatchingAbsent = createClassification({
      path: 'src/_utils/_user-profile/_user-profile',
      role: { kind: 'absent', roleName: null },
    });
    const parentSubCat = createParent({
      domainKind: 'sub-category',
      imposedRoleName: 'component',
      path: 'src/_utils/_user-profile',
    });
    const taxonomySub = createTaxonomy([
      parentSubCat,
      subCategoryIndex,
      subCategoryStemMatchingAbsent,
    ]);
    const inventorySub = createInventory(
      subCategoryIndex.path,
      parentSubCat.path
    );

    expect(
      isViolatingFragmentsForm(
        subCategoryIndex,
        taxonomySub,
        inventorySub,
        trees
      )
    ).toBe(false);

    const inventoryStem = createInventory(
      subCategoryStemMatchingAbsent.path,
      parentSubCat.path
    );
    expect(
      isViolatingFragmentsForm(
        subCategoryStemMatchingAbsent,
        taxonomySub,
        inventoryStem,
        trees
      )
    ).toBe(false);
  });
});
