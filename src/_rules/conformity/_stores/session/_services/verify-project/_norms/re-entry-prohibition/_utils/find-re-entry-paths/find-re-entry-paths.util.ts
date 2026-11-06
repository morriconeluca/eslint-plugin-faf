import type { TDependencyOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TVerificationModel } from '../../../../_verify-project@shared/_types/_systems/verification-model.type.js';
import type {
  TCandidatePath,
  TPriorityQueue,
  TSearchContext,
  TSearchState,
  TTransition,
} from './find-re-entry-paths.type.js';

import { createOutcome } from '../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { compareOrdinal } from '../../../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { compareSourceLocations } from '../../../../_verify-project@shared/_utils/compare-source-locations/index.js';

export const findReEntryPaths = (() => {
  const compareCandidates = (
    left: TCandidatePath,
    right: TCandidatePath
  ): number => {
    if (left.distance !== right.distance) {
      return left.distance - right.distance;
    }
    const minLength = Math.min(left.chain.length, right.chain.length);
    for (let index = 0; index < minLength; index += 1) {
      const comparison = compareOrdinal(
        left.chain[index] ?? '',
        right.chain[index] ?? ''
      );
      if (comparison !== 0) {
        return comparison;
      }
    }
    const positionComparison = compareSourceLocations(
      left.position,
      right.position
    );
    if (positionComparison !== 0) {
      return positionComparison;
    }
    if (left.importIndex !== right.importIndex) {
      return left.importIndex - right.importIndex;
    }
    return compareOrdinal(left.specifier, right.specifier);
  };

  const compareSearchStates = (
    left: TSearchState,
    right: TSearchState
  ): number => {
    if (left.distance !== right.distance) {
      return left.distance - right.distance;
    }
    const minLength = Math.min(left.chain.length, right.chain.length);
    for (let index = 0; index < minLength; index += 1) {
      const comparison = compareOrdinal(
        left.chain[index] ?? '',
        right.chain[index] ?? ''
      );
      if (comparison !== 0) {
        return comparison;
      }
    }
    return 0;
  };

  const createPriorityQueue = (): TPriorityQueue => {
    const states: TSearchState[] = [];

    const push = (state: TSearchState): void => {
      states.push(state);
    };

    const pop = (): TSearchState | undefined => {
      if (states.length === 0) {
        return undefined;
      }
      let bestIndex = 0;
      for (let index = 1; index < states.length; index += 1) {
        const current = states[index];
        const best = states[bestIndex];
        if (
          current !== undefined &&
          best !== undefined &&
          compareSearchStates(current, best) < 0
        ) {
          bestIndex = index;
        }
      }
      const [selected] = states.splice(bestIndex, 1);
      return selected;
    };

    return { pop, push };
  };

  const buildTransitions = (
    model: TVerificationModel,
    isLogical: (path: string) => boolean
  ): ReadonlyMap<string, readonly TTransition[]> => {
    const transitionsBySource = new Map<string, TTransition[]>();

    const appendTransition = (
      source: string,
      transition: TTransition
    ): void => {
      const list = transitionsBySource.get(source);
      if (list === undefined) {
        transitionsBySource.set(source, [transition]);
        return;
      }
      list.push(transition);
    };

    for (const crossing of model.crossings) {
      if (
        isLogical(crossing.sourcePath) &&
        isLogical(crossing.destinationPath)
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
      if (isLogical(edge.sourcePath) && isLogical(edge.destinationPath)) {
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

    return transitionsBySource;
  };

  const isStateDominated = (
    state: TSearchState,
    bestExternalDistance: Map<string, number>,
    bestNonExternalDistance: Map<string, number>
  ): boolean => {
    const bestMap = state.hasExternal
      ? bestExternalDistance
      : bestNonExternalDistance;
    const previousDistance = bestMap.get(state.current);
    if (previousDistance !== undefined && previousDistance <= state.distance) {
      return true;
    }
    bestMap.set(state.current, state.distance);
    return false;
  };

  const processTransition = (
    state: TSearchState,
    transition: TTransition,
    context: TSearchContext
  ): void => {
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
      return;
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
  };

  const expandSearchState = (
    state: TSearchState,
    context: TSearchContext
  ): void => {
    const transitions = context.transitionsBySource.get(state.current) ?? [];
    for (const transition of transitions) {
      processTransition(state, transition, context);
    }
  };

  const seedInitialTransitions = (
    sourcePath: string,
    context: TSearchContext
  ): void => {
    const transitions = context.transitionsBySource.get(sourcePath) ?? [];
    for (const transition of transitions) {
      const { destinationPath } = transition;
      if (context.isTargetTree(destinationPath)) {
        if (transition.hasExternal) {
          context.recordCandidate(destinationPath, {
            chain: transition.chain,
            destination: destinationPath,
            distance: transition.weight,
            importIndex: transition.importIndex,
            position: transition.position,
            specifier: transition.specifier,
          });
        }
      } else {
        context.queue.push({
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
  };

  const drainSearchQueue = (context: TSearchContext): void => {
    const bestExternalDistance = new Map<string, number>();
    const bestNonExternalDistance = new Map<string, number>();

    let state = context.queue.pop();
    while (state !== undefined) {
      if (
        !isStateDominated(state, bestExternalDistance, bestNonExternalDistance)
      ) {
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

    const recordCandidate = (
      destinationPath: string,
      candidate: TCandidatePath
    ): void => {
      const existing = winningCandidates.get(destinationPath);
      if (
        existing === undefined ||
        compareCandidates(candidate, existing) < 0
      ) {
        winningCandidates.set(destinationPath, candidate);
      }
    };

    const queue = createPriorityQueue();
    const searchContext: TSearchContext = {
      ...baseContext,
      queue,
      recordCandidate,
    };

    seedInitialTransitions(sourcePath, searchContext);
    drainSearchQueue(searchContext);

    const candidates: TCandidatePath[] = [];
    winningCandidates.forEach((candidate) => {
      candidates.push(candidate);
    });
    return candidates;
  };

  return function findReEntryPaths(
    model: TVerificationModel
  ): readonly TDependencyOutcome[] {
    const { inventory } = model.basis;
    const getTreeOrigin = (path: string): null | string => {
      const id = inventory.pathToId.get(path);
      if (id === undefined) {
        return null;
      }
      const item = inventory.items[id];
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

    const transitionsBySource = buildTransitions(model, isLogicalTreeNode);
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
  };
})();
