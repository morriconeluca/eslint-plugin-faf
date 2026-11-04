import { describe, expect, it } from 'vitest';

import { isInNodeModules } from './is-in-node-modules.util.js';

describe('isInNodeModules', () => {
  it('identifies paths containing /node_modules/', () => {
    expect(isInNodeModules('/repo/node_modules/pkg/index.js')).toBe(true);
  });

  it('identifies paths starting with node_modules/', () => {
    expect(isInNodeModules('node_modules/pkg/index.js')).toBe(true);
  });

  it('identifies paths ending with /node_modules', () => {
    expect(isInNodeModules('/repo/node_modules')).toBe(true);
  });

  it('returns false for paths outside node_modules', () => {
    expect(isInNodeModules('/repo/src/packages/pkg/index.js')).toBe(false);
  });
});
