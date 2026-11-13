import { describe, expect, it } from 'vitest';

import type { TConfigConstraint } from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { OUTCOME_CATALOG } from '../../../../../../../../../../_conformity@shared/_configs/outcome-catalog.config.js';
import { validateDependencies } from './validate-dependencies.util.js';

describe('validateDependencies', () => {
  it('does nothing when dependency fields are undefined', () => {
    const outcomes = validateDependencies({}, 'faf.common');
    expect(outcomes).toHaveLength(0);
  });

  it('rejects null dependencies fields', () => {
    const outcomes = validateDependencies(
      { externalDependencies: null, treeDependencies: null },
      'faf.common'
    );
    expect(outcomes).toHaveLength(2);
    const treeOutcome = outcomes.find(
      (o) => o.propertyPath === 'faf.common.treeDependencies'
    );
    const externalOutcome = outcomes.find(
      (o) => o.propertyPath === 'faf.common.externalDependencies'
    );
    expect(treeOutcome?.constraint).toBe('configuration/null-forbidden');
    expect(treeOutcome?.element).toBe('faf.common.treeDependencies');
    expect(externalOutcome?.constraint).toBe('configuration/null-forbidden');
    expect(externalOutcome?.element).toBe('faf.common.externalDependencies');
  });

  it.each([
    {
      config: { treeDependencies: [null] },
      constraint: 'configuration/null-forbidden' as const,
      propertyPath: 'faf.common.treeDependencies[0]',
    },
    {
      config: { treeDependencies: [123] },
      constraint: 'configuration/invalid-type' as const,
      propertyPath: 'faf.common.treeDependencies[0]',
    },
    {
      config: { treeDependencies: [{ from: null, to: ['lib'] }] },
      constraint: 'configuration/null-forbidden' as const,
      propertyPath: 'faf.common.treeDependencies[0].from',
    },
    {
      config: { treeDependencies: [{ from: 123, to: ['lib'] }] },
      constraint: 'configuration/invalid-type' as const,
      propertyPath: 'faf.common.treeDependencies[0].from',
    },
    {
      config: { treeDependencies: [{ from: ['./src'], to: ['lib'] }] },
      constraint: 'configuration/invalid-literal-path' as const,
      propertyPath: 'faf.common.treeDependencies[0].from[0]',
    },
    {
      config: { treeDependencies: [{ from: ['src'], to: null }] },
      constraint: 'configuration/null-forbidden' as const,
      propertyPath: 'faf.common.treeDependencies[0].to',
    },
    {
      config: { treeDependencies: [{ from: ['src'], to: 123 }] },
      constraint: 'configuration/invalid-type' as const,
      propertyPath: 'faf.common.treeDependencies[0].to',
    },
    {
      config: { treeDependencies: [{ from: ['src'], to: [null] }] },
      constraint: 'configuration/null-forbidden' as const,
      propertyPath: 'faf.common.treeDependencies[0].to[0]',
    },
    {
      config: { treeDependencies: [{ from: ['src'], to: [123] }] },
      constraint: 'configuration/invalid-type' as const,
      propertyPath: 'faf.common.treeDependencies[0].to[0]',
    },
    {
      config: {
        treeDependencies: [{ extra: true, from: ['src'], to: ['lib'] }],
      },
      constraint: 'configuration/unknown-property' as const,
      propertyPath: 'faf.common.treeDependencies[0].extra',
    },
    {
      config: { treeDependencies: [{ to: ['lib'] }] },
      constraint: 'configuration/missing-property' as const,
      propertyPath: 'faf.common.treeDependencies[0].from',
    },
    {
      config: { treeDependencies: [{ from: [], to: ['lib'] }] },
      constraint: 'configuration/empty-list' as const,
      propertyPath: 'faf.common.treeDependencies[0].from',
    },
    {
      config: { treeDependencies: [{ from: ['src'], to: [] }] },
      constraint: 'configuration/empty-list' as const,
      propertyPath: 'faf.common.treeDependencies[0].to',
    },
    {
      config: { treeDependencies: [{ from: ['src', 'src'], to: ['lib'] }] },
      constraint: 'configuration/duplicate-element' as const,
      propertyPath: 'faf.common.treeDependencies[0].from[1]',
    },
    {
      config: { treeDependencies: [{ from: ['src'], to: ['lib', 'lib'] }] },
      constraint: 'configuration/duplicate-element' as const,
      propertyPath: 'faf.common.treeDependencies[0].to[1]',
    },
    {
      config: { externalDependencies: [null] },
      constraint: 'configuration/null-forbidden' as const,
      propertyPath: 'faf.common.externalDependencies[0]',
    },
    {
      config: { externalDependencies: [123] },
      constraint: 'configuration/invalid-type' as const,
      propertyPath: 'faf.common.externalDependencies[0]',
    },
    {
      config: { externalDependencies: [{ from: null, to: ['package.json'] }] },
      constraint: 'configuration/null-forbidden' as const,
      propertyPath: 'faf.common.externalDependencies[0].from',
    },
    {
      config: { externalDependencies: [{ from: 123, to: ['package.json'] }] },
      constraint: 'configuration/invalid-type' as const,
      propertyPath: 'faf.common.externalDependencies[0].from',
    },
    {
      config: {
        externalDependencies: [
          { from: ['./src/main.ts'], to: ['package.json'] },
        ],
      },
      constraint: 'configuration/invalid-literal-path' as const,
      propertyPath: 'faf.common.externalDependencies[0].from[0]',
    },
    {
      config: { externalDependencies: [{ from: ['src/main.ts'], to: null }] },
      constraint: 'configuration/null-forbidden' as const,
      propertyPath: 'faf.common.externalDependencies[0].to',
    },
    {
      config: { externalDependencies: [{ from: ['src/main.ts'], to: 123 }] },
      constraint: 'configuration/invalid-type' as const,
      propertyPath: 'faf.common.externalDependencies[0].to',
    },
    {
      config: { externalDependencies: [{ from: ['src/main.ts'], to: [null] }] },
      constraint: 'configuration/null-forbidden' as const,
      propertyPath: 'faf.common.externalDependencies[0].to[0]',
    },
    {
      config: { externalDependencies: [{ from: ['src/main.ts'], to: [123] }] },
      constraint: 'configuration/invalid-type' as const,
      propertyPath: 'faf.common.externalDependencies[0].to[0]',
    },
    {
      config: {
        externalDependencies: [
          { extra: true, from: ['src/main.ts'], to: ['package.json'] },
        ],
      },
      constraint: 'configuration/unknown-property' as const,
      propertyPath: 'faf.common.externalDependencies[0].extra',
    },
    {
      config: {
        externalDependencies: [{ to: ['package.json'] }],
      },
      constraint: 'configuration/missing-property' as const,
      propertyPath: 'faf.common.externalDependencies[0].from',
    },
    {
      config: {
        externalDependencies: [{ from: [], to: ['package.json'] }],
      },
      constraint: 'configuration/empty-list' as const,
      propertyPath: 'faf.common.externalDependencies[0].from',
    },
    {
      config: {
        externalDependencies: [{ from: ['src/main.ts'], to: [] }],
      },
      constraint: 'configuration/empty-list' as const,
      propertyPath: 'faf.common.externalDependencies[0].to',
    },
    {
      config: {
        externalDependencies: [
          { from: ['src/main.ts', 'src/main.ts'], to: ['package.json'] },
        ],
      },
      constraint: 'configuration/duplicate-element' as const,
      propertyPath: 'faf.common.externalDependencies[0].from[1]',
    },
    {
      config: {
        externalDependencies: [
          { from: ['src/main.ts'], to: ['package.json', 'package.json'] },
        ],
      },
      constraint: 'configuration/duplicate-element' as const,
      propertyPath: 'faf.common.externalDependencies[0].to[1]',
    },
    {
      config: { externalDependencies: [{ from: ['src/main.ts'] }] },
      constraint: 'configuration/missing-property' as const,
      propertyPath: 'faf.common.externalDependencies[0].to',
    },
  ])(
    'rejects invalid dependency configuration producing $constraint',
    ({
      config,
      constraint,
      propertyPath,
    }: {
      readonly config: Record<string, unknown>;
      readonly constraint: TConfigConstraint;
      readonly propertyPath: string;
    }) => {
      const outcomes = validateDependencies(config, 'faf.common');
      expect(outcomes.length).toBeGreaterThanOrEqual(1);
      const outcome = outcomes.find(
        (o) => o.constraint === constraint && o.propertyPath === propertyPath
      );
      expect(outcome).toBeDefined();
      expect(outcome?.family).toBe('configuration');
      expect(outcome?.element).toBe(propertyPath);
      expect(outcome?.normativeReference).toBe(
        OUTCOME_CATALOG[constraint].normativeReference
      );
      expect(outcome?.message).toContain(propertyPath);
    }
  );

  it('rejects explicit undefined in dependency object', () => {
    const dependencyRecord: Record<string, unknown> = { to: ['lib'] };
    Object.defineProperty(dependencyRecord, 'from', {
      enumerable: true,
      value: void 0,
    });
    const outcomes = validateDependencies(
      { treeDependencies: [dependencyRecord] },
      'faf.common'
    );
    expect(
      outcomes.some((o) => o.constraint === 'configuration/explicit-undefined')
    ).toBe(true);
    const outcome = outcomes.find(
      (o) => o.constraint === 'configuration/explicit-undefined'
    );
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('FAF §1.2, §6.9');
    expect(outcome?.propertyPath).toBe('faf.common.treeDependencies[0].from');
    expect(outcome?.message).toBe(
      "'faf.common.treeDependencies[0].from' cannot be explicitly undefined"
    );
  });
});
