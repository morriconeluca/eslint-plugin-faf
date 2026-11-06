import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { isValidGitBase, readRepositoryChanges } from './changed-files.js';
import {
  isolatePriorArtifacts,
  readExpectedSources,
  readHistoricalMutantsFromCache,
  readIndependentPlan,
} from './mutation-artifacts.js';
import { evaluateMutationReport } from './mutation-evaluator.js';
import { formatEvaluationReport } from './mutation-formatter.js';
import {
  archiveRunArtifacts,
  buildManifest,
  checkUnmodified,
  collectPreSpawnContext,
} from './mutation-manifest.js';
import {
  DIFF_INC_FILE,
  INC_FILE,
  type TMutationRunManifest,
  type TMutationRunMode,
  type TMutationRunOptions,
  type TMutationRunResult,
  type TRunContext,
  type TSpawnResult,
} from './mutation-runner-types.js';
import {
  listAllMutableSources,
  selectMutationTargets,
} from './mutation-targets.js';

const DEFAULT_REPORT = 'reports/mutation/mutation.json';
const DEFAULT_MANIFEST = 'reports/mutation/run-manifest.json';
const STRYKER_BIN = './node_modules/.bin/stryker';

const resolveStrykerArguments = (
  mode: TMutationRunMode,
  targets: readonly string[]
): readonly string[] => {
  if (mode === 'diff') {
    return [
      'run',
      '--mutate',
      targets.join(','),
      '--incremental',
      '--force',
      '--incrementalFile',
      DIFF_INC_FILE,
    ];
  }
  if (mode === 'incremental') {
    return ['run', '--incremental', '--incrementalFile', INC_FILE];
  }
  return ['run', '--force'];
};

const getSpawnMessage = (
  result: TSpawnResult,
  reportPath: string
): null | string => {
  if (result.error !== undefined)
    return `Failed to spawn Stryker: ${result.error.message}`;
  if (result.signal !== undefined && result.signal !== null) {
    return `Stryker process terminated by signal: ${result.signal}`;
  }
  if (result.status !== 0) {
    return `Stryker process exited with non-zero status: ${String(result.status)}`;
  }
  if (!fs.existsSync(reportPath)) {
    return `Stryker exited with 0 but report missing: ${reportPath}`;
  }
  return null;
};

const validateSpawnOutcome = (
  spawnResult: TSpawnResult,
  snapshot: { readonly fileHashes: ReadonlyMap<string, string> },
  context: TRunContext
): null | { exitCode: number; message: string } => {
  const spawnError = getSpawnMessage(spawnResult, context.reportPath);
  if (spawnError !== null) {
    const exitCode =
      spawnResult.status === null || spawnResult.status === 0
        ? 1
        : spawnResult.status;
    return { exitCode, message: spawnError };
  }
  const tampering = checkUnmodified(context.root, snapshot, context.targets);
  return tampering === null ? null : { exitCode: 1, message: tampering };
};

const acquireTargets = (
  mode: TMutationRunMode,
  base: string | undefined,
  root: string
): { readonly error?: string; readonly targets: readonly string[] } => {
  if (mode === 'diff') {
    const effectiveBase = base ?? 'main';
    if (!isValidGitBase(effectiveBase, root)) {
      return {
        error: `Invalid git base reference: "${effectiveBase}"`,
        targets: [],
      };
    }
    const changes = readRepositoryChanges(effectiveBase, root);
    return {
      targets: selectMutationTargets(
        changes.changedPaths,
        changes.presentFiles
      ),
    };
  }
  return { targets: listAllMutableSources(root) };
};

const handleProcessFailure = (
  context: TRunContext,
  manifest: TMutationRunManifest,
  failure: { exitCode: number; message: string }
): TMutationRunResult => {
  console.error(failure.message);
  const archivedManifest = archiveRunArtifacts(
    context.runDirectory,
    manifest,
    context.manifestPath,
    context.reportPath
  );
  return {
    errorMessage: failure.message,
    exitCode: failure.exitCode,
    isPassed: false,
    manifest: archivedManifest,
    status: 'failed',
  };
};

