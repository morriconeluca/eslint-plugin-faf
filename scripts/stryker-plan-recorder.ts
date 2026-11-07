import fs from 'node:fs';
import path from 'node:path';

type TLocation = {
  readonly end: TPos;
  readonly start: TPos;
};

type TMutantPlan = {
  readonly mutant: TPlannedMutant;
};

type TPlanEvent = {
  readonly mutantPlans: readonly TMutantPlan[];
};

type TPlannedMutant = {
  readonly fileName: string;
  readonly id: string;
  readonly location: TLocation;
  readonly mutatorName: string;
  readonly replacement: string;
};

type TPos = {
  readonly column: number;
  readonly line: number;
};

const EVENTS_DIRECTORY = 'reports/mutation/events';
const PLAN_EVENT_FILE = '00001-onMutationTestingPlanReady.json';

const writeCompactPlan = (event: TPlanEvent): void => {
  const compact = {
    mutantPlans: event.mutantPlans.map((entry) => ({
      mutant: {
        fileName: entry.mutant.fileName,
        id: entry.mutant.id,
        location: {
          end: {
            column: entry.mutant.location.end.column,
            line: entry.mutant.location.end.line,
          },
          start: {
            column: entry.mutant.location.start.column,
            line: entry.mutant.location.start.line,
          },
        },
        mutatorName: entry.mutant.mutatorName,
        replacement: entry.mutant.replacement,
      },
    })),
  };
  const outputDirectory = path.resolve(process.cwd(), EVENTS_DIRECTORY);
  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(outputDirectory, PLAN_EVENT_FILE),
    JSON.stringify(compact),
    'utf8'
  );
};

export const strykerPlugins = [
  {
    kind: 'Reporter',
    name: 'plan-recorder',
    value: {
      onMutationTestingPlanReady(event: TPlanEvent): void {
        writeCompactPlan(event);
      },
    },
  },
] as const;
