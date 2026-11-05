import type { TOutcome } from '../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TModuleCollection } from '../../_verify-project@shared/_types/_aggregates/module-collection.type.js';
import type { TProjectBasis } from '../../_verify-project@shared/_types/_aggregates/project-basis.type.js';
import type { TTaxonomyModel } from '../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TDependencyGraph } from '../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';

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
