import { describe, expect, it } from 'vitest';

import type { TLogicalDomainKind } from '../../../../_conformity@shared/_types/verification-model.type.js';

import { hierarchyFixture } from '../../_derive-horizontal-hierarchies@shared/_mocks/hierarchy-fixture.mock.js';
import { deriveDomainHierarchies } from './derive-domain-hierarchies.util.js';

describe('deriveDomainHierarchies', () => {
  it('applies horizontalHierarchyModels to Category, Private Category and Sub-Category parents when at least one Sub-Category child matches', () => {
    for (const [parentKind, isPrivateCategory] of [
      ['category', false],
      ['category', true],
      ['sub-category', false],
    ] as const) {
      const { context } = hierarchyFixture(
        [
          {
            domainKind: parentKind,
            path: 'src/_utils',
            relationalQualifications: { isPrivateCategory },
          },
          { domainKind: 'sub-category', path: 'src/_utils/_compounds' },
          { domainKind: 'sub-category', path: 'src/_utils/_primitives' },
          {
            domainKind: 'sub-category',
            path: 'src/_utils/_primitives/_compounds',
          },
          { domainKind: 'sub-category', path: 'src/_utils/_primitives-extra' },
        ],
        {
          horizontalHierarchyModels: [
            [['_primitives'], ['_aggregates'], ['_compounds']],
            [['_absent'], ['_other']],
          ],
        }
      );

      expect(deriveDomainHierarchies(context)).toEqual([
        {
          isOrderable: true,
          origin: 'horizontal-hierarchy-model',
          parentPath: 'src/_utils',
          repetitions: [],
          siblings: [
            { itemId: 2, rank: 0 },
            { itemId: 1, rank: 2 },
          ],
        },
      ]);
    }
  });

  it('instantiates horizontalHierarchyModels when a single matching Sub-Category child exists', () => {
    const { context } = hierarchyFixture(
      [
        { domainKind: 'category', path: 'src/_utils' },
        { domainKind: 'sub-category', path: 'src/_utils/_primitives' },
      ],
      {
        horizontalHierarchyModels: [[['_primitives'], ['_compounds']]],
      }
    );

    expect(deriveDomainHierarchies(context)).toEqual([
      {
        isOrderable: true,
        origin: 'horizontal-hierarchy-model',
        parentPath: 'src/_utils',
        repetitions: [],
        siblings: [{ itemId: 1, rank: 0 }],
      },
    ]);
  });

  it.each<TLogicalDomainKind>([
    'root-layer',
    'layer',
    'fractal-branch',
    'fragment',
    'root-fragment',
    'foreign-domain',
    'path-sub-category',
  ])(
    'does not instantiate horizontalHierarchyModels on %s parent even when a child matches by name',
    (domainKind) => {
      const { context } = hierarchyFixture(
        [
          { domainKind, path: 'src/parent' },
          { domainKind: 'sub-category', path: 'src/parent/_primitives' },
          { domainKind: 'layer', path: 'src/parent/_compounds' },
        ],
        {
          horizontalHierarchyModels: [[['_primitives'], ['_compounds']]],
        }
      );

      expect(deriveDomainHierarchies(context)).toEqual([]);
    }
  );

  it('never matches Path Sub-Categories, Fragments, Fractal Branches, Foreign Domains, Layers or Category Nodes in horizontalHierarchyModels', () => {
    const { context: mimeticContext } = hierarchyFixture(
      [
        {
          domainKind: 'category',
          path: 'src/_routes',
          relationalQualifications: { isParentCategory: true },
        },
        { domainKind: 'path-sub-category', path: 'src/_routes/_users' },
        { domainKind: 'fragment', path: 'src/_routes/get-health' },
        {
          domainKind: 'fractal-branch',
          path: 'src/_routes/_routes@shared',
        },
        { domainKind: 'foreign-domain', path: 'src/_routes/_tooling' },
      ],
      {
        horizontalHierarchyModels: [
          [['_users'], ['get-health'], ['_routes@shared'], ['_tooling']],
        ],
      }
    );
    expect(deriveDomainHierarchies(mimeticContext)).toEqual([]);

    const { context: mixedCategoryContext } = hierarchyFixture(
      [
        { domainKind: 'category', path: 'src/_types' },
        { domainKind: 'layer', path: 'src/_types/_layer' },
        { nodeKind: 'category-node', path: 'src/_types/_node' },
        { domainKind: 'sub-category', path: 'src/_types/_primitives' },
      ],
      {
        horizontalHierarchyModels: [[['_layer'], ['_node'], ['_primitives']]],
      }
    );
    expect(deriveDomainHierarchies(mixedCategoryContext)).toEqual([
      {
        isOrderable: true,
        origin: 'horizontal-hierarchy-model',
        parentPath: 'src/_types',
        repetitions: [],
        siblings: [{ itemId: 3, rank: 2 }],
      },
    ]);
  });

  it('applies horizontalHierarchies only to exact parent paths and orders Layers, Categories and Sub-Categories', () => {
    const { context: rootLayerContext } = hierarchyFixture(
      [
        { domainKind: 'root-layer', path: 'src' },
        { domainKind: 'category', path: 'src/_types' },
        { domainKind: 'category', path: 'src/_utils' },
      ],
      {
        horizontalHierarchies: [
          { hierarchy: [['_types'], ['_utils']], path: 'src' },
          { hierarchy: [['_missing'], ['_other']], path: 'src' },
          { hierarchy: [['_types'], ['_utils']], path: 'src/_types' },
          { hierarchy: [['_types'], ['_utils']], path: 'other' },
        ],
      }
    );
    expect(deriveDomainHierarchies(rootLayerContext)).toEqual([
      {
        isOrderable: true,
        origin: 'horizontal-hierarchy',
        parentPath: 'src',
        repetitions: [],
        siblings: [
          { itemId: 1, rank: 0 },
          { itemId: 2, rank: 1 },
        ],
      },
      {
        isOrderable: true,
        origin: 'horizontal-hierarchy',
        parentPath: 'src',
        repetitions: [],
        siblings: [],
      },
    ]);

    const { context: layerContext } = hierarchyFixture(
      [
        { domainKind: 'layer', path: 'src/_domain' },
        { domainKind: 'layer', path: 'src/_domain/_core' },
        { domainKind: 'layer', path: 'src/_domain/_app' },
      ],
      {
        horizontalHierarchies: [
          { hierarchy: [['_core'], ['_app']], path: 'src/_domain' },
        ],
      }
    );
    expect(deriveDomainHierarchies(layerContext)).toEqual([
      {
        isOrderable: true,
        origin: 'horizontal-hierarchy',
        parentPath: 'src/_domain',
        repetitions: [],
        siblings: [
          { itemId: 1, rank: 0 },
          { itemId: 2, rank: 1 },
        ],
      },
    ]);

    const { context: categoryContext } = hierarchyFixture(
      [
        { domainKind: 'category', path: 'src/_utils' },
        { domainKind: 'sub-category', path: 'src/_utils/_base' },
        { domainKind: 'sub-category', path: 'src/_utils/_high' },
      ],
      {
        horizontalHierarchies: [
          { hierarchy: [['_base'], ['_high']], path: 'src/_utils' },
        ],
      }
    );
    expect(deriveDomainHierarchies(categoryContext)).toEqual([
      {
        isOrderable: true,
        origin: 'horizontal-hierarchy',
        parentPath: 'src/_utils',
        repetitions: [],
        siblings: [
          { itemId: 1, rank: 0 },
          { itemId: 2, rank: 1 },
        ],
      },
    ]);
  });

  it('preserves repetitions and all effective ranks for both horizontal-hierarchy-model and horizontal-hierarchy applications', () => {
    const { context } = hierarchyFixture(
      [
        { domainKind: 'category', path: 'src/_utils' },
        { domainKind: 'sub-category', path: 'src/_utils/_z' },
        { domainKind: 'sub-category', path: 'src/_utils/_a' },
      ],
      {
        horizontalHierarchies: [
          {
            hierarchy: [
              ['_z', '_a', '_missing'],
              ['_z', '_a', '_missing'],
            ],
            path: 'src/_utils',
          },
        ],
        horizontalHierarchyModels: [
          [
            ['_z', '_a', '_missing'],
            ['_z', '_a', '_missing'],
          ],
        ],
      }
    );
    expect(deriveDomainHierarchies(context)).toEqual([
      {
        isOrderable: true,
        origin: 'horizontal-hierarchy-model',
        parentPath: 'src/_utils',
        repetitions: ['_a', '_missing', '_z'],
        siblings: [
          { itemId: 2, rank: 0 },
          { itemId: 1, rank: 0 },
          { itemId: 2, rank: 1 },
          { itemId: 1, rank: 1 },
        ],
      },
      {
        isOrderable: true,
        origin: 'horizontal-hierarchy',
        parentPath: 'src/_utils',
        repetitions: ['_a', '_missing', '_z'],
        siblings: [
          { itemId: 2, rank: 0 },
          { itemId: 1, rank: 0 },
          { itemId: 2, rank: 1 },
          { itemId: 1, rank: 1 },
        ],
      },
    ]);
  });

  it('records non-orderable horizontal-hierarchy selections rather than discarding the application', () => {
    const { context } = hierarchyFixture(
      [
        { domainKind: 'root-fragment', path: 'src' },
        {
          domainKind: 'category',
          path: 'src/_types',
          relationalQualifications: { isPrivateCategory: true },
        },
        { nodeKind: 'root-node', path: 'src/main.ts' },
      ],
      {
        horizontalHierarchies: [
          { hierarchy: [['_types'], ['main.ts']], path: 'src' },
        ],
        originKind: 'root-fragment',
      }
    );
    expect(deriveDomainHierarchies(context)).toEqual([
      {
        isOrderable: false,
        origin: 'horizontal-hierarchy',
        parentPath: 'src',
        repetitions: [],
        siblings: [
          { itemId: 1, rank: 0 },
          { itemId: 2, rank: 1 },
        ],
      },
    ]);
  });

  it('retains invalid horizontal-hierarchy applications inside Foreign Domains with isOrderable false', () => {
    const { context } = hierarchyFixture(
      [
        { domainKind: 'foreign-domain', path: 'src/_foreign' },
        { domainKind: 'foreign-domain', path: 'src/_foreign/_a' },
        { domainKind: 'foreign-domain', path: 'src/_foreign/_b' },
      ],
      {
        horizontalHierarchies: [
          { hierarchy: [['_a'], ['_b']], path: 'src/_foreign' },
        ],
      }
    );
    expect(deriveDomainHierarchies(context)).toEqual([
      {
        isOrderable: false,
        origin: 'horizontal-hierarchy',
        parentPath: 'src/_foreign',
        repetitions: [],
        siblings: [
          { itemId: 1, rank: 0 },
          { itemId: 2, rank: 1 },
        ],
      },
    ]);
  });

  it('rejects mixed Categories and Layers, non-Sub-Category children of Categories, and empty Path-Category hierarchies', () => {
    const { context: mixedContext } = hierarchyFixture(
      [
        { domainKind: 'fractal-branch', path: 'src/_src@shared' },
        { domainKind: 'category', path: 'src/_src@shared/_types' },
        { domainKind: 'layer', path: 'src/_src@shared/_domain' },
      ],
      {
        horizontalHierarchies: [
          { hierarchy: [['_types'], ['_domain']], path: 'src/_src@shared' },
        ],
      }
    );
    expect(deriveDomainHierarchies(mixedContext)[0]?.isOrderable).toBe(false);

    const { context: mimeticContext } = hierarchyFixture(
      [
        {
          domainKind: 'category',
          path: 'src/_routes',
          relationalQualifications: { isParentCategory: true },
        },
        { domainKind: 'path-sub-category', path: 'src/_routes/_users' },
      ],
      {
        horizontalHierarchies: [
          { hierarchy: [['_missing'], ['_other']], path: 'src/_routes' },
          { hierarchy: [['_users'], ['_other']], path: 'src/_routes' },
        ],
      }
    );
    expect(
      deriveDomainHierarchies(mimeticContext).map((set) => set.isOrderable)
    ).toEqual([false, false]);

    const { context: subCategoryEmptyContext } = hierarchyFixture(
      [{ domainKind: 'sub-category', path: 'src/_utils/_base' }],
      {
        horizontalHierarchies: [
          { hierarchy: [['_missing'], ['_other']], path: 'src/_utils/_base' },
        ],
      }
    );
    expect(
      deriveDomainHierarchies(subCategoryEmptyContext)[0]?.isOrderable
    ).toBe(true);
  });
});
