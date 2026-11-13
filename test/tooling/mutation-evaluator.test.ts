import { describe, expect, it } from 'vitest';

import type { TPlannedMutant } from '../../scripts/mutation-types.js';

import { evaluateMutationReport } from '../../scripts/mutation-evaluator.js';
import { formatEvaluationReport } from '../../scripts/mutation-formatter.js';

const makeLoc = (start: number, end: number) => ({
  end: { column: end, line: 1 },
  start: { column: start, line: 1 },
});

const buildReport = (
  mutants: readonly Record<string, unknown>[],
  source = 'export const x = 1;\n',
  filePath = 'src/example.ts'
): string =>
  JSON.stringify({
    files: { [filePath]: { language: 'typescript', mutants, source } },
    schemaVersion: '1.0',
  });

const buildMultiReport = (
  fileEntries: Record<string, readonly Record<string, unknown>[]>
): string => {
  const files: Record<
    string,
    {
      language: string;
      mutants: readonly Record<string, unknown>[];
      source: string;
    }
  > = {};
  for (const [file, mutants] of Object.entries(fileEntries)) {
    files[file] = { language: 'typescript', mutants, source: 'const x=1;\n' };
  }
  return JSON.stringify({ files, schemaVersion: '1.0' });
};

const makeMutant = (
  id: string,
  status: string,
  extra: Record<string, unknown> = {}
): Record<string, unknown> => ({
  id,
  location: makeLoc(1, 5),
  mutatorName: 'BlockStatement',
  replacement: '{}',
  status,
  ...extra,
});

const standardPlan: TPlannedMutant = {
  id: '1',
  location: makeLoc(1, 5),
  mutatorName: 'BlockStatement',
  replacement: '{}',
};

const k1 = makeMutant('1', 'Killed');

const makeNamedMutant = (
  id: string,
  mutatorName: string,
  replacement: string,
  status = 'Survived',
  location = makeLoc(1, 10)
) => makeMutant(id, status, { location, mutatorName, replacement });

const hasError = (
  evaluationResult: { readonly errors: readonly string[] },
  message: string
) => evaluationResult.errors.some((error) => error.includes(message));

const expectFailure = (
  evaluationResult: {
    readonly errors: readonly string[];
    readonly isPassed: boolean;
    readonly isValid: boolean;
  },
  message?: string
): void => {
  expect(evaluationResult.isValid || evaluationResult.isPassed).toBe(false);
  if (message !== undefined && message.length > 0) {
    expect(hasError(evaluationResult, message)).toBe(true);
  }
};

const makeMutants = (
  prefix: string,
  status: string,
  count: number,
  startCol = 1
): Record<string, unknown>[] =>
  Array.from({ length: count }, (_, index) =>
    makeMutant(`${prefix}-${String(index)}`, status, {
      location: makeLoc(startCol + index, startCol + index + 1),
    })
  );

const evalOffline = (
  mutants: readonly Record<string, unknown>[],
  source?: string
) => evaluateMutationReport(buildReport(mutants, source), { mode: 'offline' });

const evalTargetWithPlan = (
  report: string,
  plan: readonly TPlannedMutant[],
  expectedSources?: Map<string, string>
) =>
  evaluateMutationReport(report, {
    expectedSources,
    expectedTargets: ['src/example.ts'],
    mode: 'diff',
    plannedMutantsByFile: new Map([['src/example.ts', plan]]),
  });

const evalDiff = (
  mutants: readonly Record<string, unknown>[],
  planList: readonly TPlannedMutant[]
) => evalTargetWithPlan(buildReport(mutants), planList);

const makeHistPayload = (mutant: Record<string, unknown>) =>
  buildMultiReport({ 'src/c.ts': [k1], 'src/h.ts': [mutant] });

const evalWithHist = (report: string, histKey?: string) =>
  evaluateMutationReport(report, {
    expectedTargets: ['src/c.ts'],
    knownHistoricalMutants:
      histKey === undefined
        ? new Map()
        : new Map([['src/h.ts', new Set([histKey])]]),
    mode: 'diff',
    plannedMutantsByFile: new Map([['src/c.ts', [standardPlan]]]),
  });

const evalForce = (
  report: string,
  plan: readonly [string, readonly TPlannedMutant[]][]
) =>
  evaluateMutationReport(report, {
    expectedTargets: ['src/current.ts'],
    mode: 'force',
    plannedMutantsByFile: new Map(plan),
  });

