import type { TFAFConfig } from '../../../../../_domain/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../../_domain/_types/outcome.type.js';
import type { TReferenceContext } from '../../_validate-config-references@shared/_types/reference-context.type.js';

import { rejectExternalDependencies } from './_utils/reject-external-dependencies/index.js';
import { rejectLocalPublicRootNodes } from './_utils/reject-local-public-root-nodes/index.js';
import { rejectPublicRootNodeList } from './_utils/reject-public-root-node-list/index.js';
import { rejectTreeDependencies } from './_utils/reject-tree-dependencies/index.js';

export function validateFrontierReferences(
  config: TFAFConfig,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  const commonPublic = rejectPublicRootNodeList(
    config.faf.common?.publicRootNodes ?? [],
    'faf.common.publicRootNodes',
    { kind: 'common' },
    context
  );
  const commonTrees = rejectTreeDependencies(
    config.faf.common?.treeDependencies ?? [],
    'faf.common.treeDependencies',
    { kind: 'common' },
    context
  );
  const commonExternal = rejectExternalDependencies(
    config.faf.common?.externalDependencies ?? [],
    'faf.common.externalDependencies',
    { kind: 'common' },
    context
  );
  const localOutcomes = config.faf.locals.flatMap((local, localIndex) => {
    const scope = { kind: 'local' as const, localIndex };
    const base = `faf.locals[${localIndex}]`;
    return [
      ...rejectLocalPublicRootNodes(local, localIndex, context),
      ...rejectTreeDependencies(
        local.treeDependencies ?? [],
        `${base}.treeDependencies`,
        scope,
        context
      ),
      ...rejectExternalDependencies(
        local.externalDependencies ?? [],
        `${base}.externalDependencies`,
        scope,
        context
      ),
    ];
  });
  return [...commonPublic, ...commonTrees, ...commonExternal, ...localOutcomes];
}
