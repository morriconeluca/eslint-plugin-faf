import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TLogicalDomainKind,
  TNodeKind,
  TRelationalQualifications,
  TRoleAttribution,
  TTaxonomyModel,
} from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEdgeMetadata } from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type { TEffectivePathAlias } from '../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { checkEdgeAliasAnchoring } from './index.js';

type TInventorySpec = {
  readonly domainKind?: TLogicalDomainKind;
  readonly id: number;
  readonly nodeKind?: TNodeKind;
  readonly path: string;
  readonly treeOrigin: null | string;
};

const defaultQualifications: TRelationalQualifications = {
  isParentCategory: false,
  isPathFragment: false,
  isPrivateCategory: false,
  isSubFragment: false,
  isSubLayer: false,
  parentFragmentPath: null,
};

const defaultRole: TRoleAttribution = {
  kind: 'absent',
  roleName: null,
};

const createInventoryAndTaxonomy = (
  specs: readonly TInventorySpec[]
): { readonly inventory: TInventory; readonly taxonomy: TTaxonomyModel } => {
  const items: TInventoryItem[] = [];
  for (const spec of specs) {
    items[spec.id] = {
      depth: 1,
      id: spec.id,
      isSymlink: false,
      kind: spec.domainKind === undefined ? 'file' : 'directory',
      parentId: null,
      path: spec.path,
      preorderEnd: spec.id,
      preorderStart: spec.id,
      realPath: `/project/${spec.path}`,
      treeOrigin: spec.treeOrigin,
    };
  }

  const pathToId = new Map(specs.map((spec) => [spec.path, spec.id]));
  const realPathToId = new Map(
    specs.map((spec) => [`/project/${spec.path}`, spec.id])
  );

  const classifications: TItemClassification[] = specs.map((spec) => ({
    domainKind: spec.domainKind ?? null,
    entryKind: spec.domainKind === undefined ? 'file' : 'directory',
    fragmentInternalRank: null,
    imposedRoleName: null,
    itemId: spec.id,
    nodeKind: spec.nodeKind ?? null,
    path: spec.path,
    relationalQualifications: defaultQualifications,
    role: defaultRole,
  }));

  const byItemId = new Map(classifications.map((item) => [item.itemId, item]));
  const byPath = new Map(classifications.map((item) => [item.path, item]));

  return {
    inventory: { items, pathToId, realPathToId },
    taxonomy: { byItemId, byPath, classifications },
  };
};

const createEdge = (
  options: Partial<TEdgeMetadata> & {
    destinationPath: string;
    sourcePath: string;
  }
): TEdgeMetadata => ({
  aliasAlternatives: options.aliasAlternatives ?? [],
  aliasUsed: options.aliasUsed ?? null,
  destinationPath: options.destinationPath,
  importIndex: options.importIndex ?? 0,
  isTypeOnly: false,
  position: options.position ?? { column: 1, line: 1 },
  sourcePath: options.sourcePath,
  specifier: options.specifier ?? './dummy.js',
  syntaxKind: 'side-effect-import',
});

