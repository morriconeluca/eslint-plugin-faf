import { describe, expect, it } from 'vitest';

import {
  COMMON_ALIASES_PROPERTY_PATH,
  CONFIG_9_REFERENCE,
  DUPLICATE_ALIAS_SOURCE_CONSTRAINT,
  FAF_CONFIG_ELEMENT,
  INVALID_ALIAS_SOURCE_CONSTRAINT,
  PACKAGE_JSON_ELEMENT,
  PACKAGE_JSON_IMPORTS_PROPERTY_PATH,
  UNRESOLVABLE_ALIAS_BASE_CONSTRAINT,
} from './acquire-path-aliases.constant.js';
import { acquirePathAliases } from './acquire-path-aliases.util.js';

describe('acquirePathAliases', () => {
  it('exposes exact architectural constant definitions', () => {
    expect(DUPLICATE_ALIAS_SOURCE_CONSTRAINT).toBe(
      'configuration/duplicate-alias-source'
    );
    expect(INVALID_ALIAS_SOURCE_CONSTRAINT).toBe(
      'configuration/invalid-alias-source'
    );
    expect(UNRESOLVABLE_ALIAS_BASE_CONSTRAINT).toBe(
      'configuration/unresolvable-alias-base'
    );
    expect(CONFIG_9_REFERENCE).toBe('CONFIG_9');
    expect(FAF_CONFIG_ELEMENT).toBe('fafconfig.ts');
    expect(PACKAGE_JSON_ELEMENT).toBe('package.json');
    expect(COMMON_ALIASES_PROPERTY_PATH).toBe('faf.common.aliases');
    expect(PACKAGE_JSON_IMPORTS_PROPERTY_PATH).toBe('imports');
  });

  it('produces empty alias array when neither source is present (row 1: campo assente, assente)', () => {
    const resultFromUndefined = acquirePathAliases({});
    const resultFromMissingKey = acquirePathAliases({
      packageJson: { name: 'my-pkg' },
    });

    expect(resultFromUndefined.ok).toBe(true);
    expect(resultFromUndefined.ok && resultFromUndefined.value).toEqual([]);

    expect(resultFromMissingKey.ok).toBe(true);
    expect(resultFromMissingKey.ok && resultFromMissingKey.value).toEqual([]);
  });

  it('uses common.aliases when package imports is absent (row 2: campo assente, presente)', () => {
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

  it('uses package.json#imports when valid map is present and common aliases is absent (row 3: mappa valida presente, assente)', () => {
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

  it('produces empty array when package imports is empty object and common aliases is absent (row 4: oggetto vuoto presente, assente)', () => {
    const result = acquirePathAliases({
      packageJson: {
        imports: {},
      },
    });

    expect(result.ok).toBe(true);
    expect(result.ok && result.value).toEqual([]);
  });

  it('reports duplicate source error when valid imports and common aliases both exist (row 5: mappa valida presente, presente)', () => {
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
        'Path aliases must not be declared in both fafconfig.ts common.aliases and package.json imports',
      normativeReference: 'CONFIG_9',
      propertyPath: 'faf.common.aliases',
    });
  });

  it('reports duplicate source error when empty imports object and common aliases both exist (row 6: oggetto vuoto presente, presente)', () => {
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
        'Path aliases must not be declared in both fafconfig.ts common.aliases and package.json imports',
      normativeReference: 'CONFIG_9',
      propertyPath: 'faf.common.aliases',
    });
  });

  it('reports source error without fallback when invalid imports is present and common aliases is absent (row 7: valore non valido presente, assente)', () => {
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
      message: 'package.json imports must be a JSON object',
      normativeReference: 'CONFIG_9',
      propertyPath: 'imports',
    });
  });

  it('reports source error without fallback when invalid imports and common aliases both exist (row 8: valore non valido presente, presente)', () => {
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
      message: 'package.json imports must be a JSON object',
      normativeReference: 'CONFIG_9',
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
        'Local import target must contain a single terminal wildcard matching key: ./src/*/unresolvable',
      normativeReference: 'CONFIG_9',
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
