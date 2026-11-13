import { describe, expect, it } from 'vitest';

import { acquirePathAliases } from './acquire-path-aliases.util.js';

describe('acquirePathAliases', () => {
  it('produces empty alias array when neither source is present', () => {
    const resultFromUndefined = acquirePathAliases({});
    const resultFromMissingKey = acquirePathAliases({
      packageJson: { name: 'my-pkg' },
    });

    expect(resultFromUndefined.ok).toBe(true);
    expect(resultFromUndefined.ok && resultFromUndefined.value).toEqual([]);

    expect(resultFromMissingKey.ok).toBe(true);
    expect(resultFromMissingKey.ok && resultFromMissingKey.value).toEqual([]);
  });

  it('uses common.aliases when package imports is absent', () => {
    const result = acquirePathAliases({
      commonAliases: {
        '#shared': 'src/_src@shared',
      },
      packageJson: { name: 'my-pkg' },
    });

    expect(result.ok).toBe(true);
    expect(result.ok && result.value).toEqual([
      {
        prefix: '#shared',
        source: 'common.aliases',
        targets: ['src/_src@shared'],
      },
    ]);
  });

  it('uses package.json#imports when valid map is present and common aliases is absent', () => {
    const result = acquirePathAliases({
      packageJson: {
        imports: {
          '#shared/*': './src/_src@shared/*',
        },
      },
    });

    expect(result.ok).toBe(true);
    expect(result.ok && result.value).toEqual([
      {
        prefix: '#shared',
        source: 'package.json#imports',
        targets: ['src/_src@shared'],
      },
    ]);
  });

  it('produces empty array when package imports is empty object and common aliases is absent', () => {
    const result = acquirePathAliases({
      packageJson: {
        imports: {},
      },
    });

    expect(result.ok).toBe(true);
    expect(result.ok && result.value).toEqual([]);
  });

  it('reports duplicate source error when valid imports and common aliases both exist', () => {
    const result = acquirePathAliases({
      commonAliases: {
        '#shared': 'src/_src@shared',
      },
      packageJson: {
        imports: {
          '#shared/*': './src/_src@shared/*',
        },
      },
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.outcomes[0]).toEqual({
      constraint: 'configuration/duplicate-alias-source',
      element: 'fafconfig.ts',
      family: 'configuration',
      message:
        "'fafconfig.ts' cannot declare path aliases when package.json imports are present",
      normativeReference: 'FAF §7.4',
      propertyPath: 'faf.common.aliases',
    });
  });

  it('reports duplicate source error when empty imports object and common aliases both exist', () => {
    const result = acquirePathAliases({
      commonAliases: {
        '#shared': 'src/_src@shared',
      },
      packageJson: {
        imports: {},
      },
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.outcomes[0]).toEqual({
      constraint: 'configuration/duplicate-alias-source',
      element: 'fafconfig.ts',
      family: 'configuration',
      message:
        "'fafconfig.ts' cannot declare path aliases when package.json imports are present",
      normativeReference: 'FAF §7.4',
      propertyPath: 'faf.common.aliases',
    });
  });

  it('reports source error without fallback when invalid imports is present and common aliases is absent', () => {
    const result = acquirePathAliases({
      packageJson: {
        imports: 'invalid-primitive-string',
      },
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.outcomes[0]).toEqual({
      constraint: 'configuration/invalid-alias-source',
      element: 'package.json',
      family: 'configuration',
      message:
        "'package.json' must declare valid imports with subpath keys: package.json imports must be a JSON object",
      normativeReference: 'FAF §7.4',
      propertyPath: 'imports',
    });
  });

  it('reports source error without fallback when invalid imports and common aliases both exist', () => {
    const result = acquirePathAliases({
      commonAliases: {
        '#shared': 'src/_src@shared',
      },
      packageJson: {
        imports: 'invalid-primitive-string',
      },
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.outcomes[0]).toEqual({
      constraint: 'configuration/invalid-alias-source',
      element: 'package.json',
      family: 'configuration',
      message:
        "'package.json' must declare valid imports with subpath keys: package.json imports must be a JSON object",
      normativeReference: 'FAF §7.4',
      propertyPath: 'imports',
    });
  });

  it('reports unresolvable base outcome when a local target base cannot be determined uniquely', () => {
    const result = acquirePathAliases({
      packageJson: {
        imports: {
          '#shared/*': './src/*/unresolvable',
        },
      },
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.outcomes[0]).toEqual({
      constraint: 'configuration/unresolvable-alias-base',
      element: 'package.json',
      family: 'configuration',
      message:
        "'package.json' defines a path alias whose base path cannot be resolved: Local import target must contain a single terminal wildcard matching key: ./src/*/unresolvable",
      normativeReference: 'FAF §7.4',
      propertyPath: 'imports.#shared/*',
    });
  });

  it('acquires conditional and alternative targets from package.json imports', () => {
    const result = acquirePathAliases({
      packageJson: {
        imports: {
          '#shared/*': {
            browser: null,
            node: ['./src/_src@shared/*', './dist/_src@shared/*'],
            other: 'external-package',
          },
        },
      },
    });

    expect(result.ok).toBe(true);
    expect(result.ok && result.value).toEqual([
      {
        prefix: '#shared',
        source: 'package.json#imports',
        targets: ['src/_src@shared', 'dist/_src@shared'],
      },
    ]);
  });
});
