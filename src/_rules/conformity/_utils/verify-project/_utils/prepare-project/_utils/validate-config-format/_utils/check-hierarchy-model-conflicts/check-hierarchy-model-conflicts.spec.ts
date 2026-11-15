import { describe, expect, it } from 'vitest';

import { checkHierarchyModelConflicts } from './check-hierarchy-model-conflicts.util.js';

describe('checkHierarchyModelConflicts', () => {
  it('returns empty outcomes for empty scopes, non-array models, or empty category sets', () => {
    expect(checkHierarchyModelConflicts([])).toEqual([]);
    expect(
      checkHierarchyModelConflicts([
        {
          basePropertyPath: 'faf.common.horizontalHierarchyModels',
          categoryNames: new Set(['_types']),
          models: 'not-an-array',
        },
        {
          basePropertyPath: 'faf.common.horizontalHierarchyModels',
          categoryNames: new Set(),
          models: [[['_types'], ['_utils']]],
        },
      ])
    ).toEqual([]);
  });

  it('ignores non-array models, non-array tiers, and non-string members while reporting conflicts', () => {
    const outcomes = checkHierarchyModelConflicts([
      {
        basePropertyPath: 'faf.common.horizontalHierarchyModels',
        categoryNames: new Set(['_types', '_utils']),
        models: [
          'bad-model',
          ['bad-tier', ['_types', 42, '_atoms'], ['_utils']],
        ],
      },
    ]);

    expect(outcomes).toHaveLength(2);
    expect(outcomes[0]).toMatchObject({
      constraint: 'configuration/horizontal-hierarchy-model-category-conflict',
      element: 'faf.common.horizontalHierarchyModels[1][1][0]',
      family: 'configuration',
      normativeReference: 'FAF §6.3.4',
      propertyPath: 'faf.common.horizontalHierarchyModels[1][1][0]',
    });
    expect(outcomes[0]?.message).toBe(
      '\'faf.common.horizontalHierarchyModels[1][1][0]\' cannot match a Category name declared in the role catalog: Sub-Category "_types" matches Category "_types" in the role catalog'
    );
    expect(outcomes[1]?.propertyPath).toBe(
      'faf.common.horizontalHierarchyModels[1][2][0]'
    );
  });

  it('deduplicates repeated conflicts sharing the same propertyPath across scopes', () => {
    const outcomes = checkHierarchyModelConflicts([
      {
        basePropertyPath: 'faf.common.horizontalHierarchyModels',
        categoryNames: new Set(['_types']),
        models: [[['_types'], ['_utils']]],
      },
      {
        basePropertyPath: 'faf.common.horizontalHierarchyModels',
        categoryNames: new Set(['_types']),
        models: [[['_types'], ['_utils']]],
      },
      {
        basePropertyPath: 'faf.common.horizontalHierarchyModels',
        categoryNames: new Set(['_utils']),
        models: [[['_types'], ['_utils']]],
      },
    ]);

    expect(outcomes.map((outcome) => outcome.propertyPath)).toEqual([
      'faf.common.horizontalHierarchyModels[0][0][0]',
      'faf.common.horizontalHierarchyModels[0][1][0]',
    ]);
  });
});
