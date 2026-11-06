import type { TDependencyOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TTaxonomyModel } from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type {
  TDependencyGraph,
  TEdgeMetadata,
} from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TVerificationModel } from '../../../../_verify-project@shared/_types/_systems/verification-model.type.js';
import type { TViolationPath } from './collect-branch-outcomes.type.js';

import { createOutcome } from '../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { compareOrdinal } from '../../../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { describeEdgeGeometry } from '../../../../_verify-project@shared/_utils/edge-geometry/index.js';

export const collectBranchOutcomes = (() => {
  const FRACTAL_BRANCH = 'fractal-branch';

  type TCandidateSource = {
    readonly depth: number;
    readonly parentId: null | number;
    readonly path: string;
    readonly vertex: number;
  };

  type TQueueItem = {
    readonly chain: readonly string[];
    readonly current: number;
    readonly firstEdge: TEdgeMetadata;
  };

  type TBfsEnvironment = {
    readonly graph: TDependencyGraph;
    readonly inventory: TInventory;
    readonly memo: Map<number, readonly TViolationPath[]>;
    readonly taxonomy: TTaxonomyModel;
  };

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

  const getCandidateSource = (
    vertex: number,
    graph: TDependencyGraph,
    inventory: TInventory,
    taxonomy: TTaxonomyModel
  ): TCandidateSource | undefined => {
    const path = graph.vertexToPath[vertex] ?? '';
    const itemId = inventory.pathToId.get(path);
    if (itemId === undefined) {
      return undefined;
    }
    const item = getFileLogicalNode(itemId, inventory, taxonomy);
    if (
      item === undefined ||
      !hasAncestorBranch(item.parentId, inventory, taxonomy)
    ) {
      return undefined;
    }
    return {
      depth: item.depth,
      parentId: item.parentId,
      path,
      vertex,
    };
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

  const hasBranchUnderLca = (
    startParentId: null | number,
    lcaId: number,
    inventory: TInventory,
    taxonomy: TTaxonomyModel
  ): boolean => {
    let currentId = startParentId;
    while (currentId !== null && currentId !== lcaId) {
      const parentItem = inventory.items[currentId];
      if (
        parentItem !== undefined &&
        taxonomy.byItemId.get(parentItem.id)?.domainKind === FRACTAL_BRANCH
      ) {
        return true;
      }
      currentId = parentItem === undefined ? null : parentItem.parentId;
    }
    return false;
  };

  const isViolation = (
    sourcePath: string,
    sourceParentId: null | number,
    destinationPath: string,
    inventory: TInventory,
    taxonomy: TTaxonomyModel
  ): boolean => {
    if (
      sourcePath === destinationPath ||
      !isEligibleDestination(destinationPath, inventory, taxonomy)
    ) {
      return false;
    }
    const geometry = describeEdgeGeometry(
      sourcePath,
      destinationPath,
      inventory,
      taxonomy
    );
    if (!geometry.sameTree) {
      return false;
    }
    const hasBranch = hasBranchUnderLca(
      sourceParentId,
      geometry.lowestCommonAncestor.id,
      inventory,
      taxonomy
    );
    if (!hasBranch) {
      return false;
    }
    const destinationStepId = geometry.firstStepDestination?.id;
    return (
      destinationStepId === undefined ||
      taxonomy.byItemId.get(destinationStepId)?.domainKind !== FRACTAL_BRANCH
    );
  };

  const isBetterPath = (
    candidate: readonly string[],
    current: readonly string[]
  ): boolean =>
    candidate.length < current.length ||
    (candidate.length === current.length &&
      candidate.join('\0') < current.join('\0'));

  const hasCycle = (
    left: readonly string[],
    right: readonly string[]
  ): boolean => {
    const seen = new Set(left);
    return right.slice(1).some((element) => seen.has(element));
  };

  const sortOutgoingEdges = (
    vertex: number,
    graph: TDependencyGraph
  ): readonly number[] => {
    const start = graph.rowOffsets[vertex] ?? 0;
    const end = graph.rowOffsets[vertex + 1] ?? 0;
    const indices: number[] = [];
    for (let index = start; index < end; index += 1) {
      indices.push(index);
    }
    indices.sort((first, second) => {
      const edgeA = graph.edgeMetadata[first];
      const edgeB = graph.edgeMetadata[second];
      if (edgeA === undefined || edgeB === undefined) {
        return 0;
      }
      const toComparison = compareOrdinal(
        edgeA.destinationPath,
        edgeB.destinationPath
      );
      return toComparison === 0
        ? edgeA.importIndex - edgeB.importIndex
        : toComparison;
    });
    return indices;
  };

  const recordViolation = (
    next: number,
    chain: readonly string[],
    firstEdge: TEdgeMetadata,
    violations: Map<number, TViolationPath>
  ): void => {
    const existing = violations.get(next);
    if (existing === undefined || isBetterPath(chain, existing.chain)) {
      violations.set(next, {
        chain,
        firstEdge,
        targetVertex: next,
      });
    }
  };

  const incorporateMemoized = (
    source: TCandidateSource,
    pathToNext: readonly string[],
    initialEdge: TEdgeMetadata,
    memoized: readonly TViolationPath[],
    violations: Map<number, TViolationPath>,
    environment: TBfsEnvironment
  ): void => {
    for (const entry of memoized) {
      const destinationPath =
        environment.graph.vertexToPath[entry.targetVertex] ?? '';
      if (
        !isViolation(
          source.path,
          source.parentId,
          destinationPath,
          environment.inventory,
          environment.taxonomy
        ) ||
        hasCycle(pathToNext, entry.chain)
      ) {
        continue;
      }
      const candidateChain = [...pathToNext, ...entry.chain.slice(1)];
      recordViolation(
        entry.targetVertex,
        candidateChain,
        initialEdge,
        violations
      );
    }
  };

  const buildOutcome = (
    violation: TViolationPath,
    sourcePath: string
  ): TDependencyOutcome => {
    const targetPath = violation.chain.at(-1) ?? '';
    if (violation.chain.length === 2) {
      return createOutcome('dependency/fractal-branch-unidirectionality', {
        element: sourcePath,
        from: sourcePath,
        importIndex: violation.firstEdge.importIndex,
        position: violation.firstEdge.position,
        specifier: violation.firstEdge.specifier,
        to: targetPath,
      });
    }
    return createOutcome('dependency/fractal-branch-unidirectionality', {
      chain: violation.chain,
      element: sourcePath,
      from: sourcePath,
      importIndex: violation.firstEdge.importIndex,
      position: violation.firstEdge.position,
      specifier: violation.firstEdge.specifier,
      to: targetPath,
    });
  };

  const expandEdge = (
    edgeIndex: number,
    chainToCurrent: readonly string[],
    parentFirstEdge: TEdgeMetadata | undefined,
    queue: TQueueItem[],
    visited: Set<number>,
    violations: Map<number, TViolationPath>,
    source: TCandidateSource,
    environment: TBfsEnvironment
  ): void => {
    const next = environment.graph.columnTargets[edgeIndex];
    const edge = environment.graph.edgeMetadata[edgeIndex];
    if (next === undefined || edge === undefined) {
      return;
    }

    const initialEdge = parentFirstEdge ?? edge;
    const chainToNext =
      parentFirstEdge === undefined
        ? [source.path, edge.destinationPath]
        : [...chainToCurrent, edge.destinationPath];

    if (
      isViolation(
        source.path,
        source.parentId,
        edge.destinationPath,
        environment.inventory,
        environment.taxonomy
      )
    ) {
      recordViolation(next, chainToNext, initialEdge, violations);
      return;
    }

    const memoized = environment.memo.get(next);
    if (memoized !== undefined) {
      incorporateMemoized(
        source,
        chainToNext,
        initialEdge,
        memoized,
        violations,
        environment
      );
      return;
    }

    if (visited.has(next)) {
      return;
    }
    visited.add(next);
    queue.push({
      chain: chainToNext,
      current: next,
      firstEdge: initialEdge,
    });
  };

  const exploreBfs = (
    source: TCandidateSource,
    sortedEdges: readonly (readonly number[])[],
    environment: TBfsEnvironment
  ): readonly TViolationPath[] => {
    const queue: TQueueItem[] = [];
    const visited = new Set<number>([source.vertex]);
    const violations = new Map<number, TViolationPath>();
    const sourceOutgoing = sortedEdges[source.vertex] ?? [];

    for (const edgeIndex of sourceOutgoing) {
      expandEdge(
        edgeIndex,
        [],
        undefined,
        queue,
        visited,
        violations,
        source,
        environment
      );
    }

    let item = queue.shift();
    while (item !== undefined) {
      const outgoing = sortedEdges[item.current] ?? [];
      for (const edgeIndex of outgoing) {
        expandEdge(
          edgeIndex,
          item.chain,
          item.firstEdge,
          queue,
          visited,
          violations,
          source,
          environment
        );
      }
      item = queue.shift();
    }

    const recorded = [...violations].map(([, value]) => value);
    environment.memo.set(source.vertex, recorded);
    return recorded;
  };

  return function collectBranchOutcomes(
    model: TVerificationModel
  ): readonly TDependencyOutcome[] {
    const {
      basis: { inventory },
      graph,
      taxonomy,
    } = model;

    const sortedEdges = Array.from({ length: graph.vertexCount }, (_, vertex) =>
      sortOutgoingEdges(vertex, graph)
    );

    const candidateSources: TCandidateSource[] = [];
    for (let vertex = 0; vertex < graph.vertexCount; vertex += 1) {
      const source = getCandidateSource(vertex, graph, inventory, taxonomy);
      if (source !== undefined) {
        candidateSources.push(source);
      }
    }

    candidateSources.sort((first, second) =>
      first.depth === second.depth
        ? compareOrdinal(first.path, second.path)
        : second.depth - first.depth
    );

    const memo = new Map<number, readonly TViolationPath[]>();
    const environment: TBfsEnvironment = { graph, inventory, memo, taxonomy };
    const outcomes: TDependencyOutcome[] = [];

    for (const source of candidateSources) {
      const recorded = exploreBfs(source, sortedEdges, environment);
      for (const violation of recorded) {
        outcomes.push(buildOutcome(violation, source.path));
      }
    }

    return outcomes;
  };
})();
