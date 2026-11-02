import { describe, expect, it } from 'vitest';

import { assertInvariant } from './index.js';

describe('assertInvariant', () => {
  it('does not throw when condition is true', () => {
    expect(() => {
      assertInvariant(true, 'invariant failed');
    }).not.toThrow();
  });

  it('throws a plain Error with the exact provided message when condition is false', () => {
    const message = 'custom invariant violation';
    expect(() => {
      assertInvariant(false, message);
    }).toThrow(new Error(message));
  });

  it('narrows typescript types via assertion signature', () => {
    const value: unknown = 'valid-string';
    assertInvariant(typeof value === 'string', 'value must not be null');
    expect(value).toHaveLength(12);
  });
});
