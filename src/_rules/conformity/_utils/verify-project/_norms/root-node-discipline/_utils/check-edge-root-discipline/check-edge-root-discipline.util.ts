import type { TDependencyOutcome } from '../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TEdgeMetadata,
  TVerificationModel,
} from '../../../../_verify-project@shared/_types/verification-model.type.js';

import { createOutcome } from '../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import { isRootEdgeAuthorized } from './_utils/is-root-edge-authorized/index.js';
import { resolveRootEdge } from './_utils/resolve-root-edge/index.js';

export function checkEdgeRootDiscipline(
  edge: TEdgeMetadata,
  model: TVerificationModel
): TDependencyOutcome | undefined {
  const resolved = resolveRootEdge(edge, model);
  if (resolved === undefined) {
    return undefined;
  }

  const isAuthorized =
    resolved.isSourceRootNode &&
    isRootEdgeAuthorized(
      resolved.sourceItem,
      resolved.destinationItem,
      edge,
      model
    );

  if (isAuthorized) {
    return undefined;
  }

  return createOutcome('dependency/root-node-discipline', {
    from: edge.sourcePath,
    importIndex: edge.importIndex,
    position: edge.position,
    specifier: edge.specifier,
    to: edge.destinationPath,
  });
}