describe('mutation-evaluator plan comparison', () => {
  it('fails binding measurement when independent execution plan is missing', () => {
    expectFailure(
      evaluateMutationReport(buildReport([k1]), {
        expectedTargets: ['src/example.ts'],
        mode: 'diff',
      }),
      'Independent execution plan is mandatory'
    );
  });

  it('passes when plan and report match exactly', () => {
    expect(evalDiff([k1], [standardPlan]).isPassed).toBe(true);
  });

  it('fails when plan Map is empty but report contains a mutant', () => {
    const payload = buildReport(
      [
        makeNamedMutant(
          'unplanned',
          'BooleanLiteral',
          'false',
          'Killed',
          makeLoc(1, 2)
        ),
      ],
      'true\n',
      'src/a.ts'
    );
    expectFailure(
      evaluateMutationReport(payload, {
        expectedTargets: ['src/a.ts'],
        mode: 'diff',
        plannedMutantsByFile: new Map(),
      }),
      'unplanned extra mutant "unplanned"'
    );
  });

  it('rejects extra mutant in report not in execution plan', () => {
    const extra = makeMutant('x', 'Killed', { location: makeLoc(6, 8) });
    const evaluation = evalDiff([k1, extra], [standardPlan]);
    expectFailure(evaluation, 'unplanned extra mutant "x"');
  });

  it('rejects mutant with same id but altered replacement or location', () => {
    const altered = makeMutant('1', 'Killed', { replacement: '{ alt: 1 }' });
    expectFailure(
      evalDiff([altered], [standardPlan]),
      'identity altered from plan'
    );
  });

  it('rejects report when source does not match expected observed source', () => {
    const sources = new Map([['src/example.ts', 'export const diff = 2;\n']]);
    const evaluation = evalTargetWithPlan(
      buildReport([k1]),
      [standardPlan],
      sources
    );
    expectFailure(
      evaluation,
      'report source does not match observed file content'
    );
  });

  it('accepts legitimate zero-mutant file omitted or empty when plan confirms 0 mutants', () => {
    const omitted = evalTargetWithPlan(
      '{"files":{},"schemaVersion":"1.0"}',
      []
    );
    expect(omitted.isValid && omitted.isPassed).toBe(true);
    expect(omitted.files['src/example.ts']?.isNullDenominator).toBe(true);
    expect(evalDiff([], []).isPassed).toBe(true);
  });

  it('rejects omitted file or empty mutants when plan had mutants', () => {
    expectFailure(evalDiff([], [standardPlan]), 'missing planned mutant "1"');
  });
});

describe('mutation-evaluator historical cache verification', () => {
  it('preserves recognized historical file from cache outside diff score and rejects unknown files', () => {
    const histMutant = makeMutant('h1', 'Survived');
    const histPayload = makeHistPayload(histMutant);
    const validResult = evaluateMutationReport(histPayload, {
      expectedTargets: ['src/c.ts'],
      knownHistoricalMutants: new Map([
        ['src/h.ts', new Set(['BlockStatement@1:1-1:5->{}'])],
      ]),
      mode: 'diff',
      plannedMutantsByFile: new Map([
        ['src/c.ts', [standardPlan]],
        ['src/h.ts', [{ ...standardPlan, id: 'h1' }]],
      ]),
    });
    expect(validResult.isPassed).toBe(true);
    expect(validResult.historicalFiles['src/h.ts']).toBeDefined();
    const unknownResult = evalWithHist(histPayload);
    expectFailure(unknownResult, 'no independent historical cache evidence');
  });

  it('rejects historical file with same id but altered replacement or operator', () => {
    const payload = makeHistPayload(
      makeNamedMutant(
        'old-id',
        'BooleanLiteral',
        '0',
        'Survived',
        makeLoc(1, 2)
      )
    );
    expectFailure(
      evalWithHist(payload, 'BooleanLiteral@1:1-1:2->false'),
      'not present in pre-run cache'
    );
  });

  it('recognizes historical file when report uses a different local id but identical full key', () => {
    const payload = makeHistPayload(
      makeNamedMutant(
        'differ-0',
        'BooleanLiteral',
        'false',
        'Survived',
        makeLoc(1, 2)
      )
    );
    const evaluationResult = evalWithHist(
      payload,
      'BooleanLiteral@1:1-1:2->false'
    );
    expect(evaluationResult.isValid && evaluationResult.isPassed).toBe(true);
    expect(evaluationResult.historicalFiles['src/h.ts']).toBeDefined();
  });

  it('fails when full mode report contains an unplanned file', () => {
    const payload = buildMultiReport({
      'src/current.ts': [k1],
      'src/unplanned.ts': [makeMutant('2', 'Killed')],
    });
    expectFailure(
      evalForce(payload, [['src/current.ts', [standardPlan]]]),
      'unplanned file "src/unplanned.ts"'
    );
  });

  it('fails when plan contains a file not present in expectedTargets', () => {
    const payload = buildReport([k1], undefined, 'src/current.ts');
    expectFailure(
      evalForce(payload, [
        ['src/current.ts', [standardPlan]],
        ['src/extra.ts', [{ ...standardPlan, id: 'extra-1' }]],
      ]),
      'not present in expected targets'
    );
  });
});

describe('mutation-evaluator scoring and feedback', () => {
  it('enforces unrounded 80% boundary (79.99% fails, 80.00% passes)', () => {
    const r7999 = evalOffline(
      [
        ...makeMutants('k', 'Killed', 7999, 1),
        ...makeMutants('s', 'Survived', 2001, 8001),
      ],
      'x'.repeat(12_000) + '\n'
    );
    expect(r7999.files['src/example.ts']?.score).toBeCloseTo(79.99, 2);
    expect(r7999.isPassed).toBe(false);

    const r8000 = evalOffline([
      ...makeMutants('k', 'Killed', 4, 1),
      ...makeMutants('s', 'Survived', 1, 5),
    ]);
    expect(r8000.files['src/example.ts']?.score).toBe(80);
    expect(r8000.isPassed).toBe(true);
  });

  it('prints complete identity for blocking unkilled and timeout mutants', () => {
    const s1 = makeNamedMutant('s1', 'Equality', '!==');
    const t1 = makeMutant('t1', 'Timeout', {
      location: makeLoc(1, 15),
      statusReason: 'Hit limit reached',
    });
    const text = formatEvaluationReport(
      evalOffline([s1, t1], 'export const val = 42;\n')
    );
    expect(text).toContain('Equality');
    expect(text).toContain('!==');
    expect(text).toContain('hit-limit');
  });
});
