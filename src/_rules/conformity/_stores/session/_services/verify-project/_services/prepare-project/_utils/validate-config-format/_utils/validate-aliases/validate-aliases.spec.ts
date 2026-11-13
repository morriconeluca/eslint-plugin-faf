import { describe, expect, it } from 'vitest';

import type { TConfigConstraint } from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { OUTCOME_CATALOG } from '../../../../../../../../../../_conformity@shared/_configs/outcome-catalog.config.js';
import { validateAliases } from './validate-aliases.util.js';

describe('validateAliases', () => {
  it('accepts valid aliases map', () => {
    const outcomes = validateAliases(
      {
        '#shared': 'src/_src@shared',
        '#utils': 'src/_src@shared/_utils',
      },
      'faf.common'
    );
    expect(outcomes).toHaveLength(0);
  });

  it('rejects null aliases', () => {
    const outcomes = validateAliases(null, 'faf.common');
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe('configuration/null-forbidden');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('FAF §1.2, §6.9');
    expect(outcome?.propertyPath).toBe('faf.common.aliases');
    expect(outcome?.element).toBe('faf.common.aliases');
    expect(outcome?.message).toBe("'faf.common.aliases' cannot be null");
  });

  it('rejects non-object aliases like array or number', () => {
    const outcomes = validateAliases(['src'], 'faf.common');
    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0];
    expect(outcome?.constraint).toBe('configuration/invalid-type');
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('FAF §1.2, §6.9');
    expect(outcome?.propertyPath).toBe('faf.common.aliases');
    expect(outcome?.element).toBe('faf.common.aliases');
    expect(outcome?.message).toBe("'faf.common.aliases' has an invalid type");
  });

  it.each([
    {
      constraint: 'configuration/empty-string' as const,
      map: { '': 'src' },
      propertyPath: 'faf.common.aliases',
    },
    {
      constraint: 'configuration/invalid-alias-key' as const,
      map: { '#shared/': 'src' },
      propertyPath: 'faf.common.aliases.#shared/',
    },
    {
      constraint: 'configuration/invalid-alias-key' as const,
      map: { '#shared/*': 'src' },
      propertyPath: 'faf.common.aliases.#shared/*',
    },
    {
      constraint: 'configuration/null-forbidden' as const,
      map: { '#shared': null },
      propertyPath: 'faf.common.aliases.#shared',
    },
    {
      constraint: 'configuration/invalid-type' as const,
      map: { '#shared': ['src'] },
      propertyPath: 'faf.common.aliases.#shared',
    },
    {
      constraint: 'configuration/empty-string' as const,
      map: { '#shared': '' },
      propertyPath: 'faf.common.aliases.#shared',
    },
    {
      constraint: 'configuration/invalid-literal-path' as const,
      map: { '#shared': './src' },
      propertyPath: 'faf.common.aliases.#shared',
    },
  ])(
    'rejects invalid alias entry producing $constraint',
    ({
      constraint,
      map,
      propertyPath,
    }: {
      readonly constraint: TConfigConstraint;
      readonly map: Record<string, unknown>;
      readonly propertyPath: string;
    }) => {
      const outcomes = validateAliases(map, 'faf.common');
      expect(outcomes).toHaveLength(1);
      const outcome = outcomes[0];
      expect(outcome?.constraint).toBe(constraint);
      expect(outcome?.family).toBe('configuration');
      expect(outcome?.normativeReference).toBe(
        OUTCOME_CATALOG[constraint].normativeReference
      );
      expect(outcome?.propertyPath).toBe(propertyPath);
      expect(outcome?.element).toBe(propertyPath);
      expect(outcome?.message).toContain(propertyPath);
    }
  );
});
