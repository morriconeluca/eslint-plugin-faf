import { describe, expect, it } from 'vitest';

import type { TDependencyOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { compareEdgeOutcomes } from './index.js';

type TOutcomeOptions = {
  readonly from: string;
  readonly importIndex?: number;
  readonly position?: { readonly column: number; readonly line: number };
  readonly specifier?: string;
  readonly to: string;
};

const createOutcome = (options: TOutcomeOptions): TDependencyOutcome => ({
  constraint: 'dependency/path-alias-anchoring',
  element: options.from,
  family: 'dependency',
  from: options.from,
  importIndex: options.importIndex ?? 0,
  message: 'diagnostic',
  normativeReference: 'FAF §7.4',
  position: options.position,
  specifier: options.specifier,
  to: options.to,
});

describe('compareEdgeOutcomes', () => {
  it('orders by from path first', () => {
    const first = createOutcome({ from: 'src/a.ts', to: 'src/target.ts' });
    const second = createOutcome({ from: 'src/b.ts', to: 'src/target.ts' });
    expect(compareEdgeOutcomes(first, second)).toBeLessThan(0);
    expect(compareEdgeOutcomes(second, first)).toBeGreaterThan(0);
  });

  it('orders by source position coordinates when from paths match', () => {
    const first = createOutcome({
      from: 'src/a.ts',
      position: { column: 1, line: 1 },
      to: 'src/targetB.ts',
    });
    const second = createOutcome({
      from: 'src/a.ts',
      position: { column: 1, line: 5 },
      to: 'src/targetA.ts',
    });
    expect(compareEdgeOutcomes(first, second)).toBeLessThan(0);
    expect(compareEdgeOutcomes(second, first)).toBeGreaterThan(0);
  });

  it('orders when one position is undefined and another defined', () => {
    const withoutPos = createOutcome({
      from: 'src/a.ts',
      to: 'src/target.ts',
    });
    const withPos = createOutcome({
      from: 'src/a.ts',
      position: { column: 1, line: 1 },
      to: 'src/target.ts',
    });
    expect(compareEdgeOutcomes(withoutPos, withPos)).toBeLessThan(0);
    expect(compareEdgeOutcomes(withPos, withoutPos)).toBeGreaterThan(0);
  });

  it('treats both undefined positions as equal and proceeds to next criterion', () => {
    const first = createOutcome({
      from: 'src/a.ts',
      importIndex: 1,
      to: 'src/target.ts',
    });
    const second = createOutcome({
      from: 'src/a.ts',
      importIndex: 2,
      to: 'src/target.ts',
    });
    expect(compareEdgeOutcomes(first, second)).toBeLessThan(0);
    expect(compareEdgeOutcomes(second, first)).toBeGreaterThan(0);
  });

  it('orders by importIndex when positions match', () => {
    const first = createOutcome({
      from: 'src/a.ts',
      importIndex: 0,
      position: { column: 1, line: 1 },
      to: 'src/targetB.ts',
    });
    const second = createOutcome({
      from: 'src/a.ts',
      importIndex: 1,
      position: { column: 1, line: 1 },
      to: 'src/targetA.ts',
    });
    expect(compareEdgeOutcomes(first, second)).toBeLessThan(0);
    expect(compareEdgeOutcomes(second, first)).toBeGreaterThan(0);
  });

  it('orders by to path when position and index match', () => {
    const first = createOutcome({ from: 'src/a.ts', to: 'src/targetA.ts' });
    const second = createOutcome({ from: 'src/a.ts', to: 'src/targetB.ts' });
    expect(compareEdgeOutcomes(first, second)).toBeLessThan(0);
    expect(compareEdgeOutcomes(second, first)).toBeGreaterThan(0);
  });

  it('orders by specifier when to paths match', () => {
    const first = createOutcome({
      from: 'src/a.ts',
      specifier: '#branch/a.js',
      to: 'src/target.ts',
    });
    const second = createOutcome({
      from: 'src/a.ts',
      specifier: '#branch/b.js',
      to: 'src/target.ts',
    });
    expect(compareEdgeOutcomes(first, second)).toBeLessThan(0);
    expect(compareEdgeOutcomes(second, first)).toBeGreaterThan(0);
  });

  it('orders when specifier is undefined on one outcome', () => {
    const withoutSpec = createOutcome({
      from: 'src/a.ts',
      to: 'src/target.ts',
    });
    const withSpec = createOutcome({
      from: 'src/a.ts',
      specifier: '#branch/a.js',
      to: 'src/target.ts',
    });
    expect(compareEdgeOutcomes(withoutSpec, withSpec)).toBeLessThan(0);
    expect(compareEdgeOutcomes(withSpec, withoutSpec)).toBeGreaterThan(0);
  });

  it('returns 0 when all criteria match', () => {
    const first = createOutcome({
      from: 'src/a.ts',
      importIndex: 0,
      position: { column: 1, line: 1 },
      specifier: '#branch/a.js',
      to: 'src/target.ts',
    });
    const second = createOutcome({
      from: 'src/a.ts',
      importIndex: 0,
      position: { column: 1, line: 1 },
      specifier: '#branch/a.js',
      to: 'src/target.ts',
    });
    expect(compareEdgeOutcomes(first, second)).toBe(0);
  });
});
