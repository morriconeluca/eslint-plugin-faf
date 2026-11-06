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

import { isViolatingNodeForm } from './index.js';

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
  imposedRoleName: 'type',
  itemId: 2,
  nodeKind: 'unauthorized-logical-node',
  path: 'src/_types/user.schema.ts',
  relationalQualifications: qualifications,
  role: { kind: 'explicit', roleName: 'schema' },
  ...overrides,
});

const createParent = (
  overrides: Partial<TItemClassification> = {}
): TItemClassification => ({
  domainKind: 'category',
  entryKind: 'directory',
  fragmentInternalRank: null,
  imposedRoleName: 'type',
  itemId: 1,
  nodeKind: null,
  path: 'src/_types',
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

const createTree = (roles: readonly TEffectiveRole[]): TEffectiveTree => ({
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
  mimeticPathStructures: [],
  originKind: 'root-layer',
  originPath: 'src',
  publicRootNodes: [],
  rootFragments: [],
  treeDependencyPairs: [],
});

const createInventory = (
  options: {
    parentId?: null | number;
    treeOrigin?: null | string;
  } = {}
): TInventory => {
  const treeOrigin =
    options.treeOrigin === undefined ? 'src' : options.treeOrigin;
  const parentId = options.parentId === undefined ? 1 : options.parentId;
  return {
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
        treeOrigin,
      },
      {
        depth: 1,
        id: 1,
        isSymlink: false,
        kind: 'directory',
        parentId: 0,
        path: 'src/_types',
        preorderEnd: 2,
        preorderStart: 1,
        realPath: 'src/_types',
        treeOrigin,
      },
      {
        depth: 2,
        id: 2,
        isSymlink: false,
        kind: 'file',
        parentId,
        path: 'src/_types/user.schema.ts',
        preorderEnd: 1,
        preorderStart: 1,
        realPath: 'src/_types/user.schema.ts',
        treeOrigin,
      },
    ],
    pathToId: new Map([
      ['src', 0],
      ['src/_types', 1],
      ['src/_types/user.schema.ts', 2],
    ]),
    realPathToId: new Map(),
  };
};

describe('isViolatingNodeForm', () => {
  const typeRoleNodes: TEffectiveRole = {
    allowMultipleSymbols: true,
    category: '_types',
    form: 'category-nodes',
    implicitExtensions: ['.css'],
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

  it('returns true when a non-category-node file is placed in a Category of Category Nodes', () => {
    const file = createClassification();
    const parent = createParent();
    const taxonomy = createTaxonomy([parent, file]);
    const inventory = createInventory();
    const trees = [createTree([typeRoleNodes])];

    expect(isViolatingNodeForm(file, taxonomy, inventory, trees)).toBe(true);
  });

  it('returns false when a valid Category Node is placed in a Category of Category Nodes', () => {
    const file = createClassification({
      nodeKind: 'category-node',
      path: 'src/_types/user.type.ts',
      role: { kind: 'explicit', roleName: 'type' },
    });
    const parent = createParent();
    const taxonomy = createTaxonomy([parent, file]);
    const inventory = createInventory();
    const trees = [createTree([typeRoleNodes])];

    expect(isViolatingNodeForm(file, taxonomy, inventory, trees)).toBe(false);
  });

  it('returns true when an implicit asset file is not classified as a category-node', () => {
    const assetFile = createClassification({
      nodeKind: 'unauthorized-logical-node',
      path: 'src/_utils/widget/theme.css',
      role: { kind: 'implicit', roleName: 'style' },
    });
    const parent = createParent();
    const taxonomy = createTaxonomy([parent, assetFile]);
    const inventory = createInventory();
    const trees = [createTree([typeRoleNodes])];

    expect(isViolatingNodeForm(assetFile, taxonomy, inventory, trees)).toBe(
      true
    );
  });

  it('returns false when an implicit asset file is an authorized category-node', () => {
    const assetFile = createClassification({
      nodeKind: 'category-node',
      path: 'src/_styles/theme.css',
      role: { kind: 'implicit', roleName: 'style' },
    });
    const parent = createParent();
    const taxonomy = createTaxonomy([parent, assetFile]);
    const inventory = createInventory();
    const trees = [createTree([typeRoleNodes])];

    expect(isViolatingNodeForm(assetFile, taxonomy, inventory, trees)).toBe(
      false
    );
  });

  it('returns false when entryKind is not file, nodeKind is null, or foreign-node', () => {
    const directoryClassification = createClassification({
      entryKind: 'directory',
    });
    const nullNode = createClassification({ nodeKind: null });
    const foreign = createClassification({ nodeKind: 'foreign-node' });
    const parent = createParent();
    const taxonomy = createTaxonomy([
      parent,
      directoryClassification,
      nullNode,
      foreign,
    ]);
    const inventory = createInventory();
    const trees = [createTree([typeRoleNodes])];

    expect(
      isViolatingNodeForm(directoryClassification, taxonomy, inventory, trees)
    ).toBe(false);
    expect(isViolatingNodeForm(nullNode, taxonomy, inventory, trees)).toBe(
      false
    );
    expect(isViolatingNodeForm(foreign, taxonomy, inventory, trees)).toBe(
      false
    );
  });

  it('returns false when parent is not category or sub-category', () => {
    const file = createClassification();
    const parent = createParent({ domainKind: 'fragment' });
    const taxonomy = createTaxonomy([parent, file]);
    const inventory = createInventory();
    const trees = [createTree([typeRoleNodes])];

    expect(isViolatingNodeForm(file, taxonomy, inventory, trees)).toBe(false);
  });

  it('returns false when parent imposed role form is fragments', () => {
    const file = createClassification();
    const parent = createParent();
    const taxonomy = createTaxonomy([parent, file]);
    const inventory = createInventory();
    const trees = [createTree([typeRoleFragments])];

    expect(isViolatingNodeForm(file, taxonomy, inventory, trees)).toBe(false);
  });

  it('returns false when parent has null imposedRoleName or inventory parent is null', () => {
    const file = createClassification();
    const parent = createParent({ imposedRoleName: null });
    const taxonomy = createTaxonomy([parent, file]);
    const inventory = createInventory();
    const trees = [createTree([typeRoleNodes])];

    expect(isViolatingNodeForm(file, taxonomy, inventory, trees)).toBe(false);

    const noParentInventory = createInventory({ parentId: null });
    expect(isViolatingNodeForm(file, taxonomy, noParentInventory, trees)).toBe(
      false
    );

    const missingParentTaxonomy = createTaxonomy([file]);
    const missingParentInventory = createInventory({ parentId: 999 });
    expect(
      isViolatingNodeForm(
        file,
        missingParentTaxonomy,
        missingParentInventory,
        trees
      )
    ).toBe(false);
  });
});
