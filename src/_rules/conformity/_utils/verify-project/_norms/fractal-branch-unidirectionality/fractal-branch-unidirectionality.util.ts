import type {
  TDependencyOutcome,
  TSourceLocation,
} from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TDependencyGraph,
  TInventory,
  TInventoryItem,
  TTaxonomyModel,
} from '../../_verify-project@shared/_types/verification-model.type.js';
import type {
  TBranchViolationPath,
  TCandidateBranchSource,
} from './_utils/find-branch-violation-paths/index.js';

import { createOutcome } from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import { compareOrdinal } from '../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { compareSourceLocations } from '../../_verify-project@shared/_utils/compare-source-locations/index.js';
import { describeEdgeGeometry } from '../_norms@shared/_utils/describe-edge-geometry/index.js';

const FRACTAL_BRANCH = 'fractal-branch';

const getFileLogicalNode = (
  itemId: number,
  inventory: TInventory,
  taxonomy: TTaxonomyModel
): TInventoryItem | undefined => {
  const item = inventory.items[itemId];
  if (item === undefined || item.kind !== 'file') {
    return undefined;
  }
  const classification = taxonomy.byItemId.get(itemId);
  return classification === undefined ||
    classification.nodeKind === 'foreign-node' ||
    classification.nodeKind === 'access-node'
    ? undefined
    : item;
};

const hasAncestorBranch = (
  startParentId: null | number,
  inventory: TInventory,
  taxonomy: TTaxonomyModel
): boolean => {
  let currentId = startParentId;
  while (currentId !== null) {
    const parentItem = inventory.items[currentId];
    if (parentItem === undefined) {
      break;
    }
    if (taxonomy.byItemId.get(parentItem.id)?.domainKind === FRACTAL_BRANCH) {
      return true;
    }
    currentId = parentItem.parentId;
  }
  return false;
};

const isEligibleDestination = (
  destinationPath: string,
  inventory: TInventory,
  taxonomy: TTaxonomyModel
): boolean => {
  const destinationId = inventory.pathToId.get(destinationPath);
  if (destinationId === undefined) {
    return false;
  }
  const destinationItem = inventory.items[destinationId];
  if (destinationItem === undefined || destinationItem.kind !== 'file') {
    return false;
  }
  const destinationClassification = taxonomy.byItemId.get(destinationId);
  return (
    destinationClassification !== undefined &&
    destinationClassification.nodeKind !== 'foreign-node'
  );
};

export function buildBranchUnidirectionalityOutcome(
  violation: TBranchViolationPath
): TDependencyOutcome {
  const baseFacts = {
    element: violation.sourcePath,
    from: violation.sourcePath,
    importIndex: violation.firstEdge.importIndex,
    position: violation.firstEdge.position,
    specifier: violation.firstEdge.specifier,
    to: violation.chain.at(-1) ?? '',
  };
  return violation.chain.length === 2
    ? createOutcome.edge(
        'dependency/fractal-branch-unidirectionality',
        baseFacts
      )
    : createOutcome.path('dependency/fractal-branch-unidirectionality', {
        ...baseFacts,
        chain: violation.chain,
      });
}

export function collectBranchCandidateSources(
  graph: TDependencyGraph,
  inventory: TInventory,
  taxonomy: TTaxonomyModel
): readonly TCandidateBranchSource[] {
  const candidateSources: TCandidateBranchSource[] = [];
  for (let vertex = 0; vertex < graph.vertexCount; vertex += 1) {
    const path = graph.vertexToPath[vertex] ?? '';
    const itemId = inventory.pathToId.get(path);
    const item =
      itemId === undefined
        ? undefined
        : getFileLogicalNode(itemId, inventory, taxonomy);
    if (
      item !== undefined &&
      hasAncestorBranch(item.parentId, inventory, taxonomy)
    ) {
      candidateSources.push({
        depth: item.depth,
        path,
        vertex,
      });
    }
  }
  return candidateSources;
}

export function isFractalBranchUnidirectionalityViolation(
  sourcePath: string,
  destinationPath: string,
  inventory: TInventory,
  taxonomy: TTaxonomyModel
): boolean {
  if (!isEligibleDestination(destinationPath, inventory, taxonomy)) {
    return false;
  }
  const geometry = describeEdgeGeometry(sourcePath, destinationPath, inventory);
  return (
    geometry.firstStepSource !== null &&
    taxonomy.byItemId.get(geometry.firstStepSource.id)?.domainKind ===
      FRACTAL_BRANCH
  );
}

const compareChains = (
  leftChain: readonly string[] | undefined,
  rightChain: readonly string[] | undefined
): number => {
  if (leftChain === undefined && rightChain === undefined) {
    return 0;
  }
  if (leftChain === undefined) {
    return -1;
  }
  if (rightChain === undefined) {
    return 1;
  }
  if (leftChain.length !== rightChain.length) {
    return leftChain.length - rightChain.length;
  }
  for (const [index, element] of leftChain.entries()) {
    const segmentComparison = compareOrdinal(element, rightChain[index] ?? '');
    if (segmentComparison !== 0) {
      return segmentComparison;
    }
  }
  return 0;
};

export function compareBranchOutcomes(
  left: TDependencyOutcome,
  right: TDependencyOutcome
): number {
  const absentLocation: TSourceLocation = { column: 0, line: 0 };
  const fromComparison = compareOrdinal(left.from, right.from);
  if (fromComparison !== 0) {
    return fromComparison;
  }
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
  const toComparison = compareOrdinal(left.to, right.to);
  if (toComparison !== 0) {
    return toComparison;
  }

  const chainComparison = compareChains(left.chain, right.chain);
  return chainComparison === 0
    ? compareOrdinal(left.specifier ?? '', right.specifier ?? '')
    : chainComparison;
}
