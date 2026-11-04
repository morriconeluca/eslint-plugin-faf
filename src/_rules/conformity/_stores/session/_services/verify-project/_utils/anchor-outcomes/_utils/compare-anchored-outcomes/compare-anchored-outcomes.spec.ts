import { describe, expect, it } from 'vitest';

import type { TOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TAnchoredOutcome } from '../../../../../../_session@shared/_types/anchored-outcome.type.js';

import { compareAnchoredOutcomes } from './index.js';

const anchored = (
  anchorPath: string,
  element: string,
  line: number
): TAnchoredOutcome => {
  const outcome: TOutcome = {
    constraint: 'unverified/unresolved-import',
    element,
    family: 'unverified',
    message: element,
    normativeReference: '§5',
    reason: 'missing',
  };
  return {
    anchorPath,
    outcome,
    position: { column: 1, line },
  };
};

describe('compareAnchoredOutcomes', () => {
  it('orders by anchor path, then element, then position', () => {
    const later = anchored('/repo/b.ts', 'src/b.ts', 1);
    const earlier = anchored('/repo/a.ts', 'src/a.ts', 4);
    expect(compareAnchoredOutcomes(later, earlier)).toBeGreaterThan(0);
    expect(compareAnchoredOutcomes(earlier, later)).toBeLessThan(0);
    const onlyPath = anchored('/repo/b.ts', 'src/a.ts', 4);
    expect(compareAnchoredOutcomes(earlier, onlyPath)).toBeLessThan(0);
    const onlyElement = {
      ...earlier,
      outcome: { ...earlier.outcome, element: 'src/z.ts' },
    };
    expect(compareAnchoredOutcomes(earlier, onlyElement)).not.toBe(0);
    expect(compareAnchoredOutcomes(earlier, earlier)).toBe(0);
    const same = anchored('/repo/a.ts', 'src/a.ts', 4);
    const renamed = {
      ...same,
      outcome: { ...same.outcome, message: 'other' },
    };
    expect(compareAnchoredOutcomes(same, renamed)).not.toBe(0);
    expect(
      compareAnchoredOutcomes(
        anchored('/repo/a.ts', 'src/a.ts', 1),
        anchored('/repo/a.ts', 'src/a.ts', 2)
      )
    ).not.toBe(0);
  });
});
