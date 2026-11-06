import type { FileTree } from 'fs-fixture';

import { beforeAll, describe, it } from 'vitest';

import type { TScenarioMessage } from '../support/acceptance-project.js';

import {
  createProject,
  expectScenario,
  lintScenario,
  warmupESLint,
} from '../support/acceptance-project.js';

const roles = [
  { category: '_types', isCategoryNode: true, name: 'type' },
  { category: '_utils', name: 'util' },
];

const peerSeparationOutcome = (
  from: string,
  to: string,
  specifier: string
): TScenarioMessage => ({
  column: 1,
  constraint: 'dependency/peer-separation',
  element: from,
  filePath: from,
  line: 1,
  message: `dependency/peer-separation: '${from}' imports '${to}' through '${specifier}': sibling subtrees may depend on each other only downward along a Horizontal Hierarchy (FAF §5).`,
  messageId: 'dependency',
  ruleId: 'faf/conformity',
  severity: 2,
});

const cycleOutcome = (
  filePath: string,
  constraint: 'acyclicity/dependency-cycle' | 'acyclicity/inter-tree-cycle',
  segments: readonly (readonly string[])[]
): TScenarioMessage => {
  const isInterTree = constraint === 'acyclicity/inter-tree-cycle';
  const predicate = isInterTree
    ? 'is part of a dependency cycle between Fractal Trees'
    : 'is part of a dependency cycle';
  const reference = isInterTree ? 'FAF §7.2' : 'FAF §5';
  const segmentsText = segments
    .map((segment) => segment.join(' -> '))
    .join('; ');
  return {
    column: 1,
    constraint,
    element: filePath,
    filePath,
    line: 1,
    message: `${constraint}: '${filePath}' ${predicate}: ${segmentsText} (${reference}).`,
    messageId: 'acyclicity',
    ruleId: 'faf/conformity',
    severity: 2,
  };
};

const directEdgeOutcome = ({
  constraint,
  from,
  predicate,
  reference,
  specifier,
  to,
}: {
  readonly constraint: string;
  readonly from: string;
  readonly predicate: string;
  readonly reference: string;
  readonly specifier: string;
  readonly to: string;
}): TScenarioMessage => ({
  column: 1,
  constraint,
  element: from,
  filePath: from,
  line: 1,
  message: `${constraint}: '${from}' imports '${to}' through '${specifier}': ${predicate} (${reference}).`,
  messageId: 'dependency',
  ruleId: 'faf/conformity',
  severity: 2,
});

const pathOutcome = ({
  chain,
  constraint,
  from,
  predicate,
  reference,
  to,
}: {
  readonly chain: readonly string[];
  readonly constraint: string;
  readonly from: string;
  readonly predicate: string;
  readonly reference: string;
  readonly to: string;
}): TScenarioMessage => ({
  column: 1,
  constraint,
  element: from,
  filePath: from,
  line: 1,
  message: `${constraint}: '${from}' reaches '${to}' through ${chain.join(' -> ')}: ${predicate} (${reference}).`,
  messageId: 'dependency',
  ruleId: 'faf/conformity',
  severity: 2,
});

const branchDirectEdgeOutcome = (
  from: string,
  to: string,
  specifier: string
): TScenarioMessage =>
  directEdgeOutcome({
    constraint: 'dependency/fractal-branch-unidirectionality',
    from,
    predicate:
      'a Fractal Branch must not depend on the other subtrees of its parent',
    reference: 'FAF §6.6.2',
    specifier,
    to,
  });

const rootNodeDisciplineOutcome = (
  from: string,
  to: string,
  specifier: string
): TScenarioMessage =>
  directEdgeOutcome({
    constraint: 'dependency/root-node-discipline',
    from,
    predicate:
      'a Root Node is importable only by Root Nodes authorized by rootNodes or dependencyEdges',
    reference: 'FAF §6.2.2',
    specifier,
    to,
  });

const branchVisibilityOutcome = (
  from: string,
  to: string,
  specifier: string
): TScenarioMessage =>
  directEdgeOutcome({
    constraint: 'dependency/fractal-branch-visibility',
    from,
    predicate:
      'a Fractal Branch is importable only from the subtree of its parent, except the parent Access Node',
    reference: 'FAF §6.6.2',
    specifier,
    to,
  });

