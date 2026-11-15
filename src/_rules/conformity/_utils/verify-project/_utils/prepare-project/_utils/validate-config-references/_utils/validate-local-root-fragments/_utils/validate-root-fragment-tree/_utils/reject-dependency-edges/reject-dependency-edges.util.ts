import type { TFAFRootFragment } from '../../../../../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TReferenceContext } from '../../../../../../_validate-config-references@shared/_utils/reject-reference-scope/index.js';

import { createOutcome } from '../../../../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';

export function rejectDependencyEdges(
  rootFragment: TFAFRootFragment,
  treeOrigin: string,
  pathPrefix: string,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  const rejectDependencyFrom = (
    fromNames: readonly string[],
    currentNames: ReadonlySet<string>,
    edgePrefix: string
  ): readonly TConfigOutcome[] => {
    const outcomes: TConfigOutcome[] = [];
    for (const [index, name] of fromNames.entries()) {
      if (!currentNames.has(name)) {
        outcomes.push(
          createOutcome.configuration(
            'configuration/invalid-root-dependency-from',
            {
              element: name,
              propertyPath: `${edgePrefix}.from[${index}]`,
            }
          )
        );
      }
    }
    return outcomes;
  };

  const rejectDependencyTo = (
    toPaths: readonly string[],
    rootFragmentPath: string,
    edgePrefix: string
  ): readonly TConfigOutcome[] => {
    return toPaths.flatMap((toPath, index): readonly TConfigOutcome[] => {
      const propertyPath = `${edgePrefix}.to[${index}]`;
      const location = context.enumeratedRootNodes.get(toPath);
      if (location === undefined) {
        return [
          createOutcome.configuration(
            'configuration/invalid-root-dependency-to',
            {
              element: toPath,
              propertyPath,
            }
          ),
        ];
      }
      if (location.treeOrigin !== treeOrigin) {
        return [
          createOutcome.configuration(
            'configuration/root-dependency-different-tree',
            {
              detail: `Root dependency target "${toPath}" belongs to tree "${location.treeOrigin}", not "${treeOrigin}".`,
              element: toPath,
              propertyPath,
            }
          ),
        ];
      }
      if (location.rootFragmentPath === rootFragmentPath) {
        return [
          createOutcome.configuration(
            'configuration/root-dependency-same-fragment',
            {
              detail: `Root dependency target "${toPath}" belongs to the same root fragment "${rootFragmentPath}".`,
              element: toPath,
              propertyPath,
            }
          ),
        ];
      }
      return [];
    });
  };

  const edges = rootFragment.dependencyEdges ?? [];
  const currentNames = new Set(rootFragment.rootNodes.flat());
  return edges.flatMap((edge, edgeIndex) => {
    const edgePrefix = `${pathPrefix}.dependencyEdges[${edgeIndex}]`;
    return [
      ...rejectDependencyFrom(edge.from, currentNames, edgePrefix),
      ...rejectDependencyTo(edge.to, rootFragment.path, edgePrefix),
    ];
  });
}
