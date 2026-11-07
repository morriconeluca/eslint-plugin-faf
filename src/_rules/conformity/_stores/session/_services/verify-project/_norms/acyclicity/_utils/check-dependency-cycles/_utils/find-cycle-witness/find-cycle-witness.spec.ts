import { describe, expect, it } from 'vitest';

import { findCycleWitness } from './index.js';

describe('findCycleWitness', () => {
  it('returns self-loop witness when self loop is present', () => {
    const result = findCycleWitness([0], new Set([0]), [[]], ['src/a.ts'], 1);
    expect(result?.witness).toEqual(['src/a.ts', 'src/a.ts']);
    expect(result?.element).toBe('src/a.ts');
  });

  it('returns null for single vertex without self-loop', () => {
    const result = findCycleWitness([0], new Set(), [[]], ['src/a.ts'], 1);
    expect(result).toBeNull();
  });

  it('returns closed shortest witness for 2-vertex cycle in multi-node component', () => {
    const result = findCycleWitness(
      [0, 1, 2],
      new Set(),
      [[1], [0], []],
      ['src/a.ts', 'src/b.ts', 'src/c.ts'],
      3
    );
    expect(result?.witness).toEqual(['src/a.ts', 'src/b.ts', 'src/a.ts']);
    expect(result?.element).toBe('src/a.ts');
  });

  it('sorts component indices so canonical start is minimum node index', () => {
    const result = findCycleWitness(
      [1, 0],
      new Set(),
      [[1], [0]],
      ['src/a.ts', 'src/b.ts'],
      2
    );
    expect(result?.element).toBe('src/a.ts');
  });

  it('handles empty path mappings during cycle reconstruction', () => {
    const result = findCycleWitness([0, 1], new Set(), [[1], [0]], [], 2);
    expect(result?.witness).toEqual([]);
  });

  it('tie-breaks lexicographically among equal length cycles and handles diamond paths', () => {
    const result = findCycleWitness(
      [0, 1, 2, 3],
      new Set(),
      [[2, 1], [3, 0], [3, 0], [0]],
      ['src/a.ts', 'src/b.ts', 'src/c.ts', 'src/d.ts'],
      4
    );
    expect(result?.witness).toEqual(['src/a.ts', 'src/b.ts', 'src/a.ts']);
  });

  it('handles when alternative cycle candidate of same length is worse', () => {
    const result = findCycleWitness(
      [0, 1, 2],
      new Set(),
      [[1, 2], [0], [0]],
      ['src/a.ts', 'src/b.ts', 'src/z.ts'],
      3
    );
    expect(result?.witness).toEqual(['src/a.ts', 'src/b.ts', 'src/a.ts']);
  });

  it('skips vertices smaller than start so that rotated cycles are not re-evaluated', () => {
    const result = findCycleWitness(
      [0, 1, 2],
      new Set(),
      [[2], [0], [1]],
      ['src/z.ts', 'src/a.ts', 'src/m.ts'],
      3
    );
    expect(result?.element).toBe('src/z.ts');
  });

  it('handles neighbor outside component and missing adjacency row', () => {
    const result = findCycleWitness(
      [0, 1],
      new Set(),
      [[1, 99]],
      ['src/a.ts', 'src/b.ts'],
      2
    );
    expect(result).toBeNull();
  });

  it('finds shorter cycle in subsequent iterations when overallBestCycle is non-null', () => {
    const result = findCycleWitness(
      [0, 1, 2, 3],
      new Set(),
      [[1], [2], [0, 3], [2]],
      ['src/a.ts', 'src/b.ts', 'src/c.ts', 'src/d.ts'],
      4
    );
    expect(result?.witness).toEqual(['src/c.ts', 'src/d.ts', 'src/c.ts']);
  });
});
