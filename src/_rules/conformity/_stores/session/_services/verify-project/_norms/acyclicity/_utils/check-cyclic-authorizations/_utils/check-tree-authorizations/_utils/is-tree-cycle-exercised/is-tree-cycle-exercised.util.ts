import type { TAcyclicityOutcome } from '../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';

export function isTreeCycleExercised(
  originNames: readonly string[],
  interTreeCycles: readonly TAcyclicityOutcome[],
  fileToTreeOrigin: ReadonlyMap<string, string>
): boolean {
  const originSet = new Set(originNames);

  function recordSegmentTrees(
    segment: readonly string[],
    cycleTrees: Set<string>
  ): void {
    const first = segment[0];
    const last = segment.at(-1);
    if (first !== undefined) {
      const src = fileToTreeOrigin.get(first);
      if (src !== undefined && originSet.has(src)) {
        cycleTrees.add(src);
      }
    }
    if (last === undefined) {
      return;
    }
    const destination = fileToTreeOrigin.get(last);
    if (destination !== undefined && originSet.has(destination)) {
      cycleTrees.add(destination);
    }
  }

  for (const outcome of interTreeCycles) {
    const cycleTrees = new Set<string>();
    for (const segment of outcome.cycle) {
      recordSegmentTrees(segment, cycleTrees);
    }
    if (cycleTrees.size >= 2) {
      return true;
    }
  }

  return false;
}
