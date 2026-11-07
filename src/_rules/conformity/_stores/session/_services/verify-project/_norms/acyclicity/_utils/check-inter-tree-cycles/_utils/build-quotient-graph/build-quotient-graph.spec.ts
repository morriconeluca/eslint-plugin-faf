import { describe, expect, it } from 'vitest';

import type { TEffectiveTree } from '../../../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type { TInventory } from '../../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TVerificationModel } from '../../../../../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { verificationModel } from '../../../../../../_verify-project@shared/_mocks/verification-model.mock.js';
import { buildQuotientGraph } from './index.js';

const createTreeDeclaration = (originPath: string): TEffectiveTree => ({
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
  originKind: 'root-fragment',
  originPath,
  publicRootNodes: [],
  rootFragments: [],
  treeDependencyPairs: [],
});

describe('buildQuotientGraph', () => {
  it('builds an empty quotient graph for a model without trees', () => {
    const base = verificationModel();
    const graph = buildQuotientGraph(base);
    expect(graph.treeCount).toBe(0);
    expect(graph.treeOrigins).toEqual([]);
  });

  it('indexes multiple trees in sorted order and ignores non-tree items', () => {
    const base = verificationModel();
    const inventoryItems = [
      {
        depth: 1,
        id: 0,
        isSymlink: false,
        kind: 'file' as const,
        parentId: null,
        path: 'a/source.ts',
        preorderEnd: 0,
        preorderStart: 0,
        realPath: '/workspace/a/source.ts',
        treeOrigin: 'a',
      },
      {
        depth: 1,
        id: 1,
        isSymlink: false,
        kind: 'file' as const,
        parentId: null,
        path: 'ext.ts',
        preorderEnd: 1,
        preorderStart: 1,
        realPath: '/workspace/ext.ts',
        treeOrigin: null,
      },
      {
        depth: 1,
        id: 2,
        isSymlink: false,
        kind: 'file' as const,
        parentId: null,
        path: 'unknown/f.ts',
        preorderEnd: 2,
        preorderStart: 2,
        realPath: '/workspace/unknown/f.ts',
        treeOrigin: 'unknown',
      },
    ];
    const inventory: TInventory = {
      items: inventoryItems,
      pathToId: new Map(inventoryItems.map((item) => [item.path, item.id])),
      realPathToId: new Map(
        inventoryItems.map((item) => [item.realPath, item.id])
      ),
    };
    const model: TVerificationModel = {
      ...base,
      basis: {
        ...base.basis,
        declarations: {
          ...base.basis.declarations,
          trees: [createTreeDeclaration('b'), createTreeDeclaration('a')],
        },
        inventory,
      },
    };
    const graph = buildQuotientGraph(model);
    expect(graph.treeCount).toBe(2);
    expect(graph.treeOrigins).toEqual(['a', 'b']);
  });
});
