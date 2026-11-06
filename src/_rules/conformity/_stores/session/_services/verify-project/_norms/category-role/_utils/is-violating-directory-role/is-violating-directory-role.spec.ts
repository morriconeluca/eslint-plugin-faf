import { describe, expect, it } from 'vitest';

import type { TItemClassification } from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type {
  TEffectiveRole,
  TEffectiveTree,
} from '../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type { TInventory } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { isViolatingDirectoryRole } from './index.js';

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
  domainKind: 'fragment',
  entryKind: 'directory',
  fragmentInternalRank: null,
  imposedRoleName: 'type',
  itemId: 1,
  nodeKind: null,
  path: 'src/_types/user',
  relationalQualifications: qualifications,
  role: { kind: 'absent', roleName: null },
  ...overrides,
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

const createInventory = (treeOrigin: null | string = 'src'): TInventory => ({
  items: [
    {
      depth: 0,
      id: 0,
      isSymlink: false,
      kind: 'directory',
      parentId: null,
      path: 'src',
      preorderEnd: 2,
      preorderStart: 0,
      realPath: 'src',
      treeOrigin,
    },
    {
      depth: 2,
      id: 1,
      isSymlink: false,
      kind: 'directory',
      parentId: 0,
      path: 'src/_types/user',
      preorderEnd: 1,
      preorderStart: 1,
      realPath: 'src/_types/user',
      treeOrigin,
    },
  ],
  pathToId: new Map([
    ['src', 0],
    ['src/_types/user', 1],
  ]),
  realPathToId: new Map(),
});

describe('isViolatingDirectoryRole', () => {
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

  it('returns true when a Fragment is placed in a Category of Category Nodes', () => {
    const classification = createClassification();
    const inventory = createInventory();
    const trees = [createTree([typeRoleNodes])];

    expect(isViolatingDirectoryRole(classification, inventory, trees)).toBe(
      true
    );
  });

  it('returns false when a Fragment has an imposed role in fragments form', () => {
    const classification = createClassification();
    const inventory = createInventory();
    const trees = [createTree([typeRoleFragments])];

    expect(isViolatingDirectoryRole(classification, inventory, trees)).toBe(
      false
    );
  });

  it('returns false when entryKind is not directory or domainKind is not fragment', () => {
    const fileItem = createClassification({ entryKind: 'file' });
    const layerItem = createClassification({ domainKind: 'layer' });
    const inventory = createInventory();
    const trees = [createTree([typeRoleNodes])];

    expect(isViolatingDirectoryRole(fileItem, inventory, trees)).toBe(false);
    expect(isViolatingDirectoryRole(layerItem, inventory, trees)).toBe(false);
  });

  it('returns false when imposedRoleName is null or not found in catalog', () => {
    const noRole = createClassification({ imposedRoleName: null });
    const unknownRole = createClassification({ imposedRoleName: 'unknown' });
    const inventory = createInventory();
    const trees = [createTree([typeRoleNodes])];

    expect(isViolatingDirectoryRole(noRole, inventory, trees)).toBe(false);
    expect(isViolatingDirectoryRole(unknownRole, inventory, trees)).toBe(false);
  });

  it('returns false when inventory item is missing or outside all trees', () => {
    const classification = createClassification({
      itemId: 999,
      path: 'outside',
    });
    const inventoryNoOrigin = createInventory(null);
    const trees = [createTree([typeRoleNodes])];

    expect(
      isViolatingDirectoryRole(classification, createInventory(), trees)
    ).toBe(false);
    expect(
      isViolatingDirectoryRole(createClassification(), inventoryNoOrigin, trees)
    ).toBe(false);
  });

  it('returns false when tree origin does not match any tree', () => {
    const classification = createClassification();
    const inventory = createInventory('other');
    const trees = [createTree([typeRoleNodes])];

    expect(isViolatingDirectoryRole(classification, inventory, trees)).toBe(
      false
    );
  });
});
