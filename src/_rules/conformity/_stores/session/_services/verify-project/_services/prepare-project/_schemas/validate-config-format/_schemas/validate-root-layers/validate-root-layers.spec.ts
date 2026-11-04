import { describe, expect, it } from 'vitest';

import type { TConfigOutcome } from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { validateRootLayers } from './validate-root-layers.schema.js';

describe('validateRootLayers', () => {
  it('does nothing when rootLayers is undefined', () => {
    const outcomes: TConfigOutcome[] = [];
    validateRootLayers(undefined, 'faf.locals[0]', outcomes);
    expect(outcomes).toHaveLength(0);
  });

  it('rejects null rootLayers', () => {
    const outcomes: TConfigOutcome[] = [];
    validateRootLayers(null, 'faf.locals[0]', outcomes);
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe('configuration/null-forbidden');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('CONFIG_2');
    expect(outcome?.propertyPath).toBe('faf.locals[0].rootLayers');
    expect(outcome?.element).toBe('faf.locals[0].rootLayers');
    expect(outcome?.message).toBe('Property "rootLayers" cannot be null.');
  });

  it('rejects non-array rootLayers', () => {
    const outcomes: TConfigOutcome[] = [];
    validateRootLayers('src', 'faf.locals[0]', outcomes);
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe('configuration/invalid-type');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('CONFIG_2');
    expect(outcome?.propertyPath).toBe('faf.locals[0].rootLayers');
    expect(outcome?.element).toBe('faf.locals[0].rootLayers');
    expect(outcome?.message).toBe('Property "rootLayers" must be an array.');
  });

  it('accepts valid rootLayers array', () => {
    const outcomes: TConfigOutcome[] = [];
    validateRootLayers(
      ['packages/a/src', 'packages/b/src'],
      'faf.locals[0]',
      outcomes
    );
    expect(outcomes).toHaveLength(0);
  });

  it.each([
    {
      constraint: 'configuration/null-forbidden',
      message: 'Root layer element cannot be null.',
      normativeReference: 'CONFIG_2',
      payload: [null],
      propertyPath: 'faf.locals[0].rootLayers[0]',
    },
    {
      constraint: 'configuration/invalid-type',
      message: 'Root layer element must be a string.',
      normativeReference: 'CONFIG_2',
      payload: [123],
      propertyPath: 'faf.locals[0].rootLayers[0]',
    },
    {
      constraint: 'configuration/empty-string',
      message: 'Root layer element cannot be empty.',
      normativeReference: 'CONFIG_2',
      payload: [''],
      propertyPath: 'faf.locals[0].rootLayers[0]',
    },
    {
      constraint: 'configuration/invalid-literal-path',
      message: 'Invalid literal config path "./src".',
      normativeReference: 'CONFIG_2_2',
      payload: ['./src'],
      propertyPath: 'faf.locals[0].rootLayers[0]',
    },
    {
      constraint: 'configuration/duplicate-element',
      message: 'Duplicate root layer "src".',
      normativeReference: 'CONFIG_2',
      payload: ['src', 'src'],
      propertyPath: 'faf.locals[0].rootLayers[1]',
    },
  ])(
    'rejects invalid rootLayer item producing $constraint',
    ({ constraint, message, normativeReference, payload, propertyPath }) => {
      const outcomes: TConfigOutcome[] = [];
      validateRootLayers(payload, 'faf.locals[0]', outcomes);
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
