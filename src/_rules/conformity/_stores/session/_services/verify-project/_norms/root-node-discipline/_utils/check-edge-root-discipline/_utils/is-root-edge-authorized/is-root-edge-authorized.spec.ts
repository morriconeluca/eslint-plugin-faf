import { describe, expect, it } from 'vitest';

import type { TEdgeMetadata } from '../../../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type {
  TEffectiveRootFragment,
  TEffectiveTree,
} from '../../../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type { TInventoryItem } from '../../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TVerificationModel } from '../../../../../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { verificationModel } from '../../../../../../_verify-project@shared/_mocks/verification-model.mock.js';
import { isRootEdgeAuthorized } from './index.js';

const makeEdge = (
  sourcePath: string,
  destinationPath: string,
  overrides: Partial<TEdgeMetadata> = {}
): TEdgeMetadata => ({
  aliasAlternatives: [],
  aliasUsed: null,
  destinationPath,
  importIndex: 0,
  isTypeOnly: false,
  position: { column: 1, line: 1 },
  sourcePath,
  specifier: './target.js',
  syntaxKind: 'side-effect-import',
  ...overrides,
});

const makeItem = (
  id: number,
  path: string,
  parentId: null | number = 0,
  treeOrigin: null | string = 'src'
): TInventoryItem => ({
  depth: 1,
  id,
  isSymlink: false,
  kind: 'file',
  parentId,
  path,
  preorderEnd: id,
  preorderStart: id,
  realPath: path,
  treeOrigin,
});

const makeDirectoryItem = (id: number, path: string): TInventoryItem => ({
  depth: 0,
  id,
  isSymlink: false,
  kind: 'directory',
  parentId: null,
  path,
  preorderEnd: id,
  preorderStart: id,
  realPath: path,
  treeOrigin: 'src',
});

const buildAuthorizationModel = (options: {
  readonly extraItems?: readonly TInventoryItem[];
  readonly rootFragments?: readonly TEffectiveRootFragment[];
  readonly treeOrigin?: string;
}): TVerificationModel => {
  const base = verificationModel();
  const originPath = options.treeOrigin ?? 'src';
  const tree: TEffectiveTree = {
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
    rootFragments: options.rootFragments ?? [],
    treeDependencyPairs: [],
  };

  const allItems: TInventoryItem[] = [
    makeDirectoryItem(0, 'src'),
    ...(options.extraItems ?? []),
  ];
  const items: TInventoryItem[] = [];
  for (const item of allItems) {
    items[item.id] = item;
  }

  return {
    ...base,
    basis: {
      ...base.basis,
      declarations: {
        ...base.basis.declarations,
        trees: [tree],
      },
      inventory: {
        items,
        pathToId: new Map(allItems.map((item) => [item.path, item.id])),
        realPathToId: new Map(allItems.map((item) => [item.path, item.id])),
      },
    },
    hierarchies: {
      conflicts: [],
      sets: [
        {
          id: 0,
          isOrderable: true,
          origin: 'root-nodes',
          parentPath: 'src',
          repetitions: [],
          siblings: [
            { itemId: 1, rank: 1 },
            { itemId: 2, rank: 0 },
          ],
        },
      ],
    },
  };
};

