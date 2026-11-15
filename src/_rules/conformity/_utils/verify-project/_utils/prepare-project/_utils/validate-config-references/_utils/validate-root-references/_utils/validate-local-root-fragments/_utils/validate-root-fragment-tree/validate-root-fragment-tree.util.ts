import type { TFAFRootFragment } from '../../../../../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TReferenceContext } from '../../../../../../_validate-config-references@shared/_utils/reference-scope/index.js';

import { rejectOriginDirectory } from '../../_validate-local-root-fragments@shared/_utils/reject-origin-directory/index.js';
import { rejectDependencyEdges } from './_utils/reject-dependency-edges/index.js';
import { rejectNestedRootFragment } from './_utils/reject-nested-root-fragment/index.js';
import { rejectRootNodes } from './_utils/reject-root-nodes/index.js';

export function validateRootFragmentTree(
  rootFragment: TFAFRootFragment,
  parentPath: null | string,
  treeOrigin: string,
  localIndex: number,
  pathPrefix: string,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  const pathOutcomes =
    parentPath === null
      ? rejectOriginDirectory({
          context,
          label: 'Declared root fragment directory',
          path: rootFragment.path,
          propertyPath: `${pathPrefix}.path`,
        })
      : rejectNestedRootFragment(
          rootFragment.path,
          parentPath,
          `${pathPrefix}.path`,
          localIndex,
          context
        );
  const children = rootFragment.subRootFragments ?? [];
  const childOutcomes = children.flatMap((child, index) =>
    validateRootFragmentTree(
      child,
      rootFragment.path,
      treeOrigin,
      localIndex,
      `${pathPrefix}.subRootFragments[${index}]`,
      context
    )
  );
  return [
    ...pathOutcomes,
    ...rejectRootNodes(rootFragment, pathPrefix, localIndex, context),
    ...rejectDependencyEdges(rootFragment, treeOrigin, pathPrefix, context),
    ...childOutcomes,
  ];
}
