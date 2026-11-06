import type { TFAFLocalConfig } from '../../../../../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TReferenceContext } from '../../../../_validate-config-references@shared/_types/reference-context.type.js';

import { createOutcome } from '../../../../../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { CONSTRAINT_PUBLIC_ROOT_NODES_IN_ROOT_LAYER_TREE } from '../../../../_validate-config-references@shared/_constants/reference-constraints.constant.js';
import { rejectPublicRootNode } from '../../_validate-frontier-references@shared/_utils/reject-public-root-node/index.js';
import { hasOnlyRootLayers } from './_utils/has-only-root-layers/index.js';

export function rejectLocalPublicRootNodes(
  local: TFAFLocalConfig,
  localIndex: number,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  const nodes = local.publicRootNodes ?? [];
  const basePath = `faf.locals[${localIndex}].publicRootNodes`;
  if (hasOnlyRootLayers(local)) {
    return nodes.map((path, index) =>
      createOutcome(CONSTRAINT_PUBLIC_ROOT_NODES_IN_ROOT_LAYER_TREE, {
        element: path,
        propertyPath: `${basePath}[${index}]`,
      })
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
