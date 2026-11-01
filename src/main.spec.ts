import { describe, expect, it } from 'vitest';

import plugin, { configs, meta, PLUGIN_NAME, rules } from './main.js';

describe('eslint-plugin-faf entrypoint', () => {
  it('should export correct plugin metadata', () => {
    expect(PLUGIN_NAME).toBe('@morriconeluca/eslint-plugin-faf');
    expect(meta.name).toBe('@morriconeluca/eslint-plugin-faf');
    expect(plugin['meta']).toBe(meta);
  });

  it('should export empty rules and configs dictionaries initially', () => {
    expect(rules).toEqual({});
    expect(configs).toEqual({});
    expect(plugin['rules']).toBe(rules);
    expect(plugin['configs']).toBe(configs);
  });

  it('should expose default export matching named exports', () => {
    expect(plugin).toEqual({
      configs: {},
      meta: {
        name: '@morriconeluca/eslint-plugin-faf',
      },
      rules: {},
    });
  });
});
