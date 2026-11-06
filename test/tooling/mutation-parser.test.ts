import { describe, expect, it } from 'vitest';

import {
  parseFileReport,
  parseMutationPayload,
  parsePlanPayload,
} from '../../scripts/mutation-parser.js';

const makeMutant = (
  id: string,
  extra: Record<string, unknown> = {}
): Record<string, unknown> => ({
  id,
  location: { end: { column: 5, line: 1 }, start: { column: 1, line: 1 } },
  mutatorName: 'BlockStatement',
  replacement: '{}',
  status: 'Killed',
  ...extra,
});

const makeReportObject = (mutants: readonly Record<string, unknown>[]) => ({
  language: 'typescript',
  mutants,
  source: 'export const a = 1;\n',
});

describe('mutation-parser (V1 payload and report parsing)', () => {
  it('rejects invalid json, unsupported schema or missing fields', () => {
    for (const payload of [
      '{ bad json',
      '{}',
      '123',
      '{"files":{},"schemaVersion":"2.0"}',
      '{"files":{},"schemaVersion":"100.not-supported"}',
      '{"schemaVersion":"1.0"}',
    ]) {
      expect(parseMutationPayload(payload).error).toBeDefined();
    }
  });

  it('rejects non-final status, invalid coordinates or missing source', () => {
    const errors: string[] = [];
    expect(parseFileReport('src/a.ts', {}, errors)).toBeNull();
    expect(errors.length).toBeGreaterThan(0);

    const badReport = makeReportObject([
      makeMutant('1', { status: 'Pending' }),
    ]);
    expect(parseFileReport('src/a.ts', badReport, [])).toBeNull();

    const badLoc = parseFileReport(
      'src/a.ts',
      makeReportObject([
        makeMutant('1', {
          location: {
            end: { column: 1, line: 1 },
            start: { column: 5, line: 1 },
          },
        }),
      ]),
      []
    );
    expect(badLoc?.isValid).toBe(false);
  });

  it('accepts legal empty string replacement', () => {
    const errors: string[] = [];
    const parsed = parseFileReport(
      'src/a.ts',
      makeReportObject([makeMutant('1', { replacement: '' })]),
      errors
    );
    expect(parsed?.isValid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  it('rejects duplicate mutant ids and duplicate mutant identities', () => {
    const errors1: string[] = [];
    const parsed1 = parseFileReport(
      'src/a.ts',
      makeReportObject([makeMutant('d'), makeMutant('d')]),
      errors1
    );
    expect(parsed1?.isValid).toBe(false);
    expect(errors1[0]).toContain('duplicate mutant id');

    const errors2: string[] = [];
    const parsed2 = parseFileReport(
      'src/a.ts',
      makeReportObject([makeMutant('1'), makeMutant('2')]),
      errors2
    );
    expect(parsed2?.isValid).toBe(false);
    expect(errors2[0]).toContain('duplicate mutant identity');
  });
});

const makePlanMutant = (id: string, startCol = 0, endCol = 4) => ({
  mutant: {
    fileName: '/root/src/a.ts',
    id,
    location: {
      end: { column: endCol, line: 0 },
      start: { column: startCol, line: 0 },
    },
    mutatorName: 'BlockStatement',
    replacement: '{}',
  },
});

describe('mutation-parser (V1 plan payload parsing)', () => {
  it('parses valid plan payload converting 0-based to 1-based coordinates', () => {
    const raw = JSON.stringify({ mutantPlans: [makePlanMutant('1')] });
    const result = parsePlanPayload(raw, '/root');
    expect(result.error).toBeUndefined();
    const planned = result.plan?.get('src/a.ts');
    expect(planned).toHaveLength(1);
    expect(planned?.[0]?.location).toEqual({
      end: { column: 5, line: 1 },
      start: { column: 1, line: 1 },
    });
  });

  it('rejects corrupted plan JSON or invalid plan schema', () => {
    expect(parsePlanPayload('{ bad', '/root').error).toContain(
      'Corrupted plan'
    );
    expect(parsePlanPayload('{}', '/root').error).toContain(
      'Invalid plan payload'
    );
  });

  it('rejects unordered location coordinates in plan', () => {
    const raw = JSON.stringify({ mutantPlans: [makePlanMutant('1', 5, 1)] });
    expect(parsePlanPayload(raw, '/root').error).toContain('unordered');
  });

  it('rejects duplicated mutant id in plan for the same file', () => {
    const raw = JSON.stringify({
      mutantPlans: [makePlanMutant('dup-1'), makePlanMutant('dup-1', 5, 8)],
    });
    expect(parsePlanPayload(raw, '/root').error).toContain(
      'duplicated in execution plan'
    );
  });
});
