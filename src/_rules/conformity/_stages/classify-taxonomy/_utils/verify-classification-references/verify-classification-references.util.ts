import type { TConfigOutcome } from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TEffectiveTree,
  TItemClassification,
} from '../../../../_conformity@shared/_types/verification-model.type.js';
import type { TTreeBuild } from '../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import { createOutcome } from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import {
  DOMAIN_CATEGORY,
  FORM_FRAGMENTS,
  NODE_ACCESS,
  NODE_FOREIGN,
  NODE_ROOT,
} from '../../_classify-taxonomy@shared/_constants/classification-constraints.constant.js';
import { readPathName } from '../../_classify-taxonomy@shared/_utils/read-path-name/index.js';

export function verifyClassificationReferences(
  classifications: readonly TItemClassification[],
  tree: TEffectiveTree,
  treeIndex: number,
  treeBuild: TTreeBuild
): readonly TConfigOutcome[] {
  const verifyMimeticPaths = (
    byPath: ReadonlyMap<string, TItemClassification>
  ): readonly TConfigOutcome[] => {
    const outcomes: TConfigOutcome[] = [];
    for (const [mimeticPath, propertyPath] of treeBuild.mimeticPropertyPaths) {
      const classification = byPath.get(mimeticPath);
      if (classification === undefined) {
        continue;
      }
      const role = tree.catalog.categoryToRole.get(readPathName(mimeticPath));
      const isValidParent =
        classification.domainKind === DOMAIN_CATEGORY &&
        role?.form === FORM_FRAGMENTS;
      if (!isValidParent) {
        outcomes.push(
          createOutcome.configuration(
            'configuration/incompatible-mimetic-designation',
            {
              element: mimeticPath,
              propertyPath,
            }
          )
        );
      }
    }
    return outcomes;
  };

  const verifyExternalSources = (
    byPath: ReadonlyMap<string, TItemClassification>
  ): readonly TConfigOutcome[] => {
    const outcomes: TConfigOutcome[] = [];
    for (const [pairIndex, pair] of tree.externalDependencyPairs.entries()) {
      const classification = byPath.get(pair.from);
      if (classification === undefined) {
        continue;
      }
      const isRejectedSource =
        classification.domainKind !== null ||
        classification.nodeKind === NODE_ACCESS ||
        classification.nodeKind === NODE_FOREIGN;
      if (isRejectedSource) {
        outcomes.push(
          createOutcome.configuration(
            'configuration/invalid-external-dependency-source',
            {
              element: pair.from,
              propertyPath: `trees[${treeIndex}].externalDependencyPairs[${pairIndex}].from`,
            }
          )
        );
      }
    }
    return outcomes;
  };

  const verifyPublicRootNodes = (
    byPath: ReadonlyMap<string, TItemClassification>
  ): readonly TConfigOutcome[] => {
    const outcomes: TConfigOutcome[] = [];
    for (const [nodeIndex, nodePath] of tree.publicRootNodes.entries()) {
      const classification = byPath.get(nodePath);
      if (
        classification !== undefined &&
        classification.nodeKind !== NODE_ROOT
      ) {
        outcomes.push(
          createOutcome.configuration(
            'configuration/invalid-public-root-node',
            {
              element: nodePath,
              propertyPath: `trees[${treeIndex}].publicRootNodes[${nodeIndex}]`,
            }
          )
        );
      }
    }
    return outcomes;
  };

  const byPath = new Map(
    classifications.map((classification) => [
      classification.path,
      classification,
    ])
  );
  return [
    ...verifyMimeticPaths(byPath),
    ...verifyExternalSources(byPath),
    ...verifyPublicRootNodes(byPath),
  ];
}
