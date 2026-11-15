import type { TOutcome } from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TProjectBasis,
  TPublicSurface,
  TTaxonomyModel,
} from '../../_verify-project@shared/_types/verification-model.type.js';

import { collectLayerSurface } from './_utils/collect-layer-surface/index.js';
import { selectDesignatedRootNodes } from './_utils/select-designated-root-nodes/index.js';

export function derivePublicSurface(
  basis: TProjectBasis,
  taxonomy: TTaxonomyModel
): {
  readonly outcomes: readonly TOutcome[];
  readonly surface: TPublicSurface;
} {
  const trees: TPublicSurface['trees'][number][] = [];
  for (const tree of basis.declarations.trees) {
    const nodes =
      tree.originKind === 'root-fragment'
        ? selectDesignatedRootNodes(
            tree.publicRootNodes,
            tree.originPath,
            taxonomy,
            basis.inventory
          )
        : collectLayerSurface(tree.originPath, taxonomy, basis.inventory);
    trees.push({ nodes, originPath: tree.originPath });
  }
  return {
    outcomes: [],
    surface: { trees },
  };
}
