import nodePath from 'node:path';
import { beforeAll, describe, it } from 'vitest';

import type { TFAFLocalConfig, TFAFRoles } from '../../src/main.js';
import type { TScenarioMessage } from '../support/acceptance-project.js';

import {
  createProject,
  expectScenario,
  lintScenario,
  warmupESLint,
} from '../support/acceptance-project.js';

const roles: TFAFRoles = [
  [
    { category: '_fonts', implicitRoleExtensions: ['.woff2'], name: 'font' },
    { category: '_images', implicitRoleExtensions: ['.png'], name: 'image' },
  ],
  [
    { category: '_markups', name: 'markup' },
    { category: '_modules', name: 'module' },
    { category: '_styles', name: 'style' },
  ],
  { category: '_constants', name: 'constant' },
  { category: '_models', name: 'model' },
  { category: '_recipes', name: 'recipe' },
  { category: '_schemas', name: 'schema' },
  { category: '_types', isCategoryNode: true, name: 'type' },
  { category: '_errors', name: 'error' },
  { category: '_mocks', name: 'mock' },
  { category: '_configs', name: 'config' },
  { category: '_styled', name: 'styled' },
  { category: '_utils', name: 'util' },
  { category: '_classes', name: 'class' },
  { category: '_factories', name: 'factory' },
  { category: '_instances', name: 'instance' },
  [
    { category: '_controllers', name: 'controller' },
    { category: '_handlers', name: 'handler' },
    { category: '_hooks', name: 'hook' },
  ],
  [
    { category: '_apis', name: 'api' },
    { category: '_components', name: 'component' },
    { category: '_contexts', name: 'context' },
    { category: '_jobs', name: 'job' },
    { category: '_layouts', name: 'layout' },
    { category: '_middlewares', name: 'middleware' },
    { category: '_pages', name: 'page' },
    { category: '_repositories', name: 'repository' },
    { category: '_routes', name: 'route' },
    { category: '_routers', name: 'router' },
    { category: '_services', name: 'service' },
    { category: '_stores', name: 'store' },
  ],
];

const table = 'src/_src@shared/_components/table';
const body = `${table}/_components/table-body`;
const context = `${table}/_table@shared/_contexts/table-context`;
const reader = `${table}/_components/_components@shared/_hooks/use-table-context`;
const sorter = `${table}/_utils/sort-table-rows`;
const sortType = `${table}/_table@shared/_types/table-sort.type.ts`;
const value = 'export const value = 1;\n';
const tableTree: Readonly<Record<string, string>> = {
  [`${body}/_utils/deep/deep.util.ts`]: value,
  [`${body}/_utils/deep/index.ts`]: "export { value } from './deep.util.js';\n",
  [`${body}/index.ts`]: "export { value } from './table-body.component.js';\n",
  [`${body}/table-body.component.ts`]: value,
  [`${body}/table-body.recipe.ts`]: value,
  [`${body}/table-body.spec.ts`]: value,
  [`${body}/table-body.type.ts`]: value,
  [`${context}/index.ts`]:
    "export { value } from './table-context.context.js';\n",
  [`${context}/table-context.context.ts`]: value,
  [`${context}/table-context.type.ts`]: value,
  [`${reader}/index.ts`]:
    "export { value } from './use-table-context.hook.js';\n",
  [`${reader}/use-table-context.hook.ts`]: value,
  [`${sorter}/index.ts`]:
    "export { value } from './sort-table-rows.util.js';\n",
  [`${sorter}/sort-table-rows.spec.ts`]: value,
  [`${sorter}/sort-table-rows.type.ts`]: value,
  [`${sorter}/sort-table-rows.util.ts`]: value,
  [`${table}/_components/table-cell/index.ts`]:
    "export { value } from './table-cell.component.js';\n",
  [`${table}/_components/table-cell/table-cell.component.ts`]: value,
  [`${table}/_components/table-cell/table-cell.recipe.ts`]: value,
  [`${table}/_components/table-cell/table-cell.type.ts`]: value,
  [`${table}/_components/table-head/index.ts`]:
    "export { value } from './table-head.component.js';\n",
  [`${table}/_components/table-head/table-head.component.ts`]: value,
  [`${table}/_components/table-head/table-head.recipe.ts`]: value,
  [`${table}/_components/table-head/table-head.type.ts`]: value,
  [`${table}/_components/table-header-cell/index.ts`]:
    "export { value } from './table-header-cell.component.js';\n",
  [`${table}/_components/table-header-cell/table-header-cell.component.ts`]:
    value,
  [`${table}/_components/table-header-cell/table-header-cell.hook.ts`]: value,
  [`${table}/_components/table-header-cell/table-header-cell.recipe.ts`]: value,
  [`${table}/_components/table-header-cell/table-header-cell.type.ts`]: value,
  [`${table}/_components/table-row/index.ts`]:
    "export { value } from './table-row.component.js';\n",
  [`${table}/_components/table-row/table-row.component.ts`]: value,
  [`${table}/_components/table-row/table-row.recipe.ts`]: value,
  [`${table}/_components/table-row/table-row.type.ts`]: value,
  [`${table}/index.ts`]: "export { value } from './table.component.js';\n",
  [`${table}/table.component.ts`]: value,
  [`${table}/table.hook.ts`]: value,
  [`${table}/table.recipe.ts`]: value,
  [`${table}/table.spec.ts`]: value,
  [`${table}/table.type.ts`]: value,
  [sortType]: value,
  'src/app/_app@shared/_types/local.type.ts': value,
  'src/app/_components/shell/index.ts':
    "export { value } from './shell.component.js';\n",
  'src/app/_components/shell/shell.component.ts': value,
  'src/app/app.ts': value,
  'src/main.ts': value,
};

