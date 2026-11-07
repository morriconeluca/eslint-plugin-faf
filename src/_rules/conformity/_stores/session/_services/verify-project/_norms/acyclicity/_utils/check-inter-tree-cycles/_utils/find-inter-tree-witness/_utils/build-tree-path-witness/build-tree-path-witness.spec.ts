import { describe, expect, it } from 'vitest';

import { buildTreePathWitness } from './index.js';

describe('buildTreePathWitness', () => {
  it('builds witness from tree path and transition matrix', () => {
    const transitions = [
      [
        null,
        { position: { column: 1, line: 1 }, segment: ['a/1.ts', 'b/1.ts'] },
      ],
      [{ segment: ['b/2.ts', 'a/2.ts'] }, null],
    ];
    const result = buildTreePathWitness([0, 1, 0], transitions);
    expect(result?.witness).toEqual([
      ['a/1.ts', 'b/1.ts'],
      ['b/2.ts', 'a/2.ts'],
    ]);
    expect(result?.position).toEqual({ column: 1, line: 1 });
  });

  it('returns null when transition is missing or indices invalid', () => {
    expect(buildTreePathWitness([0, 1], [[null, null]])).toBeNull();
    expect(buildTreePathWitness([0, 1], [[]])).toBeNull();
    expect(buildTreePathWitness([99, 0], [[]])).toBeNull();

    const sparsePathU: number[] = [];
    sparsePathU[1] = 0;
    expect(buildTreePathWitness(sparsePathU, [[null]])).toBeNull();

    const sparsePathV = [0];
    sparsePathV[2] = 1;
    expect(buildTreePathWitness(sparsePathV, [[null]])).toBeNull();
  });
});
