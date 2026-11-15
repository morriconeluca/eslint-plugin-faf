import { describe, expect, it } from 'vitest';

import type { TDependencyOutcome } from '../../../../../../../../_src@shared/_utils/create-outcome/index.js';

import { compareEdgeOutcomes } from './compare-edge-outcomes.util.js';

const createOutcome = (
  parameters: Partial<TDependencyOutcome> & { from: string; to: string }
): TDependencyOutcome => ({
  constraint: parameters.constraint ?? 'dependency/external-dependencies',
  element: parameters.from,
  family: 'dependency',
  from: parameters.from,
  importIndex: parameters.importIndex ?? 0,
  message: 'test',
  normativeReference: 'FAF §7.3',
  position: parameters.position,
  specifier: parameters.specifier,
  to: parameters.to,
});

describe('compareEdgeOutcomes', () => {
  it('orders by from path first', () => {
    const first = createOutcome({ from: 'src/a.ts', to: 'outside.ts' });
    const second = createOutcome({ from: 'src/b.ts', to: 'outside.ts' });
    expect(compareEdgeOutcomes(first, second)).toBeLessThan(0);
    expect(compareEdgeOutcomes(second, first)).toBeGreaterThan(0);
  });

  it('orders by source position coordinates when from paths match', () => {
    const first = createOutcome({
      from: 'src/a.ts',
      position: { column: 1, line: 1 },
      to: 'outsideB.ts',
    });
    const second = createOutcome({
      from: 'src/a.ts',
      position: { column: 1, line: 5 },
      to: 'outsideA.ts',
    });
    expect(compareEdgeOutcomes(first, second)).toBeLessThan(0);
    expect(compareEdgeOutcomes(second, first)).toBeGreaterThan(0);
  });

  it('orders when one position is undefined and another defined', () => {
    const withoutPosition = createOutcome({
      from: 'src/a.ts',
      to: 'outside.ts',
    });
    const withPosition = createOutcome({
      from: 'src/a.ts',
      position: { column: 1, line: 1 },
      to: 'outside.ts',
    });
    expect(compareEdgeOutcomes(withoutPosition, withPosition)).toBeLessThan(0);
    expect(compareEdgeOutcomes(withPosition, withoutPosition)).toBeGreaterThan(
      0
    );
  });

  it('orders by importIndex when positions match', () => {
    const first = createOutcome({
      from: 'src/a.ts',
      importIndex: 0,
      position: { column: 1, line: 1 },
      to: 'outsideB.ts',
    });
    const second = createOutcome({
      from: 'src/a.ts',
      importIndex: 1,
      position: { column: 1, line: 1 },
      to: 'outsideA.ts',
    });
    expect(compareEdgeOutcomes(first, second)).toBeLessThan(0);
    expect(compareEdgeOutcomes(second, first)).toBeGreaterThan(0);
  });

  it('orders by to path when position and index match', () => {
    const first = createOutcome({ from: 'src/a.ts', to: 'outsideA.ts' });
    const second = createOutcome({ from: 'src/a.ts', to: 'outsideB.ts' });
    expect(compareEdgeOutcomes(first, second)).toBeLessThan(0);
    expect(compareEdgeOutcomes(second, first)).toBeGreaterThan(0);
  });

  it('orders by specifier when to paths match', () => {
    const first = createOutcome({
      from: 'src/a.ts',
      specifier: '../outsideA.js',
      to: 'outside.ts',
    });
    const second = createOutcome({
      from: 'src/a.ts',
      specifier: '../outsideB.js',
      to: 'outside.ts',
    });
    expect(compareEdgeOutcomes(first, second)).toBeLessThan(0);
    expect(compareEdgeOutcomes(second, first)).toBeGreaterThan(0);
  });

  it('orders when specifier is undefined on one outcome', () => {
    const withoutSpecifier = createOutcome({
      from: 'src/a.ts',
      to: 'outside.ts',
    });
    const withSpecifier = createOutcome({
      from: 'src/a.ts',
      specifier: '../outside.js',
      to: 'outside.ts',
    });
    expect(compareEdgeOutcomes(withoutSpecifier, withSpecifier)).toBeLessThan(
      0
    );
    expect(
      compareEdgeOutcomes(withSpecifier, withoutSpecifier)
    ).toBeGreaterThan(0);
  });

  it('orders by constraint when specifier and all prior fields match', () => {
    const first = createOutcome({
      constraint: 'dependency/private-category-unidirectionality',
      from: 'src/a.ts',
      specifier: '../outside.js',
      to: 'outside.ts',
    });
    const second = createOutcome({
      constraint: 'dependency/private-category-visibility',
      from: 'src/a.ts',
      specifier: '../outside.js',
      to: 'outside.ts',
    });
    expect(compareEdgeOutcomes(first, second)).toBeLessThan(0);
    expect(compareEdgeOutcomes(second, first)).toBeGreaterThan(0);
  });

  it('returns zero when all compared fields are equal', () => {
    const first = createOutcome({
      from: 'src/a.ts',
      importIndex: 0,
      position: { column: 1, line: 1 },
      specifier: '../outside.js',
      to: 'outside.ts',
    });
    const second = createOutcome({
      from: 'src/a.ts',
      importIndex: 0,
      position: { column: 1, line: 1 },
      specifier: '../outside.js',
      to: 'outside.ts',
    });
    expect(compareEdgeOutcomes(first, second)).toBe(0);
  });
});
