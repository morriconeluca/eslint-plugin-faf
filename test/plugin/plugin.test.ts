import { describe, expect, it } from 'vitest';

import plugin, { meta } from '../../src/main.js';

describe('plugin entrypoint', () => {
  it('exports named meta matching package name', () => {
    expect(meta.name).toBe('@morriconeluca/eslint-plugin-faf');
  });

  it('exports plugin object with exact package name', () => {
    expect(plugin['meta'].name).toBe('@morriconeluca/eslint-plugin-faf');
  });

  it('matches exact plugin structure', () => {
    expect(plugin).toEqual({
      meta: {
        name: '@morriconeluca/eslint-plugin-faf',
      },
    });
  });
});