describe('checkEdgeAliasAnchoring', () => {
  it('returns undefined when aliasUsed is null', () => {
    const { inventory, taxonomy } = createInventoryAndTaxonomy([
      { id: 0, path: 'src/high.ts', treeOrigin: 'src' },
      { id: 1, path: 'src/low.ts', treeOrigin: 'src' },
    ]);
    const edge = createEdge({
      aliasUsed: null,
      destinationPath: 'src/low.ts',
      sourcePath: 'src/high.ts',
    });
    expect(
      checkEdgeAliasAnchoring(edge, inventory, taxonomy, [])
    ).toBeUndefined();
  });

  it('returns undefined when sourcePath is not in inventory', () => {
    const { inventory, taxonomy } = createInventoryAndTaxonomy([
      { id: 1, path: 'src/low.ts', treeOrigin: 'src' },
    ]);
    const edge = createEdge({
      aliasUsed: '#shared',
      destinationPath: 'src/low.ts',
      sourcePath: 'src/high.ts',
    });
    expect(
      checkEdgeAliasAnchoring(edge, inventory, taxonomy, [])
    ).toBeUndefined();
  });

  it('returns undefined when destinationPath is not in inventory', () => {
    const { inventory, taxonomy } = createInventoryAndTaxonomy([
      { id: 0, path: 'src/high.ts', treeOrigin: 'src' },
    ]);
    const edge = createEdge({
      aliasUsed: '#shared',
      destinationPath: 'src/low.ts',
      sourcePath: 'src/high.ts',
    });
    expect(
      checkEdgeAliasAnchoring(edge, inventory, taxonomy, [])
    ).toBeUndefined();
  });

  it('returns undefined when both source and destination are outside all trees', () => {
    const { inventory, taxonomy } = createInventoryAndTaxonomy([
      { id: 0, path: 'outside1.ts', treeOrigin: null },
      { id: 1, path: 'outside2.ts', treeOrigin: null },
    ]);
    const edge = createEdge({
      aliasUsed: '#shared',
      destinationPath: 'outside2.ts',
      sourcePath: 'outside1.ts',
    });
    expect(
      checkEdgeAliasAnchoring(edge, inventory, taxonomy, [])
    ).toBeUndefined();
  });

  it('returns undefined when source is in a tree but destination is outside all trees', () => {
    const { inventory, taxonomy } = createInventoryAndTaxonomy([
      { id: 0, path: 'src/high.ts', treeOrigin: 'src' },
      { id: 1, path: 'outside.ts', treeOrigin: null },
    ]);
    const edge = createEdge({
      aliasUsed: '#shared',
      destinationPath: 'outside.ts',
      sourcePath: 'src/high.ts',
    });
    expect(
      checkEdgeAliasAnchoring(edge, inventory, taxonomy, [])
    ).toBeUndefined();
  });

  it('returns undefined when destination is in a different tree', () => {
    const { inventory, taxonomy } = createInventoryAndTaxonomy([
      { id: 0, path: 'src/high.ts', treeOrigin: 'src' },
      { id: 1, path: 'lib/low.ts', treeOrigin: 'lib' },
    ]);
    const edge = createEdge({
      aliasUsed: '#shared',
      destinationPath: 'lib/low.ts',
      sourcePath: 'src/high.ts',
    });
    expect(
      checkEdgeAliasAnchoring(edge, inventory, taxonomy, [])
    ).toBeUndefined();
  });

  it('returns diagnostic outcome when matched alias has empty targets and edge alternatives are empty', () => {
    const { inventory, taxonomy } = createInventoryAndTaxonomy([
      { id: 0, path: 'src/high.ts', treeOrigin: 'src' },
      { id: 1, path: 'src/low.ts', treeOrigin: 'src' },
    ]);
    const edge = createEdge({
      aliasAlternatives: [],
      aliasUsed: '#empty',
      destinationPath: 'src/low.ts',
      importIndex: 3,
      position: { column: 5, line: 10 },
      sourcePath: 'src/high.ts',
      specifier: '#empty/low.js',
    });
    const aliases: readonly TEffectivePathAlias[] = [
      { prefix: '#empty', source: 'common.aliases', targets: [] },
    ];
    const outcome = checkEdgeAliasAnchoring(edge, inventory, taxonomy, aliases);
    expect(outcome).toEqual({
      constraint: 'dependency/path-alias-anchoring',
      element: 'src/high.ts',
      family: 'dependency',
      from: 'src/high.ts',
      importIndex: 3,
      message:
        "'src/high.ts' imports 'src/low.ts' through '#empty/low.js': a Path Alias importing its own Fractal Tree must have a Fractal Branch of that Tree as base in every alternative",
      normativeReference: 'FAF §7.4',
      position: { column: 5, line: 10 },
      specifier: '#empty/low.js',
      to: 'src/low.ts',
    });
  });

  it('returns undefined when matched alias target is a fractal branch in the same tree', () => {
    const { inventory, taxonomy } = createInventoryAndTaxonomy([
      { id: 0, path: 'src/high.ts', treeOrigin: 'src' },
      { id: 1, path: 'src/_src@shared/low.ts', treeOrigin: 'src' },
      {
        domainKind: 'fractal-branch',
        id: 2,
        path: 'src/_src@shared',
        treeOrigin: 'src',
      },
    ]);
    const edge = createEdge({
      aliasUsed: '#shared',
      destinationPath: 'src/_src@shared/low.ts',
      sourcePath: 'src/high.ts',
      specifier: '#shared/low.js',
    });
    const aliases: readonly TEffectivePathAlias[] = [
      {
        prefix: '#shared',
        source: 'common.aliases',
        targets: ['src/_src@shared'],
      },
    ];
    expect(
      checkEdgeAliasAnchoring(edge, inventory, taxonomy, aliases)
    ).toBeUndefined();
  });

  it('returns diagnostic outcome when matched alias base is not in inventory', () => {
    const { inventory, taxonomy } = createInventoryAndTaxonomy([
      { id: 0, path: 'src/high.ts', treeOrigin: 'src' },
      { id: 1, path: 'src/low.ts', treeOrigin: 'src' },
    ]);
    const edge = createEdge({
      aliasUsed: '#missing',
      destinationPath: 'src/low.ts',
      sourcePath: 'src/high.ts',
      specifier: '#missing/low.js',
    });
    const aliases: readonly TEffectivePathAlias[] = [
      {
        prefix: '#missing',
        source: 'common.aliases',
        targets: ['src/nonexistent'],
      },
    ];
    const outcome = checkEdgeAliasAnchoring(edge, inventory, taxonomy, aliases);
    expect(outcome?.constraint).toBe('dependency/path-alias-anchoring');
  });

  it('returns diagnostic outcome when matched alias base belongs to a different tree', () => {
    const { inventory, taxonomy } = createInventoryAndTaxonomy([
      { id: 0, path: 'src/high.ts', treeOrigin: 'src' },
      { id: 1, path: 'src/low.ts', treeOrigin: 'src' },
      {
        domainKind: 'fractal-branch',
        id: 2,
        path: 'other/_other@shared',
        treeOrigin: 'other',
      },
    ]);
    const edge = createEdge({
      aliasUsed: '#other',
      destinationPath: 'src/low.ts',
      sourcePath: 'src/high.ts',
      specifier: '#other/low.js',
    });
    const aliases: readonly TEffectivePathAlias[] = [
      {
        prefix: '#other',
        source: 'common.aliases',
        targets: ['other/_other@shared'],
      },
    ];
    const outcome = checkEdgeAliasAnchoring(edge, inventory, taxonomy, aliases);
    expect(outcome?.constraint).toBe('dependency/path-alias-anchoring');
  });

  it('returns diagnostic outcome when base is in same tree but not in taxonomy', () => {
    const { inventory } = createInventoryAndTaxonomy([
      { id: 0, path: 'src/high.ts', treeOrigin: 'src' },
      { id: 1, path: 'src/low.ts', treeOrigin: 'src' },
      { id: 2, path: 'src/_src@shared', treeOrigin: 'src' },
    ]);
    const taxonomy: TTaxonomyModel = {
      byItemId: new Map(),
      byPath: new Map(),
      classifications: [],
    };
    const edge = createEdge({
      aliasUsed: '#shared',
      destinationPath: 'src/low.ts',
      sourcePath: 'src/high.ts',
      specifier: '#shared/low.js',
    });
    const aliases: readonly TEffectivePathAlias[] = [
      {
        prefix: '#shared',
        source: 'common.aliases',
        targets: ['src/_src@shared'],
      },
    ];
    const outcome = checkEdgeAliasAnchoring(edge, inventory, taxonomy, aliases);
    expect(outcome?.constraint).toBe('dependency/path-alias-anchoring');
  });

  it('returns diagnostic outcome when base classification is not a fractal branch', () => {
    const { inventory, taxonomy } = createInventoryAndTaxonomy([
      { id: 0, path: 'src/high.ts', treeOrigin: 'src' },
      { id: 1, path: 'src/low.ts', treeOrigin: 'src' },
      {
        domainKind: 'layer',
        id: 2,
        path: 'src/_src@shared/_ui',
        treeOrigin: 'src',
      },
    ]);
    const edge = createEdge({
      aliasUsed: '#layer',
      destinationPath: 'src/low.ts',
      sourcePath: 'src/high.ts',
      specifier: '#layer/low.js',
    });
    const aliases: readonly TEffectivePathAlias[] = [
      {
        prefix: '#layer',
        source: 'common.aliases',
        targets: ['src/_src@shared/_ui'],
      },
    ];
    const outcome = checkEdgeAliasAnchoring(edge, inventory, taxonomy, aliases);
    expect(outcome?.constraint).toBe('dependency/path-alias-anchoring');
  });

  it('returns diagnostic outcome when one alternative of multiple targets is not a fractal branch', () => {
    const { inventory, taxonomy } = createInventoryAndTaxonomy([
      { id: 0, path: 'src/high.ts', treeOrigin: 'src' },
      { id: 1, path: 'src/_src@shared/low.ts', treeOrigin: 'src' },
      {
        domainKind: 'fractal-branch',
        id: 2,
        path: 'src/_src@shared',
        treeOrigin: 'src',
      },
      {
        domainKind: 'fragment',
        id: 3,
        path: 'src/_utils/widget',
        treeOrigin: 'src',
      },
    ]);
    const edge = createEdge({
      aliasUsed: '#shared',
      destinationPath: 'src/_src@shared/low.ts',
      sourcePath: 'src/high.ts',
      specifier: '#shared/low.js',
    });
    const aliases: readonly TEffectivePathAlias[] = [
      {
        prefix: '#shared',
        source: 'package.json#imports',
        targets: ['src/_src@shared', 'src/_utils/widget'],
      },
    ];
    const outcome = checkEdgeAliasAnchoring(edge, inventory, taxonomy, aliases);
    expect(outcome?.constraint).toBe('dependency/path-alias-anchoring');
    expect(outcome?.from).toBe('src/high.ts');
    expect(outcome?.to).toBe('src/_src@shared/low.ts');
  });

  it('falls back to edge.aliasAlternatives when alias is not found in aliases list', () => {
    const { inventory, taxonomy } = createInventoryAndTaxonomy([
      { id: 0, path: 'src/high.ts', treeOrigin: 'src' },
      { id: 1, path: 'src/_src@shared/low.ts', treeOrigin: 'src' },
      {
        domainKind: 'fractal-branch',
        id: 2,
        path: 'src/_src@shared',
        treeOrigin: 'src',
      },
    ]);
    const edge = createEdge({
      aliasAlternatives: ['src/_src@shared'],
      aliasUsed: '#fallback',
      destinationPath: 'src/_src@shared/low.ts',
      sourcePath: 'src/high.ts',
      specifier: '#fallback/low.js',
    });
    expect(
      checkEdgeAliasAnchoring(edge, inventory, taxonomy, [])
    ).toBeUndefined();
  });

  it('looks up classification byPath when byItemId returns undefined', () => {
    const { inventory } = createInventoryAndTaxonomy([
      { id: 0, path: 'src/high.ts', treeOrigin: 'src' },
      { id: 1, path: 'src/_src@shared/low.ts', treeOrigin: 'src' },
      { id: 2, path: 'src/_src@shared', treeOrigin: 'src' },
    ]);
    const classification: TItemClassification = {
      domainKind: 'fractal-branch',
      entryKind: 'directory',
      fragmentInternalRank: null,
      imposedRoleName: null,
      itemId: 2,
      nodeKind: null,
      path: 'src/_src@shared',
      relationalQualifications: defaultQualifications,
      role: defaultRole,
    };
    const taxonomy: TTaxonomyModel = {
      byItemId: new Map(),
      byPath: new Map([['src/_src@shared', classification]]),
      classifications: [classification],
    };
    const edge = createEdge({
      aliasUsed: '#shared',
      destinationPath: 'src/_src@shared/low.ts',
      sourcePath: 'src/high.ts',
      specifier: '#shared/low.js',
    });
    const aliases: readonly TEffectivePathAlias[] = [
      {
        prefix: '#shared',
        source: 'common.aliases',
        targets: ['src/_src@shared'],
      },
    ];
    expect(
      checkEdgeAliasAnchoring(edge, inventory, taxonomy, aliases)
    ).toBeUndefined();
  });
});
