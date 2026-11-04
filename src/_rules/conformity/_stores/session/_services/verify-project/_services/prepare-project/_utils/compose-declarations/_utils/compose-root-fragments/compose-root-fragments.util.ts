import type { TFAFRootFragment } from '../../../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type {
  TEffectiveOrientedPair,
  TEffectiveRootFragment,
  TEffectiveRootNode,
} from '../../../../../../_verify-project@shared/_types/_primitives/declarations.type.js';

import { compareOrdinal } from '../../../../../../_verify-project@shared/_utils/compare-ordinal/index.js';

export const composeRootFragments = (
  rootFragments: readonly TFAFRootFragment[]
): readonly TEffectiveRootFragment[] => {
  return rootFragments.map((fragment) => {
    const rootNodes: TEffectiveRootNode[] = [];
    for (const [tierIndex, tier] of fragment.rootNodes.entries()) {
      for (const name of tier) {
        rootNodes.push({ name, rank: tierIndex });
      }
    }

    const edges = fragment.dependencyEdges ?? [];
    const flatTargets = edges.flatMap((edge) =>
      edge.from.flatMap((fromName) => {
        const fromPath = `${fragment.path}/${fromName}`;
        return edge.to.map((toPath) => ({ fromPath, toPath }));
      })
    );

    const seenPairs = new Set<string>();
    const dependencyPairs: TEffectiveOrientedPair[] = [];

    for (const target of flatTargets) {
      const key = `${target.fromPath}\0${target.toPath}`;
      if (seenPairs.has(key)) {
        continue;
      }
      seenPairs.add(key);
      dependencyPairs.push({
        from: target.fromPath,
        to: target.toPath,
      });
    }

    dependencyPairs.sort((left, right) => {
      const fromComparison = compareOrdinal(left.from, right.from);
      return fromComparison === 0
        ? compareOrdinal(left.to, right.to)
        : fromComparison;
    });

    return {
      dependencyPairs,
      path: fragment.path,
      rootNodes,
      subRootFragments: composeRootFragments(fragment.subRootFragments ?? []),
    };
  });
};
