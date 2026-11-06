import type { TCounts, TMutationEvaluationResult } from './mutation-types.js';

export const DIFF_INC_FILE = '.cache/stryker/diff.json';
export const INC_FILE = '.cache/stryker/incremental.json';

export type TArchivedArtifacts = {
  readonly plan?: TArtifactReference;
  readonly report?: TArtifactReference;
  readonly runDirectory: string;
};

export type TArtifactReference = {
  readonly path: string;
  readonly sha256: string;
};

export type TMutationRunManifest = {
  readonly argv: readonly string[];
  readonly artifacts?: TArchivedArtifacts;
  readonly base?: string;
  readonly command: string;
  readonly cwd: string;
  readonly durationMs: number;
  readonly endTime: string;
  readonly executable: string;
  readonly exitCode: number;
  readonly fingerprint: string;
  readonly gitCommit: string;
  readonly initialCacheHash: null | string;
  readonly isDirty: boolean;
  readonly isPassed: boolean;
  readonly mode: TMutationRunMode;
  readonly overallCounts?: TCounts;
  readonly overallScore?: number;
  readonly processOutcome: {
    readonly exitCode: null | number;
    readonly signal: null | string;
  };
  readonly reportPath: string;
  readonly resolvedVersions: {
    readonly node: string;
    readonly strykerCore: string;
    readonly strykerRunner: string;
    readonly vitest: string;
  };
  readonly reuseState: {
    readonly force: boolean;
    readonly incrementalFile: null | string;
    readonly reusedMutantResults: number | string;
  };
  readonly runId: string;
  readonly startTime: string;
  readonly targets: readonly string[];
};

export type TMutationRunMode = 'diff' | 'force' | 'incremental';

export type TMutationRunOptions = {
  readonly base?: string;
  readonly commandOverride?: string;
  readonly cwd?: string;
  readonly error?: string;
  readonly isTestContext?: boolean;
  readonly manifestPath?: string;
  readonly mode: TMutationRunMode;
  readonly reportPath?: string;
  readonly spawnSyncImpl?: TSpawnExecutor;
  readonly testVersions?: {
    readonly node: string;
    readonly strykerCore: string;
    readonly strykerRunner: string;
    readonly vitest: string;
  };
  readonly threshold?: number;
};

export type TMutationRunResult = {
  readonly errorMessage?: string;
  readonly evaluation?: TMutationEvaluationResult;
  readonly exitCode: number;
  readonly isPassed: boolean;
  readonly manifest?: TMutationRunManifest;
  readonly status: 'empty-diff' | 'failed' | 'passed';
};

export type TPreSpawnContext = {
  readonly argv: readonly string[];
  readonly gitCommit: string;
  readonly initialCacheHash: null | string;
  readonly isDirty: boolean;
  readonly options: TMutationRunOptions;
  readonly resolvedVersions: TMutationRunManifest['resolvedVersions'];
  readonly root: string;
  readonly runId: string;
  readonly snapshot: {
    readonly fileHashes: ReadonlyMap<string, string>;
    readonly fingerprint: string;
  };
  readonly startTime: Date;
  readonly targets: readonly string[];
};

export type TRunContext = {
  readonly manifestPath: string;
  readonly options: TMutationRunOptions;
  readonly reportPath: string;
  readonly root: string;
  readonly runDirectory: string;
  readonly runId: string;
  readonly targets: readonly string[];
};

export type TSpawnExecutor = (
  executable: string,
  argumentsList: readonly string[],
  options: { readonly cwd: string; readonly stdio: 'inherit' }
) => TSpawnResult;

export type TSpawnResult = {
  readonly error?: Error;
  readonly signal?: null | string;
  readonly status: null | number;
};
