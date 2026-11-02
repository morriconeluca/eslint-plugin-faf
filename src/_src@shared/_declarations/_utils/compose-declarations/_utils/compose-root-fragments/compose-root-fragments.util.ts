import type { TFAFRootFragment } from '../../../../../_domain/_types/faf-config.type.js';
import type {
  TEffectiveOrientedPair,
  TEffectiveRootFragment,
  TEffectiveRootNode,
} from '../../../../_types/declarations.type.js';

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

      const newPair: TEffectiveOrientedPair = {
        from: target.fromPath,
        to: target.toPath,
      };
      const insertIndex = dependencyPairs.findIndex((p) => {
        const comparison = p.from.localeCompare(newPair.from);
        return (
          comparison > 0 ||
          (comparison === 0 && p.to.localeCompare(newPair.to) > 0)
        );
      });
      if (insertIndex === -1) {
        dependencyPairs.push(newPair);
      } else {
        dependencyPairs.splice(insertIndex, 0, newPair);
      }
    }

    return {
      dependencyPairs,
      path: fragment.path,
      rootNodes,
      subRootFragments: composeRootFragments(fragment.subRootFragments ?? []),
    };
  });
};
