import path from 'node:path';
import { z } from 'zod';

import { extractSnippet, formatLocation } from './mutation-formatter.js';
import {
  emptyCounts,
  STATUS_KEYS,
  type TParsedFileMutants,
  type TParsedMutantItem,
  type TPlannedMutant,
  type TTimeoutCategory,
  type TTimeoutDetail,
  type TUnkilledDetail,
} from './mutation-types.js';

type TPos = { readonly column: number; readonly line: number };

const posSchema = z.object({
  column: z.number().int().nonnegative(),
  line: z.number().int().nonnegative(),
});
const locSchema = z.object({ end: posSchema, start: posSchema });

const reportMutantSchema = z.object({
  id: z.string().min(1),
  location: locSchema,
  mutatorName: z.string().min(1),
  replacement: z.string(),
  status: z.enum(STATUS_KEYS),
  statusReason: z.string().optional(),
});

const fileReportSchema = z.object({
  language: z.string().min(1),
  mutants: z.array(reportMutantSchema),
  source: z.string(),
});

const reportSchema = z.object({
  files: z.record(z.string(), fileReportSchema),
  schemaVersion: z.string().regex(/^1(\.\d+)*$/),
});

const isOrdered = (a: TPos, b: TPos): boolean =>
  a.line < b.line || (a.line === b.line && a.column <= b.column);

const validateLocationBounds = (
  loc: { readonly end: TPos; readonly start: TPos },
  source: string
): { formatted: string; isValid: boolean; snippet?: string } => {
  if (!isOrdered(loc.start, loc.end)) return { formatted: '', isValid: false };
  const lines = source.split('\n');
  const startLine = lines[loc.start.line - 1];
  const endLine = lines[loc.end.line - 1];
  if (
    startLine === undefined ||
    endLine === undefined ||
    loc.start.column > startLine.length + 1 ||
    loc.end.column > endLine.length + 1
  ) {
    return { formatted: '', isValid: false };
  }
  return {
    formatted: formatLocation(loc.start, loc.end),
    isValid: true,
    snippet: extractSnippet(source, loc.start, loc.end),
  };
};

export const categorizeTimeout = (reason: string): TTimeoutCategory => {
  if (reason.includes('Hit limit')) {
    return 'hit-limit';
  }
  if (reason.includes('timed out') || reason.includes('Timeout')) {
    return 'runner-declared';
  }
  return 'unattributed';
};

const checkMutantValidity = (
  item: z.infer<typeof reportMutantSchema>,
  loc: { readonly isValid: boolean },
  key: string,
  seenIds: ReadonlySet<string>,
  seenIdentities: ReadonlySet<string>
): null | string => {
  if (seenIds.has(item.id)) {
    return `duplicate mutant id "${item.id}"`;
  }
  if (!loc.isValid) {
    return `mutant ${item.id} has invalid location`;
  }
  if (seenIdentities.has(key)) {
    return `duplicate mutant identity "${item.id}"`;
  }
  return null;
};

const appendMutantDetail = (
  item: z.infer<typeof reportMutantSchema>,
  loc: { readonly formatted: string; readonly snippet?: string },
  reason: string,
  unkilled: TUnkilledDetail[],
  timeouts: TTimeoutDetail[]
): void => {
  if (item.status === 'Survived' || item.status === 'NoCoverage') {
    unkilled.push({
      id: item.id,
      location: loc.formatted,
      mutator: item.mutatorName,
      originalSnippet: loc.snippet,
      reason,
      replacement: item.replacement,
      status: item.status,
    });
  } else if (item.status === 'Timeout') {
    timeouts.push({
      category: categorizeTimeout(reason),
      id: item.id,
      location: loc.formatted,
      reason,
    });
  } else {
    return;
  }
};

