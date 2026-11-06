import { describe, expect, it } from 'vitest';

import type { TDependencyOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { compareTreeFrontierOutcomes } from './index.js';

const baseOutcome: TDependencyOutcome = {
  constraint: 'dependency/tree-opacity',
  element: 'a/source.ts',
  family: 'dependency',
  from: 'a/source.ts',
  importIndex: 0,
  message: 'base message',
  normativeReference: 'FAF §7.1',
  position: { column: 1, line: 2 },
  specifier: './b/dest.js',
  to: 'b/dest.ts',
};

const baseWithoutPosition: TDependencyOutcome = {
  constraint: 'dependency/tree-opacity',
  element: 'a/source.ts',
  family: 'dependency',
  from: 'a/source.ts',
  importIndex: 0,
  message: 'base message',
  normativeReference: 'FAF §7.1',
  specifier: './b/dest.js',
  to: 'b/dest.ts',
};

const baseWithoutSpecifier: TDependencyOutcome = {
  constraint: 'dependency/tree-opacity',
  element: 'a/source.ts',
  family: 'dependency',
  from: 'a/source.ts',
  importIndex: 0,
  message: 'base message',
  normativeReference: 'FAF §7.1',
  position: { column: 1, line: 2 },
  to: 'b/dest.ts',
};

describe('compareTreeFrontierOutcomes', () => {
  it('orders by from path', () => {
    const smaller: TDependencyOutcome = { ...baseOutcome, from: 'a.ts' };
    const greater: TDependencyOutcome = { ...baseOutcome, from: 'b.ts' };
    expect(compareTreeFrontierOutcomes(smaller, greater)).toBeLessThan(0);
    expect(compareTreeFrontierOutcomes(greater, smaller)).toBeGreaterThan(0);
  });

  it('orders by position line and column, defaulting absent position', () => {
    const smaller: TDependencyOutcome = {
      ...baseOutcome,
      position: { column: 1, line: 1 },
    };
    const greater: TDependencyOutcome = {
      ...baseOutcome,
      position: { column: 1, line: 2 },
    };
    expect(compareTreeFrontierOutcomes(smaller, greater)).toBeLessThan(0);
    expect(compareTreeFrontierOutcomes(greater, smaller)).toBeGreaterThan(0);

    expect(
      compareTreeFrontierOutcomes(baseWithoutPosition, smaller)
    ).toBeLessThan(0);
    expect(
      compareTreeFrontierOutcomes(smaller, baseWithoutPosition)
    ).toBeGreaterThan(0);
  });

  it('orders by importIndex when from and position match', () => {
    const smaller: TDependencyOutcome = { ...baseOutcome, importIndex: 0 };
    const greater: TDependencyOutcome = { ...baseOutcome, importIndex: 1 };
    expect(compareTreeFrontierOutcomes(smaller, greater)).toBeLessThan(0);
    expect(compareTreeFrontierOutcomes(greater, smaller)).toBeGreaterThan(0);
  });

  it('orders by to path when previous fields match', () => {
    const smaller: TDependencyOutcome = { ...baseOutcome, to: 'b/a.ts' };
    const greater: TDependencyOutcome = { ...baseOutcome, to: 'b/z.ts' };
    expect(compareTreeFrontierOutcomes(smaller, greater)).toBeLessThan(0);
    expect(compareTreeFrontierOutcomes(greater, smaller)).toBeGreaterThan(0);
  });

  it('orders by specifier when previous fields match, defaulting absent specifier', () => {
    const smaller: TDependencyOutcome = { ...baseOutcome, specifier: './a.js' };
    const greater: TDependencyOutcome = { ...baseOutcome, specifier: './b.js' };
    expect(compareTreeFrontierOutcomes(smaller, greater)).toBeLessThan(0);
    expect(compareTreeFrontierOutcomes(greater, smaller)).toBeGreaterThan(0);

    expect(
      compareTreeFrontierOutcomes(baseWithoutSpecifier, smaller)
    ).toBeLessThan(0);
    expect(
      compareTreeFrontierOutcomes(smaller, baseWithoutSpecifier)
    ).toBeGreaterThan(0);
  });

  it('orders by constraint when previous fields match', () => {
    const smaller: TDependencyOutcome = {
      ...baseOutcome,
      constraint: 'dependency/tree-authorization',
    };
    const greater: TDependencyOutcome = {
      ...baseOutcome,
      constraint: 'dependency/tree-opacity',
    };
    expect(compareTreeFrontierOutcomes(smaller, greater)).toBeLessThan(0);
    expect(compareTreeFrontierOutcomes(greater, smaller)).toBeGreaterThan(0);
  });

  it('orders by chain segments when previous fields match', () => {
    const smaller: TDependencyOutcome = {
      ...baseOutcome,
      chain: ['a.ts', 'x1.ts', 'b.ts'],
    };
    const greater: TDependencyOutcome = {
      ...baseOutcome,
      chain: ['a.ts', 'x2.ts', 'b.ts'],
    };
    expect(compareTreeFrontierOutcomes(smaller, greater)).toBeLessThan(0);
    expect(compareTreeFrontierOutcomes(greater, smaller)).toBeGreaterThan(0);
  });

  it('orders by message when all other fields match', () => {
    const smaller: TDependencyOutcome = { ...baseOutcome, message: 'alpha' };
    const greater: TDependencyOutcome = { ...baseOutcome, message: 'beta' };
    expect(compareTreeFrontierOutcomes(smaller, greater)).toBeLessThan(0);
    expect(compareTreeFrontierOutcomes(greater, smaller)).toBeGreaterThan(0);
  });

  it('returns zero for identical outcomes', () => {
    expect(compareTreeFrontierOutcomes(baseOutcome, baseOutcome)).toBe(0);
  });
});
