import { describe, expect, it } from 'vitest';

import type { TSymbolOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { compareAccessNodeOutcomes } from './compare-access-node-outcomes.util.js';

const makeOutcome = (
  element: string,
  constraint:
    | 'symbol/access-node-master-export'
    | 'symbol/access-node-own-symbols',
  message: string,
  line?: number
): TSymbolOutcome => ({
  constraint,
  element,
  family: 'symbol',
  message,
  normativeReference: 'FAF §6.1.1',
  position: line === undefined ? undefined : { column: 1, line },
});

describe('compareAccessNodeOutcomes', () => {
  it('orders by element first regardless of message', () => {
    const first = makeOutcome(
      'a/index.ts',
      'symbol/access-node-own-symbols',
      'zebra'
    );
    const second = makeOutcome(
      'b/index.ts',
      'symbol/access-node-own-symbols',
      'alpha'
    );
    expect(compareAccessNodeOutcomes(first, second)).toBeLessThan(0);
    expect(compareAccessNodeOutcomes(second, first)).toBeGreaterThan(0);
  });

  it('orders by constraint when element is equal regardless of message', () => {
    const first = makeOutcome(
      'a/index.ts',
      'symbol/access-node-master-export',
      'zebra'
    );
    const second = makeOutcome(
      'a/index.ts',
      'symbol/access-node-own-symbols',
      'alpha'
    );
    expect(compareAccessNodeOutcomes(first, second)).toBeLessThan(0);
    expect(compareAccessNodeOutcomes(second, first)).toBeGreaterThan(0);
  });

  it('orders by position when constraint is equal regardless of message', () => {
    const first = makeOutcome(
      'a/index.ts',
      'symbol/access-node-own-symbols',
      'zebra',
      1
    );
    const second = makeOutcome(
      'a/index.ts',
      'symbol/access-node-own-symbols',
      'alpha',
      2
    );
    expect(compareAccessNodeOutcomes(first, second)).toBeLessThan(0);
    expect(compareAccessNodeOutcomes(second, first)).toBeGreaterThan(0);
  });

  it('uses fallback position when position is undefined on either side', () => {
    const withoutPosition = makeOutcome(
      'a/index.ts',
      'symbol/access-node-own-symbols',
      'zebra'
    );
    const withPosition = makeOutcome(
      'a/index.ts',
      'symbol/access-node-own-symbols',
      'alpha',
      1
    );
    expect(
      compareAccessNodeOutcomes(withoutPosition, withPosition)
    ).toBeLessThan(0);
    expect(
      compareAccessNodeOutcomes(withPosition, withoutPosition)
    ).toBeGreaterThan(0);
  });

  it('orders by message when position is equal', () => {
    const first = makeOutcome(
      'a/index.ts',
      'symbol/access-node-own-symbols',
      'msg-1',
      1
    );
    const second = makeOutcome(
      'a/index.ts',
      'symbol/access-node-own-symbols',
      'msg-2',
      1
    );
    expect(compareAccessNodeOutcomes(first, second)).toBeLessThan(0);
    expect(compareAccessNodeOutcomes(second, first)).toBeGreaterThan(0);
    expect(compareAccessNodeOutcomes(first, first)).toBe(0);
  });
});
