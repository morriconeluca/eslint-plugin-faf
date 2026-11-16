import { describe, expect, it } from 'vitest';

import type {
  TDependencyGraph,
  TEdgeMetadata,
} from '../../../../_conformity@shared/_types/verification-model.type.js';
import type { TCandidateBranchSource } from './find-branch-violation-paths.type.js';

import { verificationModel } from '../../../_norms@shared/_mocks/verification-model.mock.js';
import { findBranchViolationPaths } from './find-branch-violation-paths.util.js';

const createEdge = (
  from: string,
  to: string,
  specifier: string,
  options: {
    readonly importIndex?: number;
    readonly line?: number;
  } = {}
): TEdgeMetadata => ({
  aliasAlternatives: [],
  aliasUsed: null,
  destinationPath: to,
  importIndex: options.importIndex ?? 0,
  isTypeOnly: false,
  position: { column: 1, line: options.line ?? 1 },
  sourcePath: from,
  specifier,
  syntaxKind: 'named-import',
});

const buildGraph = (
  vertices: readonly string[],
  edges: readonly TEdgeMetadata[]
): TDependencyGraph => {
  const pathToVertex = new Map<string, number>();
  for (const [index, vertexPath] of vertices.entries()) {
    pathToVertex.set(vertexPath, index);
  }

  const rowOffsets = new Int32Array(vertices.length + 1);
  const columnTargets: number[] = [];
  const orderedEdgeMetadata: TEdgeMetadata[] = [];

  let edgeOffset = 0;
  for (const [vIndex, vPath] of vertices.entries()) {
    rowOffsets[vIndex] = edgeOffset;
    const outgoing = edges.filter((edge) => edge.sourcePath === vPath);
    for (const edge of outgoing) {
      const destinationIndex = pathToVertex.get(edge.destinationPath);
      if (destinationIndex === undefined) {
        continue;
      }
      columnTargets.push(destinationIndex);
      orderedEdgeMetadata.push(edge);
      edgeOffset += 1;
    }
  }
  rowOffsets[vertices.length] = edgeOffset;

  const base = verificationModel();
  return {
    ...base.graph,
    columnTargets: Int32Array.from(columnTargets),
    edgeCount: orderedEdgeMetadata.length,
    edgeMetadata: orderedEdgeMetadata,
    pathToVertex,
    rowOffsets,
    vertexCount: vertices.length,
    vertexToPath: [...vertices],
  };
};