const local: TFAFLocalConfig = {
  localHorizontalHierarchies: [
    {
      hierarchies: [['_types'], ['_contexts']],
      paths: [`${table}/_table@shared`],
    },
  ],
  roles,
  rootFragments: [
    {
      path: 'src',
      rootNodes: [['main.ts']],
      subRootFragments: [{ path: 'src/app', rootNodes: [['app.ts']] }],
    },
  ],
  subGraphRoles: [{ name: 'spec' }, { name: 'story' }],
};

const dependency = (
  source: string,
  destination: string,
  part: string,
  line = 1,
  column = 1
): TScenarioMessage => ({
  column,
  constraint: `dependency/${part}`,
  element: source,
  filePath: source,
  line,
  message: `dependency/${part}: Import from '${source}' to '${destination}' violates ${part}.`,
  messageId: 'dependency',
  ruleId: 'faf/conformity',
  severity: 2,
});

const specifier = (source: string, destination: string): string => {
  const relative = nodePath.posix.relative(
    nodePath.posix.dirname(source),
    destination
  );
  return relative.startsWith('.') ? relative : `./${relative}`;
};

const children = [
  'table-body',
  'table-cell',
  'table-head',
  'table-header-cell',
  'table-row',
];

const tableArcs = [
  ...children.flatMap((child) => [
    {
      destination: `${table}/_components/${child}/index.ts`,
      name: `aggregates ${child} through its Access Node`,
      part: 'private-category-visibility',
      source: `${table}/table.component.ts`,
      violations: [],
    },
    {
      destination: `${table}/_components/${child}/${child}.component.ts`,
      name: `does not bypass the public interface of ${child}`,
      part: 'fragment-encapsulation',
      source: `${table}/table.component.ts`,
      violations: ['fragment-encapsulation'],
    },
  ]),
  ...children.flatMap((from) =>
    children
      .filter((to) => from !== to)
      .flatMap((to) =>
        ['index.ts', `${to}.component.ts`].map((target) => ({
          destination: `${table}/_components/${to}/${target}`,
          name: `isolates ${from} from ${to}/${target}`,
          part: 'peer-separation',
          source: `${table}/_components/${from}/${from}.component.ts`,
          violations:
            target === 'index.ts'
              ? ['peer-separation']
              : ['fragment-encapsulation', 'peer-separation'],
        }))
      )
  ),
  ...(
    [
      ['_components/table-body/table-body.component.ts', []],
      ['_components/table-cell/table-cell.component.ts', []],
      ['_components/table-head/table-head.component.ts', []],
      ['_components/table-header-cell/table-header-cell.component.ts', []],
      ['_components/table-header-cell/table-header-cell.hook.ts', []],
      ['_components/table-row/table-row.component.ts', []],
      ['_components/table-row/index.ts', ['access-node-contract']],
      ['table.component.ts', ['fractal-branch-visibility']],
      ['table.hook.ts', ['fractal-branch-visibility']],
      ['table.spec.ts', ['fractal-branch-visibility']],
      [
        'index.ts',
        [
          'access-node-contract',
          'fractal-branch-visibility',
          'private-category-visibility',
        ],
      ],
      [
        '_utils/sort-table-rows/sort-table-rows.util.ts',
        [
          'fractal-branch-visibility',
          'peer-separation',
          'private-category-visibility',
        ],
      ],
      [
        '_table@shared/_contexts/table-context/table-context.context.ts',
        [
          'fractal-branch-unidirectionality',
          'fractal-branch-visibility',
          'peer-separation',
          'private-category-visibility',
        ],
      ],
    ] as const
  ).map(([source, violations]) => ({
    destination: `${reader}/index.ts`,
    name: `limits the reading hook to its scope for ${source}`,
    part:
      source === '_components/table-row/index.ts' || source === 'index.ts'
        ? 'access-node-contract'
        : 'fractal-branch-visibility',
    source: `${table}/${source}`,
    violations,
  })),
  ...(
    [
      [`${table}/table.component.ts`, `${context}/index.ts`, []],
      [`${table}/table.hook.ts`, `${context}/index.ts`, []],
      [`${body}/table-body.component.ts`, `${context}/index.ts`, []],
      [`${reader}/use-table-context.hook.ts`, `${context}/index.ts`, []],
      [`${sorter}/sort-table-rows.util.ts`, sortType, []],
      [`${sorter}/sort-table-rows.type.ts`, sortType, []],
      [`${context}/table-context.context.ts`, sortType, []],
      [`${context}/table-context.type.ts`, sortType, []],
      [sortType, `${context}/index.ts`, ['peer-separation']],
      [
        `${table}/index.ts`,
        `${context}/index.ts`,
        ['access-node-contract', 'fractal-branch-visibility'],
      ],
      [
        `${table}/index.ts`,
        sortType,
        ['access-node-contract', 'fractal-branch-visibility'],
      ],
    ] as const
  ).map(([source, destination, violations]) => ({
    destination: destination,
    name: `checks apical sharing ${source} to ${destination}`,
    part:
      source === `${table}/index.ts`
        ? 'access-node-contract'
        : 'peer-separation',
    source: source,
    violations,
  })),
  ...[
    `${table}/_components/table-header-cell/table-header-cell.hook.ts`,
    `${reader}/use-table-context.hook.ts`,
    `${context}/table-context.context.ts`,
    `${sorter}/sort-table-rows.util.ts`,
  ].flatMap((source) =>
    ['type', 'hook'].map((role) => ({
      destination: `${table}/table.${role}.ts`,
      name: `prevents details returning from ${source} to table.${role}.ts`,
      part:
        source === `${context}/table-context.context.ts`
          ? 'fractal-branch-unidirectionality'
          : 'private-category-visibility',
      source,
      violations: [
        ...(source === `${context}/table-context.context.ts` ||
        source === `${reader}/use-table-context.hook.ts`
          ? ['fractal-branch-unidirectionality']
          : []),
        ...(source === `${context}/table-context.context.ts`
          ? []
          : ['private-category-visibility']),
      ],
    }))
  ),
] as const;

