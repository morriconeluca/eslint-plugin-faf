import { describe, expect, it } from 'vitest';

import { validateRootLayers } from './validate-root-layers.util.js';

describe('validateRootLayers', () => {
  it('does nothing when rootLayers is undefined', () => {
    const outcomes = validateRootLayers(undefined, 'faf.locals[0]');
    expect(outcomes).toHaveLength(0);
  });

  it('rejects null rootLayers', () => {
    const outcomes = validateRootLayers(null, 'faf.locals[0]');
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe('configuration/null-forbidden');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('FAF §1.2, §6.9');
    expect(outcome?.propertyPath).toBe('faf.locals[0].rootLayers');
    expect(outcome?.element).toBe('faf.locals[0].rootLayers');
    expect(outcome?.message).toBe("'faf.locals[0].rootLayers' cannot be null");
  });

  it('rejects non-array rootLayers', () => {
    const outcomes = validateRootLayers('src', 'faf.locals[0]');
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe('configuration/invalid-type');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('FAF §1.2, §6.9');
    expect(outcome?.propertyPath).toBe('faf.locals[0].rootLayers');
    expect(outcome?.element).toBe('faf.locals[0].rootLayers');
    expect(outcome?.message).toBe(
      "'faf.locals[0].rootLayers' has an invalid type"
    );
  });

  it('accepts valid rootLayers array', () => {
    const outcomes = validateRootLayers(
      ['packages/a/src', 'packages/b/src'],
      'faf.locals[0]'
    );
    expect(outcomes).toHaveLength(0);
  });

  it.each([
    {
      constraint: 'configuration/null-forbidden',
      message: "'faf.locals[0].rootLayers[0]' cannot be null",
      normativeReference: 'FAF §1.2, §6.9',
      payload: [null],
      propertyPath: 'faf.locals[0].rootLayers[0]',
    },
    {
      constraint: 'configuration/invalid-type',
      message: "'faf.locals[0].rootLayers[0]' has an invalid type",
      normativeReference: 'FAF §1.2, §6.9',
      payload: [123],
      propertyPath: 'faf.locals[0].rootLayers[0]',
    },
    {
      constraint: 'configuration/empty-string',
      message: "'faf.locals[0].rootLayers[0]' cannot be an empty string",
      normativeReference: 'FAF §1.2, §6.9',
      payload: [''],
      propertyPath: 'faf.locals[0].rootLayers[0]',
    },
    {
      constraint: 'configuration/invalid-literal-path',
      message:
        "'faf.locals[0].rootLayers[0]' must be a POSIX relative path without empty or parent segments",
      normativeReference: 'FAF §1.2, §6.9',
      payload: ['./src'],
      propertyPath: 'faf.locals[0].rootLayers[0]',
    },
    {
      constraint: 'configuration/duplicate-element',
      message: "'faf.locals[0].rootLayers[1]' is a duplicate element",
      normativeReference: 'FAF §1.2, §6.9',
      payload: ['src', 'src'],
      propertyPath: 'faf.locals[0].rootLayers[1]',
    },
  ])(
    'rejects invalid rootLayer item producing $constraint',
    ({ constraint, message, normativeReference, payload, propertyPath }) => {
      const outcomes = validateRootLayers(payload, 'faf.locals[0]');
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
});
