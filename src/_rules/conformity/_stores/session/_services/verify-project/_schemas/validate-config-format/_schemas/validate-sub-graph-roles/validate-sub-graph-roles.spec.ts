import { describe, expect, it } from 'vitest';

import type { TConfigOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { validateSubGraphRoles } from './validate-sub-graph-roles.schema.js';

describe('validateSubGraphRoles', () => {
  it('returns empty array when subGraphRoles is undefined', () => {
    const outcomes: TConfigOutcome[] = [];
    const result = validateSubGraphRoles(undefined, 'faf.common', outcomes);
    expect(result).toHaveLength(0);
    expect(outcomes).toHaveLength(0);
  });

  it('rejects null subGraphRoles', () => {
    const outcomes: TConfigOutcome[] = [];
    validateSubGraphRoles(null, 'faf.common', outcomes);
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe('configuration/null-forbidden');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('CONFIG_2');
    expect(outcome?.propertyPath).toBe('faf.common.subGraphRoles');
    expect(outcome?.element).toBe('faf.common.subGraphRoles');
    expect(outcome?.message).toBe('Property "subGraphRoles" cannot be null.');
  });

  it('rejects non-array subGraphRoles', () => {
    const outcomes: TConfigOutcome[] = [];
    validateSubGraphRoles('spec', 'faf.common', outcomes);
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe('configuration/invalid-type');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('CONFIG_2');
    expect(outcome?.propertyPath).toBe('faf.common.subGraphRoles');
    expect(outcome?.element).toBe('faf.common.subGraphRoles');
    expect(outcome?.message).toBe('Property "subGraphRoles" must be an array.');
  });

  it('rejects null element in subGraphRoles', () => {
    const outcomes: TConfigOutcome[] = [];
    validateSubGraphRoles([null], 'faf.common', outcomes);
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe('configuration/null-forbidden');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('CONFIG_2');
    expect(outcome?.propertyPath).toBe('faf.common.subGraphRoles[0]');
    expect(outcome?.element).toBe('faf.common.subGraphRoles[0]');
    expect(outcome?.message).toBe('Sub-graph role cannot be null.');
  });

  it('rejects non-object element in subGraphRoles', () => {
    const outcomes: TConfigOutcome[] = [];
    validateSubGraphRoles(['spec'], 'faf.common', outcomes);
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe('configuration/invalid-type');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('CONFIG_2');
    expect(outcome?.propertyPath).toBe('faf.common.subGraphRoles[0]');
    expect(outcome?.element).toBe('faf.common.subGraphRoles[0]');
    expect(outcome?.message).toBe('Sub-graph role must be an object.');
  });

  it('accepts valid subGraphRoles', () => {
    const outcomes: TConfigOutcome[] = [];
    const result = validateSubGraphRoles(
      [{ name: 'spec' }, { name: 'story' }],
      'faf.common',
      outcomes
    );
    expect(outcomes).toHaveLength(0);
    expect(result).toHaveLength(2);
    expect(result[0]?.name).toBe('spec');
    expect(result[0]?.path).toBe('faf.common.subGraphRoles[0]');
    expect(result[1]?.name).toBe('story');
    expect(result[1]?.path).toBe('faf.common.subGraphRoles[1]');
  });

  it.each([
    {
      constraint: 'configuration/unknown-property',
      message: 'Unknown property "category" is forbidden on sub-graph role.',
      normativeReference: 'CONFIG_3',
      payload: [{ category: '_specs', name: 'spec' }],
      propertyPath: 'faf.common.subGraphRoles[0].category',
    },
    {
      constraint: 'configuration/unknown-property',
      message:
        'Unknown property "allowMultipleSymbols" is forbidden on sub-graph role.',
      normativeReference: 'CONFIG_3',
      payload: [{ allowMultipleSymbols: true, name: 'spec' }],
      propertyPath: 'faf.common.subGraphRoles[0].allowMultipleSymbols',
    },
    {
      constraint: 'configuration/null-forbidden',
      message: 'Property "name" cannot be null.',
      normativeReference: 'CONFIG_2',
      payload: [{ name: null }],
      propertyPath: 'faf.common.subGraphRoles[0].name',
    },
    {
      constraint: 'configuration/missing-property',
      message: 'Required property "name" is missing.',
      normativeReference: 'CONFIG_3',
      payload: [{}],
      propertyPath: 'faf.common.subGraphRoles[0].name',
    },
    {
      constraint: 'configuration/invalid-type',
      message: 'Property "name" must be a string.',
      normativeReference: 'CONFIG_2',
      payload: [{ name: 123 }],
      propertyPath: 'faf.common.subGraphRoles[0].name',
    },
    {
      constraint: 'configuration/empty-string',
      message: 'Property "name" cannot be empty.',
      normativeReference: 'CONFIG_2',
      payload: [{ name: '' }],
      propertyPath: 'faf.common.subGraphRoles[0].name',
    },
  ])(
    'rejects invalid sub-graph role configuration producing $constraint',
    ({ constraint, message, normativeReference, payload, propertyPath }) => {
      const outcomes: TConfigOutcome[] = [];
      validateSubGraphRoles(payload, 'faf.common', outcomes);
      expect(outcomes).toHaveLength(1);
      const outcome = outcomes[0];
      expect(outcome?.constraint).toBe(constraint);
      expect(outcome?.family).toBe('configuration');
      expect(outcome?.normativeReference).toBe(normativeReference);
      expect(outcome?.propertyPath).toBe(propertyPath);
      expect(outcome?.element).toBe(propertyPath);
      expect(outcome?.message).toBe(message);
    }
  );

  it('rejects explicit undefined property', () => {
    const outcomes: TConfigOutcome[] = [];
    const withExplicitUndefined: Record<string, unknown> = {};
    Object.defineProperty(withExplicitUndefined, 'name', {
      enumerable: true,
      value: void 0,
    });
    validateSubGraphRoles([withExplicitUndefined], 'faf.common', outcomes);
    expect(
      outcomes.some((o) => o.constraint === 'configuration/explicit-undefined')
    ).toBe(true);
    const outcome = outcomes.find(
      (o) => o.constraint === 'configuration/explicit-undefined'
    );
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('CONFIG_2');
    expect(outcome?.propertyPath).toBe('faf.common.subGraphRoles[0].name');
    expect(outcome?.message).toBe(
      'Property "name" cannot be explicitly undefined.'
    );
  });
});
