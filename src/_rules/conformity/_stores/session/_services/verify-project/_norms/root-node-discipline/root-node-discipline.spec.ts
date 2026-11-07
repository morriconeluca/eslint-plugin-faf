import { describe, expect, it } from 'vitest';

import type { TImportSyntaxKind } from '../../../../_session@shared/_types/module-record.type.js';
import type {
  TItemClassification,
  TNodeKind,
  TTaxonomyModel,
} from '../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEdgeMetadata } from '../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type {
  THorizontalHierarchies,
  THorizontalHierarchySet,
} from '../../_verify-project@shared/_types/_compounds/horizontal-hierarchies.type.js';
import type {
  TEffectiveRootFragment,
  TEffectiveTree,
} from '../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyRootNodeDiscipline } from './root-node-discipline.norm.js';

type TTestItem = {
  readonly id: number;
  readonly kind?: 'directory' | 'file';
  readonly nodeKind?: null | TNodeKind;
  readonly parentId?: null | number;
  readonly path: string;
  readonly treeOrigin?: null | string;
};

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

const buildInventoryFromItems = (items: readonly TTestItem[]): TInventory => {
  const inventoryItems: TInventoryItem[] = [];
  const pathToId = new Map<string, number>();

  for (const itemDefinition of items) {
    const isFile = itemDefinition.kind !== 'directory';
    const item: TInventoryItem = {
      depth: 1,
      id: itemDefinition.id,
      isSymlink: false,
      kind: isFile ? 'file' : 'directory',
      parentId:
        itemDefinition.parentId === undefined ? 0 : itemDefinition.parentId,
      path: itemDefinition.path,
      preorderEnd: itemDefinition.id,
      preorderStart: itemDefinition.id,
      realPath: itemDefinition.path,
      treeOrigin:
        itemDefinition.treeOrigin === undefined
          ? 'src'
          : itemDefinition.treeOrigin,
    };
    inventoryItems[itemDefinition.id] = item;
    pathToId.set(itemDefinition.path, itemDefinition.id);
  }

  return {
    items: inventoryItems,
    pathToId,
    realPathToId: pathToId,
  };
};

const buildTaxonomyFromItems = (
  items: readonly TTestItem[]
): TTaxonomyModel => {
  const byItemId = new Map<number, TItemClassification>();
  const byPath = new Map<string, TItemClassification>();
  const classifications: TItemClassification[] = [];

  for (const itemDefinition of items) {
    const isFile = itemDefinition.kind !== 'directory';
    const classification: TItemClassification = {
      domainKind: isFile ? null : 'root-fragment',
      entryKind: isFile ? 'file' : 'directory',
      fragmentInternalRank: null,
      imposedRoleName: null,
      itemId: itemDefinition.id,
      nodeKind:
        itemDefinition.nodeKind === undefined
          ? 'root-node'
          : itemDefinition.nodeKind,
      path: itemDefinition.path,
      relationalQualifications: {
        isParentCategory: false,
        isPathFragment: false,
        isPrivateCategory: false,
        isSubFragment: false,
        isSubLayer: false,
        parentFragmentPath: null,
      },
      role: { kind: 'absent', roleName: null },
    };
    byItemId.set(itemDefinition.id, classification);
    byPath.set(itemDefinition.path, classification);
    classifications.push(classification);
  }

  return { byItemId, byPath, classifications };
};

const buildTreeDeclaration = (
  originPath: string,
  rootFragments: readonly TEffectiveRootFragment[]
): TEffectiveTree => ({
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
  rootFragments,
  treeDependencyPairs: [],
});

