import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TNodeKind,
  TTaxonomyModel,
} from '../../_verify-project@shared/_types/_compounds/classification.type.js';
import type {
  TDependencyGraph,
  TEdgeMetadata,
} from '../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type { TExternalCrossing } from '../../_verify-project@shared/_types/_compounds/external-crossing.type.js';
import type {
  TEffectiveRootFragment,
  TEffectiveTree,
} from '../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type { TInventory } from '../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyAcyclicity } from './index.js';

const buildClassification = (
  path: string,
  nodeKind: null | TNodeKind,
  itemId: number
): TItemClassification => ({
  domainKind: null,
  entryKind: 'file',
  fragmentInternalRank: null,
  imposedRoleName: null,
  itemId,
  nodeKind,
  path,
  relationalQualifications: {
    isParentCategory: false,
    isPathFragment: false,
    isPrivateCategory: false,
    isSubFragment: false,
    isSubLayer: false,
    parentFragmentPath: null,
  },
  role: { kind: 'absent', roleName: null },
});

const lineBySource: Readonly<Record<string, number>> = {
  'src/a.ts': 1,
  'src/b.ts': 2,
  'src/c.ts': 3,
};

const createEdge = (
  sourcePath: string,
  destinationPath: string,
  line?: number
): TEdgeMetadata => ({
  aliasAlternatives: [],
  aliasUsed: null,
  destinationPath,
  importIndex: 0,
  isTypeOnly: false,
  position: { column: 1, line: line ?? lineBySource[sourcePath] ?? 1 },
  sourcePath,
  specifier: `./${destinationPath}`,
  syntaxKind: 'side-effect-import',
});

const createTreeDeclaration = ({
  originPath,
  rootFragments = [],
  treeDependencyPairs = [],
}: {
  readonly originPath: string;
  readonly rootFragments?: readonly TEffectiveRootFragment[];
  readonly treeDependencyPairs?: readonly {
    readonly from: string;
    readonly to: string;
  }[];
}): TEffectiveTree => ({
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
  treeDependencyPairs,
});

const createModel = ({
  crossings = [],
  edges = [],
  files,
  treeDeclarations,
  trees = ['src'],
}: {
  readonly crossings?: readonly TExternalCrossing[];
  readonly edges?: readonly (readonly [string, string])[];
  readonly files: readonly (readonly [
    string,
    null | TNodeKind,
    null | string,
  ])[];
  readonly treeDeclarations?: readonly TEffectiveTree[];
  readonly trees?: readonly string[];
}): TVerificationModel => {
  const base = verificationModel();
  const inventoryItems = files.map(([path, , treeOrigin], id) => ({
    depth: 1,
    id,
    isSymlink: false,
    kind: 'file' as const,
    parentId: null,
    path,
    preorderEnd: id,
    preorderStart: id,
    realPath: `/workspace/${path}`,
    treeOrigin,
  }));
  const pathToId = new Map(inventoryItems.map((item) => [item.path, item.id]));
  const realPathToId = new Map(
    inventoryItems.map((item) => [item.realPath, item.id])
  );
  const inventory: TInventory = {
    items: inventoryItems,
    pathToId,
    realPathToId,
  };

  const classifications = files.map(([path, nodeKind], id) =>
    buildClassification(path, nodeKind, id)
  );
  const byItemId = new Map(classifications.map((c) => [c.itemId, c]));
  const byPath = new Map(classifications.map((c) => [c.path, c]));
  const taxonomy: TTaxonomyModel = {
    byItemId,
    byPath,
    classifications,
  };

  const edgeMetadata = edges.map(([src, destination]) =>
    createEdge(src, destination)
  );
  const graph: TDependencyGraph = {
    ...base.graph,
    edgeMetadata,
  };

  const effectiveTrees =
    treeDeclarations ??
    trees.map((origin) => createTreeDeclaration({ originPath: origin }));

  return {
    ...base,
    basis: {
      ...base.basis,
      declarations: {
        ...base.basis.declarations,
        trees: effectiveTrees,
      },
      inventory,
    },
    crossings,
    graph,
    taxonomy,
  };
};

