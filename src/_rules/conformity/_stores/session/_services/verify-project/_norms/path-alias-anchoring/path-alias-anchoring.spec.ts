import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TLogicalDomainKind,
  TNodeKind,
  TRelationalQualifications,
  TRoleAttribution,
  TTaxonomyModel,
} from '../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEdgeMetadata } from '../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type { TEffectivePathAlias } from '../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyPathAliasAnchoring } from './path-alias-anchoring.norm.js';

type TItemSpec = {
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

const createTestModel = (options: {
  readonly aliases?: readonly TEffectivePathAlias[];
  readonly edges: readonly TEdgeMetadata[];
  readonly items: readonly TItemSpec[];
}): TVerificationModel => {
  const base = verificationModel();
  const inventoryItems: TInventoryItem[] = [];
  for (const item of options.items) {
    inventoryItems[item.id] = {
      depth: 1,
      id: item.id,
      isSymlink: false,
      kind: item.domainKind === undefined ? 'file' : 'directory',
      parentId: null,
      path: item.path,
      preorderEnd: item.id,
      preorderStart: item.id,
      realPath: `/project/${item.path}`,
      treeOrigin: item.treeOrigin,
    };
  }

  const pathToId = new Map(options.items.map((item) => [item.path, item.id]));
  const realPathToId = new Map(
    options.items.map((item) => [`/project/${item.path}`, item.id])
  );

  const classifications: TItemClassification[] = options.items.map((item) => ({
    domainKind: item.domainKind ?? null,
    entryKind: item.domainKind === undefined ? 'file' : 'directory',
    fragmentInternalRank: null,
    imposedRoleName: null,
    itemId: item.id,
    nodeKind: item.nodeKind ?? null,
    path: item.path,
    relationalQualifications: defaultQualifications,
    role: defaultRole,
  }));

  const byItemId = new Map(classifications.map((item) => [item.itemId, item]));
  const byPath = new Map(classifications.map((item) => [item.path, item]));

  const inventory: TInventory = {
    items: inventoryItems,
    pathToId,
    realPathToId,
  };

  const taxonomy: TTaxonomyModel = {
    byItemId,
    byPath,
    classifications,
  };

  const aliases = options.aliases ?? [];

  return {
    ...base,
    basis: {
      ...base.basis,
      aliases,
      inventory,
    },
    graph: {
      ...base.graph,
      edgeMetadata: options.edges,
    },
    taxonomy,
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

const commonItems: readonly TItemSpec[] = [
  { id: 0, path: 'src/high.ts', treeOrigin: 'src' },
  { id: 1, path: 'src/target.ts', treeOrigin: 'src' },
];

const baseTableCases: readonly {
  readonly allowed: boolean;
  readonly baseItem: TItemSpec;
  readonly label: string;
}[] = [
  {
    allowed: true,
    baseItem: {
      domainKind: 'fractal-branch',
      id: 2,
      path: 'src/_src@shared',
      treeOrigin: 'src',
    },
    label: 'Fractal Branch',
  },
  {
    allowed: true,
    baseItem: {
      domainKind: 'fractal-branch',
      id: 2,
      path: 'src/_src@shared/_types/_types@shared',
      treeOrigin: 'src',
    },
    label: 'nested Fractal Branch',
  },
  {
    allowed: false,
    baseItem: {
      domainKind: 'root-fragment',
      id: 2,
      path: 'src',
      treeOrigin: 'src',
    },
    label: 'Root Fragment origin',
  },
  {
    allowed: false,
    baseItem: {
      domainKind: 'root-layer',
      id: 2,
      path: 'src',
      treeOrigin: 'src',
    },
    label: 'Root Layer origin',
  },
  {
    allowed: false,
    baseItem: {
      domainKind: 'root-fragment',
      id: 2,
      path: 'src/child',
      treeOrigin: 'src',
    },
    label: 'nested Root Fragment',
  },
  {
    allowed: false,
    baseItem: {
      domainKind: 'fragment',
      id: 2,
      path: 'src/_utils/widget',
      treeOrigin: 'src',
    },
    label: 'Fragment',
  },
  {
    allowed: false,
    baseItem: {
      domainKind: 'category',
      id: 2,
      path: 'src/_types',
      treeOrigin: 'src',
    },
    label: 'Category',
  },
  {
    allowed: false,
    baseItem: {
      domainKind: 'category',
      id: 2,
      path: 'src/_types',
      treeOrigin: 'src',
    },
    label: 'Private Category',
  },
  {
    allowed: false,
    baseItem: {
      domainKind: 'sub-category',
      id: 2,
      path: 'src/_types/_base',
      treeOrigin: 'src',
    },
    label: 'Sub-Category',
  },
  {
    allowed: false,
    baseItem: {
      domainKind: 'path-sub-category',
      id: 2,
      path: 'src/_utils/_users',
      treeOrigin: 'src',
    },
    label: 'Path Sub-Category',
  },
  {
    allowed: false,
    baseItem: {
      domainKind: 'layer',
      id: 2,
      path: 'src/_src@shared/_ui',
      treeOrigin: 'src',
    },
    label: 'Layer',
  },
  {
    allowed: false,
    baseItem: {
      domainKind: 'foreign-domain',
      id: 2,
      path: 'src/static',
      treeOrigin: 'src',
    },
    label: 'Foreign Domain',
  },
  {
    allowed: false,
    baseItem: {
      id: 2,
      nodeKind: 'access-node',
      path: 'src/_utils/widget/index.ts',
      treeOrigin: 'src',
    },
    label: 'unexposed Access Node',
  },
  {
    allowed: false,
    baseItem: {
      id: 2,
      nodeKind: 'category-node',
      path: 'src/_types/a.type.ts',
      treeOrigin: 'src',
    },
    label: 'unexposed Category Node',
  },
  {
    allowed: false,
    baseItem: {
      id: 2,
      nodeKind: 'root-node',
      path: 'src/low.ts',
      treeOrigin: 'src',
    },
    label: 'unexposed Root Node',
  },
  {
    allowed: false,
    baseItem: {
      id: 2,
      nodeKind: 'access-node',
      path: 'src/_utils/widget/index.ts',
      treeOrigin: 'src',
    },
    label: 'structurally exposed Access Node',
  },
  {
    allowed: false,
    baseItem: {
      id: 2,
      nodeKind: 'category-node',
      path: 'src/_types/a.type.ts',
      treeOrigin: 'src',
    },
    label: 'structurally exposed Category Node',
  },
  {
    allowed: false,
    baseItem: {
      id: 2,
      nodeKind: 'root-node',
      path: 'src/low.ts',
      treeOrigin: 'src',
    },
    label: 'formally exposed Root Node',
  },
];

describe('verifyPathAliasAnchoring', () => {
  it.each(baseTableCases)(
    'verifies base classification row: $label (allowed: $allowed)',
    ({ allowed, baseItem }) => {
      const model = createTestModel({
        aliases: [
          {
            prefix: '#base',
            source: 'package.json#imports',
            targets: [baseItem.path],
          },
        ],
        edges: [
          createEdge({
            aliasUsed: '#base',
            destinationPath: 'src/target.ts',
            sourcePath: 'src/high.ts',
            specifier: '#base/target.js',
          }),
        ],
        items: [...commonItems, baseItem],
      });

      const outcomes = verifyPathAliasAnchoring(model);
      if (allowed) {
        expect(outcomes).toEqual([]);
      } else {
        expect(outcomes).toHaveLength(1);
        expect(outcomes[0]?.constraint).toBe('dependency/path-alias-anchoring');
        expect(outcomes[0]?.family).toBe('dependency');
        expect(outcomes[0]?.normativeReference).toBe('FAF §7.4');
        expect(outcomes[0]).toMatchObject({
          from: 'src/high.ts',
          specifier: '#base/target.js',
          to: 'src/target.ts',
        });
      }
    }
  );

  it('rejects an alias whose text mimics a branch but whose base is a layer', () => {
    const layerBase: TItemSpec = {
      domainKind: 'layer',
      id: 2,
      path: 'src/_src@shared/_ui',
      treeOrigin: 'src',
    };
    const model = createTestModel({
      aliases: [
        {
          prefix: '#_src@shared',
          source: 'common.aliases',
          targets: ['src/_src@shared/_ui'],
        },
      ],
      edges: [
        createEdge({
          aliasUsed: '#_src@shared',
          destinationPath: 'src/target.ts',
          position: { column: 1, line: 2 },
          sourcePath: 'src/high.ts',
          specifier: '#_src@shared/target.js',
        }),
      ],
      items: [...commonItems, layerBase],
    });

    const outcomes = verifyPathAliasAnchoring(model);
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.constraint).toBe('dependency/path-alias-anchoring');
    expect(outcomes[0]).toMatchObject({
      specifier: '#_src@shared/target.js',
    });
  });

  it('admits an alias whose text does not mention shared but whose base is a branch', () => {
    const branchBase: TItemSpec = {
      domainKind: 'fractal-branch',
      id: 2,
      path: 'src/_src@shared',
      treeOrigin: 'src',
    };
    const model = createTestModel({
      aliases: [
        {
          prefix: '#arbitrary',
          source: 'common.aliases',
          targets: ['src/_src@shared'],
        },
      ],
      edges: [
        createEdge({
          aliasUsed: '#arbitrary',
          destinationPath: 'src/target.ts',
          sourcePath: 'src/high.ts',
          specifier: '#arbitrary/target.js',
        }),
      ],
      items: [...commonItems, branchBase],
    });

    expect(verifyPathAliasAnchoring(model)).toEqual([]);
  });

  it('rejects when one alternative of conditional targets is not a fractal branch', () => {
    const branchBase: TItemSpec = {
      domainKind: 'fractal-branch',
      id: 2,
      path: 'src/_src@shared',
      treeOrigin: 'src',
    };
    const fragmentBase: TItemSpec = {
      domainKind: 'fragment',
      id: 3,
      path: 'src/_utils/widget',
      treeOrigin: 'src',
    };
    const model = createTestModel({
      aliases: [
        {
          prefix: '#shared',
          source: 'package.json#imports',
          targets: ['src/_src@shared', 'src/_utils/widget'],
        },
      ],
      edges: [
        createEdge({
          aliasUsed: '#shared',
          destinationPath: 'src/target.ts',
          sourcePath: 'src/high.ts',
          specifier: '#shared/target.js',
        }),
      ],
      items: [...commonItems, branchBase, fragmentBase],
    });

    const outcomes = verifyPathAliasAnchoring(model);
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.constraint).toBe('dependency/path-alias-anchoring');
  });

  it('admits when all alternatives of conditional targets are fractal branches', () => {
    const branchBase1: TItemSpec = {
      domainKind: 'fractal-branch',
      id: 2,
      path: 'src/_src@shared',
      treeOrigin: 'src',
    };
    const branchBase2: TItemSpec = {
      domainKind: 'fractal-branch',
      id: 3,
      path: 'src/_src@shared/_types/_types@shared',
      treeOrigin: 'src',
    };
    const model = createTestModel({
      aliases: [
        {
          prefix: '#shared',
          source: 'package.json#imports',
          targets: ['src/_src@shared', 'src/_src@shared/_types/_types@shared'],
        },
      ],
      edges: [
        createEdge({
          aliasUsed: '#shared',
          destinationPath: 'src/target.ts',
          sourcePath: 'src/high.ts',
          specifier: '#shared/target.js',
        }),
      ],
      items: [...commonItems, branchBase1, branchBase2],
    });

    expect(verifyPathAliasAnchoring(model)).toEqual([]);
  });

  it('sorts edge outcomes deterministically regardless of input permutation', () => {
    const branchBase: TItemSpec = {
      domainKind: 'fractal-branch',
      id: 2,
      path: 'src/_src@shared',
      treeOrigin: 'src',
    };
    const invalidBase: TItemSpec = {
      domainKind: 'layer',
      id: 3,
      path: 'src/_src@shared/_ui',
      treeOrigin: 'src',
    };
    const edgeA = createEdge({
      aliasUsed: '#invalid',
      destinationPath: 'src/target.ts',
      importIndex: 0,
      position: { column: 1, line: 1 },
      sourcePath: 'src/a.ts',
      specifier: '#invalid/target.js',
    });
    const edgeB = createEdge({
      aliasUsed: '#invalid',
      destinationPath: 'src/target.ts',
      importIndex: 1,
      position: { column: 1, line: 5 },
      sourcePath: 'src/a.ts',
      specifier: '#invalid/target.js',
    });
    const edgeC = createEdge({
      aliasUsed: '#invalid',
      destinationPath: 'src/target.ts',
      importIndex: 0,
      position: { column: 1, line: 1 },
      sourcePath: 'src/b.ts',
      specifier: '#invalid/target.js',
    });

    const items: readonly TItemSpec[] = [
      { id: 0, path: 'src/a.ts', treeOrigin: 'src' },
      { id: 1, path: 'src/b.ts', treeOrigin: 'src' },
      { id: 4, path: 'src/target.ts', treeOrigin: 'src' },
      branchBase,
      invalidBase,
    ];
    const aliases: readonly TEffectivePathAlias[] = [
      {
        prefix: '#invalid',
        source: 'common.aliases',
        targets: ['src/_src@shared/_ui'],
      },
    ];

    const modelForward = createTestModel({
      aliases,
      edges: [edgeA, edgeB, edgeC],
      items,
    });
    const modelPermuted = createTestModel({
      aliases,
      edges: [edgeC, edgeA, edgeB],
      items,
    });

    const forwardOutcomes = verifyPathAliasAnchoring(modelForward);
    const permutedOutcomes = verifyPathAliasAnchoring(modelPermuted);

    expect(forwardOutcomes).toHaveLength(3);
    expect(forwardOutcomes).toEqual(permutedOutcomes);
    expect(forwardOutcomes[0]).toMatchObject({
      from: 'src/a.ts',
      position: { line: 1 },
    });
    expect(forwardOutcomes[1]).toMatchObject({
      from: 'src/a.ts',
      position: { line: 5 },
    });
    expect(forwardOutcomes[2]).toMatchObject({
      from: 'src/b.ts',
    });
  });

  it('preserves model immutability without mutation', () => {
    const branchBase: TItemSpec = {
      domainKind: 'fractal-branch',
      id: 2,
      path: 'src/_src@shared',
      treeOrigin: 'src',
    };
    const model = createTestModel({
      aliases: [
        {
          prefix: '#shared',
          source: 'common.aliases',
          targets: ['src/_src@shared'],
        },
      ],
      edges: [
        createEdge({
          aliasUsed: '#shared',
          destinationPath: 'src/target.ts',
          sourcePath: 'src/high.ts',
          specifier: '#shared/target.js',
        }),
      ],
      items: [...commonItems, branchBase],
    });

    Object.freeze(model);
    Object.freeze(model.basis);
    Object.freeze(model.basis.inventory);
    Object.freeze(model.basis.aliases);
    Object.freeze(model.graph);
    Object.freeze(model.graph.edgeMetadata);
    Object.freeze(model.taxonomy);

    expect(() => verifyPathAliasAnchoring(model)).not.toThrow();
    expect(verifyPathAliasAnchoring(model)).toEqual([]);
  });

  it('produces no outcomes for unused aliases', () => {
    const invalidBase: TItemSpec = {
      domainKind: 'layer',
      id: 2,
      path: 'src/_src@shared/_ui',
      treeOrigin: 'src',
    };
    const model = createTestModel({
      aliases: [
        {
          prefix: '#unused',
          source: 'common.aliases',
          targets: ['src/_src@shared/_ui'],
        },
      ],
      edges: [],
      items: [...commonItems, invalidBase],
    });

    expect(verifyPathAliasAnchoring(model)).toEqual([]);
  });

  it('produces no outcomes for alias imports targeting another tree', () => {
    const crossTreeTarget: TItemSpec = {
      id: 3,
      path: 'lib/low.ts',
      treeOrigin: 'lib',
    };
    const model = createTestModel({
      aliases: [
        {
          prefix: '#lib',
          source: 'common.aliases',
          targets: ['lib'],
        },
      ],
      edges: [
        createEdge({
          aliasUsed: '#lib',
          destinationPath: 'lib/low.ts',
          sourcePath: 'src/high.ts',
          specifier: '#lib/low.js',
        }),
      ],
      items: [...commonItems, crossTreeTarget],
    });

    expect(verifyPathAliasAnchoring(model)).toEqual([]);
  });

  it('produces no outcomes for direct relative imports without alias', () => {
    const model = createTestModel({
      aliases: [],
      edges: [
        createEdge({
          aliasUsed: null,
          destinationPath: 'src/target.ts',
          sourcePath: 'src/high.ts',
          specifier: './target.js',
        }),
      ],
      items: [...commonItems],
    });

    expect(verifyPathAliasAnchoring(model)).toEqual([]);
  });
});
