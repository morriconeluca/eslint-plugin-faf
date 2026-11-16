import type {
  TDependencyOutcome,
  TSourceLocation,
} from '../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TInventory,
  TVerificationModel,
} from '../../_conformity@shared/_types/verification-model.type.js';
import type {
  TReEntryMatch,
  TTransition,
} from './_utils/find-re-entry-paths/index.js';

import { createOutcome } from '../../../../_src@shared/_utils/create-outcome/index.js';
import { compareOrdinal } from '../../_conformity@shared/_utils/compare-ordinal/index.js';
import { compareSourceLocations } from '../../_conformity@shared/_utils/compare-source-locations/index.js';

export function buildReEntryOutcome(match: TReEntryMatch): TDependencyOutcome {
  return createOutcome.path('dependency/re-entry-prohibition', {
    chain: match.candidate.chain,
    from: match.sourcePath,
    importIndex: match.candidate.importIndex,
    position: match.candidate.position,
    specifier: match.candidate.specifier,
    to: match.candidate.destination,
  });
}

export function buildReEntryTransitions(
  model: TVerificationModel
): ReadonlyMap<string, readonly TTransition[]> {
  const { inventory } = model.basis;
  const isLogicalTreeNode = (path: string): boolean => {
    const origin = getTreeOrigin(path, inventory);
    if (origin === null) {
      return false;
    }
    const classification = model.taxonomy.byPath.get(path);
    return classification?.nodeKind !== 'foreign-node';
  };

  const map = new Map<string, TTransition[]>();
  const appendTransition = (source: string, transition: TTransition): void => {
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
}

export function collectTreeCandidateSources(
  treeOrigin: string,
  transitionsBySource: ReadonlyMap<string, readonly TTransition[]>,
  inventory: TInventory
): readonly string[] {
  const candidateSources: string[] = [];
  for (const [sourcePath, transitions] of transitionsBySource) {
    if (getTreeOrigin(sourcePath, inventory) !== treeOrigin) {
      continue;
    }
    const hasLeavingTransition = transitions.some(
      (transition) =>
        transition.hasExternal ||
        getTreeOrigin(transition.destinationPath, inventory) !== treeOrigin
    );
    if (hasLeavingTransition) {
      candidateSources.push(sourcePath);
    }
  }
  candidateSources.sort(compareOrdinal);
  return candidateSources;
}

export function compareReEntryOutcomes(
  left: TDependencyOutcome,
  right: TDependencyOutcome
): number {
  const fromComparison = compareOrdinal(left.from, right.from);
  if (fromComparison !== 0) {
    return fromComparison;
  }
  const toComparison = compareOrdinal(left.to, right.to);
  if (toComparison !== 0) {
    return toComparison;
  }
  const absentLocation: TSourceLocation = { column: 0, line: 0 };
  const positionComparison = compareSourceLocations(
    left.position ?? absentLocation,
    right.position ?? absentLocation
  );
  if (positionComparison !== 0) {
    return positionComparison;
  }
  if (left.importIndex !== right.importIndex) {
    return left.importIndex - right.importIndex;
  }
  return compareOrdinal(left.specifier ?? '', right.specifier ?? '');
}

export function getTreeOrigin(
  path: string,
  inventory: TInventory
): null | string {
  const id = inventory.pathToId.get(path);
  const item = id === undefined ? undefined : inventory.items[id];
  return item?.treeOrigin ?? null;
}
