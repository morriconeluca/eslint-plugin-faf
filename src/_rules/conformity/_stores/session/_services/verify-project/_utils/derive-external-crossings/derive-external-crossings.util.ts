import type { TDependencyGraph } from '../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type { TExternalCrossing } from '../../_verify-project@shared/_types/_compounds/external-crossing.type.js';

import { compareOrdinal } from '../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { findDestinationCrossings } from './_utils/find-destination-crossings/index.js';
import { indexExternalSubgraph } from './_utils/index-external-subgraph/index.js';

export function deriveExternalCrossings(
  graph: TDependencyGraph
): readonly TExternalCrossing[] {
  const indexed = indexExternalSubgraph(graph);
  const crossings: TExternalCrossing[] = [];

  for (const destination of indexed.destinations) {
    const destinationCrossings = findDestinationCrossings(
      destination,
      indexed,
      graph
    );
    crossings.push(...destinationCrossings);
  }

  crossings.sort((left, right) => {
    const sourceComparison = compareOrdinal(left.sourcePath, right.sourcePath);
    return sourceComparison === 0
      ? compareOrdinal(left.destinationPath, right.destinationPath)
      : sourceComparison;
  });

  return crossings;
}
