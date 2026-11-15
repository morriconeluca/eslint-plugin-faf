import type {
  TCandidatePath,
  TFindReEntryPathsInput,
  TPriorityQueue,
  TReEntryMatch,
  TSearchContext,
  TSearchState,
} from './find-re-entry-paths.type.js';

import { compareOrdinal } from '../../../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { compareSourceLocations } from '../../../../_verify-project@shared/_utils/compare-source-locations/index.js';

export function findReEntryPaths(
  input: TFindReEntryPathsInput
): readonly TReEntryMatch[] {
  const { candidateSources, isTargetTree, transitionsBySource } = input;

  const applyStep = (
    step: TSearchState,
    queue: TPriorityQueue,
    recordCandidate: TSearchContext['recordCandidate']
  ): void => {
    if (isTargetTree(step.current)) {
      if (step.hasExternal) {
        recordCandidate(step.current, {
          chain: step.chain,
          destination: step.current,
          distance: step.distance,
          importIndex: step.importIndex,
          position: step.position,
          specifier: step.specifier,
        });
      }
      return;
    }
    queue.push(step);
  };

  const drainSearchQueue = (context: TSearchContext): void => {
    const bestExternalDistance = new Map<string, number>();
    const bestNonExternalDistance = new Map<string, number>();

    const isStateDominated = (state: TSearchState): boolean => {
      const bestMap = state.hasExternal
        ? bestExternalDistance
        : bestNonExternalDistance;
      const previousDistance = bestMap.get(state.current);
      if (
        previousDistance !== undefined &&
        previousDistance <= state.distance
      ) {
        return true;
      }
      bestMap.set(state.current, state.distance);
      return false;
    };

    let state = context.queue.pop();
    while (state !== undefined) {
      if (!isStateDominated(state)) {
        const transitions = transitionsBySource.get(state.current) ?? [];
        for (const transition of transitions) {
          applyStep(
            {
              chain: [...state.chain, ...transition.chain.slice(1)],
              current: transition.destinationPath,
              distance: state.distance + transition.weight,
              hasExternal: state.hasExternal || transition.hasExternal,
              importIndex: state.importIndex,
              position: state.position,
              specifier: state.specifier,
            },
            context.queue,
            context.recordCandidate
          );
        }
      }
      state = context.queue.pop();
    }
  };

  const exploreSourceNode = (sourcePath: string): readonly TCandidatePath[] => {
    const winningCandidates = new Map<string, TCandidatePath>();
    const states: TSearchState[] = [];

    const isBetterCandidate = (
      candidate: TCandidatePath,
      existing: TCandidatePath
    ): boolean => {
      if (candidate.distance !== existing.distance) {
        return candidate.distance < existing.distance;
      }
      const minLength = Math.min(candidate.chain.length, existing.chain.length);
      for (let index = 0; index < minLength; index += 1) {
        const comparison = compareOrdinal(
          candidate.chain[index] ?? '',
          existing.chain[index] ?? ''
        );
        if (comparison !== 0) {
          return comparison < 0;
        }
      }
      const positionComparison = compareSourceLocations(
        candidate.position,
        existing.position
      );
      if (positionComparison !== 0) {
        return positionComparison < 0;
      }
      return candidate.importIndex === existing.importIndex
        ? compareOrdinal(candidate.specifier, existing.specifier) < 0
        : candidate.importIndex < existing.importIndex;
    };

    const recordCandidate = (
      destinationPath: string,
      candidate: TCandidatePath
    ): void => {
      const existing = winningCandidates.get(destinationPath);
      if (existing === undefined || isBetterCandidate(candidate, existing)) {
        winningCandidates.set(destinationPath, candidate);
      }
    };

    const isBetterState = (
      candidate: TSearchState,
      incumbent: TSearchState
    ): boolean => {
      if (candidate.distance !== incumbent.distance) {
        return candidate.distance < incumbent.distance;
      }
      const minLength = Math.min(
        candidate.chain.length,
        incumbent.chain.length
      );
      for (let index = 0; index < minLength; index += 1) {
        const comparison = compareOrdinal(
          candidate.chain[index] ?? '',
          incumbent.chain[index] ?? ''
        );
        if (comparison !== 0) {
          return comparison < 0;
        }
      }
      return false;
    };

    const queue: TPriorityQueue = {
      pop: (): TSearchState | undefined => {
        let bestIndex = 0;
        for (let index = 1; index < states.length; index += 1) {
          const current = states[index];
          const best = states[bestIndex];
          if (
            current !== undefined &&
            best !== undefined &&
            isBetterState(current, best)
          ) {
            bestIndex = index;
          }
        }
        const [selected] = states.splice(bestIndex, 1);
        return selected;
      },
      push: (state: TSearchState): void => {
        states.push(state);
      },
    };

    const initialTransitions = transitionsBySource.get(sourcePath) ?? [];
    for (const transition of initialTransitions) {
      applyStep(
        {
          chain: transition.chain,
          current: transition.destinationPath,
          distance: transition.weight,
          hasExternal: transition.hasExternal,
          importIndex: transition.importIndex,
          position: transition.position,
          specifier: transition.specifier,
        },
        queue,
        recordCandidate
      );
    }

    drainSearchQueue({
      isTargetTree,
      queue,
      recordCandidate,
      transitionsBySource,
    });

    const candidates: TCandidatePath[] = [];
    winningCandidates.forEach((candidate) => {
      candidates.push(candidate);
    });
    return candidates;
  };

  const matches: TReEntryMatch[] = [];
  for (const sourcePath of candidateSources) {
    for (const candidate of exploreSourceNode(sourcePath)) {
      matches.push({ candidate, sourcePath });
    }
  }
  return matches;
}