describe('isRootEdgeAuthorized', () => {
  it('returns false when edge used a path alias', () => {
    const source = makeItem(1, 'src/high.ts', 0);
    const destination = makeItem(2, 'src/low.ts', 0);
    const edge = makeEdge('src/high.ts', 'src/low.ts', { aliasUsed: '#base' });
    const model = buildAuthorizationModel({});

    expect(isRootEdgeAuthorized(source, destination, edge, model)).toBe(false);
  });

  it('returns false when source parentId is null', () => {
    const source = makeItem(1, 'src/high.ts', null);
    const destination = makeItem(2, 'src/low.ts', 0);
    const model = buildAuthorizationModel({});

    expect(
      isRootEdgeAuthorized(
        source,
        destination,
        makeEdge('src/high.ts', 'src/low.ts'),
        model
      )
    ).toBe(false);
  });

  it('returns false when source parentItem is missing from inventory', () => {
    const source = makeItem(1, 'src/high.ts', 99);
    const destination = makeItem(2, 'src/low.ts', 0);
    const model = buildAuthorizationModel({});

    expect(
      isRootEdgeAuthorized(
        source,
        destination,
        makeEdge('src/high.ts', 'src/low.ts'),
        model
      )
    ).toBe(false);
  });

  it('returns false when destination parentId is null even if pair is authorized', () => {
    const source = makeItem(1, 'src/a/main.ts', 3);
    const destination = makeItem(2, 'src/b/main.ts', null);
    const model = buildAuthorizationModel({
      extraItems: [
        makeDirectoryItem(3, 'src/a'),
        makeDirectoryItem(4, 'src/b'),
      ],
      rootFragments: [
        {
          dependencyPairs: [{ from: 'src/a/main.ts', to: 'src/b/main.ts' }],
          path: 'src/a',
          rootNodes: [{ name: 'main.ts', rank: 0 }],
          subRootFragments: [],
        },
      ],
    });

    expect(
      isRootEdgeAuthorized(
        source,
        destination,
        makeEdge('src/a/main.ts', 'src/b/main.ts'),
        model
      )
    ).toBe(false);
  });

  describe('same root fragment', () => {
    it('returns true when strictly descending in hierarchy', () => {
      const source = makeItem(1, 'src/high.ts', 0);
      const destination = makeItem(2, 'src/low.ts', 0);
      const model = buildAuthorizationModel({});

      expect(
        isRootEdgeAuthorized(
          source,
          destination,
          makeEdge('src/high.ts', 'src/low.ts'),
          model
        )
      ).toBe(true);
    });

    it('returns false when not descending in hierarchy', () => {
      const source = makeItem(2, 'src/low.ts', 0);
      const destination = makeItem(1, 'src/high.ts', 0);
      const model = buildAuthorizationModel({});

      expect(
        isRootEdgeAuthorized(
          source,
          destination,
          makeEdge('src/low.ts', 'src/high.ts'),
          model
        )
      ).toBe(false);
    });
  });

  describe('distinct root fragments', () => {
    it('handles null source treeOrigin falling back to empty string', () => {
      const source = makeItem(1, 'src/a/main.ts', 3, null);
      const destination = makeItem(2, 'src/b/main.ts', 4, 'src');
      const model = buildAuthorizationModel({
        extraItems: [
          makeDirectoryItem(3, 'src/a'),
          makeDirectoryItem(4, 'src/b'),
        ],
        rootFragments: [
          {
            dependencyPairs: [{ from: 'src/a/main.ts', to: 'src/b/main.ts' }],
            path: 'src/a',
            rootNodes: [{ name: 'main.ts', rank: 0 }],
            subRootFragments: [],
          },
        ],
        treeOrigin: '',
      });

      expect(
        isRootEdgeAuthorized(
          source,
          destination,
          makeEdge('src/a/main.ts', 'src/b/main.ts'),
          model
        )
      ).toBe(true);
    });

    it('returns true when pair is authorized in declarations', () => {
      const source = makeItem(1, 'src/a/main.ts', 3);
      const destination = makeItem(2, 'src/b/main.ts', 4);
      const model = buildAuthorizationModel({
        extraItems: [
          makeDirectoryItem(3, 'src/a'),
          makeDirectoryItem(4, 'src/b'),
        ],
        rootFragments: [
          {
            dependencyPairs: [{ from: 'src/a/main.ts', to: 'src/b/main.ts' }],
            path: 'src/a',
            rootNodes: [{ name: 'main.ts', rank: 0 }],
            subRootFragments: [],
          },
        ],
      });

      expect(
        isRootEdgeAuthorized(
          source,
          destination,
          makeEdge('src/a/main.ts', 'src/b/main.ts'),
          model
        )
      ).toBe(true);
    });

    it('returns false when pair is not authorized in declarations', () => {
      const source = makeItem(1, 'src/a/main.ts', 3);
      const destination = makeItem(2, 'src/b/main.ts', 4);
      const model = buildAuthorizationModel({
        extraItems: [
          makeDirectoryItem(3, 'src/a'),
          makeDirectoryItem(4, 'src/b'),
        ],
        rootFragments: [],
      });

      expect(
        isRootEdgeAuthorized(
          source,
          destination,
          makeEdge('src/a/main.ts', 'src/b/main.ts'),
          model
        )
      ).toBe(false);
    });
  });
});
