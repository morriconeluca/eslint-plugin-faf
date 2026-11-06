import { describe, expect, it } from 'vitest';

import { OUTCOME_CATALOG } from '../../../../_configs/outcome-catalog.config.js';
import { buildOutcomeRecord } from './index.js';

describe('buildOutcomeRecord', () => {
  it('builds an acyclicity outcome with position and cycle', () => {
    const code = 'acyclicity/dependency-cycle';
    const outcome = buildOutcomeRecord(
      code,
      OUTCOME_CATALOG[code],
      'cycle message',
      {
        cycle: [['a.ts', 'b.ts', 'a.ts']],
        element: 'a.ts',
        position: { column: 1, line: 2 },
      }
    );
    expect(outcome.family).toBe('acyclicity');
    expect(outcome.constraint).toBe(code);
    expect(outcome.message).toBe('cycle message');
    expect(outcome.position).toEqual({ column: 1, line: 2 });
    if (outcome.family !== 'acyclicity') {
      return;
    }
    expect(outcome.cycle).toEqual([['a.ts', 'b.ts', 'a.ts']]);
    expect(outcome.element).toBe('a.ts');
  });

  it('builds an acyclicity outcome without position', () => {
    const code = 'acyclicity/inter-tree-cycle';
    const outcome = buildOutcomeRecord(
      code,
      OUTCOME_CATALOG[code],
      'cycle message',
      {
        cycle: [['a', 'b']],
        element: 'a',
      }
    );
    expect(outcome.position).toBeUndefined();
    if (outcome.family !== 'acyclicity') {
      return;
    }
    expect(outcome.cycle).toEqual([['a', 'b']]);
    expect(outcome.element).toBe('a');
  });

  it('builds a classification outcome with and without position', () => {
    const code = 'classification/unclassifiable-file';
    const outcomeWithPos = buildOutcomeRecord(
      code,
      OUTCOME_CATALOG[code],
      'class message',
      {
        element: 'src/unknown.bin',
        position: { column: 3, line: 4 },
      }
    );
    expect(outcomeWithPos.position).toEqual({ column: 3, line: 4 });

    const outcomeWithoutPos = buildOutcomeRecord(
      code,
      OUTCOME_CATALOG[code],
      'class message',
      {
        element: 'src/unknown.bin',
      }
    );
    expect(outcomeWithoutPos.position).toBeUndefined();
  });

  it('builds a configuration outcome with default element and without position', () => {
    const code = 'configuration/missing-property';
    const outcome = buildOutcomeRecord(
      code,
      OUTCOME_CATALOG[code],
      'config message',
      {
        propertyPath: 'faf.locals[0].origin',
      }
    );
    expect(outcome.family).toBe('configuration');
    expect(outcome.constraint).toBe(code);
    expect(outcome.element).toBe('faf.locals[0].origin');
    expect(outcome.position).toBeUndefined();
  });

  it('builds a configuration outcome with custom element and position', () => {
    const code = 'configuration/invalid-origin';
    const outcome = buildOutcomeRecord(
      code,
      OUTCOME_CATALOG[code],
      'config message',
      {
        element: 'src',
        position: { column: 1, line: 1 },
        propertyPath: 'faf.locals[0].rootLayers[0]',
      }
    );
    expect(outcome.element).toBe('src');
    expect(outcome.position).toEqual({ column: 1, line: 1 });
  });

  it('builds a symbol outcome with symbolCount and symbolName', () => {
    const code = 'symbol/symbol-uniqueness';
    const outcome = buildOutcomeRecord(
      code,
      OUTCOME_CATALOG[code],
      'symbol message',
      {
        element: 'src/file.ts',
        position: { column: 7, line: 8 },
        symbolCount: 2,
        symbolName: 'second',
      }
    );
    if (outcome.family !== 'symbol') {
      return;
    }
    expect(outcome.symbolCount).toBe(2);
    expect(outcome.symbolName).toBe('second');
  });

  it('builds a symbol outcome without symbolCount and symbolName', () => {
    const code = 'symbol/master-symbol';
    const outcome = buildOutcomeRecord(
      code,
      OUTCOME_CATALOG[code],
      'symbol message',
      {
        element: 'src/master.ts',
      }
    );
    if (outcome.family !== 'symbol') {
      return;
    }
    expect(outcome.symbolCount).toBeUndefined();
    expect(outcome.symbolName).toBeUndefined();
  });

  it('builds an unverified outcome with reason and position', () => {
    const code = 'unverified/unreadable-origin';
    const outcome = buildOutcomeRecord(
      code,
      OUTCOME_CATALOG[code],
      'unverified message',
      {
        element: 'src',
        position: { column: 9, line: 10 },
        reason: 'EACCES',
      }
    );
    if (outcome.family !== 'unverified') {
      return;
    }
    expect(outcome.reason).toBe('EACCES');
    expect(outcome.position).toEqual({ column: 9, line: 10 });
  });

  it('builds an unverified outcome without position', () => {
    const code = 'unverified/not-implemented';
    const outcome = buildOutcomeRecord(
      code,
      OUTCOME_CATALOG[code],
      'unverified message',
      {
        element: 'src',
        reason: 'not-implemented',
      }
    );
    expect(outcome.position).toBeUndefined();
    expect(outcome.element).toBe('src');
    if (outcome.family !== 'unverified') {
      return;
    }
    expect(outcome.reason).toBe('not-implemented');
  });

  it('builds a dependency outcome with specifier and default element', () => {
    const code = 'dependency/peer-separation';
    const outcome = buildOutcomeRecord(
      code,
      OUTCOME_CATALOG[code],
      'dep message',
      {
        from: 'src/a.ts',
        importIndex: 0,
        position: { column: 1, line: 1 },
        specifier: './b.js',
        to: 'src/b.ts',
      }
    );
    if (outcome.family !== 'dependency') {
      return;
    }
    expect(outcome.element).toBe('src/a.ts');
    expect(outcome.specifier).toBe('./b.js');
    expect(outcome.chain).toBeUndefined();
  });

  it('builds a dependency outcome with chain and custom element', () => {
    const code = 'dependency/re-entry-prohibition';
    const outcome = buildOutcomeRecord(
      code,
      OUTCOME_CATALOG[code],
      'path message',
      {
        chain: ['src/a.ts', 'external/lib.ts', 'src/b.ts'],
        element: 'custom-anchor',
        from: 'src/a.ts',
        importIndex: 1,
        to: 'src/b.ts',
      }
    );
    if (outcome.family !== 'dependency') {
      return;
    }
    expect(outcome.element).toBe('custom-anchor');
    expect(outcome.chain).toEqual(['src/a.ts', 'external/lib.ts', 'src/b.ts']);
    expect(outcome.specifier).toBeUndefined();
  });

  it('falls back to default unverified outcome when facts lack required elements', () => {
    const classCode = 'classification/unclassifiable-file';
    const classOutcome = buildOutcomeRecord(
      classCode,
      OUTCOME_CATALOG[classCode],
      'class msg',
      { propertyPath: 'foo' }
    );
    expect(classOutcome.constraint).toBe('unverified/not-implemented');

    const symbolCode = 'symbol/master-symbol';
    const symbolOutcome = buildOutcomeRecord(
      symbolCode,
      OUTCOME_CATALOG[symbolCode],
      'symbol msg',
      { propertyPath: 'foo' }
    );
    expect(symbolOutcome.constraint).toBe('unverified/not-implemented');

    const unverifiedCode = 'unverified/not-implemented';
    const unverifiedOutcome = buildOutcomeRecord(
      unverifiedCode,
      OUTCOME_CATALOG[unverifiedCode],
      'unverified msg',
      { propertyPath: 'foo' }
    );
    expect(unverifiedOutcome.constraint).toBe('unverified/not-implemented');
  });
});
