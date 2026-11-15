import type { TFAFRootFragment } from '../../../../../../../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../../../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TReferenceContext } from '../../../../../../../../_validate-config-references@shared/_utils/reference-scope/index.js';

import { createOutcome } from '../../../../../../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import { referenceScope } from '../../../../../../../../_validate-config-references@shared/_utils/reference-scope/index.js';
import { isDirectChildDirectory } from '../../_validate-root-fragment-tree@shared/_utils/is-direct-child-directory/index.js';

export const rejectRootNodes = (() => {
  const rejectOneRootNode = (
    rootFragmentPath: string,
    name: string,
    propertyPath: string,
    localIndex: number,
    context: TReferenceContext
  ): readonly TConfigOutcome[] => {
    const fullPath =
      rootFragmentPath === '.' ? name : `${rootFragmentPath}/${name}`;
    const fileOutcomes = referenceScope.rejectFileInScope({
      context,
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
      createOutcome('configuration/root-node-not-direct-child', {
        element: fullPath,
        propertyPath,
      }),
    ];
  };

  return function rejectRootNodes(
    rootFragment: TFAFRootFragment,
    pathPrefix: string,
    localIndex: number,
    context: TReferenceContext
  ): readonly TConfigOutcome[] {
    return rootFragment.rootNodes.flatMap((tier, tierIndex) =>
      tier.flatMap((name, nodeIndex) =>
        rejectOneRootNode(
          rootFragment.path,
          name,
          `${pathPrefix}.rootNodes[${tierIndex}][${nodeIndex}]`,
          localIndex,
          context
        )
      )
    );
  };
})();
