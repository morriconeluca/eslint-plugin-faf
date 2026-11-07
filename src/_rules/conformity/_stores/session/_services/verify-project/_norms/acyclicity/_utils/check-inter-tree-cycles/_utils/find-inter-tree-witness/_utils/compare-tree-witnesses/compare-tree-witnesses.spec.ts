import { describe, expect, it } from 'vitest';

import { compareTreeWitnesses } from './index.js';

describe('compareTreeWitnesses', () => {
  it('compares identical witnesses as zero', () => {
    expect(compareTreeWitnesses([['a.ts', 'b.ts']], [['a.ts', 'b.ts']])).toBe(
      0
    );
  });

  it('orders witnesses with earlier segments first', () => {
    expect(
      compareTreeWitnesses([['a.ts', 'b.ts']], [['a.ts', 'c.ts']])
    ).toBeLessThan(0);
    expect(
      compareTreeWitnesses(
        [['a.ts', 'b.ts']],
        [
          ['a.ts', 'b.ts'],
          ['c.ts', 'd.ts'],
        ]
      )
    ).toBeLessThan(0);
  });
});
