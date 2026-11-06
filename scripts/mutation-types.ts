export const STATUS_KEYS = [
  'CompileError',
  'Ignored',
  'Killed',
  'NoCoverage',
  'RuntimeError',
  'Survived',
  'Timeout',
] as const;

export const ZERO_FILE_METRICS = {
  detected: 0,
  isNullDenominator: true,
  isPassed: true,
  isTimeoutAssisted: false,
  score: 100,
  scoreKilledOnly: 100,
  timeouts: [],
  totalRelevant: 0,
  unkilled: [],
} as const;

export const emptyCounts = (): TCounts => ({
  CompileError: 0,
  Ignored: 0,
  Killed: 0,
  NoCoverage: 0,
  RuntimeError: 0,
  Survived: 0,
  Timeout: 0,
  total: 0,
});

export const makeEmptyEvaluationResult = (
  error: string
): TMutationEvaluationResult => ({
  errors: [error],
  files: {},
  historicalFiles: {},
  isPassed: false,
  isValid: false,
  overallCounts: emptyCounts(),
  overallScore: 0,
  timeoutAssistedFiles: [],
  warnings: [],
});

export type TCounts = Record<TMutantStatus, number> & {
  readonly total: number;
};

export type TEvaluationExpectations = {
  readonly expectedSources?: ReadonlyMap<string, string>;
  readonly expectedTargets?: readonly string[];
  readonly knownHistoricalMutants?: ReadonlyMap<string, ReadonlySet<string>>;
  readonly mode: 'diff' | 'force' | 'incremental' | 'offline';
  readonly plannedMutantsByFile?: ReadonlyMap<
    string,
    readonly TPlannedMutant[]
  >;
  readonly threshold?: number;
};

export type TFileEvaluation = {
  readonly counts: TCounts;
  readonly detected: number;
  readonly filePath: string;
  readonly isNullDenominator: boolean;
  readonly isPassed: boolean;
  readonly isTimeoutAssisted: boolean;
  readonly score: number;
  readonly scoreKilledOnly: number;
  readonly timeouts: readonly TTimeoutDetail[];
  readonly totalRelevant: number;
  readonly unkilled: readonly TUnkilledDetail[];
};

export type TMutantStatus = (typeof STATUS_KEYS)[number];

export type TMutationEvaluationResult = {
  readonly errors: readonly string[];
  readonly files: Record<string, TFileEvaluation>;
  readonly historicalFiles: Record<string, TFileEvaluation>;
  readonly isPassed: boolean;
  readonly isValid: boolean;
  readonly overallCounts: TCounts;
  readonly overallScore: number;
  readonly timeoutAssistedFiles: readonly string[];
  readonly warnings: readonly string[];
};

export type TParsedFileMutants = {
  readonly allMutants: ReadonlyMap<string, TParsedMutantItem>;
  readonly counts: TCounts;
  readonly isValid: boolean;
  readonly mutantIds: readonly string[];
  readonly mutantsCount: number;
  readonly source: string;
  readonly timeouts: readonly TTimeoutDetail[];
  readonly unkilled: readonly TUnkilledDetail[];
};

export type TParsedMutantItem = {
  readonly id: string;
  readonly location: string;
  readonly mutatorName: string;
  readonly replacement: string;
  readonly status: TMutantStatus;
};

export type TPlannedMutant = {
  readonly id: string;
  readonly location: {
    readonly end: { readonly column: number; readonly line: number };
    readonly start: { readonly column: number; readonly line: number };
  };
  readonly mutatorName: string;
  readonly replacement: string;
};

export type TTimeoutCategory = 'hit-limit' | 'runner-declared' | 'unattributed';

export type TTimeoutDetail = {
  readonly category: TTimeoutCategory;
  readonly id: string;
  readonly location: string;
  readonly reason: string;
};

export type TUnkilledDetail = {
  readonly id: string;
  readonly location: string;
  readonly mutator: string;
  readonly originalSnippet?: string;
  readonly reason: string;
  readonly replacement: string;
  readonly status: 'NoCoverage' | 'Survived';
};
