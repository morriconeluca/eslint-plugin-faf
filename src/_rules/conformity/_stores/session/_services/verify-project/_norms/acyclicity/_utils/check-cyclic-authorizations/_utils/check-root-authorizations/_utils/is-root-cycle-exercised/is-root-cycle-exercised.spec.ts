import { describe, expect, it } from 'vitest';

import type { TAcyclicityOutcome } from '../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { createOutcome } from '../../../../../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { isRootCycleExercised } from './index.js';

describe('isRootCycleExercised', () => {
  it('detects exercised root cycle', () => {
    const cycleOutcome: TAcyclicityOutcome = createOutcome(
      'acyclicity/dependency-cycle',
      {
        cycle: [['src/a/main.ts', 'src/b/main.ts', 'src/a/main.ts']],
        element: 'src/a/main.ts',
      }
    );
    const nodeToFrag = new Map([
      ['src/a/main.ts', 'src/a'],
      ['src/b/main.ts', 'src/b'],
    ]);
    expect(
      isRootCycleExercised(['src/a', 'src/b'], [cycleOutcome], nodeToFrag)
    ).toBe(true);
  });

  it('returns false when nodes belong to irrelevant or unmapped fragments or empty cycle', () => {
    const cycleOutcome: TAcyclicityOutcome = createOutcome(
      'acyclicity/dependency-cycle',
      {
        cycle: [['src/a/main.ts', 'src/other.ts', 'src/a/main.ts']],
        element: 'src/a/main.ts',
      }
    );
    const nodeToFrag = new Map([
      ['src/a/main.ts', 'src/a'],
      ['src/other.ts', 'src/other'],
    ]);
    expect(
      isRootCycleExercised(['src/a', 'src/b'], [cycleOutcome], nodeToFrag)
    ).toBe(false);

    const emptyOutcome: TAcyclicityOutcome = createOutcome(
      'acyclicity/dependency-cycle',
      {
        cycle: [],
        element: 'src/a/main.ts',
      }
    );
    expect(
      isRootCycleExercised(['src/a', 'src/b'], [emptyOutcome], nodeToFrag)
    ).toBe(false);
  });
});
