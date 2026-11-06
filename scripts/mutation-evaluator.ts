import { summarizeFiles, verifyExactPlanMatch } from './mutation-formatter.js';
import { parseFileReport, parseMutationPayload } from './mutation-parser.js';
import {
  emptyCounts,
  makeEmptyEvaluationResult,
  type TEvaluationExpectations,
  type TFileEvaluation,
  type TMutationEvaluationResult,
  type TParsedFileMutants,
  type TPlannedMutant,
  ZERO_FILE_METRICS,
} from './mutation-types.js';

const DEFAULT_THRESHOLD = 80;

type TEvalContext = {
  readonly errors: string[];
  readonly expectations: TEvaluationExpectations;
  readonly threshold: number;
  readonly warnings: string[];
};

const verifyFileEvidence = (
  filePath: string,
  parsed: TParsedFileMutants,
  context: TEvalContext,
  planned?: readonly TPlannedMutant[],
  historicalMutants?: ReadonlySet<string>
): void => {
  if (planned !== undefined)
    verifyExactPlanMatch(filePath, planned, parsed, context.errors);
  const expSrc = context.expectations.expectedSources?.get(filePath);
  if (expSrc !== undefined && parsed.source !== expSrc) {
    context.errors.push(
      `File ${filePath}: report source does not match observed file content`
    );
  }
  if (historicalMutants === undefined) {
    return;
  }
  const reportKeys = new Set<string>();
  for (const m of parsed.allMutants.values()) {
    const key = `${m.mutatorName}@${m.location}->${m.replacement}`;
    reportKeys.add(key);
    if (!historicalMutants.has(key)) {
      context.errors.push(
        `Historical file "${filePath}" contains mutant "${m.id}" not present in pre-run cache`
      );
    }
  }
  for (const key of historicalMutants) {
    if (!reportKeys.has(key)) {
      context.errors.push(
        `Historical file "${filePath}" is missing mutant with identity "${key}" from pre-run cache`
      );
    }
  }
};

const evaluateReportFile = (
  filePath: string,
  rawFile: unknown,
  context: TEvalContext,
  planned?: readonly TPlannedMutant[],
  historicalMutants?: ReadonlySet<string>
): null | TFileEvaluation => {
  const parsed = parseFileReport(filePath, rawFile, context.errors);
  if (parsed === null || !parsed.isValid) return null;
  verifyFileEvidence(filePath, parsed, context, planned, historicalMutants);

  const c = parsed.counts;
  const detected = c.Killed + c.Timeout;
  const totalRelevant = detected + c.Survived + c.NoCoverage;
  const isNull = totalRelevant === 0;
  const score = isNull ? 100 : (detected / totalRelevant) * 100;
  const scoreKilled = isNull ? 100 : (c.Killed / totalRelevant) * 100;
  const isPassed = score >= context.threshold;
  const isTimeoutAssisted =
    isPassed && !isNull && scoreKilled < context.threshold;

  if (isTimeoutAssisted) {
    context.warnings.push(
      `File ${filePath} passed threshold only with Timeouts (K/N=${scoreKilled.toFixed(2)}%, (K+T)/N=${score.toFixed(2)}%)`
    );
  }
  if (isNull) {
    context.warnings.push(
      `File ${filePath} has 0 relevant mutants (null denominator); conventional score 100% applied`
    );
  }

  return {
    counts: { ...c, total: parsed.mutantsCount },
    detected,
    filePath,
    isNullDenominator: isNull,
    isPassed,
    isTimeoutAssisted,
    score,
    scoreKilledOnly: scoreKilled,
    timeouts: parsed.timeouts,
    totalRelevant,
    unkilled: parsed.unkilled,
  };
};

const evaluateTarget = (
  target: string,
  rawFile: unknown,
  context: TEvalContext
): null | TFileEvaluation => {
  const hasPlan = context.expectations.plannedMutantsByFile !== undefined;
  const planned =
    context.expectations.plannedMutantsByFile?.get(target) ??
    (hasPlan ? [] : undefined);
  if (rawFile !== undefined)
    return evaluateReportFile(target, rawFile, context, planned);
  if (planned !== undefined && planned.length === 0) {
    context.warnings.push(
      `File ${target} has 0 planned mutants (legitimate zero); conventional score 100% applied`
    );
    return { ...ZERO_FILE_METRICS, counts: emptyCounts(), filePath: target };
  }
  const count = planned === undefined ? 0 : planned.length;
  context.errors.push(
    `Missing expected target in report: ${target} (${String(count)} planned mutants omitted)`
  );
  return null;
};

