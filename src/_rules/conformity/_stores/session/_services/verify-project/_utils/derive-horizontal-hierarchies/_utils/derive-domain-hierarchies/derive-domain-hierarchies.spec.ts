import { describe, expect, it } from 'vitest';

import { hierarchyFixture } from '../../_derive-horizontal-hierarchies@shared/_mocks/hierarchy-fixture.mock.js';
import { deriveDomainHierarchies } from './derive-domain-hierarchies.util.js';

describe('deriveDomainHierarchies', () => {
  it('selects direct children by exact name, retains rank gaps and ignores absent names', () => {
    const { context } = hierarchyFixture(
      [
        { domainKind: 'root-layer', path: 'src' },
        { domainKind: 'category', path: 'src/_apis' },
        { domainKind: 'category', path: 'src/_types' },
        { domainKind: 'category', path: 'src/_apis/_types' },
        { domainKind: 'category', path: 'src/_utils-extra' },
      ],
      {
        horizontalHierarchies: [
          [['_types'], ['_utils'], ['_apis']],
          [['_absent']],
        ],
      }
    );
    expect(deriveDomainHierarchies(context)).toEqual([
      {
        isOrderable: true,
        origin: 'general',
        parentPath: 'src',
        repetitions: [],
        siblings: [
          { itemId: 2, rank: 0 },
          { itemId: 1, rank: 2 },
        ],
      },
    ]);
  });

  it('applies local declarations only to exact parent paths, without replacing general declarations', () => {
    const { context } = hierarchyFixture(
      [
        { domainKind: 'root-layer', path: 'src' },
        { domainKind: 'category', path: 'src/_types' },
      ],
      {
        horizontalHierarchies: [[['_types']]],
        localHorizontalHierarchies: [
          { hierarchy: [['_types']], paths: ['src', 'other'] },
          { hierarchy: [['_missing']], paths: ['src'] },
          { hierarchy: [['_types']], paths: ['src/_types'] },
        ],
      }
    );
    expect(deriveDomainHierarchies(context)).toEqual([
      {
        isOrderable: true,
        origin: 'general',
        parentPath: 'src',
        repetitions: [],
        siblings: [{ itemId: 1, rank: 0 }],
      },
      {
        isOrderable: true,
        origin: 'local',
        parentPath: 'src',
        repetitions: [],
        siblings: [{ itemId: 1, rank: 0 }],
      },
      {
        isOrderable: true,
        origin: 'local',
        parentPath: 'src',
        repetitions: [],
        siblings: [],
      },
    ]);
  });

  it('preserves repetitions and all effective ranks for the norm, including absent repeated names', () => {
    const { context } = hierarchyFixture(
      [
        { domainKind: 'root-layer', path: 'src' },
        { domainKind: 'category', path: 'src/_z' },
        { domainKind: 'category', path: 'src/_a' },
      ],
      {
        horizontalHierarchies: [
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
        origin: 'general',
        parentPath: 'src',
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

  it('records non-orderable selections rather than discarding the application', () => {
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
        horizontalHierarchies: [[['_types']]],
        localHorizontalHierarchies: [
          { hierarchy: [['main.ts']], paths: ['src'] },
        ],
        originKind: 'root-fragment',
      }
    );
    expect(deriveDomainHierarchies(context)).toEqual([
      {
        isOrderable: false,
        origin: 'general',
        parentPath: 'src',
        repetitions: [],
        siblings: [{ itemId: 1, rank: 0 }],
      },
      {
        isOrderable: false,
        origin: 'local',
        parentPath: 'src',
        repetitions: [],
        siblings: [{ itemId: 2, rank: 0 }],
      },
    ]);
  });

  it('does not apply general models inside Foreign Domains but retains invalid local applications', () => {
    const { context } = hierarchyFixture(
      [
        { domainKind: 'foreign-domain', path: 'src/_foreign' },
        { domainKind: 'foreign-domain', path: 'src/_foreign/_a' },
      ],
      {
        horizontalHierarchies: [[['_a']]],
        localHorizontalHierarchies: [
          { hierarchy: [['_a']], paths: ['src/_foreign'] },
        ],
      }
    );
    expect(deriveDomainHierarchies(context)).toEqual([
      {
        isOrderable: false,
        origin: 'local',
        parentPath: 'src/_foreign',
        repetitions: [],
        siblings: [{ itemId: 1, rank: 0 }],
      },
    ]);
  });
});
