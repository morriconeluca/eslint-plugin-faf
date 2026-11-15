import { describe, expect, it } from 'vitest';

import { findSelfLoopWitness } from './find-self-loop-witness.util.js';

describe('findSelfLoopWitness', () => {
  it('returns self-loop path when present', () => {
    expect(findSelfLoopWitness([0], new Set([0]), ['src/a.ts'])).toEqual([
      'src/a.ts',
      'src/a.ts',
    ]);
  });

  it('returns null when absent or index out of range', () => {
    expect(findSelfLoopWitness([0], new Set(), ['src/a.ts'])).toBeNull();
    expect(findSelfLoopWitness([5], new Set([5]), ['src/a.ts'])).toBeNull();
  });
});
