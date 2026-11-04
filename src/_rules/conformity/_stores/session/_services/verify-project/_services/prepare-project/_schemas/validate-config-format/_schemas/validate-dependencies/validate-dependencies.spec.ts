import { describe, expect, it } from 'vitest';

import { validateDependencies } from './validate-dependencies.schema.js';

describe('validateDependencies', () => {
  it('does nothing when dependencies are omitted', () => {
    const outcomes = validateDependencies({}, 'faf.common');
    expect(outcomes).toHaveLength(0);
  });

  it('accepts valid dependencies declarations', () => {
    const outcomes = validateDependencies(
      {
        externalDependencies: [
          {
            from: ['src/main.ts'],
            to: ['package.json'],
          },
        ],
        publicRootNodes: ['src/app/app.tsx'],
        treeDependencies: [
          {
            from: ['src'],
            to: ['packages/contracts/src'],
          },
        ],
      },
      'faf.common'
    );
    expect(outcomes).toHaveLength(0);
  });

  it.each([
    {
      config: { publicRootNodes: null },
      constraint: 'configuration/invalid-type',
      message: 'Property "faf.common.publicRootNodes" must be an array.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.publicRootNodes',
    },
    {
      config: { publicRootNodes: [null] },
      constraint: 'configuration/null-forbidden',
      message: 'Path element cannot be null.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.publicRootNodes[0]',
    },
    {
      config: { publicRootNodes: [123] },
      constraint: 'configuration/invalid-type',
      message: 'Path element must be a string.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.publicRootNodes[0]',
    },
    {
      config: { publicRootNodes: [''] },
      constraint: 'configuration/empty-string',
      message: 'Path element cannot be empty.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.publicRootNodes[0]',
    },
    {
      config: { publicRootNodes: ['./src/main.ts'] },
      constraint: 'configuration/invalid-literal-path',
      message: 'Invalid literal config path "./src/main.ts".',
      normativeReference: 'CONFIG_2_2',
      propertyPath: 'faf.common.publicRootNodes[0]',
    },
    {
      config: { publicRootNodes: ['src/main.ts', 'src/main.ts'] },
      constraint: 'configuration/duplicate-element',
      message: 'Duplicate path "src/main.ts".',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.publicRootNodes[1]',
    },
    {
      config: { treeDependencies: null },
      constraint: 'configuration/invalid-type',
      message: 'Property "faf.common.treeDependencies" must be an array.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.treeDependencies',
    },
    {
      config: { treeDependencies: [null] },
      constraint: 'configuration/null-forbidden',
      message: 'Dependency element cannot be null.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.treeDependencies[0]',
    },
    {
      config: { treeDependencies: ['invalid'] },
      constraint: 'configuration/invalid-type',
      message: 'Dependency element must be an object.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.treeDependencies[0]',
    },
    {
      config: {
        treeDependencies: [{ extra: true, from: ['src'], to: ['lib'] }],
      },
      constraint: 'configuration/unknown-property',
      message: 'Unknown property "extra" is forbidden.',
      normativeReference: 'CONFIG_10',
      propertyPath: 'faf.common.treeDependencies[0].extra',
    },
    {
      config: { treeDependencies: [{ from: null, to: ['lib'] }] },
      constraint: 'configuration/null-forbidden',
      message: 'Property "from" cannot be null.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.treeDependencies[0].from',
    },
    {
      config: { treeDependencies: [{ to: ['lib'] }] },
      constraint: 'configuration/missing-property',
      message: 'Required property "from" is missing.',
      normativeReference: 'CONFIG_10',
      propertyPath: 'faf.common.treeDependencies[0].from',
    },
    {
      config: { treeDependencies: [{ from: 'src', to: ['lib'] }] },
      constraint: 'configuration/invalid-type',
      message:
        'Property "faf.common.treeDependencies[0].from" must be an array.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.treeDependencies[0].from',
    },
    {
      config: { treeDependencies: [{ from: [], to: ['lib'] }] },
      constraint: 'configuration/empty-list',
      message:
        'Property "faf.common.treeDependencies[0].from" cannot be empty.',
      normativeReference: 'CONFIG_10',
      propertyPath: 'faf.common.treeDependencies[0].from',
    },
    {
      config: { treeDependencies: [{ from: [null], to: ['lib'] }] },
      constraint: 'configuration/null-forbidden',
      message: 'Path element cannot be null.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.treeDependencies[0].from[0]',
    },
    {
      config: { treeDependencies: [{ from: [123], to: ['lib'] }] },
      constraint: 'configuration/invalid-type',
      message: 'Path element must be a string.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.treeDependencies[0].from[0]',
    },
    {
      config: { treeDependencies: [{ from: [''], to: ['lib'] }] },
      constraint: 'configuration/empty-string',
      message: 'Path element cannot be empty.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.treeDependencies[0].from[0]',
    },
    {
      config: { treeDependencies: [{ from: ['./src'], to: ['lib'] }] },
      constraint: 'configuration/invalid-literal-path',
      message: 'Invalid literal config path "./src".',
      normativeReference: 'CONFIG_2_2',
      propertyPath: 'faf.common.treeDependencies[0].from[0]',
    },
    {
      config: { treeDependencies: [{ from: ['src', 'src'], to: ['lib'] }] },
      constraint: 'configuration/duplicate-element',
      message: 'Duplicate path "src".',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.treeDependencies[0].from[1]',
    },
    {
      config: { treeDependencies: [{ from: ['src'] }] },
      constraint: 'configuration/missing-property',
      message: 'Required property "to" is missing.',
      normativeReference: 'CONFIG_10',
      propertyPath: 'faf.common.treeDependencies[0].to',
    },
    {
      config: { externalDependencies: null },
      constraint: 'configuration/invalid-type',
      message: 'Property "faf.common.externalDependencies" must be an array.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.externalDependencies',
    },
    {
      config: { externalDependencies: [null] },
      constraint: 'configuration/null-forbidden',
      message: 'Dependency element cannot be null.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.externalDependencies[0]',
    },
    {
      config: { externalDependencies: ['invalid'] },
      constraint: 'configuration/invalid-type',
      message: 'Dependency element must be an object.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.externalDependencies[0]',
    },
    {
      config: {
        externalDependencies: [
          { extra: true, from: ['src/main.ts'], to: ['package.json'] },
        ],
      },
      constraint: 'configuration/unknown-property',
      message: 'Unknown property "extra" is forbidden.',
      normativeReference: 'CONFIG_10',
      propertyPath: 'faf.common.externalDependencies[0].extra',
    },
    {
      config: { externalDependencies: [{ to: ['package.json'] }] },
      constraint: 'configuration/missing-property',
      message: 'Required property "from" is missing.',
      normativeReference: 'CONFIG_10',
      propertyPath: 'faf.common.externalDependencies[0].from',
    },
    {
      config: { externalDependencies: [{ from: ['src/main.ts'] }] },
      constraint: 'configuration/missing-property',
      message: 'Required property "to" is missing.',
      normativeReference: 'CONFIG_10',
      propertyPath: 'faf.common.externalDependencies[0].to',
    },
  ])(
    'rejects invalid dependency configuration producing $constraint',
    ({ config, constraint, message, normativeReference, propertyPath }) => {
      const outcomes = validateDependencies(config, 'faf.common');
      expect(outcomes.length).toBeGreaterThanOrEqual(1);
      const outcome = outcomes.find(
        (o) => o.constraint === constraint && o.propertyPath === propertyPath
      );
      expect(outcome).toBeDefined();
      expect(outcome?.family).toBe('configuration');
      expect(outcome?.element).toBe(propertyPath);
      expect(outcome?.normativeReference).toBe(normativeReference);
      expect(outcome?.message).toBe(message);
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
    expect(outcome?.normativeReference).toBe('CONFIG_2');
    expect(outcome?.propertyPath).toBe('faf.common.treeDependencies[0].from');
    expect(outcome?.message).toBe(
      'Property "from" cannot be explicitly undefined.'
    );
  });
});
