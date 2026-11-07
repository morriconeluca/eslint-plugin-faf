import { describe, expect, it } from 'vitest';

import { collectSubpathTargets } from './collect-subpath-targets.util.js';

describe('collectSubpathTargets', () => {
  it('extracts local base for a single wildcard pattern target', () => {
    const result = collectSubpathTargets(
      './src/_src@shared/*',
      '#shared/*',
      true
    );

    expect('targets' in result && result.targets).toEqual(['src/_src@shared']);
  });

  it('extracts local base for an exact path target without wildcard', () => {
    const result = collectSubpathTargets('./src/main.ts', '#entry', false);

    expect('targets' in result && result.targets).toEqual(['src/main.ts']);
  });

  it('skips null and external library targets while retaining local targets', () => {
    const value = {
      browser: 'external-browser-lib',
      default: null,
      node: './src/_src@shared/*',
    };

    const result = collectSubpathTargets(value, '#shared/*', true);

    expect('targets' in result && result.targets).toEqual(['src/_src@shared']);
  });

  it('traverses nested conditional objects and arrays recursively', () => {
    const value = {
      node: {
        import: ['./src/_src@shared/*', './fallback/*'],
        require: './dist/cjs/*',
      },
    };

    const result = collectSubpathTargets(value, '#shared/*', true);

    expect('targets' in result && result.targets).toEqual([
      'src/_src@shared',
      'fallback',
      'dist/cjs',
    ]);
  });

  it('deduplicates identical resolved local targets', () => {
    const value = {
      import: './src/_src@shared/*',
      require: './src/_src@shared/*',
    };

    const result = collectSubpathTargets(value, '#shared/*', true);

    expect('targets' in result && result.targets).toEqual(['src/_src@shared']);
  });

  it('rejects invalid value types with complete outcome metadata', () => {
    const result = collectSubpathTargets(123, '#invalid-type', false);

    expect('outcome' in result && result.outcome).toEqual({
      constraint: 'configuration/invalid-alias-source',
      element: 'package.json',
      family: 'configuration',
      message:
        "'package.json' must declare valid imports with subpath keys: Invalid package.json imports target type: number",
      normativeReference: 'FAF §7.4',
      propertyPath: 'imports.#invalid-type',
    });
  });

  it.each([
    {
      expectedConstraint: 'configuration/invalid-alias-source',
      hasWildcardKey: false,
      key: '#empty',
      value: '',
    },
    {
      expectedConstraint: 'configuration/unresolvable-alias-base',
      hasWildcardKey: true,
      key: '#broken',
      value: './src/*/unresolvable',
    },
    {
      expectedConstraint: 'configuration/invalid-alias-source',
      hasWildcardKey: false,
      key: '#nested-invalid',
      value: { node: { import: 123 } },
    },
  ])(
    'fails with $expectedConstraint when target is invalid',
    ({ expectedConstraint, hasWildcardKey, key, value }) => {
      const result = collectSubpathTargets(value, key, hasWildcardKey);

      expect('outcome' in result && result.outcome.constraint).toBe(
        expectedConstraint
      );
    }
  );
});
