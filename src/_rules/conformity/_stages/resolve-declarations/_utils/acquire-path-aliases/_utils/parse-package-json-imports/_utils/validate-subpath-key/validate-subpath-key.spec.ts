import { describe, expect, it } from 'vitest';

import { validateSubpathKey } from './validate-subpath-key.util.js';

describe('validateSubpathKey', () => {
  it('validates terminal wildcard subpath key and extracts prefix', () => {
    const result = validateSubpathKey('#shared/*');

    expect(result).toEqual({
      hasWildcardKey: true,
      prefix: '#shared',
    });
  });

  it('validates exact subpath key without wildcard', () => {
    const result = validateSubpathKey('#entry');

    expect(result).toEqual({
      hasWildcardKey: false,
      prefix: '#entry',
    });
  });

  it.each([
    {
      expectedConstraint: 'configuration/invalid-alias-source',
      key: 'no-hash',
    },
    {
      expectedConstraint: 'configuration/invalid-alias-source',
      key: '#',
    },
    {
      expectedConstraint: 'configuration/unresolvable-alias-base',
      key: '#shared/*/*',
    },
    {
      expectedConstraint: 'configuration/unresolvable-alias-base',
      key: '#shared/*/sub',
    },
    {
      expectedConstraint: 'configuration/unresolvable-alias-base',
      key: '#shared*',
    },
    {
      expectedConstraint: 'configuration/invalid-alias-source',
      key: '#shared/',
    },
  ])(
    'rejects invalid subpath key $key with $expectedConstraint',
    ({ expectedConstraint, key }) => {
      const result = validateSubpathKey(key);

      expect('outcome' in result && result.outcome.constraint).toBe(
        expectedConstraint
      );
      expect('outcome' in result && result.outcome.element).toBe(
        'package.json'
      );
      expect('outcome' in result && result.outcome.family).toBe(
        'configuration'
      );
      expect('outcome' in result && result.outcome.normativeReference).toBe(
        'FAF §7.4'
      );
      expect('outcome' in result && result.outcome.propertyPath).toBe(
        `imports.${key}`
      );
      expect('outcome' in result && result.outcome.message.length > 0).toBe(
        true
      );
    }
  );
});
