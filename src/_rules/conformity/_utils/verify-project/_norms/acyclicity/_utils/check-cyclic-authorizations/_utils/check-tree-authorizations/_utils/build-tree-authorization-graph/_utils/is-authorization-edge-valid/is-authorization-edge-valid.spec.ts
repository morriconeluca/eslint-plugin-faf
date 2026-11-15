import { describe, expect, it } from 'vitest';

import { isAuthorizationEdgeValid } from './is-authorization-edge-valid.util.js';

describe('isAuthorizationEdgeValid', () => {
  it('validates distinct unvisited indices', () => {
    expect(isAuthorizationEdgeValid(0, 1, new Set())).toBe(true);
  });

  it('rejects self-loops and seen edges', () => {
    expect(isAuthorizationEdgeValid(0, 0, new Set())).toBe(false);
    expect(isAuthorizationEdgeValid(0, 1, new Set(['0\u{0}1']))).toBe(false);
  });
});
