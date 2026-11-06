import { pathToFileURL } from 'node:url';

import type { TMutationRunMode } from './mutation-runner-types.js';

import { runMutationMeasure } from './mutation-runner.js';

export {
  isMutableSource,
  listAllMutableSources,
  selectMutationTargets,
} from './mutation-targets.js';

export const resolveDiffBase = (
  explicitArgument?: string,
  ciBase?: string
): string => {
  if (explicitArgument !== undefined && explicitArgument.length > 0) {
    return explicitArgument;
  }
  if (ciBase !== undefined && ciBase.length > 0) {
    return ciBase;
  }
  return 'main';
};

const parseMode = (value: string): null | TMutationRunMode => {
  switch (value) {
    case 'diff':
    case 'force':
    case 'incremental': {
      return value;
    }
    default: {
      return null;
    }
  }
};

export type TRunParameters = {
  readonly base?: string;
  readonly error?: string;
  readonly mode: TMutationRunMode;
};

type TParseState = {
  error?: string;
  explicitBase?: string;
  mode?: TMutationRunMode;
};

const handleModeFlag = (argument: string, state: TParseState): void => {
  if (state.mode !== undefined) {
    state.error ??= `Cannot specify multiple --mode flags: received "${argument}" after mode was already set to "${state.mode}"`;
    return;
  }
  const parsed = parseMode(argument.slice(7));
  if (parsed === null) {
    state.error ??= `Invalid --mode value: "${argument.slice(7)}"`;
  } else {
    state.mode = parsed;
  }
};

const handleArgument = (argument: string, state: TParseState): void => {
  if (argument.startsWith('--mode=')) {
    handleModeFlag(argument, state);
  } else if (argument.startsWith('--')) {
    state.error ??= `Unknown option: "${argument}". Options starting with "--" are not supported as git references.`;
  } else if (state.explicitBase === undefined) {
    state.explicitBase = argument;
  } else {
    state.error ??= `Unexpected extra positional argument: "${argument}". Only one base reference is supported.`;
  }
};

export const resolveRunParameters = (
  rawArguments: readonly string[],
  ciBase = process.env['FAF_DIFF_BASE']
): TRunParameters => {
  const state: TParseState = {};
  for (const argument of rawArguments) {
    handleArgument(argument, state);
  }

  const effectiveMode = state.mode ?? 'diff';
  if (effectiveMode !== 'diff' && state.explicitBase !== undefined) {
    state.error ??= `Positional base reference "${state.explicitBase}" is not supported in ${effectiveMode} mode.`;
  }

  if (state.error !== undefined) {
    return { error: state.error, mode: effectiveMode };
  }

  return effectiveMode === 'diff'
    ? { base: resolveDiffBase(state.explicitBase, ciBase), mode: 'diff' }
    : { mode: effectiveMode };
};

const main = (): void => {
  const parameters = resolveRunParameters(process.argv.slice(2));
  if (parameters.error !== undefined) {
    console.error(parameters.error);
    process.exit(1);
  }
  const result = runMutationMeasure(parameters);
  process.exit(result.exitCode);
};

const isDirectExecution = (): boolean => {
  const entry = process.argv[1];
  return entry !== undefined && import.meta.url === pathToFileURL(entry).href;
};

if (isDirectExecution()) {
  main();
}
