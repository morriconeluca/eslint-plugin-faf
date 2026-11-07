import { describe, expect, it } from 'vitest';

import { resolveLocalSubpathTarget } from './resolve-local-subpath-target.util.js';

describe('resolveLocalSubpathTarget', () => {
  it('resolves valid wildcard target ending with /*', () => {
    const result = resolveLocalSubpathTarget(
      './src/_src@shared/*',
      '#shared/*',
      true
    );

    expect('target' in result && result.target).toBe('src/_src@shared');
  });

  it('resolves valid exact target without wildcard', () => {
    const result = resolveLocalSubpathTarget('./src/main.ts', '#entry', false);

    expect('target' in result && result.target).toBe('src/main.ts');
  });

  it('normalizes dot and trailing slashes in target paths', () => {
    const resultWithDot = resolveLocalSubpathTarget('./*', '#root/*', true);
    const resultWithSlash = resolveLocalSubpathTarget(
      './src/_src@shared/',
      '#shared',
      false
    );

    expect('target' in resultWithDot && resultWithDot.target).toBe('.');
    expect('target' in resultWithSlash && resultWithSlash.target).toBe(
      'src/_src@shared'
    );
  });

  it('returns null target for external package references', () => {
    const result = resolveLocalSubpathTarget('lodash', '#dep', false);

    expect('target' in result && result.target).toBeNull();
  });

  it.each([
    {
      expectedConstraint: 'configuration/invalid-alias-source',
      hasWildcardKey: false,
      key: '#empty',
      target: '',
    },
    {
      expectedConstraint: 'configuration/invalid-alias-source',
      hasWildcardKey: false,
      key: '#parent',
      target: '../external',
    },
    {
      expectedConstraint: 'configuration/invalid-alias-source',
      hasWildcardKey: false,
      key: '#abs',
      target: '/absolute/path',
    },
    {
      expectedConstraint: 'configuration/unresolvable-alias-base',
      hasWildcardKey: true,
      key: '#wildcard',
      target: './src/no-wildcard.ts',
    },
    {
      expectedConstraint: 'configuration/unresolvable-alias-base',
      hasWildcardKey: true,
      key: '#wildcard',
      target: './src/no-slash*',
    },
    {
      expectedConstraint: 'configuration/unresolvable-alias-base',
      hasWildcardKey: true,
      key: '#wildcard',
      target: './src/*/middle',
    },
    {
      expectedConstraint: 'configuration/unresolvable-alias-base',
      hasWildcardKey: true,
      key: '#wildcard',
      target: './src/*/*',
    },
    {
      expectedConstraint: 'configuration/unresolvable-alias-base',
      hasWildcardKey: false,
      key: '#exact',
      target: './src/*',
    },
  ])(
    'returns outcome $expectedConstraint for invalid target $target',
    ({ expectedConstraint, hasWildcardKey, key, target }) => {
      const result = resolveLocalSubpathTarget(target, key, hasWildcardKey);

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
