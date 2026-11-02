import fs from 'node:fs';
import path from 'node:path';

type TFileReport = {
  readonly mutants?: readonly TMutantResult[];
};

type TMutantCounts = {
  killed: number;
  noCoverage: number;
  survived: number;
  timeout: number;
};

type TMutantResult = {
  readonly status: string;
};

type TMutationReport = {
  readonly files?: Record<string, TFileReport>;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseMutant = (raw: unknown): null | TMutantResult =>
  isObject(raw) && typeof raw['status'] === 'string'
    ? { status: raw['status'] }
    : null;

const parseFileReport = (raw: unknown): TFileReport => {
  if (!isObject(raw)) {
    return {};
  }
  const rawMutants = Array.isArray(raw['mutants']) ? raw['mutants'] : [];
  const mutants: TMutantResult[] = [];
  for (const m of rawMutants) {
    const mutant = parseMutant(m);
    if (mutant !== null) {
      mutants.push(mutant);
    }
  }
  return { mutants };
};

const parseMutationReport = (raw: string): TMutationReport => {
  const parsed: unknown = JSON.parse(raw);
  if (!isObject(parsed)) {
    return {};
  }

  const rawFiles = isObject(parsed['files']) ? parsed['files'] : {};
  const files: Record<string, TFileReport> = {};

  for (const [key, value] of Object.entries(rawFiles)) {
    files[key] = parseFileReport(value);
  }

  return { files };
};

const tallyMutant = (mutant: TMutantResult, counts: TMutantCounts): void => {
  switch (mutant.status) {
    case 'Killed': {
      counts.killed += 1;
      break;
    }
    case 'NoCoverage': {
      counts.noCoverage += 1;
      break;
    }
    case 'Survived': {
      counts.survived += 1;
      break;
    }
    case 'Timeout': {
      counts.timeout += 1;
      break;
    }
    default: {
      break;
    }
  }
};

const reportPath = path.resolve(
  process.cwd(),
  'reports/mutation/mutation.json'
);

if (!fs.existsSync(reportPath)) {
  console.error(`Error: Mutation report not found at ${reportPath}`);
  process.exit(1);
}

const THRESHOLD = 85;

const fileContent = fs.readFileSync(reportPath, 'utf8');
const report = parseMutationReport(fileContent);
const files = report.files ?? {};
let hasViolations = false;

for (const [filePath, fileData] of Object.entries(files)) {
  const mutants = fileData.mutants ?? [];
  const counts: TMutantCounts = {
    killed: 0,
    noCoverage: 0,
    survived: 0,
    timeout: 0,
  };

  for (const mutant of mutants) {
    tallyMutant(mutant, counts);
  }

  const detected = counts.killed + counts.timeout;
  const undetected = counts.survived + counts.noCoverage;
  const totalRelevant = detected + undetected;

  const score = totalRelevant === 0 ? 100 : (detected / totalRelevant) * 100;

  if (score >= THRESHOLD) {
    continue;
  }

  console.error(
    `ERROR: File ${filePath} mutation score of ${score.toFixed(2)}% does not meet threshold of ${THRESHOLD}%`
  );
  hasViolations = true;
}

if (hasViolations) {
  process.exit(1);
}