const branchPathOutcome = (chain: readonly string[]): TScenarioMessage => {
  const from = chain[0] ?? '';
  const to = chain.at(-1) ?? '';
  return pathOutcome({
    chain,
    constraint: 'dependency/fractal-branch-unidirectionality',
    from,
    predicate:
      'a Fractal Branch must not depend on the other subtrees of its parent',
    reference: 'FAF §6.6.2',
    to,
  });
};

const reEntryOutcome = (chain: readonly string[]): TScenarioMessage => {
  const from = chain[0] ?? '';
  const to = chain.at(-1) ?? '';
  return pathOutcome({
    chain,
    constraint: 'dependency/re-entry-prohibition',
    from,
    predicate:
      'a path through local files outside all Fractal Trees must not re-enter its Fractal Tree',
    reference: 'FAF §7.3',
    to,
  });
};

const inducedTreeAuthorizationOutcome = (
  chain: readonly string[]
): TScenarioMessage => {
  const from = chain[0] ?? '';
  const to = chain.at(-1) ?? '';
  return pathOutcome({
    chain,
    constraint: 'dependency/tree-authorization',
    from,
    predicate:
      'a dependency between Fractal Trees requires an oriented treeDependencies authorization',
    reference: 'FAF §7.2, §7.3',
    to,
  });
};

const treeOpacityOutcome = (specifier: string): TScenarioMessage =>
  directEdgeOutcome({
    constraint: 'dependency/tree-opacity',
    from: 'x.ts',
    predicate:
      'only the Public Surface of a Fractal Tree is importable from outside the Tree',
    reference: 'FAF §7.1',
    specifier,
    to: 'b/end.ts',
  });

const fragmentEncapsulationOutcome = (
  from: string,
  to: string,
  specifier: string
): TScenarioMessage =>
  directEdgeOutcome({
    constraint: 'dependency/fragment-encapsulation',
    from,
    predicate:
      'a Fragment is importable from outside only through its index.ts',
    reference: 'FAF §6.1.1',
    specifier,
    to,
  });

const subGraphIsolationOutcome = (
  from: string,
  to: string,
  specifier: string
): TScenarioMessage =>
  directEdgeOutcome({
    constraint: 'dependency/sub-graph-node-isolation',
    from,
    predicate: 'a Sub-Graph Node is not importable',
    reference: 'FAF §4',
    specifier,
    to,
  });

const privateCategoryVisibilityOutcome = (
  from: string,
  to: string,
  specifier: string
): TScenarioMessage =>
  directEdgeOutcome({
    constraint: 'dependency/private-category-visibility',
    from,
    predicate:
      'a Private Category is importable from outside only by the enabled direct Logical Nodes of its parent',
    reference: 'FAF §6.3.3',
    specifier,
    to,
  });

const foreignNodeIsolationOutcome = (
  from: string,
  to: string,
  specifier: string
): TScenarioMessage =>
  directEdgeOutcome({
    constraint: 'dependency/foreign-node-isolation',
    from,
    predicate: 'a Foreign Node has no import relation with codebase files',
    reference: 'FAF §4, §6.7',
    specifier,
    to,
  });

const unresolvedImportOutcome = (
  filePath: string,
  detail: string
): TScenarioMessage => ({
  column: 1,
  constraint: 'unverified/unresolved-import',
  element: filePath,
  filePath,
  line: 1,
  message: `unverified/unresolved-import: '${filePath}' contains an import that could not be resolved: ${detail} (D-08).`,
  messageId: 'unverified',
  ruleId: 'faf/conformity',
  severity: 2,
});

const runScenario = async (
  tree: FileTree,
  local: Readonly<Record<string, unknown>>,
  responsiblePart: string,
  expected: readonly TScenarioMessage[]
): Promise<void> => {
  const fixture = await createProject(tree, {
    faf: { locals: [{ roles, subGraphRoles: [{ name: 'spec' }], ...local }] },
  });
  try {
    expectScenario(await lintScenario(fixture.path), responsiblePart, expected);
  } finally {
    await fixture.rm();
  }
};

const root = (path: string, names: readonly string[]) => ({
  path,
  rootNodes: names.length === 0 ? [] : [names],
});

