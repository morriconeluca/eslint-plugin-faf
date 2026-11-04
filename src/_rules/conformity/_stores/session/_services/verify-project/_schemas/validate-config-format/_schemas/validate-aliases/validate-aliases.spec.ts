import { describe, expect, it } from 'vitest';

import type { TConfigOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { validateAliases } from './validate-aliases.schema.js';

describe('validateAliases', () => {
  it('accepts valid aliases map', () => {
    const outcomes: TConfigOutcome[] = [];
    validateAliases(
      {
        '#shared': 'src/_src@shared',
        '#utils': 'src/_src@shared/_utils',
      },
      'faf.common',
      outcomes
    );
    expect(outcomes).toHaveLength(0);
  });

  it('rejects null aliases', () => {
    const outcomes: TConfigOutcome[] = [];
    validateAliases(null, 'faf.common', outcomes);
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe('configuration/null-forbidden');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('CONFIG_2');
    expect(outcome?.propertyPath).toBe('faf.common.aliases');
    expect(outcome?.element).toBe('faf.common.aliases');
    expect(outcome?.message).toBe('Property "aliases" cannot be null.');
  });

  it('rejects non-object aliases like array or number', () => {
    const outcomes: TConfigOutcome[] = [];
    validateAliases(['src'], 'faf.common', outcomes);
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe('configuration/invalid-type');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('CONFIG_9');
    expect(outcome?.propertyPath).toBe('faf.common.aliases');
    expect(outcome?.element).toBe('faf.common.aliases');
    expect(outcome?.message).toBe(
      'Property "aliases" must be a map of string prefixes to path strings.'
    );
  });

  it.each([
    {
      constraint: 'configuration/empty-string',
      map: { '': 'src' },
      message: 'Alias key cannot be empty.',
      normativeReference: 'CONFIG_9',
      propertyPath: 'faf.common.aliases',
    },
    {
      constraint: 'configuration/invalid-alias-key',
      map: { '#shared/': 'src' },
      message: 'Alias key "#shared/" cannot have a trailing slash.',
      normativeReference: 'CONFIG_9',
      propertyPath: 'faf.common.aliases.#shared/',
    },
    {
      constraint: 'configuration/invalid-alias-key',
      map: { '#shared/*': 'src' },
      message: 'Alias key "#shared/*" cannot contain wildcard characters.',
      normativeReference: 'CONFIG_9',
      propertyPath: 'faf.common.aliases.#shared/*',
    },
    {
      constraint: 'configuration/null-forbidden',
      map: { '#shared': null },
      message: 'Alias target cannot be null.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.aliases.#shared',
    },
    {
      constraint: 'configuration/invalid-type',
      map: { '#shared': ['src'] },
      message: 'Alias target for "#shared" must be a string path.',
      normativeReference: 'CONFIG_9',
      propertyPath: 'faf.common.aliases.#shared',
    },
    {
      constraint: 'configuration/empty-string',
      map: { '#shared': '' },
      message: 'Alias target cannot be empty.',
      normativeReference: 'CONFIG_9',
      propertyPath: 'faf.common.aliases.#shared',
    },
    {
      constraint: 'configuration/invalid-literal-path',
      map: { '#shared': './src' },
      message: 'Invalid literal config path "./src".',
      normativeReference: 'CONFIG_2_2',
      propertyPath: 'faf.common.aliases.#shared',
    },
  ])(
    'rejects invalid alias entry producing $constraint',
    ({ constraint, map, message, normativeReference, propertyPath }) => {
      const outcomes: TConfigOutcome[] = [];
      validateAliases(map, 'faf.common', outcomes);
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
