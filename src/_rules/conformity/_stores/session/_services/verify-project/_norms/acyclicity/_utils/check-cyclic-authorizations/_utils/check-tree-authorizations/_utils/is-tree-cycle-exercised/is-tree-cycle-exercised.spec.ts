import { describe, expect, it } from 'vitest';

import type { TAcyclicityOutcome } from '../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { createOutcome } from '../../../../../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { isTreeCycleExercised } from './is-tree-cycle-exercised.util.js';

describe('isTreeCycleExercised', () => {
  it('detects exercised tree cycle when cycle has 2 or more origin trees from sources only', () => {
    const cycleOutcome: TAcyclicityOutcome = createOutcome(
      'acyclicity/inter-tree-cycle',
      {
        cycle: [
          ['a/source.ts', 'external/x.ts'],
          ['b/source.ts', 'external/y.ts'],
        ],
        element: 'a/source.ts',
      }
    );
    const fileToTree = new Map([
      ['a/source.ts', 'a'],
      ['b/source.ts', 'b'],
    ]);
    expect(isTreeCycleExercised(['a', 'b'], [cycleOutcome], fileToTree)).toBe(
      true
    );
  });

  it('detects exercised tree cycle when cycle has 2 or more origin trees from destinations only', () => {
    const cycleOutcome: TAcyclicityOutcome = createOutcome(
      'acyclicity/inter-tree-cycle',
      {
        cycle: [
          ['external/x.ts', 'a/target.ts'],
          ['external/y.ts', 'b/target.ts'],
        ],
        element: 'external/x.ts',
      }
    );
    const fileToTree = new Map([
      ['a/target.ts', 'a'],
      ['b/target.ts', 'b'],
    ]);
    expect(isTreeCycleExercised(['a', 'b'], [cycleOutcome], fileToTree)).toBe(
      true
    );
  });

  it('rejects cycle when only 1 tree from originSet participates even if another tree is present', () => {
    const cycleOutcome: TAcyclicityOutcome = createOutcome(
      'acyclicity/inter-tree-cycle',
      {
        cycle: [
          ['a/source.ts', 'other/target.ts'],
          ['other/source.ts', 'a/target.ts'],
        ],
        element: 'a/source.ts',
      }
    );
    const fileToTree = new Map([
      ['a/source.ts', 'a'],
      ['a/target.ts', 'a'],
      ['other/source.ts', 'other'],
      ['other/target.ts', 'other'],
    ]);
    expect(isTreeCycleExercised(['a', 'b'], [cycleOutcome], fileToTree)).toBe(
      false
    );
  });

  it('returns false when no cycles exist or segments empty', () => {
    expect(isTreeCycleExercised(['a', 'b'], [], new Map())).toBe(false);

    const emptySegmentOutcome: TAcyclicityOutcome = createOutcome(
      'acyclicity/inter-tree-cycle',
      {
        cycle: [[]],
        element: 'a/source.ts',
      }
    );
    expect(
      isTreeCycleExercised(['a', 'b'], [emptySegmentOutcome], new Map())
    ).toBe(false);
  });
});
