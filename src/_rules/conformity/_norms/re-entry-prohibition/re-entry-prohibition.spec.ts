import { describe, expect, it } from 'vitest';

import type {
  TDependencyGraph,
  TEdgeMetadata,
  TEffectiveTree,
  TExternalCrossing,
  TInventory,
  TInventoryItem,
  TItemClassification,
  TTaxonomyModel,
  TVerificationModel,
} from '../../_conformity@shared/_types/verification-model.type.js';

import { verificationModel } from '../_norms@shared/_mocks/verification-model.mock.js';
import { verifyReEntryProhibition } from './re-entry-prohibition.norm.js';
import {
  buildReEntryOutcome,
  buildReEntryTransitions,
  collectTreeCandidateSources,
  compareReEntryOutcomes,
  getTreeOrigin,
} from './re-entry-prohibition.util.js';

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
  horizontalHierarchyModels: [],
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
  readonly foreignNodes?: readonly string[];
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
  const byPath = new Map<string, TItemClassification>();

  for (const [id, node] of parameters.nodes.entries()) {
    if (parameters.foreignNodes?.includes(node.path) ?? false) {
      byPath.set(node.path, {
        domainKind: null,
        entryKind: 'file',
        fragmentInternalRank: null,
        imposedRoleName: null,
        itemId: id,
        nodeKind: 'foreign-node',
        path: node.path,
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
    }
  }

  const taxonomy: TTaxonomyModel = {
    byItemId: new Map(),
    byPath,
    classifications: [],
  };

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
    taxonomy,
  };
};