describe('findBranchViolationPaths', () => {
  it('returns empty paths when there are no candidate sources', () => {
    const graph = buildGraph(['a.ts'], []);
    expect(
      findBranchViolationPaths({
        candidateSources: [],
        graph,
        isViolation: () => true,
      })
    ).toEqual([]);
  });

  it('detects direct violations and ignores non-violations', () => {
    const graph = buildGraph(
      ['branch/start.ts', 'branch/safe.ts', 'parent/main.ts'],
      [
        createEdge('branch/start.ts', 'branch/safe.ts', './safe.js'),
        createEdge('branch/start.ts', 'parent/main.ts', '../parent/main.js'),
      ]
    );
    const candidateSources: readonly TCandidateBranchSource[] = [
      { depth: 2, path: 'branch/start.ts', vertex: 0 },
    ];
    const violations = findBranchViolationPaths({
      candidateSources,
      graph,
      isViolation: (_source, destination) => destination.startsWith('parent/'),
    });

    expect(violations).toEqual([
      expect.objectContaining({
        chain: ['branch/start.ts', 'parent/main.ts'],
        sourcePath: 'branch/start.ts',
        targetVertex: 2,
      }),
    ]);
  });

  it('detects multi-hop violation chains and reuses memoized deeper sources', () => {
    const graph = buildGraph(
      ['branch/start.ts', 'branch/middle.ts', 'branch/last.ts', 'parent/a.ts'],
      [
        createEdge('branch/start.ts', 'branch/middle.ts', './middle.js'),
        createEdge('branch/middle.ts', 'branch/last.ts', './last.js'),
        createEdge('branch/last.ts', 'parent/a.ts', '../parent/a.js'),
      ]
    );
    const candidateSources: readonly TCandidateBranchSource[] = [
      { depth: 2, path: 'branch/start.ts', vertex: 0 },
      { depth: 2, path: 'branch/middle.ts', vertex: 1 },
      { depth: 2, path: 'branch/last.ts', vertex: 2 },
    ];

    const violations = findBranchViolationPaths({
      candidateSources,
      graph,
      isViolation: (_source, destination) => destination.startsWith('parent/'),
    });

    expect(violations).toEqual([
      expect.objectContaining({
        chain: ['branch/last.ts', 'parent/a.ts'],
        sourcePath: 'branch/last.ts',
      }),
      expect.objectContaining({
        chain: ['branch/middle.ts', 'branch/last.ts', 'parent/a.ts'],
        sourcePath: 'branch/middle.ts',
      }),
      expect.objectContaining({
        chain: [
          'branch/start.ts',
          'branch/middle.ts',
          'branch/last.ts',
          'parent/a.ts',
        ],
        sourcePath: 'branch/start.ts',
      }),
    ]);
  });

  it('orders candidate sources by depth descending then path ascending', () => {
    const graph = buildGraph(
      [
        'branch/z-shallow.ts',
        'branch/a-shallow.ts',
        'branch/nested/deep.ts',
        'parent/main.ts',
      ],
      [
        createEdge(
          'branch/z-shallow.ts',
          'parent/main.ts',
          '../parent/main.js'
        ),
        createEdge(
          'branch/a-shallow.ts',
          'parent/main.ts',
          '../parent/main.js'
        ),
        createEdge(
          'branch/nested/deep.ts',
          'parent/main.ts',
          '../../parent/main.js'
        ),
      ]
    );
    const candidateSources: readonly TCandidateBranchSource[] = [
      { depth: 2, path: 'branch/z-shallow.ts', vertex: 0 },
      { depth: 2, path: 'branch/a-shallow.ts', vertex: 1 },
      { depth: 3, path: 'branch/nested/deep.ts', vertex: 2 },
    ];

    const violations = findBranchViolationPaths({
      candidateSources,
      graph,
      isViolation: (_source, destination) => destination === 'parent/main.ts',
    });

    expect(violations.map((item) => item.sourcePath)).toEqual([
      'branch/nested/deep.ts',
      'branch/a-shallow.ts',
      'branch/z-shallow.ts',
    ]);
  });

  it('handles cycles and self-imports safely without infinite recursion', () => {
    const graph = buildGraph(
      ['branch/a.ts', 'branch/b.ts', 'parent/main.ts'],
      [
        createEdge('branch/a.ts', 'branch/a.ts', './a.js'),
        createEdge('branch/a.ts', 'branch/b.ts', './b.js'),
        createEdge('branch/b.ts', 'branch/a.ts', './a.js'),
        createEdge('branch/b.ts', 'parent/main.ts', '../parent/main.js'),
      ]
    );
    const candidateSources: readonly TCandidateBranchSource[] = [
      { depth: 2, path: 'branch/a.ts', vertex: 0 },
      { depth: 2, path: 'branch/b.ts', vertex: 1 },
    ];

    const violations = findBranchViolationPaths({
      candidateSources,
      graph,
      isViolation: (_source, destination) => destination === 'parent/main.ts',
    });

    expect(violations).toHaveLength(2);
    const fromA = violations.find((item) => item.sourcePath === 'branch/a.ts');
    expect(fromA?.chain).toEqual([
      'branch/a.ts',
      'branch/b.ts',
      'parent/main.ts',
    ]);
  });

  it('prefers shorter chains and lexicographically smaller equal-length chains', () => {
    const graph = buildGraph(
      [
        'branch/start.ts',
        'branch/a.ts',
        'branch/b.ts',
        'branch/long1.ts',
        'branch/long2.ts',
        'parent/main.ts',
      ],
      [
        createEdge('branch/start.ts', 'branch/b.ts', './b.js'),
        createEdge('branch/start.ts', 'branch/a.ts', './a.js'),
        createEdge('branch/start.ts', 'branch/long1.ts', './long1.js'),
        createEdge('branch/b.ts', 'parent/main.ts', '../parent/main.js'),
        createEdge('branch/a.ts', 'parent/main.ts', '../parent/main.js'),
        createEdge('branch/long1.ts', 'branch/long2.ts', './long2.js'),
        createEdge('branch/long2.ts', 'parent/main.ts', '../parent/main.js'),
      ]
    );
    const candidateSources: readonly TCandidateBranchSource[] = [
      { depth: 2, path: 'branch/start.ts', vertex: 0 },
      { depth: 2, path: 'branch/b.ts', vertex: 2 },
      { depth: 2, path: 'branch/a.ts', vertex: 1 },
      { depth: 2, path: 'branch/long1.ts', vertex: 3 },
      { depth: 2, path: 'branch/long2.ts', vertex: 4 },
    ];

    const violations = findBranchViolationPaths({
      candidateSources,
      graph,
      isViolation: (_source, destination) => destination === 'parent/main.ts',
    });

    const fromStart = violations.find(
      (item) => item.sourcePath === 'branch/start.ts'
    );
    expect(fromStart?.chain).toEqual([
      'branch/start.ts',
      'branch/a.ts',
      'parent/main.ts',
    ]);
  });

  it('prefers direct edge over longer memoized alternative', () => {
    const graph = buildGraph(
      ['branch/a.ts', 'branch/b.ts', 'parent/main.ts'],
      [
        createEdge('branch/a.ts', 'parent/main.ts', '../parent/main.js'),
        createEdge('branch/a.ts', 'branch/b.ts', './b.js'),
        createEdge('branch/b.ts', 'parent/main.ts', '../parent/main.js'),
      ]
    );
    const candidateSources: readonly TCandidateBranchSource[] = [
      { depth: 2, path: 'branch/a.ts', vertex: 0 },
      { depth: 2, path: 'branch/b.ts', vertex: 1 },
    ];

    const violations = findBranchViolationPaths({
      candidateSources,
      graph,
      isViolation: (_source, destination) => destination === 'parent/main.ts',
    });

    const fromA = violations.find((item) => item.sourcePath === 'branch/a.ts');
    expect(fromA?.chain).toEqual(['branch/a.ts', 'parent/main.ts']);
  });

  it('skips memoized violations that are not violations for the outer source', () => {
    const graph = buildGraph(
      ['branch/outer.ts', 'branch/inner.ts', 'target.ts', 'safe.ts'],
      [
        createEdge('branch/inner.ts', 'target.ts', './target.js'),
        createEdge('branch/inner.ts', 'safe.ts', './safe.js'),
        createEdge('branch/outer.ts', 'branch/inner.ts', './inner.js'),
      ]
    );
    const candidateSources: readonly TCandidateBranchSource[] = [
      { depth: 3, path: 'branch/inner.ts', vertex: 1 },
      { depth: 2, path: 'branch/outer.ts', vertex: 0 },
    ];

    const violations = findBranchViolationPaths({
      candidateSources,
      graph,
      isViolation: (source, destination) =>
        source === 'branch/inner.ts' && destination === 'target.ts',
    });

    expect(violations).toHaveLength(1);
    expect(violations[0]?.sourcePath).toBe('branch/inner.ts');
  });

  it('sorts outgoing edges deterministically by destination then importIndex', () => {
    const graph = buildGraph(
      ['branch/source.ts', 'parent/b.ts', 'parent/a.ts'],
      [
        createEdge('branch/source.ts', 'parent/b.ts', './b.js', {
          importIndex: 5,
        }),
        createEdge('branch/source.ts', 'parent/b.ts', './b-first.js', {
          importIndex: 2,
        }),
        createEdge('branch/source.ts', 'parent/a.ts', './a.js', {
          importIndex: 3,
        }),
      ]
    );
    const violations = findBranchViolationPaths({
      candidateSources: [{ depth: 2, path: 'branch/source.ts', vertex: 0 }],
      graph,
      isViolation: (_source, destination) => destination.startsWith('parent/'),
    });

    expect(violations).toHaveLength(2);
    const toB = violations.find((item) => item.targetVertex === 1);
    expect(toB?.firstEdge.importIndex).toBe(2);
  });

  it('replaces longer or lexicographically larger memoized paths when BFS discovers a better path and skips cyclic memoized entries', () => {
    const graph = buildGraph(
      [
        'branch/outer.ts',
        'branch/inner.ts',
        'branch/z-memo.ts',
        'branch/mid.ts',
        'helper/a-via.ts',
        'parent/main.ts',
      ],
      [
        createEdge('branch/inner.ts', 'branch/outer.ts', './outer.js'),
        createEdge('branch/inner.ts', 'parent/main.ts', '../parent/main.js'),
        createEdge('branch/z-memo.ts', 'branch/mid.ts', './mid.js'),
        createEdge('branch/mid.ts', 'parent/main.ts', '../parent/main.js'),
        createEdge('branch/outer.ts', 'branch/inner.ts', './inner.js'),
        createEdge('branch/outer.ts', 'branch/z-memo.ts', './z-memo.js'),
        createEdge('branch/outer.ts', 'helper/a-via.ts', '../helper/a-via.js'),
        createEdge('helper/a-via.ts', 'branch/mid.ts', '../branch/mid.js'),
        createEdge('helper/a-via.ts', 'parent/main.ts', '../parent/main.js'),
      ]
    );

    const violations = findBranchViolationPaths({
      candidateSources: [
        { depth: 3, path: 'branch/inner.ts', vertex: 1 },
        { depth: 3, path: 'branch/z-memo.ts', vertex: 2 },
        { depth: 2, path: 'branch/outer.ts', vertex: 0 },
      ],
      graph,
      isViolation: (_source, destination) => destination === 'parent/main.ts',
    });

    const fromOuter = violations.find(
      (item) => item.sourcePath === 'branch/outer.ts'
    );
    expect(fromOuter?.chain).toEqual([
      'branch/outer.ts',
      'branch/inner.ts',
      'parent/main.ts',
    ]);

    const equalLengthGraph = buildGraph(
      [
        'branch/start.ts',
        'z-branch/memo.ts',
        'z-branch/mid.ts',
        'helper/a-bfs.ts',
        'parent/main.ts',
      ],
      [
        createEdge('z-branch/memo.ts', 'z-branch/mid.ts', './mid.js'),
        createEdge('z-branch/mid.ts', 'parent/main.ts', '../parent/main.js'),
        createEdge(
          'branch/start.ts',
          'z-branch/memo.ts',
          '../z-branch/memo.js'
        ),
        createEdge('branch/start.ts', 'helper/a-bfs.ts', '../helper/a-bfs.js'),
        createEdge('helper/a-bfs.ts', 'z-branch/mid.ts', '../z-branch/mid.js'),
        createEdge('helper/a-bfs.ts', 'helper/a-bfs.ts', './a-bfs.js'),
      ]
    );
    const equalViolations = findBranchViolationPaths({
      candidateSources: [
        { depth: 3, path: 'z-branch/memo.ts', vertex: 1 },
        { depth: 2, path: 'branch/start.ts', vertex: 0 },
      ],
      graph: equalLengthGraph,
      isViolation: (_source, destination) => destination === 'parent/main.ts',
    });
    const fromStart = equalViolations.find(
      (item) => item.sourcePath === 'branch/start.ts'
    );
    expect(fromStart?.chain).toEqual([
      'branch/start.ts',
      'helper/a-bfs.ts',
      'z-branch/mid.ts',
      'parent/main.ts',
    ]);
  });

  it('skips already-visited vertices in diamond BFS traversal', () => {
    const graph = buildGraph(
      ['branch/start.ts', 'helper/a.ts', 'helper/b.ts', 'helper/merge.ts'],
      [
        createEdge('branch/start.ts', 'helper/a.ts', './a.js'),
        createEdge('branch/start.ts', 'helper/b.ts', './b.js'),
        createEdge('helper/a.ts', 'helper/merge.ts', './merge.js'),
        createEdge('helper/b.ts', 'helper/merge.ts', './merge.js'),
      ]
    );
    expect(
      findBranchViolationPaths({
        candidateSources: [{ depth: 2, path: 'branch/start.ts', vertex: 0 }],
        graph,
        isViolation: () => false,
      })
    ).toEqual([]);
  });

  it('handles sparse or truncated graph metadata safely without throwing', () => {
    const baseGraph = buildGraph(['branch/start.ts', 'parent/main.ts'], []);
    const missingEdgeGraph: TDependencyGraph = {
      ...baseGraph,
      columnTargets: new Int32Array([1, 1]),
      edgeCount: 2,
      edgeMetadata: [
        createEdge('branch/start.ts', 'parent/main.ts', '../parent/main.js'),
      ],
      rowOffsets: new Int32Array([0, 2, 2]),
      vertexCount: 2,
    };
    expect(
      findBranchViolationPaths({
        candidateSources: [{ depth: 2, path: 'branch/start.ts', vertex: 0 }],
        graph: missingEdgeGraph,
        isViolation: () => true,
      })
    ).toEqual([
      expect.objectContaining({
        chain: ['branch/start.ts', 'parent/main.ts'],
      }),
    ]);

    const missingTargetGraph: TDependencyGraph = {
      ...baseGraph,
      columnTargets: new Int32Array(0),
      edgeCount: 1,
      edgeMetadata: [
        createEdge('branch/start.ts', 'parent/main.ts', '../parent/main.js'),
      ],
      rowOffsets: new Int32Array([0, 1, 1]),
      vertexCount: 2,
    };
    expect(
      findBranchViolationPaths({
        candidateSources: [{ depth: 2, path: 'branch/start.ts', vertex: 0 }],
        graph: missingTargetGraph,
        isViolation: () => true,
      })
    ).toEqual([]);

    const emptyOffsetsGraph: TDependencyGraph = {
      ...baseGraph,
      rowOffsets: new Int32Array(0),
      vertexCount: 1,
    };
    expect(
      findBranchViolationPaths({
        candidateSources: [{ depth: 2, path: 'branch/start.ts', vertex: 0 }],
        graph: emptyOffsetsGraph,
        isViolation: () => true,
      })
    ).toEqual([]);

    const truncatedPathsGraph: TDependencyGraph = {
      ...baseGraph,
      vertexCount: 2,
      vertexToPath: ['branch/start.ts'],
    };
    const innerOnly = buildGraph(
      ['branch/inner.ts', 'parent/main.ts'],
      [createEdge('branch/inner.ts', 'parent/main.ts', '../parent/main.js')]
    );
    const truncatedMemoGraph: TDependencyGraph = {
      ...innerOnly,
      vertexToPath: ['branch/inner.ts'],
    };
    expect(
      findBranchViolationPaths({
        candidateSources: [
          { depth: 3, path: 'branch/inner.ts', vertex: 0 },
          { depth: 2, path: 'branch/outer.ts', vertex: 1 },
        ],
        graph: truncatedMemoGraph,
        isViolation: (_source, destination) => destination === '',
      })
    ).toEqual([]);
    expect(
      findBranchViolationPaths({
        candidateSources: [{ depth: 2, path: 'branch/start.ts', vertex: 0 }],
        graph: truncatedPathsGraph,
        isViolation: () => true,
      })
    ).toEqual([]);
  });
});
