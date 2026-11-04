import { describe, expect, it } from 'vitest';

import { conformity } from './index.js';

describe('conformity', () => {
  it('exposes a problem rule with an empty schema and reports nothing', () => {
    expect(conformity.meta.type).toBe('problem');
    expect(conformity.meta.schema).toEqual([]);
    expect(conformity.meta.docs.description).toBe(
      'Verify that the project conforms to the Fractal Architecture Framework.'
    );
    expect(conformity.create()).toEqual({});
  });
});
