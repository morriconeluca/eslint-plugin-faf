import { describe, expect, it } from 'vitest';

import type {
  TDependencyGraph,
  TEdgeMetadata,
} from '../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type { TExternalCrossing } from '../../_verify-project@shared/_types/_compounds/external-crossing.type.js';
import type { TEffectiveTree } from '../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyReEntryProhibition } from './re-entry-prohibition.norm.js';

const makeTree = (originPath: string): TEffectiveTree => ({
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

const makeInventory = (
  nodes: readonly {
    readonly path: string;
    readonly treeOrigin: null | string;
  }[]
): TInventory => {
  const items: TInventoryItem[] = [];
  const pathToId = new Map<string, number>();
  const realPathToId = new Map<string, number>();

  for (const [id, node] of nodes.entries()) {
    const item: TInventoryItem = {
      depth: 1,
      id,
      isSymlink: false,
      kind: 'file',
      parentId: null,
      path: node.path,
      preorderEnd: id,
      preorderStart: id,
      realPath: node.path,
      treeOrigin: node.treeOrigin,
    };
    items.push(item);
    pathToId.set(node.path, id);
    realPathToId.set(node.path, id);
  }

  return { items, pathToId, realPathToId };
};

const makeEdge = (
  sourcePath: string,
  destinationPath: string
): TEdgeMetadata => ({
  aliasAlternatives: [],
  aliasUsed: null,
  destinationPath,
  importIndex: 0,
  isTypeOnly: false,
  position: { column: 1, line: 1 },
  sourcePath,
  specifier: `./${destinationPath}.js`,
  syntaxKind: 'named-import',
});

const buildModel = (parameters: {
  readonly crossings?: readonly TExternalCrossing[];
  readonly edges?: readonly TEdgeMetadata[];
  readonly nodes: readonly {
    readonly path: string;
    readonly treeOrigin: null | string;
  }[];
  readonly trees: readonly string[];
}): TVerificationModel => {
  const base = verificationModel();
  const inventory = makeInventory(parameters.nodes);
  const trees = parameters.trees.map((origin) => makeTree(origin));
  const edgeMetadata = parameters.edges ?? [];
  const crossings = parameters.crossings ?? [];

  const graph: TDependencyGraph = {
    ...base.graph,
    edgeCount: edgeMetadata.length,
    edgeMetadata,
  };

  return {
    ...base,
    basis: {
      ...base.basis,
      declarations: {
        ...base.basis.declarations,
        trees,
      },
      inventory,
    },
    crossings,
    graph,
  };
};

describe('verifyReEntryProhibition', () => {
  it('reports a re-entry through one external file (re-entry table row 1)', () => {
    const model = buildModel({
      crossings: [
        {
          chain: ['a/start.ts', 'x.ts', 'a/end.ts'],
          destinationPath: 'a/end.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'a/start.ts',
          specifier: '../x.js',
        },
      ],
      nodes: [
        { path: 'a/start.ts', treeOrigin: 'a' },
        { path: 'a/end.ts', treeOrigin: 'a' },
        { path: 'x.ts', treeOrigin: null },
      ],
      trees: ['a'],
    });

    const outcomes = verifyReEntryProhibition(model);

    expect(outcomes).toEqual([
      {
        chain: ['a/start.ts', 'x.ts', 'a/end.ts'],
        constraint: 'dependency/re-entry-prohibition',
        element: 'a/start.ts',
        family: 'dependency',
        from: 'a/start.ts',
        importIndex: 0,
        message:
          "'a/start.ts' reaches 'a/end.ts' through a/start.ts -> x.ts -> a/end.ts: a path through local files outside all Fractal Trees must not re-enter its Fractal Tree",
        normativeReference: 'FAF §7.3',
        position: { column: 1, line: 1 },
        specifier: '../x.js',
        to: 'a/end.ts',
      },
    ]);
  });

  it('reports a re-entry through two external files (re-entry table row 2)', () => {
    const model = buildModel({
      crossings: [
        {
          chain: ['a/start.ts', 'x.ts', 'y.ts', 'a/end.ts'],
          destinationPath: 'a/end.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'a/start.ts',
          specifier: '../x.js',
        },
      ],
      nodes: [
        { path: 'a/start.ts', treeOrigin: 'a' },
        { path: 'a/end.ts', treeOrigin: 'a' },
        { path: 'x.ts', treeOrigin: null },
        { path: 'y.ts', treeOrigin: null },
      ],
      trees: ['a'],
    });

    const outcomes = verifyReEntryProhibition(model);

    expect(outcomes).toEqual([
      {
        chain: ['a/start.ts', 'x.ts', 'y.ts', 'a/end.ts'],
        constraint: 'dependency/re-entry-prohibition',
        element: 'a/start.ts',
        family: 'dependency',
        from: 'a/start.ts',
        importIndex: 0,
        message:
          "'a/start.ts' reaches 'a/end.ts' through a/start.ts -> x.ts -> y.ts -> a/end.ts: a path through local files outside all Fractal Trees must not re-enter its Fractal Tree",
        normativeReference: 'FAF §7.3',
        position: { column: 1, line: 1 },
        specifier: '../x.js',
        to: 'a/end.ts',
      },
    ]);
  });

  it('reports a re-entry traversing another Tree (re-entry table row 3)', () => {
    const model = buildModel({
      crossings: [
        {
          chain: ['a/start.ts', 'x.ts', 'b/mid.ts'],
          destinationPath: 'b/mid.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'a/start.ts',
          specifier: '../x.js',
        },
        {
          chain: ['b/mid.ts', 'y.ts', 'a/end.ts'],
          destinationPath: 'a/end.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'b/mid.ts',
          specifier: '../y.js',
        },
      ],
      nodes: [
        { path: 'a/start.ts', treeOrigin: 'a' },
        { path: 'a/end.ts', treeOrigin: 'a' },
        { path: 'b/mid.ts', treeOrigin: 'b' },
        { path: 'x.ts', treeOrigin: null },
        { path: 'y.ts', treeOrigin: null },
      ],
      trees: ['a', 'b'],
    });

    const outcomes = verifyReEntryProhibition(model);

    expect(outcomes).toEqual([
      {
        chain: ['a/start.ts', 'x.ts', 'b/mid.ts', 'y.ts', 'a/end.ts'],
        constraint: 'dependency/re-entry-prohibition',
        element: 'a/start.ts',
        family: 'dependency',
        from: 'a/start.ts',
        importIndex: 0,
        message:
          "'a/start.ts' reaches 'a/end.ts' through a/start.ts -> x.ts -> b/mid.ts -> y.ts -> a/end.ts: a path through local files outside all Fractal Trees must not re-enter its Fractal Tree",
        normativeReference: 'FAF §7.3',
        position: { column: 1, line: 1 },
        specifier: '../x.js',
        to: 'a/end.ts',
      },
    ]);
  });

  it('allows an exit without re-entry', () => {
    const model = buildModel({
      crossings: [],
      edges: [makeEdge('a/start.ts', 'x.ts')],
      nodes: [
        { path: 'a/start.ts', treeOrigin: 'a' },
        { path: 'x.ts', treeOrigin: null },
        { path: 'y.ts', treeOrigin: null },
      ],
      trees: ['a'],
    });

    expect(verifyReEntryProhibition(model)).toEqual([]);
  });

  it('reports an exit from an external cycle that reaches the starting Tree', () => {
    const model = buildModel({
      crossings: [
        {
          chain: ['a/start.ts', 'x.ts', 'y.ts', 'a/end.ts'],
          destinationPath: 'a/end.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'a/start.ts',
          specifier: '../x.js',
        },
      ],
      nodes: [
        { path: 'a/start.ts', treeOrigin: 'a' },
        { path: 'a/end.ts', treeOrigin: 'a' },
        { path: 'x.ts', treeOrigin: null },
        { path: 'y.ts', treeOrigin: null },
      ],
      trees: ['a'],
    });

    const outcomes = verifyReEntryProhibition(model);

    expect(outcomes).toEqual([
      {
        chain: ['a/start.ts', 'x.ts', 'y.ts', 'a/end.ts'],
        constraint: 'dependency/re-entry-prohibition',
        element: 'a/start.ts',
        family: 'dependency',
        from: 'a/start.ts',
        importIndex: 0,
        message:
          "'a/start.ts' reaches 'a/end.ts' through a/start.ts -> x.ts -> y.ts -> a/end.ts: a path through local files outside all Fractal Trees must not re-enter its Fractal Tree",
        normativeReference: 'FAF §7.3',
        position: { column: 1, line: 1 },
        specifier: '../x.js',
        to: 'a/end.ts',
      },
    ]);
  });

  it('rejects a Branch return through external code despite publication', () => {
    const branchSource = 'src/_src@shared/_types/start.type.ts';
    const mainTarget = 'src/main.ts';
    const model = buildModel({
      crossings: [
        {
          chain: [branchSource, 'x.ts', mainTarget],
          destinationPath: mainTarget,
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: branchSource,
          specifier: '../../../x.js',
        },
      ],
      nodes: [
        { path: branchSource, treeOrigin: 'src' },
        { path: mainTarget, treeOrigin: 'src' },
        { path: 'x.ts', treeOrigin: null },
      ],
      trees: ['src'],
    });

    const outcomes = verifyReEntryProhibition(model);

    expect(outcomes).toEqual([
      {
        chain: [branchSource, 'x.ts', mainTarget],
        constraint: 'dependency/re-entry-prohibition',
        element: branchSource,
        family: 'dependency',
        from: branchSource,
        importIndex: 0,
        message: `'${branchSource}' reaches '${mainTarget}' through ${branchSource} -> x.ts -> ${mainTarget}: a path through local files outside all Fractal Trees must not re-enter its Fractal Tree`,
        normativeReference: 'FAF §7.3',
        position: { column: 1, line: 1 },
        specifier: '../../../x.js',
        to: mainTarget,
      },
    ]);
  });

  it('sorts multiple re-entry outcomes deterministically using compareReEntryOutcomes', () => {
    const model = buildModel({
      crossings: [
        {
          chain: ['a/start.ts', 'x.ts', 'a/z-end.ts'],
          destinationPath: 'a/z-end.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'a/start.ts',
          specifier: '../x.js',
        },
        {
          chain: ['a/start.ts', 'y.ts', 'a/a-end.ts'],
          destinationPath: 'a/a-end.ts',
          importIndex: 1,
          position: { column: 1, line: 2 },
          sourcePath: 'a/start.ts',
          specifier: '../y.js',
        },
      ],
      nodes: [
        { path: 'a/start.ts', treeOrigin: 'a' },
        { path: 'a/z-end.ts', treeOrigin: 'a' },
        { path: 'a/a-end.ts', treeOrigin: 'a' },
        { path: 'x.ts', treeOrigin: null },
        { path: 'y.ts', treeOrigin: null },
      ],
      trees: ['a'],
    });

    const outcomes = verifyReEntryProhibition(model);

    expect(outcomes).toEqual([
      {
        chain: ['a/start.ts', 'y.ts', 'a/a-end.ts'],
        constraint: 'dependency/re-entry-prohibition',
        element: 'a/start.ts',
        family: 'dependency',
        from: 'a/start.ts',
        importIndex: 1,
        message:
          "'a/start.ts' reaches 'a/a-end.ts' through a/start.ts -> y.ts -> a/a-end.ts: a path through local files outside all Fractal Trees must not re-enter its Fractal Tree",
        normativeReference: 'FAF §7.3',
        position: { column: 1, line: 2 },
        specifier: '../y.js',
        to: 'a/a-end.ts',
      },
      {
        chain: ['a/start.ts', 'x.ts', 'a/z-end.ts'],
        constraint: 'dependency/re-entry-prohibition',
        element: 'a/start.ts',
        family: 'dependency',
        from: 'a/start.ts',
        importIndex: 0,
        message:
          "'a/start.ts' reaches 'a/z-end.ts' through a/start.ts -> x.ts -> a/z-end.ts: a path through local files outside all Fractal Trees must not re-enter its Fractal Tree",
        normativeReference: 'FAF §7.3',
        position: { column: 1, line: 1 },
        specifier: '../x.js',
        to: 'a/z-end.ts',
      },
    ]);
  });

  it('preserves determinism regardless of input element permutation', () => {
    const crossingOne: TExternalCrossing = {
      chain: ['a/first.ts', 'x.ts', 'a/end.ts'],
      destinationPath: 'a/end.ts',
      importIndex: 0,
      position: { column: 1, line: 1 },
      sourcePath: 'a/first.ts',
      specifier: '../x.js',
    };
    const crossingTwo: TExternalCrossing = {
      chain: ['a/second.ts', 'y.ts', 'a/target.ts'],
      destinationPath: 'a/target.ts',
      importIndex: 0,
      position: { column: 1, line: 2 },
      sourcePath: 'a/second.ts',
      specifier: '../y.js',
    };

    const nodes = [
      { path: 'a/first.ts', treeOrigin: 'a' },
      { path: 'a/second.ts', treeOrigin: 'a' },
      { path: 'a/end.ts', treeOrigin: 'a' },
      { path: 'a/target.ts', treeOrigin: 'a' },
      { path: 'x.ts', treeOrigin: null },
      { path: 'y.ts', treeOrigin: null },
    ];

    const modelOriginal = buildModel({
      crossings: [crossingOne, crossingTwo],
      nodes,
      trees: ['a'],
    });

    const modelPermuted = buildModel({
      crossings: [crossingTwo, crossingOne],
      nodes: [
        { path: 'a/second.ts', treeOrigin: 'a' },
        { path: 'a/first.ts', treeOrigin: 'a' },
        { path: 'a/end.ts', treeOrigin: 'a' },
        { path: 'a/target.ts', treeOrigin: 'a' },
        { path: 'x.ts', treeOrigin: null },
        { path: 'y.ts', treeOrigin: null },
      ],
      trees: ['a'],
    });

    const originalOutcomes = verifyReEntryProhibition(modelOriginal);
    const permutedOutcomes = verifyReEntryProhibition(modelPermuted);

    expect(originalOutcomes).toEqual(permutedOutcomes);
    expect(originalOutcomes).toHaveLength(2);
  });

  it('leaves the input model completely unmodified', () => {
    const model = buildModel({
      crossings: [
        {
          chain: ['a/start.ts', 'x.ts', 'a/end.ts'],
          destinationPath: 'a/end.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'a/start.ts',
          specifier: '../x.js',
        },
      ],
      nodes: [
        { path: 'a/start.ts', treeOrigin: 'a' },
        { path: 'a/end.ts', treeOrigin: 'a' },
        { path: 'x.ts', treeOrigin: null },
      ],
      trees: ['a'],
    });

    const snapshot = JSON.stringify(model);
    verifyReEntryProhibition(model);
    const afterSnapshot = JSON.stringify(model);

    expect(afterSnapshot).toBe(snapshot);
  });
});
