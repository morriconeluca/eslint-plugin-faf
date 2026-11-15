import type { TConfigOutcome } from '../../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TReferenceContext,
  TScopeBinding,
} from '../../../../_validate-config-references@shared/_utils/reference-scope/index.js';

import { rejectPublicRootNode } from '../../_validate-frontier-references@shared/_utils/reject-public-root-node/index.js';

export function rejectPublicRootNodeList(
  nodes: readonly string[],
  basePath: string,
  scope: TScopeBinding,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  return nodes.flatMap((path, index) =>
    rejectPublicRootNode(path, `${basePath}[${index}]`, scope, context)
  );
}