const executeStryker = (
  context: TRunContext,
  initialCacheHash: null | string
): { failure?: TMutationRunResult; manifest: TMutationRunManifest } => {
  const argv = resolveStrykerArguments(context.options.mode, context.targets);
  const preSpawn = collectPreSpawnContext(
    context.root,
    context.options,
    context.targets,
    argv,
    context.runId,
    initialCacheHash
  );
  const spawn = context.options.spawnSyncImpl ?? spawnSync;
  const spawnResult = spawn(STRYKER_BIN, argv, {
    cwd: context.root,
    stdio: 'inherit',
  });
  const endTime = new Date();
  const manifest = buildManifest(preSpawn, spawnResult, endTime);
  const failure = validateSpawnOutcome(spawnResult, preSpawn.snapshot, context);
  return failure === null
    ? { manifest }
    : { failure: handleProcessFailure(context, manifest, failure), manifest };
};

const finishMeasureRun = (
  context: TRunContext,
  baseManifest: TMutationRunManifest,
  expectedSources: ReadonlyMap<string, string>,
  knownHistoricalMutants: ReadonlyMap<string, ReadonlySet<string>>
): TMutationRunResult => {
  const eventsDirectory = path.resolve(context.root, 'reports/mutation/events');
  const planResult = readIndependentPlan(eventsDirectory, context.root);
  if (planResult.error !== undefined || planResult.plan === undefined) {
    return handleProcessFailure(context, baseManifest, {
      exitCode: 1,
      message: `Independent plan verification failed: ${planResult.error ?? 'unknown error'}`,
    });
  }

  const threshold = context.options.threshold ?? 80;
  const evaluation = evaluateMutationReport(
    fs.readFileSync(context.reportPath, 'utf8'),
    {
      expectedSources,
      expectedTargets: context.targets,
      knownHistoricalMutants,
      mode: context.options.mode,
      plannedMutantsByFile: planResult.plan,
      threshold,
    }
  );
  const finalManifestBeforeArchive: TMutationRunManifest = {
    ...baseManifest,
    isPassed: evaluation.isPassed,
    overallCounts: evaluation.overallCounts,
    overallScore: evaluation.overallScore,
  };
  const finalManifest = archiveRunArtifacts(
    context.runDirectory,
    finalManifestBeforeArchive,
    context.manifestPath,
    context.reportPath,
    planResult.rawPlanJson
  );
  console.log(formatEvaluationReport(evaluation, threshold));

  return {
    evaluation,
    exitCode: evaluation.isPassed ? 0 : 1,
    isPassed: evaluation.isPassed,
    manifest: finalManifest,
    status: evaluation.isPassed ? 'passed' : 'failed',
  };
};

export const runMutationMeasure = (
  options: TMutationRunOptions
): TMutationRunResult => {
  if (options.error !== undefined) {
    console.error(options.error);
    return {
      errorMessage: options.error,
      exitCode: 1,
      isPassed: false,
      status: 'failed',
    };
  }

  const root = options.cwd ?? process.cwd();
  const targetResult = acquireTargets(options.mode, options.base, root);
  if (targetResult.error !== undefined) {
    console.error(targetResult.error);
    return {
      errorMessage: targetResult.error,
      exitCode: 1,
      isPassed: false,
      status: 'failed',
    };
  }
  const targets = targetResult.targets;

  if (options.mode === 'diff' && targets.length === 0) {
    console.log(
      'No source files to mutate for the current diff. Mutation diff gate passed.'
    );
    return { exitCode: 0, isPassed: true, status: 'empty-diff' };
  }

  const preSpawnCache = readHistoricalMutantsFromCache(root, options.mode);
  if (preSpawnCache.error !== undefined) {
    console.error(preSpawnCache.error);
    return {
      errorMessage: preSpawnCache.error,
      exitCode: 1,
      isPassed: false,
      status: 'failed',
    };
  }

  const reportPath = path.resolve(root, options.reportPath ?? DEFAULT_REPORT);
  const manifestPath = path.resolve(
    root,
    options.manifestPath ?? DEFAULT_MANIFEST
  );
  const runId = `${String(Date.now())}-${String(process.pid)}-${crypto.randomBytes(3).toString('hex')}`;
  const runDirectory = path.resolve(root, 'reports/mutation/runs', runId);
  const context: TRunContext = {
    manifestPath,
    options,
    reportPath,
    root,
    runDirectory,
    runId,
    targets,
  };

  const expectedSources = readExpectedSources(root, targets);
  isolatePriorArtifacts(root, reportPath);

  const processResult = executeStryker(context, preSpawnCache.initialCacheHash);
  return (
    processResult.failure ??
    finishMeasureRun(
      context,
      processResult.manifest,
      expectedSources,
      preSpawnCache.mutantsByFile
    )
  );
};
