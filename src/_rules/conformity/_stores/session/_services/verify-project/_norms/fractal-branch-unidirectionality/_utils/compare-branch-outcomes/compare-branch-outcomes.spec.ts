import { describe, expect, it } from 'vitest';

import type { TDependencyOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { compareBranchOutcomes } from './index.js';

const createOutcome = (
  overrides: Partial<TDependencyOutcome> = {}
): TDependencyOutcome => ({
  constraint: 'dependency/fractal-branch-unidirectionality',
  element: 'src/a.ts',
  family: 'dependency',
  from: 'src/a.ts',
  importIndex: 0,
  message: 'violation',
  normativeReference: 'FAF §6.6.2',
  position: { column: 1, line: 1 },
  specifier: './b.js',
  to: 'src/b.ts',
  ...overrides,
});

const createOutcomeWithoutPosition = (): TDependencyOutcome => ({
  constraint: 'dependency/fractal-branch-unidirectionality',
  element: 'src/a.ts',
  family: 'dependency',
  from: 'src/a.ts',
  importIndex: 0,
  message: 'violation',
  normativeReference: 'FAF §6.6.2',
  specifier: './b.js',
  to: 'src/b.ts',
});

const createOutcomeWithoutSpecifier = (): TDependencyOutcome => ({
  constraint: 'dependency/fractal-branch-unidirectionality',
  element: 'src/a.ts',
  family: 'dependency',
  from: 'src/a.ts',
  importIndex: 0,
  message: 'violation',
  normativeReference: 'FAF §6.6.2',
  position: { column: 1, line: 1 },
  to: 'src/b.ts',
});

describe('compareBranchOutcomes', () => {
  it('orders by from path first', () => {
    const first = createOutcome({ from: 'src/a.ts' });
    const second = createOutcome({ from: 'src/b.ts' });
    expect(compareBranchOutcomes(first, second)).toBeLessThan(0);
    expect(compareBranchOutcomes(second, first)).toBeGreaterThan(0);
  });

  it('orders by source position when from is identical', () => {
    const first = createOutcome({ position: { column: 1, line: 1 } });
    const second = createOutcome({ position: { column: 1, line: 5 } });
    expect(compareBranchOutcomes(first, second)).toBeLessThan(0);
    expect(compareBranchOutcomes(second, first)).toBeGreaterThan(0);
  });

  it('handles absent source positions using default zero coordinates', () => {
    const withoutPosition = createOutcomeWithoutPosition();
    const withPosition = createOutcome({ position: { column: 1, line: 1 } });
    expect(compareBranchOutcomes(withoutPosition, withPosition)).toBeLessThan(
      0
    );
    expect(
      compareBranchOutcomes(withPosition, withoutPosition)
    ).toBeGreaterThan(0);
  });

  it('orders by import index when location is identical', () => {
    const first = createOutcome({ importIndex: 0 });
    const second = createOutcome({ importIndex: 1 });
    expect(compareBranchOutcomes(first, second)).toBeLessThan(0);
    expect(compareBranchOutcomes(second, first)).toBeGreaterThan(0);
  });

  it('orders by target path when import index matches', () => {
    const first = createOutcome({ to: 'src/b.ts' });
    const second = createOutcome({ to: 'src/c.ts' });
    expect(compareBranchOutcomes(first, second)).toBeLessThan(0);
    expect(compareBranchOutcomes(second, first)).toBeGreaterThan(0);
  });

  it('prefers direct edge outcomes over path outcomes', () => {
    const direct = createOutcome();
    const path = createOutcome({ chain: ['src/a.ts', 'src/x.ts', 'src/b.ts'] });
    expect(compareBranchOutcomes(direct, path)).toBeLessThan(0);
    expect(compareBranchOutcomes(path, direct)).toBeGreaterThan(0);
  });

  it('orders paths by chain length when targets match', () => {
    const shorter = createOutcome({ chain: ['src/a.ts', 'src/b.ts'] });
    const longer = createOutcome({
      chain: ['src/a.ts', 'src/x.ts', 'src/b.ts'],
    });
    expect(compareBranchOutcomes(shorter, longer)).toBeLessThan(0);
    expect(compareBranchOutcomes(longer, shorter)).toBeGreaterThan(0);
  });

  it('orders paths by chain segments when lengths match', () => {
    const first = createOutcome({
      chain: ['src/a.ts', 'src/m.ts', 'src/b.ts'],
    });
    const second = createOutcome({
      chain: ['src/a.ts', 'src/n.ts', 'src/b.ts'],
    });
    expect(compareBranchOutcomes(first, second)).toBeLessThan(0);
    expect(compareBranchOutcomes(second, first)).toBeGreaterThan(0);
  });

  it('orders by specifier when chains match', () => {
    const first = createOutcome({
      chain: ['src/a.ts', 'src/b.ts'],
      specifier: './b.js',
    });
    const second = createOutcome({
      chain: ['src/a.ts', 'src/b.ts'],
      specifier: './c.js',
    });
    expect(compareBranchOutcomes(first, second)).toBeLessThan(0);
    expect(compareBranchOutcomes(second, first)).toBeGreaterThan(0);
  });

  it('handles absent specifiers', () => {
    const withoutSpec = createOutcomeWithoutSpecifier();
    const withSpec = createOutcome({ specifier: './b.js' });
    expect(compareBranchOutcomes(withoutSpec, withSpec)).toBeLessThan(0);
    expect(compareBranchOutcomes(withSpec, withoutSpec)).toBeGreaterThan(0);
  });

  it('returns zero for identical outcomes', () => {
    const outcome = createOutcome();
    expect(compareBranchOutcomes(outcome, outcome)).toBe(0);
  });
});
