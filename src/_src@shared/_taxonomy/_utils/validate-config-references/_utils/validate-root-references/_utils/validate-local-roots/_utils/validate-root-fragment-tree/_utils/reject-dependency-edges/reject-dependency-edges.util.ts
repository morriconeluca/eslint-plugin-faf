import type { TFAFRootFragment } from '../../../../../../../../../../../_domain/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../../../../../../../../_domain/_types/outcome.type.js';
import type { TReferenceContext } from '../../../../../../../../_validate-config-references@shared/_types/reference-context.type.js';

import { rejectDependencyFrom } from './_utils/reject-dependency-from/index.js';
import { rejectDependencyTo } from './_utils/reject-dependency-to/index.js';

export function rejectDependencyEdges(
  fragment: TFAFRootFragment,
  treeOrigin: string,
  pathPrefix: string,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  const edges = fragment.dependencyEdges ?? [];
  const currentNames = new Set(fragment.rootNodes.flat());
  return edges.flatMap((edge, edgeIndex) => {
    const edgePrefix = `${pathPrefix}.dependencyEdges[${edgeIndex}]`;
    return [
      ...rejectDependencyFrom(
        edge.from,
        currentNames,
        fragment.path,
        edgePrefix
      ),
      ...rejectDependencyTo(
        edge.to,
        fragment.path,
        treeOrigin,
        edgePrefix,
        context
      ),
    ];
  });
}