const populateParsedMutants = (
  file: string,
  mutants: readonly z.infer<typeof reportMutantSchema>[],
  source: string,
  errors: string[]
): TParsedFileMutants => {
  const counts = emptyCounts();
  const unkilled: TUnkilledDetail[] = [];
  const timeouts: TTimeoutDetail[] = [];
  const mutantIds: string[] = [];
  const allMutants = new Map<string, TParsedMutantItem>();
  const seenIds = new Set<string>();
  const seenIdentities = new Set<string>();
  let isValid = true;

  for (const item of mutants) {
    const loc = validateLocationBounds(item.location, source);
    const key = `${item.mutatorName}@${loc.formatted}->${item.replacement}`;
    const issue = checkMutantValidity(item, loc, key, seenIds, seenIdentities);
    if (issue === null) {
      seenIds.add(item.id);
      seenIdentities.add(key);
      mutantIds.push(item.id);
      counts[item.status] += 1;
      const reason = item.statusReason ?? '';
      allMutants.set(item.id, {
        id: item.id,
        location: loc.formatted,
        mutatorName: item.mutatorName,
        replacement: item.replacement,
        status: item.status,
      });
      appendMutantDetail(item, loc, reason, unkilled, timeouts);
    } else {
      errors.push(`File ${file}: ${issue}`);
      isValid = false;
    }
  }

  return {
    allMutants,
    counts,
    isValid,
    mutantIds,
    mutantsCount: mutants.length,
    source,
    timeouts,
    unkilled,
  };
};

export const parseFileReport = (
  file: string,
  rawFile: unknown,
  errors: string[]
): null | TParsedFileMutants => {
  const parsed = fileReportSchema.safeParse(rawFile);
  if (!parsed.success) {
    errors.push(`File ${file} is not a valid file report`);
    return null;
  }
  return populateParsedMutants(
    file,
    parsed.data.mutants,
    parsed.data.source,
    errors
  );
};

export const parseMutationPayload = (
  input: unknown
): { error?: string; report?: z.infer<typeof reportSchema> } => {
  let parsedJson = input;
  if (typeof input === 'string') {
    try {
      parsedJson = JSON.parse(input);
    } catch (error) {
      return {
        error: `Failed to parse mutation report JSON: ${error instanceof Error ? error.message : 'Invalid JSON'}`,
      };
    }
  }
  const parsed = reportSchema.safeParse(parsedJson);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ');
    return { error: `Mutation report validation failed: ${issues}` };
  }
  return { report: parsed.data };
};

const planMutantSchema = z.object({
  fileName: z.string().min(1),
  id: z.string().min(1),
  location: locSchema,
  mutatorName: z.string().min(1),
  replacement: z.string(),
});

const planPayloadSchema = z.object({
  mutantPlans: z.array(z.object({ mutant: planMutantSchema })),
});

const toSchemaPosition = (position: TPos): TPos => ({
  column: position.column + 1,
  line: position.line + 1,
});

export const parsePlanPayload = (
  rawJson: string,
  root: string
): { error?: string; plan?: Map<string, TPlannedMutant[]> } => {
  let parsedRaw: unknown;
  try {
    parsedRaw = JSON.parse(rawJson);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON';
    return { error: `Corrupted plan event JSON: ${message}` };
  }
  const result = planPayloadSchema.safeParse(parsedRaw);
  if (!result.success) {
    return {
      error: `Invalid plan payload schema: ${result.error.issues.map((issue) => issue.message).join(', ')}`,
    };
  }
  const map = new Map<string, TPlannedMutant[]>();
  const seenPerFile = new Map<string, Set<string>>();
  for (const item of result.data.mutantPlans) {
    const m = item.mutant;
    if (!isOrdered(m.location.start, m.location.end)) {
      return {
        error: `Plan mutant ${m.id} in ${m.fileName} has unordered location coordinates`,
      };
    }
    const relative = path.relative(root, m.fileName).replaceAll('\\', '/');
    let seenIds = seenPerFile.get(relative);
    if (seenIds === undefined) {
      seenIds = new Set<string>();
      seenPerFile.set(relative, seenIds);
    }
    if (seenIds.has(m.id)) {
      return {
        error: `Plan mutant "${m.id}" in "${m.fileName}" is duplicated in execution plan`,
      };
    }
    seenIds.add(m.id);
    const existing = map.get(relative) ?? [];
    existing.push({
      id: m.id,
      location: {
        end: toSchemaPosition(m.location.end),
        start: toSchemaPosition(m.location.start),
      },
      mutatorName: m.mutatorName,
      replacement: m.replacement,
    });
    map.set(relative, existing);
  }
  return { plan: map };
};
