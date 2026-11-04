import type { TConfigOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TItemClassification } from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEffectiveTree } from '../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type { TTreeBuild } from '../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import { verifyExternalSources } from './_utils/verify-external-sources/index.js';
import { verifyMimeticPaths } from './_utils/verify-mimetic-paths/index.js';
import { verifyPublicRootNodes } from './_utils/verify-public-root-nodes/index.js';

export function verifyClassificationReferences(
  classifications: readonly TItemClassification[],
  tree: TEffectiveTree,
  treeIndex: number,
  treeBuild: TTreeBuild
): readonly TConfigOutcome[] {
  const byPath = new Map(
    classifications.map((classification) => [
      classification.path,
      classification,
    ])
  );
  return [
    ...verifyMimeticPaths(byPath, tree, treeBuild.mimeticPropertyPaths),
    ...verifyExternalSources(byPath, tree, treeIndex),
    ...verifyPublicRootNodes(byPath, tree, treeIndex),
  ];
}
