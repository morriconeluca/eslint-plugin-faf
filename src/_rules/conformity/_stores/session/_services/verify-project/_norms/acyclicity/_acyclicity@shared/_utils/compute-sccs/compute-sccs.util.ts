import { buildTransposeGraph } from './_utils/build-transpose-graph/index.js';
import { collectSccComponent } from './_utils/collect-scc-component/index.js';
import { computeFinishStack } from './_utils/compute-finish-stack/index.js';

export function computeSccs(
  nodeCount: number,
  adjacency: readonly (readonly number[])[]
): readonly (readonly number[])[] {
  const finishStack = computeFinishStack(nodeCount, adjacency);
  const revAdjacency = buildTransposeGraph(nodeCount, adjacency);
  const visited = new Uint8Array(nodeCount);
  const sccs: (readonly number[])[] = [];

  for (let index = finishStack.length - 1; index >= 0; index -= 1) {
    const root = finishStack[index];
    if (root !== undefined && visited[root] === 0) {
      sccs.push(collectSccComponent(root, revAdjacency, visited));
    }
  }

  return sccs;
}