const buildFullModel = (options: {
  readonly edges: readonly TEdgeMetadata[];
  readonly items: readonly TTestItem[];
  readonly rootFragments?: readonly TEffectiveRootFragment[];
  readonly sets?: readonly THorizontalHierarchySet[];
  readonly treeOrigin?: string;
}): TVerificationModel => {
  const base = verificationModel();
  const originPath = options.treeOrigin ?? 'src';
  const tree = buildTreeDeclaration(originPath, options.rootFragments ?? []);
  const hierarchies: THorizontalHierarchies = {
    conflicts: [],
    sets: options.sets ?? [],
  };

  return {
    ...base,
    basis: {
      ...base.basis,
      declarations: {
        ...base.basis.declarations,
        trees: [tree],
      },
      inventory: buildInventoryFromItems(options.items),
    },
    graph: {
      ...base.graph,
      edgeMetadata: options.edges,
    },
    hierarchies,
    taxonomy: buildTaxonomyFromItems(options.items),
  };
};

describe('verifyRootNodeDiscipline', () => {
  describe('root node relationships table', () => {
    it('row 1: stesso Root Fragment, nessuna autorizzazione -> vietare', () => {
      const model = buildFullModel({
        edges: [makeEdge('src/high.ts', 'src/low.ts')],
        items: [
          { id: 0, kind: 'directory', path: 'src' },
          { id: 1, nodeKind: 'root-node', parentId: 0, path: 'src/high.ts' },
          { id: 2, nodeKind: 'root-node', parentId: 0, path: 'src/low.ts' },
        ],
        sets: [
          {
            id: 0,
            isOrderable: true,
            origin: 'root-nodes',
            parentPath: 'src',
            repetitions: [],
            siblings: [
              { itemId: 1, rank: 0 },
              { itemId: 2, rank: 0 },
            ],
          },
        ],
      });
      const outcomes = verifyRootNodeDiscipline(model);

      expect(outcomes).toEqual([
        {
          constraint: 'dependency/root-node-discipline',
          element: 'src/high.ts',
          family: 'dependency',
          from: 'src/high.ts',
          importIndex: 0,
          message:
            "'src/high.ts' imports 'src/low.ts' through './target.js': a Root Node is importable only by Root Nodes authorized by rootNodes or dependencyEdges",
          normativeReference: 'FAF §6.2.2',
          position: { column: 1, line: 1 },
          specifier: './target.js',
          to: 'src/low.ts',
        },
      ]);
    });

    it('row 2: Root Fragments fratelli, nessuna autorizzazione -> vietare', () => {
      const model = buildFullModel({
        edges: [makeEdge('src/a/main.ts', 'src/b/main.ts')],
        items: [
          { id: 0, kind: 'directory', path: 'src' },
          { id: 1, kind: 'directory', parentId: 0, path: 'src/a' },
          { id: 2, nodeKind: 'root-node', parentId: 1, path: 'src/a/main.ts' },
          { id: 3, kind: 'directory', parentId: 0, path: 'src/b' },
          { id: 4, nodeKind: 'root-node', parentId: 3, path: 'src/b/main.ts' },
        ],
        rootFragments: [
          {
            dependencyPairs: [],
            path: 'src/a',
            rootNodes: [{ name: 'main.ts', rank: 0 }],
            subRootFragments: [],
          },
          {
            dependencyPairs: [],
            path: 'src/b',
            rootNodes: [{ name: 'main.ts', rank: 0 }],
            subRootFragments: [],
          },
        ],
      });
      const outcomes = verifyRootNodeDiscipline(model);

      expect(outcomes).toEqual([
        {
          constraint: 'dependency/root-node-discipline',
          element: 'src/a/main.ts',
          family: 'dependency',
          from: 'src/a/main.ts',
          importIndex: 0,
          message:
            "'src/a/main.ts' imports 'src/b/main.ts' through './target.js': a Root Node is importable only by Root Nodes authorized by rootNodes or dependencyEdges",
          normativeReference: 'FAF §6.2.2',
          position: { column: 1, line: 1 },
          specifier: './target.js',
          to: 'src/b/main.ts',
        },
      ]);
    });

    it('row 3: Root Fragments antenato e figlio, nessuna autorizzazione -> vietare', () => {
      const model = buildFullModel({
        edges: [makeEdge('src/main.ts', 'src/a/main.ts')],
        items: [
          { id: 0, kind: 'directory', path: 'src' },
          { id: 1, nodeKind: 'root-node', parentId: 0, path: 'src/main.ts' },
          { id: 2, kind: 'directory', parentId: 0, path: 'src/a' },
          { id: 3, nodeKind: 'root-node', parentId: 2, path: 'src/a/main.ts' },
        ],
        rootFragments: [
          {
            dependencyPairs: [],
            path: 'src',
            rootNodes: [{ name: 'main.ts', rank: 0 }],
            subRootFragments: [
              {
                dependencyPairs: [],
                path: 'src/a',
                rootNodes: [{ name: 'main.ts', rank: 0 }],
                subRootFragments: [],
              },
            ],
          },
        ],
      });
      const outcomes = verifyRootNodeDiscipline(model);

      expect(outcomes).toEqual([
        {
          constraint: 'dependency/root-node-discipline',
          element: 'src/main.ts',
          family: 'dependency',
          from: 'src/main.ts',
          importIndex: 0,
          message:
            "'src/main.ts' imports 'src/a/main.ts' through './target.js': a Root Node is importable only by Root Nodes authorized by rootNodes or dependencyEdges",
          normativeReference: 'FAF §6.2.2',
          position: { column: 1, line: 1 },
          specifier: './target.js',
          to: 'src/a/main.ts',
        },
      ]);
    });

    it('row 4: Root Fragments figlio e antenato, nessuna autorizzazione -> vietare', () => {
      const model = buildFullModel({
        edges: [makeEdge('src/a/main.ts', 'src/main.ts')],
        items: [
          { id: 0, kind: 'directory', path: 'src' },
          { id: 1, nodeKind: 'root-node', parentId: 0, path: 'src/main.ts' },
          { id: 2, kind: 'directory', parentId: 0, path: 'src/a' },
          { id: 3, nodeKind: 'root-node', parentId: 2, path: 'src/a/main.ts' },
        ],
        rootFragments: [
          {
            dependencyPairs: [],
            path: 'src',
            rootNodes: [{ name: 'main.ts', rank: 0 }],
            subRootFragments: [
              {
                dependencyPairs: [],
                path: 'src/a',
                rootNodes: [{ name: 'main.ts', rank: 0 }],
                subRootFragments: [],
              },
            ],
          },
        ],
      });
      const outcomes = verifyRootNodeDiscipline(model);

      expect(outcomes).toEqual([
        {
          constraint: 'dependency/root-node-discipline',
          element: 'src/a/main.ts',
          family: 'dependency',
          from: 'src/a/main.ts',
          importIndex: 0,
          message:
            "'src/a/main.ts' imports 'src/main.ts' through './target.js': a Root Node is importable only by Root Nodes authorized by rootNodes or dependencyEdges",
          normativeReference: 'FAF §6.2.2',
          position: { column: 1, line: 1 },
          specifier: './target.js',
          to: 'src/main.ts',
        },
      ]);
    });

    it('row 5: stesso Root Fragment, Horizontal Hierarchy strettamente discendente -> ammettere', () => {
      const model = buildFullModel({
        edges: [makeEdge('src/high.ts', 'src/low.ts')],
        items: [
          { id: 0, kind: 'directory', path: 'src' },
          { id: 1, nodeKind: 'root-node', parentId: 0, path: 'src/high.ts' },
          { id: 2, nodeKind: 'root-node', parentId: 0, path: 'src/low.ts' },
        ],
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
      });

      expect(verifyRootNodeDiscipline(model)).toEqual([]);
    });

    it('row 6: Root Fragments fratelli, autorizzazione esplicita -> ammettere', () => {
      const model = buildFullModel({
        edges: [makeEdge('src/a/main.ts', 'src/b/main.ts')],
        items: [
          { id: 0, kind: 'directory', path: 'src' },
          { id: 1, kind: 'directory', parentId: 0, path: 'src/a' },
          { id: 2, nodeKind: 'root-node', parentId: 1, path: 'src/a/main.ts' },
          { id: 3, kind: 'directory', parentId: 0, path: 'src/b' },
          { id: 4, nodeKind: 'root-node', parentId: 3, path: 'src/b/main.ts' },
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

      expect(verifyRootNodeDiscipline(model)).toEqual([]);
    });

    it('row 7: Root Fragments antenato e figlio, autorizzazione esplicita -> ammettere', () => {
      const model = buildFullModel({
        edges: [makeEdge('src/main.ts', 'src/a/main.ts')],
        items: [
          { id: 0, kind: 'directory', path: 'src' },
          { id: 1, nodeKind: 'root-node', parentId: 0, path: 'src/main.ts' },
          { id: 2, kind: 'directory', parentId: 0, path: 'src/a' },
          { id: 3, nodeKind: 'root-node', parentId: 2, path: 'src/a/main.ts' },
        ],
        rootFragments: [
          {
            dependencyPairs: [{ from: 'src/main.ts', to: 'src/a/main.ts' }],
            path: 'src',
            rootNodes: [{ name: 'main.ts', rank: 0 }],
            subRootFragments: [
              {
                dependencyPairs: [],
                path: 'src/a',
                rootNodes: [{ name: 'main.ts', rank: 0 }],
                subRootFragments: [],
              },
            ],
          },
        ],
      });

      expect(verifyRootNodeDiscipline(model)).toEqual([]);
    });

    it('row 8: Root Fragments figlio e antenato, autorizzazione esplicita -> ammettere', () => {
      const model = buildFullModel({
        edges: [makeEdge('src/a/main.ts', 'src/main.ts')],
        items: [
          { id: 0, kind: 'directory', path: 'src' },
          { id: 1, nodeKind: 'root-node', parentId: 0, path: 'src/main.ts' },
          { id: 2, kind: 'directory', parentId: 0, path: 'src/a' },
          { id: 3, nodeKind: 'root-node', parentId: 2, path: 'src/a/main.ts' },
        ],
        rootFragments: [
          {
            dependencyPairs: [],
            path: 'src',
            rootNodes: [{ name: 'main.ts', rank: 0 }],
            subRootFragments: [
              {
                dependencyPairs: [{ from: 'src/a/main.ts', to: 'src/main.ts' }],
                path: 'src/a',
                rootNodes: [{ name: 'main.ts', rank: 0 }],
                subRootFragments: [],
              },
            ],
          },
        ],
      });

      expect(verifyRootNodeDiscipline(model)).toEqual([]);
    });
  });

  describe('adversarial cases', () => {
    it('admits jumps across non-adjacent ranks (rank 2 to rank 0 skipping rank 1)', () => {
      const model = buildFullModel({
        edges: [
          makeEdge('src/top.ts', 'src/mid.ts'),
          makeEdge('src/mid.ts', 'src/bot.ts'),
          makeEdge('src/top.ts', 'src/bot.ts'),
        ],
        items: [
          { id: 0, kind: 'directory', path: 'src' },
          { id: 1, nodeKind: 'root-node', parentId: 0, path: 'src/top.ts' },
          { id: 2, nodeKind: 'root-node', parentId: 0, path: 'src/mid.ts' },
          { id: 3, nodeKind: 'root-node', parentId: 0, path: 'src/bot.ts' },
        ],
        sets: [
          {
            id: 0,
            isOrderable: true,
            origin: 'root-nodes',
            parentPath: 'src',
            repetitions: [],
            siblings: [
              { itemId: 1, rank: 2 },
              { itemId: 2, rank: 1 },
              { itemId: 3, rank: 0 },
            ],
          },
        ],
      });

      expect(verifyRootNodeDiscipline(model)).toEqual([]);
    });

    it('handles authorization with multiple sources and destinations (Cartesian product)', () => {
      const model = buildFullModel({
        edges: [
          makeEdge('src/a/1.ts', 'src/b/1.ts'),
          makeEdge('src/a/1.ts', 'src/b/2.ts'),
          makeEdge('src/a/2.ts', 'src/b/1.ts'),
          makeEdge('src/a/2.ts', 'src/b/2.ts'),
          makeEdge('src/a/1.ts', 'src/b/unauthorized.ts'),
        ],
        items: [
          { id: 0, kind: 'directory', path: 'src' },
          { id: 1, kind: 'directory', parentId: 0, path: 'src/a' },
          { id: 2, nodeKind: 'root-node', parentId: 1, path: 'src/a/1.ts' },
          { id: 3, nodeKind: 'root-node', parentId: 1, path: 'src/a/2.ts' },
          { id: 4, kind: 'directory', parentId: 0, path: 'src/b' },
          { id: 5, nodeKind: 'root-node', parentId: 4, path: 'src/b/1.ts' },
          { id: 6, nodeKind: 'root-node', parentId: 4, path: 'src/b/2.ts' },
          {
            id: 7,
            nodeKind: 'root-node',
            parentId: 4,
            path: 'src/b/unauthorized.ts',
          },
        ],
        rootFragments: [
          {
            dependencyPairs: [
              { from: 'src/a/1.ts', to: 'src/b/1.ts' },
              { from: 'src/a/1.ts', to: 'src/b/2.ts' },
              { from: 'src/a/2.ts', to: 'src/b/1.ts' },
              { from: 'src/a/2.ts', to: 'src/b/2.ts' },
            ],
            path: 'src/a',
            rootNodes: [
              { name: '1.ts', rank: 0 },
              { name: '2.ts', rank: 0 },
            ],
            subRootFragments: [],
          },
        ],
      });
      const outcomes = verifyRootNodeDiscipline(model);

      expect(outcomes).toEqual([
        {
          constraint: 'dependency/root-node-discipline',
          element: 'src/a/1.ts',
          family: 'dependency',
          from: 'src/a/1.ts',
          importIndex: 0,
          message:
            "'src/a/1.ts' imports 'src/b/unauthorized.ts' through './target.js': a Root Node is importable only by Root Nodes authorized by rootNodes or dependencyEdges",
          normativeReference: 'FAF §6.2.2',
          position: { column: 1, line: 1 },
          specifier: './target.js',
          to: 'src/b/unauthorized.ts',
        },
      ]);
    });

    it('rejects Fragment Node, Sub-Graph Node, Category Node, Access Node importing an exposed Root Node', () => {
      const model = buildFullModel({
        edges: [
          makeEdge('src/_components/btn/btn.component.ts', 'src/main.ts'),
          makeEdge('src/_components/btn/btn.spec.ts', 'src/main.ts'),
          makeEdge('src/_components/btn/index.ts', 'src/main.ts'),
          makeEdge('src/_types/theme.type.ts', 'src/main.ts'),
        ],
        items: [
          { id: 0, kind: 'directory', path: 'src' },
          { id: 1, nodeKind: 'root-node', parentId: 0, path: 'src/main.ts' },
          {
            id: 2,
            nodeKind: 'fragment-node',
            parentId: 0,
            path: 'src/_components/btn/btn.component.ts',
          },
          {
            id: 3,
            nodeKind: 'sub-graph-node',
            parentId: 0,
            path: 'src/_components/btn/btn.spec.ts',
          },
          {
            id: 4,
            nodeKind: 'category-node',
            parentId: 0,
            path: 'src/_types/theme.type.ts',
          },
          {
            id: 5,
            nodeKind: 'access-node',
            parentId: 0,
            path: 'src/_components/btn/index.ts',
          },
        ],
      });
      const outcomes = verifyRootNodeDiscipline(model);

      expect(outcomes).toHaveLength(4);
      expect(outcomes).toEqual([
        {
          constraint: 'dependency/root-node-discipline',
          element: 'src/_components/btn/btn.component.ts',
          family: 'dependency',
          from: 'src/_components/btn/btn.component.ts',
          importIndex: 0,
          message:
            "'src/_components/btn/btn.component.ts' imports 'src/main.ts' through './target.js': a Root Node is importable only by Root Nodes authorized by rootNodes or dependencyEdges",
          normativeReference: 'FAF §6.2.2',
          position: { column: 1, line: 1 },
          specifier: './target.js',
          to: 'src/main.ts',
        },
        {
          constraint: 'dependency/root-node-discipline',
          element: 'src/_components/btn/btn.spec.ts',
          family: 'dependency',
          from: 'src/_components/btn/btn.spec.ts',
          importIndex: 0,
          message:
            "'src/_components/btn/btn.spec.ts' imports 'src/main.ts' through './target.js': a Root Node is importable only by Root Nodes authorized by rootNodes or dependencyEdges",
          normativeReference: 'FAF §6.2.2',
          position: { column: 1, line: 1 },
          specifier: './target.js',
          to: 'src/main.ts',
        },
        {
          constraint: 'dependency/root-node-discipline',
          element: 'src/_components/btn/index.ts',
          family: 'dependency',
          from: 'src/_components/btn/index.ts',
          importIndex: 0,
          message:
            "'src/_components/btn/index.ts' imports 'src/main.ts' through './target.js': a Root Node is importable only by Root Nodes authorized by rootNodes or dependencyEdges",
          normativeReference: 'FAF §6.2.2',
          position: { column: 1, line: 1 },
          specifier: './target.js',
          to: 'src/main.ts',
        },
        {
          constraint: 'dependency/root-node-discipline',
          element: 'src/_types/theme.type.ts',
          family: 'dependency',
          from: 'src/_types/theme.type.ts',
          importIndex: 0,
          message:
            "'src/_types/theme.type.ts' imports 'src/main.ts' through './target.js': a Root Node is importable only by Root Nodes authorized by rootNodes or dependencyEdges",
          normativeReference: 'FAF §6.2.2',
          position: { column: 1, line: 1 },
          specifier: './target.js',
          to: 'src/main.ts',
        },
      ]);
    });

    it('verifies all syntactic import forms towards a forbidden Root Node', () => {
      const syntaxKinds: readonly TImportSyntaxKind[] = [
        'default-import',
        'export-all-from',
        'export-named-from',
        'export-type-from',
        'literal-dynamic-import',
        'mixed-type-specifier-import',
        'named-import',
        'namespace-import',
        'non-literal-dynamic-import',
        'require-call',
        'side-effect-import',
        'type-only-import',
        'typescript-import-type',
        'typescript-require-import',
      ];

      for (const [index, syntaxKind] of syntaxKinds.entries()) {
        const model = buildFullModel({
          edges: [
            makeEdge('src/high.ts', 'src/low.ts', {
              importIndex: index,
              position: { column: index + 1, line: index + 1 },
              syntaxKind,
            }),
          ],
          items: [
            { id: 0, kind: 'directory', path: 'src' },
            { id: 1, nodeKind: 'root-node', parentId: 0, path: 'src/high.ts' },
            { id: 2, nodeKind: 'root-node', parentId: 0, path: 'src/low.ts' },
          ],
          sets: [
            {
              id: 0,
              isOrderable: true,
              origin: 'root-nodes',
              parentPath: 'src',
              repetitions: [],
              siblings: [
                { itemId: 1, rank: 0 },
                { itemId: 2, rank: 0 },
              ],
            },
          ],
        });
        const outcomes = verifyRootNodeDiscipline(model);

        expect(outcomes).toEqual([
          {
            constraint: 'dependency/root-node-discipline',
            element: 'src/high.ts',
            family: 'dependency',
            from: 'src/high.ts',
            importIndex: index,
            message:
              "'src/high.ts' imports 'src/low.ts' through './target.js': a Root Node is importable only by Root Nodes authorized by rootNodes or dependencyEdges",
            normativeReference: 'FAF §6.2.2',
            position: { column: index + 1, line: index + 1 },
            specifier: './target.js',
            to: 'src/low.ts',
          },
        ]);
      }
    });

    it('applies the exact same discipline to Asset Root Nodes', () => {
      const model = buildFullModel({
        edges: [makeEdge('src/main.tsx', 'src/main.css')],
        items: [
          { id: 0, kind: 'directory', path: 'src' },
          { id: 1, nodeKind: 'root-node', parentId: 0, path: 'src/main.tsx' },
          { id: 2, nodeKind: 'root-node', parentId: 0, path: 'src/main.css' },
        ],
        sets: [
          {
            id: 0,
            isOrderable: true,
            origin: 'root-nodes',
            parentPath: 'src',
            repetitions: [],
            siblings: [
              { itemId: 1, rank: 0 },
              { itemId: 2, rank: 0 },
            ],
          },
        ],
      });
      const outcomes = verifyRootNodeDiscipline(model);

      expect(outcomes).toEqual([
        {
          constraint: 'dependency/root-node-discipline',
          element: 'src/main.tsx',
          family: 'dependency',
          from: 'src/main.tsx',
          importIndex: 0,
          message:
            "'src/main.tsx' imports 'src/main.css' through './target.js': a Root Node is importable only by Root Nodes authorized by rootNodes or dependencyEdges",
          normativeReference: 'FAF §6.2.2',
          position: { column: 1, line: 1 },
          specifier: './target.js',
          to: 'src/main.css',
        },
      ]);
    });

    it('rejects inverse and transitive shortcuts between Root Fragments', () => {
      const model = buildFullModel({
        edges: [
          makeEdge('src/b/main.ts', 'src/a/main.ts'),
          makeEdge('src/a/main.ts', 'src/c/main.ts'),
        ],
        items: [
          { id: 0, kind: 'directory', path: 'src' },
          { id: 1, kind: 'directory', parentId: 0, path: 'src/a' },
          { id: 2, nodeKind: 'root-node', parentId: 1, path: 'src/a/main.ts' },
          { id: 3, kind: 'directory', parentId: 0, path: 'src/b' },
          { id: 4, nodeKind: 'root-node', parentId: 3, path: 'src/b/main.ts' },
          { id: 5, kind: 'directory', parentId: 0, path: 'src/c' },
          { id: 6, nodeKind: 'root-node', parentId: 5, path: 'src/c/main.ts' },
        ],
        rootFragments: [
          {
            dependencyPairs: [{ from: 'src/a/main.ts', to: 'src/b/main.ts' }],
            path: 'src/a',
            rootNodes: [{ name: 'main.ts', rank: 0 }],
            subRootFragments: [],
          },
          {
            dependencyPairs: [{ from: 'src/b/main.ts', to: 'src/c/main.ts' }],
            path: 'src/b',
            rootNodes: [{ name: 'main.ts', rank: 0 }],
            subRootFragments: [],
          },
        ],
      });
      const outcomes = verifyRootNodeDiscipline(model);

      expect(outcomes).toEqual([
        {
          constraint: 'dependency/root-node-discipline',
          element: 'src/a/main.ts',
          family: 'dependency',
          from: 'src/a/main.ts',
          importIndex: 0,
          message:
            "'src/a/main.ts' imports 'src/c/main.ts' through './target.js': a Root Node is importable only by Root Nodes authorized by rootNodes or dependencyEdges",
          normativeReference: 'FAF §6.2.2',
          position: { column: 1, line: 1 },
          specifier: './target.js',
          to: 'src/c/main.ts',
        },
        {
          constraint: 'dependency/root-node-discipline',
          element: 'src/b/main.ts',
          family: 'dependency',
          from: 'src/b/main.ts',
          importIndex: 0,
          message:
            "'src/b/main.ts' imports 'src/a/main.ts' through './target.js': a Root Node is importable only by Root Nodes authorized by rootNodes or dependencyEdges",
          normativeReference: 'FAF §6.2.2',
          position: { column: 1, line: 1 },
          specifier: './target.js',
          to: 'src/a/main.ts',
        },
      ]);
    });

    it('ensures deterministic outcome ordering under any edge permutation', () => {
      const edge1 = makeEdge('src/z.ts', 'src/target.ts', {
        position: { column: 1, line: 1 },
      });
      const edge2 = makeEdge('src/a.ts', 'src/target.ts', {
        position: { column: 5, line: 1 },
      });
      const edge3 = makeEdge('src/a.ts', 'src/target.ts', {
        position: { column: 2, line: 1 },
      });

      const items: readonly TTestItem[] = [
        { id: 0, kind: 'directory', path: 'src' },
        { id: 1, nodeKind: 'root-node', parentId: 0, path: 'src/target.ts' },
        { id: 2, nodeKind: 'fragment-node', parentId: 0, path: 'src/z.ts' },
        { id: 3, nodeKind: 'fragment-node', parentId: 0, path: 'src/a.ts' },
      ];

      const modelA = buildFullModel({ edges: [edge1, edge2, edge3], items });
      const modelB = buildFullModel({ edges: [edge3, edge1, edge2], items });
      const modelC = buildFullModel({ edges: [edge2, edge3, edge1], items });

      const outcomesA = verifyRootNodeDiscipline(modelA);
      const outcomesB = verifyRootNodeDiscipline(modelB);
      const outcomesC = verifyRootNodeDiscipline(modelC);

      expect(outcomesA).toEqual(outcomesB);
      expect(outcomesA).toEqual(outcomesC);
      expect(outcomesA).toHaveLength(3);
      expect(outcomesA).toEqual([
        {
          constraint: 'dependency/root-node-discipline',
          element: 'src/a.ts',
          family: 'dependency',
          from: 'src/a.ts',
          importIndex: 0,
          message:
            "'src/a.ts' imports 'src/target.ts' through './target.js': a Root Node is importable only by Root Nodes authorized by rootNodes or dependencyEdges",
          normativeReference: 'FAF §6.2.2',
          position: { column: 2, line: 1 },
          specifier: './target.js',
          to: 'src/target.ts',
        },
        {
          constraint: 'dependency/root-node-discipline',
          element: 'src/a.ts',
          family: 'dependency',
          from: 'src/a.ts',
          importIndex: 0,
          message:
            "'src/a.ts' imports 'src/target.ts' through './target.js': a Root Node is importable only by Root Nodes authorized by rootNodes or dependencyEdges",
          normativeReference: 'FAF §6.2.2',
          position: { column: 5, line: 1 },
          specifier: './target.js',
          to: 'src/target.ts',
        },
        {
          constraint: 'dependency/root-node-discipline',
          element: 'src/z.ts',
          family: 'dependency',
          from: 'src/z.ts',
          importIndex: 0,
          message:
            "'src/z.ts' imports 'src/target.ts' through './target.js': a Root Node is importable only by Root Nodes authorized by rootNodes or dependencyEdges",
          normativeReference: 'FAF §6.2.2',
          position: { column: 1, line: 1 },
          specifier: './target.js',
          to: 'src/target.ts',
        },
      ]);
    });

    it('does not mutate the verification model', () => {
      const edge = makeEdge('src/a.ts', 'src/b.ts');
      const model = buildFullModel({
        edges: [edge],
        items: [
          { id: 0, kind: 'directory', path: 'src' },
          { id: 1, nodeKind: 'fragment-node', parentId: 0, path: 'src/a.ts' },
          { id: 2, nodeKind: 'root-node', parentId: 0, path: 'src/b.ts' },
        ],
      });

      Object.freeze(model);
      Object.freeze(model.graph);
      Object.freeze(model.graph.edgeMetadata);

      expect(() => verifyRootNodeDiscipline(model)).not.toThrow();
    });
  });
});
