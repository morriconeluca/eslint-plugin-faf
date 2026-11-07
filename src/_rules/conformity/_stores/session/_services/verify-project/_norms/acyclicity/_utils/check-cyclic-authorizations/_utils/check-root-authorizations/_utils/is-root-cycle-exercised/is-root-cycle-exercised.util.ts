import type { TAcyclicityOutcome } from '../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';

export function isRootCycleExercised(
  fragmentNames: readonly string[],
  dependencyCycles: readonly TAcyclicityOutcome[],
  nodeToFragmentPath: ReadonlyMap<string, string>
): boolean {
  const fragmentSet = new Set(fragmentNames);
  for (const outcome of dependencyCycles) {
    const cycleNodes = outcome.cycle[0] ?? [];
    const cycleFragments = new Set<string>();
    for (const node of cycleNodes) {
      const fragment = nodeToFragmentPath.get(node);
      if (fragment !== undefined && fragmentSet.has(fragment)) {
        cycleFragments.add(fragment);
      }
    }
    if (cycleFragments.size >= 2) {
      return true;
    }
  }
  return false;
}
