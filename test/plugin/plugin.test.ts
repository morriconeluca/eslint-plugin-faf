import { describe, expect, it } from 'vitest';

import type { TFAFConfig } from '../../src/main.js';

import plugin from '../../src/main.js';

describe('plugin entrypoint', () => {
  it('publishes only the default plugin object', async () => {
    const entry = await import('../../src/main.js');
    expect(Object.keys(entry)).toEqual(['default']);
    expect(entry.default).toBe(plugin);
  });

  it('exports plugin object with exact package name', () => {
    expect(plugin.meta.name).toBe('@morriconeluca/eslint-plugin-faf');
  });

  it('matches exact plugin structure', () => {
    expect(plugin.meta).toEqual({
      name: '@morriconeluca/eslint-plugin-faf',
      namespace: 'faf',
      version: '0.5.0',
    });
    const recommended = plugin.configs.recommended;
    expect(recommended.plugins.faf).toBe(plugin);
    expect(recommended.plugins).toBe(plugin.configs.recommended.plugins);
    expect(recommended).toMatchObject({
      files: [
        '**/*.cjs',
        '**/*.cts',
        '**/*.js',
        '**/*.jsx',
        '**/*.mjs',
        '**/*.mts',
        '**/*.ts',
        '**/*.tsx',
      ],
      plugins: {
        faf: plugin,
      },
      rules: {
        'faf/conformity': 'error',
      },
    });
    expect(plugin.rules.conformity.meta?.type).toBe('problem');
    expect(plugin.rules.conformity.meta?.schema).toEqual([]);
    expect(plugin.rules.conformity.meta?.messages).toEqual({
      acyclicity: '{{constraint}}: {{message}} ({{reference}}).',
      classification: '{{constraint}}: {{message}} ({{reference}}).',
      configuration: '{{constraint}}: {{message}} ({{reference}}).',
      dependency: '{{constraint}}: {{message}} ({{reference}}).',
      symbol: '{{constraint}}: {{message}} ({{reference}}).',
      unverified: '{{constraint}}: {{message}} ({{reference}}).',
    });
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
