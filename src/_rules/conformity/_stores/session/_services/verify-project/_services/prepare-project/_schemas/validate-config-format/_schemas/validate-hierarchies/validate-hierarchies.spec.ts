import { describe, expect, it } from 'vitest';

import { validateHierarchies } from './validate-hierarchies.schema.js';

describe('validateHierarchies', () => {
  it('does nothing when hierarchies are omitted', () => {
    const outcomes = validateHierarchies({}, 'faf.common');
    expect(outcomes).toHaveLength(0);
  });

  it('accepts valid horizontal and local hierarchies', () => {
    const outcomes = validateHierarchies(
      {
        horizontalHierarchies: [
          [],
          [['_types'], ['_utils']],
          [['_atoms'], ['_molecules'], ['_organisms']],
        ],
        localHorizontalHierarchies: [
          {
            hierarchies: [['_domain'], ['_network', '_ui']],
            paths: ['src/_src@shared'],
          },
        ],
      },
      'faf.common'
    );
    expect(outcomes).toHaveLength(0);
  });

  it.each([
    {
      config: { horizontalHierarchies: null },
      constraint: 'configuration/null-forbidden',
      message: 'Property "horizontalHierarchies" cannot be null.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.horizontalHierarchies',
    },
    {
      config: { horizontalHierarchies: 'none' },
      constraint: 'configuration/invalid-type',
      message: 'Property "horizontalHierarchies" must be an array.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.horizontalHierarchies',
    },
    {
      config: { horizontalHierarchies: [null] },
      constraint: 'configuration/null-forbidden',
      message: 'Hierarchy cannot be null.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.horizontalHierarchies[0]',
    },
    {
      config: { horizontalHierarchies: ['none'] },
      constraint: 'configuration/invalid-type',
      message: 'Hierarchy must be an array.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.horizontalHierarchies[0]',
    },
    {
      config: { horizontalHierarchies: [[null]] },
      constraint: 'configuration/null-forbidden',
      message: 'Hierarchy tier cannot be null.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.horizontalHierarchies[0][0]',
    },
    {
      config: { horizontalHierarchies: [['none']] },
      constraint: 'configuration/invalid-type',
      message: 'Hierarchy tier must be an array.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.horizontalHierarchies[0][0]',
    },
    {
      config: { horizontalHierarchies: [[[]]] },
      constraint: 'configuration/empty-tier',
      message: 'Hierarchy tier cannot be empty.',
      normativeReference: 'CONFIG_7',
      propertyPath: 'faf.common.horizontalHierarchies[0][0]',
    },
    {
      config: { horizontalHierarchies: [[[null]]] },
      constraint: 'configuration/null-forbidden',
      message: 'Hierarchy item cannot be null.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.horizontalHierarchies[0][0][0]',
    },
    {
      config: { horizontalHierarchies: [[[123]]] },
      constraint: 'configuration/invalid-type',
      message: 'Hierarchy item must be a string.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.horizontalHierarchies[0][0][0]',
    },
    {
      config: { horizontalHierarchies: [[['']]] },
      constraint: 'configuration/empty-string',
      message: 'Hierarchy item cannot be empty.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.horizontalHierarchies[0][0][0]',
    },
    {
      config: { horizontalHierarchies: [[['_types'], ['_types']]] },
      constraint: 'configuration/duplicate-element',
      message: 'Duplicate item "_types" in hierarchy.',
      normativeReference: 'CONFIG_7',
      propertyPath: 'faf.common.horizontalHierarchies[0][1][0]',
    },
    {
      config: { localHorizontalHierarchies: null },
      constraint: 'configuration/null-forbidden',
      message: 'Property "localHorizontalHierarchies" cannot be null.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.localHorizontalHierarchies',
    },
    {
      config: { localHorizontalHierarchies: 'none' },
      constraint: 'configuration/invalid-type',
      message: 'Property "localHorizontalHierarchies" must be an array.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.localHorizontalHierarchies',
    },
    {
      config: { localHorizontalHierarchies: [null] },
      constraint: 'configuration/null-forbidden',
      message: 'Local hierarchy element cannot be null.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.localHorizontalHierarchies[0]',
    },
    {
      config: { localHorizontalHierarchies: ['none'] },
      constraint: 'configuration/invalid-type',
      message: 'Local hierarchy element must be an object.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.localHorizontalHierarchies[0]',
    },
    {
      config: {
        localHorizontalHierarchies: [
          { extra: true, hierarchies: [], paths: ['src'] },
        ],
      },
      constraint: 'configuration/unknown-property',
      message: 'Unknown property "extra" is forbidden.',
      normativeReference: 'CONFIG_7',
      propertyPath: 'faf.common.localHorizontalHierarchies[0].extra',
    },
    {
      config: {
        localHorizontalHierarchies: [{ hierarchies: [], paths: null }],
      },
      constraint: 'configuration/null-forbidden',
      message: 'Property "paths" cannot be null.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.localHorizontalHierarchies[0].paths',
    },
    {
      config: { localHorizontalHierarchies: [{ hierarchies: [] }] },
      constraint: 'configuration/missing-property',
      message: 'Required property "paths" is missing.',
      normativeReference: 'CONFIG_7',
      propertyPath: 'faf.common.localHorizontalHierarchies[0].paths',
    },
    {
      config: {
        localHorizontalHierarchies: [{ hierarchies: [], paths: 'src' }],
      },
      constraint: 'configuration/invalid-type',
      message: 'Property "paths" must be an array.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.localHorizontalHierarchies[0].paths',
    },
    {
      config: { localHorizontalHierarchies: [{ hierarchies: [], paths: [] }] },
      constraint: 'configuration/empty-list',
      message: 'Property "paths" cannot be empty.',
      normativeReference: 'CONFIG_7',
      propertyPath: 'faf.common.localHorizontalHierarchies[0].paths',
    },
    {
      config: {
        localHorizontalHierarchies: [{ hierarchies: [], paths: [null] }],
      },
      constraint: 'configuration/null-forbidden',
      message: 'Path element cannot be null.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.localHorizontalHierarchies[0].paths[0]',
    },
    {
      config: {
        localHorizontalHierarchies: [{ hierarchies: [], paths: [123] }],
      },
      constraint: 'configuration/invalid-type',
      message: 'Path element must be a string.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.localHorizontalHierarchies[0].paths[0]',
    },
    {
      config: {
        localHorizontalHierarchies: [{ hierarchies: [], paths: [''] }],
      },
      constraint: 'configuration/empty-string',
      message: 'Path element cannot be empty.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.localHorizontalHierarchies[0].paths[0]',
    },
    {
      config: {
        localHorizontalHierarchies: [{ hierarchies: [], paths: ['./src'] }],
      },
      constraint: 'configuration/invalid-literal-path',
      message: 'Invalid literal config path "./src".',
      normativeReference: 'CONFIG_2_2',
      propertyPath: 'faf.common.localHorizontalHierarchies[0].paths[0]',
    },
    {
      config: {
        localHorizontalHierarchies: [
          { hierarchies: [], paths: ['src', 'src'] },
        ],
      },
      constraint: 'configuration/duplicate-element',
      message: 'Duplicate path "src".',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.localHorizontalHierarchies[0].paths[1]',
    },
    {
      config: { localHorizontalHierarchies: [{ paths: ['src'] }] },
      constraint: 'configuration/missing-property',
      message: 'Required property "hierarchies" is missing.',
      normativeReference: 'CONFIG_7',
      propertyPath: 'faf.common.localHorizontalHierarchies[0].hierarchies',
    },
    {
      config: {
        localHorizontalHierarchies: [{ hierarchies: 'none', paths: ['src'] }],
      },
      constraint: 'configuration/invalid-type',
      message: 'Hierarchy must be an array.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.localHorizontalHierarchies[0].hierarchies',
    },
    {
      config: {
        localHorizontalHierarchies: [{ hierarchies: [[]], paths: ['src'] }],
      },
      constraint: 'configuration/empty-tier',
      message: 'Hierarchy tier cannot be empty.',
      normativeReference: 'CONFIG_7',
      propertyPath: 'faf.common.localHorizontalHierarchies[0].hierarchies[0]',
    },
    {
      config: {
        localHorizontalHierarchies: [
          { hierarchies: [[['_types']]], paths: ['src'] },
        ],
      },
      constraint: 'configuration/invalid-type',
      message: 'Hierarchy item must be a string.',
      normativeReference: 'CONFIG_2',
      propertyPath:
        'faf.common.localHorizontalHierarchies[0].hierarchies[0][0]',
    },
    {
      config: {
        localHorizontalHierarchies: [
          { hierarchies: [['_types', '_types']], paths: ['src'] },
        ],
      },
      constraint: 'configuration/duplicate-element',
      message: 'Duplicate item "_types" in hierarchy.',
      normativeReference: 'CONFIG_7',
      propertyPath:
        'faf.common.localHorizontalHierarchies[0].hierarchies[0][1]',
    },
  ])(
    'rejects invalid hierarchy configuration producing $constraint',
    ({ config, constraint, message, normativeReference, propertyPath }) => {
      const outcomes = validateHierarchies(config, 'faf.common');
      expect(outcomes.length).toBeGreaterThanOrEqual(1);
      const outcome = outcomes.find(
        (o) => o.constraint === constraint && o.propertyPath === propertyPath
      );
      expect(outcome).toBeDefined();
      expect(outcome?.family).toBe('configuration');
      expect(outcome?.element).toBe(propertyPath);
      expect(outcome?.normativeReference).toBe(normativeReference);
      expect(outcome?.message).toBe(message);
    }
  );

  it('rejects explicit undefined in local horizontal hierarchy', () => {
    const localRecord: Record<string, unknown> = { hierarchies: [] };
    Object.defineProperty(localRecord, 'paths', {
      enumerable: true,
      value: void 0,
    });
    const outcomes = validateHierarchies(
      { localHorizontalHierarchies: [localRecord] },
      'faf.common'
    );
    expect(
      outcomes.some((o) => o.constraint === 'configuration/explicit-undefined')
    ).toBe(true);
    const outcome = outcomes.find(
      (o) => o.constraint === 'configuration/explicit-undefined'
    );
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('CONFIG_2');
    expect(outcome?.propertyPath).toBe(
      'faf.common.localHorizontalHierarchies[0].paths'
    );
    expect(outcome?.message).toBe(
      'Property "paths" cannot be explicitly undefined.'
    );
  });
});
