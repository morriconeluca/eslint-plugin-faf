import { describe, expect, it } from 'vitest';

import { parsePackageJsonImports } from './parse-package-json-imports.util.js';

describe('parsePackageJsonImports', () => {
  it('returns an empty array when imports is an empty object', () => {
    const result = parsePackageJsonImports({});

    expect(result.ok).toBe(true);
    expect(result.ok && result.value).toEqual([]);
  });

  it('rejects rawImports when not a JSON object', () => {
    const stringResult = parsePackageJsonImports('not-an-object');
    const arrayResult = parsePackageJsonImports([]);
    const nullResult = parsePackageJsonImports(null);

    expect(stringResult.ok).toBe(false);
    expect(arrayResult.ok).toBe(false);
    expect(nullResult.ok).toBe(false);
    expect(!stringResult.ok && stringResult.outcomes[0]).toEqual({
      constraint: 'configuration/invalid-alias-source',
      element: 'package.json',
      family: 'configuration',
      message:
        "'package.json' must declare valid imports with subpath keys: package.json imports must be a JSON object",
      normativeReference: 'FAF §7.4',
      propertyPath: 'imports',
    });
  });

  it('parses valid terminal wildcard mappings into prefixes and local target bases', () => {
    const imports = {
      '#shared/*': './src/_src@shared/*',
    };

    const result = parsePackageJsonImports(imports);

    expect(result.ok).toBe(true);
    expect(result.ok && result.value).toEqual([
      {
        prefix: '#shared',
        source: 'package.json#imports',
        targets: ['src/_src@shared'],
      },
    ]);
  });

  it('parses valid exact subpath mappings into exact prefixes and targets', () => {
    const imports = {
      '#entry': './src/main.ts',
    };

    const result = parsePackageJsonImports(imports);

    expect(result.ok).toBe(true);
    expect(result.ok && result.value).toEqual([
      {
        prefix: '#entry',
        source: 'package.json#imports',
        targets: ['src/main.ts'],
      },
    ]);
  });

  it('omits subpath entries having only external targets without error', () => {
    const imports = {
      '#external': 'some-npm-package',
    };

    const result = parsePackageJsonImports(imports);

    expect(result.ok).toBe(true);
    expect(result.ok && result.value).toEqual([]);
  });

  it.each([
    {
      expectedConstraint: 'configuration/invalid-alias-source',
      key: 'shared',
      target: './src/_src@shared/*',
    },
    {
      expectedConstraint: 'configuration/invalid-alias-source',
      key: '#',
      target: './src/_src@shared/*',
    },
    {
      expectedConstraint: 'configuration/unresolvable-alias-base',
      key: '#shared/*/*',
      target: './src/_src@shared/*/*',
    },
    {
      expectedConstraint: 'configuration/unresolvable-alias-base',
      key: '#shared/*/sub',
      target: './src/_src@shared/*',
    },
    {
      expectedConstraint: 'configuration/invalid-alias-source',
      key: '#shared/',
      target: './src/_src@shared',
    },
    {
      expectedConstraint: 'configuration/unresolvable-alias-base',
      key: '#shared/*',
      target: './src/*/unresolvable',
    },
  ])(
    'rejects invalid entry with $key mapping to $target yielding $expectedConstraint',
    ({ expectedConstraint, key, target }) => {
      const imports: Record<string, unknown> = {
        [key]: target,
      };

      const result = parsePackageJsonImports(imports);

      expect(result.ok).toBe(false);
      expect(!result.ok && result.outcomes[0]?.constraint).toBe(
        expectedConstraint
      );
      expect(!result.ok && result.outcomes[0]?.element).toBe('package.json');
      expect(!result.ok && result.outcomes[0]?.family).toBe('configuration');
      expect(!result.ok && result.outcomes[0]?.normativeReference).toBe(
        'FAF §7.4'
      );
    }
  );
});
