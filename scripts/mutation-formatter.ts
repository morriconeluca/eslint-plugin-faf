import {
  emptyCounts,
  STATUS_KEYS,
  type TFileEvaluation,
  type TMutationEvaluationResult,
  type TParsedFileMutants,
  type TPlannedMutant,
} from './mutation-types.js';

type TPos = { readonly column: number; readonly line: number };

export const formatLocation = (start: TPos, end: TPos): string =>
  `${String(start.line)}:${String(start.column)}-${String(end.line)}:${String(end.column)}`;

export const verifyExactPlanMatch = (
  file: string,
  planned: readonly TPlannedMutant[],
  parsed: TParsedFileMutants,
  errors: string[]
): void => {
  const plannedMap = new Map(planned.map((p) => [p.id, p]));
  for (const p of planned) {
    const r = parsed.allMutants.get(p.id);
    if (r === undefined) {
      errors.push(`File ${file}: missing planned mutant "${p.id}" from report`);
      continue;
    }
    const expLoc = formatLocation(p.location.start, p.location.end);
    if (
      r.location !== expLoc ||
      r.mutatorName !== p.mutatorName ||
      r.replacement !== p.replacement
    ) {
      errors.push(`File ${file}: mutant "${p.id}" identity altered from plan`);
    }
  }
  for (const id of parsed.allMutants.keys()) {
    if (!plannedMap.has(id)) {
      errors.push(
        `File ${file}: report contains unplanned extra mutant "${id}"`
      );
    }
  }
};

export const extractSnippet = (
  source: string,
  start: TPos,
  end: TPos
): string | undefined => {
  const lines = source.split('\n');
  const startText = lines[start.line - 1];
  const endText = lines[end.line - 1];
  if (startText === undefined || endText === undefined) {
    return undefined;
  }
  return start.line === end.line
    ? startText.slice(start.column - 1, end.column - 1)
    : `${startText.slice(start.column - 1)}...${endText.slice(0, end.column - 1)}`;
};

export const summarizeFiles = (
  files: Record<string, TFileEvaluation>,
  historicalFiles: Record<string, TFileEvaluation>,
  errors: string[],
  warnings: string[]
): TMutationEvaluationResult => {
  const overall = emptyCounts();
  const timeoutAssistedFiles: string[] = [];
  for (const f of Object.values(files)) {
    if (f.isTimeoutAssisted) {
      timeoutAssistedFiles.push(f.filePath);
    }
    for (const k of STATUS_KEYS) {
      overall[k] += f.counts[k];
    }
  }
  const detected = overall.Killed + overall.Timeout;
  const relevant = detected + overall.Survived + overall.NoCoverage;
  return {
    errors,
    files,
    historicalFiles,
    isPassed:
      errors.length === 0 && Object.values(files).every((f) => f.isPassed),
    isValid: errors.length === 0,
    overallCounts: {
      ...overall,
      total: Object.values(overall).reduce((a, b) => a + b, 0),
    },
    overallScore: relevant === 0 ? 100 : (detected / relevant) * 100,
    timeoutAssistedFiles,
    warnings,
  };
};

const DEFAULT_THRESHOLD = 80;

const formatFailures = (
  failed: readonly TFileEvaluation[],
  threshold: number
): readonly string[] => {
  if (failed.length === 0) return [];
  const lines = [
    `\nFAILURES (${String(failed.length)} file(s) below ${String(threshold)}%):`,
  ];
  for (const failedFile of failed) {
    const c = failedFile.counts;
    lines.push(
      `\n[FAILED] ${failedFile.filePath} score: ${failedFile.score.toFixed(2)}% (K=${String(c.Killed)}, T=${String(c.Timeout)}, S=${String(c.Survived)}, NC=${String(c.NoCoverage)})`
    );
    for (const mutant of failedFile.unkilled) {
      const snippet =
        mutant.originalSnippet === undefined
          ? ''
          : ` "${mutant.originalSnippet}"`;
      lines.push(
        `  - [${mutant.status}] ${mutant.id} at ${mutant.location} (${mutant.mutator})${snippet} -> "${mutant.replacement}" [reason: ${mutant.reason}]`
      );
    }
  }
  return lines;
};

const formatTimeouts = (
  files: Record<string, TFileEvaluation>
): readonly string[] => {
  const allTimeouts = Object.values(files).flatMap((f) =>
    f.timeouts.map((t) => ({ file: f.filePath, timeout: t }))
  );
  if (allTimeouts.length === 0) return [];
  const lines = [
    `\nTIMEOUT DETAILS (${String(allTimeouts.length)} mutant(s)):`,
  ];
  for (const item of allTimeouts) {
    const reasonText =
      item.timeout.reason.length > 0 ? item.timeout.reason : 'unattributed';
    lines.push(
      `  - [Timeout] ${item.file} id:${item.timeout.id} at ${item.timeout.location} [category: ${item.timeout.category}] [reason: ${reasonText}]`
    );
  }
  return lines;
};

export const formatEvaluationReport = (
  result: TMutationEvaluationResult,
  threshold = DEFAULT_THRESHOLD
): string => {
  const counts = result.overallCounts;
  const lines = [
    '=== Mutation Evaluation Summary ===',
    `Total mutants: ${String(counts.total)}`,
    ...STATUS_KEYS.map(
      (k) => `  ${(k + ':').padEnd(16)}${String(counts[k]).padStart(6)}`
    ),
    `Score: ${result.overallScore.toFixed(2)}% | Files: ${String(Object.keys(result.files).length)}`,
  ];
  if (Object.keys(result.historicalFiles).length > 0) {
    lines.push(
      `Historical files preserved outside diff verdict: ${String(Object.keys(result.historicalFiles).length)}`
    );
  }
  if (result.timeoutAssistedFiles.length > 0) {
    lines.push(
      `Notice: ${String(result.timeoutAssistedFiles.length)} file(s) met ${String(threshold)}% threshold only with Timeouts.`
    );
  }

  const failed = Object.values(result.files).filter((file) => !file.isPassed);
  lines.push(
    ...formatFailures(failed, threshold),
    ...formatTimeouts(result.files)
  );

  if (result.warnings.length > 0) {
    lines.push('\nWARNINGS:', ...result.warnings.map((w) => `  - ${w}`));
  }
  if (result.errors.length > 0) {
    lines.push('\nERRORS:', ...result.errors.map((error) => `  - ${error}`));
  }
  return lines.join('\n');
};
