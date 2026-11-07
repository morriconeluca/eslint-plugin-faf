import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TTaxonomyModel,
} from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type {
  TDependencyGraph,
  TEdgeMetadata,
} from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type { TExternalCrossing } from '../../../../_verify-project@shared/_types/_compounds/external-crossing.type.js';
import type { TEffectiveTree } from '../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TVerificationModel } from '../../../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { verificationModel } from '../../../../_verify-project@shared/_mocks/verification-model.mock.js';
import { findReEntryPaths } from './find-re-entry-paths.util.js';

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
    const isForeign = parameters.foreignNodes?.includes(node.path) ?? false;
    if (!isForeign) {
      continue;
    }
    const classification: TItemClassification = {
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
    };
    byPath.set(node.path, classification);
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

describe('findReEntryPaths', () => {
  it('returns empty array when there are no crossings', () => {
    const model = buildModel({
      nodes: [{ path: 'a/start.ts', treeOrigin: 'a' }],
      trees: ['a'],
    });

    expect(findReEntryPaths(model)).toEqual([]);
  });

  it('detects a direct re-entry through a single external file', () => {
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

    const outcomes = findReEntryPaths(model);

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

  it('detects a direct re-entry through multiple external files', () => {
    const model = buildModel({
      crossings: [
        {
          chain: ['a/start.ts', 'x.ts', 'y.ts', 'a/end.ts'],
          destinationPath: 'a/end.ts',
          importIndex: 0,
          position: { column: 2, line: 3 },
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

    const outcomes = findReEntryPaths(model);

    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.chain).toEqual([
      'a/start.ts',
      'x.ts',
      'y.ts',
      'a/end.ts',
    ]);
  });

  it('detects a re-entry passing through another Tree', () => {
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

    const outcomes = findReEntryPaths(model);

    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.chain).toEqual([
      'a/start.ts',
      'x.ts',
      'b/mid.ts',
      'y.ts',
      'a/end.ts',
    ]);
  });

  it('detects a re-entry concatenating crossing, intermediate graph edge, and crossing', () => {
    const model = buildModel({
      crossings: [
        {
          chain: ['a/start.ts', 'x.ts', 'b/entry.ts'],
          destinationPath: 'b/entry.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'a/start.ts',
          specifier: '../x.js',
        },
        {
          chain: ['b/exit.ts', 'y.ts', 'a/end.ts'],
          destinationPath: 'a/end.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'b/exit.ts',
          specifier: '../y.js',
        },
      ],
      edges: [makeEdge('b/entry.ts', 'b/exit.ts')],
      nodes: [
        { path: 'a/start.ts', treeOrigin: 'a' },
        { path: 'a/end.ts', treeOrigin: 'a' },
        { path: 'b/entry.ts', treeOrigin: 'b' },
        { path: 'b/exit.ts', treeOrigin: 'b' },
        { path: 'x.ts', treeOrigin: null },
        { path: 'y.ts', treeOrigin: null },
      ],
      trees: ['a', 'b'],
    });

    const outcomes = findReEntryPaths(model);

    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.chain).toEqual([
      'a/start.ts',
      'x.ts',
      'b/entry.ts',
      'b/exit.ts',
      'y.ts',
      'a/end.ts',
    ]);
  });

  it('detects a re-entry concatenating crossing and a direct graph edge back to Tree A', () => {
    const model = buildModel({
      crossings: [
        {
          chain: ['a/start.ts', 'x.ts', 'b/entry.ts'],
          destinationPath: 'b/entry.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'a/start.ts',
          specifier: '../x.js',
        },
      ],
      edges: [makeEdge('b/entry.ts', 'a/end.ts')],
      nodes: [
        { path: 'a/start.ts', treeOrigin: 'a' },
        { path: 'a/end.ts', treeOrigin: 'a' },
        { path: 'b/entry.ts', treeOrigin: 'b' },
        { path: 'x.ts', treeOrigin: null },
      ],
      trees: ['a', 'b'],
    });

    const outcomes = findReEntryPaths(model);

    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.chain).toEqual([
      'a/start.ts',
      'x.ts',
      'b/entry.ts',
      'a/end.ts',
    ]);
  });

  it('detects a re-entry starting with graph edge to Tree B and returning via crossing', () => {
    const model = buildModel({
      crossings: [
        {
          chain: ['b/mid.ts', 'x.ts', 'a/end.ts'],
          destinationPath: 'a/end.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'b/mid.ts',
          specifier: '../x.js',
        },
      ],
      edges: [makeEdge('a/start.ts', 'b/mid.ts')],
      nodes: [
        { path: 'a/start.ts', treeOrigin: 'a' },
        { path: 'a/end.ts', treeOrigin: 'a' },
        { path: 'b/mid.ts', treeOrigin: 'b' },
        { path: 'x.ts', treeOrigin: null },
      ],
      trees: ['a', 'b'],
    });

    const outcomes = findReEntryPaths(model);

    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.chain).toEqual([
      'a/start.ts',
      'b/mid.ts',
      'x.ts',
      'a/end.ts',
    ]);
  });

  it('selects the shortest path when multiple re-entry paths connect the same pair', () => {
    const model = buildModel({
      crossings: [
        {
          chain: ['a/start.ts', 'x1.ts', 'a/end.ts'],
          destinationPath: 'a/end.ts',
          importIndex: 5,
          position: { column: 1, line: 9 },
          sourcePath: 'a/start.ts',
          specifier: '../z-shorter.js',
        },
        {
          chain: ['a/start.ts', 'y1.ts', 'b/mid.ts'],
          destinationPath: 'b/mid.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'a/start.ts',
          specifier: '../a-longer.js',
        },
        {
          chain: ['b/mid.ts', 'y2.ts', 'a/end.ts'],
          destinationPath: 'a/end.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'b/mid.ts',
          specifier: '../y2.js',
        },
      ],
      nodes: [
        { path: 'a/start.ts', treeOrigin: 'a' },
        { path: 'a/end.ts', treeOrigin: 'a' },
        { path: 'b/mid.ts', treeOrigin: 'b' },
        { path: 'x1.ts', treeOrigin: null },
        { path: 'y1.ts', treeOrigin: null },
        { path: 'y2.ts', treeOrigin: null },
      ],
      trees: ['a', 'b'],
    });

    const outcomes = findReEntryPaths(model);

    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.chain).toEqual(['a/start.ts', 'x1.ts', 'a/end.ts']);
    expect(outcomes[0]?.importIndex).toBe(5);
  });

  it('breaks ties deterministically between equal-length candidate paths by chain comparison', () => {
    const model = buildModel({
      crossings: [
        {
          chain: ['a/start.ts', 'beta.ts', 'a/end.ts'],
          destinationPath: 'a/end.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'a/start.ts',
          specifier: '../same.js',
        },
        {
          chain: ['a/start.ts', 'alpha.ts', 'a/end.ts'],
          destinationPath: 'a/end.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'a/start.ts',
          specifier: '../same.js',
        },
      ],
      nodes: [
        { path: 'a/start.ts', treeOrigin: 'a' },
        { path: 'a/end.ts', treeOrigin: 'a' },
        { path: 'alpha.ts', treeOrigin: null },
        { path: 'beta.ts', treeOrigin: null },
      ],
      trees: ['a'],
    });

    const outcomes = findReEntryPaths(model);

    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.chain).toEqual(['a/start.ts', 'alpha.ts', 'a/end.ts']);
  });

  it('breaks ties deterministically by position when chains are identical', () => {
    const model = buildModel({
      crossings: [
        {
          chain: ['a/start.ts', 'x.ts', 'a/end.ts'],
          destinationPath: 'a/end.ts',
          importIndex: 0,
          position: { column: 1, line: 5 },
          sourcePath: 'a/start.ts',
          specifier: '../x.js',
        },
        {
          chain: ['a/start.ts', 'x.ts', 'a/end.ts'],
          destinationPath: 'a/end.ts',
          importIndex: 0,
          position: { column: 1, line: 2 },
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

    const outcomes = findReEntryPaths(model);

    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.position).toEqual({ column: 1, line: 2 });
  });

  it('breaks ties deterministically by importIndex when positions are identical', () => {
    const model = buildModel({
      crossings: [
        {
          chain: ['a/start.ts', 'x.ts', 'a/end.ts'],
          destinationPath: 'a/end.ts',
          importIndex: 2,
          position: { column: 1, line: 1 },
          sourcePath: 'a/start.ts',
          specifier: '../x.js',
        },
        {
          chain: ['a/start.ts', 'x.ts', 'a/end.ts'],
          destinationPath: 'a/end.ts',
          importIndex: 1,
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

    const outcomes = findReEntryPaths(model);

    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.importIndex).toBe(1);
  });

  it('breaks ties deterministically by specifier when importIndex is identical', () => {
    const model = buildModel({
      crossings: [
        {
          chain: ['a/start.ts', 'x.ts', 'a/end.ts'],
          destinationPath: 'a/end.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'a/start.ts',
          specifier: '../second.js',
        },
        {
          chain: ['a/start.ts', 'x.ts', 'a/end.ts'],
          destinationPath: 'a/end.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'a/start.ts',
          specifier: '../first.js',
        },
      ],
      nodes: [
        { path: 'a/start.ts', treeOrigin: 'a' },
        { path: 'a/end.ts', treeOrigin: 'a' },
        { path: 'x.ts', treeOrigin: null },
      ],
      trees: ['a'],
    });

    const outcomes = findReEntryPaths(model);

    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.specifier).toBe('../first.js');
  });

  it('handles cycles among intermediate trees without infinite loops', () => {
    const model = buildModel({
      crossings: [
        {
          chain: ['a/start.ts', 'x.ts', 'b/one.ts'],
          destinationPath: 'b/one.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'a/start.ts',
          specifier: '../x.js',
        },
        {
          chain: ['b/two.ts', 'y.ts', 'a/end.ts'],
          destinationPath: 'a/end.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'b/two.ts',
          specifier: '../y.js',
        },
      ],
      edges: [
        makeEdge('b/one.ts', 'b/two.ts'),
        makeEdge('b/two.ts', 'b/one.ts'),
      ],
      nodes: [
        { path: 'a/start.ts', treeOrigin: 'a' },
        { path: 'a/end.ts', treeOrigin: 'a' },
        { path: 'b/one.ts', treeOrigin: 'b' },
        { path: 'b/two.ts', treeOrigin: 'b' },
        { path: 'x.ts', treeOrigin: null },
        { path: 'y.ts', treeOrigin: null },
      ],
      trees: ['a', 'b'],
    });

    const outcomes = findReEntryPaths(model);

    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.chain).toEqual([
      'a/start.ts',
      'x.ts',
      'b/one.ts',
      'b/two.ts',
      'y.ts',
      'a/end.ts',
    ]);
  });

  it('records re-entry when the path returns to the exact same source node', () => {
    const model = buildModel({
      crossings: [
        {
          chain: ['a/cycle.ts', 'x.ts', 'a/cycle.ts'],
          destinationPath: 'a/cycle.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'a/cycle.ts',
          specifier: '../x.js',
        },
      ],
      nodes: [
        { path: 'a/cycle.ts', treeOrigin: 'a' },
        { path: 'x.ts', treeOrigin: null },
      ],
      trees: ['a'],
    });

    const outcomes = findReEntryPaths(model);

    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.chain).toEqual(['a/cycle.ts', 'x.ts', 'a/cycle.ts']);
    expect(outcomes[0]?.from).toBe('a/cycle.ts');
    expect(outcomes[0]?.to).toBe('a/cycle.ts');
  });

  it('ignores direct edges within Tree A that do not leave the tree', () => {
    const model = buildModel({
      crossings: [
        {
          chain: ['b/node.ts', 'x.ts', 'b/node.ts'],
          destinationPath: 'b/node.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'b/node.ts',
          specifier: '../x.js',
        },
      ],
      edges: [makeEdge('a/start.ts', 'a/end.ts')],
      nodes: [
        { path: 'a/start.ts', treeOrigin: 'a' },
        { path: 'a/end.ts', treeOrigin: 'a' },
        { path: 'b/node.ts', treeOrigin: 'b' },
        { path: 'x.ts', treeOrigin: null },
      ],
      trees: ['a', 'b'],
    });

    const outcomes = findReEntryPaths(model);

    expect(outcomes.some((item) => item.from.startsWith('a/'))).toBe(false);
  });

  it('does not treat a Foreign Node as a logical destination for re-entry', () => {
    const model = buildModel({
      crossings: [
        {
          chain: ['src/main.ts', 'external.ts', 'src/foreign.ts'],
          destinationPath: 'src/foreign.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'src/main.ts',
          specifier: '../external.js',
        },
      ],
      foreignNodes: ['src/foreign.ts'],
      nodes: [
        { path: 'src/main.ts', treeOrigin: 'src' },
        { path: 'src/foreign.ts', treeOrigin: 'src' },
        { path: 'external.ts', treeOrigin: null },
      ],
      trees: ['src'],
    });

    expect(findReEntryPaths(model)).toEqual([]);
  });

  it('prunes dominated non-external states when exploring intermediate nodes', () => {
    const model = buildModel({
      crossings: [
        {
          chain: ['b/end.ts', 'x.ts', 'a/target.ts'],
          destinationPath: 'a/target.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'b/end.ts',
          specifier: '../x.js',
        },
      ],
      edges: [
        makeEdge('a/start.ts', 'b/one.ts'),
        makeEdge('b/one.ts', 'b/end.ts'),
        makeEdge('b/one.ts', 'b/loop.ts'),
        makeEdge('b/loop.ts', 'b/end.ts'),
      ],
      nodes: [
        { path: 'a/start.ts', treeOrigin: 'a' },
        { path: 'a/target.ts', treeOrigin: 'a' },
        { path: 'b/one.ts', treeOrigin: 'b' },
        { path: 'b/loop.ts', treeOrigin: 'b' },
        { path: 'b/end.ts', treeOrigin: 'b' },
        { path: 'x.ts', treeOrigin: null },
      ],
      trees: ['a', 'b'],
    });

    const outcomes = findReEntryPaths(model);

    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.chain).toEqual([
      'a/start.ts',
      'b/one.ts',
      'b/end.ts',
      'x.ts',
      'a/target.ts',
    ]);
  });

  it('prunes dominated external states reaching the same intermediate node with longer path', () => {
    const model = buildModel({
      crossings: [
        {
          chain: ['a/start.ts', 'x1.ts', 'b/mid.ts'],
          destinationPath: 'b/mid.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'a/start.ts',
          specifier: '../x1.js',
        },
        {
          chain: ['a/start.ts', 'x2.ts', 'b/entry.ts'],
          destinationPath: 'b/entry.ts',
          importIndex: 1,
          position: { column: 1, line: 2 },
          sourcePath: 'a/start.ts',
          specifier: '../x2.js',
        },
        {
          chain: ['b/mid.ts', 'y.ts', 'a/target.ts'],
          destinationPath: 'a/target.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'b/mid.ts',
          specifier: '../y.js',
        },
      ],
      edges: [makeEdge('b/entry.ts', 'b/mid.ts')],
      nodes: [
        { path: 'a/start.ts', treeOrigin: 'a' },
        { path: 'a/target.ts', treeOrigin: 'a' },
        { path: 'b/entry.ts', treeOrigin: 'b' },
        { path: 'b/mid.ts', treeOrigin: 'b' },
        { path: 'x1.ts', treeOrigin: null },
        { path: 'x2.ts', treeOrigin: null },
        { path: 'y.ts', treeOrigin: null },
      ],
      trees: ['a', 'b'],
    });

    const outcomes = findReEntryPaths(model);

    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.chain).toEqual([
      'a/start.ts',
      'x1.ts',
      'b/mid.ts',
      'y.ts',
      'a/target.ts',
    ]);
  });

  it('explores and orders multiple candidate sources in the same tree deterministically', () => {
    const model = buildModel({
      crossings: [
        {
          chain: ['a/z-source.ts', 'x.ts', 'a/target.ts'],
          destinationPath: 'a/target.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'a/z-source.ts',
          specifier: '../x.js',
        },
        {
          chain: ['a/a-source.ts', 'y.ts', 'a/target.ts'],
          destinationPath: 'a/target.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'a/a-source.ts',
          specifier: '../y.js',
        },
      ],
      nodes: [
        { path: 'a/z-source.ts', treeOrigin: 'a' },
        { path: 'a/a-source.ts', treeOrigin: 'a' },
        { path: 'a/target.ts', treeOrigin: 'a' },
        { path: 'x.ts', treeOrigin: null },
        { path: 'y.ts', treeOrigin: null },
      ],
      trees: ['a'],
    });

    const outcomes = findReEntryPaths(model);

    expect(outcomes).toHaveLength(2);
    expect(outcomes[0]?.from).toBe('a/a-source.ts');
    expect(outcomes[1]?.from).toBe('a/z-source.ts');
  });

  it('selects lowest distance state first from the priority queue', () => {
    const model = buildModel({
      crossings: [
        {
          chain: ['a/start.ts', 'x1.ts', 'b/quick.ts'],
          destinationPath: 'b/quick.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'a/start.ts',
          specifier: '../x1.js',
        },
        {
          chain: ['a/start.ts', 'x2.ts', 'x3.ts', 'b/slow.ts'],
          destinationPath: 'b/slow.ts',
          importIndex: 1,
          position: { column: 1, line: 2 },
          sourcePath: 'a/start.ts',
          specifier: '../x2.js',
        },
        {
          chain: ['b/quick.ts', 'y1.ts', 'a/target.ts'],
          destinationPath: 'a/target.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'b/quick.ts',
          specifier: '../y1.js',
        },
        {
          chain: ['b/slow.ts', 'y2.ts', 'a/target.ts'],
          destinationPath: 'a/target.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'b/slow.ts',
          specifier: '../y2.js',
        },
      ],
      nodes: [
        { path: 'a/start.ts', treeOrigin: 'a' },
        { path: 'a/target.ts', treeOrigin: 'a' },
        { path: 'b/quick.ts', treeOrigin: 'b' },
        { path: 'b/slow.ts', treeOrigin: 'b' },
        { path: 'x1.ts', treeOrigin: null },
        { path: 'x2.ts', treeOrigin: null },
        { path: 'x3.ts', treeOrigin: null },
        { path: 'y1.ts', treeOrigin: null },
        { path: 'y2.ts', treeOrigin: null },
      ],
      trees: ['a', 'b'],
    });

    const outcomes = findReEntryPaths(model);

    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.chain).toEqual([
      'a/start.ts',
      'x1.ts',
      'b/quick.ts',
      'y1.ts',
      'a/target.ts',
    ]);
  });

  it('breaks ties in priority queue by chain path comparison', () => {
    const model = buildModel({
      crossings: [
        {
          chain: ['a/start.ts', 'x.ts', 'b/beta.ts'],
          destinationPath: 'b/beta.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'a/start.ts',
          specifier: '../x.js',
        },
        {
          chain: ['a/start.ts', 'x.ts', 'b/alpha.ts'],
          destinationPath: 'b/alpha.ts',
          importIndex: 1,
          position: { column: 1, line: 2 },
          sourcePath: 'a/start.ts',
          specifier: '../x.js',
        },
      ],
      edges: [
        makeEdge('b/beta.ts', 'a/target-beta.ts'),
        makeEdge('b/alpha.ts', 'a/target-alpha.ts'),
      ],
      nodes: [
        { path: 'a/start.ts', treeOrigin: 'a' },
        { path: 'a/target-alpha.ts', treeOrigin: 'a' },
        { path: 'a/target-beta.ts', treeOrigin: 'a' },
        { path: 'b/alpha.ts', treeOrigin: 'b' },
        { path: 'b/beta.ts', treeOrigin: 'b' },
        { path: 'x.ts', treeOrigin: null },
      ],
      trees: ['a', 'b'],
    });

    const outcomes = findReEntryPaths(model);

    expect(outcomes).toHaveLength(2);
    expect(outcomes.map((item) => item.to)).toEqual([
      'a/target-alpha.ts',
      'a/target-beta.ts',
    ]);
  });

  it('ignores a crossing starting from a Foreign Node', () => {
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
      ],
      foreignNodes: ['src/foreign.ts'],
      nodes: [
        { path: 'src/foreign.ts', treeOrigin: 'src' },
        { path: 'src/target.ts', treeOrigin: 'src' },
        { path: 'x.ts', treeOrigin: null },
      ],
      trees: ['src'],
    });

    expect(findReEntryPaths(model)).toEqual([]);
  });

  it('ignores graph edges connected to Foreign Nodes', () => {
    const model = buildModel({
      crossings: [
        {
          chain: ['src/start.ts', 'x.ts', 'b/mid.ts'],
          destinationPath: 'b/mid.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'src/start.ts',
          specifier: '../x.js',
        },
      ],
      edges: [
        makeEdge('src/foreign.ts', 'b/mid.ts'),
        makeEdge('b/mid.ts', 'src/foreign.ts'),
      ],
      foreignNodes: ['src/foreign.ts'],
      nodes: [
        { path: 'src/start.ts', treeOrigin: 'src' },
        { path: 'src/foreign.ts', treeOrigin: 'src' },
        { path: 'b/mid.ts', treeOrigin: 'b' },
        { path: 'x.ts', treeOrigin: null },
      ],
      trees: ['src', 'b'],
    });

    expect(findReEntryPaths(model)).toEqual([]);
  });

  it('handles paths missing from the inventory', () => {
    const model = buildModel({
      crossings: [
        {
          chain: ['a/start.ts', 'x.ts', 'a/target.ts'],
          destinationPath: 'a/target.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'a/start.ts',
          specifier: '../x.js',
        },
      ],
      edges: [makeEdge('a/start.ts', 'unindexed/missing.ts')],
      nodes: [
        { path: 'a/start.ts', treeOrigin: 'a' },
        { path: 'a/target.ts', treeOrigin: 'a' },
        { path: 'x.ts', treeOrigin: null },
      ],
      trees: ['a'],
    });

    const outcomes = findReEntryPaths(model);
    expect(outcomes).toHaveLength(1);
  });

  it('does not treat nodes with only internal edges as candidate sources', () => {
    const model = buildModel({
      crossings: [
        {
          chain: ['a/exit.ts', 'x.ts', 'a/target.ts'],
          destinationPath: 'a/target.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'a/exit.ts',
          specifier: '../x.js',
        },
      ],
      edges: [makeEdge('a/internal-only.ts', 'a/target.ts')],
      nodes: [
        { path: 'a/internal-only.ts', treeOrigin: 'a' },
        { path: 'a/exit.ts', treeOrigin: 'a' },
        { path: 'a/target.ts', treeOrigin: 'a' },
        { path: 'x.ts', treeOrigin: null },
      ],
      trees: ['a'],
    });

    const outcomes = findReEntryPaths(model);
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.from).toBe('a/exit.ts');
  });

  it('correctly weighs crossings when competing against a path of graph edges', () => {
    const model = buildModel({
      crossings: [
        {
          chain: ['a/start.ts', 'x.ts', 'a/target.ts'],
          destinationPath: 'a/target.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'a/start.ts',
          specifier: '../x.js',
        },
        {
          chain: ['b/two.ts', 'y.ts', 'a/target.ts'],
          destinationPath: 'a/target.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'b/two.ts',
          specifier: '../y.js',
        },
      ],
      edges: [
        makeEdge('a/start.ts', 'b/one.ts'),
        makeEdge('b/one.ts', 'b/two.ts'),
      ],
      nodes: [
        { path: 'a/start.ts', treeOrigin: 'a' },
        { path: 'a/target.ts', treeOrigin: 'a' },
        { path: 'b/one.ts', treeOrigin: 'b' },
        { path: 'b/two.ts', treeOrigin: 'b' },
        { path: 'x.ts', treeOrigin: null },
        { path: 'y.ts', treeOrigin: null },
      ],
      trees: ['a', 'b'],
    });

    const outcomes = findReEntryPaths(model);
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.chain).toEqual(['a/start.ts', 'x.ts', 'a/target.ts']);
  });

  it('prunes duplicate visits to the same intermediate node with equal distance', () => {
    const model = buildModel({
      crossings: [
        {
          chain: ['b/mid.ts', 'y.ts', 'a/target.ts'],
          destinationPath: 'a/target.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'b/mid.ts',
          specifier: '../y.js',
        },
      ],
      edges: [
        makeEdge('a/start.ts', 'b/alt1.ts'),
        makeEdge('b/alt1.ts', 'b/mid.ts'),
        makeEdge('a/start.ts', 'b/alt2.ts'),
        makeEdge('b/alt2.ts', 'b/mid.ts'),
      ],
      nodes: [
        { path: 'a/start.ts', treeOrigin: 'a' },
        { path: 'a/target.ts', treeOrigin: 'a' },
        { path: 'b/alt1.ts', treeOrigin: 'b' },
        { path: 'b/alt2.ts', treeOrigin: 'b' },
        { path: 'b/mid.ts', treeOrigin: 'b' },
        { path: 'y.ts', treeOrigin: null },
      ],
      trees: ['a', 'b'],
    });

    const outcomes = findReEntryPaths(model);
    expect(outcomes).toHaveLength(1);
  });
});
