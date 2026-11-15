import type {
  TEffectiveRootFragment,
  TEffectiveTree,
} from '../../../../../../../../_verify-project@shared/_types/verification-model.type.js';
import type { TRootAuthorizationGraph } from './build-root-authorization-graph.type.js';

import { compareOrdinal } from '../../../../../../../../_verify-project@shared/_utils/compare-ordinal/index.js';

export function buildRootAuthorizationGraph(
  trees: readonly TEffectiveTree[]
): TRootAuthorizationGraph {
  const allRootFragments: TEffectiveRootFragment[] = [];
  const queue = trees.flatMap((tree) => tree.rootFragments);
  let current = queue.shift();
  while (current !== undefined) {
    allRootFragments.push(current);
    for (const subFragment of current.subRootFragments) {
      queue.push(subFragment);
    }
    current = queue.shift();
  }

  const rawPaths = [
    ...new Set(allRootFragments.map((rootFragment) => rootFragment.path)),
  ];
  const sortedPaths = [...rawPaths];
  sortedPaths.sort(compareOrdinal);
  const fragmentCount = sortedPaths.length;

  const pathToIndex = new Map<string, number>();
  const adjacency: number[][] = [];
  const rowByPath = new Map<string, number[]>();
  for (const [index, fragmentPath] of sortedPaths.entries()) {
    pathToIndex.set(fragmentPath, index);
    const row: number[] = [];
    adjacency.push(row);
    rowByPath.set(fragmentPath, row);
  }

  const nodeToFragmentPath = new Map<string, string>();
  for (const rootFragment of allRootFragments) {
    for (const rootNode of rootFragment.rootNodes) {
      const fullPath = `${rootFragment.path}/${rootNode.name}`;
      nodeToFragmentPath.set(fullPath, rootFragment.path);
    }
  }

  const seenEdges = new Set<string>();
  const registerFragmentPairs = (
    rootFragment: TEffectiveRootFragment
  ): void => {
    const sourceIndex = pathToIndex.get(rootFragment.path);
    const sourceRow = rowByPath.get(rootFragment.path);
    if (sourceIndex === undefined || sourceRow === undefined) {
      return;
    }
    for (const pair of rootFragment.dependencyPairs) {
      const targetFragmentPath = nodeToFragmentPath.get(pair.to);
      const targetIndex =
        targetFragmentPath === undefined
          ? undefined
          : pathToIndex.get(targetFragmentPath);
      if (
        targetIndex === undefined ||
        sourceIndex === targetIndex ||
        seenEdges.has(`${sourceIndex}\0${targetIndex}`)
      ) {
        continue;
      }
      seenEdges.add(`${sourceIndex}\0${targetIndex}`);
      sourceRow.push(targetIndex);
    }
  };

  for (const rootFragment of allRootFragments) {
    registerFragmentPairs(rootFragment);
  }

  return {
    adjacency,
    allRootFragments,
    fragmentCount,
    fragmentPaths: sortedPaths,
    nodeToFragmentPath,
  };
}
