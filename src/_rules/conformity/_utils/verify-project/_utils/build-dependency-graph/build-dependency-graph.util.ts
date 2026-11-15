import type { TOutcome } from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TDependencyGraph,
  TModuleCollection,
  TProjectBasis,
  TTaxonomyModel,
} from '../../_verify-project@shared/_types/verification-model.type.js';

import { assembleDependencyGraph } from './_utils/assemble-dependency-graph/index.js';
import { collectGraphVertices } from './_utils/collect-graph-vertices/index.js';
import { collectResolvedArcs } from './_utils/collect-resolved-arcs/index.js';

export function buildDependencyGraph(
  basis: TProjectBasis,
  _taxonomy: TTaxonomyModel,
  modules: TModuleCollection
): {
  readonly graph: TDependencyGraph;
  readonly outcomes: readonly TOutcome[];
} {
  const vertices = collectGraphVertices(
    basis.inventory,
    modules.records,
    modules.resolutions
  );
  const arcs = collectResolvedArcs(
    modules.records,
    modules.resolutions,
    vertices.paths,
    vertices.pathToVertex
  );
  return {
    graph: assembleDependencyGraph(
      vertices.paths,
      vertices.natures,
      arcs.edges,
      arcs.libraryNotes
    ),
    outcomes: [],
  };
}
