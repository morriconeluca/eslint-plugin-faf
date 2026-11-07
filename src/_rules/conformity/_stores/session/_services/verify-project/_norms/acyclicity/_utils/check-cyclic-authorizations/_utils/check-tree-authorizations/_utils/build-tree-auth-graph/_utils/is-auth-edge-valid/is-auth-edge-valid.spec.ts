import { describe, expect, it } from 'vitest';

import { isAuthEdgeValid } from './index.js';

describe('isAuthEdgeValid', () => {
  it('validates distinct unvisited indices', () => {
    expect(isAuthEdgeValid(0, 1, new Set())).toBe(true);
  });

  it('rejects self-loops and seen edges', () => {
    expect(isAuthEdgeValid(0, 0, new Set())).toBe(false);
    expect(isAuthEdgeValid(0, 1, new Set(['0\u{0}1']))).toBe(false);
  });
});
