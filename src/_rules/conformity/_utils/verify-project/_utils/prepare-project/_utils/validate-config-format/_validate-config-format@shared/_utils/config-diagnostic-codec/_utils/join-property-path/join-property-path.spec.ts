import { describe, expect, it } from 'vitest';

import { joinPropertyPath } from './join-property-path.util.js';

describe('joinPropertyPath', () => {
  it('joins a base path with a relative index or property', () => {
    expect(joinPropertyPath('faf.locals[0]', 'rootLayers[0]')).toBe(
      'faf.locals[0].rootLayers[0]'
    );
    expect(joinPropertyPath('faf.locals', '[0]')).toBe('faf.locals[0]');
    expect(joinPropertyPath('', 'faf')).toBe('faf');
  });
});
