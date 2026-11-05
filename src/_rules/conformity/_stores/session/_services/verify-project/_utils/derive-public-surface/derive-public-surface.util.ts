import type { TOutcome } from '../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TProjectBasis } from '../../_verify-project@shared/_types/_aggregates/project-basis.type.js';
import type { TTaxonomyModel } from '../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TPublicSurface } from '../../_verify-project@shared/_types/_compounds/public-surface.type.js';

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
