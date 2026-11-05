import type { TOutcome } from '../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TModuleCollection } from '../../_verify-project@shared/_types/_aggregates/module-collection.type.js';
import type { TProjectBasis } from '../../_verify-project@shared/_types/_aggregates/project-basis.type.js';
import type { TTaxonomyModel } from '../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TDependencyGraph } from '../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';

import { notImplementedOutcome } from '../../_verify-project@shared/_utils/not-implemented-outcome/index.js';

export function buildDependencyGraph(
  _basis: TProjectBasis,
  _taxonomy: TTaxonomyModel,
  _modules: TModuleCollection
): {
  readonly graph: TDependencyGraph;
  readonly outcomes: readonly TOutcome[];
} {
  return {
    graph: {
      columnTargets: new Int32Array(0),
      edgeCount: 0,
      edgeMetadata: [],
      pathToVertex: new Map<string, number>(),
      rowOffsets: new Int32Array([0]),
      vertexCount: 0,
      vertexToPath: [],
    },
    outcomes: [notImplementedOutcome('build-dependency-graph', '§4, §5, §7.4')],
  };
}
