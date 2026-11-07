import { describe, expect, it } from 'vitest';

import { validateSubGraphRoles } from './validate-sub-graph-roles.util.js';

describe('validateSubGraphRoles', () => {
  it('returns empty array when subGraphRoles is undefined', () => {
    const result = validateSubGraphRoles(undefined, 'faf.common');
    expect(result.entries).toHaveLength(0);
    expect(result.outcomes).toHaveLength(0);
  });

  it('rejects null subGraphRoles', () => {
    const outcomes = validateSubGraphRoles(null, 'faf.common').outcomes;
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe('configuration/null-forbidden');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('D-14');
    expect(outcome?.propertyPath).toBe('faf.common.subGraphRoles');
    expect(outcome?.element).toBe('faf.common.subGraphRoles');
    expect(outcome?.message).toBe("'faf.common.subGraphRoles' cannot be null");
  });

  it('rejects non-array subGraphRoles', () => {
    const outcomes = validateSubGraphRoles('spec', 'faf.common').outcomes;
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe('configuration/invalid-type');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('D-14');
    expect(outcome?.propertyPath).toBe('faf.common.subGraphRoles');
    expect(outcome?.element).toBe('faf.common.subGraphRoles');
    expect(outcome?.message).toBe(
      "'faf.common.subGraphRoles' has an invalid type"
    );
  });

  it('rejects null element in subGraphRoles', () => {
    const outcomes = validateSubGraphRoles([null], 'faf.common').outcomes;
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe('configuration/null-forbidden');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('D-14');
    expect(outcome?.propertyPath).toBe('faf.common.subGraphRoles[0]');
    expect(outcome?.element).toBe('faf.common.subGraphRoles[0]');
    expect(outcome?.message).toBe(
      "'faf.common.subGraphRoles[0]' cannot be null"
    );
  });

  it('rejects non-object element in subGraphRoles', () => {
    const outcomes = validateSubGraphRoles(['spec'], 'faf.common').outcomes;
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe('configuration/invalid-type');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('D-14');
    expect(outcome?.propertyPath).toBe('faf.common.subGraphRoles[0]');
    expect(outcome?.element).toBe('faf.common.subGraphRoles[0]');
    expect(outcome?.message).toBe(
      "'faf.common.subGraphRoles[0]' has an invalid type"
    );
  });

  it('accepts valid subGraphRoles', () => {
    const result = validateSubGraphRoles(
      [{ name: 'spec' }, { name: 'story' }],
      'faf.common'
    );
    expect(result.outcomes).toHaveLength(0);
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0]?.name).toBe('spec');
    expect(result.entries[0]?.path).toBe('faf.common.subGraphRoles[0]');
    expect(result.entries[1]?.name).toBe('story');
    expect(result.entries[1]?.path).toBe('faf.common.subGraphRoles[1]');
  });

  it.each([
    {
      constraint: 'configuration/unknown-property',
      message:
        "'faf.common.subGraphRoles[0].category' is not a recognized property",
      normativeReference: 'D-14',
      payload: [{ category: '_specs', name: 'spec' }],
      propertyPath: 'faf.common.subGraphRoles[0].category',
    },
    {
      constraint: 'configuration/unknown-property',
      message:
        "'faf.common.subGraphRoles[0].allowMultipleSymbols' is not a recognized property",
      normativeReference: 'D-14',
      payload: [{ allowMultipleSymbols: true, name: 'spec' }],
      propertyPath: 'faf.common.subGraphRoles[0].allowMultipleSymbols',
    },
    {
      constraint: 'configuration/null-forbidden',
      message: "'faf.common.subGraphRoles[0].name' cannot be null",
      normativeReference: 'D-14',
      payload: [{ name: null }],
      propertyPath: 'faf.common.subGraphRoles[0].name',
    },
    {
      constraint: 'configuration/missing-property',
      message: "'faf.common.subGraphRoles[0].name' is required and missing",
      normativeReference: 'D-14',
      payload: [{}],
      propertyPath: 'faf.common.subGraphRoles[0].name',
    },
    {
      constraint: 'configuration/invalid-type',
      message: "'faf.common.subGraphRoles[0].name' has an invalid type",
      normativeReference: 'D-14',
      payload: [{ name: 123 }],
      propertyPath: 'faf.common.subGraphRoles[0].name',
    },
    {
      constraint: 'configuration/empty-string',
      message: "'faf.common.subGraphRoles[0].name' cannot be an empty string",
      normativeReference: 'D-14',
      payload: [{ name: '' }],
      propertyPath: 'faf.common.subGraphRoles[0].name',
    },
  ])(
    'rejects invalid sub-graph role configuration producing $constraint',
    ({ constraint, message, normativeReference, payload, propertyPath }) => {
      const outcomes = validateSubGraphRoles(payload, 'faf.common').outcomes;
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
    const withExplicitUndefined: Record<string, unknown> = {};
    Object.defineProperty(withExplicitUndefined, 'name', {
      enumerable: true,
      value: void 0,
    });
    const outcomes = validateSubGraphRoles(
      [withExplicitUndefined],
      'faf.common'
    ).outcomes;
    expect(
      outcomes.some((o) => o.constraint === 'configuration/explicit-undefined')
    ).toBe(true);
    const outcome = outcomes.find(
      (o) => o.constraint === 'configuration/explicit-undefined'
    );
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('D-14');
    expect(outcome?.propertyPath).toBe('faf.common.subGraphRoles[0].name');
    expect(outcome?.message).toBe(
      "'faf.common.subGraphRoles[0].name' cannot be explicitly undefined"
    );
  });
});
