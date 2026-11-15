import type { TDependencyOutcome } from '../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TVerificationModel } from '../../../../_verify-project@shared/_types/verification-model.type.js';
import type {
  TCandidatePath,
  TPriorityQueue,
  TSearchContext,
  TSearchState,
  TTransition,
} from './find-re-entry-paths.type.js';

import { createOutcome } from '../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import { compareOrdinal } from '../../../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { compareSourceLocations } from '../../../../_verify-project@shared/_utils/compare-source-locations/index.js';

export function findReEntryPaths(
  model: TVerificationModel
): readonly TDependencyOutcome[] {
  const { inventory } = model.basis;
  const getTreeOrigin = (path: string): null | string => {
    const id = inventory.pathToId.get(path);
    const item = id === undefined ? undefined : inventory.items[id];
    return item?.treeOrigin ?? null;
  };

  const isLogicalTreeNode = (path: string): boolean => {
    const origin = getTreeOrigin(path);
    if (origin === null) {
      return false;
    }
    const classification = model.taxonomy.byPath.get(path);
    return classification?.nodeKind !== 'foreign-node';
  };

  const buildTransitions = (): ReadonlyMap<string, readonly TTransition[]> => {
    const map = new Map<string, TTransition[]>();
    const appendTransition = (
      source: string,
      transition: TTransition
    ): void => {
      const list = map.get(source);
      if (list === undefined) {
        map.set(source, [transition]);
        return;
      }
      list.push(transition);
    };

    for (const crossing of model.crossings) {
      if (
        isLogicalTreeNode(crossing.sourcePath) &&
        isLogicalTreeNode(crossing.destinationPath)
      ) {
        appendTransition(crossing.sourcePath, {
          chain: crossing.chain,
          destinationPath: crossing.destinationPath,
          hasExternal: true,
          importIndex: crossing.importIndex,
          position: crossing.position,
          specifier: crossing.specifier,
          weight: crossing.chain.length - 1,
        });
      }
    }

    for (const edge of model.graph.edgeMetadata) {
      if (
        isLogicalTreeNode(edge.sourcePath) &&
        isLogicalTreeNode(edge.destinationPath)
      ) {
        appendTransition(edge.sourcePath, {
          chain: [edge.sourcePath, edge.destinationPath],
          destinationPath: edge.destinationPath,
          hasExternal: false,
          importIndex: edge.importIndex,
          position: edge.position,
          specifier: edge.specifier,
          weight: 1,
        });
      }
    }

    return map;
  };

  const transitionsBySource = buildTransitions();

  const expandSearchState = (
    state: TSearchState,
    context: TSearchContext
  ): void => {
    const transitions = transitionsBySource.get(state.current) ?? [];
    for (const transition of transitions) {
      const { destinationPath } = transition;
      const isTargetInSameTree = context.isTargetTree(destinationPath);
      const hasCrossing = state.hasExternal || transition.hasExternal;
      const nextDistance = state.distance + transition.weight;
      const nextChain = [...state.chain, ...transition.chain.slice(1)];

      if (isTargetInSameTree) {
        if (hasCrossing) {
          context.recordCandidate(destinationPath, {
            chain: nextChain,
            destination: destinationPath,
            distance: nextDistance,
            importIndex: state.importIndex,
            position: state.position,
            specifier: state.specifier,
          });
        }
        continue;
      }

      context.queue.push({
        chain: nextChain,
        current: destinationPath,
        distance: nextDistance,
        hasExternal: hasCrossing,
        importIndex: state.importIndex,
        position: state.position,
        specifier: state.specifier,
      });
    }
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
        expandSearchState(state, context);
      }
      state = context.queue.pop();
    }
  };

  const exploreSourceNode = (
    sourcePath: string,
    baseContext: Omit<TSearchContext, 'queue' | 'recordCandidate'>
  ): readonly TCandidatePath[] => {
    const winningCandidates = new Map<string, TCandidatePath>();
    const states: TSearchState[] = [];

    const isBetterCandidate = (
      candidate: TCandidatePath,
      existing: TCandidatePath
    ): boolean => {
      if (candidate.distance < existing.distance) {
        return true;
      }
      if (candidate.distance > existing.distance) {
        return false;
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
      if (candidate.importIndex !== existing.importIndex) {
        return candidate.importIndex < existing.importIndex;
      }
      return compareOrdinal(candidate.specifier, existing.specifier) < 0;
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
      if (candidate.distance < incumbent.distance) {
        return true;
      }
      if (candidate.distance > incumbent.distance) {
        return false;
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

    const searchContext: TSearchContext = {
      ...baseContext,
      queue,
      recordCandidate,
    };

    const initialTransitions = transitionsBySource.get(sourcePath) ?? [];
    for (const transition of initialTransitions) {
      const { destinationPath } = transition;
      if (searchContext.isTargetTree(destinationPath)) {
        if (transition.hasExternal) {
          searchContext.recordCandidate(destinationPath, {
            chain: transition.chain,
            destination: destinationPath,
            distance: transition.weight,
            importIndex: transition.importIndex,
            position: transition.position,
            specifier: transition.specifier,
          });
        }
      } else {
        searchContext.queue.push({
          chain: transition.chain,
          current: destinationPath,
          distance: transition.weight,
          hasExternal: transition.hasExternal,
          importIndex: transition.importIndex,
          position: transition.position,
          specifier: transition.specifier,
        });
      }
    }

    drainSearchQueue(searchContext);

    const candidates: TCandidatePath[] = [];
    winningCandidates.forEach((candidate) => {
      candidates.push(candidate);
    });
    return candidates;
  };

  const outcomes: TDependencyOutcome[] = [];

  for (const tree of model.basis.declarations.trees) {
    const treeOrigin = tree.originPath;
    const isTargetTree = (path: string): boolean =>
      getTreeOrigin(path) === treeOrigin;

    const candidateSources: string[] = [];
    for (const [sourcePath, transitions] of transitionsBySource) {
      if (getTreeOrigin(sourcePath) !== treeOrigin) {
        continue;
      }
      const hasLeavingTransition = transitions.some(
        (transition) =>
          transition.hasExternal ||
          getTreeOrigin(transition.destinationPath) !== treeOrigin
      );
      if (hasLeavingTransition) {
        candidateSources.push(sourcePath);
      }
    }

    candidateSources.sort(compareOrdinal);

    for (const sourcePath of candidateSources) {
      const candidates = exploreSourceNode(sourcePath, {
        isTargetTree,
        transitionsBySource,
        treeOrigin,
      });

      for (const candidate of candidates) {
        outcomes.push(
          createOutcome('dependency/re-entry-prohibition', {
            chain: candidate.chain,
            from: sourcePath,
            importIndex: candidate.importIndex,
            position: candidate.position,
            specifier: candidate.specifier,
            to: candidate.destination,
          })
        );
      }
    }
  }

  return outcomes;
}