describe('verifyReEntryProhibition', () => {
  it('reports a re-entry through one external file', () => {
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

  it('reports a re-entry through two external files', () => {
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

  it('reports a re-entry traversing another Tree', () => {
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

  it('orders re-entry outcomes deterministically across all compareReEntryOutcomes tie-breakers', () => {
    const baseOutcome = {
      chain: ['a/1.ts', 'x.ts', 'a/2.ts'],
      constraint: 'dependency/re-entry-prohibition' as const,
      element: 'a/1.ts',
      family: 'dependency' as const,
      from: 'a/1.ts',
      importIndex: 0,
      message: 'msg',
      normativeReference: 'FAF §7.3',
      position: { column: 1, line: 1 },
      specifier: './x.js',
      to: 'a/2.ts',
    };

    expect(
      compareReEntryOutcomes(baseOutcome, { ...baseOutcome, from: 'b/1.ts' })
    ).toBeLessThan(0);
    expect(
      compareReEntryOutcomes(baseOutcome, { ...baseOutcome, to: 'a/3.ts' })
    ).toBeLessThan(0);
    const withoutPosition = {
      chain: ['a/1.ts', 'x.ts', 'a/2.ts'],
      constraint: 'dependency/re-entry-prohibition' as const,
      element: 'a/1.ts',
      family: 'dependency' as const,
      from: 'a/1.ts',
      importIndex: 0,
      message: 'msg',
      normativeReference: 'FAF §7.3',
      specifier: './x.js',
      to: 'a/2.ts',
    };
    expect(compareReEntryOutcomes(withoutPosition, baseOutcome)).toBeLessThan(
      0
    );
    expect(
      compareReEntryOutcomes(baseOutcome, withoutPosition)
    ).toBeGreaterThan(0);
    const withoutSpecifier = {
      chain: ['a/1.ts', 'x.ts', 'a/2.ts'],
      constraint: 'dependency/re-entry-prohibition' as const,
      element: 'a/1.ts',
      family: 'dependency' as const,
      from: 'a/1.ts',
      importIndex: 0,
      message: 'msg',
      normativeReference: 'FAF §7.3',
      position: { column: 1, line: 1 },
      to: 'a/2.ts',
    };
    expect(compareReEntryOutcomes(withoutSpecifier, baseOutcome)).toBeLessThan(
      0
    );
    expect(
      compareReEntryOutcomes(baseOutcome, withoutSpecifier)
    ).toBeGreaterThan(0);
    expect(
      compareReEntryOutcomes(baseOutcome, {
        ...baseOutcome,
        position: { column: 1, line: 2 },
      })
    ).toBeLessThan(0);
    expect(
      compareReEntryOutcomes(baseOutcome, { ...baseOutcome, importIndex: 1 })
    ).toBeLessThan(0);
    expect(
      compareReEntryOutcomes(baseOutcome, {
        ...baseOutcome,
        specifier: './z.js',
      })
    ).toBeLessThan(0);
    expect(compareReEntryOutcomes(baseOutcome, { ...baseOutcome })).toBe(0);
  });

  it('ignores foreign nodes, unindexed paths, and internal-only transitions', () => {
    const model = buildModel({
      crossings: [
        {
          chain: ['src/foreign.ts', 'x.ts', 'src/target.ts'],
          destinationPath: 'src/target.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'src/foreign.ts',
          specifier: '../x.js',
        },
        {
          chain: ['src/start.ts', 'x.ts', 'src/foreign.ts'],
          destinationPath: 'src/foreign.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'src/start.ts',
          specifier: '../x.js',
        },
      ],
      edges: [
        makeEdge('src/foreign.ts', 'b/mid.ts'),
        makeEdge('b/mid.ts', 'src/foreign.ts'),
        makeEdge('src/start.ts', 'unindexed/missing.ts'),
        makeEdge('src/start.ts', 'src/target.ts'),
      ],
      foreignNodes: ['src/foreign.ts'],
      nodes: [
        { path: 'src/foreign.ts', treeOrigin: 'src' },
        { path: 'src/start.ts', treeOrigin: 'src' },
        { path: 'src/target.ts', treeOrigin: 'src' },
        { path: 'b/mid.ts', treeOrigin: 'b' },
        { path: 'x.ts', treeOrigin: null },
      ],
      trees: ['src', 'b'],
    });

    expect(verifyReEntryProhibition(model)).toEqual([]);
  });

  it('builds transitions, collects sorted candidate sources, maps outcomes, and resolves tree origins directly', () => {
    const model = buildModel({
      crossings: [
        {
          chain: ['a/z.ts', 'x.ts', 'y.ts', 'a/end.ts'],
          destinationPath: 'a/end.ts',
          importIndex: 2,
          position: { column: 3, line: 4 },
          sourcePath: 'a/z.ts',
          specifier: '../x.js',
        },
        {
          chain: ['x.ts', 'a/end.ts'],
          destinationPath: 'a/end.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'x.ts',
          specifier: './a/end.js',
        },
      ],
      edges: [
        makeEdge('a/a.ts', 'b/mid.ts'),
        makeEdge('a/a.ts', 'a/end.ts'),
        makeEdge('a/internal.ts', 'a/end.ts'),
      ],
      nodes: [
        { path: 'a/z.ts', treeOrigin: 'a' },
        { path: 'a/a.ts', treeOrigin: 'a' },
        { path: 'a/internal.ts', treeOrigin: 'a' },
        { path: 'a/end.ts', treeOrigin: 'a' },
        { path: 'b/mid.ts', treeOrigin: 'b' },
        { path: 'x.ts', treeOrigin: null },
      ],
      trees: ['a', 'b'],
    });

    expect(getTreeOrigin('a/z.ts', model.basis.inventory)).toBe('a');
    expect(getTreeOrigin('x.ts', model.basis.inventory)).toBeNull();
    expect(getTreeOrigin('missing.ts', model.basis.inventory)).toBeNull();

    const transitions = buildReEntryTransitions(model);
    expect(transitions.get('x.ts')).toBeUndefined();
    expect(transitions.get('a/z.ts')).toEqual([
      {
        chain: ['a/z.ts', 'x.ts', 'y.ts', 'a/end.ts'],
        destinationPath: 'a/end.ts',
        hasExternal: true,
        importIndex: 2,
        position: { column: 3, line: 4 },
        specifier: '../x.js',
        weight: 3,
      },
    ]);
    expect(transitions.get('a/a.ts')).toEqual([
      {
        chain: ['a/a.ts', 'b/mid.ts'],
        destinationPath: 'b/mid.ts',
        hasExternal: false,
        importIndex: 0,
        position: { column: 1, line: 1 },
        specifier: './b/mid.ts.js',
        weight: 1,
      },
      {
        chain: ['a/a.ts', 'a/end.ts'],
        destinationPath: 'a/end.ts',
        hasExternal: false,
        importIndex: 0,
        position: { column: 1, line: 1 },
        specifier: './a/end.ts.js',
        weight: 1,
      },
    ]);

    expect(
      collectTreeCandidateSources('a', transitions, model.basis.inventory)
    ).toEqual(['a/a.ts', 'a/z.ts']);

    const outcome = buildReEntryOutcome({
      candidate: {
        chain: ['a/z.ts', 'x.ts', 'a/end.ts'],
        destination: 'a/end.ts',
        distance: 2,
        importIndex: 2,
        position: { column: 3, line: 4 },
        specifier: '../x.js',
      },
      sourcePath: 'a/z.ts',
    });
    expect(outcome.constraint).toBe('dependency/re-entry-prohibition');
    expect(outcome.from).toBe('a/z.ts');
    expect(outcome.to).toBe('a/end.ts');
    expect(outcome.importIndex).toBe(2);
    expect(outcome.position).toEqual({ column: 3, line: 4 });
    expect(outcome.specifier).toBe('../x.js');
    expect(outcome.chain).toEqual(['a/z.ts', 'x.ts', 'a/end.ts']);
  });
});
