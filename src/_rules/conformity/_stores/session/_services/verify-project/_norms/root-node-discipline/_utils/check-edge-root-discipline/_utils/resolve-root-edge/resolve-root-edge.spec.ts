import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TNodeKind,
  TTaxonomyModel,
} from '../../../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEdgeMetadata } from '../../../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TVerificationModel } from '../../../../../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { verificationModel } from '../../../../../../_verify-project@shared/_mocks/verification-model.mock.js';
import { resolveRootEdge } from './index.js';

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
  destinationPath: string
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

  return { items: inventoryItems, pathToId, realPathToId: pathToId };
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

const buildModel = (items: readonly TTestItem[]): TVerificationModel => {
  const base = verificationModel();
  return {
    ...base,
    basis: {
      ...base.basis,
      inventory: buildInventoryFromItems(items),
    },
    taxonomy: buildTaxonomyFromItems(items),
  };
};

describe('resolveRootEdge', () => {
  it('returns undefined when destination is not a Root Node', () => {
    const model = buildModel([
      { id: 1, nodeKind: 'fragment-node', path: 'src/util.ts' },
      { id: 2, nodeKind: 'root-node', path: 'src/main.ts' },
    ]);

    expect(
      resolveRootEdge(makeEdge('src/main.ts', 'src/util.ts'), model)
    ).toBeUndefined();
  });

  it('returns undefined on self-import', () => {
    const model = buildModel([
      { id: 1, nodeKind: 'root-node', path: 'src/main.ts' },
    ]);

    expect(
      resolveRootEdge(makeEdge('src/main.ts', 'src/main.ts'), model)
    ).toBeUndefined();
  });

  it('returns undefined when source is missing from taxonomy', () => {
    const model = buildModel([
      { id: 1, nodeKind: 'root-node', path: 'src/main.ts' },
    ]);

    expect(
      resolveRootEdge(makeEdge('src/missing.ts', 'src/main.ts'), model)
    ).toBeUndefined();
  });

  it('returns undefined when source is a foreign-node', () => {
    const model = buildModel([
      { id: 1, nodeKind: 'foreign-node', path: 'src/foreign.ts' },
      { id: 2, nodeKind: 'root-node', path: 'src/main.ts' },
    ]);

    expect(
      resolveRootEdge(makeEdge('src/foreign.ts', 'src/main.ts'), model)
    ).toBeUndefined();
  });

  it('returns undefined when inventory item is missing', () => {
    const model = buildModel([
      { id: 1, nodeKind: 'root-node', path: 'src/main.ts' },
      { id: 2, nodeKind: 'root-node', path: 'src/other.ts' },
    ]);
    const corrupted: TVerificationModel = {
      ...model,
      basis: {
        ...model.basis,
        inventory: {
          ...model.basis.inventory,
          items: [],
        },
      },
    };

    expect(
      resolveRootEdge(makeEdge('src/main.ts', 'src/other.ts'), corrupted)
    ).toBeUndefined();
  });

  it('returns undefined when source treeOrigin is null', () => {
    const model = buildModel([
      {
        id: 1,
        nodeKind: 'fragment-node',
        path: 'external.ts',
        treeOrigin: null,
      },
      { id: 2, nodeKind: 'root-node', path: 'src/main.ts', treeOrigin: 'src' },
    ]);

    expect(
      resolveRootEdge(makeEdge('external.ts', 'src/main.ts'), model)
    ).toBeUndefined();
  });

  it('returns undefined when source and destination belong to different trees', () => {
    const model = buildModel([
      { id: 1, nodeKind: 'root-node', path: 'lib/main.ts', treeOrigin: 'lib' },
      { id: 2, nodeKind: 'root-node', path: 'src/main.ts', treeOrigin: 'src' },
    ]);

    expect(
      resolveRootEdge(makeEdge('lib/main.ts', 'src/main.ts'), model)
    ).toBeUndefined();
  });

  it('resolves edge when source is a Root Node', () => {
    const model = buildModel([
      { id: 1, nodeKind: 'root-node', path: 'src/high.ts' },
      { id: 2, nodeKind: 'root-node', path: 'src/low.ts' },
    ]);
    const resolved = resolveRootEdge(
      makeEdge('src/high.ts', 'src/low.ts'),
      model
    );

    expect(resolved?.isSourceRootNode).toBe(true);
    expect(resolved?.sourceItem.path).toBe('src/high.ts');
    expect(resolved?.destinationItem.path).toBe('src/low.ts');
  });

  it('resolves edge when source is not a Root Node', () => {
    const model = buildModel([
      { id: 1, nodeKind: 'fragment-node', path: 'src/util.ts' },
      { id: 2, nodeKind: 'root-node', path: 'src/main.ts' },
    ]);
    const resolved = resolveRootEdge(
      makeEdge('src/util.ts', 'src/main.ts'),
      model
    );

    expect(resolved?.isSourceRootNode).toBe(false);
    expect(resolved?.sourceItem.path).toBe('src/util.ts');
    expect(resolved?.destinationItem.path).toBe('src/main.ts');
  });
});
