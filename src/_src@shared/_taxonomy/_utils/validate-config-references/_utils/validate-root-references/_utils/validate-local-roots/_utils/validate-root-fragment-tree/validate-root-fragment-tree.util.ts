import type { TFAFRootFragment } from '../../../../../../../../../_domain/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../../../../../../_domain/_types/outcome.type.js';
import type { TReferenceContext } from '../../../../../../_validate-config-references@shared/_types/reference-context.type.js';

import { CONFIG_4 } from '../../../../../../_validate-config-references@shared/_constants/reference-constraints.constant.js';
import { rejectOriginDirectory } from '../../../../../../_validate-config-references@shared/_utils/reject-origin-directory/index.js';
import { rejectDependencyEdges } from './_utils/reject-dependency-edges/index.js';
import { rejectNestedRootFragment } from './_utils/reject-nested-root-fragment/index.js';
import { rejectRootNodes } from './_utils/reject-root-nodes/index.js';

export function validateRootFragmentTree(
  fragment: TFAFRootFragment,
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
          normativeReference: CONFIG_4,
          path: fragment.path,
          propertyPath: `${pathPrefix}.path`,
        })
      : rejectNestedRootFragment(
          fragment.path,
          parentPath,
          `${pathPrefix}.path`,
          localIndex,
          context
        );
  const children = fragment.subRootFragments ?? [];
  const childOutcomes = children.flatMap((child, index) =>
    validateRootFragmentTree(
      child,
      fragment.path,
      treeOrigin,
      localIndex,
      `${pathPrefix}.subRootFragments[${index}]`,
      context
    )
  );
  return [
    ...pathOutcomes,
    ...rejectRootNodes(fragment, pathPrefix, localIndex, context),
    ...rejectDependencyEdges(fragment, treeOrigin, pathPrefix, context),
    ...childOutcomes,
  ];
}
