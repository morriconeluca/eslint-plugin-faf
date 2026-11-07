import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TNodeKind,
  TTaxonomyModel,
} from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEdgeMetadata } from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type {
  THorizontalHierarchies,
  THorizontalHierarchySet,
} from '../../../../_verify-project@shared/_types/_compounds/horizontal-hierarchies.type.js';
import type {
  TEffectiveRootFragment,
  TEffectiveTree,
} from '../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TVerificationModel } from '../../../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { verificationModel } from '../../../../_verify-project@shared/_mocks/verification-model.mock.js';
import { checkEdgeRootDiscipline } from './check-edge-root-discipline.util.js';

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

const buildInventory = (items: readonly TTestItem[]): TInventory => {
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

  return { items: inventoryItems, pathToId, realPathToId: pathToId };
};

const buildTaxonomy = (items: readonly TTestItem[]): TTaxonomyModel => {
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

const buildTestModel = (options: {
  readonly items: readonly TTestItem[];
  readonly rootFragments?: readonly TEffectiveRootFragment[];
  readonly sets?: readonly THorizontalHierarchySet[];
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
      inventory: buildInventory(options.items),
    },
    hierarchies,
    taxonomy: buildTaxonomy(options.items),
  };
};

describe('checkEdgeRootDiscipline', () => {
  it('returns undefined when edge is unresolved by resolveRootEdge', () => {
    const model = buildTestModel({
      items: [
        { id: 0, kind: 'directory', path: 'src' },
        { id: 1, nodeKind: 'fragment-node', path: 'src/util.ts' },
        { id: 2, nodeKind: 'root-node', path: 'src/main.ts' },
      ],
    });
    const edge = makeEdge('src/main.ts', 'src/util.ts');

    expect(checkEdgeRootDiscipline(edge, model)).toBeUndefined();
  });

  it('returns an outcome when source is not a Root Node', () => {
    const model = buildTestModel({
      items: [
        { id: 0, kind: 'directory', path: 'src' },
        { id: 1, nodeKind: 'fragment-node', path: 'src/util.ts' },
        { id: 2, nodeKind: 'root-node', path: 'src/main.ts' },
      ],
    });
    const edge = makeEdge('src/util.ts', 'src/main.ts', {
      importIndex: 2,
      position: { column: 5, line: 10 },
      specifier: './main.js',
    });
    const outcome = checkEdgeRootDiscipline(edge, model);

    expect(outcome).toEqual({
      constraint: 'dependency/root-node-discipline',
      element: 'src/util.ts',
      family: 'dependency',
      from: 'src/util.ts',
      importIndex: 2,
      message:
        "'src/util.ts' imports 'src/main.ts' through './main.js': a Root Node is importable only by Root Nodes authorized by rootNodes or dependencyEdges",
      normativeReference: 'FAF §6.2.2',
      position: { column: 5, line: 10 },
      specifier: './main.js',
      to: 'src/main.ts',
    });
  });

  it('returns an outcome when source is a Root Node but edge is unauthorized', () => {
    const model = buildTestModel({
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
    const edge = makeEdge('src/high.ts', 'src/low.ts');

    expect(checkEdgeRootDiscipline(edge, model)).toBeDefined();
  });

  it('returns undefined when source is a Root Node and edge is authorized', () => {
    const model = buildTestModel({
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
    const edge = makeEdge('src/high.ts', 'src/low.ts');

    expect(checkEdgeRootDiscipline(edge, model)).toBeUndefined();
  });
});
