import type { TEffectiveRootFragment } from '../../../../../../../../../../_verify-project@shared/_types/_primitives/declarations.type.js';

export function populateRootAuthorizationAdjacency(
  allRootFragments: readonly TEffectiveRootFragment[],
  pathToIndex: ReadonlyMap<string, number>,
  nodeToFragmentPath: ReadonlyMap<string, string>,
  adjacency: number[][],
  seenEdges: Set<string>
): void {
  for (const fragment of allRootFragments) {
    const u = pathToIndex.get(fragment.path);
    if (u === undefined) {
      continue;
    }
    for (const pair of fragment.dependencyPairs) {
      const targetFragmentPath = nodeToFragmentPath.get(pair.to);
      const v =
        targetFragmentPath === undefined
          ? undefined
          : pathToIndex.get(targetFragmentPath);
      if (v === undefined || u === v || seenEdges.has(`${u}\0${v}`)) {
        continue;
      }
      seenEdges.add(`${u}\0${v}`);
      adjacency[u]?.push(v);
    }
  }
}
