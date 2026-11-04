import { describe, expect, it } from 'vitest';

import type { TFAFConfig } from '../../src/main.js';

import plugin, { meta } from '../../src/main.js';

describe('plugin entrypoint', () => {
  it('exports named meta matching package name', () => {
    expect(meta.name).toBe('@morriconeluca/eslint-plugin-faf');
  });

  it('exports plugin object with exact package name', () => {
    expect(plugin['meta'].name).toBe('@morriconeluca/eslint-plugin-faf');
  });

  it('matches exact plugin structure', () => {
    expect(plugin['meta']).toEqual({
      name: '@morriconeluca/eslint-plugin-faf',
    });
    expect(plugin['configs']).toEqual({
      recommended: {
        rules: {
          'faf/conformity': 'error',
        },
      },
    });
    expect(plugin['rules']?.['conformity']?.meta?.type).toBe('problem');
    expect(plugin['rules']?.['conformity']?.meta?.schema).toEqual([]);
  });

  it('exports configuration types that validate configuration shapes', () => {
    const validConfig = {
      faf: {
        locals: [
          {
            rootLayers: ['src'],
          },
        ],
      },
    } as const satisfies TFAFConfig;
    expect(validConfig.faf.locals).toHaveLength(1);
  });
});
