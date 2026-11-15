import { describe, expect, it } from 'vitest';

import type { TConfigOutcome } from '../../../../../../../../_src@shared/_utils/create-outcome/index.js';

import { createOutcome } from '../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import { compareConfigOutcomes } from './compare-config-outcomes.util.js';

describe('compareConfigOutcomes', () => {
  it('orders outcomes by constraint, then element, then propertyPath', () => {
    const byConstraintA: TConfigOutcome = createOutcome(
      'configuration/duplicate-mimetic-path',
      {
        element: 'z',
        propertyPath: 'z.path',
      }
    );
    const byConstraintB: TConfigOutcome = createOutcome(
      'configuration/incompatible-foreign-origin',
      {
        element: 'a',
        propertyPath: 'a.path',
      }
    );
    expect(compareConfigOutcomes(byConstraintA, byConstraintB)).toBeLessThan(0);
    expect(compareConfigOutcomes(byConstraintB, byConstraintA)).toBeGreaterThan(
      0
    );

    const byElementA: TConfigOutcome = createOutcome(
      'configuration/duplicate-mimetic-path',
      {
        element: 'a',
        propertyPath: 'z.path',
      }
    );
    const byElementB: TConfigOutcome = createOutcome(
      'configuration/duplicate-mimetic-path',
      {
        element: 'b',
        propertyPath: 'a.path',
      }
    );
    expect(compareConfigOutcomes(byElementA, byElementB)).toBeLessThan(0);
    expect(compareConfigOutcomes(byElementB, byElementA)).toBeGreaterThan(0);

    const byPropertyA: TConfigOutcome = createOutcome(
      'configuration/duplicate-mimetic-path',
      {
        element: 'a',
        propertyPath: 'a.path',
      }
    );
    const byPropertyB: TConfigOutcome = createOutcome(
      'configuration/duplicate-mimetic-path',
      {
        element: 'a',
        propertyPath: 'b.path',
      }
    );
    expect(compareConfigOutcomes(byPropertyA, byPropertyB)).toBeLessThan(0);
    expect(compareConfigOutcomes(byPropertyB, byPropertyA)).toBeGreaterThan(0);
    expect(compareConfigOutcomes(byPropertyA, byPropertyA)).toBe(0);
  });
});
