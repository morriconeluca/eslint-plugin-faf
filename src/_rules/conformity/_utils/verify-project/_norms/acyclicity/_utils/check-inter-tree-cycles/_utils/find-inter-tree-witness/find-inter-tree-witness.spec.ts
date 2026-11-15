import { describe, expect, it } from 'vitest';

import { findInterTreeWitness } from './find-inter-tree-witness.util.js';

describe('findInterTreeWitness', () => {
  it('returns null when component has fewer than 2 trees even with self-loop', () => {
    expect(findInterTreeWitness([0], [[]], [[null]], 1)).toBeNull();
    expect(
      findInterTreeWitness([0], [[0]], [[{ segment: ['a/1.ts', 'a/2.ts'] }]], 1)
    ).toBeNull();
  });

  it('finds shortest witness for 2-tree cycle and preserves first step position', () => {
    const transitions = [
      [
        null,
        { position: { column: 1, line: 1 }, segment: ['a/1.ts', 'b/1.ts'] },
        null,
      ],
      [
        { position: { column: 9, line: 9 }, segment: ['b/2.ts', 'a/2.ts'] },
        null,
        null,
      ],
      [null, null, null],
    ];
    const result = findInterTreeWitness(
      [0, 1, 2],
      [[1], [0], []],
      transitions,
      3
    );
    expect(result?.witness).toEqual([
      ['a/1.ts', 'b/1.ts'],
      ['b/2.ts', 'a/2.ts'],
    ]);
    expect(result?.element).toBe('a/1.ts');
    expect(result?.position).toEqual({ column: 1, line: 1 });
  });

  it('sorts component indices so canonical start is minimum tree index', () => {
    const transitions = [
      [null, { segment: ['a/1.ts', 'b/1.ts'] }],
      [{ segment: ['b/2.ts', 'a/2.ts'] }, null],
    ];
    const result = findInterTreeWitness([1, 0], [[1], [0]], transitions, 2);
    expect(result?.element).toBe('a/1.ts');
  });

  it('handles empty segment in witness transitions', () => {
    const transitions = [
      [null, { segment: [] }, { segment: [] }],
      [{ segment: [] }, null, null],
      [{ segment: ['c/1.ts', 'a/1.ts'] }, null, null],
    ];
    const result = findInterTreeWitness(
      [0, 1, 2],
      [[1, 2], [0], [0]],
      transitions,
      3
    );
    expect(result?.element).toBe('');
  });

  it('handles tie breaking when multiple cycles have the same length', () => {
    const transitions = [
      [
        null,
        { segment: ['a/2.ts', 'b/2.ts'] },
        { segment: ['a/1.ts', 'c/1.ts'] },
      ],
      [{ segment: ['b/2.ts', 'a/2.ts'] }, null, null],
      [{ segment: ['c/1.ts', 'a/1.ts'] }, null, null],
    ];
    const result = findInterTreeWitness(
      [0, 1, 2],
      [[1, 2], [0], [0]],
      transitions,
      3
    );
    expect(result?.witness).toEqual([
      ['a/1.ts', 'c/1.ts'],
      ['c/1.ts', 'a/1.ts'],
    ]);
  });

  it('handles when alternative cycle candidate is worse or identical', () => {
    const transitions = [
      [
        null,
        { position: { column: 1, line: 1 }, segment: ['a/1.ts', 'b/1.ts'] },
        { position: { column: 1, line: 2 }, segment: ['a/1.ts', 'b/1.ts'] },
        { segment: ['a/9.ts', 'd/9.ts'] },
      ],
      [{ segment: ['b/1.ts', 'a/1.ts'] }, null, null, null],
      [{ segment: ['b/1.ts', 'a/1.ts'] }, null, null, null],
      [{ segment: ['d/9.ts', 'a/9.ts'] }, null, null, null],
    ];
    const result = findInterTreeWitness(
      [0, 1, 2, 3],
      [[1, 2, 3], [0], [0], [0]],
      transitions,
      4
    );
    expect(result?.witness).toEqual([
      ['a/1.ts', 'b/1.ts'],
      ['b/1.ts', 'a/1.ts'],
    ]);
    expect(result?.position).toEqual({ column: 1, line: 1 });
  });

  it('skips vertices smaller than start so that rotated cycles are not re-evaluated', () => {
    const transitions = [
      [null, null, { segment: ['z/0.ts', 'm/2.ts'] }],
      [{ segment: ['a/1.ts', 'z/0.ts'] }, null, null],
      [null, { segment: ['m/2.ts', 'a/1.ts'] }, null],
    ];
    const result = findInterTreeWitness(
      [0, 1, 2],
      [[2], [0], [1]],
      transitions,
      3
    );
    expect(result?.element).toBe('z/0.ts');
  });

  it('handles already visited nodes in diamond-like subgraphs and skips nodes smaller than start', () => {
    const transitions = [
      [
        null,
        { segment: ['a/1.ts', 'b/1.ts'] },
        { segment: ['a/1.ts', 'c/1.ts'] },
        null,
      ],
      [null, null, null, { segment: ['b/1.ts', 'd/1.ts'] }],
      [null, null, null, { segment: ['c/1.ts', 'd/1.ts'] }],
      [{ segment: ['d/1.ts', 'a/1.ts'] }, null, null, null],
    ];
    const result = findInterTreeWitness(
      [0, 1, 2, 3],
      [[1, 2], [3], [3], [0]],
      transitions,
      4
    );
    expect(result?.witness.length).toBe(3);
  });

  it('finds shorter cycle on subsequent start iterations', () => {
    const transitions = [
      [null, { segment: ['a/1.ts', 'b/1.ts'] }, null, null],
      [null, null, { segment: ['b/1.ts', 'c/1.ts'] }, null],
      [
        { segment: ['c/1.ts', 'a/1.ts'] },
        null,
        null,
        { segment: ['c/1.ts', 'd/1.ts'] },
      ],
      [null, null, { segment: ['d/1.ts', 'c/1.ts'] }, null],
    ];
    const result = findInterTreeWitness(
      [0, 1, 2, 3],
      [[1], [2], [0, 3], [2]],
      transitions,
      4
    );
    expect(result?.witness).toEqual([
      ['c/1.ts', 'd/1.ts'],
      ['d/1.ts', 'c/1.ts'],
    ]);
  });

  it('handles when tree path build fails during evaluation or missing adjacency row', () => {
    const transitions = [
      [null, { segment: ['a/1.ts', 'b/1.ts'] }],
      [null, null],
    ];
    expect(findInterTreeWitness([0, 1], [[1], [0]], transitions, 2)).toBeNull();
    expect(findInterTreeWitness([0, 1], [[1]], transitions, 2)).toBeNull();
  });

  it('prunes BFS queue when currentDepth reaches bestLength', () => {
    const transitions = [
      [
        null,
        { segment: ['a/1.ts', 'b/1.ts'] },
        { segment: ['a/2.ts', 'c/2.ts'] },
        null,
      ],
      [{ segment: ['b/1.ts', 'a/1.ts'] }, null, null, null],
      [null, null, null, { segment: ['c/1.ts', 'd/1.ts'] }],
      [{ segment: ['d/1.ts', 'a/1.ts'] }, null, null, null],
    ];
    const result = findInterTreeWitness(
      [0, 1, 2, 3],
      [[1, 2], [0], [3], [0]],
      transitions,
      4
    );
    expect(result?.witness).toEqual([
      ['a/1.ts', 'b/1.ts'],
      ['b/1.ts', 'a/1.ts'],
    ]);
  });

  it('tie-breaks equal-length cycles by segment destination and subsequent segments', () => {
    const transitions = [
      [
        null,
        { segment: ['a/1.ts', 'b/9.ts'] },
        { segment: ['a/1.ts', 'c/1.ts'] },
      ],
      [{ segment: ['b/9.ts', 'a/1.ts'] }, null, null],
      [{ segment: ['c/1.ts', 'a/1.ts'] }, null, null],
    ];
    const result = findInterTreeWitness(
      [0, 1, 2],
      [[1, 2], [0], [0]],
      transitions,
      3
    );
    expect(result?.witness).toEqual([
      ['a/1.ts', 'b/9.ts'],
      ['b/9.ts', 'a/1.ts'],
    ]);

    const secondSegmentTieBreak = [
      [
        null,
        { segment: ['a/1.ts', 'b/1.ts'] },
        { segment: ['a/1.ts', 'b/1.ts'] },
      ],
      [{ segment: ['b/2.ts', 'a/1.ts'] }, null, null],
      [{ segment: ['c/1.ts', 'a/1.ts'] }, null, null],
    ];
    const resultSecond = findInterTreeWitness(
      [0, 1, 2],
      [[1, 2], [0], [0]],
      secondSegmentTieBreak,
      3
    );
    expect(resultSecond?.witness).toEqual([
      ['a/1.ts', 'b/1.ts'],
      ['b/2.ts', 'a/1.ts'],
    ]);

    const betterFirst = [
      [
        null,
        { segment: ['a/1.ts', 'b/1.ts'] },
        { segment: ['a/1.ts', 'b/2.ts'] },
      ],
      [{ segment: ['b/1.ts', 'a/1.ts'] }, null, null],
      [{ segment: ['b/2.ts', 'a/1.ts'] }, null, null],
    ];
    expect(
      findInterTreeWitness([0, 1, 2], [[1, 2], [0], [0]], betterFirst, 3)
        ?.witness
    ).toEqual([
      ['a/1.ts', 'b/1.ts'],
      ['b/1.ts', 'a/1.ts'],
    ]);

    const equalThreeCycles = [
      [
        null,
        { segment: ['a/1.ts', 'b/1.ts'] },
        { segment: ['a/1.ts', 'c/1.ts'] },
        null,
        null,
      ],
      [null, null, null, { segment: ['b/1.ts', 'd/1.ts'] }, null],
      [null, null, null, null, { segment: ['c/1.ts', 'e/1.ts'] }],
      [{ segment: ['d/1.ts', 'a/1.ts'] }, null, null, null, null],
      [{ segment: ['e/1.ts', 'a/1.ts'] }, null, null, null, null],
    ];
    expect(
      findInterTreeWitness(
        [0, 1, 2, 3, 4],
        [[1, 2], [3], [4], [0], [0]],
        equalThreeCycles,
        5
      )?.witness
    ).toEqual([
      ['a/1.ts', 'b/1.ts'],
      ['b/1.ts', 'd/1.ts'],
      ['d/1.ts', 'a/1.ts'],
    ]);
  });
});
