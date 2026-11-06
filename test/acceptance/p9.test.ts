import type { FileTree } from 'fs-fixture';

import { beforeAll, describe, it } from 'vitest';

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

const diagnostic = (filePath: string, constraint: string, detail: string) => ({
  column: 1,
  constraint,
  element: filePath,
  filePath,
  line: 1,
  message: `${constraint}: ${detail}`,
  messageId: constraint.split('/', 1)[0] ?? null,
  ruleId: 'faf/conformity',
  severity: 2,
});

const cycle = (constraint: string, paths: readonly string[]) => {
  const source = paths[0] ?? '';
  return diagnostic(
    source,
    constraint,
    `Dependency cycle from '${source}': ${paths.join(' -> ')}.`
  );
};

const treeCycle = (segments: readonly (readonly string[])[]) => {
  const source = segments[0]?.[0] ?? '';
  return diagnostic(
    source,
    'acyclicity/inter-tree-cycle',
    `Tree dependency cycle from '${source}': ${segments.map((segment) => segment.join(' -> ')).join('; ')}.`
  );
};

const dependency = (constraint: string, paths: readonly string[]) => {
  const source = paths[0] ?? '';
  return diagnostic(
    source,
    constraint,
    `Forbidden dependency from '${source}': ${paths.join(' -> ')}.`
  );
};

