import type { TFAFLocalConfig } from '../../../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TReferenceContext } from '../../../../_validate-config-references@shared/_utils/reject-reference-scope/index.js';

import { createOutcome } from '../../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import { rejectPublicRootNode } from '../../_validate-frontier-references@shared/_utils/reject-public-root-node/index.js';
import { CONSTRAINT_PUBLIC_ROOT_NODES_IN_ROOT_LAYER_TREE } from './reject-local-public-root-nodes.constant.js';

export function rejectLocalPublicRootNodes(
  local: TFAFLocalConfig,
  localIndex: number,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  const hasOnlyRootLayers = (): boolean => {
    const hasFragments = (local.rootFragments?.length ?? 0) > 0;
    const hasLayers = (local.rootLayers?.length ?? 0) > 0;
    return !hasFragments && hasLayers;
  };

  const nodes = local.publicRootNodes ?? [];
  const basePath = `faf.locals[${localIndex}].publicRootNodes`;
  if (hasOnlyRootLayers()) {
    return nodes.map((path, index) =>
      createOutcome.configuration(
        CONSTRAINT_PUBLIC_ROOT_NODES_IN_ROOT_LAYER_TREE,
        {
          element: path,
          propertyPath: `${basePath}[${index}]`,
        }
      )
    );
  }

  return nodes.flatMap((path, index) =>
    rejectPublicRootNode(
      path,
      `${basePath}[${index}]`,
      { kind: 'local', localIndex },
      context
    )
  );
}
