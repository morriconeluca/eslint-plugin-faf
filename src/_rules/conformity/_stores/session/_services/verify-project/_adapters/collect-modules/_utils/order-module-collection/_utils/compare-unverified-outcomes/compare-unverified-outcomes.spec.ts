import { describe, expect, it } from 'vitest';

import type { TUnverifiedOutcome } from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { compareUnverifiedOutcomes } from './index.js';

const outcome = (
  element: string,
  constraint: TUnverifiedOutcome['constraint'],
  reason: string,
  position?: TUnverifiedOutcome['position']
): TUnverifiedOutcome => {
  const base = {
    constraint,
    element,
    family: 'unverified' as const,
    message: reason,
    normativeReference: '§4',
    reason,
  };
  return position === undefined ? base : { ...base, position };
};

describe('compareUnverifiedOutcomes', () => {
  it('orders by element when every later field is equal', () => {
    const earlier = outcome(
      'a.ts',
      'unverified/config-loading-timeout',
      'same'
    );
    const later = outcome('z.ts', 'unverified/config-loading-timeout', 'same');
    expect(compareUnverifiedOutcomes(earlier, later)).toBe(-1);
    expect(compareUnverifiedOutcomes(later, earlier)).toBe(1);
    expect(compareUnverifiedOutcomes(earlier, earlier)).toBe(0);
  });

  it('orders by constraint when the element is equal', () => {
    const earlier = outcome(
      'a.ts',
      'unverified/config-loading-timeout',
      'same'
    );
    const later = outcome('a.ts', 'unverified/unresolved-import', 'same');
    expect(compareUnverifiedOutcomes(earlier, later)).toBe(-1);
    expect(compareUnverifiedOutcomes(later, earlier)).toBe(1);
  });

  it('orders by reason when element and constraint are equal', () => {
    const earlier = outcome('a.ts', 'unverified/config-loading-timeout', 'a');
    const later = outcome('a.ts', 'unverified/config-loading-timeout', 'b');
    expect(compareUnverifiedOutcomes(earlier, later)).toBe(-1);
    expect(compareUnverifiedOutcomes(later, earlier)).toBe(1);
  });

  it('orders by line and then column', () => {
    const earlierLine = outcome(
      'a.ts',
      'unverified/config-loading-timeout',
      'same',
      {
        column: 9,
        line: 1,
      }
    );
    const laterLine = outcome(
      'a.ts',
      'unverified/config-loading-timeout',
      'same',
      {
        column: 4,
        line: 3,
      }
    );
    const earlierColumn = outcome(
      'a.ts',
      'unverified/config-loading-timeout',
      'same',
      {
        column: 1,
        line: 3,
      }
    );
    expect(compareUnverifiedOutcomes(earlierLine, laterLine)).toBe(-2);
    expect(compareUnverifiedOutcomes(laterLine, earlierLine)).toBe(2);
    expect(compareUnverifiedOutcomes(earlierColumn, laterLine)).toBe(-3);
    expect(compareUnverifiedOutcomes(laterLine, earlierColumn)).toBe(3);
    expect(compareUnverifiedOutcomes(laterLine, laterLine)).toBe(0);
  });

  it('orders a missing position before a present position', () => {
    const missing = outcome(
      'a.ts',
      'unverified/config-loading-timeout',
      'same'
    );
    const present = outcome(
      'a.ts',
      'unverified/config-loading-timeout',
      'same',
      {
        column: 1,
        line: 1,
      }
    );
    expect(compareUnverifiedOutcomes(missing, present)).toBe(-1);
    expect(compareUnverifiedOutcomes(present, missing)).toBe(1);
  });
});
