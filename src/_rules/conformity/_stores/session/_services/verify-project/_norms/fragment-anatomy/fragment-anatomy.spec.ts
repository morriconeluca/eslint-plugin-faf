import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TLogicalDomainKind,
  TNodeKind,
  TRoleAttribution,
  TTaxonomyModel,
} from '../../_verify-project@shared/_types/_compounds/classification.type.js';
import type {
  TEffectiveRole,
  TEffectiveTree,
} from '../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type { TInventoryItem } from '../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyFragmentAnatomy } from './fragment-anatomy.norm.js';

const absentRole: TRoleAttribution = {
  kind: 'absent' as const,
  roleName: null,
};

const explicitRole = (roleName: string): TRoleAttribution => ({
  kind: 'explicit' as const,
  roleName,
});

const defaultQualifications = {
  isParentCategory: false,
  isPathFragment: false,
  isPrivateCategory: false,
  isSubFragment: false,
  isSubLayer: false,
  parentFragmentPath: null,
};

const defaultRoles: readonly TEffectiveRole[] = [
  {
    allowMultipleSymbols: false,
    category: '_modules',
    form: 'category-nodes' as const,
    implicitExtensions: ['.module.css'],
    name: 'module',
    rank: 1,
  },
  {
    allowMultipleSymbols: false,
    category: '_types',
    form: 'category-nodes' as const,
    implicitExtensions: [],
    name: 'type',
    rank: 6,
  },
  {
    allowMultipleSymbols: false,
    category: '_styled',
    form: 'category-nodes' as const,
    implicitExtensions: [],
    name: 'styled',
    rank: 10,
  },
  {
    allowMultipleSymbols: false,
    category: '_utils',
    form: 'fragments' as const,
    implicitExtensions: [],
    name: 'util',
    rank: 11,
  },
  {
    allowMultipleSymbols: false,
    category: '_classes',
    form: 'fragments' as const,
    implicitExtensions: [],
    name: 'class',
    rank: 12,
  },
  {
    allowMultipleSymbols: false,
    category: '_factories',
    form: 'fragments' as const,
    implicitExtensions: [],
    name: 'factory',
    rank: 13,
  },
  {
    allowMultipleSymbols: false,
    category: '_hooks',
    form: 'fragments' as const,
    implicitExtensions: [],
    name: 'hook',
    rank: 15,
  },
  {
    allowMultipleSymbols: false,
    category: '_components',
    form: 'fragments' as const,
    implicitExtensions: [],
    name: 'component',
    rank: 16,
  },
  {
    allowMultipleSymbols: false,
    category: '_context',
    form: 'fragments' as const,
    implicitExtensions: [],
    name: 'context',
    rank: 16,
  },
];

