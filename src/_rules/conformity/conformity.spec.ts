import { describe, expect, it } from 'vitest';

import { createConformity } from './index.js';

describe('conformity', () => {
  it('exposes one message per outcome family and no autofix or options', () => {
    const rule = createConformity('0.5.0');
    expect(rule.meta?.type).toBe('problem');
    expect(rule.meta?.schema).toEqual([]);
    expect(rule.meta?.docs?.description).toBe(
      'Verify that the project conforms to the Fractal Architecture Framework.'
    );
    expect(Object.hasOwn(rule.meta ?? {}, 'fix')).toBe(false);
    expect(rule.meta?.messages).toEqual({
      acyclicity: '{{constraint}}: {{message}}',
      classification: '{{constraint}}: {{message}}',
      configuration: '{{constraint}}: {{message}}',
      dependency: '{{constraint}}: {{message}}',
      symbol: '{{constraint}}: {{message}}',
      unverified: '{{constraint}}: {{message}}',
    });
  });
});
