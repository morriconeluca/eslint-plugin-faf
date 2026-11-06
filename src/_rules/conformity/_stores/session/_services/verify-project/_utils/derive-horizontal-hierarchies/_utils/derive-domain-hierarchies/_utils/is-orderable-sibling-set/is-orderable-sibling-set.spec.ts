import { describe, expect, it } from 'vitest';

import type { TLogicalDomainKind } from '../../../../../../_verify-project@shared/_types/_compounds/classification.type.js';

import { hierarchyFixture } from '../../../../_derive-horizontal-hierarchies@shared/_mocks/hierarchy-fixture.mock.js';
import { isOrderableSiblingSet } from './index.js';

describe('isOrderableSiblingSet', () => {
  it.each<TLogicalDomainKind>(['root-layer', 'layer', 'fractal-branch'])(
    'admits homogeneous Categories and Layers under %s',
    (domainKind) => {
      for (const childKind of ['category', 'layer'] as const) {
        const { taxonomy } = hierarchyFixture([
          { domainKind, path: 'src' },
          { domainKind: childKind, path: 'src/_a' },
          { domainKind: childKind, path: 'src/_b' },
        ]);
        expect(
          isOrderableSiblingSet(taxonomy.byItemId.get(0), [
            taxonomy.byItemId.get(1),
            taxonomy.byItemId.get(2),
          ])
        ).toBe(true);
      }
    }
  );

  it.each<TLogicalDomainKind>(['category', 'sub-category'])(
    'admits Sub-Categories under %s, including private ancestry',
    (domainKind) => {
      const { taxonomy } = hierarchyFixture([
        {
          domainKind,
          path: 'src',
          relationalQualifications: {
            isPrivateCategory: domainKind === 'category',
          },
        },
        { domainKind: 'sub-category', path: 'src/_a' },
      ]);
      expect(
        isOrderableSiblingSet(taxonomy.byItemId.get(0), [
          taxonomy.byItemId.get(1),
        ])
      ).toBe(true);
    }
  );

  it.each<TLogicalDomainKind>([
    'root-fragment',
    'fragment',
    'path-sub-category',
    'foreign-domain',
  ])('rejects optional hierarchies under %s', (domainKind) => {
    const { taxonomy } = hierarchyFixture([{ domainKind, path: 'src' }]);
    expect(isOrderableSiblingSet(taxonomy.byItemId.get(0), [])).toBe(false);
  });

  it.each<TLogicalDomainKind>([
    'fragment',
    'path-sub-category',
    'root-fragment',
    'foreign-domain',
    'fractal-branch',
  ])('rejects even a single selected %s', (domainKind) => {
    const { taxonomy } = hierarchyFixture([
      { domainKind: 'root-layer', path: 'src' },
      { domainKind, path: 'src/_a' },
    ]);
    expect(
      isOrderableSiblingSet(taxonomy.byItemId.get(0), [
        taxonomy.byItemId.get(1),
      ])
    ).toBe(false);
  });

  it('rejects mixed Categories and Layers, files and missing classifications', () => {
    const { taxonomy } = hierarchyFixture([
      { domainKind: 'root-layer', path: 'src' },
      { domainKind: 'category', path: 'src/_types' },
      { domainKind: 'layer', path: 'src/_domain' },
      { nodeKind: 'unauthorized-logical-node', path: 'src/file.ts' },
    ]);
    const parent = taxonomy.byItemId.get(0);
    expect(
      isOrderableSiblingSet(parent, [
        taxonomy.byItemId.get(1),
        taxonomy.byItemId.get(2),
      ])
    ).toBe(false);
    expect(isOrderableSiblingSet(parent, [taxonomy.byItemId.get(3)])).toBe(
      false
    );
    expect(isOrderableSiblingSet(parent, [undefined])).toBe(false);
    expect(isOrderableSiblingSet(taxonomy.byItemId.get(1), [undefined])).toBe(
      false
    );
    expect(isOrderableSiblingSet(undefined, [])).toBe(false);
  });

  it('rejects Fragments, Category Nodes and mimetic children under Categories', () => {
    const { taxonomy } = hierarchyFixture([
      { domainKind: 'category', path: 'src' },
      { domainKind: 'fragment', path: 'src/widget' },
      { nodeKind: 'category-node', path: 'src/value.type.ts' },
      { domainKind: 'path-sub-category', path: 'src/_path' },
    ]);
    for (const id of [1, 2, 3]) {
      expect(
        isOrderableSiblingSet(taxonomy.byItemId.get(0), [
          taxonomy.byItemId.get(id),
        ])
      ).toBe(false);
    }
    const { taxonomy: mimetic } = hierarchyFixture([
      {
        domainKind: 'category',
        path: 'src',
        relationalQualifications: { isParentCategory: true },
      },
    ]);
    expect(isOrderableSiblingSet(mimetic.byItemId.get(0), [])).toBe(false);
  });

  it('admits an empty effective selection only for eligible parents', () => {
    for (const domainKind of ['root-layer', 'category'] as const) {
      const { taxonomy } = hierarchyFixture([{ domainKind, path: 'src' }]);
      expect(isOrderableSiblingSet(taxonomy.byItemId.get(0), [])).toBe(true);
    }
  });
});
