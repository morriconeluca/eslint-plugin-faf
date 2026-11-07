import type {
  TBenchmarkBudget,
  TBenchmarkResult,
  TBenchmarkSuiteResult,
} from './benchmark.type.js';

import { runBenchmark } from './measure.js';

const SCALE_1K = 1000;
const SCALE_10K = 10_000;

const formatMilliseconds = (valueMs: number): string =>
  `${valueMs.toFixed(2)} ms`;

const formatBytes = (bytes: number): string => {
  const kilobytes = (bytes / 1024).toFixed(1);
  return `${kilobytes} KB`;
};

const formatStatus = (isSatisfied: boolean): string =>
  isSatisfied ? 'PASS' : 'EXCEEDED';

const printSectionHeader = (title: string): void => {
  process.stdout.write(`\n=== ${title} ===\n`);
};

const printBudgetRow = (budget: TBenchmarkBudget): void => {
  const label = budget.metric.padEnd(30, ' ');
  const observed = formatMilliseconds(budget.observedMs).padStart(12, ' ');
  const target = `<= ${formatMilliseconds(budget.budgetMs)}`.padStart(14, ' ');
  const status = formatStatus(budget.satisfied).padStart(10, ' ');
  process.stdout.write(`${label} | ${observed} | ${target} | ${status}\n`);
};

const printScaleResult = (result: TBenchmarkResult): void => {
  printSectionHeader(
    `Scale: ${result.logicalNodeCount.toString()} Logical Nodes`
  );
  process.stdout.write(
    `Cold model construction:      ${formatMilliseconds(result.coldMs)}\n`
  );
  process.stdout.write(
    `Warm persistent cache:        ${formatMilliseconds(result.warmPersistentCacheMs)}\n`
  );
  process.stdout.write(
    `Warm in-session (memo hit):   ${formatMilliseconds(result.warmInSessionMs)}\n`
  );
  process.stdout.write(
    `Records cache file size:      ${formatBytes(result.recordsCacheSizeBytes)}\n`
  );
  process.stdout.write(
    `Estimated per-file overhead:  ${formatMilliseconds(result.overheadPerFileMs)}\n`
  );

  process.stdout.write('\nBudget Verification (PLAN.md §10 targets):\n');
  process.stdout.write(
    `${'Metric'.padEnd(30, ' ')} | ${'Observed'.padStart(12, ' ')} | ${'Target Budget'.padStart(14, ' ')} | ${'Status'.padStart(10, ' ')}\n`
  );
  process.stdout.write(`${'-'.repeat(74)}\n`);
  for (const budget of result.budgets) {
    printBudgetRow(budget);
  }
};

const printSummaryTable = (suite: TBenchmarkSuiteResult): void => {
  printSectionHeader('Benchmark Summary');
  process.stdout.write(
    `${'Scale'.padEnd(10, ' ')} | ${'Cold Model'.padStart(14, ' ')} | ${'Warm Cache'.padStart(14, ' ')} | ${'Warm Session'.padStart(14, ' ')} | ${'Cache Size'.padStart(12, ' ')}\n`
  );
  process.stdout.write(`${'-'.repeat(74)}\n`);
  for (const result of suite.results) {
    const scale = `${result.logicalNodeCount.toString()} nodes`.padEnd(10, ' ');
    const cold = formatMilliseconds(result.coldMs).padStart(14, ' ');
    const warmCache = formatMilliseconds(result.warmPersistentCacheMs).padStart(
      14,
      ' '
    );
    const warmSession = formatMilliseconds(result.warmInSessionMs).padStart(
      14,
      ' '
    );
    const cacheSize = formatBytes(result.recordsCacheSizeBytes).padStart(
      12,
      ' '
    );
    process.stdout.write(
      `${scale} | ${cold} | ${warmCache} | ${warmSession} | ${cacheSize}\n`
    );
  }
  process.stdout.write(`\nTimestamp: ${suite.timestamp}\n`);
};

export const executeBenchmarkSuite =
  async (): Promise<TBenchmarkSuiteResult> => {
    process.stdout.write('Starting FAF Architectural Benchmark Suite...\n');

    const result1k = await runBenchmark(SCALE_1K);
    printScaleResult(result1k);

    const result10k = await runBenchmark(SCALE_10K);
    printScaleResult(result10k);

    const suite: TBenchmarkSuiteResult = {
      results: [result1k, result10k],
      timestamp: new Date().toISOString(),
    };

    printSummaryTable(suite);
    return suite;
  };

await executeBenchmarkSuite();