const boundaryArcs = [
  ...(
    [
      [`${table}/table.component.ts`, []],
      [`${table}/table.spec.ts`, []],
      [
        `${table}/index.ts`,
        ['access-node-contract', 'private-category-visibility'],
      ],
      [
        `${sorter}/sort-table-rows.util.ts`,
        ['peer-separation', 'private-category-visibility'],
      ],
      [
        `${context}/table-context.context.ts`,
        [
          'fractal-branch-unidirectionality',
          'peer-separation',
          'private-category-visibility',
        ],
      ],
      ['src/main.ts', ['private-category-visibility']],
    ] as const
  ).map(([source, violations]) => ({
    destination: `${body}/index.ts`,
    name: `checks automatic Fragment privacy for ${source}`,
    part:
      source === `${table}/index.ts`
        ? 'access-node-contract'
        : 'private-category-visibility',
    source,
    violations,
  })),
  ...(
    [
      ['src/app/app.ts', []],
      ['src/main.ts', ['private-category-visibility']],
      [
        'src/app/_app@shared/_types/local.type.ts',
        [
          'fractal-branch-unidirectionality',
          'peer-separation',
          'private-category-visibility',
        ],
      ],
      [`${table}/table.component.ts`, ['private-category-visibility']],
    ] as const
  ).map(([source, violations]) => ({
    destination: 'src/app/_components/shell/index.ts',
    name: `checks Root Fragment privacy for ${source}`,
    part: 'private-category-visibility',
    source,
    violations,
  })),
  ...(
    [
      [`${table}/table.component.ts`, []],
      [`${table}/table.spec.ts`, []],
      [`${body}/table-body.component.ts`, []],
      [`${reader}/use-table-context.hook.ts`, []],
      [
        `${table}/index.ts`,
        ['access-node-contract', 'fractal-branch-visibility'],
      ],
      ['src/main.ts', ['fractal-branch-visibility']],
    ] as const
  ).map(([source, violations]) => ({
    destination: `${context}/index.ts`,
    name: `checks local Branch consumers for ${source}`,
    part:
      source === `${table}/index.ts`
        ? 'access-node-contract'
        : 'fractal-branch-visibility',
    source,
    violations,
  })),
  ...[
    'src/main.ts',
    'src/app/app.ts',
    'src/app/_components/shell/shell.component.ts',
    'src/app/_app@shared/_types/local.type.ts',
  ].map((source) => ({
    destination: `${table}/index.ts`,
    name: `exposes the apical Branch recursively to ${source}`,
    part: 'fractal-branch-visibility',
    source,
    violations: [],
  })),
  {
    destination: 'src/app/_app@shared/_types/local.type.ts',
    name: 'stops visibility at the nested Root Fragment Branch',
    part: 'fractal-branch-visibility',
    source: 'src/main.ts',
    violations: ['fractal-branch-visibility'],
  },
  {
    destination: `${body}/_utils/deep/index.ts`,
    name: 'does not carry parent authorization through a second Private Category',
    part: 'private-category-visibility',
    source: `${table}/table.component.ts`,
    violations: ['private-category-visibility'],
  },
  ...['table.component.ts', 'table.type.ts'].map((target) => ({
    destination: `${table}/${target}`,
    name: `encapsulates the public Fragment Node ${target} against a Root consumer`,
    part: 'fragment-encapsulation',
    source: 'src/main.ts',
    violations: ['fragment-encapsulation'],
  })),
  ...(
    [
      [`${body}/table-body.component.ts`, ['peer-separation']],
      [`${body}/index.ts`, ['access-node-contract', 'peer-separation']],
      [`${body}/table-body.spec.ts`, ['peer-separation']],
      [`${body}/_utils/deep/deep.util.ts`, ['private-category-visibility']],
      ['src/main.ts', []],
      [`${table}/table.spec.ts`, []],
    ] as const
  ).map(([source, others]) => ({
    destination: `${body}/table-body.story.ts`,
    name: `forbids importing a Sub-Graph Node from ${source}`,
    part: 'sub-graph-node-isolation',
    source,
    violations: [...others, 'sub-graph-node-isolation'],
  })),
] as const;

