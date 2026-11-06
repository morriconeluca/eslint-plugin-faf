import type { TSymbolOutcome } from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TModuleRecord } from '../../../../../../../../_session@shared/_types/module-record.type.js';
import type { TItemClassification } from '../../../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type {
  TDependencyGraph,
  TEdgeMetadata,
} from '../../../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';

import { createOutcome } from '../../../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { isMasterReExported } from './_utils/is-master-re-exported/index.js';

export function checkMasterExport(
  accessClassification: TItemClassification,
  accessRecord: TModuleRecord,
  masterClassification: TItemClassification | undefined,
  masterRecord: TModuleRecord | undefined,
  graph: TDependencyGraph
): TSymbolOutcome | undefined {
  if (
    masterClassification === undefined ||
    masterRecord?.language !== 'script'
  ) {
    return undefined;
  }

  const edgeIndices =
    graph.edgesBySourcePath.get(accessClassification.path) ?? [];
  const accessEdges = edgeIndices
    .map((index) => graph.edgeMetadata[index])
    .filter((edge): edge is TEdgeMetadata => edge !== undefined);

  const isReExported = isMasterReExported(
    accessRecord.exports,
    masterClassification.path,
    masterRecord,
    accessEdges
  );

  return isReExported
    ? undefined
    : createOutcome('symbol/access-node-master-export', {
        element: accessClassification.path,
      });
}
