import { describe, expect, it } from 'vitest';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { buildDependencyGraph } from './index.js';

describe('buildDependencyGraph', () => {
  it('returns empty data and the not-implemented outcome', () => {
    const model = verificationModel();
    const result = buildDependencyGraph(
      model.basis,
      model.taxonomy,
      model.modules
    );
    expect(result.outcomes).toEqual([
      {
        constraint: 'unverified/not-implemented',
        element: 'build-dependency-graph',
        family: 'unverified',
        message:
          "Part 'build-dependency-graph' is not implemented (§4, §5, §7.4).",
        normativeReference: '§4, §5, §7.4',
        reason: 'not-implemented',
      },
    ]);
    expect(result.graph).toEqual({
      columnTargets: new Int32Array(0),
      edgeCount: 0,
      edgeMetadata: [],
      pathToVertex: new Map<string, number>(),
      rowOffsets: new Int32Array([0]),
      vertexCount: 0,
      vertexToPath: [],
    });
  });
});
