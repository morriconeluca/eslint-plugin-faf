import type { TFAFRootFragment } from '../../../../../../../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TReferenceContext } from '../../../../../../../../_validate-config-references@shared/_types/reference-context.type.js';

import { rejectOneRootNode } from './_utils/reject-one-root-node/index.js';

export function rejectRootNodes(
  fragment: TFAFRootFragment,
  pathPrefix: string,
  localIndex: number,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  return fragment.rootNodes.flatMap((tier, tierIndex) =>
    tier.flatMap((name, nodeIndex) =>
      rejectOneRootNode(
        fragment.path,
        name,
        `${pathPrefix}.rootNodes[${tierIndex}][${nodeIndex}]`,
        localIndex,
        context
      )
    )
  );
}
