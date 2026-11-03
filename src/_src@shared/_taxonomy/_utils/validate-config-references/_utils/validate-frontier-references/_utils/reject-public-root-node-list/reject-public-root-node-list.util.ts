import type { TConfigOutcome } from '../../../../../../../_domain/_types/outcome.type.js';
import type {
  TReferenceContext,
  TScopeBinding,
} from '../../../../_validate-config-references@shared/_types/reference-context.type.js';

import { rejectPublicRootNode } from '../../../../_validate-config-references@shared/_utils/reject-public-root-node/index.js';

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
