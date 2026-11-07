import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TNodeKind,
  TTaxonomyModel,
} from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type {
  TDependencyGraph,
  TEdgeMetadata,
} from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type { TInventory } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TVerificationModel } from '../../../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { verificationModel } from '../../../../_verify-project@shared/_mocks/verification-model.mock.js';
import { checkDependencyCycles } from './index.js';

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

const createModel = ({
  edges,
  files,
}: {
  readonly edges: readonly (readonly [string, string])[];
  readonly files: readonly (readonly [
    string,
    null | TNodeKind,
    null | string,
  ])[];
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

  const edgeMetadata = edges.map(([src, destination], index) =>
    createEdge(src, destination, index + 1)
  );
  const graph: TDependencyGraph = {
    ...base.graph,
    edgeMetadata,
  };

  return {
    ...base,
    basis: {
      ...base.basis,
      inventory,
    },
    graph,
    taxonomy,
  };
};

describe('checkDependencyCycles', () => {
  it('returns empty array when there are no logical nodes', () => {
    const model = createModel({ edges: [], files: [] });
    expect(checkDependencyCycles(model)).toEqual([]);
  });

  it('returns empty array for acyclic chain and diamond graphs', () => {
    const model = createModel({
      edges: [
        ['src/a.ts', 'src/b.ts'],
        ['src/b.ts', 'src/c.ts'],
        ['src/a.ts', 'src/c.ts'],
      ],
      files: [
        ['src/a.ts', 'fragment-node', 'src'],
        ['src/b.ts', 'fragment-node', 'src'],
        ['src/c.ts', 'fragment-node', 'src'],
      ],
    });
    expect(checkDependencyCycles(model)).toEqual([]);
  });

  it('detects a self-loop as a single-vertex cycle', () => {
    const model = createModel({
      edges: [['src/a.ts', 'src/a.ts']],
      files: [['src/a.ts', 'fragment-node', 'src']],
    });
    expect(checkDependencyCycles(model)).toEqual([
      {
        constraint: 'acyclicity/dependency-cycle',
        cycle: [['src/a.ts', 'src/a.ts']],
        element: 'src/a.ts',
        family: 'acyclicity',
        message:
          "'src/a.ts' is part of a dependency cycle: src/a.ts -> src/a.ts",
        normativeReference: 'FAF §5',
        position: { column: 1, line: 1 },
      },
    ]);
  });

  it('detects a two-vertex cycle with canonical minimum start', () => {
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
    expect(checkDependencyCycles(model)).toEqual([
      {
        constraint: 'acyclicity/dependency-cycle',
        cycle: [['src/a.ts', 'src/b.ts', 'src/a.ts']],
        element: 'src/a.ts',
        family: 'acyclicity',
        message:
          "'src/a.ts' is part of a dependency cycle: src/a.ts -> src/b.ts -> src/a.ts",
        normativeReference: 'FAF §5',
        position: { column: 1, line: 2 },
      },
    ]);
  });

  it('detects a three-vertex cycle', () => {
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
    expect(checkDependencyCycles(model)).toEqual([
      {
        constraint: 'acyclicity/dependency-cycle',
        cycle: [['src/a.ts', 'src/b.ts', 'src/c.ts', 'src/a.ts']],
        element: 'src/a.ts',
        family: 'acyclicity',
        message:
          "'src/a.ts' is part of a dependency cycle: src/a.ts -> src/b.ts -> src/c.ts -> src/a.ts",
        normativeReference: 'FAF §5',
        position: { column: 1, line: 1 },
      },
    ]);
  });

  it('detects multiple disjoint cyclic components', () => {
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
    const outcomes = checkDependencyCycles(model);
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
    const outcomes = checkDependencyCycles(model);
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.cycle).toEqual([['src/a.ts', 'src/b.ts', 'src/a.ts']]);
  });

  it('handles a cycle where edge metadata is absent', () => {
    const base = createModel({
      edges: [
        ['src/a.ts', 'src/b.ts'],
        ['src/b.ts', 'src/a.ts'],
      ],
      files: [
        ['src/a.ts', 'fragment-node', 'src'],
        ['src/b.ts', 'fragment-node', 'src'],
      ],
    });
    const modelWithoutEdges: TVerificationModel = {
      ...base,
      graph: {
        ...base.graph,
        edgeMetadata: [],
      },
    };
    const outcomes = checkDependencyCycles(modelWithoutEdges);
    expect(outcomes).toEqual([]);
  });

  it('excludes foreign nodes and non-tree files from dependency cycle checks', () => {
    const model = createModel({
      edges: [
        ['external.ts', 'src/a.ts'],
        ['src/a.ts', 'external.ts'],
        ['src/foreign.ts', 'src/b.ts'],
        ['src/b.ts', 'src/foreign.ts'],
      ],
      files: [
        ['external.ts', 'fragment-node', null],
        ['src/foreign.ts', 'foreign-node', 'src'],
        ['src/a.ts', 'fragment-node', 'src'],
        ['src/b.ts', 'fragment-node', 'src'],
      ],
    });
    expect(checkDependencyCycles(model)).toEqual([]);
  });

  it('processes long chains without recursion or call stack overflow', () => {
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
    const outcomes = checkDependencyCycles(model);
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.cycle[0]?.length).toBe(count + 1);
  });
});