const defaultTree: TEffectiveTree = {
  catalog: {
    categoryToRole: new Map(),
    extensionToRole: new Map(),
    roles: defaultRoles,
    subGraphRoles: ['spec', 'story'],
    topRank: 17,
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
};

type TTestItemDefinition = {
  readonly domainKind?: null | TLogicalDomainKind;
  readonly fragmentInternalRank?: null | number;
  readonly id: number;
  readonly imposedRoleName?: null | string;
  readonly isSubFragment?: boolean;
  readonly kind: 'directory' | 'file';
  readonly nodeKind?: null | TNodeKind;
  readonly parentFragmentPath?: null | string;
  readonly parentId: null | number;
  readonly path: string;
  readonly role?: TRoleAttribution;
  readonly treeOrigin?: null | string;
};

const buildModel = (
  items: readonly TTestItemDefinition[]
): TVerificationModel => {
  const inventoryItems: TInventoryItem[] = items.map((itemDefinition) => ({
    depth: itemDefinition.parentId === null ? 0 : 1,
    id: itemDefinition.id,
    isSymlink: false,
    kind: itemDefinition.kind,
    parentId: itemDefinition.parentId,
    path: itemDefinition.path,
    preorderEnd: 0,
    preorderStart: 0,
    realPath: `/project/${itemDefinition.path}`,
    treeOrigin:
      itemDefinition.treeOrigin === undefined
        ? 'src'
        : itemDefinition.treeOrigin,
  }));

  const classifications: TItemClassification[] = items.map(
    (itemDefinition) => ({
      domainKind: itemDefinition.domainKind ?? null,
      entryKind: itemDefinition.kind,
      fragmentInternalRank: itemDefinition.fragmentInternalRank ?? null,
      imposedRoleName: itemDefinition.imposedRoleName ?? null,
      itemId: itemDefinition.id,
      nodeKind: itemDefinition.nodeKind ?? null,
      path: itemDefinition.path,
      relationalQualifications: {
        ...defaultQualifications,
        isSubFragment: itemDefinition.isSubFragment ?? false,
        parentFragmentPath: itemDefinition.parentFragmentPath ?? null,
      },
      role: itemDefinition.role ?? absentRole,
    })
  );

  const taxonomy: TTaxonomyModel = {
    byItemId: new Map(classifications.map((item) => [item.itemId, item])),
    byPath: new Map(classifications.map((item) => [item.path, item])),
    classifications,
  };

  const base = verificationModel();
  return {
    ...base,
    basis: {
      ...base.basis,
      declarations: {
        ...base.basis.declarations,
        trees: [defaultTree],
      },
      inventory: {
        items: inventoryItems,
        pathToId: new Map(inventoryItems.map((item) => [item.path, item.id])),
        realPathToId: new Map(
          inventoryItems.map((item) => [item.realPath, item.id])
        ),
      },
    },
    taxonomy,
  };
};

describe('verifyFragmentAnatomy', () => {
  it('passes on a fully conformant Fragment with Master, Access Node, valid Fragment Nodes, Sub-Graph Nodes, and Foreign Nodes', () => {
    const model = buildModel([
      {
        domainKind: 'fragment',
        id: 0,
        imposedRoleName: 'component',
        kind: 'directory',
        parentId: null,
        path: 'src/_components/button',
      },
      {
        fragmentInternalRank: 16,
        id: 1,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 0,
        path: 'src/_components/button/button.component.tsx',
        role: explicitRole('component'),
      },
      {
        fragmentInternalRank: 17,
        id: 2,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 0,
        path: 'src/_components/button/index.ts',
      },
      {
        fragmentInternalRank: 15,
        id: 3,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'fragment-node',
        parentId: 0,
        path: 'src/_components/button/button.hook.ts',
        role: explicitRole('hook'),
      },
      {
        fragmentInternalRank: 6,
        id: 4,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'fragment-node',
        parentId: 0,
        path: 'src/_components/button/button.type.ts',
        role: explicitRole('type'),
      },
      {
        fragmentInternalRank: 1,
        id: 5,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'fragment-node',
        parentId: 0,
        path: 'src/_components/button/button.module.css',
        role: explicitRole('module'),
      },
      {
        fragmentInternalRank: 17,
        id: 6,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'sub-graph-node',
        parentId: 0,
        path: 'src/_components/button/button.spec.tsx',
        role: explicitRole('spec'),
      },
      {
        fragmentInternalRank: 17,
        id: 7,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'sub-graph-node',
        parentId: 0,
        path: 'src/_components/button/button.story.tsx',
        role: explicitRole('story'),
      },
      {
        id: 8,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'foreign-node',
        parentId: 0,
        path: 'src/_components/button/README.md',
      },
    ]);

    expect(verifyFragmentAnatomy(model)).toEqual([]);
  });

  it('reports missing-master-node when Master is absent', () => {
    const model = buildModel([
      {
        domainKind: 'fragment',
        id: 0,
        imposedRoleName: 'component',
        kind: 'directory',
        parentId: null,
        path: 'src/_components/button',
      },
      {
        fragmentInternalRank: 17,
        id: 1,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 0,
        path: 'src/_components/button/index.ts',
      },
    ]);

    expect(verifyFragmentAnatomy(model)).toEqual([
      {
        constraint: 'classification/missing-master-node',
        element: 'src/_components/button',
        family: 'classification',
        message:
          "'src/_components/button' has no direct Fragment Node with the Role imposed by its Category",
        normativeReference: 'FAF §6.1.1',
      },
    ]);
  });

  it('reports missing-master-node when Master is replaced by Sub-Graph Node', () => {
    const model = buildModel([
      {
        domainKind: 'fragment',
        id: 0,
        imposedRoleName: 'component',
        kind: 'directory',
        parentId: null,
        path: 'src/_components/button',
      },
      {
        fragmentInternalRank: 17,
        id: 1,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'sub-graph-node',
        parentId: 0,
        path: 'src/_components/button/button.spec.tsx',
        role: explicitRole('spec'),
      },
      {
        fragmentInternalRank: 17,
        id: 2,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 0,
        path: 'src/_components/button/index.ts',
      },
    ]);

    expect(verifyFragmentAnatomy(model)).toEqual([
      {
        constraint: 'classification/missing-master-node',
        element: 'src/_components/button',
        family: 'classification',
        message:
          "'src/_components/button' has no direct Fragment Node with the Role imposed by its Category",
        normativeReference: 'FAF §6.1.1',
      },
    ]);
  });

  it('reports missing-master-node when Master is present only in a Sub-Fragment', () => {
    const model = buildModel([
      {
        domainKind: 'fragment',
        id: 0,
        imposedRoleName: 'component',
        kind: 'directory',
        parentId: null,
        path: 'src/_components/button',
      },
      {
        fragmentInternalRank: 17,
        id: 1,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 0,
        path: 'src/_components/button/index.ts',
      },
      {
        domainKind: 'category',
        id: 2,
        kind: 'directory',
        parentId: 0,
        path: 'src/_components/button/_components',
      },
      {
        domainKind: 'fragment',
        id: 3,
        imposedRoleName: 'component',
        isSubFragment: true,
        kind: 'directory',
        parentFragmentPath: 'src/_components/button',
        parentId: 2,
        path: 'src/_components/button/_components/icon',
      },
      {
        fragmentInternalRank: 16,
        id: 4,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 3,
        path: 'src/_components/button/_components/icon/icon.component.ts',
        role: explicitRole('component'),
      },
      {
        fragmentInternalRank: 17,
        id: 5,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 3,
        path: 'src/_components/button/_components/icon/index.ts',
      },
    ]);

    expect(verifyFragmentAnatomy(model)).toEqual([
      {
        constraint: 'classification/missing-master-node',
        element: 'src/_components/button',
        family: 'classification',
        message:
          "'src/_components/button' has no direct Fragment Node with the Role imposed by its Category",
        normativeReference: 'FAF §6.1.1',
      },
    ]);
  });

  it('reports missing-access-node when index.ts is absent', () => {
    const model = buildModel([
      {
        domainKind: 'fragment',
        id: 0,
        imposedRoleName: 'component',
        kind: 'directory',
        parentId: null,
        path: 'src/_components/button',
      },
      {
        fragmentInternalRank: 16,
        id: 1,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 0,
        path: 'src/_components/button/button.component.tsx',
        role: explicitRole('component'),
      },
    ]);

    expect(verifyFragmentAnatomy(model)).toEqual([
      {
        constraint: 'classification/missing-access-node',
        element: 'src/_components/button',
        family: 'classification',
        message: "'src/_components/button' has no index.ts Access Node",
        normativeReference: 'FAF §6.1.1',
      },
    ]);
  });

  it('reports missing-access-node when index.ts is designated Foreign', () => {
    const model = buildModel([
      {
        domainKind: 'fragment',
        id: 0,
        imposedRoleName: 'component',
        kind: 'directory',
        parentId: null,
        path: 'src/_components/button',
      },
      {
        fragmentInternalRank: 16,
        id: 1,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 0,
        path: 'src/_components/button/button.component.tsx',
        role: explicitRole('component'),
      },
      {
        id: 2,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'foreign-node',
        parentId: 0,
        path: 'src/_components/button/index.ts',
      },
    ]);

    expect(verifyFragmentAnatomy(model)).toEqual([
      {
        constraint: 'classification/missing-access-node',
        element: 'src/_components/button',
        family: 'classification',
        message: "'src/_components/button' has no index.ts Access Node",
        normativeReference: 'FAF §6.1.1',
      },
    ]);
  });

  it('reports both missing-access-node and missing-master-node on an empty Fragment', () => {
    const model = buildModel([
      {
        domainKind: 'fragment',
        id: 0,
        imposedRoleName: 'component',
        kind: 'directory',
        parentId: null,
        path: 'src/_components/button',
      },
    ]);

    expect(verifyFragmentAnatomy(model)).toEqual([
      {
        constraint: 'classification/missing-access-node',
        element: 'src/_components/button',
        family: 'classification',
        message: "'src/_components/button' has no index.ts Access Node",
        normativeReference: 'FAF §6.1.1',
      },
      {
        constraint: 'classification/missing-master-node',
        element: 'src/_components/button',
        family: 'classification',
        message:
          "'src/_components/button' has no direct Fragment Node with the Role imposed by its Category",
        normativeReference: 'FAF §6.1.1',
      },
    ]);
  });

  it('reports duplicate-fragment-role when the Master Role is duplicated', () => {
    const model = buildModel([
      {
        domainKind: 'fragment',
        id: 0,
        imposedRoleName: 'component',
        kind: 'directory',
        parentId: null,
        path: 'src/_components/button',
      },
      {
        fragmentInternalRank: 16,
        id: 1,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'fragment-node',
        parentId: 0,
        path: 'src/_components/button/button.component.ts',
        role: explicitRole('component'),
      },
      {
        fragmentInternalRank: 16,
        id: 2,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'fragment-node',
        parentId: 0,
        path: 'src/_components/button/button.component.tsx',
        role: explicitRole('component'),
      },
      {
        fragmentInternalRank: 17,
        id: 3,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 0,
        path: 'src/_components/button/index.ts',
      },
    ]);

    expect(verifyFragmentAnatomy(model)).toEqual([
      {
        constraint: 'classification/duplicate-fragment-role',
        element: 'src/_components/button',
        family: 'classification',
        message:
          "'src/_components/button' has more than one direct Logical Node with the same explicit Role",
        normativeReference: 'FAF §6.1.1',
      },
    ]);
  });

  it('reports duplicate-fragment-role when an internal Role is duplicated', () => {
    const model = buildModel([
      {
        domainKind: 'fragment',
        id: 0,
        imposedRoleName: 'component',
        kind: 'directory',
        parentId: null,
        path: 'src/_components/button',
      },
      {
        fragmentInternalRank: 16,
        id: 1,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 0,
        path: 'src/_components/button/button.component.tsx',
        role: explicitRole('component'),
      },
      {
        fragmentInternalRank: 17,
        id: 2,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 0,
        path: 'src/_components/button/index.ts',
      },
      {
        fragmentInternalRank: 15,
        id: 3,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'fragment-node',
        parentId: 0,
        path: 'src/_components/button/button.hook.ts',
        role: explicitRole('hook'),
      },
      {
        fragmentInternalRank: 15,
        id: 4,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'fragment-node',
        parentId: 0,
        path: 'src/_components/button/button.hook.tsx',
        role: explicitRole('hook'),
      },
    ]);

    expect(verifyFragmentAnatomy(model)).toEqual([
      {
        constraint: 'classification/duplicate-fragment-role',
        element: 'src/_components/button',
        family: 'classification',
        message:
          "'src/_components/button' has more than one direct Logical Node with the same explicit Role",
        normativeReference: 'FAF §6.1.1',
      },
    ]);
  });

  it('reports duplicate-fragment-role when a Sub-Graph Role is duplicated', () => {
    const model = buildModel([
      {
        domainKind: 'fragment',
        id: 0,
        imposedRoleName: 'component',
        kind: 'directory',
        parentId: null,
        path: 'src/_components/button',
      },
      {
        fragmentInternalRank: 16,
        id: 1,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 0,
        path: 'src/_components/button/button.component.tsx',
        role: explicitRole('component'),
      },
      {
        fragmentInternalRank: 17,
        id: 2,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 0,
        path: 'src/_components/button/index.ts',
      },
      {
        fragmentInternalRank: 17,
        id: 3,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'sub-graph-node',
        parentId: 0,
        path: 'src/_components/button/button.spec.ts',
        role: explicitRole('spec'),
      },
      {
        fragmentInternalRank: 17,
        id: 4,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'sub-graph-node',
        parentId: 0,
        path: 'src/_components/button/button.spec.tsx',
        role: explicitRole('spec'),
      },
    ]);

    expect(verifyFragmentAnatomy(model)).toEqual([
      {
        constraint: 'classification/duplicate-fragment-role',
        element: 'src/_components/button',
        family: 'classification',
        message:
          "'src/_components/button' has more than one direct Logical Node with the same explicit Role",
        normativeReference: 'FAF §6.1.1',
      },
    ]);
  });

  it('reports one duplicate-fragment-role for each repeated Role in the same Fragment', () => {
    const model = buildModel([
      {
        domainKind: 'fragment',
        id: 0,
        imposedRoleName: 'component',
        kind: 'directory',
        parentId: null,
        path: 'src/_components/button',
      },
      {
        fragmentInternalRank: 16,
        id: 1,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 0,
        path: 'src/_components/button/button.component.tsx',
        role: explicitRole('component'),
      },
      {
        fragmentInternalRank: 17,
        id: 2,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 0,
        path: 'src/_components/button/index.ts',
      },
      {
        fragmentInternalRank: 15,
        id: 3,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'fragment-node',
        parentId: 0,
        path: 'src/_components/button/button.hook.ts',
        role: explicitRole('hook'),
      },
      {
        fragmentInternalRank: 15,
        id: 4,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'fragment-node',
        parentId: 0,
        path: 'src/_components/button/button.hook.tsx',
        role: explicitRole('hook'),
      },
      {
        fragmentInternalRank: 17,
        id: 5,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'sub-graph-node',
        parentId: 0,
        path: 'src/_components/button/button.spec.ts',
        role: explicitRole('spec'),
      },
      {
        fragmentInternalRank: 17,
        id: 6,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'sub-graph-node',
        parentId: 0,
        path: 'src/_components/button/button.spec.tsx',
        role: explicitRole('spec'),
      },
    ]);

    const outcomes = verifyFragmentAnatomy(model);
    expect(outcomes).toHaveLength(2);
    expect(
      outcomes.every(
        (outcome) =>
          outcome.constraint === 'classification/duplicate-fragment-role' &&
          outcome.element === 'src/_components/button'
      )
    ).toBe(true);
  });

  it('allows the same internal Role in separate Fragments', () => {
    const model = buildModel([
      {
        domainKind: 'fragment',
        id: 0,
        imposedRoleName: 'component',
        kind: 'directory',
        parentId: null,
        path: 'src/_components/button',
      },
      {
        fragmentInternalRank: 16,
        id: 1,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 0,
        path: 'src/_components/button/button.component.tsx',
        role: explicitRole('component'),
      },
      {
        fragmentInternalRank: 17,
        id: 2,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 0,
        path: 'src/_components/button/index.ts',
      },
      {
        fragmentInternalRank: 6,
        id: 3,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'fragment-node',
        parentId: 0,
        path: 'src/_components/button/button.type.ts',
        role: explicitRole('type'),
      },
      {
        domainKind: 'fragment',
        id: 4,
        imposedRoleName: 'component',
        kind: 'directory',
        parentId: null,
        path: 'src/_components/icon',
      },
      {
        fragmentInternalRank: 16,
        id: 5,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 4,
        path: 'src/_components/icon/icon.component.ts',
        role: explicitRole('component'),
      },
      {
        fragmentInternalRank: 17,
        id: 6,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 4,
        path: 'src/_components/icon/index.ts',
      },
      {
        fragmentInternalRank: 6,
        id: 7,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'fragment-node',
        parentId: 4,
        path: 'src/_components/icon/icon.type.ts',
        role: explicitRole('type'),
      },
    ]);

    expect(verifyFragmentAnatomy(model)).toEqual([]);
  });

  it('reports fragment-node-rank when a Fragment Node has equal Rank to the Master', () => {
    const model = buildModel([
      {
        domainKind: 'fragment',
        id: 0,
        imposedRoleName: 'component',
        kind: 'directory',
        parentId: null,
        path: 'src/_components/button',
      },
      {
        fragmentInternalRank: 16,
        id: 1,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 0,
        path: 'src/_components/button/button.component.tsx',
        role: explicitRole('component'),
      },
      {
        fragmentInternalRank: 17,
        id: 2,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 0,
        path: 'src/_components/button/index.ts',
      },
      {
        fragmentInternalRank: 16,
        id: 3,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'fragment-node',
        parentId: 0,
        path: 'src/_components/button/button.context.ts',
        role: explicitRole('context'),
      },
    ]);

    expect(verifyFragmentAnatomy(model)).toEqual([
      {
        constraint: 'classification/fragment-node-rank',
        element: 'src/_components/button/button.context.ts',
        family: 'classification',
        message:
          "'src/_components/button/button.context.ts' has a Rank not strictly lower than the Master Node of its Fragment",
        normativeReference: 'FAF §6.1.3',
      },
    ]);
  });

  it('reports fragment-node-rank when a Fragment Node has higher Rank than the Master', () => {
    const model = buildModel([
      {
        domainKind: 'fragment',
        id: 0,
        imposedRoleName: 'util',
        kind: 'directory',
        parentId: null,
        path: 'src/_utils/normalize',
      },
      {
        fragmentInternalRank: 11,
        id: 1,
        imposedRoleName: 'util',
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 0,
        path: 'src/_utils/normalize/normalize.util.ts',
        role: explicitRole('util'),
      },
      {
        fragmentInternalRank: 17,
        id: 2,
        imposedRoleName: 'util',
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 0,
        path: 'src/_utils/normalize/index.ts',
      },
      {
        fragmentInternalRank: 12,
        id: 3,
        imposedRoleName: 'util',
        kind: 'file',
        nodeKind: 'fragment-node',
        parentId: 0,
        path: 'src/_utils/normalize/normalize.class.ts',
        role: explicitRole('class'),
      },
      {
        fragmentInternalRank: 13,
        id: 4,
        imposedRoleName: 'util',
        kind: 'file',
        nodeKind: 'fragment-node',
        parentId: 0,
        path: 'src/_utils/normalize/normalize.factory.ts',
        role: explicitRole('factory'),
      },
    ]);

    expect(verifyFragmentAnatomy(model)).toEqual([
      {
        constraint: 'classification/fragment-node-rank',
        element: 'src/_utils/normalize/normalize.class.ts',
        family: 'classification',
        message:
          "'src/_utils/normalize/normalize.class.ts' has a Rank not strictly lower than the Master Node of its Fragment",
        normativeReference: 'FAF §6.1.3',
      },
      {
        constraint: 'classification/fragment-node-rank',
        element: 'src/_utils/normalize/normalize.factory.ts',
        family: 'classification',
        message:
          "'src/_utils/normalize/normalize.factory.ts' has a Rank not strictly lower than the Master Node of its Fragment",
        normativeReference: 'FAF §6.1.3',
      },
    ]);
  });

  it('reports fragment-node-anatomy for unauthorized files in a Fragment', () => {
    const files = [
      'index.tsx',
      'utility.ts',
      'other.component.tsx',
      'other.spec.tsx',
      'button.component.spec.tsx',
    ];

    for (const file of files) {
      const model = buildModel([
        {
          domainKind: 'fragment',
          id: 0,
          imposedRoleName: 'component',
          kind: 'directory',
          parentId: null,
          path: 'src/_components/button',
        },
        {
          fragmentInternalRank: 16,
          id: 1,
          imposedRoleName: 'component',
          kind: 'file',
          nodeKind: 'master-node',
          parentId: 0,
          path: 'src/_components/button/button.component.tsx',
          role: explicitRole('component'),
        },
        {
          fragmentInternalRank: 17,
          id: 2,
          imposedRoleName: 'component',
          kind: 'file',
          nodeKind: 'access-node',
          parentId: 0,
          path: 'src/_components/button/index.ts',
        },
        {
          id: 3,
          imposedRoleName: 'component',
          kind: 'file',
          nodeKind: 'unauthorized-logical-node',
          parentId: 0,
          path: `src/_components/button/${file}`,
          role: file.endsWith('.tsx') ? explicitRole('component') : absentRole,
        },
      ]);

      expect(verifyFragmentAnatomy(model)).toEqual([
        {
          constraint: 'classification/fragment-node-anatomy',
          element: `src/_components/button/${file}`,
          family: 'classification',
          message: `'src/_components/button/${file}' is not a Fragment Node, Access Node or Sub-Graph Node named after its Fragment`,
          normativeReference: 'FAF §6.1.1',
        },
      ]);
    }
  });

  it('keeps complete anatomy across three Parent Fragment boundaries', () => {
    const model = buildModel([
      {
        domainKind: 'fragment',
        id: 0,
        imposedRoleName: 'component',
        kind: 'directory',
        parentId: null,
        path: 'src/_components/button',
      },
      {
        fragmentInternalRank: 16,
        id: 1,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 0,
        path: 'src/_components/button/button.component.tsx',
        role: explicitRole('component'),
      },
      {
        fragmentInternalRank: 17,
        id: 2,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 0,
        path: 'src/_components/button/index.ts',
      },
      {
        domainKind: 'category',
        id: 3,
        kind: 'directory',
        parentId: 0,
        path: 'src/_components/button/_components',
      },
      {
        domainKind: 'fragment',
        id: 4,
        imposedRoleName: 'component',
        isSubFragment: true,
        kind: 'directory',
        parentFragmentPath: 'src/_components/button',
        parentId: 3,
        path: 'src/_components/button/_components/icon',
      },
      {
        fragmentInternalRank: 16,
        id: 5,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 4,
        path: 'src/_components/button/_components/icon/icon.component.ts',
        role: explicitRole('component'),
      },
      {
        fragmentInternalRank: 17,
        id: 6,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 4,
        path: 'src/_components/button/_components/icon/index.ts',
      },
      {
        domainKind: 'category',
        id: 7,
        kind: 'directory',
        parentId: 4,
        path: 'src/_components/button/_components/icon/_utils',
      },
      {
        domainKind: 'fragment',
        id: 8,
        imposedRoleName: 'util',
        isSubFragment: true,
        kind: 'directory',
        parentFragmentPath: 'src/_components/button/_components/icon',
        parentId: 7,
        path: 'src/_components/button/_components/icon/_utils/normalize',
      },
      {
        fragmentInternalRank: 11,
        id: 9,
        imposedRoleName: 'util',
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 8,
        path: 'src/_components/button/_components/icon/_utils/normalize/normalize.util.ts',
        role: explicitRole('util'),
      },
      {
        fragmentInternalRank: 17,
        id: 10,
        imposedRoleName: 'util',
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 8,
        path: 'src/_components/button/_components/icon/_utils/normalize/index.ts',
      },
    ]);

    expect(verifyFragmentAnatomy(model)).toEqual([]);
  });

  it('does not enforce Fragment anatomy on a Root Fragment', () => {
    const model = buildModel([
      {
        domainKind: 'root-fragment',
        id: 0,
        imposedRoleName: null,
        kind: 'directory',
        parentId: null,
        path: 'src',
      },
      {
        id: 1,
        kind: 'file',
        nodeKind: 'root-node',
        parentId: 0,
        path: 'src/main.ts',
      },
    ]);

    expect(verifyFragmentAnatomy(model)).toEqual([]);
  });

  it('ignores items with unclassified domain or node', () => {
    const model = buildModel([
      {
        domainKind: null,
        id: 0,
        imposedRoleName: null,
        kind: 'directory',
        parentId: null,
        path: 'src/unknown',
      },
      {
        id: 1,
        kind: 'file',
        nodeKind: null,
        parentId: 0,
        path: 'src/unknown/file.ts',
      },
    ]);

    expect(verifyFragmentAnatomy(model)).toEqual([]);
  });

  it('is deterministic under arbitrary permutation of inventory items', () => {
    const itemA: TTestItemDefinition = {
      domainKind: 'fragment',
      id: 0,
      imposedRoleName: 'component',
      kind: 'directory',
      parentId: null,
      path: 'src/_components/button',
    };
    const itemB: TTestItemDefinition = {
      fragmentInternalRank: 16,
      id: 1,
      imposedRoleName: 'component',
      kind: 'file',
      nodeKind: 'master-node',
      parentId: 0,
      path: 'src/_components/button/button.component.tsx',
      role: explicitRole('component'),
    };
    const itemC: TTestItemDefinition = {
      fragmentInternalRank: 16,
      id: 2,
      imposedRoleName: 'component',
      kind: 'file',
      nodeKind: 'fragment-node',
      parentId: 0,
      path: 'src/_components/button/button.context.ts',
      role: explicitRole('context'),
    };
    const itemD: TTestItemDefinition = {
      domainKind: 'fragment',
      id: 3,
      imposedRoleName: 'util',
      kind: 'directory',
      parentId: null,
      path: 'src/_utils/normalize',
    };
    const itemE: TTestItemDefinition = {
      fragmentInternalRank: 17,
      id: 4,
      imposedRoleName: 'util',
      kind: 'file',
      nodeKind: 'access-node',
      parentId: 3,
      path: 'src/_utils/normalize/index.ts',
    };
    const itemF: TTestItemDefinition = {
      id: 5,
      imposedRoleName: 'util',
      kind: 'file',
      nodeKind: 'unauthorized-logical-node',
      parentId: 3,
      path: 'src/_utils/normalize/utility.ts',
    };

    const forward = buildModel([itemA, itemB, itemC, itemD, itemE, itemF]);
    const reversed = buildModel([itemF, itemE, itemD, itemC, itemB, itemA]);
    const shuffled = buildModel([itemD, itemA, itemF, itemB, itemE, itemC]);

    const forwardOutcomes = verifyFragmentAnatomy(forward);
    const reversedOutcomes = verifyFragmentAnatomy(reversed);
    const shuffledOutcomes = verifyFragmentAnatomy(shuffled);

    expect(forwardOutcomes).toEqual(reversedOutcomes);
    expect(forwardOutcomes).toEqual(shuffledOutcomes);
    expect(forwardOutcomes.map((outcome) => outcome.constraint)).toEqual([
      'classification/fragment-node-anatomy',
      'classification/fragment-node-rank',
      'classification/missing-access-node',
      'classification/missing-master-node',
    ]);
  });

  it('does not mutate the verification model', () => {
    const model = buildModel([
      {
        domainKind: 'fragment',
        id: 0,
        imposedRoleName: 'component',
        kind: 'directory',
        parentId: null,
        path: 'src/_components/button',
      },
      {
        fragmentInternalRank: 16,
        id: 1,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'master-node',
        parentId: 0,
        path: 'src/_components/button/button.component.tsx',
        role: explicitRole('component'),
      },
      {
        fragmentInternalRank: 17,
        id: 2,
        imposedRoleName: 'component',
        kind: 'file',
        nodeKind: 'access-node',
        parentId: 0,
        path: 'src/_components/button/index.ts',
      },
    ]);

    Object.freeze(model);
    Object.freeze(model.basis);
    Object.freeze(model.basis.inventory);
    Object.freeze(model.basis.inventory.items);
    Object.freeze(model.basis.declarations);
    Object.freeze(model.basis.declarations.trees);
    Object.freeze(model.taxonomy);
    Object.freeze(model.taxonomy.classifications);

    const outcomes = verifyFragmentAnatomy(model);
    expect(outcomes).toEqual([]);
  });

  it('sorts outcomes primarily by constraint and secondarily by element', () => {
    const model = buildModel([
      {
        domainKind: 'fragment',
        id: 0,
        imposedRoleName: 'component',
        kind: 'directory',
        parentId: null,
        path: 'src/_components/zebra',
      },
      {
        domainKind: 'fragment',
        id: 1,
        imposedRoleName: 'component',
        kind: 'directory',
        parentId: null,
        path: 'src/_components/alpha',
      },
    ]);

    const outcomes = verifyFragmentAnatomy(model);
    expect(
      outcomes.map((outcome) => [outcome.constraint, outcome.element])
    ).toEqual([
      ['classification/missing-access-node', 'src/_components/alpha'],
      ['classification/missing-access-node', 'src/_components/zebra'],
      ['classification/missing-master-node', 'src/_components/alpha'],
      ['classification/missing-master-node', 'src/_components/zebra'],
    ]);
  });
});
