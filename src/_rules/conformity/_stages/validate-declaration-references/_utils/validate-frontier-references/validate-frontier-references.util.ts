import type { TFAFConfig } from '../../../../../../_src@shared/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TReferenceContext } from '../../_validate-declaration-references@shared/_utils/reject-reference-scope/index.js';

import { rejectExternalDependencies } from './_utils/reject-external-dependencies/index.js';
import { rejectPublicRootNode } from './_utils/reject-public-root-node/index.js';
import { rejectTreeDependencies } from './_utils/reject-tree-dependencies/index.js';

export function validateFrontierReferences(
  config: TFAFConfig,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  const commonPublic = (config.faf.common?.publicRootNodes ?? []).flatMap(
    (path, index) =>
      rejectPublicRootNode(
        path,
        `faf.common.publicRootNodes[${index}]`,
        { kind: 'common' },
        context
      )
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
      ...(local.publicRootNodes ?? []).flatMap((path, index) =>
        rejectPublicRootNode(
          path,
          `${base}.publicRootNodes[${index}]`,
          scope,
          context
        )
      ),
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
