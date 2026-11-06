import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TTaxonomyModel,
} from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEffectiveTree } from '../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type { TInventoryItem } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TVerificationModel } from '../../../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { verificationModel } from '../../../../_verify-project@shared/_mocks/verification-model.mock.js';
import { collectFragmentItems } from './index.js';

const emptyQualifications = {
  isParentCategory: false,
  isPathFragment: false,
  isPrivateCategory: false,
  isSubFragment: false,
  isSubLayer: false,
  parentFragmentPath: null,
};

const absentRole = {
  kind: 'absent' as const,
  roleName: null,
};

const mockItem = (
  id: number,
  parentId: null | number,
  kind: 'directory' | 'file',
  path: string
): TInventoryItem => ({
  depth: parentId === null ? 0 : 1,
  id,
  isSymlink: false,
  kind,
  parentId,
  path,
  preorderEnd: 0,
  preorderStart: 0,
  realPath: `/project/${path}`,
  treeOrigin: 'src',
});

const mockClassification = (
  itemId: number,
  path: string,
  entryKind: 'directory' | 'file',
  domainKind: 'category' | 'fragment' | 'root-fragment' | null,
  imposedRoleName: null | string
): TItemClassification => ({
  domainKind,
  entryKind,
  fragmentInternalRank: null,
  imposedRoleName,
  itemId,
  nodeKind: null,
  path,
  relationalQualifications: emptyQualifications,
  role: absentRole,
});

const mockTree = (originPath: string): TEffectiveTree => ({
  catalog: {
    categoryToRole: new Map(),
    extensionToRole: new Map(),
    roles: [
      {
        allowMultipleSymbols: false,
        category: '_components',
        form: 'fragments',
        implicitExtensions: [],
        name: 'component',
        rank: 16,
      },
    ],
    subGraphRoles: [],
    topRank: 17,
  },
  externalDependencyPairs: [],
  foreignDomains: [],
  foreignNodes: { families: [], individualPaths: [] },
  horizontalHierarchies: [],
  localHorizontalHierarchies: [],
  mimeticPathStructures: [],
  originKind: 'root-layer',
  originPath,
  publicRootNodes: [],
  rootFragments: [],
  treeDependencyPairs: [],
});

describe('collectFragmentItems', () => {
  it('collects and groups logical children for each fragment', () => {
    const items: readonly TInventoryItem[] = [
      mockItem(0, null, 'directory', 'src'),
      mockItem(1, 0, 'directory', 'src/_components/icon'),
      mockItem(2, 0, 'directory', 'src/_components/button'),
      mockItem(3, 2, 'file', 'src/_components/button/button.component.tsx'),
      mockItem(4, 2, 'file', 'src/_components/button/index.ts'),
      mockItem(5, 0, 'directory', 'src/_types/size'),
      mockItem(6, 0, 'directory', 'src/unknown'),
      mockItem(7, 2, 'file', 'src/_components/button/button.hook.ts'),
      mockItem(8, 2, 'file', 'src/_components/button/README.md'),
    ];

    const classifications: readonly TItemClassification[] = [
      mockClassification(0, 'src', 'directory', 'root-fragment', null),
      mockClassification(
        1,
        'src/_components/icon',
        'directory',
        'fragment',
        'component'
      ),
      mockClassification(
        2,
        'src/_components/button',
        'directory',
        'fragment',
        'component'
      ),
      mockClassification(
        3,
        'src/_components/button/button.component.tsx',
        'file',
        null,
        null
      ),
      mockClassification(
        4,
        'src/_components/button/index.ts',
        'file',
        null,
        null
      ),
      mockClassification(5, 'src/_types/size', 'directory', 'category', 'type'),
      mockClassification(6, 'src/unknown', 'directory', 'fragment', null),
      mockClassification(
        7,
        'src/_components/button/button.hook.ts',
        'file',
        null,
        null
      ),
      mockClassification(
        8,
        'src/_components/button/README.md',
        'file',
        null,
        null
      ),
    ];

    const classificationsWithNodes: TItemClassification[] = classifications.map(
      (item) => {
        if (item.itemId === 3) {
          return { ...item, nodeKind: 'master-node' };
        }
        if (item.itemId === 4) {
          return { ...item, nodeKind: 'access-node' };
        }
        if (item.itemId === 7) {
          return { ...item, nodeKind: 'fragment-node' };
        }
        if (item.itemId === 8) {
          return { ...item, nodeKind: 'foreign-node' };
        }
        return item;
      }
    );

    const taxonomy: TTaxonomyModel = {
      byItemId: new Map(
        classificationsWithNodes.map((item) => [item.itemId, item])
      ),
      byPath: new Map(
        classificationsWithNodes.map((item) => [item.path, item])
      ),
      classifications: classificationsWithNodes,
    };

    const base = verificationModel();
    const model: TVerificationModel = {
      ...base,
      basis: {
        ...base.basis,
        declarations: {
          ...base.basis.declarations,
          trees: [mockTree('src')],
        },
        inventory: {
          items,
          pathToId: new Map(items.map((item) => [item.path, item.id])),
          realPathToId: new Map(items.map((item) => [item.realPath, item.id])),
        },
      },
      taxonomy,
    };

    const result = collectFragmentItems(model);

    expect(result.map((item) => item.fragmentClassification.path)).toEqual([
      'src/_components/icon',
      'src/_components/button',
    ]);

    const iconInspection = result[0];
    expect(iconInspection?.masterRank).toBe(16);
    expect(iconInspection?.logicalChildren).toEqual([]);

    const buttonInspection = result[1];
    expect(buttonInspection?.masterRank).toBe(16);
    expect(
      buttonInspection?.logicalChildren.map((child) => child.path)
    ).toEqual([
      'src/_components/button/button.component.tsx',
      'src/_components/button/button.hook.ts',
      'src/_components/button/index.ts',
    ]);
  });
});
