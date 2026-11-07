import { describe, expect, it } from 'vitest';

import type {
  TDependencyGraph,
  TEdgeMetadata,
} from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type { TExternalCrossing } from '../../../../_verify-project@shared/_types/_compounds/external-crossing.type.js';
import type { TEffectiveTree } from '../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type { TInventory } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TVerificationModel } from '../../../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { verificationModel } from '../../../../_verify-project@shared/_mocks/verification-model.mock.js';
import { checkInterTreeCycles } from './index.js';

const createEdge = (
  sourcePath: string,
  destinationPath: string,
  line = 1
): TEdgeMetadata => ({
  aliasAlternatives: [],
  aliasUsed: null,
  destinationPath,
  importIndex: 0,
  isTypeOnly: false,
  position: { column: 1, line },
  sourcePath,
  specifier: `./${destinationPath}`,
  syntaxKind: 'side-effect-import',
});

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

const createModel = ({
  crossings = [],
  edges = [],
  files,
  trees,
}: {
  readonly crossings?: readonly TExternalCrossing[];
  readonly edges?: readonly (readonly [string, string])[];
  readonly files: readonly (readonly [string, null | string])[];
  readonly trees: readonly string[];
}): TVerificationModel => {
  const base = verificationModel();
  const inventoryItems = files.map(([path, treeOrigin], id) => ({
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

  const edgeMetadata = edges.map(([src, destination], index) =>
    createEdge(src, destination, index + 1)
  );
  const graph: TDependencyGraph = {
    ...base.graph,
    edgeMetadata,
  };

  const effectiveTrees = trees.map((origin) => createTreeDeclaration(origin));

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
  };
};

describe('checkInterTreeCycles', () => {
  it('returns empty array when there are fewer than two trees', () => {
    const model = createModel({
      files: [['src/main.ts', 'src']],
      trees: ['src'],
    });
    expect(checkInterTreeCycles(model)).toEqual([]);
  });

  it('returns empty array for acyclic tree dependency chain and diamond', () => {
    const model = createModel({
      edges: [
        ['a/source.ts', 'b/target.ts'],
        ['b/source.ts', 'c/target.ts'],
        ['a/extra.ts', 'c/target.ts'],
      ],
      files: [
        ['a/source.ts', 'a'],
        ['a/extra.ts', 'a'],
        ['b/target.ts', 'b'],
        ['b/source.ts', 'b'],
        ['c/target.ts', 'c'],
      ],
      trees: ['a', 'b', 'c'],
    });
    expect(checkInterTreeCycles(model)).toEqual([]);
  });

  it('detects a cycle between two trees with direct edges', () => {
    const model = createModel({
      edges: [
        ['b/source.ts', 'a/target.ts'],
        ['a/source.ts', 'b/target.ts'],
      ],
      files: [
        ['a/source.ts', 'a'],
        ['a/target.ts', 'a'],
        ['b/source.ts', 'b'],
        ['b/target.ts', 'b'],
      ],
      trees: ['a', 'b'],
    });
    expect(checkInterTreeCycles(model)).toEqual([
      {
        constraint: 'acyclicity/inter-tree-cycle',
        cycle: [
          ['a/source.ts', 'b/target.ts'],
          ['b/source.ts', 'a/target.ts'],
        ],
        element: 'a/source.ts',
        family: 'acyclicity',
        message:
          "'a/source.ts' is part of a dependency cycle between Fractal Trees: a/source.ts -> b/target.ts; b/source.ts -> a/target.ts",
        normativeReference: 'FAF §7.2',
        position: { column: 1, line: 2 },
      },
    ]);
  });

  it('detects a cycle across three trees', () => {
    const model = createModel({
      edges: [
        ['a/source.ts', 'b/target.ts'],
        ['b/source.ts', 'c/target.ts'],
        ['c/source.ts', 'a/target.ts'],
      ],
      files: [
        ['a/source.ts', 'a'],
        ['a/target.ts', 'a'],
        ['b/source.ts', 'b'],
        ['b/target.ts', 'b'],
        ['c/source.ts', 'c'],
        ['c/target.ts', 'c'],
      ],
      trees: ['a', 'b', 'c'],
    });
    expect(checkInterTreeCycles(model)).toEqual([
      {
        constraint: 'acyclicity/inter-tree-cycle',
        cycle: [
          ['a/source.ts', 'b/target.ts'],
          ['b/source.ts', 'c/target.ts'],
          ['c/source.ts', 'a/target.ts'],
        ],
        element: 'a/source.ts',
        family: 'acyclicity',
        message:
          "'a/source.ts' is part of a dependency cycle between Fractal Trees: a/source.ts -> b/target.ts; b/source.ts -> c/target.ts; c/source.ts -> a/target.ts",
        normativeReference: 'FAF §7.2',
        position: { column: 1, line: 1 },
      },
    ]);
  });

  it('detects a cycle induced by an external crossing', () => {
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
        ['a/start.ts', 'a'],
        ['a/end.ts', 'a'],
        ['b/back.ts', 'b'],
        ['b/end.ts', 'b'],
        ['x.ts', null],
      ],
      trees: ['a', 'b'],
    });
    expect(checkInterTreeCycles(model)).toEqual([
      {
        constraint: 'acyclicity/inter-tree-cycle',
        cycle: [
          ['a/start.ts', 'x.ts', 'b/end.ts'],
          ['b/back.ts', 'a/end.ts'],
        ],
        element: 'a/start.ts',
        family: 'acyclicity',
        message:
          "'a/start.ts' is part of a dependency cycle between Fractal Trees: a/start.ts -> x.ts -> b/end.ts; b/back.ts -> a/end.ts",
        normativeReference: 'FAF §7.2',
        position: { column: 1, line: 1 },
      },
    ]);
  });

  it('ignores edges and crossings within the same tree', () => {
    const model = createModel({
      edges: [
        ['a/start.ts', 'a/middle.ts'],
        ['a/middle.ts', 'a/start.ts'],
      ],
      files: [
        ['a/start.ts', 'a'],
        ['a/middle.ts', 'a'],
        ['b/node.ts', 'b'],
      ],
      trees: ['a', 'b'],
    });
    expect(checkInterTreeCycles(model)).toEqual([]);
  });

  it('sorts multiple inter-tree cycle outcomes deterministically', () => {
    const model = createModel({
      edges: [
        ['x/1.ts', 'y/1.ts'],
        ['y/1.ts', 'x/1.ts'],
        ['a/1.ts', 'b/1.ts'],
        ['b/1.ts', 'a/1.ts'],
      ],
      files: [
        ['a/1.ts', 'a'],
        ['b/1.ts', 'b'],
        ['x/1.ts', 'x'],
        ['y/1.ts', 'y'],
      ],
      trees: ['a', 'b', 'x', 'y'],
    });
    const outcomes = checkInterTreeCycles(model);
    expect(outcomes).toHaveLength(2);
    expect(outcomes[0]?.element).toBe('a/1.ts');
    expect(outcomes[1]?.element).toBe('x/1.ts');
  });

  it('does not report a cycle purely in external code', () => {
    const model = createModel({
      edges: [
        ['x.ts', 'y.ts'],
        ['y.ts', 'x.ts'],
      ],
      files: [
        ['x.ts', null],
        ['y.ts', null],
        ['a/node.ts', 'a'],
        ['b/node.ts', 'b'],
      ],
      trees: ['a', 'b'],
    });
    expect(checkInterTreeCycles(model)).toEqual([]);
  });
});
