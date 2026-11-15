import type { TDependencyOutcome } from '../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TEdgeMetadata,
  TTaxonomyModel,
} from '../../../../_verify-project@shared/_types/verification-model.type.js';

import { createOutcome } from '../../../../../../../../_src@shared/_utils/create-outcome/index.js';

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