const runScenario = async (
  tree: FileTree,
  local: Readonly<Record<string, unknown>>,
  responsiblePart: string,
  expected: readonly ReturnType<typeof diagnostic>[]
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

const localExitExpected = (
  permission: string,
  isAllowed: boolean,
  source: string
) => {
  if (permission === 'access')
    return [
      {
        ...diagnostic(
          'fafconfig.ts',
          'configuration/invalid-external-dependency-source',
          `'${source}' must be an authorized logical node in externalDependencies (FAF §7.3).`
        ),
        element: source,
      },
    ];
  return isAllowed
    ? []
    : [dependency('dependency/external-dependencies', [source, 'x.ts'])];
};

const inducedAuthorizations = (relation: string) => {
  if (relation === 'none') return [];
  if (relation === 'reverse') return [{ from: ['b'], to: ['a'] }];
  return [{ from: ['a'], to: ['b'] }];
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
    ['direct parent node', 'src/main.ts', "import '../../main.js';\n"],
    [
      'private Access Node',
      'src/_utils/unit/index.ts',
      "import '../../_utils/unit/index.js';\n",
    ],
    [
      'sibling Category Node',
      'src/_types/other.type.ts',
      "import '../../_types/other.type.js';\n",
    ],
    [
      'child Root Node',
      'src/child/entry.ts',
      "import '../../child/entry.js';\n",
    ],
    [
      'nested sibling Branch node',
      'src/_utils/unit/_unit@shared/_types/deep.type.ts',
      "import '../../_utils/unit/_unit@shared/_types/deep.type.js';\n",
    ],
  ])('rejects a Branch return to a %s', async (_name, target, source) => {
    await runScenario(
      { ...branchTree, [branchSource]: source },
      branchConfig,
      'fractal-branch-unidirectionality',
      [
        dependency('dependency/fractal-branch-unidirectionality', [
          branchSource,
          target,
        ]),
      ]
    );
  });

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
        dependency('dependency/fractal-branch-unidirectionality', [
          'src/_src@shared/_types/last.type.ts',
          'src/_types/other.type.ts',
        ]),
        dependency('dependency/fractal-branch-unidirectionality', [
          'src/_src@shared/_types/middle.type.ts',
          'src/_src@shared/_types/last.type.ts',
          'src/_types/other.type.ts',
        ]),
        dependency('dependency/fractal-branch-unidirectionality', [
          branchSource,
          'src/_src@shared/_types/middle.type.ts',
          'src/_src@shared/_types/last.type.ts',
          'src/_types/other.type.ts',
        ]),
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
        ? [
            cycle('acyclicity/dependency-cycle', paths),
            ...(name === 'self loop'
              ? []
              : [cycle('acyclicity/root-dependency-cycle', paths)]),
          ]
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
      ['acyclicity/dependency-cycle', 'acyclicity/root-dependency-cycle'].map(
        (constraint) =>
          cycle(constraint, ['src/a/main.ts', 'src/b/main.ts', 'src/a/main.ts'])
      )
    );
  });

  it.each(['unreachable modules', 'type-only imports'])(
    'checks cycles among %s',
    async (kind) => {
      const isTypeOnly = kind === 'type-only imports';
      await runScenario(
        {
          'src/_types/a.type.ts': isTypeOnly
            ? "import type { B } from './b.type.js';\nexport type A = B;\n"
            : "import './b.type.js';\nexport type A = string;\n",
          'src/_types/b.type.ts': isTypeOnly
            ? "import type { A } from './a.type.js';\nexport type B = A;\n"
            : "import './a.type.js';\nexport type B = string;\n",
          'src/main.ts': 'export const main = 1;\n',
        },
        { rootFragments: [root('src', ['main.ts'])] },
        'acyclicity',
        [
          cycle('acyclicity/dependency-cycle', [
            'src/_types/a.type.ts',
            'src/_types/b.type.ts',
            'src/_types/a.type.ts',
          ]),
        ]
      );
    }
  );

  it.each([
    ['Fragment Node', 'fragment-encapsulation', 'src/_utils/unit/unit.util.ts'],
    [
      'Sub-Graph Node',
      'sub-graph-node-isolation',
      'src/_utils/unit/unit.spec.ts',
    ],
    ['Foreign Node', 'foreign-node-isolation', 'src/_utils/unit/data.ts'],
  ])(
    'keeps the target prohibition for a descending import to a %s',
    async (_name, part, target) => {
      await runScenario(
        {
          'src/_high/_utils/source/index.ts':
            "export { source } from './source.util.js';\n",
          'src/_high/_utils/source/source.util.ts': `import '../../..${target.slice(3, -3)}.js';\nexport const source = 1;\n`,
          'src/_utils/unit/index.ts':
            "export { unit } from './unit.util.js';\n",
          'src/_utils/unit/unit.util.ts': 'export const unit = 1;\n',
          [target]: 'export const target = 1;\n',
        },
        {
          foreignNodes: target.endsWith('/data.ts') ? [target] : [],
          horizontalHierarchies: [[['_utils'], ['_high']]],
          rootLayers: ['src'],
        },
        part,
        [
          dependency(`dependency/${part}`, [
            'src/_high/_utils/source/source.util.ts',
            target,
          ]),
        ]
      );
    }
  );

  it.each([
    [
      'chain',
      [
        ['a', 'b'],
        ['b', 'c'],
      ],
      false,
    ],
    [
      'diamond',
      [
        ['a', 'b'],
        ['a', 'c'],
        ['b', 'c'],
      ],
      false,
    ],
    [
      'two Trees',
      [
        ['a', 'b'],
        ['b', 'a'],
      ],
      true,
    ],
    [
      'three Trees',
      [
        ['a', 'b'],
        ['b', 'c'],
        ['c', 'a'],
      ],
      true,
    ],
  ] as const)(
    'checks the Tree DAG independently of module cycles: %s',
    async (_name, edges, forbidden) => {
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
        forbidden
          ? [
              treeCycle(
                edges.map(([from, to]) => [
                  `${from}/source.ts`,
                  `${to}/target.ts`,
                ])
              ),
            ]
          : []
      );
    }
  );

  it.each([
    [
      'one external file',
      "import './a/end.js';\n",
      '',
      ['a/start.ts', 'x.ts', 'a/end.ts'],
    ],
    [
      'two external files',
      "import './y.js';\n",
      "import './a/end.js';\n",
      ['a/start.ts', 'x.ts', 'y.ts', 'a/end.ts'],
    ],
    [
      'another Tree',
      "import './b/end.js';\n",
      "import './a/end.js';\n",
      ['a/start.ts', 'x.ts', 'b/end.ts', 'y.ts', 'a/end.ts'],
    ],
  ])('rejects an authorized re-entry through %s', async (name, x, y, paths) => {
    await runScenario(
      {
        ...externalBase,
        'b/end.ts':
          name === 'another Tree'
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
      [dependency('dependency/re-entry-prohibition', paths)]
    );
  });

  it('allows an authorized external chain without re-entry or FAF taxonomy', async () => {
    await runScenario(
      { ...externalBase, 'x.ts': "import './y.js';\n" },
      externalConfig,
      're-entry-prohibition',
      []
    );
  });

  it.each([
    ['direct authorized', false, 'forward', true],
    ['long authorized', true, 'forward', true],
    ['missing authorization', false, 'none', false],
    ['reverse authorization', false, 'reverse', false],
    ['unpublished destination', false, 'private', false],
  ] as const)(
    'checks an induced Tree dependency: %s',
    async (_name, long, relation, allowed) => {
      const paths = [
        'a/start.ts',
        'x.ts',
        ...(long ? ['y.ts'] : []),
        'b/end.ts',
      ];
      await runScenario(
        {
          ...externalBase,
          'x.ts': long ? "import './y.js';\n" : "import './b/end.js';\n",
          'y.ts': long ? "import './b/end.js';\n" : externalBase['y.ts'],
        },
        {
          ...externalConfig,
          publicRootNodes:
            relation === 'private'
              ? ['a/end.ts']
              : externalConfig.publicRootNodes,
          rootFragments: [
            root('a', ['start.ts', 'end.ts']),
            root('b', ['end.ts']),
          ],
          treeDependencies: inducedAuthorizations(relation),
        },
        're-entry-prohibition',
        allowed
          ? []
          : [
              dependency(
                relation === 'private'
                  ? 'dependency/tree-frontier'
                  : 'dependency/induced-tree-dependency',
                paths
              ),
            ]
      );
    }
  );

  it('rejects exercised induced reciprocal relations without a module cycle', async () => {
    await runScenario(
      {
        ...externalBase,
        'b/back.ts': "import '../a/end.js';\n",
        'x.ts': "import './b/end.js';\n",
      },
      {
        ...externalConfig,
        rootFragments: [
          root('a', ['start.ts', 'end.ts']),
          root('b', ['end.ts', 'back.ts']),
        ],
        treeDependencies: [
          { from: ['a'], to: ['b'] },
          { from: ['b'], to: ['a'] },
        ],
      },
      'acyclicity',
      [
        treeCycle([
          ['a/start.ts', 'x.ts', 'b/end.ts'],
          ['b/back.ts', 'a/end.ts'],
        ]),
      ]
    );
  });

  it.each([
    ['no authorization', [], true, false],
    ['forward authorization', [{ from: ['a'], to: ['b'] }], true, true],
    ['reverse authorization', [{ from: ['b'], to: ['a'] }], true, false],
    [
      'transitive authorization',
      [
        { from: ['a'], to: ['c'] },
        { from: ['c'], to: ['b'] },
      ],
      true,
      false,
    ],
    ['unpublished target', [{ from: ['a'], to: ['b'] }], false, false],
  ] as const)(
    'requires both Tree authorization and publication: %s',
    async (_name, pairs, published, allowed) => {
      await runScenario(
        {
          'a/main.ts': "import '../b/main.js';\n",
          'b/main.ts': 'export const main = 1;\n',
          'c/main.ts': 'export const main = 1;\n',
        },
        {
          publicRootNodes: published ? ['b/main.ts'] : [],
          rootFragments: ['a', 'b', 'c'].map((origin) =>
            root(origin, ['main.ts'])
          ),
          treeDependencies: pairs,
        },
        'tree-frontier',
        allowed
          ? []
          : [dependency('dependency/tree-frontier', ['a/main.ts', 'b/main.ts'])]
      );
    }
  );

  it.each([
    ['Root Node', 'a/main.ts', false],
    ['Fragment Node', 'a/_utils/unit/unit.util.ts', false],
    ['Sub-Graph Node', 'a/_utils/unit/unit.spec.ts', false],
    ['Category Node', 'a/_types/local.type.ts', false],
    [
      'private Fragment Node',
      'a/_utils/unit/_utils/helper/helper.util.ts',
      false,
    ],
    ['Branch Category Node', 'a/_a@shared/_types/local.type.ts', false],
    ['Access Node', 'a/_utils/unit/index.ts', true],
  ] as const)(
    'checks an authorized inter-Tree import from a %s',
    async (_name, source, forbidden) => {
      await runScenario(
        {
          'a/_utils/unit/_utils/helper/helper.util.ts':
            'export const helper = 1;\n',
          'a/_utils/unit/_utils/helper/index.ts':
            "export { helper } from './helper.util.js';\n",
          'a/_utils/unit/index.ts': "export { unit } from './unit.util.js';\n",
          'a/_utils/unit/unit.util.ts': 'export const unit = 1;\n',
          'a/main.ts': 'export const main = 1;\n',
          'b/main.ts': 'export const main = 1;\n',
          [source]: `import '${'../'.repeat(source.split('/').length - 1)}b/main.js';\n`,
        },
        {
          publicRootNodes: ['b/main.ts'],
          rootFragments: [root('a', ['main.ts']), root('b', ['main.ts'])],
          treeDependencies: [{ from: ['a'], to: ['b'] }],
        },
        forbidden ? 'access-node-contract' : 'tree-frontier',
        forbidden
          ? [
              dependency('dependency/access-node-contract', [
                source,
                'b/main.ts',
              ]),
            ]
          : []
      );
    }
  );

  it('allows a Root Node to import and re-export across an authorized Tree boundary without file-pair authorization', async () => {
    await runScenario(
      {
        'a/main.ts': "export { main } from '../b/main.js';\n",
        'b/main.ts': 'export const main = 1;\n',
      },
      {
        publicRootNodes: ['b/main.ts'],
        rootFragments: [root('a', ['main.ts']), root('b', ['main.ts'])],
        treeDependencies: [{ from: ['a'], to: ['b'] }],
      },
      'tree-frontier',
      []
    );
  });

  it('does not let Tree authorization permit an explicit-Role re-export', async () => {
    const source = 'a/_types/local.type.ts';
    await runScenario(
      {
        'b/main.ts': 'export const main = 1;\n',
        [source]: "export { main } from '../../b/main.js';\n",
      },
      {
        publicRootNodes: ['b/main.ts'],
        rootFragments: [root('a', []), root('b', ['main.ts'])],
        treeDependencies: [{ from: ['a'], to: ['b'] }],
      },
      're-export-prohibition',
      [
        diagnostic(
          source,
          'symbol/re-export-prohibition',
          `Explicit-Role node '${source}' must not re-export imported Symbols.`
        ),
      ]
    );
  });

  it.each([
    ['published Root Node', 'a/main.ts', true],
    ['structural Category Node', 'layer/_types/public.type.ts', true],
    ['unpublished Root Node', 'a/private.ts', false],
  ] as const)(
    'checks external ingress to a %s without assigning taxonomy to the caller',
    async (_name, target, allowed) => {
      await runScenario(
        {
          'a/main.ts': 'export const main = 1;\n',
          'a/private.ts': 'export const hidden = 1;\n',
          'layer/_types/public.type.ts': 'export type Public = string;\n',
          'outside.ts': `import './${target.slice(0, -3)}.js';\n`,
        },
        {
          publicRootNodes: ['a/main.ts'],
          rootFragments: [root('a', ['main.ts', 'private.ts'])],
          rootLayers: ['layer'],
        },
        'tree-frontier',
        allowed
          ? []
          : [dependency('dependency/tree-frontier', ['outside.ts', target])]
      );
    }
  );

  it.each([
    ['missing permission', 'none', false],
    ['exact permission', 'exact', true],
    ['different consumer', 'consumer', false],
    ['different destination', 'destination', false],
    ['Access Node', 'access', false],
  ] as const)(
    'checks a local exit with %s',
    async (_name, permission, allowed) => {
      const source =
        permission === 'access' ? 'a/_utils/unit/index.ts' : 'a/main.ts';
      const specifier = permission === 'access' ? '../../../x.js' : '../x.js';
      await runScenario(
        {
          'a/_utils/unit/index.ts': "export { unit } from './unit.util.js';\n",
          'a/_utils/unit/unit.util.ts': 'export const unit = 1;\n',
          'a/main.ts': 'export const main = 1;\n',
          'a/other.ts': 'export const other = 1;\n',
          [source]: `import '${specifier}';\n`,
          'x.ts': 'export const x = 1;\n',
          'y.ts': 'export const y = 1;\n',
        },
        {
          externalDependencies:
            permission === 'none'
              ? []
              : [
                  {
                    from: [permission === 'consumer' ? 'a/other.ts' : source],
                    to: [permission === 'destination' ? 'y.ts' : 'x.ts'],
                  },
                ],
          rootFragments: [root('a', ['main.ts', 'other.ts'])],
        },
        permission === 'access' ? 'classify-taxonomy' : 'external-dependencies',
        localExitExpected(permission, allowed, source)
      );
    }
  );

  it.each(['Fragment', 'Category Node'])(
    'checks the static adapter contract for a %s without claiming semantic qualification',
    async (form) => {
      const source =
        form === 'Fragment'
          ? 'a/_utils/adapter/adapter.util.ts'
          : 'a/_types/adapter.type.ts';
      const entry = form === 'Fragment' ? 'a/_utils/adapter/index.ts' : source;
      await runScenario(
        {
          'a/_utils/adapter/adapter.util.ts': 'export const adapter = 1;\n',
          'a/_utils/adapter/index.ts':
            "export { adapter } from './adapter.util.js';\n",
          'a/main.ts': `import './${entry.slice(2, -3)}.js';\nimport '../x.js';\n`,
          [source]: `import '${'../'.repeat(source.split('/').length - 1)}x.js';\nexport const adapter = 1;\n`,
          'x.ts': 'export const x = 1;\n',
        },
        {
          externalDependencies: [{ from: [source], to: ['x.ts'] }],
          rootFragments: [root('a', ['main.ts'])],
        },
        'external-dependencies',
        [
          {
            ...dependency('dependency/external-dependencies', [
              'a/main.ts',
              'x.ts',
            ]),
            line: 2,
          },
        ]
      );
    }
  );

  it('requires permission for a local workspace package but not a library sink', async () => {
    await runScenario(
      {
        'a/main.ts': "import 'workspace-local';\nimport 'node:path';\n",
        'package.json': JSON.stringify({
          exports: './workspace/main.ts',
          name: 'workspace-local',
          type: 'module',
        }),
        'workspace/main.ts': 'export const main = 1;\n',
      },
      { rootFragments: [root('a', ['main.ts'])] },
      'external-dependencies',
      [
        dependency('dependency/external-dependencies', [
          'a/main.ts',
          'workspace/main.ts',
        ]),
      ]
    );
  });

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
      [
        dependency('dependency/re-entry-prohibition', [
          'a/start.ts',
          'x.ts',
          'y.ts',
          'a/end.ts',
        ]),
      ]
    );
  });

  it('rejects a Branch return through external code despite publication', async () => {
    const paths = [branchSource, 'x.ts', 'src/main.ts'];
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
      [
        dependency('dependency/fractal-branch-unidirectionality', paths),
        dependency('dependency/re-entry-prohibition', paths),
      ]
    );
  });

  it('reports unavailable external dependencies instead of assuming a leaf', async () => {
    await runScenario(
      { ...externalBase, 'x.ts': "import './missing.js';\n" },
      externalConfig,
      'collect-modules',
      [
        diagnostic(
          'x.ts',
          'unverified/unresolved-import',
          "'x.ts' contains an import that could not be resolved: Cannot find module './missing.js' (D-08)."
        ),
      ]
    );
  });
});