const foreignTree = {
  'external.ts': value,
  'other/main.ts': value,
  'src/_tooling/_fixtures/sample.ts': value,
  'src/foreign.ts': value,
  'src/globals.d.ts': 'declare const ambient: string;\n',
  'src/main.ts': value,
  'src/vite-env.d.ts': 'export {};\n',
  'src/vitest-setup.ts': value,
};
const foreignLocal: TFAFLocalConfig = {
  externalDependencies: [{ from: ['src/main.ts'], to: ['external.ts'] }],
  foreignDomains: ['src/_tooling'],
  foreignNodes: [
    'src/foreign.ts',
    'src/globals.d.ts',
    'src/vite-env.d.ts',
    'src/vitest-setup.ts',
  ],
  roles: [],
  rootFragments: [
    { path: 'src', rootNodes: [['main.ts']] },
    { path: 'other', rootNodes: [['main.ts']] },
  ],
};

const foreignArcs = [
  ['src/foreign.ts', 'src/main.ts', false],
  ['src/foreign.ts', 'other/main.ts', false],
  ['src/foreign.ts', 'src/vitest-setup.ts', false],
  ['src/foreign.ts', 'external.ts', false],
  ['src/main.ts', 'src/foreign.ts', false],
  ['src/main.ts', 'src/foreign.ts', true],
  ['external.ts', 'src/foreign.ts', false],
  ['src/foreign.ts', 'src/main.ts', true],
  ['src/globals.d.ts', 'src/main.ts', false],
  ['src/vite-env.d.ts', 'src/main.ts', false],
  ['src/vitest-setup.ts', 'src/main.ts', false],
  ['src/_tooling/_fixtures/sample.ts', 'src/main.ts', false],
] as const;

describe('acceptance: Foreign Node isolation', () => {
  beforeAll(warmupESLint, 120_000);

  it.each(foreignArcs)(
    'rejects the local relation %s to %s (re-export: %s)',
    async (source, destination, reExport) => {
      const operation = reExport
        ? `export { value } from '${specifier(source, destination)}';\n`
        : `import '${specifier(source, destination)}';\n`;
      const fixture = await createProject(
        {
          ...foreignTree,
          [source]: operation,
          'src/main.ts':
            source === 'external.ts' ? "import '../external.ts';\n" : value,
        },
        { faf: { locals: [foreignLocal] } }
      );
      try {
        expectScenario(
          await lintScenario(fixture.path),
          'foreign-node-isolation',
          [dependency(source, destination, 'foreign-node-isolation')]
        );
      } finally {
        await fixture.rm();
      }
    }
  );

  it.each([
    ['ambient declarations', 'declare const ambient: string;\n'],
    ['empty export', 'export {};\n'],
    ['local Symbol', value],
    ['external library import', "import 'node:fs';\n"],
    ['external library re-export', "export { join } from 'node:path';\n"],
  ])(
    'does not confuse %s with an edge between codebase files',
    async (_name, content) => {
      const fixture = await createProject(
        { ...foreignTree, 'src/foreign.ts': content },
        { faf: { locals: [foreignLocal] } }
      );
      try {
        expectScenario(
          await lintScenario(fixture.path),
          'foreign-node-isolation',
          []
        );
      } finally {
        await fixture.rm();
      }
    }
  );

  it('keeps nested Foreign Domains Foreign without interpreting their names as Roles', async () => {
    const fixture = await createProject(foreignTree, {
      faf: { locals: [foreignLocal] },
    });
    try {
      expectScenario(
        await lintScenario(fixture.path),
        'containment-matrix',
        []
      );
    } finally {
      await fixture.rm();
    }
  });

  it('does not classify an undesignated tooling Layer as Foreign', async () => {
    const fixture = await createProject(
      {
        'src/_tooling/_utils/tool/index.ts':
          "export { value } from './tool.util.js';\n",
        'src/_tooling/_utils/tool/tool.util.ts': value,
      },
      {
        faf: {
          locals: [
            {
              roles: [{ category: '_utils', name: 'util' }],
              rootLayers: ['src'],
            },
          ],
        },
      }
    );
    try {
      expectScenario(
        await lintScenario(fixture.path),
        'foreign-node-isolation',
        []
      );
    } finally {
      await fixture.rm();
    }
  });
});

const internalRanks = [
  ['component', 'hook', true],
  ['component', 'type', true],
  ['hook', 'constant', true],
  ['type', 'component', false],
  ['hook', 'handler', false],
  ['handler', 'hook', false],
  ['index', 'component', true],
  ['spec', 'component', true],
  ['story', 'type', true],
  ['component', 'index', false],
  ['spec', 'index', false],
  ['story', 'index', false],
  ['index', 'spec', false],
  ['spec', 'story', false],
  ['markup', 'constant', false],
  ['constant', 'markup', true],
  ['module', 'constant', false],
  ['style', 'constant', false],
  ['constant', 'module', true],
  ['constant', 'style', true],
  ['module', 'font', true],
  ['font', 'image', false],
  ['module', 'style', false],
  ['markup', 'module', false],
  ['recipe', 'model', true],
  ['type', 'schema', true],
  ['schema', 'type', false],
  ['error', 'type', true],
  ['type', 'error', false],
  ['mock', 'error', true],
  ['util', 'styled', true],
  ['class', 'util', true],
  ['factory', 'class', true],
  ['instance', 'factory', true],
  ['hook', 'instance', true],
  ['job', 'handler', true],
  ['handler', 'job', false],
  ['component', 'context', false],
  ['context', 'component', false],
  ['service', 'repository', false],
  ['job', 'service', false],
  ['index', 'job', true],
] as const;

