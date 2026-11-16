import { describe, expect, it } from 'vitest';

import type {
  TEffectiveTree,
  TInventory,
  TVerificationModel,
} from '../../../../../../_conformity@shared/_types/verification-model.type.js';

import { verificationModel } from '../../../../../_norms@shared/_mocks/verification-model.mock.js';
import { buildQuotientGraph } from './build-quotient-graph.util.js';

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
  horizontalHierarchyModels: [],
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
    expect(graph.adjacency).toEqual([]);
    expect(graph.originToIndex).toEqual(new Map());
    expect(graph.transitions).toEqual([]);
    expect(graph.treeCount).toBe(0);
    expect(graph.treeOrigins).toEqual([]);
  });

  it('indexes trees in ordinal order, builds transition matrix, and derives adjacency without self-loops', () => {
    const base = verificationModel();
    const inventoryItems = [
      {
        depth: 1,
        id: 0,
        isSymlink: false,
        kind: 'file' as const,
        parentId: null,
        path: 'a/one.ts',
        preorderEnd: 0,
        preorderStart: 0,
        realPath: '/workspace/a/one.ts',
        treeOrigin: 'a',
      },
      {
        depth: 1,
        id: 1,
        isSymlink: false,
        kind: 'file' as const,
        parentId: null,
        path: 'a/two.ts',
        preorderEnd: 1,
        preorderStart: 1,
        realPath: '/workspace/a/two.ts',
        treeOrigin: 'a',
      },
      {
        depth: 1,
        id: 2,
        isSymlink: false,
        kind: 'file' as const,
        parentId: null,
        path: 'b/one.ts',
        preorderEnd: 2,
        preorderStart: 2,
        realPath: '/workspace/b/one.ts',
        treeOrigin: 'b',
      },
      {
        depth: 1,
        id: 3,
        isSymlink: false,
        kind: 'file' as const,
        parentId: null,
        path: 'c/one.ts',
        preorderEnd: 3,
        preorderStart: 3,
        realPath: '/workspace/c/one.ts',
        treeOrigin: 'c',
      },
      {
        depth: 1,
        id: 4,
        isSymlink: false,
        kind: 'file' as const,
        parentId: null,
        path: 'ext.ts',
        preorderEnd: 4,
        preorderStart: 4,
        realPath: '/workspace/ext.ts',
        treeOrigin: null,
      },
      {
        depth: 1,
        id: 5,
        isSymlink: false,
        kind: 'file' as const,
        parentId: null,
        path: 'unknown/f.ts',
        preorderEnd: 5,
        preorderStart: 5,
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
          trees: [
            createTreeDeclaration('c'),
            createTreeDeclaration('a'),
            createTreeDeclaration('b'),
          ],
        },
        inventory,
      },
      crossings: [
        {
          chain: ['b/one.ts', 'ext.ts', 'c/one.ts'],
          destinationPath: 'c/one.ts',
          importIndex: 0,
          position: { column: 2, line: 3 },
          sourcePath: 'b/one.ts',
          specifier: '../ext.js',
        },
      ],
      graph: {
        ...base.graph,
        edgeMetadata: [
          {
            aliasAlternatives: [],
            aliasUsed: null,
            destinationPath: 'b/one.ts',
            importIndex: 0,
            isTypeOnly: false,
            position: { column: 1, line: 1 },
            sourcePath: 'a/one.ts',
            specifier: '../b/one.js',
            syntaxKind: 'side-effect-import',
          },
          {
            aliasAlternatives: [],
            aliasUsed: null,
            destinationPath: 'a/two.ts',
            importIndex: 1,
            isTypeOnly: false,
            position: { column: 1, line: 2 },
            sourcePath: 'a/one.ts',
            specifier: './two.js',
            syntaxKind: 'side-effect-import',
          },
          {
            aliasAlternatives: [],
            aliasUsed: null,
            destinationPath: 'c/one.ts',
            importIndex: 0,
            isTypeOnly: false,
            position: { column: 1, line: 1 },
            sourcePath: 'ext.ts',
            specifier: './c/one.js',
            syntaxKind: 'side-effect-import',
          },
          {
            aliasAlternatives: [],
            aliasUsed: null,
            destinationPath: 'c/one.ts',
            importIndex: 0,
            isTypeOnly: false,
            position: { column: 1, line: 1 },
            sourcePath: 'unknown/f.ts',
            specifier: '../c/one.js',
            syntaxKind: 'side-effect-import',
          },
        ],
      },
    };

    const graph = buildQuotientGraph(model);
    expect(graph.treeCount).toBe(3);
    expect(graph.treeOrigins).toEqual(['a', 'b', 'c']);
    expect(graph.originToIndex).toEqual(
      new Map([
        ['a', 0],
        ['b', 1],
        ['c', 2],
      ])
    );
    expect(graph.transitions).toEqual([
      [
        null,
        { position: { column: 1, line: 1 }, segment: ['a/one.ts', 'b/one.ts'] },
        null,
      ],
      [
        null,
        null,
        {
          position: { column: 2, line: 3 },
          segment: ['b/one.ts', 'ext.ts', 'c/one.ts'],
        },
      ],
      [null, null, null],
    ]);
    expect(graph.adjacency).toEqual([[1], [2], []]);
  });

  it('collects multiple outgoing neighbors per tree in sorted index order including mutual edges', () => {
    const base = verificationModel();
    const inventoryItems = [
      {
        depth: 1,
        id: 0,
        isSymlink: false,
        kind: 'file' as const,
        parentId: null,
        path: 'a/one.ts',
        preorderEnd: 0,
        preorderStart: 0,
        realPath: '/workspace/a/one.ts',
        treeOrigin: 'a',
      },
      {
        depth: 1,
        id: 1,
        isSymlink: false,
        kind: 'file' as const,
        parentId: null,
        path: 'b/one.ts',
        preorderEnd: 1,
        preorderStart: 1,
        realPath: '/workspace/b/one.ts',
        treeOrigin: 'b',
      },
      {
        depth: 1,
        id: 2,
        isSymlink: false,
        kind: 'file' as const,
        parentId: null,
        path: 'c/one.ts',
        preorderEnd: 2,
        preorderStart: 2,
        realPath: '/workspace/c/one.ts',
        treeOrigin: 'c',
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
          trees: [
            createTreeDeclaration('b'),
            createTreeDeclaration('c'),
            createTreeDeclaration('a'),
          ],
        },
        inventory,
      },
      graph: {
        ...base.graph,
        edgeMetadata: [
          {
            aliasAlternatives: [],
            aliasUsed: null,
            destinationPath: 'c/one.ts',
            importIndex: 0,
            isTypeOnly: false,
            position: { column: 1, line: 1 },
            sourcePath: 'a/one.ts',
            specifier: '../c/one.js',
            syntaxKind: 'side-effect-import',
          },
          {
            aliasAlternatives: [],
            aliasUsed: null,
            destinationPath: 'b/one.ts',
            importIndex: 1,
            isTypeOnly: false,
            position: { column: 1, line: 2 },
            sourcePath: 'a/one.ts',
            specifier: '../b/one.js',
            syntaxKind: 'side-effect-import',
          },
          {
            aliasAlternatives: [],
            aliasUsed: null,
            destinationPath: 'a/one.ts',
            importIndex: 0,
            isTypeOnly: false,
            position: { column: 1, line: 1 },
            sourcePath: 'b/one.ts',
            specifier: '../a/one.js',
            syntaxKind: 'side-effect-import',
          },
        ],
      },
    };

    const graph = buildQuotientGraph(model);
    expect(graph.treeCount).toBe(3);
    expect(graph.treeOrigins).toEqual(['a', 'b', 'c']);
    expect(graph.adjacency).toEqual([[1, 2], [0], []]);
  });

  it('selects lexicographically minimal transition segment across parallel direct and external edges', () => {
    const base = verificationModel();
    const inventoryItems = [
      {
        depth: 1,
        id: 0,
        isSymlink: false,
        kind: 'file' as const,
        parentId: null,
        path: 'a/alpha.ts',
        preorderEnd: 0,
        preorderStart: 0,
        realPath: '/workspace/a/alpha.ts',
        treeOrigin: 'a',
      },
      {
        depth: 1,
        id: 1,
        isSymlink: false,
        kind: 'file' as const,
        parentId: null,
        path: 'a/zeta.ts',
        preorderEnd: 1,
        preorderStart: 1,
        realPath: '/workspace/a/zeta.ts',
        treeOrigin: 'a',
      },
      {
        depth: 1,
        id: 2,
        isSymlink: false,
        kind: 'file' as const,
        parentId: null,
        path: 'b/alpha.ts',
        preorderEnd: 2,
        preorderStart: 2,
        realPath: '/workspace/b/alpha.ts',
        treeOrigin: 'b',
      },
      {
        depth: 1,
        id: 3,
        isSymlink: false,
        kind: 'file' as const,
        parentId: null,
        path: 'b/zeta.ts',
        preorderEnd: 3,
        preorderStart: 3,
        realPath: '/workspace/b/zeta.ts',
        treeOrigin: 'b',
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
          trees: [createTreeDeclaration('a'), createTreeDeclaration('b')],
        },
        inventory,
      },
      crossings: [
        {
          chain: ['a/alpha.ts', 'ext-z.ts', 'b/alpha.ts'],
          destinationPath: 'b/alpha.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'a/alpha.ts',
          specifier: '../ext-z.js',
        },
        {
          chain: ['a/alpha.ts', 'ext-a.ts', 'b/alpha.ts'],
          destinationPath: 'b/alpha.ts',
          importIndex: 1,
          position: { column: 1, line: 2 },
          sourcePath: 'a/alpha.ts',
          specifier: '../ext-a.js',
        },
        {
          chain: ['a/alpha.ts', 'ext-a.ts', 'b/alpha.ts'],
          destinationPath: 'b/alpha.ts',
          importIndex: 2,
          position: { column: 1, line: 3 },
          sourcePath: 'a/alpha.ts',
          specifier: '../ext-a-dup.js',
        },
        {
          chain: ['a/alpha.ts', 'ext-a.ts', 'ext-b.ts', 'b/alpha.ts'],
          destinationPath: 'b/alpha.ts',
          importIndex: 3,
          position: { column: 1, line: 4 },
          sourcePath: 'a/alpha.ts',
          specifier: '../ext-ab.js',
        },
      ],
      graph: {
        ...base.graph,
        edgeMetadata: [
          {
            aliasAlternatives: [],
            aliasUsed: null,
            destinationPath: 'b/alpha.ts',
            importIndex: 0,
            isTypeOnly: false,
            position: { column: 1, line: 1 },
            sourcePath: 'a/zeta.ts',
            specifier: '../b/alpha.js',
            syntaxKind: 'side-effect-import',
          },
          {
            aliasAlternatives: [],
            aliasUsed: null,
            destinationPath: 'b/zeta.ts',
            importIndex: 1,
            isTypeOnly: false,
            position: { column: 1, line: 2 },
            sourcePath: 'a/alpha.ts',
            specifier: '../b/zeta.js',
            syntaxKind: 'side-effect-import',
          },
          {
            aliasAlternatives: [],
            aliasUsed: null,
            destinationPath: 'b/alpha.ts',
            importIndex: 2,
            isTypeOnly: false,
            position: { column: 1, line: 3 },
            sourcePath: 'a/alpha.ts',
            specifier: '../b/alpha.js',
            syntaxKind: 'side-effect-import',
          },
        ],
      },
    };

    const graph = buildQuotientGraph(model);
    expect(graph.transitions[0]?.[1]?.segment).toEqual([
      'a/alpha.ts',
      'b/alpha.ts',
    ]);
  });

  it('compares crossing-only parallel transitions across source, destination, element, length, and equal ties', () => {
    const base = verificationModel();
    const inventoryItems = [
      {
        depth: 1,
        id: 0,
        isSymlink: false,
        kind: 'file' as const,
        parentId: null,
        path: 'a/alpha.ts',
        preorderEnd: 0,
        preorderStart: 0,
        realPath: '/workspace/a/alpha.ts',
        treeOrigin: 'a',
      },
      {
        depth: 1,
        id: 1,
        isSymlink: false,
        kind: 'file' as const,
        parentId: null,
        path: 'a/zeta.ts',
        preorderEnd: 1,
        preorderStart: 1,
        realPath: '/workspace/a/zeta.ts',
        treeOrigin: 'a',
      },
      {
        depth: 1,
        id: 2,
        isSymlink: false,
        kind: 'file' as const,
        parentId: null,
        path: 'b/alpha.ts',
        preorderEnd: 2,
        preorderStart: 2,
        realPath: '/workspace/b/alpha.ts',
        treeOrigin: 'b',
      },
      {
        depth: 1,
        id: 3,
        isSymlink: false,
        kind: 'file' as const,
        parentId: null,
        path: 'b/zeta.ts',
        preorderEnd: 3,
        preorderStart: 3,
        realPath: '/workspace/b/zeta.ts',
        treeOrigin: 'b',
      },
      {
        depth: 1,
        id: 4,
        isSymlink: false,
        kind: 'file' as const,
        parentId: null,
        path: 'c/alpha.ts',
        preorderEnd: 4,
        preorderStart: 4,
        realPath: '/workspace/c/alpha.ts',
        treeOrigin: 'c',
      },
      {
        depth: 1,
        id: 5,
        isSymlink: false,
        kind: 'file' as const,
        parentId: null,
        path: 'c/zeta.ts',
        preorderEnd: 5,
        preorderStart: 5,
        realPath: '/workspace/c/zeta.ts',
        treeOrigin: 'c',
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
          trees: [
            createTreeDeclaration('a'),
            createTreeDeclaration('b'),
            createTreeDeclaration('c'),
          ],
        },
        inventory,
      },
      crossings: [
        {
          chain: ['a/zeta.ts', 'ext-a.ts', 'b/alpha.ts'],
          destinationPath: 'b/alpha.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'a/zeta.ts',
          specifier: '../ext-a.js',
        },
        {
          chain: ['a/alpha.ts', 'ext-z.ts', 'b/zeta.ts'],
          destinationPath: 'b/zeta.ts',
          importIndex: 1,
          position: { column: 1, line: 2 },
          sourcePath: 'a/alpha.ts',
          specifier: '../ext-z.js',
        },
        {
          chain: ['a/alpha.ts', 'ext-a.ts', 'c/zeta.ts'],
          destinationPath: 'c/zeta.ts',
          importIndex: 0,
          position: { column: 1, line: 3 },
          sourcePath: 'a/alpha.ts',
          specifier: '../ext-a.js',
        },
        {
          chain: ['a/alpha.ts', 'ext-z.ts', 'c/alpha.ts'],
          destinationPath: 'c/alpha.ts',
          importIndex: 1,
          position: { column: 1, line: 4 },
          sourcePath: 'a/alpha.ts',
          specifier: '../ext-z.js',
        },
        {
          chain: ['b/alpha.ts', 'ext-z.ts', 'c/alpha.ts'],
          destinationPath: 'c/alpha.ts',
          importIndex: 0,
          position: { column: 1, line: 5 },
          sourcePath: 'b/alpha.ts',
          specifier: '../ext-z.js',
        },
        {
          chain: ['b/alpha.ts', 'ext-a.ts', 'c/alpha.ts'],
          destinationPath: 'c/alpha.ts',
          importIndex: 1,
          position: { column: 1, line: 6 },
          sourcePath: 'b/alpha.ts',
          specifier: '../ext-a.js',
        },
        {
          chain: ['b/alpha.ts', 'ext-a.ts', 'ext-b.ts', 'c/alpha.ts'],
          destinationPath: 'c/alpha.ts',
          importIndex: 2,
          position: { column: 1, line: 7 },
          sourcePath: 'b/alpha.ts',
          specifier: '../ext-ab.js',
        },
        {
          chain: ['b/alpha.ts', 'ext-a.ts', 'c/alpha.ts'],
          destinationPath: 'c/alpha.ts',
          importIndex: 3,
          position: { column: 1, line: 99 },
          sourcePath: 'b/alpha.ts',
          specifier: '../ext-a-dup.js',
        },
        {
          chain: ['c/alpha.ts', 'ext-a.ts', 'a/alpha.ts'],
          destinationPath: 'a/alpha.ts',
          importIndex: 0,
          position: { column: 1, line: 8 },
          sourcePath: 'c/alpha.ts',
          specifier: '../ext-a.js',
        },
        {
          chain: ['c/alpha.ts', 'ext-a.ts', 'ext-b.ts', 'a/alpha.ts'],
          destinationPath: 'a/alpha.ts',
          importIndex: 1,
          position: { column: 1, line: 9 },
          sourcePath: 'c/alpha.ts',
          specifier: '../ext-ab.js',
        },
      ],
    };

    const graph = buildQuotientGraph(model);
    expect(graph.transitions[0]?.[1]).toEqual({
      position: { column: 1, line: 2 },
      segment: ['a/alpha.ts', 'ext-z.ts', 'b/zeta.ts'],
    });
    expect(graph.transitions[0]?.[2]).toEqual({
      position: { column: 1, line: 4 },
      segment: ['a/alpha.ts', 'ext-z.ts', 'c/alpha.ts'],
    });
    expect(graph.transitions[1]?.[2]).toEqual({
      position: { column: 1, line: 6 },
      segment: ['b/alpha.ts', 'ext-a.ts', 'c/alpha.ts'],
    });
    expect(graph.transitions[2]?.[0]).toEqual({
      position: { column: 1, line: 8 },
      segment: ['c/alpha.ts', 'ext-a.ts', 'a/alpha.ts'],
    });
  });

  it('overwrites existing transition when a later edge has a smaller segment and ignores unknown crossing endpoints', () => {
    const base = verificationModel();
    const inventoryItems = [
      {
        depth: 1,
        id: 0,
        isSymlink: false,
        kind: 'file' as const,
        parentId: null,
        path: 'a/1.ts',
        preorderEnd: 0,
        preorderStart: 0,
        realPath: '/workspace/a/1.ts',
        treeOrigin: 'a',
      },
      {
        depth: 1,
        id: 1,
        isSymlink: false,
        kind: 'file' as const,
        parentId: null,
        path: 'b/1.ts',
        preorderEnd: 1,
        preorderStart: 1,
        realPath: '/workspace/b/1.ts',
        treeOrigin: 'b',
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
          trees: [createTreeDeclaration('a'), createTreeDeclaration('b')],
        },
        inventory,
      },
      crossings: [
        {
          chain: ['a/1.ts', 'ext.ts', 'b/1.ts'],
          destinationPath: 'b/1.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'a/1.ts',
          specifier: '../ext.js',
        },
        {
          chain: ['a/1.ts', 'ext.ts', 'a/1.ts'],
          destinationPath: 'a/1.ts',
          importIndex: 1,
          position: { column: 1, line: 2 },
          sourcePath: 'a/1.ts',
          specifier: '../ext.js',
        },
        {
          chain: ['missing.ts', 'ext.ts', 'b/1.ts'],
          destinationPath: 'b/1.ts',
          importIndex: 2,
          position: { column: 1, line: 3 },
          sourcePath: 'missing.ts',
          specifier: '../ext.js',
        },
        {
          chain: ['a/1.ts', 'ext.ts', 'missing.ts'],
          destinationPath: 'missing.ts',
          importIndex: 3,
          position: { column: 1, line: 3 },
          sourcePath: 'a/1.ts',
          specifier: '../ext-dest.js',
        },
      ],
      graph: {
        ...base.graph,
        edgeMetadata: [
          {
            aliasAlternatives: [],
            aliasUsed: null,
            destinationPath: 'b/1.ts',
            importIndex: 0,
            isTypeOnly: false,
            position: { column: 1, line: 4 },
            sourcePath: 'a/1.ts',
            specifier: '../b/1.js',
            syntaxKind: 'side-effect-import',
          },
          {
            aliasAlternatives: [],
            aliasUsed: null,
            destinationPath: 'missing.ts',
            importIndex: 1,
            isTypeOnly: false,
            position: { column: 1, line: 5 },
            sourcePath: 'a/1.ts',
            specifier: '../missing.js',
            syntaxKind: 'side-effect-import',
          },
        ],
      },
    };

    const graph = buildQuotientGraph(model);
    expect(graph.transitions[0]?.[1]).toEqual({
      position: { column: 1, line: 4 },
      segment: ['a/1.ts', 'b/1.ts'],
    });
    expect(graph.adjacency).toEqual([[1], []]);
  });
});