const branchSource = 'src/_src@shared/_types/start.type.ts';
const branchTree = {
  'src/_src@shared/_types/start.type.ts': 'export type Start = string;\n',
  'src/_types/other.type.ts': 'export type Other = string;\n',
  'src/_utils/unit/_unit@shared/_types/deep.type.ts':
    'export type Deep = string;\n',
  'src/_utils/unit/index.ts': "export { unit } from './unit.util.js';\n",
  'src/_utils/unit/unit.util.ts': 'export const unit = 1;\n',
  'src/child/entry.ts': 'export const entry = 1;\n',
  'src/main.ts': 'export const main = 1;\n',
};
const branchConfig = {
  rootFragments: [
    {
      ...root('src', ['main.ts']),
      subRootFragments: [root('src/child', ['entry.ts'])],
    },
  ],
};

const externalBase = {
  'a/end.ts': 'export const end = 1;\n',
  'a/start.ts': "import '../x.js';\nexport const start = 1;\n",
  'b/end.ts': 'export const end = 1;\n',
  'x.ts': 'export const x = 1;\n',
  'y.ts': 'export const y = 1;\n',
};
const externalConfig = {
  externalDependencies: [{ from: ['a/start.ts'], to: ['x.ts'] }],
  publicRootNodes: ['a/end.ts', 'b/end.ts'],
  rootFragments: [root('a', ['start.ts', 'end.ts']), root('b', ['end.ts'])],
};

