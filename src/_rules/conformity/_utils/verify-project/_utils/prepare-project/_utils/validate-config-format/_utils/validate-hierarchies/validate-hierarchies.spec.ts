import { describe, expect, it } from 'vitest';

import type { TConfigConstraint } from '../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';

import { validateHierarchies } from './validate-hierarchies.util.js';

describe('validateHierarchies', () => {
  it('does nothing when hierarchies are omitted', () => {
    expect(validateHierarchies({}, 'faf.common')).toHaveLength(0);
    expect(validateHierarchies({}, 'faf.locals[0]')).toHaveLength(0);
  });

  it('ignores horizontalHierarchies on faf.common (handled by scope-mismatch)', () => {
    const outcomes = validateHierarchies(
      { horizontalHierarchies: 'invalid' },
      'faf.common'
    );
    expect(outcomes).toHaveLength(0);
  });

  it('accepts valid horizontalHierarchyModels and local horizontalHierarchies', () => {
    const outcomes = validateHierarchies(
      {
        horizontalHierarchies: [
          {
            hierarchy: [['_domain'], ['_network', '_ui']],
            path: 'src/_src@shared',
          },
          {
            hierarchy: [['button.util.ts'], ['button.component.tsx']],
            path: 'src/_components/button',
          },
        ],
        horizontalHierarchyModels: [
          [['_types'], ['_utils']],
          [['_atoms'], ['_molecules'], ['_organisms']],
        ],
      },
      'faf.locals[0]'
    );
    expect(outcomes).toHaveLength(0);
  });

  it('accepts empty horizontalHierarchyModels and horizontalHierarchies arrays', () => {
    expect(
      validateHierarchies(
        { horizontalHierarchies: [], horizontalHierarchyModels: [] },
        'faf.locals[0]'
      )
    ).toHaveLength(0);
  });

  const modelCases: readonly {
    readonly config: Record<string, unknown>;
    readonly constraint: TConfigConstraint;
    readonly propertyPath: string;
  }[] = [
    {
      config: { horizontalHierarchyModels: null },
      constraint: 'configuration/null-forbidden',
      propertyPath: 'faf.common.horizontalHierarchyModels',
    },
    {
      config: { horizontalHierarchyModels: 'none' },
      constraint: 'configuration/invalid-type',
      propertyPath: 'faf.common.horizontalHierarchyModels',
    },
    {
      config: { horizontalHierarchyModels: [null] },
      constraint: 'configuration/null-forbidden',
      propertyPath: 'faf.common.horizontalHierarchyModels[0]',
    },
    {
      config: { horizontalHierarchyModels: ['none'] },
      constraint: 'configuration/invalid-type',
      propertyPath: 'faf.common.horizontalHierarchyModels[0]',
    },
    {
      config: { horizontalHierarchyModels: [[]] },
      constraint: 'configuration/insufficient-hierarchy-tiers',
      propertyPath: 'faf.common.horizontalHierarchyModels[0]',
    },
    {
      config: { horizontalHierarchyModels: [[['_atoms']]] },
      constraint: 'configuration/insufficient-hierarchy-tiers',
      propertyPath: 'faf.common.horizontalHierarchyModels[0]',
    },
    {
      config: { horizontalHierarchyModels: [[null, ['_molecules']]] },
      constraint: 'configuration/null-forbidden',
      propertyPath: 'faf.common.horizontalHierarchyModels[0][0]',
    },
    {
      config: { horizontalHierarchyModels: [['none', ['_molecules']]] },
      constraint: 'configuration/invalid-type',
      propertyPath: 'faf.common.horizontalHierarchyModels[0][0]',
    },
    {
      config: { horizontalHierarchyModels: [[[], ['_molecules']]] },
      constraint: 'configuration/empty-tier',
      propertyPath: 'faf.common.horizontalHierarchyModels[0][0]',
    },
    {
      config: { horizontalHierarchyModels: [[[null], ['_molecules']]] },
      constraint: 'configuration/null-forbidden',
      propertyPath: 'faf.common.horizontalHierarchyModels[0][0][0]',
    },
    {
      config: { horizontalHierarchyModels: [[[123], ['_molecules']]] },
      constraint: 'configuration/invalid-type',
      propertyPath: 'faf.common.horizontalHierarchyModels[0][0][0]',
    },
    {
      config: { horizontalHierarchyModels: [[[''], ['_molecules']]] },
      constraint: 'configuration/empty-string',
      propertyPath: 'faf.common.horizontalHierarchyModels[0][0][0]',
    },
    {
      config: { horizontalHierarchyModels: [[['atoms'], ['_molecules']]] },
      constraint: 'configuration/invalid-sub-category-name',
      propertyPath: 'faf.common.horizontalHierarchyModels[0][0][0]',
    },
    {
      config: { horizontalHierarchyModels: [[['_'], ['_molecules']]] },
      constraint: 'configuration/invalid-sub-category-name',
      propertyPath: 'faf.common.horizontalHierarchyModels[0][0][0]',
    },
    {
      config: { horizontalHierarchyModels: [[['__atoms'], ['_molecules']]] },
      constraint: 'configuration/invalid-sub-category-name',
      propertyPath: 'faf.common.horizontalHierarchyModels[0][0][0]',
    },
    {
      config: { horizontalHierarchyModels: [[['_Atoms'], ['_molecules']]] },
      constraint: 'configuration/invalid-sub-category-name',
      propertyPath: 'faf.common.horizontalHierarchyModels[0][0][0]',
    },
    {
      config: { horizontalHierarchyModels: [[['_[id]'], ['_molecules']]] },
      constraint: 'configuration/invalid-sub-category-name',
      propertyPath: 'faf.common.horizontalHierarchyModels[0][0][0]',
    },
    {
      config: { horizontalHierarchyModels: [[['_atoms'], ['_atoms']]] },
      constraint: 'configuration/duplicate-element',
      propertyPath: 'faf.common.horizontalHierarchyModels[0][1][0]',
    },
  ];

  it.each(modelCases)(
    'rejects invalid horizontalHierarchyModels producing $constraint',
    ({ config, constraint, propertyPath }) => {
      const outcomes = validateHierarchies(config, 'faf.common');
      const outcome = outcomes.find(
        (outcome) =>
          outcome.constraint === constraint &&
          outcome.propertyPath === propertyPath
      );
      expect(outcome).toBeDefined();
      expect(outcome?.family).toBe('configuration');
      expect(outcome?.element).toBe(propertyPath);
      const expectedReferenceMap = new Map<string, string>([
        ['configuration/insufficient-hierarchy-tiers', 'FAF §4'],
        ['configuration/invalid-sub-category-name', 'FAF §4, §6.3.4'],
      ]);
      const expectedReference =
        expectedReferenceMap.get(constraint) ?? 'FAF §1.2, §6.9';
      expect(outcome?.normativeReference).toBe(expectedReference);
      expect(outcome?.message).toContain(propertyPath);
    }
  );

  it('does not emit invalid-sub-category-name alongside empty-string for empty horizontalHierarchyModels member', () => {
    const outcomes = validateHierarchies(
      { horizontalHierarchyModels: [[[''], ['_molecules']]] },
      'faf.common'
    );
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.constraint).toBe('configuration/empty-string');
  });

  const horizontalCases: readonly {
    readonly config: Record<string, unknown>;
    readonly constraint: TConfigConstraint;
    readonly propertyPath: string;
  }[] = [
    {
      config: { horizontalHierarchies: null },
      constraint: 'configuration/null-forbidden',
      propertyPath: 'faf.locals[0].horizontalHierarchies',
    },
    {
      config: { horizontalHierarchies: 'none' },
      constraint: 'configuration/invalid-type',
      propertyPath: 'faf.locals[0].horizontalHierarchies',
    },
    {
      config: { horizontalHierarchies: [null] },
      constraint: 'configuration/null-forbidden',
      propertyPath: 'faf.locals[0].horizontalHierarchies[0]',
    },
    {
      config: { horizontalHierarchies: ['none'] },
      constraint: 'configuration/invalid-type',
      propertyPath: 'faf.locals[0].horizontalHierarchies[0]',
    },
    {
      config: {
        horizontalHierarchies: [
          { extra: true, hierarchy: [['_a'], ['_b']], path: 'src' },
        ],
      },
      constraint: 'configuration/unknown-property',
      propertyPath: 'faf.locals[0].horizontalHierarchies[0].extra',
    },
    {
      config: {
        horizontalHierarchies: [{ hierarchy: [['_a'], ['_b']], path: null }],
      },
      constraint: 'configuration/null-forbidden',
      propertyPath: 'faf.locals[0].horizontalHierarchies[0].path',
    },
    {
      config: {
        horizontalHierarchies: [{ hierarchy: [['_a'], ['_b']] }],
      },
      constraint: 'configuration/missing-property',
      propertyPath: 'faf.locals[0].horizontalHierarchies[0].path',
    },
    {
      config: {
        horizontalHierarchies: [{ hierarchy: [['_a'], ['_b']], path: 123 }],
      },
      constraint: 'configuration/invalid-type',
      propertyPath: 'faf.locals[0].horizontalHierarchies[0].path',
    },
    {
      config: {
        horizontalHierarchies: [{ hierarchy: [['_a'], ['_b']], path: '' }],
      },
      constraint: 'configuration/empty-string',
      propertyPath: 'faf.locals[0].horizontalHierarchies[0].path',
    },
    {
      config: {
        horizontalHierarchies: [{ hierarchy: [['_a'], ['_b']], path: './src' }],
      },
      constraint: 'configuration/invalid-literal-path',
      propertyPath: 'faf.locals[0].horizontalHierarchies[0].path',
    },
    {
      config: { horizontalHierarchies: [{ path: 'src' }] },
      constraint: 'configuration/missing-property',
      propertyPath: 'faf.locals[0].horizontalHierarchies[0].hierarchy',
    },
    {
      config: { horizontalHierarchies: [{ hierarchy: null, path: 'src' }] },
      constraint: 'configuration/null-forbidden',
      propertyPath: 'faf.locals[0].horizontalHierarchies[0].hierarchy',
    },
    {
      config: { horizontalHierarchies: [{ hierarchy: 'none', path: 'src' }] },
      constraint: 'configuration/invalid-type',
      propertyPath: 'faf.locals[0].horizontalHierarchies[0].hierarchy',
    },
    {
      config: { horizontalHierarchies: [{ hierarchy: [], path: 'src' }] },
      constraint: 'configuration/insufficient-hierarchy-tiers',
      propertyPath: 'faf.locals[0].horizontalHierarchies[0].hierarchy',
    },
    {
      config: {
        horizontalHierarchies: [{ hierarchy: [['_a']], path: 'src' }],
      },
      constraint: 'configuration/insufficient-hierarchy-tiers',
      propertyPath: 'faf.locals[0].horizontalHierarchies[0].hierarchy',
    },
    {
      config: {
        horizontalHierarchies: [{ hierarchy: [null, ['_b']], path: 'src' }],
      },
      constraint: 'configuration/null-forbidden',
      propertyPath: 'faf.locals[0].horizontalHierarchies[0].hierarchy[0]',
    },
    {
      config: {
        horizontalHierarchies: [{ hierarchy: ['none', ['_b']], path: 'src' }],
      },
      constraint: 'configuration/invalid-type',
      propertyPath: 'faf.locals[0].horizontalHierarchies[0].hierarchy[0]',
    },
    {
      config: {
        horizontalHierarchies: [{ hierarchy: [[], ['_b']], path: 'src' }],
      },
      constraint: 'configuration/empty-tier',
      propertyPath: 'faf.locals[0].horizontalHierarchies[0].hierarchy[0]',
    },
    {
      config: {
        horizontalHierarchies: [{ hierarchy: [[''], ['_b']], path: 'src' }],
      },
      constraint: 'configuration/empty-string',
      propertyPath: 'faf.locals[0].horizontalHierarchies[0].hierarchy[0][0]',
    },
    {
      config: {
        horizontalHierarchies: [{ hierarchy: [[null], ['_b']], path: 'src' }],
      },
      constraint: 'configuration/null-forbidden',
      propertyPath: 'faf.locals[0].horizontalHierarchies[0].hierarchy[0][0]',
    },
    {
      config: {
        horizontalHierarchies: [{ hierarchy: [[123], ['_b']], path: 'src' }],
      },
      constraint: 'configuration/invalid-type',
      propertyPath: 'faf.locals[0].horizontalHierarchies[0].hierarchy[0][0]',
    },
    {
      config: {
        horizontalHierarchies: [{ hierarchy: [['_a'], ['_a']], path: 'src' }],
      },
      constraint: 'configuration/duplicate-element',
      propertyPath: 'faf.locals[0].horizontalHierarchies[0].hierarchy[1][0]',
    },
  ];

  it.each(horizontalCases)(
    'rejects invalid local horizontalHierarchies producing $constraint',
    ({ config, constraint, propertyPath }) => {
      const outcomes = validateHierarchies(config, 'faf.locals[0]');
      const outcome = outcomes.find(
        (outcome) =>
          outcome.constraint === constraint &&
          outcome.propertyPath === propertyPath
      );
      expect(outcome).toBeDefined();
      expect(outcome?.family).toBe('configuration');
      expect(outcome?.element).toBe(propertyPath);
      expect(outcome?.normativeReference).toBe(
        constraint === 'configuration/insufficient-hierarchy-tiers'
          ? 'FAF §4'
          : 'FAF §1.2, §6.9'
      );
      expect(outcome?.message).toContain(propertyPath);
    }
  );

  it('does not emit invalid-literal-path alongside empty-string for empty horizontalHierarchies path', () => {
    const outcomes = validateHierarchies(
      { horizontalHierarchies: [{ hierarchy: [['_a'], ['_b']], path: '' }] },
      'faf.locals[0]'
    );
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.constraint).toBe('configuration/empty-string');
  });

  it('allows non-underscore child names and multiple entries with the same path in horizontalHierarchies', () => {
    const outcomes = validateHierarchies(
      {
        horizontalHierarchies: [
          { hierarchy: [['main.ts'], ['cli.ts']], path: '.' },
          { hierarchy: [['a'], ['b']], path: '.' },
        ],
      },
      'faf.locals[0]'
    );
    expect(outcomes).toHaveLength(0);
  });

  it('rejects explicit undefined for path and hierarchy in horizontalHierarchies', () => {
    const missingPathRecord: Record<string, unknown> = {
      hierarchy: [['_a'], ['_b']],
    };
    Object.defineProperty(missingPathRecord, 'path', {
      enumerable: true,
      value: void 0,
    });
    const pathOutcomes = validateHierarchies(
      { horizontalHierarchies: [missingPathRecord] },
      'faf.locals[0]'
    );
    const pathUndefined = pathOutcomes.find(
      (outcome) => outcome.constraint === 'configuration/explicit-undefined'
    );
    expect(pathUndefined?.propertyPath).toBe(
      'faf.locals[0].horizontalHierarchies[0].path'
    );
    expect(pathUndefined?.message).toBe(
      "'faf.locals[0].horizontalHierarchies[0].path' cannot be explicitly undefined"
    );

    const missingHierarchyRecord: Record<string, unknown> = { path: 'src' };
    Object.defineProperty(missingHierarchyRecord, 'hierarchy', {
      enumerable: true,
      value: void 0,
    });
    const hierarchyOutcomes = validateHierarchies(
      { horizontalHierarchies: [missingHierarchyRecord] },
      'faf.locals[0]'
    );
    const hierarchyUndefined = hierarchyOutcomes.find(
      (outcome) => outcome.constraint === 'configuration/explicit-undefined'
    );
    expect(hierarchyUndefined?.propertyPath).toBe(
      'faf.locals[0].horizontalHierarchies[0].hierarchy'
    );
    expect(hierarchyUndefined?.message).toBe(
      "'faf.locals[0].horizontalHierarchies[0].hierarchy' cannot be explicitly undefined"
    );
  });
});