const nodeFile = (role: string): string =>
  role === 'index' ? 'index.ts' : `unit.${role}.ts`;

const orderedTree: Readonly<Record<string, string>> = {
  'src/_components/_atoms/unit/index.ts':
    "export { value } from './unit.component.js';\n",
  'src/_components/_atoms/unit/unit.component.ts': value,
  'src/_components/_atoms/unit/unit.type.ts': value,
  'src/_components/_molecules/consumer/consumer.component.ts': value,
  'src/_components/_molecules/consumer/consumer.type.ts': value,
  'src/_components/_molecules/consumer/index.ts':
    "export { value } from './consumer.component.js';\n",
  'src/_high/_types/consumer.type.ts': value,
  'src/_low/_components/unit/index.ts':
    "export { value } from './unit.component.js';\n",
  'src/_low/_components/unit/unit.component.ts': value,
  'src/_low/_components/unit/unit.type.ts': value,
};
const orderedLocal: TFAFLocalConfig = {
  horizontalHierarchies: [
    [['_atoms'], ['_molecules']],
    [['_low'], ['_high']],
  ],
  roles,
  rootLayers: ['src'],
};

describe('acceptance: declarations and classification boundaries', () => {
  beforeAll(warmupESLint, 120_000);

  it.each([
    [
      'privateCategories',
      { ...local, privateCategories: { [table + '/_components']: false } },
      'Unknown property "privateCategories" is forbidden.',
    ],
    [
      'Access Node Rank',
      { ...local, accessNodeRank: 0 },
      'Unknown property "accessNodeRank" is forbidden.',
    ],
    [
      'Sub-Graph Role Rank',
      { ...local, subGraphRoles: [{ name: 'spec', rank: 0 }] },
      'Unknown property "rank" is forbidden on sub-graph role.',
    ],
  ] as const)(
    'rejects a declaration that tries to redefine %s',
    async (_name, declaration, message) => {
      const fixture = await createProject(tableTree, {
        faf: { locals: [declaration] },
      });
      try {
        expectScenario(
          await lintScenario(fixture.path),
          'validate-config-format',
          [
            {
              column: 1,
              constraint: 'configuration/unknown-property',
              element: 'fafconfig.ts',
              filePath: 'fafconfig.ts',
              line: 1,
              message: `configuration/unknown-property: ${message}`,
              messageId: 'configuration',
              ruleId: 'faf/conformity',
              severity: 2,
            },
          ]
        );
      } finally {
        await fixture.rm();
      }
    }
  );

  it.each([
    'src/Foreign File.ts',
    `${table}/Foreign File.ts`,
    `${table}/_components/Foreign File.ts`,
    `${table}/_table@shared/Foreign File.ts`,
    `${body}/_table-body@shared/_layer/Foreign File.ts`,
    `${table}/_table@shared/_configs/_primitives/Foreign File.ts`,
    `${table}/_table@shared/_pages/users/Foreign File.ts`,
    'src/_tooling/_fixtures/Foreign File.ts',
  ])(
    'admits a designated Foreign Node without Role or Logical Node cardinality at %s',
    async (path) => {
      const isTooling = path.startsWith('src/_tooling');
      const isMimetic = path.includes('_pages');
      const fixture = await createProject(
        { ...tableTree, [path]: value },
        {
          faf: {
            locals: [
              {
                ...local,
                ...(isTooling && { foreignDomains: ['src/_tooling'] }),
                foreignNodes: [
                  { paths: ['src'], patterns: ['Foreign File.ts'] },
                ],
                ...(isMimetic && {
                  mimeticPathStructures: [
                    { paths: [`${table}/_table@shared/_pages`] },
                  ],
                }),
              },
            ],
          },
        }
      );
      try {
        expectScenario(
          await lintScenario(fixture.path),
          'containment-matrix',
          []
        );
      } finally {
        await fixture.rm();
      }
    }
  );

  it('admits a Foreign Node directly in a Root Layer', async () => {
    const fixture = await createProject(
      { 'src/Foreign File.ts': value },
      {
        faf: {
          locals: [
            {
              foreignNodes: ['src/Foreign File.ts'],
              roles: [],
              rootLayers: ['src'],
            },
          ],
        },
      }
    );
    try {
      expectScenario(
        await lintScenario(fixture.path),
        'containment-matrix',
        []
      );
    } finally {
      await fixture.rm();
    }
  });

  it('derives a common top Rank from a custom catalog without imposing the reference model', async () => {
    const fixture = await createProject(
      {
        'src/_utils/unit/index.ts': "export { value } from './unit.util.js';\n",
        'src/_utils/unit/unit.spec.ts':
          "import './unit.util.ts';\nimport './unit.type.ts';\n",
        'src/_utils/unit/unit.story.ts': "import './unit.type.ts';\n",
        'src/_utils/unit/unit.type.ts': value,
        'src/_utils/unit/unit.util.ts':
          "import './unit.type.ts';\nexport const value = 1;\n",
      },
      {
        faf: {
          locals: [
            {
              roles: [
                { category: '_types', isCategoryNode: true, name: 'type' },
                { category: '_utils', name: 'util' },
              ],
              rootLayers: ['src'],
              subGraphRoles: [{ name: 'spec' }, { name: 'story' }],
            },
          ],
        },
      }
    );
    try {
      expectScenario(await lintScenario(fixture.path), 'peer-separation', []);
    } finally {
      await fixture.rm();
    }
  });

  it('allows same-Rank local responsibilities to coexist without claiming semantic cohesion', async () => {
    const fixture = await createProject(
      {
        'src/_components/unit/index.ts':
          "export { value } from './unit.component.js';\n",
        'src/_components/unit/unit.component.ts': value,
        'src/_components/unit/unit.controller.ts': "import './unit.type.ts';\n",
        'src/_components/unit/unit.handler.ts': "import './unit.type.ts';\n",
        'src/_components/unit/unit.hook.ts': "import './unit.type.ts';\n",
        'src/_components/unit/unit.type.ts': value,
      },
      { faf: { locals: [{ roles, rootLayers: ['src'] }] } }
    );
    try {
      expectScenario(await lintScenario(fixture.path), 'peer-separation', []);
    } finally {
      await fixture.rm();
    }
  });
});

