import type { TDependencyOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TTaxonomyModel } from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEdgeMetadata } from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';

import { createOutcome } from '../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';

export function checkEdgeIsolation(
  edge: TEdgeMetadata,
  taxonomy: TTaxonomyModel
): TDependencyOutcome | undefined {
  const isSourceForeign =
    taxonomy.byPath.get(edge.sourcePath)?.nodeKind === 'foreign-node';
  const isDestinationForeign =
    taxonomy.byPath.get(edge.destinationPath)?.nodeKind === 'foreign-node';

  if (!isSourceForeign && !isDestinationForeign) {
    return undefined;
  }

  return createOutcome('dependency/foreign-node-isolation', {
    from: edge.sourcePath,
    importIndex: edge.importIndex,
    position: edge.position,
    specifier: edge.specifier,
    to: edge.destinationPath,
  });
}
