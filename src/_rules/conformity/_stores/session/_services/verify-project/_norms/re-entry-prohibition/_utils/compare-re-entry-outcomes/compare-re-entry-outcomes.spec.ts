import { describe, expect, it } from 'vitest';

import type { TDependencyOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { compareReEntryOutcomes } from './index.js';

const outcome = (
  from: string,
  to: string,
  line = 1,
  column = 1,
  importIndex = 0,
  specifier = './x.js'
): TDependencyOutcome => ({
  chain: [from, to],
  constraint: 'dependency/re-entry-prohibition',
  element: from,
  family: 'dependency',
  from,
  importIndex,
  message: 're-entry message',
  normativeReference: 'FAF §7.3',
  position: { column, line },
  specifier,
  to,
});

describe('compareReEntryOutcomes', () => {
  it('orders by from path when from differs', () => {
    const earlier = outcome('a/first.ts', 'a/target.ts');
    const later = outcome('a/second.ts', 'a/target.ts');

    expect(compareReEntryOutcomes(earlier, later)).toBeLessThan(0);
    expect(compareReEntryOutcomes(later, earlier)).toBeGreaterThan(0);
  });

  it('orders by to path when from matches but to differs', () => {
    const earlier = outcome('a/start.ts', 'a/alpha.ts');
    const later = outcome('a/start.ts', 'a/beta.ts');

    expect(compareReEntryOutcomes(earlier, later)).toBeLessThan(0);
    expect(compareReEntryOutcomes(later, earlier)).toBeGreaterThan(0);
  });

  it('orders by position when from and to match', () => {
    const earlier = outcome('a/start.ts', 'a/target.ts', 1, 5);
    const later = outcome('a/start.ts', 'a/target.ts', 2, 1);

    expect(compareReEntryOutcomes(earlier, later)).toBeLessThan(0);
    expect(compareReEntryOutcomes(later, earlier)).toBeGreaterThan(0);
  });

  it('orders by importIndex when positions match', () => {
    const earlier = outcome('a/start.ts', 'a/target.ts', 1, 1, 0);
    const later = outcome('a/start.ts', 'a/target.ts', 1, 1, 1);

    expect(compareReEntryOutcomes(earlier, later)).toBeLessThan(0);
    expect(compareReEntryOutcomes(later, earlier)).toBeGreaterThan(0);
  });

  it('orders by specifier when importIndex matches', () => {
    const earlier = outcome('a/start.ts', 'a/target.ts', 1, 1, 0, './alpha.js');
    const later = outcome('a/start.ts', 'a/target.ts', 1, 1, 0, './beta.js');

    expect(compareReEntryOutcomes(earlier, later)).toBeLessThan(0);
    expect(compareReEntryOutcomes(later, earlier)).toBeGreaterThan(0);
  });

  it('returns zero when all compared fields are identical', () => {
    const earlier = outcome('a/start.ts', 'a/target.ts', 1, 1, 0, './alpha.js');
    const later = outcome('a/start.ts', 'a/target.ts', 1, 1, 0, './alpha.js');

    expect(compareReEntryOutcomes(earlier, later)).toBe(0);
  });

  it('handles absent position and absent specifier gracefully', () => {
    const earlier: TDependencyOutcome = {
      chain: ['a/start.ts', 'a/target.ts'],
      constraint: 'dependency/re-entry-prohibition',
      element: 'a/start.ts',
      family: 'dependency',
      from: 'a/start.ts',
      importIndex: 0,
      message: 'msg',
      normativeReference: 'FAF §7.3',
      to: 'a/target.ts',
    };
    const later: TDependencyOutcome = {
      chain: ['a/start.ts', 'a/target.ts'],
      constraint: 'dependency/re-entry-prohibition',
      element: 'a/start.ts',
      family: 'dependency',
      from: 'a/start.ts',
      importIndex: 0,
      message: 'msg',
      normativeReference: 'FAF §7.3',
      position: { column: 1, line: 1 },
      specifier: './x.js',
      to: 'a/target.ts',
    };

    expect(compareReEntryOutcomes(earlier, later)).toBeLessThan(0);
    expect(compareReEntryOutcomes(later, earlier)).toBeGreaterThan(0);
  });

  it('returns zero when both have absent specifier and absent position', () => {
    const first: TDependencyOutcome = {
      chain: ['a/start.ts', 'a/target.ts'],
      constraint: 'dependency/re-entry-prohibition',
      element: 'a/start.ts',
      family: 'dependency',
      from: 'a/start.ts',
      importIndex: 0,
      message: 'msg',
      normativeReference: 'FAF §7.3',
      to: 'a/target.ts',
    };
    const second: TDependencyOutcome = {
      chain: ['a/start.ts', 'a/target.ts'],
      constraint: 'dependency/re-entry-prohibition',
      element: 'a/start.ts',
      family: 'dependency',
      from: 'a/start.ts',
      importIndex: 0,
      message: 'msg',
      normativeReference: 'FAF §7.3',
      to: 'a/target.ts',
    };

    expect(compareReEntryOutcomes(first, second)).toBe(0);
  });
});
