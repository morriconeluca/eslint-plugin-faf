import { describe, expect, it } from 'vitest';

import { classifyResolutionTarget } from './classify-resolution-target.util.js';

describe('classifyResolutionTarget', () => {
  const canonicalBase = '/repo';

  it('classifies builtin modules as external-library when no alias was used', () => {
    const result = classifyResolutionTarget({
      aliasAlternatives: [],
      aliasUsed: null,
      canonicalBase,
      resolveResult: {
        builtin: { isRuntimeModule: true, resolved: 'node:fs' },
      },
      specifier: 'node:fs',
    });

    expect(result).toEqual({
      packageName: 'node:fs',
      type: 'external-library',
    });
  });

  it('classifies node: prefixed specifier as external-library even without builtin record', () => {
    const result = classifyResolutionTarget({
      aliasAlternatives: [],
      aliasUsed: null,
      canonicalBase,
      resolveResult: {},
      specifier: 'node:custom',
    });

    expect(result).toEqual({
      packageName: 'node:custom',
      type: 'external-library',
    });
  });

  it('reports discordance when an alias is matched but resolution yields a builtin module', () => {
    const result = classifyResolutionTarget({
      aliasAlternatives: ['src/shared'],
      aliasUsed: '#shared',
      canonicalBase,
      resolveResult: {
        builtin: { isRuntimeModule: true, resolved: 'node:path' },
      },
      specifier: '#shared',
    });

    expect(result).toEqual({
      reason: 'Path alias resolution falls outside the declared alias targets',
      type: 'unresolved',
    });
  });

  it('classifies files within node_modules as external-library when no alias was used', () => {
    const result = classifyResolutionTarget({
      aliasAlternatives: [],
      aliasUsed: null,
      canonicalBase,
      resolveResult: {
        path: '/repo/node_modules/lodash/index.js',
      },
      specifier: 'lodash',
    });

    expect(result).toEqual({
      packageName: 'lodash',
      type: 'external-library',
    });
  });

  it('reports discordance when an alias is matched but resolution lands in node_modules', () => {
    const result = classifyResolutionTarget({
      aliasAlternatives: ['src/shared/lodash'],
      aliasUsed: '#shared',
      canonicalBase,
      resolveResult: {
        path: '/repo/node_modules/lodash/index.js',
      },
      specifier: '#shared/lodash',
    });

    expect(result).toEqual({
      reason: 'Path alias resolution falls outside the declared alias targets',
      type: 'unresolved',
    });
  });

  it('classifies local files as local-file when falling into declared alias alternatives', () => {
    const result = classifyResolutionTarget({
      aliasAlternatives: ['src/shared/unit'],
      aliasUsed: '#shared',
      canonicalBase,
      resolveResult: {
        path: '/repo/src/shared/unit/index.ts',
      },
      specifier: '#shared/unit',
    });

    expect(result).toEqual({
      path: 'src/shared/unit/index.ts',
      type: 'local-file',
    });
  });

  it('reports discordance when resolved local file does not fall into any alias alternative', () => {
    const result = classifyResolutionTarget({
      aliasAlternatives: ['src/shared/unit'],
      aliasUsed: '#shared',
      canonicalBase,
      resolveResult: {
        path: '/repo/src/other/unit.ts',
      },
      specifier: '#shared/unit',
    });

    expect(result).toEqual({
      reason: 'Path alias resolution falls outside the declared alias targets',
      type: 'unresolved',
    });
  });

  it('classifies local file without alias as local-file', () => {
    const result = classifyResolutionTarget({
      aliasAlternatives: [],
      aliasUsed: null,
      canonicalBase,
      resolveResult: {
        path: '/repo/src/components/button.tsx',
      },
      specifier: './components/button.tsx',
    });

    expect(result).toEqual({
      path: 'src/components/button.tsx',
      type: 'local-file',
    });
  });

  it('returns unresolved with resolver error when module cannot be found', () => {
    const result = classifyResolutionTarget({
      aliasAlternatives: [],
      aliasUsed: null,
      canonicalBase,
      resolveResult: {
        error: "Cannot find module './missing.js'",
      },
      specifier: './missing.js',
    });

    expect(result).toEqual({
      reason: "Cannot find module './missing.js'",
      type: 'unresolved',
    });
  });

  it('returns unresolved with default message when error is undefined', () => {
    const result = classifyResolutionTarget({
      aliasAlternatives: [],
      aliasUsed: null,
      canonicalBase,
      resolveResult: {},
      specifier: 'non-existent',
    });

    expect(result).toEqual({
      reason: "Cannot resolve module 'non-existent'",
      type: 'unresolved',
    });
  });

  it('classifies local file using fallback path when provided in resolution result', () => {
    const result = classifyResolutionTarget({
      aliasAlternatives: [],
      aliasUsed: null,
      canonicalBase,
      resolveResult: {
        path: '/repo/non-existent-directory-never-created/file.ts',
      },
      specifier: './file.ts',
    });

    expect(result).toEqual({
      path: 'non-existent-directory-never-created/file.ts',
      type: 'local-file',
    });
  });
});
