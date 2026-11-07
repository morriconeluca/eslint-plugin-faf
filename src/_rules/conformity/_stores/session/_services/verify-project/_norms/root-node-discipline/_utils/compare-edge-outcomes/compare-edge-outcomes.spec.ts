import { describe, expect, it } from 'vitest';

import type { TDependencyOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { compareEdgeOutcomes } from './compare-edge-outcomes.util.js';

const makeOutcome = (
  overrides: Partial<TDependencyOutcome> = {}
): TDependencyOutcome => ({
  constraint: 'dependency/root-node-discipline',
  element: 'src/a.ts',
  family: 'dependency',
  from: 'src/a.ts',
  importIndex: 0,
  message: 'test message',
  normativeReference: 'FAF §6.2.2',
  position: { column: 1, line: 1 },
  specifier: './b.js',
  to: 'src/b.ts',
  ...overrides,
});

const makeOutcomeWithoutPosition = (): TDependencyOutcome => ({
  constraint: 'dependency/root-node-discipline',
  element: 'src/a.ts',
  family: 'dependency',
  from: 'src/a.ts',
  importIndex: 0,
  message: 'test message',
  normativeReference: 'FAF §6.2.2',
  specifier: './b.js',
  to: 'src/b.ts',
});

const makeOutcomeWithoutSpecifier = (): TDependencyOutcome => ({
  constraint: 'dependency/root-node-discipline',
  element: 'src/a.ts',
  family: 'dependency',
  from: 'src/a.ts',
  importIndex: 0,
  message: 'test message',
  normativeReference: 'FAF §6.2.2',
  to: 'src/b.ts',
});

describe('compareEdgeOutcomes', () => {
  it('orders by from path first', () => {
    const earlier = makeOutcome({ from: 'src/a.ts' });
    const later = makeOutcome({ from: 'src/z.ts' });

    expect(compareEdgeOutcomes(earlier, later)).toBe(-1);
    expect(compareEdgeOutcomes(later, earlier)).toBe(1);
  });

  it('orders by position line when from paths match', () => {
    const earlier = makeOutcome({ position: { column: 1, line: 2 } });
    const later = makeOutcome({ position: { column: 1, line: 5 } });

    expect(compareEdgeOutcomes(earlier, later)).toBe(-3);
    expect(compareEdgeOutcomes(later, earlier)).toBe(3);
  });

  it('orders by position column when line numbers match', () => {
    const earlier = makeOutcome({ position: { column: 3, line: 2 } });
    const later = makeOutcome({ position: { column: 8, line: 2 } });

    expect(compareEdgeOutcomes(earlier, later)).toBe(-5);
    expect(compareEdgeOutcomes(later, earlier)).toBe(5);
  });

  it('handles absent position using column 0 line 0', () => {
    const absent = makeOutcomeWithoutPosition();
    const present = makeOutcome({ position: { column: 1, line: 1 } });

    expect(compareEdgeOutcomes(absent, present)).toBe(-1);
    expect(compareEdgeOutcomes(present, absent)).toBe(1);
    expect(compareEdgeOutcomes(absent, absent)).toBe(0);
  });

  it('orders by importIndex when positions match', () => {
    const earlier = makeOutcome({ importIndex: 1 });
    const later = makeOutcome({ importIndex: 4 });

    expect(compareEdgeOutcomes(earlier, later)).toBe(-3);
    expect(compareEdgeOutcomes(later, earlier)).toBe(3);
  });

  it('orders by to path when importIndex matches', () => {
    const earlier = makeOutcome({ to: 'src/b.ts' });
    const later = makeOutcome({ to: 'src/c.ts' });

    expect(compareEdgeOutcomes(earlier, later)).toBe(-1);
    expect(compareEdgeOutcomes(later, earlier)).toBe(1);
  });

  it('orders by specifier when to paths match', () => {
    const earlier = makeOutcome({ specifier: './alpha.js' });
    const later = makeOutcome({ specifier: './beta.js' });

    expect(compareEdgeOutcomes(earlier, later)).toBe(-1);
    expect(compareEdgeOutcomes(later, earlier)).toBe(1);
  });

  it('handles absent specifiers using empty string', () => {
    const absent = makeOutcomeWithoutSpecifier();
    const present = makeOutcome({ specifier: './b.js' });

    expect(compareEdgeOutcomes(absent, present)).toBe(-1);
    expect(compareEdgeOutcomes(present, absent)).toBe(1);
    expect(compareEdgeOutcomes(absent, absent)).toBe(0);
  });

  it('returns 0 for identical outcomes', () => {
    const left = makeOutcome();
    const right = makeOutcome();

    expect(compareEdgeOutcomes(left, right)).toBe(0);
  });
});