describe('verifyAcyclicity', () => {
  describe('graph table cases', () => {
    it('admits a chain graph without cycles', () => {
      const model = createModel({
        edges: [
          ['src/a.ts', 'src/b.ts'],
          ['src/b.ts', 'src/c.ts'],
        ],
        files: [
          ['src/a.ts', 'fragment-node', 'src'],
          ['src/b.ts', 'fragment-node', 'src'],
          ['src/c.ts', 'fragment-node', 'src'],
        ],
      });
      expect(verifyAcyclicity(model)).toEqual([]);
    });

    it('admits a diamond graph without cycles', () => {
      const model = createModel({
        edges: [
          ['src/a.ts', 'src/b.ts'],
          ['src/a.ts', 'src/c.ts'],
          ['src/b.ts', 'src/c.ts'],
        ],
        files: [
          ['src/a.ts', 'fragment-node', 'src'],
          ['src/b.ts', 'fragment-node', 'src'],
          ['src/c.ts', 'fragment-node', 'src'],
        ],
      });
      expect(verifyAcyclicity(model)).toEqual([]);
    });

    it('forbids a self-loop (single vertex cycle)', () => {
      const model = createModel({
        edges: [['src/a.ts', 'src/a.ts']],
        files: [['src/a.ts', 'fragment-node', 'src']],
      });
      expect(verifyAcyclicity(model)).toEqual([
        expect.objectContaining({
          constraint: 'acyclicity/dependency-cycle',
          cycle: [['src/a.ts', 'src/a.ts']],
          element: 'src/a.ts',
        }),
      ]);
    });

    it('forbids a two-vertex cycle', () => {
      const model = createModel({
        edges: [
          ['src/b.ts', 'src/a.ts'],
          ['src/a.ts', 'src/b.ts'],
        ],
        files: [
          ['src/b.ts', 'fragment-node', 'src'],
          ['src/a.ts', 'fragment-node', 'src'],
        ],
      });
      expect(verifyAcyclicity(model)).toEqual([
        expect.objectContaining({
          constraint: 'acyclicity/dependency-cycle',
          cycle: [['src/a.ts', 'src/b.ts', 'src/a.ts']],
          element: 'src/a.ts',
        }),
      ]);
    });

    it('forbids a three-vertex cycle', () => {
      const model = createModel({
        edges: [
          ['src/a.ts', 'src/b.ts'],
          ['src/b.ts', 'src/c.ts'],
          ['src/c.ts', 'src/a.ts'],
        ],
        files: [
          ['src/a.ts', 'fragment-node', 'src'],
          ['src/b.ts', 'fragment-node', 'src'],
          ['src/c.ts', 'fragment-node', 'src'],
        ],
      });
      expect(verifyAcyclicity(model)).toEqual([
        expect.objectContaining({
          constraint: 'acyclicity/dependency-cycle',
          cycle: [['src/a.ts', 'src/b.ts', 'src/c.ts', 'src/a.ts']],
          element: 'src/a.ts',
        }),
      ]);
    });
  });

  describe('adversarial cases', () => {
    it('detects multiple disjoint cyclic components with one witness per component', () => {
      const model = createModel({
        edges: [
          ['src/x.ts', 'src/y.ts'],
          ['src/y.ts', 'src/x.ts'],
          ['src/a.ts', 'src/b.ts'],
          ['src/b.ts', 'src/a.ts'],
        ],
        files: [
          ['src/a.ts', 'fragment-node', 'src'],
          ['src/b.ts', 'fragment-node', 'src'],
          ['src/x.ts', 'fragment-node', 'src'],
          ['src/y.ts', 'fragment-node', 'src'],
        ],
      });
      const outcomes = verifyAcyclicity(model);
      expect(outcomes).toHaveLength(2);
      expect(outcomes[0]?.element).toBe('src/a.ts');
      expect(outcomes[1]?.element).toBe('src/x.ts');
    });

    it('picks the shortest cycle when a component contains multiple cycles', () => {
      const model = createModel({
        edges: [
          ['src/a.ts', 'src/b.ts'],
          ['src/b.ts', 'src/a.ts'],
          ['src/b.ts', 'src/c.ts'],
          ['src/c.ts', 'src/d.ts'],
          ['src/d.ts', 'src/a.ts'],
        ],
        files: [
          ['src/a.ts', 'fragment-node', 'src'],
          ['src/b.ts', 'fragment-node', 'src'],
          ['src/c.ts', 'fragment-node', 'src'],
          ['src/d.ts', 'fragment-node', 'src'],
        ],
      });
      const outcomes = verifyAcyclicity(model);
      expect(outcomes).toHaveLength(1);
      expect(outcomes[0]?.element).toBe('src/a.ts');
      if (outcomes[0]?.family === 'acyclicity') {
        expect(outcomes[0].cycle).toEqual([
          ['src/a.ts', 'src/b.ts', 'src/a.ts'],
        ]);
      }
    });

    it('tolerates parallel edges between the same vertices', () => {
      const model = createModel({
        edges: [
          ['src/a.ts', 'src/b.ts'],
          ['src/a.ts', 'src/b.ts'],
          ['src/b.ts', 'src/a.ts'],
        ],
        files: [
          ['src/a.ts', 'fragment-node', 'src'],
          ['src/b.ts', 'fragment-node', 'src'],
        ],
      });
      expect(verifyAcyclicity(model)).toHaveLength(1);
    });

    it('detects a cycle between Trees with direct edges and no module cycle', () => {
      const model = createModel({
        edges: [
          ['a/source.ts', 'b/target.ts'],
          ['b/source.ts', 'a/target.ts'],
        ],
        files: [
          ['a/source.ts', 'fragment-node', 'a'],
          ['a/target.ts', 'fragment-node', 'a'],
          ['b/source.ts', 'fragment-node', 'b'],
          ['b/target.ts', 'fragment-node', 'b'],
        ],
        trees: ['a', 'b'],
      });
      expect(verifyAcyclicity(model)).toEqual([
        expect.objectContaining({
          constraint: 'acyclicity/inter-tree-cycle',
          cycle: [
            ['a/source.ts', 'b/target.ts'],
            ['b/source.ts', 'a/target.ts'],
          ],
          element: 'a/source.ts',
        }),
      ]);
    });

    it('detects a cycle between Trees induced by external crossings', () => {
      const model = createModel({
        crossings: [
          {
            chain: ['a/start.ts', 'x.ts', 'b/end.ts'],
            destinationPath: 'b/end.ts',
            importIndex: 0,
            position: { column: 1, line: 1 },
            sourcePath: 'a/start.ts',
            specifier: './x.js',
          },
        ],
        edges: [['b/back.ts', 'a/end.ts']],
        files: [
          ['a/start.ts', 'fragment-node', 'a'],
          ['a/end.ts', 'fragment-node', 'a'],
          ['b/back.ts', 'fragment-node', 'b'],
          ['b/end.ts', 'fragment-node', 'b'],
          ['x.ts', null, null],
        ],
        trees: ['a', 'b'],
      });
      expect(verifyAcyclicity(model)).toEqual([
        expect.objectContaining({
          constraint: 'acyclicity/inter-tree-cycle',
          cycle: [
            ['a/start.ts', 'x.ts', 'b/end.ts'],
            ['b/back.ts', 'a/end.ts'],
          ],
          element: 'a/start.ts',
        }),
      ]);
    });

    it('emits no outcomes for a cycle wholly external to Trees', () => {
      const model = createModel({
        edges: [
          ['x.ts', 'y.ts'],
          ['y.ts', 'x.ts'],
        ],
        files: [
          ['x.ts', null, null],
          ['y.ts', null, null],
          ['src/a.ts', 'fragment-node', 'src'],
        ],
      });
      expect(verifyAcyclicity(model)).toEqual([]);
    });

    it('distinguishes exercised and unexercised cyclic tree authorizations', () => {
      const unexercisedModel = createModel({
        files: [
          ['a/entry.ts', 'fragment-node', 'a'],
          ['b/entry.ts', 'fragment-node', 'b'],
        ],
        treeDeclarations: [
          createTreeDeclaration({
            originPath: 'a',
            treeDependencyPairs: [{ from: 'a', to: 'b' }],
          }),
          createTreeDeclaration({
            originPath: 'b',
            treeDependencyPairs: [{ from: 'b', to: 'a' }],
          }),
        ],
        trees: ['a', 'b'],
      });
      expect(verifyAcyclicity(unexercisedModel)).toEqual([
        expect.objectContaining({
          constraint: 'unverified/cyclic-tree-authorization',
          element: 'a',
        }),
      ]);

      const exercisedModel = createModel({
        edges: [
          ['a/source.ts', 'b/target.ts'],
          ['b/source.ts', 'a/target.ts'],
        ],
        files: [
          ['a/source.ts', 'fragment-node', 'a'],
          ['a/target.ts', 'fragment-node', 'a'],
          ['b/source.ts', 'fragment-node', 'b'],
          ['b/target.ts', 'fragment-node', 'b'],
        ],
        treeDeclarations: [
          createTreeDeclaration({
            originPath: 'a',
            treeDependencyPairs: [{ from: 'a', to: 'b' }],
          }),
          createTreeDeclaration({
            originPath: 'b',
            treeDependencyPairs: [{ from: 'b', to: 'a' }],
          }),
        ],
        trees: ['a', 'b'],
      });
      const exercisedOutcomes = verifyAcyclicity(exercisedModel);
      expect(exercisedOutcomes).toHaveLength(1);
      expect(exercisedOutcomes[0]?.constraint).toBe(
        'acyclicity/inter-tree-cycle'
      );
    });

    it('distinguishes exercised and unexercised cyclic root authorizations', () => {
      const rootA: TEffectiveRootFragment = {
        dependencyPairs: [{ from: 'src/a/main.ts', to: 'src/b/main.ts' }],
        path: 'src/a',
        rootNodes: [{ name: 'main.ts', rank: 0 }],
        subRootFragments: [],
      };
      const rootB: TEffectiveRootFragment = {
        dependencyPairs: [{ from: 'src/b/main.ts', to: 'src/a/main.ts' }],
        path: 'src/b',
        rootNodes: [{ name: 'main.ts', rank: 0 }],
        subRootFragments: [],
      };

      const unexercisedModel = createModel({
        files: [
          ['src/a/main.ts', 'root-node', 'src'],
          ['src/b/main.ts', 'root-node', 'src'],
        ],
        treeDeclarations: [
          createTreeDeclaration({
            originPath: 'src',
            rootFragments: [rootA, rootB],
          }),
        ],
      });
      expect(verifyAcyclicity(unexercisedModel)).toEqual([
        expect.objectContaining({
          constraint: 'unverified/cyclic-root-authorization',
          element: 'src/a',
        }),
      ]);

      const exercisedModel = createModel({
        edges: [
          ['src/a/main.ts', 'src/b/main.ts'],
          ['src/b/main.ts', 'src/a/main.ts'],
        ],
        files: [
          ['src/a/main.ts', 'root-node', 'src'],
          ['src/b/main.ts', 'root-node', 'src'],
        ],
        treeDeclarations: [
          createTreeDeclaration({
            originPath: 'src',
            rootFragments: [rootA, rootB],
          }),
        ],
      });
      const exercisedOutcomes = verifyAcyclicity(exercisedModel);
      expect(exercisedOutcomes).toHaveLength(1);
      expect(exercisedOutcomes[0]?.constraint).toBe(
        'acyclicity/dependency-cycle'
      );
    });

    it('processes a long chain without recursion or call stack overflow', () => {
      const count = 3000;
      const files: [string, TNodeKind, string][] = [];
      const edges: [string, string][] = [];
      for (let index = 0; index < count; index += 1) {
        const current = `src/node-${index}.ts`;
        const next = `src/node-${(index + 1) % count}.ts`;
        files.push([current, 'fragment-node', 'src']);
        edges.push([current, next]);
      }

      const model = createModel({ edges, files });
      const outcomes = verifyAcyclicity(model);
      expect(outcomes).toHaveLength(1);
      expect(outcomes[0]?.constraint).toBe('acyclicity/dependency-cycle');
    });

    it('is deterministic under permutation of files and edges', () => {
      const files1: [string, TNodeKind, string][] = [
        ['src/b.ts', 'fragment-node', 'src'],
        ['src/a.ts', 'fragment-node', 'src'],
        ['src/c.ts', 'fragment-node', 'src'],
      ];
      const edges1: [string, string][] = [
        ['src/c.ts', 'src/a.ts'],
        ['src/a.ts', 'src/b.ts'],
        ['src/b.ts', 'src/c.ts'],
      ];
      const model1 = createModel({ edges: edges1, files: files1 });

      const files2: [string, TNodeKind, string][] = [
        ['src/a.ts', 'fragment-node', 'src'],
        ['src/c.ts', 'fragment-node', 'src'],
        ['src/b.ts', 'fragment-node', 'src'],
      ];
      const edges2: [string, string][] = [
        ['src/a.ts', 'src/b.ts'],
        ['src/b.ts', 'src/c.ts'],
        ['src/c.ts', 'src/a.ts'],
      ];
      const model2 = createModel({ edges: edges2, files: files2 });

      expect(verifyAcyclicity(model1)).toEqual(verifyAcyclicity(model2));
    });

    it('sorts outcomes with the same element by constraint', () => {
      const rootA: TEffectiveRootFragment = {
        dependencyPairs: [{ from: 'src/a/main.ts', to: 'src/b/main.ts' }],
        path: 'src/a',
        rootNodes: [{ name: 'main.ts', rank: 0 }],
        subRootFragments: [],
      };
      const rootB: TEffectiveRootFragment = {
        dependencyPairs: [{ from: 'src/b/main.ts', to: 'src/a/main.ts' }],
        path: 'src/b',
        rootNodes: [{ name: 'main.ts', rank: 0 }],
        subRootFragments: [],
      };

      const model = createModel({
        files: [
          ['src/a/main.ts', 'root-node', 'src/a'],
          ['src/b/main.ts', 'root-node', 'src/b'],
        ],
        treeDeclarations: [
          createTreeDeclaration({
            originPath: 'src/a',
            rootFragments: [rootA, rootB],
            treeDependencyPairs: [{ from: 'src/a', to: 'z' }],
          }),
          createTreeDeclaration({
            originPath: 'z',
            treeDependencyPairs: [{ from: 'z', to: 'src/a' }],
          }),
        ],
        trees: ['src/a', 'z'],
      });

      const outcomes = verifyAcyclicity(model);
      expect(outcomes).toHaveLength(2);
      expect(outcomes[0]?.element).toBe('src/a');
      expect(outcomes[1]?.element).toBe('src/a');
      expect(outcomes[0]?.constraint).toBe(
        'unverified/cyclic-root-authorization'
      );
      expect(outcomes[1]?.constraint).toBe(
        'unverified/cyclic-tree-authorization'
      );
    });

    it('does not mutate the verification model', () => {
      const model = createModel({
        edges: [
          ['src/a.ts', 'src/b.ts'],
          ['src/b.ts', 'src/a.ts'],
        ],
        files: [
          ['src/a.ts', 'fragment-node', 'src'],
          ['src/b.ts', 'fragment-node', 'src'],
        ],
      });
      const snapshot = JSON.stringify(model);
      verifyAcyclicity(model);
      expect(JSON.stringify(model)).toBe(snapshot);
    });
  });
});
