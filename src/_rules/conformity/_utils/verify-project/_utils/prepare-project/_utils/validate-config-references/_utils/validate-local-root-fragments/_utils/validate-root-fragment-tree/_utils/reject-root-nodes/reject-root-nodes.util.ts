import type { TFAFRootFragment } from '../../../../../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TReferenceContext } from '../../../../../../_validate-config-references@shared/_utils/reject-reference-scope/index.js';

import { createOutcome } from '../../../../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import { rejectReferenceScope } from '../../../../../../_validate-config-references@shared/_utils/reject-reference-scope/index.js';
import { isDirectChildDirectory } from '../../_validate-root-fragment-tree@shared/_utils/is-direct-child-directory/index.js';

export function rejectRootNodes(
  rootFragment: TFAFRootFragment,
  pathPrefix: string,
  localIndex: number,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  const rejectOneRootNode = (
    rootFragmentPath: string,
    name: string,
    propertyPath: string
  ): readonly TConfigOutcome[] => {
    const fullPath =
      rootFragmentPath === '.' ? name : `${rootFragmentPath}/${name}`;
    const fileOutcomes = rejectReferenceScope({
      context,
      expectedKind: 'file',
      label: 'Root node',
      path: fullPath,
      propertyPath,
      scope: { kind: 'local', localIndex },
    });
    if (isDirectChildDirectory(context.inventory, fullPath, rootFragmentPath)) {
      return fileOutcomes;
    }

    return [
      ...fileOutcomes,
      createOutcome.configuration('configuration/root-node-not-direct-child', {
        element: fullPath,
        propertyPath,
      }),
    ];
  };

  return rootFragment.rootNodes.flatMap((tier, tierIndex) =>
    tier.flatMap((name, nodeIndex) =>
      rejectOneRootNode(
        rootFragment.path,
        name,
        `${pathPrefix}.rootNodes[${tierIndex}][${nodeIndex}]`
      )
    )
  );
}