const handleHistoricalOrExtraEntry = (
  filePath: string,
  rawFile: unknown,
  context: TEvalContext,
  historicalFiles: Record<string, TFileEvaluation>,
  extraFiles: Record<string, TFileEvaluation>
): void => {
  const known = context.expectations.knownHistoricalMutants?.get(filePath);
  if (context.expectations.mode === 'diff') {
    if (known === undefined) {
      context.errors.push(
        `Report contains unrequested file "${filePath}" with no independent historical cache evidence`
      );
      return;
    }
    const evalHist = evaluateReportFile(
      filePath,
      rawFile,
      context,
      context.expectations.plannedMutantsByFile?.get(filePath),
      known
    );
    if (evalHist !== null) {
      historicalFiles[filePath] = evalHist;
      context.warnings.push(
        `Historical mutant file preserved outside diff verdict: ${filePath}`
      );
    }
    return;
  }
  if (context.expectations.mode === 'offline') {
    const evaluated = evaluateReportFile(filePath, rawFile, context);
    if (evaluated !== null) extraFiles[filePath] = evaluated;
    return;
  }
  if (context.expectations.expectedTargets !== undefined) {
    context.errors.push(
      `Report contains unplanned file "${filePath}" outside expected targets`
    );
  }
  const planned = context.expectations.plannedMutantsByFile?.get(filePath);
  if (planned === undefined) {
    context.errors.push(
      `Report contains unplanned file "${filePath}" not present in execution plan`
    );
  }
  const evaluated = evaluateReportFile(
    filePath,
    rawFile,
    context,
    planned ?? []
  );
  if (evaluated !== null) extraFiles[filePath] = evaluated;
};

const validatePreconditions = (
  fileCount: number,
  exp: TEvaluationExpectations,
  errors: string[]
): void => {
  if (exp.mode !== 'offline' && exp.plannedMutantsByFile === undefined) {
    errors.push(
      'Independent execution plan is mandatory for binding measurement runs'
    );
  }
  const isFull = exp.mode === 'incremental' || exp.mode === 'force';
  if (isFull && fileCount === 0)
    errors.push('Full mutation report cannot have 0 mutated files');
};

const validatePlanTargets = (
  exp: TEvaluationExpectations,
  errors: string[]
): void => {
  if (
    exp.mode === 'offline' ||
    exp.plannedMutantsByFile === undefined ||
    exp.expectedTargets === undefined
  ) {
    return;
  }
  const targetSet = new Set(exp.expectedTargets);
  for (const file of exp.plannedMutantsByFile.keys()) {
    const isKnownHistorical =
      exp.mode === 'diff' && exp.knownHistoricalMutants?.has(file) === true;
    if (!isKnownHistorical && !targetSet.has(file)) {
      errors.push(
        `Execution plan contains file "${file}" not present in expected targets`
      );
    }
  }
};

const evaluateExpectedTargets = (
  expectedTargets: readonly string[],
  reportFiles: Record<string, unknown>,
  context: TEvalContext
): Record<string, TFileEvaluation> => {
  const files: Record<string, TFileEvaluation> = {};
  for (const target of expectedTargets) {
    const evaluated = evaluateTarget(target, reportFiles[target], context);
    if (evaluated !== null) files[target] = evaluated;
  }
  return files;
};

export const evaluateMutationReport = (
  input: unknown,
  expectations: TEvaluationExpectations
): TMutationEvaluationResult => {
  const { error, report } = parseMutationPayload(input);
  if (error !== undefined || report === undefined) {
    return makeEmptyEvaluationResult(error ?? 'Report parse failure');
  }
  const errors: string[] = [];
  const warnings: string[] = [];
  const threshold = expectations.threshold ?? DEFAULT_THRESHOLD;
  const context: TEvalContext = { errors, expectations, threshold, warnings };

  validatePreconditions(Object.keys(report.files).length, expectations, errors);
  validatePlanTargets(expectations, errors);

  const files =
    expectations.expectedTargets === undefined
      ? {}
      : evaluateExpectedTargets(
          expectations.expectedTargets,
          report.files,
          context
        );

  const expectedSet =
    expectations.expectedTargets === undefined
      ? undefined
      : new Set(expectations.expectedTargets);

  const historicalFiles: Record<string, TFileEvaluation> = {};
  for (const [file, raw] of Object.entries(report.files)) {
    if (expectedSet === undefined || !expectedSet.has(file)) {
      handleHistoricalOrExtraEntry(file, raw, context, historicalFiles, files);
    }
  }
  return summarizeFiles(files, historicalFiles, errors, warnings);
};