describe('acceptance: sibling hierarchies and recursive boundaries', () => {
  beforeAll(warmupESLint, 120_000);

  it.each([
    [
      'src/_components/_molecules/consumer/consumer.component.ts',
      'src/_components/_atoms/unit',
    ],
    [
      'src/_components/_molecules/consumer/consumer.type.ts',
      'src/_components/_atoms/unit',
    ],
    ['src/_high/_types/consumer.type.ts', 'src/_low/_components/unit'],
  ])(
    'does not expose Fragment Nodes to the ordered consumer %s',
    async (source, target) => {
      const fixture = await createProject(
        {
          ...orderedTree,
          [source]:
            ['index.ts', 'unit.component.ts', 'unit.type.ts']
              .map(
                (file) =>
                  `import '${specifier(source, target + '/' + file)}';\n`
              )
              .join('') + value,
        },
        { faf: { locals: [orderedLocal] } }
      );
      try {
        expectScenario(
          await lintScenario(fixture.path),
          'fragment-encapsulation',
          [
            dependency(
              source,
              `${target}/unit.component.ts`,
              'fragment-encapsulation',
              2
            ),
            dependency(
              source,
              `${target}/unit.type.ts`,
              'fragment-encapsulation',
              3
            ),
          ]
        );
      } finally {
        await fixture.rm();
      }
    }
  );

  it('orders Sub-Categories within a Private Category without applying direct-parent restrictions internally', async () => {
    const source = 'src/_components/_molecules/consumer/consumer.type.ts';
    const destination = 'src/_components/_atoms/unit/index.ts';
    const fixture = await createProject(
      {
        [source]: `import '${specifier(source, destination)}';\n${value}`,
        'src/_components/_atoms/unit/index.ts':
          "export { value } from './unit.component.js';\n",
        'src/_components/_atoms/unit/unit.component.ts': value,
        'src/_components/_molecules/consumer/consumer.component.ts': value,
        'src/_components/_molecules/consumer/index.ts':
          "export { value } from './consumer.component.js';\n",
      },
      {
        faf: {
          locals: [
            {
              horizontalHierarchies: [[['_atoms'], ['_molecules']]],
              roles,
              rootFragments: [{ path: 'src', rootNodes: [] }],
            },
          ],
        },
      }
    );
    try {
      expectScenario(
        await lintScenario(fixture.path),
        'private-category-visibility',
        []
      );
    } finally {
      await fixture.rm();
    }
  });

  it.each([
    ['src/main.ts', 'src/app/_components/shell'],
    [`${table}/table.component.ts`, body],
    [`${table}/table.type.ts`, body],
    [`${table}/table.spec.ts`, body],
  ])(
    'keeps a private destination encapsulated for its authorized parent %s',
    async (source, target) => {
      const actualSource = source === 'src/main.ts' ? 'src/app/app.ts' : source;
      const name = nodePath.posix.basename(target);
      const master = `${target}/${name}.component.ts`;
      const type = `${target}/${name}.type.ts`;
      const access = `${target}/index.ts`;
      const fixture = await createProject(
        {
          ...tableTree,
          [actualSource]: `import '${specifier(actualSource, access)}';\nimport '${specifier(actualSource, master)}';\nimport '${specifier(actualSource, type)}';\n${value}`,
          [type]: value,
        },
        { faf: { locals: [local] } }
      );
      try {
        expectScenario(
          await lintScenario(fixture.path),
          'fragment-encapsulation',
          [
            dependency(actualSource, master, 'fragment-encapsulation', 2),
            dependency(actualSource, type, 'fragment-encapsulation', 3),
          ]
        );
      } finally {
        await fixture.rm();
      }
    }
  );

  it.each([
    ['direct Category Node', '_types/public.type.ts', []],
    ['Fragment interface', '_components/unit/index.ts', []],
    [
      'Fragment implementation',
      '_components/unit/unit.component.ts',
      ['fragment-encapsulation'],
    ],
    [
      'Sub-Graph entry',
      '_components/unit/unit.spec.ts',
      ['sub-graph-node-isolation'],
    ],
    [
      'private detail',
      '_components/unit/_utils/detail/index.ts',
      ['private-category-visibility'],
    ],
    [
      'nested Branch',
      '_components/unit/_unit@shared/_types/shared.type.ts',
      ['fractal-branch-visibility'],
    ],
  ] as const)(
    'does not transitively publish a Branch destination: %s',
    async (_name, target, violations) => {
      const prefix = 'src/_src@shared';
      const destination = `${prefix}/${target}`;
      const fixture = await createProject(
        {
          [`${prefix}/_components/unit/_unit@shared/_types/shared.type.ts`]:
            value,
          [`${prefix}/_components/unit/_utils/detail/detail.util.ts`]: value,
          [`${prefix}/_components/unit/_utils/detail/index.ts`]:
            "export { value } from './detail.util.js';\n",
          [`${prefix}/_components/unit/index.ts`]:
            "export { value } from './unit.component.js';\n",
          [`${prefix}/_components/unit/unit.component.ts`]: value,
          [`${prefix}/_components/unit/unit.spec.ts`]: value,
          [`${prefix}/_types/public.type.ts`]: value,
          'src/main.ts': `import '${specifier('src/main.ts', destination)}';\n`,
        },
        {
          faf: {
            locals: [
              {
                roles,
                rootFragments: [{ path: 'src', rootNodes: [['main.ts']] }],
                subGraphRoles: [{ name: 'spec' }],
              },
            ],
          },
        }
      );
      try {
        expectScenario(
          await lintScenario(fixture.path),
          violations[0] ?? 'fractal-branch-visibility',
          violations.map((part) => dependency('src/main.ts', destination, part))
        );
      } finally {
        await fixture.rm();
      }
    }
  );

  it.each([
    '_domain/_types/_primitives/public.type.ts',
    '_domain/_nested/_types/public.type.ts',
    '_domain/_pages/get-user/index.ts',
    '_ui/_types/public.type.ts',
  ])(
    'admits exposed units through Layer and path chains without comparing the Root Node to Layer Ranks: %s',
    async (target) => {
      const prefix = 'src/_src@shared';
      const destination = `${prefix}/${target}`;
      const fixture = await createProject(
        {
          [`${prefix}/_domain/_nested/_types/public.type.ts`]: value,
          [`${prefix}/_domain/_pages/get-user/get-user.page.ts`]: value,
          [`${prefix}/_domain/_pages/get-user/index.ts`]:
            "export { value } from './get-user.page.js';\n",
          [`${prefix}/_domain/_types/_primitives/public.type.ts`]: value,
          [`${prefix}/_ui/_types/public.type.ts`]: value,
          'src/main.ts': `import '${specifier('src/main.ts', destination)}';\n`,
        },
        {
          faf: {
            locals: [
              {
                horizontalHierarchies: [[['_domain'], ['_ui']]],
                mimeticPathStructures: [
                  { actions: ['get'], paths: [`${prefix}/_domain/_pages`] },
                ],
                roles,
                rootFragments: [{ path: 'src', rootNodes: [['main.ts']] }],
              },
            ],
          },
        }
      );
      try {
        expectScenario(
          await lintScenario(fixture.path),
          'fractal-branch-visibility',
          []
        );
      } finally {
        await fixture.rm();
      }
    }
  );

  it.each(['runner entry', 'shared runtime and test dependencies'])(
    'does not invent imports for %s',
    async () => {
      const fixture = await createProject(
        {
          'src/_utils/unit/index.ts':
            "export { value } from './unit.util.js';\n",
          'src/_utils/unit/unit.spec.ts': "import './unit.util.ts';\n",
          'src/_utils/unit/unit.util.ts': value,
          'src/main.ts': "import './_utils/unit/index.ts';\n",
        },
        {
          faf: {
            locals: [
              {
                roles: [{ category: '_utils', name: 'util' }],
                rootFragments: [{ path: 'src', rootNodes: [['main.ts']] }],
                subGraphRoles: [{ name: 'spec' }],
              },
            ],
          },
        }
      );
      try {
        expectScenario(
          await lintScenario(fixture.path),
          'sub-graph-node-isolation',
          []
        );
      } finally {
        await fixture.rm();
      }
    }
  );

  it('admits importable font Assets as Logical Nodes rather than Foreign Nodes', async () => {
    const fixture = await createProject(
      {
        'src/_src@shared/_fonts/inter.woff2': 'font',
        'src/main.ts': "import './_src@shared/_fonts/inter.woff2';\n",
      },
      {
        faf: {
          locals: [
            {
              roles,
              rootFragments: [{ path: 'src', rootNodes: [['main.ts']] }],
            },
          ],
        },
      }
    );
    try {
      expectScenario(
        await lintScenario(fixture.path),
        'foreign-node-isolation',
        []
      );
    } finally {
      await fixture.rm();
    }
  });
});

