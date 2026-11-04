import { describe, expect, it } from 'vitest';

import { unknownKeyMessage } from './unknown-key-message.util.js';

describe('unknownKeyMessage', () => {
  it('describes a forbidden root property', () => {
    expect(unknownKeyMessage('root', 'trees')).toBe(
      'Unknown property "trees" is forbidden on root configuration object.'
    );
  });

  it('describes a plain forbidden property', () => {
    expect(unknownKeyMessage('plain', 'extra')).toBe(
      'Unknown property "extra" is forbidden.'
    );
  });

  it('describes forbidden faf and sub-graph properties', () => {
    expect(unknownKeyMessage('faf', 'severity')).toBe(
      'Unknown property "severity" is forbidden on faf object.'
    );
    expect(unknownKeyMessage('sub-graph', 'category')).toBe(
      'Unknown property "category" is forbidden on sub-graph role.'
    );
  });
});
