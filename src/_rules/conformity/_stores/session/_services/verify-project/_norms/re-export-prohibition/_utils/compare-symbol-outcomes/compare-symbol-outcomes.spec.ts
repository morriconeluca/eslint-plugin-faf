import { describe, expect, it } from 'vitest';

import type { TSymbolOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { compareSymbolOutcomes } from './compare-symbol-outcomes.util.js';

const makeOutcome = (
  overrides: Partial<TSymbolOutcome> & Pick<TSymbolOutcome, 'element'>
): TSymbolOutcome => ({
  constraint: 'symbol/re-export-prohibition',
  family: 'symbol',
  message: 'default message',
  normativeReference: 'FAF §5',
  ...overrides,
});

describe('compareSymbolOutcomes', () => {
  it('orders by element first', () => {
    const first = makeOutcome({ element: 'src/a.ts' });
    const second = makeOutcome({ element: 'src/b.ts' });

    expect(compareSymbolOutcomes(first, second)).toBeLessThan(0);
    expect(compareSymbolOutcomes(second, first)).toBeGreaterThan(0);
  });

  it('orders by position when element is identical', () => {
    const first = makeOutcome({
      element: 'src/a.ts',
      position: { column: 1, line: 1 },
    });
    const second = makeOutcome({
      element: 'src/a.ts',
      position: { column: 1, line: 2 },
    });

    expect(compareSymbolOutcomes(first, second)).toBeLessThan(0);
    expect(compareSymbolOutcomes(second, first)).toBeGreaterThan(0);
  });

  it('uses default absent location when position is absent', () => {
    const withoutPos = makeOutcome({ element: 'src/a.ts' });
    const withPos = makeOutcome({
      element: 'src/a.ts',
      position: { column: 1, line: 1 },
    });

    expect(compareSymbolOutcomes(withoutPos, withPos)).toBeLessThan(0);
    expect(compareSymbolOutcomes(withPos, withoutPos)).toBeGreaterThan(0);
  });

  it('orders by message when element and position are identical', () => {
    const first = makeOutcome({
      element: 'src/a.ts',
      message: 'alpha',
      position: { column: 1, line: 1 },
    });
    const second = makeOutcome({
      element: 'src/a.ts',
      message: 'beta',
      position: { column: 1, line: 1 },
    });

    expect(compareSymbolOutcomes(first, second)).toBeLessThan(0);
    expect(compareSymbolOutcomes(second, first)).toBeGreaterThan(0);
  });

  it('returns zero when all fields match', () => {
    const first = makeOutcome({
      element: 'src/a.ts',
      message: 'same',
      position: { column: 1, line: 1 },
    });
    const second = makeOutcome({
      element: 'src/a.ts',
      message: 'same',
      position: { column: 1, line: 1 },
    });

    expect(compareSymbolOutcomes(first, second)).toBe(0);
  });
});