describe('acceptance: internal Tree edges', () => {
  beforeAll(warmupESLint, 120_000);

  it.each(internalRanks)(
    'compares only direct Fragment siblings: %s to %s (%s)',
    async (from, to, allowed) => {
      const directory = 'src/_components/unit';
      const source = `${directory}/${nodeFile(from)}`;
      const destination = `${directory}/${nodeFile(to)}`;
      const fixture = await createProject(
        {
          [`${directory}/index.ts`]:
            "export { value } from './unit.component.js';\n",
          [`${directory}/unit.component.ts`]: value,
          [destination]: value,
          [source]: `import '${specifier(source, destination)}';\n`,
        },
        {
          faf: {
            locals: [
              {
                roles,
                rootLayers: ['src'],
                subGraphRoles: local.subGraphRoles,
              },
            ],
          },
        }
      );
      let part = 'peer-separation';
      if (to === 'spec' || to === 'story') {
        part = 'sub-graph-node-isolation';
      }
      if (from === 'index' && !allowed) {
        part = 'access-node-contract';
      }
      const violations = allowed
        ? []
        : [dependency(source, destination, 'peer-separation')];
      if (!allowed && from === 'index') {
        violations.unshift(
          dependency(source, destination, 'access-node-contract')
        );
      }
      if (to === 'spec' || to === 'story') {
        violations.push(
          dependency(source, destination, 'sub-graph-node-isolation')
        );
      }
      try {
        expectScenario(await lintScenario(fixture.path), part, violations);
      } finally {
        await fixture.rm();
      }
    }
  );

  it('anchors an encapsulation error at the import rather than the configuration', async () => {
    const source = 'src/main.ts';
    const destination = `${table}/table.component.ts`;
    const fixture = await createProject(
      {
        ...tableTree,
        [source]: `\n  import '${specifier(source, destination)}';\n`,
      },
      { faf: { locals: [local] } }
    );
    try {
      expectScenario(
        await lintScenario(fixture.path),
        'fragment-encapsulation',
        [dependency(source, destination, 'fragment-encapsulation', 2, 3)]
      );
    } finally {
      await fixture.rm();
    }
  });

  it.each(boundaryArcs)(
    '$name',
    async ({ destination, part, source, violations }) => {
      const fixture = await createProject(
        {
          ...tableTree,
          [`${body}/table-body.story.ts`]: value,
          [source]: `import '${specifier(source, destination)}';\n${tableTree[source] ?? value}`,
        },
        { faf: { locals: [local] } }
      );
      try {
        expectScenario(
          await lintScenario(fixture.path),
          part,
          violations.map((violation) =>
            dependency(source, destination, violation)
          )
        );
      } finally {
        await fixture.rm();
      }
    }
  );

  it.each(tableArcs)(
    '$name',
    async ({ destination, part, source, violations }) => {
      const fixture = await createProject(
        {
          ...tableTree,
          [source]: `import '${specifier(source, destination)}';\n${tableTree[source] ?? value}`,
        },
        { faf: { locals: [local] } }
      );
      try {
        const names = violations;
        expectScenario(
          await lintScenario(fixture.path),
          part,
          names.map((violation) => dependency(source, destination, violation))
        );
      } finally {
        await fixture.rm();
      }
    }
  );

  it('recognizes the complete Compound Component structure and distinct Branch scopes', async () => {
    const fixture = await createProject(tableTree, {
      faf: { locals: [local] },
    });
    try {
      expectScenario(
        await lintScenario(fixture.path),
        'containment-matrix',
        []
      );
    } finally {
      await fixture.rm();
    }
  });

  it('composes the reading hook and context without re-exporting imported Symbols', async () => {
    const source = `${table}/_components/table-header-cell/table-header-cell.hook.ts`;
    const hook = `${reader}/use-table-context.hook.ts`;
    const provider = `${context}/table-context.context.ts`;
    const hookAccess = `${reader}/index.ts`;
    const contextAccess = `${context}/index.ts`;
    const fixture = await createProject(
      {
        ...tableTree,
        [hook]: `import { value as context } from '${specifier(hook, contextAccess)}';\nexport const value = () => context;\n`,
        [provider]: `import { value as sort } from '${specifier(provider, sortType)}';\nexport const value = { sort };\n`,
        [source]: `import { value as read } from '${specifier(source, hookAccess)}';\nexport const value = () => read();\n`,
      },
      { faf: { locals: [local] } }
    );
    try {
      expectScenario(
        await lintScenario(fixture.path),
        're-export-prohibition',
        []
      );
    } finally {
      await fixture.rm();
    }
  });

  it.each([
    'table.component.ts',
    '_components/table-body/index.ts',
    '_components/table-cell/index.ts',
    '_components/table-head/index.ts',
    '_components/table-header-cell/index.ts',
    '_components/table-row/index.ts',
    '_components/_components@shared/_hooks/use-table-context/index.ts',
    '_table@shared/_contexts/table-context/index.ts',
  ])(
    'limits the Compound Component Access Node to its own Fragment Nodes: %s',
    async (target) => {
      const source = `${table}/index.ts`;
      const destination = `${table}/${target}`;
      const fixture = await createProject(
        {
          ...tableTree,
          [source]: `export { value } from '${specifier(source, destination)}';\n`,
        },
        { faf: { locals: [local] } }
      );
      const expected =
        target === 'table.component.ts'
          ? []
          : [dependency(source, destination, 'access-node-contract')];
      try {
        expectScenario(
          await lintScenario(fixture.path),
          'access-node-contract',
          expected
        );
      } finally {
        await fixture.rm();
      }
    }
  );
});