describe('acceptance: global graph norms', () => {
  beforeAll(warmupESLint, 120_000);

  it.each([
    [
      'direct parent node',
      'src/main.ts',
      "import '../../main.js';\n",
      '../../main.js',
    ],
    [
      'private Access Node',
      'src/_utils/unit/index.ts',
      "import '../../_utils/unit/index.js';\n",
      '../../_utils/unit/index.js',
      true,
    ],
    [
      'sibling Category Node',
      'src/_types/other.type.ts',
      "import '../../_types/other.type.js';\n",
      '../../_types/other.type.js',
      true,
    ],
    [
      'child Root Node',
      'src/child/entry.ts',
      "import '../../child/entry.js';\n",
      '../../child/entry.js',
      false,
    ],
    [
      'nested sibling Branch node',
      'src/_utils/unit/_unit@shared/_types/deep.type.ts',
      "import '../../_utils/unit/_unit@shared/_types/deep.type.js';\n",
      '../../_utils/unit/_unit@shared/_types/deep.type.js',
      true,
    ],
  ])(
    'rejects a Branch return to a %s',
    async (name, target, source, specifier, isPrivateCategory = false) => {
      const isRootDestination =
        target === 'src/main.ts' || target === 'src/child/entry.ts';
      const isPeerViolation =
        name !== 'direct parent node' && name !== 'child Root Node';
      const isBranchDestination = target.includes('@shared');
      await runScenario(
        { ...branchTree, [branchSource]: source },
        branchConfig,
        'fractal-branch-unidirectionality',
        [
          branchDirectEdgeOutcome(branchSource, target, specifier),
          ...(isBranchDestination
            ? [branchVisibilityOutcome(branchSource, target, specifier)]
            : []),
          ...(isPeerViolation
            ? [peerSeparationOutcome(branchSource, target, specifier)]
            : []),
          ...(isPrivateCategory
            ? [
                privateCategoryVisibilityOutcome(
                  branchSource,
                  target,
                  specifier
                ),
              ]
            : []),
          ...(isRootDestination
            ? [rootNodeDisciplineOutcome(branchSource, target, specifier)]
            : []),
        ]
      );
    }
  );

  it('finds a Branch return beyond the first outgoing edge', async () => {
    await runScenario(
      {
        ...branchTree,
        [branchSource]: "import './middle.type.js';\n",
        'src/_src@shared/_types/last.type.ts':
          "import '../../_types/other.type.js';\n",
        'src/_src@shared/_types/middle.type.ts': "import './last.type.js';\n",
      },
      branchConfig,
      'fractal-branch-unidirectionality',
      [
        branchDirectEdgeOutcome(
          'src/_src@shared/_types/last.type.ts',
          'src/_types/other.type.ts',
          '../../_types/other.type.js'
        ),
        peerSeparationOutcome(
          'src/_src@shared/_types/last.type.ts',
          'src/_types/other.type.ts',
          '../../_types/other.type.js'
        ),
        privateCategoryVisibilityOutcome(
          'src/_src@shared/_types/last.type.ts',
          'src/_types/other.type.ts',
          '../../_types/other.type.js'
        ),
        branchPathOutcome([
          'src/_src@shared/_types/middle.type.ts',
          'src/_src@shared/_types/last.type.ts',
          'src/_types/other.type.ts',
        ]),
        peerSeparationOutcome(
          'src/_src@shared/_types/middle.type.ts',
          'src/_src@shared/_types/last.type.ts',
          './last.type.js'
        ),
        branchPathOutcome([
          branchSource,
          'src/_src@shared/_types/middle.type.ts',
          'src/_src@shared/_types/last.type.ts',
          'src/_types/other.type.ts',
        ]),
        peerSeparationOutcome(
          branchSource,
          'src/_src@shared/_types/middle.type.ts',
          './middle.type.js'
        ),
      ]
    );
  });

  it('allows a local Branch to consume an accessible ancestor Branch', async () => {
    await runScenario(
      {
        ...branchTree,
        'src/_utils/unit/_unit@shared/_types/deep.type.ts':
          "import '../../../../_src@shared/_types/start.type.js';\n",
      },
      branchConfig,
      'fractal-branch-unidirectionality',
      []
    );
  });

  it.each([
    [
      'chain',
      "import '../b/main.js';\n",
      "import '../c/main.js';\n",
      '',
      false,
    ],
    [
      'diamond',
      "import '../b/main.js';\nimport '../c/main.js';\n",
      "import '../c/main.js';\n",
      '',
      false,
    ],
    ['self loop', "import './main.js';\n", '', '', true],
    [
      'two vertices',
      "import '../b/main.js';\n",
      "import '../a/main.js';\n",
      '',
      true,
    ],
    [
      'three vertices',
      "import '../b/main.js';\n",
      "import '../c/main.js';\n",
      "import '../a/main.js';\n",
      true,
    ],
  ])('checks the module DAG for %s', async (name, a, b, c, forbidden) => {
    const witnesses: Readonly<Record<string, readonly string[]>> = {
      'self loop': ['src/a/main.ts', 'src/a/main.ts'],
      'two vertices': ['src/a/main.ts', 'src/b/main.ts', 'src/a/main.ts'],
    };
    const paths = witnesses[name] ?? [
      'src/a/main.ts',
      'src/b/main.ts',
      'src/c/main.ts',
      'src/a/main.ts',
    ];
    const imports: Readonly<Record<string, string>> = { a, b, c };
    await runScenario(
      { 'src/a/main.ts': a, 'src/b/main.ts': b, 'src/c/main.ts': c },
      {
        rootFragments: [
          {
            path: 'src',
            rootNodes: [],
            subRootFragments: ['a', 'b', 'c'].map((part) => ({
              ...root(`src/${part}`, ['main.ts']),
              dependencyEdges: ['a', 'b', 'c']
                .filter(
                  (target) =>
                    imports[part]?.includes(`../${target}/main.js`) === true
                )
                .map((target) => ({
                  from: ['main.ts'],
                  to: [`src/${target}/main.ts`],
                })),
            })),
          },
        ],
      },
      'acyclicity',
      forbidden
        ? [cycleOutcome(paths[0] ?? '', 'acyclicity/dependency-cycle', [paths])]
        : []
    );
  });

  it('does not let reciprocal Root authorizations waive a real cycle', async () => {
    await runScenario(
      {
        'src/a/main.ts': "import '../b/main.js';\n",
        'src/b/main.ts': "import '../a/main.js';\n",
      },
      {
        rootFragments: [
          {
            path: 'src',
            rootNodes: [],
            subRootFragments: [
              {
                ...root('src/a', ['main.ts']),
                dependencyEdges: [{ from: ['main.ts'], to: ['src/b/main.ts'] }],
              },
              {
                ...root('src/b', ['main.ts']),
                dependencyEdges: [{ from: ['main.ts'], to: ['src/a/main.ts'] }],
              },
            ],
          },
        ],
      },
      'acyclicity',
      [
        cycleOutcome('src/a/main.ts', 'acyclicity/dependency-cycle', [
          ['src/a/main.ts', 'src/b/main.ts', 'src/a/main.ts'],
        ]),
      ]
    );
  });

  it('checks cycles among unreachable modules', async () => {
    await runScenario(
      {
        'src/_types/a.type.ts':
          "import './b.type.js';\nexport type A = string;\n",
        'src/_types/b.type.ts':
          "import './a.type.js';\nexport type B = string;\n",
        'src/main.ts': 'export const main = 1;\n',
      },
      { rootFragments: [root('src', ['main.ts'])] },
      'acyclicity',
      [
        peerSeparationOutcome(
          'src/_types/a.type.ts',
          'src/_types/b.type.ts',
          './b.type.js'
        ),
        cycleOutcome('src/_types/a.type.ts', 'acyclicity/dependency-cycle', [
          [
            'src/_types/a.type.ts',
            'src/_types/b.type.ts',
            'src/_types/a.type.ts',
          ],
        ]),
        peerSeparationOutcome(
          'src/_types/b.type.ts',
          'src/_types/a.type.ts',
          './a.type.js'
        ),
      ]
    );
  });

  it('checks cycles formed only by type imports', async () => {
    await runScenario(
      {
        'src/_types/a.type.ts':
          "import type { B } from './b.type.js';\nexport type A = B;\n",
        'src/_types/b.type.ts':
          "import type { A } from './a.type.js';\nexport type B = A;\n",
        'src/main.ts': 'export const main = 1;\n',
      },
      { rootFragments: [root('src', ['main.ts'])] },
      'acyclicity',
      [
        peerSeparationOutcome(
          'src/_types/a.type.ts',
          'src/_types/b.type.ts',
          './b.type.js'
        ),
        cycleOutcome('src/_types/a.type.ts', 'acyclicity/dependency-cycle', [
          [
            'src/_types/a.type.ts',
            'src/_types/b.type.ts',
            'src/_types/a.type.ts',
          ],
        ]),
        peerSeparationOutcome(
          'src/_types/b.type.ts',
          'src/_types/a.type.ts',
          './a.type.js'
        ),
      ]
    );
  });

  it.each([
    {
      expected: [
        fragmentEncapsulationOutcome(
          'src/_high/_utils/source/source.util.ts',
          'src/_low/_utils/unit/unit.util.ts',
          '../../../_low/_utils/unit/unit.util.js'
        ),
      ],
      kind: 'Fragment Node',
      responsiblePart: 'fragment-encapsulation',
      target: 'src/_low/_utils/unit/unit.util.ts',
    },
    {
      expected: [
        subGraphIsolationOutcome(
          'src/_high/_utils/source/source.util.ts',
          'src/_low/_utils/unit/unit.spec.ts',
          '../../../_low/_utils/unit/unit.spec.js'
        ),
      ],
      kind: 'Sub-Graph Node',
      responsiblePart: 'sub-graph-node-isolation',
      target: 'src/_low/_utils/unit/unit.spec.ts',
    },
    {
      expected: [
        foreignNodeIsolationOutcome(
          'src/_high/_utils/source/source.util.ts',
          'src/_low/_utils/unit/data.ts',
          '../../../_low/_utils/unit/data.js'
        ),
      ],
      kind: 'Foreign Node',
      responsiblePart: 'foreign-node-isolation',
      target: 'src/_low/_utils/unit/data.ts',
    },
  ])(
    'keeps the target prohibition for a descending import to a $kind',
    async ({ expected, responsiblePart, target }) => {
      await runScenario(
        {
          'src/_high/_utils/source/index.ts':
            "export { source } from './source.util.js';\n",
          'src/_high/_utils/source/source.util.ts': `import '../../..${target.slice(3, -3)}.js';\nexport const source = 1;\n`,
          'src/_low/_utils/unit/index.ts':
            "export { unit } from './unit.util.js';\n",
          'src/_low/_utils/unit/unit.util.ts': 'export const unit = 1;\n',
          [target]: target.endsWith('unit.util.ts')
            ? 'export const unit = 1;\n'
            : 'export const target = 1;\n',
        },
        {
          foreignNodes: target.endsWith('/data.ts') ? [target] : [],
          horizontalHierarchies: [[['_low'], ['_high']]],
          rootLayers: ['src'],
        },
        responsiblePart,
        expected
      );
    }
  );

  it.each([
    {
      description: 'chain',
      edges: [
        ['a', 'b'],
        ['b', 'c'],
      ],
      expected: [],
    },
    {
      description: 'diamond',
      edges: [
        ['a', 'b'],
        ['a', 'c'],
        ['b', 'c'],
      ],
      expected: [],
    },
    {
      description: 'two Trees',
      edges: [
        ['a', 'b'],
        ['b', 'a'],
      ],
      expected: [
        cycleOutcome('a/source.ts', 'acyclicity/inter-tree-cycle', [
          ['a/source.ts', 'b/target.ts'],
          ['b/source.ts', 'a/target.ts'],
        ]),
      ],
    },
    {
      description: 'three Trees',
      edges: [
        ['a', 'b'],
        ['b', 'c'],
        ['c', 'a'],
      ],
      expected: [
        cycleOutcome('a/source.ts', 'acyclicity/inter-tree-cycle', [
          ['a/source.ts', 'b/target.ts'],
          ['b/source.ts', 'c/target.ts'],
          ['c/source.ts', 'a/target.ts'],
        ]),
      ],
    },
  ])(
    'checks the Tree DAG independently of module cycles: $description',
    async ({ edges, expected }) => {
      const tree: Record<string, string> = {};
      for (const origin of ['a', 'b', 'c']) {
        tree[`${origin}/target.ts`] = 'export const target = 1;\n';
        tree[`${origin}/source.ts`] = edges
          .filter(([from]) => from === origin)
          .map(([, to]) => `import '../${to}/target.js';`)
          .join('\n');
      }
      await runScenario(
        tree,
        {
          publicRootNodes: ['a', 'b', 'c'].map(
            (origin) => `${origin}/target.ts`
          ),
          rootFragments: ['a', 'b', 'c'].map((origin) =>
            root(origin, ['source.ts', 'target.ts'])
          ),
          treeDependencies: edges.map(([from, to]) => ({
            from: [from],
            to: [to],
          })),
        },
        'acyclicity',
        expected
      );
    }
  );

  it.each([
    {
      description: 'one external file',
      expected: [reEntryOutcome(['a/start.ts', 'x.ts', 'a/end.ts'])],
      x: "import './a/end.js';\n",
      y: '',
    },
    {
      description: 'two external files',
      expected: [reEntryOutcome(['a/start.ts', 'x.ts', 'y.ts', 'a/end.ts'])],
      x: "import './y.js';\n",
      y: "import './a/end.js';\n",
    },
    {
      description: 'another Tree',
      expected: [
        reEntryOutcome(['a/start.ts', 'x.ts', 'b/end.ts', 'y.ts', 'a/end.ts']),
      ],
      x: "import './b/end.js';\n",
      y: "import './a/end.js';\n",
    },
  ])(
    'rejects an authorized re-entry through $description',
    async ({ description, expected, x, y }) => {
      await runScenario(
        {
          ...externalBase,
          'b/end.ts':
            description === 'another Tree'
              ? "import '../y.js';\n"
              : externalBase['b/end.ts'],
          'x.ts': x,
          'y.ts': y,
        },
        {
          ...externalConfig,
          externalDependencies: [
            ...externalConfig.externalDependencies,
            { from: ['b/end.ts'], to: ['y.ts'] },
          ],
          treeDependencies: [
            { from: ['a'], to: ['b'] },
            { from: ['b'], to: ['a'] },
          ],
        },
        're-entry-prohibition',
        expected
      );
    }
  );

  it('allows an authorized external chain without re-entry or FAF taxonomy', async () => {
    await runScenario(
      { ...externalBase, 'x.ts': "import './y.js';\n" },
      externalConfig,
      're-entry-prohibition',
      []
    );
  });

  type TInducedTreeScenario = {
    readonly description: string;
    readonly expected: readonly TScenarioMessage[];
    readonly files: FileTree;
    readonly publicRootNodes: readonly string[];
    readonly responsiblePart: string;
    readonly rootFragments?: readonly ReturnType<typeof root>[];
    readonly treeDependencies: readonly {
      readonly from: readonly string[];
      readonly to: readonly string[];
    }[];
  };

  const inducedTreeScenarios: readonly TInducedTreeScenario[] = [
    {
      description: 'direct authorized',
      expected: [],
      files: { 'x.ts': "import './b/end.js';\n" },
      publicRootNodes: ['a/end.ts', 'b/end.ts'],
      responsiblePart: 'tree-frontier',
      treeDependencies: [{ from: ['a'], to: ['b'] }],
    },
    {
      description: 'long authorized',
      expected: [],
      files: {
        'x.ts': "import './y.js';\n",
        'y.ts': "import './b/end.js';\n",
      },
      publicRootNodes: ['a/end.ts', 'b/end.ts'],
      responsiblePart: 'tree-frontier',
      treeDependencies: [{ from: ['a'], to: ['b'] }],
    },
    {
      description: 'missing authorization',
      expected: [
        inducedTreeAuthorizationOutcome(['a/start.ts', 'x.ts', 'b/end.ts']),
      ],
      files: { 'x.ts': "import './b/end.js';\n" },
      publicRootNodes: ['a/end.ts', 'b/end.ts'],
      responsiblePart: 'tree-frontier',
      treeDependencies: [],
    },
    {
      description: 'reverse authorization',
      expected: [
        inducedTreeAuthorizationOutcome(['a/start.ts', 'x.ts', 'b/end.ts']),
      ],
      files: { 'x.ts': "import './b/end.js';\n" },
      publicRootNodes: ['a/end.ts', 'b/end.ts'],
      responsiblePart: 'tree-frontier',
      treeDependencies: [{ from: ['b'], to: ['a'] }],
    },
    {
      description: 'unpublished destination',
      expected: [treeOpacityOutcome('./b/end.js')],
      files: { 'x.ts': "import './b/end.js';\n" },
      publicRootNodes: ['a/end.ts'],
      responsiblePart: 'tree-frontier',
      treeDependencies: [{ from: ['a'], to: ['b'] }],
    },
    {
      description: 'reciprocal exercised relations without module cycle',
      expected: [
        cycleOutcome('a/start.ts', 'acyclicity/inter-tree-cycle', [
          ['a/start.ts', 'x.ts', 'b/end.ts'],
          ['b/back.ts', 'a/end.ts'],
        ]),
      ],
      files: {
        'b/back.ts': "import '../a/end.js';\n",
        'x.ts': "import './b/end.js';\n",
      },
      publicRootNodes: ['a/end.ts', 'b/end.ts'],
      responsiblePart: 'acyclicity',
      rootFragments: [
        root('a', ['start.ts', 'end.ts']),
        root('b', ['end.ts', 'back.ts']),
      ],
      treeDependencies: [
        { from: ['a'], to: ['b'] },
        { from: ['b'], to: ['a'] },
      ],
    },
  ];

  it.each(inducedTreeScenarios)(
    'checks an induced Tree dependency: $description',
    async ({
      expected,
      files,
      publicRootNodes,
      responsiblePart,
      rootFragments,
      treeDependencies,
    }) => {
      await runScenario(
        { ...externalBase, ...files },
        {
          ...externalConfig,
          publicRootNodes,
          rootFragments: rootFragments ?? externalConfig.rootFragments,
          treeDependencies,
        },
        responsiblePart,
        expected
      );
    }
  );

  it('does not report a wholly external cycle or classify its files', async () => {
    await runScenario(
      {
        ...externalBase,
        'x.ts': "import './y.js';\n",
        'y.ts': "import './x.js';\n",
      },
      externalConfig,
      'acyclicity',
      []
    );
  });

  it('continues exploring exits from an external strongly connected component', async () => {
    await runScenario(
      {
        ...externalBase,
        'x.ts': "import './y.js';\n",
        'y.ts': "import './x.js';\nimport './a/end.js';\n",
      },
      externalConfig,
      're-entry-prohibition',
      [reEntryOutcome(['a/start.ts', 'x.ts', 'y.ts', 'a/end.ts'])]
    );
  });

  it('rejects a Branch return through external code despite publication', async () => {
    const chain = [branchSource, 'x.ts', 'src/main.ts'];
    await runScenario(
      {
        ...branchTree,
        [branchSource]: "import '../../../x.js';\n",
        'x.ts': "import './src/main.js';\n",
      },
      {
        ...branchConfig,
        externalDependencies: [{ from: [branchSource], to: ['x.ts'] }],
        publicRootNodes: ['src/main.ts'],
      },
      're-entry-prohibition',
      [branchPathOutcome(chain), reEntryOutcome(chain)]
    );
  });

  it('reports unavailable external dependencies instead of assuming a leaf', async () => {
    await runScenario(
      { ...externalBase, 'x.ts': "import './missing.js';\n" },
      externalConfig,
      'collect-modules',
      [unresolvedImportOutcome('x.ts', "Cannot find module './missing.js'")]
    );
  });
});
