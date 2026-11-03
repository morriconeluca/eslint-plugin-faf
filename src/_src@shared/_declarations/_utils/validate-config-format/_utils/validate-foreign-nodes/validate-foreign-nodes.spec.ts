import { describe, expect, it } from 'vitest';

import type { TConfigOutcome } from '../../../../../_domain/_types/outcome.type.js';

import { validateForeignNodes } from './validate-foreign-nodes.util.js';

describe('validateForeignNodes', () => {
  it('does nothing when foreign properties are omitted', () => {
    const outcomes: TConfigOutcome[] = [];
    validateForeignNodes({}, 'faf.common', outcomes);
    expect(outcomes).toHaveLength(0);
  });

  it('accepts valid foreignDomains and foreignNodes', () => {
    const outcomes: TConfigOutcome[] = [];
    validateForeignNodes(
      {
        foreignDomains: ['src/_configs'],
        foreignNodes: [
          'src/vite-env.d.ts',
          {
            paths: ['src', 'packages/contracts/src'],
            patterns: ['*.md'],
          },
        ],
      },
      'faf.common',
      outcomes
    );
    expect(outcomes).toHaveLength(0);
  });

  it.each([
    {
      config: { foreignDomains: null },
      constraint: 'configuration/invalid-type',
      message: 'Property "faf.common.foreignDomains" must be an array.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.foreignDomains',
    },
    {
      config: { foreignDomains: [null] },
      constraint: 'configuration/null-forbidden',
      message: 'Path element cannot be null.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.foreignDomains[0]',
    },
    {
      config: { foreignDomains: [123] },
      constraint: 'configuration/invalid-type',
      message: 'Path element must be a string.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.foreignDomains[0]',
    },
    {
      config: { foreignDomains: [''] },
      constraint: 'configuration/empty-string',
      message: 'Path element cannot be empty.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.foreignDomains[0]',
    },
    {
      config: { foreignDomains: ['./src'] },
      constraint: 'configuration/invalid-literal-path',
      message: 'Invalid literal config path "./src".',
      normativeReference: 'CONFIG_2_2',
      propertyPath: 'faf.common.foreignDomains[0]',
    },
    {
      config: { foreignDomains: ['src/_configs', 'src/_configs'] },
      constraint: 'configuration/duplicate-element',
      message: 'Duplicate path "src/_configs".',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.foreignDomains[1]',
    },
    {
      config: { foreignNodes: null },
      constraint: 'configuration/invalid-type',
      message: 'Property "foreignNodes" must be an array.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.foreignNodes',
    },
    {
      config: { foreignNodes: [null] },
      constraint: 'configuration/null-forbidden',
      message: 'Foreign node element cannot be null.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.foreignNodes[0]',
    },
    {
      config: { foreignNodes: [123] },
      constraint: 'configuration/invalid-type',
      message: 'Foreign node element must be a string or a family object.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.foreignNodes[0]',
    },
    {
      config: { foreignNodes: [''] },
      constraint: 'configuration/empty-string',
      message: 'Foreign node path cannot be empty.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.foreignNodes[0]',
    },
    {
      config: { foreignNodes: ['./file.ts'] },
      constraint: 'configuration/invalid-literal-path',
      message: 'Invalid literal config path "./file.ts".',
      normativeReference: 'CONFIG_2_2',
      propertyPath: 'faf.common.foreignNodes[0]',
    },
    {
      config: { foreignNodes: ['src/a.ts', 'src/a.ts'] },
      constraint: 'configuration/duplicate-element',
      message: 'Duplicate foreign node path "src/a.ts".',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.foreignNodes[1]',
    },
    {
      config: {
        foreignNodes: [{ extra: true, paths: ['src'], patterns: ['*.md'] }],
      },
      constraint: 'configuration/unknown-property',
      message: 'Unknown property "extra" is forbidden.',
      normativeReference: 'CONFIG_6',
      propertyPath: 'faf.common.foreignNodes[0].extra',
    },
    {
      config: { foreignNodes: [{ paths: null, patterns: ['*.md'] }] },
      constraint: 'configuration/invalid-type',
      message: 'Property "faf.common.foreignNodes[0].paths" must be an array.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.foreignNodes[0].paths',
    },
    {
      config: { foreignNodes: [{ patterns: ['*.md'] }] },
      constraint: 'configuration/missing-property',
      message: 'Required property "paths" is missing.',
      normativeReference: 'CONFIG_6',
      propertyPath: 'faf.common.foreignNodes[0].paths',
    },
    {
      config: { foreignNodes: [{ paths: [], patterns: ['*.md'] }] },
      constraint: 'configuration/empty-list',
      message: 'Property "faf.common.foreignNodes[0].paths" cannot be empty.',
      normativeReference: 'CONFIG_6',
      propertyPath: 'faf.common.foreignNodes[0].paths',
    },
    {
      config: { foreignNodes: [{ paths: ['src'] }] },
      constraint: 'configuration/missing-property',
      message: 'Required property "patterns" is missing.',
      normativeReference: 'CONFIG_6',
      propertyPath: 'faf.common.foreignNodes[0].patterns',
    },
    {
      config: { foreignNodes: [{ paths: ['src'], patterns: null }] },
      constraint: 'configuration/invalid-type',
      message: 'Property "patterns" must be an array.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.foreignNodes[0].patterns',
    },
    {
      config: { foreignNodes: [{ paths: ['src'], patterns: [] }] },
      constraint: 'configuration/empty-list',
      message: 'Property "patterns" cannot be empty.',
      normativeReference: 'CONFIG_6',
      propertyPath: 'faf.common.foreignNodes[0].patterns',
    },
    {
      config: { foreignNodes: [{ paths: ['src'], patterns: [null] }] },
      constraint: 'configuration/null-forbidden',
      message: 'Pattern element cannot be null.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.foreignNodes[0].patterns[0]',
    },
    {
      config: { foreignNodes: [{ paths: ['src'], patterns: [123] }] },
      constraint: 'configuration/invalid-type',
      message: 'Pattern element must be a string.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.foreignNodes[0].patterns[0]',
    },
    {
      config: { foreignNodes: [{ paths: ['src'], patterns: [''] }] },
      constraint: 'configuration/empty-string',
      message: 'Pattern element cannot be empty.',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.foreignNodes[0].patterns[0]',
    },
    {
      config: { foreignNodes: [{ paths: ['src'], patterns: ['!*.md'] }] },
      constraint: 'configuration/invalid-foreign-pattern',
      message: 'Invalid foreign pattern "!*.md": negation.',
      normativeReference: 'CONFIG_6',
      propertyPath: 'faf.common.foreignNodes[0].patterns[0]',
    },
    {
      config: { foreignNodes: [{ paths: ['src'], patterns: ['*.{ts,js}'] }] },
      constraint: 'configuration/invalid-foreign-pattern',
      message: 'Invalid foreign pattern "*.{ts,js}": brace-expansion.',
      normativeReference: 'CONFIG_6',
      propertyPath: 'faf.common.foreignNodes[0].patterns[0]',
    },
    {
      config: { foreignNodes: [{ paths: ['src'], patterns: ['^.*\\.md$'] }] },
      constraint: 'configuration/invalid-foreign-pattern',
      message: 'Invalid foreign pattern "^.*\\.md$": regular-expression.',
      normativeReference: 'CONFIG_6',
      propertyPath: 'faf.common.foreignNodes[0].patterns[0]',
    },
    {
      config: { foreignNodes: [{ paths: ['src'], patterns: ['/src/*.md'] }] },
      constraint: 'configuration/invalid-foreign-pattern',
      message: 'Invalid foreign pattern "/src/*.md": absolute-pattern.',
      normativeReference: 'CONFIG_6',
      propertyPath: 'faf.common.foreignNodes[0].patterns[0]',
    },
    {
      config: { foreignNodes: [{ paths: ['src'], patterns: ['./*.md'] }] },
      constraint: 'configuration/invalid-foreign-pattern',
      message: 'Invalid foreign pattern "./*.md": dot-segment.',
      normativeReference: 'CONFIG_6',
      propertyPath: 'faf.common.foreignNodes[0].patterns[0]',
    },
    {
      config: {
        foreignNodes: [{ paths: ['src'], patterns: ['*.md', '*.md'] }],
      },
      constraint: 'configuration/duplicate-element',
      message: 'Duplicate pattern "*.md".',
      normativeReference: 'CONFIG_2',
      propertyPath: 'faf.common.foreignNodes[0].patterns[1]',
    },
  ])(
    'rejects invalid foreign configuration producing $constraint',
    ({ config, constraint, message, normativeReference, propertyPath }) => {
      const outcomes: TConfigOutcome[] = [];
      validateForeignNodes(config, 'faf.common', outcomes);
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

  it('rejects explicit undefined in foreign family', () => {
    const outcomes: TConfigOutcome[] = [];
    const familyRecord: Record<string, unknown> = { patterns: ['*.md'] };
    Object.defineProperty(familyRecord, 'paths', {
      enumerable: true,
      value: void 0,
    });
    validateForeignNodes(
      { foreignNodes: [familyRecord] },
      'faf.common',
      outcomes
    );
    expect(
      outcomes.some((o) => o.constraint === 'configuration/explicit-undefined')
    ).toBe(true);
    const outcome = outcomes.find(
      (o) => o.constraint === 'configuration/explicit-undefined'
    );
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('CONFIG_2');
    expect(outcome?.propertyPath).toBe('faf.common.foreignNodes[0].paths');
    expect(outcome?.message).toBe(
      'Property "paths" cannot be explicitly undefined.'
    );
  });
});
