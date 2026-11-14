import type { FileTree } from 'fs-fixture';

import { beforeAll, describe, it } from 'vitest';

import type { TScenarioMessage } from '../support/acceptance-project.js';

import {
  createProject,
  expectScenario,
  lintScenario,
  warmupESLint,
} from '../support/acceptance-project.js';

const WARMUP_TIMEOUT_MS = 120_000;

beforeAll(warmupESLint, WARMUP_TIMEOUT_MS);

const roles = [
  { category: '_types', isCategoryNode: true, name: 'type' },
  { category: '_utils', name: 'util' },
  { category: '_apis', name: 'api' },
  { category: '_components', name: 'component' },
  { category: '_pages', name: 'page' },
  { category: '_atoms', name: 'atom' },
  { category: '_molecules', name: 'molecule' },
  { category: '_primitives', name: 'primitive' },
  { category: '_compounds', name: 'compound' },
];

const subGraphRoles = [{ name: 'spec' }, { name: 'story' }];

const baseLayerTree: FileTree = {
  'src/_utils/widget/index.ts': "export { widget } from './widget.util.js';\n",
  'src/_utils/widget/widget.util.ts': 'export const widget = 1;\n',
};

const createScenarioMessage = (
  filePath: string,
  element: string,
  constraint: string,
  messageText: string,
  reference: string,
  family: string
): TScenarioMessage => ({
  column: 1,
  constraint,
  element,
  filePath,
  line: 1,
  message: `${constraint}: ${messageText} (${reference}).`,
  messageId: family,
  ruleId: 'faf/conformity',
  severity: 2,
});

const configMessage = (
  element: string,
  constraint: string,
  predicate: string,
  reference: string,
  detail?: string
): TScenarioMessage => {
  const messageText =
    detail === undefined || detail === ''
      ? `'${element}' ${predicate}`
      : `'${element}' ${predicate}: ${detail.replace(/\.$/, '')}`;
  return createScenarioMessage(
    'faf.config.ts',
    element,
    constraint,
    messageText,
    reference,
    'configuration'
  );
};

const classificationMessage = (
  filePath: string,
  element: string,
  constraint: string,
  predicate: string,
  reference: string
): TScenarioMessage =>
  createScenarioMessage(
    filePath,
    element,
    constraint,
    `'${element}' ${predicate}`,
    reference,
    'classification'
  );

const dependencyMessage = (
  from: string,
  to: string,
  specifier: string,
  constraint: string,
  predicate: string,
  reference: string
): TScenarioMessage => {
  const messageText = `'${from}' imports '${to}' through '${specifier}': ${predicate}`;
  return createScenarioMessage(
    from,
    from,
    constraint,
    messageText,
    reference,
    'dependency'
  );
};

const pathDependencyMessage = (
  chain: readonly string[],
  constraint: string,
  predicate: string,
  reference: string
): TScenarioMessage => {
  const from = chain[0] ?? '';
  const to = chain.at(-1) ?? '';
  const messageText = `'${from}' reaches '${to}' through ${chain.join(' -> ')}: ${predicate}`;
  return createScenarioMessage(
    from,
    from,
    constraint,
    messageText,
    reference,
    'dependency'
  );
};

type TSubRoot = {
  readonly path: string;
  readonly rootNodes: readonly (readonly string[])[];
  readonly subRootFragments?: readonly TSubRoot[];
};

const subRootsFor = (file: string): readonly TSubRoot[] => {
  if (file === 'src/app/README.md') {
    return [{ path: 'src/app', rootNodes: [] }];
  }
  if (file === 'src/types/globals.d.ts') {
    return [{ path: 'src/types', rootNodes: [] }];
  }
  if (file === 'src/docs/a.md') {
    return [{ path: 'src/docs', rootNodes: [] }];
  }
  if (file === 'src/docs/deep/a.md') {
    return [
      {
        path: 'src/docs',
        rootNodes: [],
        subRootFragments: [{ path: 'src/docs/deep', rootNodes: [] }],
      },
    ];
  }
  if (file === 'src/_[todo-id]/README.md') {
    return [{ path: 'src/_[todo-id]', rootNodes: [] }];
  }
  return [];
};

const fullHypotheticalConfig = {
  faf: {
    common: {
      aliases: {
        '#/_apis@shared': 'src/_src@shared/_network/_apis/_apis@shared',
        '#/_src@shared': 'src/_src@shared',
      },
      foreignNodes: [
        {
          paths: ['src', 'packages/contracts/src', 'packages/formatters/src'],
          patterns: ['*.md'],
        },
      ],
      roles: [
        [
          {
            category: '_fonts',
            implicitRoleExtensions: ['.ttf', '.woff', '.woff2'],
            name: 'font',
          },
          {
            category: '_images',
            implicitRoleExtensions: ['.png', '.jpg', '.jpeg', '.svg'],
            name: 'image',
          },
        ],
        {
          category: '_styles',
          implicitRoleExtensions: ['.css'],
          name: 'style',
        },
        {
          allowMultipleSymbols: true,
          category: '_constants',
          isCategoryNode: true,
          name: 'constant',
        },
        { allowMultipleSymbols: true, category: '_recipes', name: 'recipe' },
        {
          allowMultipleSymbols: true,
          category: '_schemas',
          isCategoryNode: true,
          name: 'schema',
        },
        {
          allowMultipleSymbols: true,
          category: '_types',
          isCategoryNode: true,
          name: 'type',
        },
        {
          allowMultipleSymbols: true,
          category: '_mocks',
          isCategoryNode: true,
          name: 'mock',
        },
        { allowMultipleSymbols: true, category: '_configs', name: 'config' },
        { allowMultipleSymbols: true, category: '_utils', name: 'util' },
        { category: '_classes', name: 'class' },
        { category: '_factories', name: 'factory' },
        { category: '_instances', name: 'instance' },
        { category: '_hooks', name: 'hook' },
        [
          { category: '_apis', name: 'api' },
          { category: '_boundaries', name: 'boundary' },
          { category: '_components', name: 'component' },
          { category: '_contexts', name: 'context' },
          { category: '_layouts', name: 'layout' },
          { category: '_pages', name: 'page' },
          { category: '_routes', name: 'route' },
          { category: '_stores', name: 'store' },
        ],
      ],
      subCategoryHierarchies: [
        [['_atoms'], ['_molecules'], ['_organisms'], ['_templates']],
        [
          ['_primitives'],
          ['_compounds'],
          ['_aggregates'],
          ['_systems'],
          ['_ecosystems'],
        ],
      ],
      subGraphRoles,
    },
    locals: [
      {
        externalDependencies: [
          {
            from: [
              'src/_src@shared/_network/_apis/_apis@shared/_utils/legacy-client/legacy-client.util.ts',
            ],
            to: ['legacy/client.ts'],
          },
        ],
        foreignDomains: ['src/_configs'],
        foreignNodes: [
          'src/vite-env.d.ts',
          { paths: ['src'], patterns: ['*.md'] },
        ],
        horizontalHierarchies: [
          {
            hierarchy: [['_domain'], ['_network', '_state', '_ui']],
            path: 'src/_src@shared',
          },
          {
            hierarchy: [['_types'], ['_classes'], ['_utils'], ['_apis']],
            path: 'src/_src@shared/_network',
          },
          {
            hierarchy: [
              ['_constants'],
              ['_types'],
              ['_utils'],
              ['_recipes'],
              ['_components'],
              ['_pages'],
            ],
            path: 'src/_src@shared/_ui',
          },
        ],
        mimeticPathStructures: [
          {
            actions: ['get', 'list', 'delete', 'post', 'put', 'patch'],
            paths: ['src/_src@shared/_network/_apis'],
          },
        ],
        publicRootNodes: ['src/app/app.tsx'],
        rootFragments: [
          {
            dependencyEdges: [
              {
                from: ['main.tsx'],
                to: ['src/app/app.tsx'],
              },
            ],
            path: 'src',
            rootNodes: [['main.css'], ['main.tsx']],
            subRootFragments: [
              {
                path: 'src/app',
                rootNodes: [['app.tsx']],
              },
            ],
          },
        ],
        treeDependencies: [
          {
            from: ['src'],
            to: ['packages/contracts/src', 'packages/formatters/src'],
          },
        ],
      },
      {
        horizontalHierarchies: [
          {
            hierarchy: [['_types'], ['_utils']],
            path: 'packages/contracts/src',
          },
          {
            hierarchy: [['_types'], ['_utils']],
            path: 'packages/formatters/src',
          },
        ],
        rootLayers: ['packages/contracts/src', 'packages/formatters/src'],
      },
    ],
  },
};

const fullHypotheticalTree: FileTree = {
  'legacy/client.ts': 'export const legacyClient = 1;\n',
  'packages/contracts/src/_types/todo.type.ts': 'export type TTodo = string;\n',
  'packages/contracts/src/_utils': {},
  'packages/formatters/src/_types': {},
  'packages/formatters/src/_utils/format-label/format-label.util.ts':
    'export const formatLabel = 1;\n',
  'packages/formatters/src/_utils/format-label/index.ts':
    "export { formatLabel } from './format-label.util.js';\n",
  'src/_configs/app.config.json': '{"env":"test"}\n',
  'src/_src@shared/_domain/_utils/dom/dom.util.ts': 'export const dom = 1;\n',
  'src/_src@shared/_domain/_utils/dom/index.ts':
    "export { dom } from './dom.util.js';\n",
  'src/_src@shared/_network/_apis/_apis@shared/_utils/legacy-client/index.ts':
    "export { legacyClientAdapter } from './legacy-client.util.js';\n",
  'src/_src@shared/_network/_apis/_apis@shared/_utils/legacy-client/legacy-client.util.ts':
    "import { legacyClient } from '../../../../../../../legacy/client.js';\nexport const legacyClientAdapter = () => legacyClient;\n",
  'src/_src@shared/_network/_apis/_health/get-health/get-health.api.ts':
    "import { legacyClientAdapter } from '#/_apis@shared/_utils/legacy-client/index.js';\nimport type { TTodo } from '../../../../../../packages/contracts/src/_types/todo.type.js';\nimport { formatLabel } from '../../../../../../packages/formatters/src/_utils/format-label/index.js';\nexport const getHealth = (): unknown => ({ a: formatLabel, b: legacyClientAdapter() });\n",
  'src/_src@shared/_network/_apis/_health/get-health/index.ts':
    "export { getHealth } from './get-health.api.js';\n",
  'src/_src@shared/_network/_classes': {},
  'src/_src@shared/_network/_types': {},
  'src/_src@shared/_network/_utils': {},
  'src/_src@shared/_state/_utils/st/index.ts':
    "export { st } from './st.util.js';\n",
  'src/_src@shared/_state/_utils/st/st.util.ts': 'export const st = 1;\n',
  'src/_src@shared/_ui/_components': {},
  'src/_src@shared/_ui/_constants': {},
  'src/_src@shared/_ui/_pages': {},
  'src/_src@shared/_ui/_recipes': {},
  'src/_src@shared/_ui/_types': {},
  'src/_src@shared/_ui/_utils/u/index.ts': "export { u } from './u.util.js';\n",
  'src/_src@shared/_ui/_utils/u/u.util.ts': 'export const u = 1;\n',
  'src/app/app.tsx': 'export const App = 1;\n',
  'src/main.css': 'body { margin: 0; }\n',
  'src/main.tsx':
    "import './main.css';\nimport { App } from './app/app.js';\nexport const Main = App;\n",
  'src/vite-env.d.ts': '/// <reference types="vite/client" />\n',
  'tsconfig.json': JSON.stringify({
    compilerOptions: {
      baseUrl: '.',
      paths: {
        '#/_apis@shared/*': ['src/_src@shared/_network/_apis/_apis@shared/*'],
      },
    },
  }),
};

describe('acceptance: Foreign Node families and scopes', () => {
  const patternCases = [
    { expected: true, file: 'src/README.md', pattern: '*.md' },
    { expected: true, file: 'src/app/README.md', pattern: '*.md' },
    { expected: true, file: 'src/.notes.md', pattern: '*.md' },
    { expected: true, file: 'src/.md', pattern: '*.md' },
    { expected: false, file: 'src/README.MD', pattern: '*.md' },
    { expected: false, file: 'other/README.md', pattern: '*.md' },
    { expected: true, file: 'src/types/globals.d.ts', pattern: '*.d.ts' },
    { expected: true, file: 'src/docs/a.md', pattern: 'docs/*.md' },
    { expected: false, file: 'src/docs/deep/a.md', pattern: 'docs/*.md' },
    { expected: true, file: 'src/README.md', pattern: '**/*.md' },
    { expected: true, file: 'src/docs/a.md', pattern: 'docs/**/*.md' },
    { expected: true, file: 'src/docs/deep/a.md', pattern: 'docs/**/*.md' },
    { expected: true, file: 'src/a.md', pattern: '?.md' },
    { expected: false, file: 'src/ab.md', pattern: '?.md' },
    { expected: true, file: 'src/report[1].md', pattern: 'report[1].md' },
    { expected: false, file: 'src/report1.md', pattern: 'report[1].md' },
    {
      expected: true,
      file: 'src/_[todo-id]/README.md',
      pattern: '_[todo-id]/*.md',
    },
  ] as const;

  it.each(patternCases)(
    'applies pattern "$pattern" to file "$file" with expected selection $expected',
    async ({ expected, file, pattern }) => {
      const config = {
        faf: {
          locals: [
            {
              foreignNodes: [
                {
                  paths: ['src'],
                  patterns: [pattern],
                },
              ],
              roles,
              rootFragments: [
                {
                  path: 'src',
                  rootNodes: [['main.ts']],
                  subRootFragments: subRootsFor(file),
                },
                ...(file.startsWith('other/')
                  ? [
                      {
                        path: 'other',
                        rootNodes: [['other.ts']],
                      },
                    ]
                  : []),
              ],
              subGraphRoles,
            },
          ],
        },
      };

      const fileContent = file.endsWith('.d.ts')
        ? 'export type TGlobals = string;\n'
        : '# content\n';

      const tree: FileTree = {
        ...(file.startsWith('other/') && {
          'other/other.ts': 'export const other = 1;\n',
        }),
        [file]: fileContent,
        'src/main.ts': 'export const main = 1;\n',
      };

      const fixture = await createProject(tree, config);
      try {
        const result = await lintScenario(fixture.path);
        const anchorFile = file.startsWith('other/')
          ? 'other/other.ts'
          : 'src/main.ts';
        const expectedMessages = expected
          ? []
          : [
              configMessage(
                file,
                'configuration/unenumerated-root-file',
                'must be either enumerated as a Root Node or designated as a Foreign Node',
                'FAF §6.2.1'
              ),
              classificationMessage(
                anchorFile,
                file,
                'classification/unclassifiable-file',
                'is neither a uniquely classified Logical Node nor a Foreign Node',
                'FAF §6.9'
              ),
            ];
        expectScenario(result, expectedMessages);
      } finally {
        await fixture.rm();
      }
    }
  );

  it('unifies foreign selections without introducing duplicate classifications', async () => {
    const config = {
      faf: {
        locals: [
          {
            foreignDomains: ['src/_configs'],
            foreignNodes: [
              'src/vite-env.d.ts',
              'src/README.md',
              {
                paths: ['src'],
                patterns: ['*.md'],
              },
            ],
            roles,
            rootFragments: [
              {
                path: 'src',
                rootNodes: [['main.ts']],
              },
            ],
            subGraphRoles,
          },
        ],
      },
    };

    const tree: FileTree = {
      'src/_configs/env.json': '{"env":"test"}\n',
      'src/main.ts': 'export const main = 1;\n',
      'src/README.md': '# Title\n',
      'src/vite-env.d.ts': '/// <reference types="vite/client" />\n',
    };

    const fixture = await createProject(tree, config);
    try {
      const result = await lintScenario(fixture.path);
      expectScenario(result, []);
    } finally {
      await fixture.rm();
    }
  });

  type TGrammarCase = {
    readonly caseName: string;
    readonly extraLocals?: readonly Record<string, unknown>[];
    readonly foreignFamily: {
      readonly paths: readonly string[];
      readonly patterns: readonly string[];
    };
    readonly getExpected: (
      baseDirectory: string
    ) => readonly TScenarioMessage[];
    readonly tree: FileTree;
  };

  const grammarCases: readonly TGrammarCase[] = [
    {
      caseName: 'paths absent or empty',
      foreignFamily: { paths: [], patterns: ['*.md'] },
      getExpected: () => [
        configMessage(
          'faf.locals[0].foreignNodes[0].paths',
          'configuration/empty-list',
          'cannot be an empty list',
          'FAF §1.2, §6.9'
        ),
      ],
      tree: baseLayerTree,
    },
    {
      caseName: 'patterns absent or empty',
      foreignFamily: { paths: ['src'], patterns: [] },
      getExpected: () => [
        configMessage(
          'faf.locals[0].foreignNodes[0].patterns',
          'configuration/empty-list',
          'cannot be an empty list',
          'FAF §1.2, §6.9'
        ),
      ],
      tree: baseLayerTree,
    },
    {
      caseName: 'nonexistent scope directory',
      foreignFamily: { paths: ['nonexistent'], patterns: ['*.md'] },
      getExpected: (baseDirectory: string) => [
        configMessage(
          'nonexistent',
          'configuration/non-existent-path',
          'does not exist',
          'FAF §1.2, §6.9',
          `Foreign family path "nonexistent" does not exist under configuration base "${baseDirectory}"`
        ),
      ],
      tree: baseLayerTree,
    },
    {
      caseName: 'scope outside declared tree scope',
      extraLocals: [{ roles, rootLayers: ['other'] }],
      foreignFamily: { paths: ['other'], patterns: ['*.md'] },
      getExpected: () => [
        configMessage(
          'other',
          'configuration/reference-outside-local-scope',
          'must belong to a tree within this local configuration',
          'FAF §6',
          'Foreign family path "other" belongs to tree "other" outside this local configuration'
        ),
      ],
      tree: {
        ...baseLayerTree,
        'other/_utils/widget/index.ts':
          "export { widget } from './widget.util.js';\n",
        'other/_utils/widget/widget.util.ts': 'export const widget = 1;\n',
      },
    },
    {
      caseName: 'pattern with negation',
      foreignFamily: { paths: ['src'], patterns: ['!*.md'] },
      getExpected: () => [
        configMessage(
          'faf.locals[0].foreignNodes[0].patterns[0]',
          'configuration/invalid-foreign-pattern',
          'must adhere to allowed glob pattern grammar',
          'FAF §6.7'
        ),
      ],
      tree: baseLayerTree,
    },
    {
      caseName: 'pattern with brace expansion',
      foreignFamily: { paths: ['src'], patterns: ['*.{ts,js}'] },
      getExpected: () => [
        configMessage(
          'faf.locals[0].foreignNodes[0].patterns[0]',
          'configuration/invalid-foreign-pattern',
          'must adhere to allowed glob pattern grammar',
          'FAF §6.7'
        ),
      ],
      tree: baseLayerTree,
    },
    {
      caseName: 'regular expression instead of pattern',
      foreignFamily: { paths: ['src'], patterns: ['^.*\\.md$'] },
      getExpected: () => [
        configMessage(
          'faf.locals[0].foreignNodes[0].patterns[0]',
          'configuration/invalid-foreign-pattern',
          'must adhere to allowed glob pattern grammar',
          'FAF §6.7'
        ),
      ],
      tree: baseLayerTree,
    },
    {
      caseName: 'absolute pattern',
      foreignFamily: { paths: ['src'], patterns: ['/src/*.md'] },
      getExpected: () => [
        configMessage(
          'faf.locals[0].foreignNodes[0].patterns[0]',
          'configuration/invalid-foreign-pattern',
          'must adhere to allowed glob pattern grammar',
          'FAF §6.7'
        ),
      ],
      tree: baseLayerTree,
    },
    {
      caseName: 'pattern with dot segment',
      foreignFamily: { paths: ['src'], patterns: ['./*.md'] },
      getExpected: () => [
        configMessage(
          'faf.locals[0].foreignNodes[0].patterns[0]',
          'configuration/invalid-foreign-pattern',
          'must adhere to allowed glob pattern grammar',
          'FAF §6.7'
        ),
      ],
      tree: baseLayerTree,
    },
  ];

  it.each(grammarCases)(
    'rejects foreign criteria outside grammar: $caseName',
    async (item) => {
      const config = {
        faf: {
          locals: [
            {
              foreignNodes: [item.foreignFamily],
              roles,
              rootLayers: ['src'],
              subGraphRoles,
            },
            ...(item.extraLocals ?? []),
          ],
        },
      };

      const fixture = await createProject(item.tree, config);
      try {
        const result = await lintScenario(fixture.path);
        const expected = item.getExpected(fixture.path);
        expectScenario(result, expected);
      } finally {
        await fixture.rm();
      }
    }
  );
});

describe('acceptance: Sub-Category and domain-scoped Horizontal Hierarchies', () => {
  const baseRoles = [
    { category: '_types', isCategoryNode: true, name: 'type' },
    { category: '_utils', name: 'util' },
    { category: '_apis', name: 'api' },
    { category: '_components', name: 'component' },
    { category: '_pages', name: 'page' },
  ];

  it('applies subCategoryHierarchies across Categories, Private Categories, and nested Sub-Categories', async () => {
    const config = {
      faf: {
        locals: [
          {
            roles: baseRoles,
            rootLayers: ['src'],
            subCategoryHierarchies: [[['_primitives'], ['_compounds']]],
            subGraphRoles,
          },
        ],
      },
    };

    const tree: FileTree = {
      'src/_components/btn/_components/_compounds/card/card.component.tsx':
        "import { prim } from '../../_primitives/atom/index.js';\nexport const card = prim;\n",
      'src/_components/btn/_components/_compounds/card/index.ts':
        "export { card } from './card.component.js';\n",
      'src/_components/btn/_components/_primitives/atom/atom.component.tsx':
        'export const prim = 1;\n',
      'src/_components/btn/_components/_primitives/atom/index.ts':
        "export { prim } from './atom.component.js';\n",
      'src/_components/btn/btn.component.tsx': 'export const btn = 1;\n',
      'src/_components/btn/index.ts':
        "export { btn } from './btn.component.js';\n",
      'src/_utils/_compounds/a/a.util.ts':
        "import { p } from '../../_primitives/p/index.js';\nexport const a = p;\n",
      'src/_utils/_compounds/a/index.ts': "export { a } from './a.util.js';\n",
      'src/_utils/_nested/_compounds/c/c.util.ts':
        "import { n } from '../../_primitives/n/index.js';\nexport const c = n;\n",
      'src/_utils/_nested/_compounds/c/index.ts':
        "export { c } from './c.util.js';\n",
      'src/_utils/_nested/_primitives/n/index.ts':
        "export { n } from './n.util.js';\n",
      'src/_utils/_nested/_primitives/n/n.util.ts': 'export const n = 1;\n',
      'src/_utils/_primitives/p/index.ts': "export { p } from './p.util.js';\n",
      'src/_utils/_primitives/p/p.util.ts': 'export const p = 1;\n',
    };

    const fixture = await createProject(tree, config);
    try {
      const result = await lintScenario(fixture.path);
      expectScenario(result, []);
    } finally {
      await fixture.rm();
    }
  });

  it('rejects upward and same-tier imports under subCategoryHierarchies', async () => {
    const config = {
      faf: {
        locals: [
          {
            roles: baseRoles,
            rootLayers: ['src'],
            subCategoryHierarchies: [
              [['_primitives'], ['_compounds', '_aggregates']],
            ],
            subGraphRoles,
          },
        ],
      },
    };

    const upwardTree: FileTree = {
      'src/_utils/_compounds/c/c.util.ts': 'export const c = 1;\n',
      'src/_utils/_compounds/c/index.ts': "export { c } from './c.util.js';\n",
      'src/_utils/_primitives/p/index.ts': "export { p } from './p.util.js';\n",
      'src/_utils/_primitives/p/p.util.ts':
        "import { c } from '../../_compounds/c/index.js';\nexport const p = c;\n",
    };

    const upwardFixture = await createProject(upwardTree, config);
    try {
      const result = await lintScenario(upwardFixture.path);
      expectScenario(result, [
        dependencyMessage(
          'src/_utils/_primitives/p/p.util.ts',
          'src/_utils/_compounds/c/index.ts',
          '../../_compounds/c/index.js',
          'dependency/peer-separation',
          'sibling subtrees may depend on each other only downward along a Horizontal Hierarchy',
          'FAF §5'
        ),
      ]);
    } finally {
      await upwardFixture.rm();
    }

    const sameTierTree: FileTree = {
      'src/_utils/_aggregates/a/a.util.ts':
        "import { c } from '../../_compounds/c/index.js';\nexport const a = c;\n",
      'src/_utils/_aggregates/a/index.ts': "export { a } from './a.util.js';\n",
      'src/_utils/_compounds/c/c.util.ts': 'export const c = 1;\n',
      'src/_utils/_compounds/c/index.ts': "export { c } from './c.util.js';\n",
    };

    const sameTierFixture = await createProject(sameTierTree, config);
    try {
      const result = await lintScenario(sameTierFixture.path);
      expectScenario(result, [
        dependencyMessage(
          'src/_utils/_aggregates/a/a.util.ts',
          'src/_utils/_compounds/c/index.ts',
          '../../_compounds/c/index.js',
          'dependency/peer-separation',
          'sibling subtrees may depend on each other only downward along a Horizontal Hierarchy',
          'FAF §5'
        ),
      ]);
    } finally {
      await sameTierFixture.rm();
    }
  });

  it('does not activate subCategoryHierarchies on Layers or Path Sub-Categories', async () => {
    const layersConfig = {
      faf: {
        locals: [
          {
            roles: baseRoles,
            rootLayers: ['src'],
            subCategoryHierarchies: [[['_primitives'], ['_compounds']]],
            subGraphRoles,
          },
        ],
      },
    };

    const layersTree: FileTree = {
      'src/_compounds/_utils/c/c.util.ts':
        "import { p } from '../../../_primitives/_utils/p/index.js';\nexport const c = p;\n",
      'src/_compounds/_utils/c/index.ts': "export { c } from './c.util.js';\n",
      'src/_primitives/_utils/p/index.ts': "export { p } from './p.util.js';\n",
      'src/_primitives/_utils/p/p.util.ts': 'export const p = 1;\n',
    };

    const layersFixture = await createProject(layersTree, layersConfig);
    try {
      const result = await lintScenario(layersFixture.path);
      expectScenario(result, [
        dependencyMessage(
          'src/_compounds/_utils/c/c.util.ts',
          'src/_primitives/_utils/p/index.ts',
          '../../../_primitives/_utils/p/index.js',
          'dependency/peer-separation',
          'sibling subtrees may depend on each other only downward along a Horizontal Hierarchy',
          'FAF §5'
        ),
      ]);
    } finally {
      await layersFixture.rm();
    }

    const mimeticConfig = {
      faf: {
        locals: [
          {
            mimeticPathStructures: [{ actions: ['get'], paths: ['src/_apis'] }],
            roles: baseRoles,
            rootLayers: ['src'],
            subCategoryHierarchies: [[['_primitives'], ['_compounds']]],
            subGraphRoles,
          },
        ],
      },
    };

    const mimeticTree: FileTree = {
      'src/_apis/_compounds/get-c/get-c.api.ts':
        "import { p } from '../../_primitives/get-p/index.js';\nexport const getC = p;\n",
      'src/_apis/_compounds/get-c/index.ts':
        "export { getC } from './get-c.api.js';\n",
      'src/_apis/_primitives/get-p/get-p.api.ts': 'export const p = 1;\n',
      'src/_apis/_primitives/get-p/index.ts':
        "export { p } from './get-p.api.js';\n",
    };

    const mimeticFixture = await createProject(mimeticTree, mimeticConfig);
    try {
      const result = await lintScenario(mimeticFixture.path);
      expectScenario(result, [
        dependencyMessage(
          'src/_apis/_compounds/get-c/get-c.api.ts',
          'src/_apis/_primitives/get-p/index.ts',
          '../../_primitives/get-p/index.js',
          'dependency/peer-separation',
          'sibling subtrees may depend on each other only downward along a Horizontal Hierarchy',
          'FAF §5'
        ),
      ]);
    } finally {
      await mimeticFixture.rm();
    }
  });

  it('applies horizontalHierarchies to exact parents without recursive descent', async () => {
    const config = {
      faf: {
        locals: [
          {
            horizontalHierarchies: [
              { hierarchy: [['_types'], ['_utils']], path: 'src/_layer-a' },
              { hierarchy: [['_types'], ['_utils']], path: 'src/_layer-b' },
            ],
            roles,
            rootLayers: ['src'],
            subGraphRoles,
          },
        ],
      },
    };

    const tree: FileTree = {
      'src/_layer-a/_types/a.type.ts': 'export type TA = string;\n',
      'src/_layer-a/_utils/u/index.ts': "export { u } from './u.util.js';\n",
      'src/_layer-a/_utils/u/u.util.ts':
        "import type { TA } from '../../_types/a.type.js';\nexport const u = 1;\n",
      'src/_layer-b/_types/a.type.ts': 'export type TA = string;\n',
      'src/_layer-b/_utils/u/index.ts': "export { u } from './u.util.js';\n",
      'src/_layer-b/_utils/u/u.util.ts':
        "import type { TA } from '../../_types/a.type.js';\nexport const u = 1;\n",
    };

    const fixture = await createProject(tree, config);
    try {
      const result = await lintScenario(fixture.path);
      expectScenario(result, []);
    } finally {
      await fixture.rm();
    }

    const nestedConfig = {
      faf: {
        locals: [
          {
            horizontalHierarchies: [
              { hierarchy: [['_sub-a'], ['_sub-b']], path: 'src/_layer-a' },
            ],
            roles,
            rootLayers: ['src'],
            subGraphRoles,
          },
        ],
      },
    };
    const nestedTree: FileTree = {
      'src/_layer-a/_sub-a/_sub-a/_types/a.type.ts':
        'export type TA = string;\n',
      'src/_layer-a/_sub-a/_sub-b/_utils/u/index.ts':
        "export { u } from './u.util.js';\n",
      'src/_layer-a/_sub-a/_sub-b/_utils/u/u.util.ts':
        "import type { TA } from '../../../_sub-a/_types/a.type.js';\nexport const u = 1;\n",
      'src/_layer-a/_sub-b/_utils/u/index.ts':
        "export { u } from './u.util.js';\n",
      'src/_layer-a/_sub-b/_utils/u/u.util.ts': 'export const u = 1;\n',
    };
    const nestedFixture = await createProject(nestedTree, nestedConfig);
    try {
      const result = await lintScenario(nestedFixture.path);
      expectScenario(result, [
        dependencyMessage(
          'src/_layer-a/_sub-a/_sub-b/_utils/u/u.util.ts',
          'src/_layer-a/_sub-a/_sub-a/_types/a.type.ts',
          '../../../_sub-a/_types/a.type.js',
          'dependency/peer-separation',
          'sibling subtrees may depend on each other only downward along a Horizontal Hierarchy',
          'FAF §5'
        ),
      ]);
    } finally {
      await nestedFixture.rm();
    }
  });

  const referenceCases = [
    {
      caseName: 'absent parent path directory',
      config: {
        faf: {
          locals: [
            {
              horizontalHierarchies: [
                { hierarchy: [['_a'], ['_b']], path: 'src/missing' },
              ],
              roles,
              rootLayers: ['src'],
              subGraphRoles,
            },
          ],
        },
      },
      getExpected: (baseDirectory: string) => [
        configMessage(
          'src/missing',
          'configuration/non-existent-path',
          'does not exist',
          'FAF §1.2, §6.9',
          `Hierarchy directory "src/missing" does not exist under configuration base "${baseDirectory}"`
        ),
      ],
      tree: baseLayerTree,
    },
    {
      caseName: 'parent path points to a file instead of directory',
      config: {
        faf: {
          locals: [
            {
              horizontalHierarchies: [
                {
                  hierarchy: [['_a'], ['_b']],
                  path: 'src/_utils/widget/widget.util.ts',
                },
              ],
              roles,
              rootLayers: ['src'],
              subGraphRoles,
            },
          ],
        },
      },
      getExpected: () => [
        configMessage(
          'src/_utils/widget/widget.util.ts',
          'configuration/expected-directory',
          'must be a directory',
          'FAF §1.2, §6.9',
          'Hierarchy directory "src/_utils/widget/widget.util.ts" must be a directory'
        ),
      ],
      tree: baseLayerTree,
    },
    {
      caseName: 'parent path outside all Fractal Trees',
      config: {
        faf: {
          common: {
            aliases: { '#outside': 'outside' },
          },
          locals: [
            {
              horizontalHierarchies: [
                { hierarchy: [['_a'], ['_b']], path: 'outside' },
              ],
              roles,
              rootLayers: ['src'],
              subGraphRoles,
            },
          ],
        },
      },
      getExpected: () => [
        configMessage(
          'outside',
          'configuration/reference-outside-trees',
          'must be inside a Fractal Tree of this configuration',
          'FAF §6',
          'Hierarchy directory "outside" must be inside a Fractal Tree of this configuration'
        ),
      ],
      tree: {
        ...baseLayerTree,
        'outside/_a': {},
        'outside/_b': {},
      },
    },
    {
      caseName: 'parent path owned by another local configuration',
      config: {
        faf: {
          locals: [
            {
              horizontalHierarchies: [
                { hierarchy: [['_utils'], ['_types']], path: 'other' },
              ],
              roles,
              rootLayers: ['src'],
              subGraphRoles,
            },
            {
              roles,
              rootLayers: ['other'],
              subGraphRoles,
            },
          ],
        },
      },
      getExpected: () => [
        configMessage(
          'other',
          'configuration/reference-outside-local-scope',
          'must belong to a tree within this local configuration',
          'FAF §6',
          'Hierarchy directory "other" belongs to tree "other" outside this local configuration'
        ),
      ],
      tree: {
        ...baseLayerTree,
        'other/_types/a.type.ts': 'export type TA = string;\n',
        'other/_utils/w/index.ts': "export { w } from './w.util.js';\n",
        'other/_utils/w/w.util.ts': 'export const w = 1;\n',
      },
    },
    {
      caseName: 'absent direct child in hierarchy',
      config: {
        faf: {
          locals: [
            {
              horizontalHierarchies: [
                { hierarchy: [['_types'], ['_utils']], path: 'src' },
              ],
              roles,
              rootLayers: ['src'],
              subGraphRoles,
            },
          ],
        },
      },
      getExpected: () => [
        configMessage(
          'src/_types',
          'configuration/non-existent-path',
          'does not exist',
          'FAF §1.2, §6.9',
          'Direct child "_types" does not exist under "src"'
        ),
      ],
      tree: baseLayerTree,
    },
    {
      caseName: 'grandchild listed as member instead of direct child',
      config: {
        faf: {
          locals: [
            {
              horizontalHierarchies: [
                { hierarchy: [['_types'], ['_utils']], path: 'src' },
              ],
              roles,
              rootLayers: ['src'],
              subGraphRoles,
            },
          ],
        },
      },
      getExpected: () => [
        configMessage(
          'src/_types',
          'configuration/non-existent-path',
          'does not exist',
          'FAF §1.2, §6.9',
          'Direct child "_types" does not exist under "src"'
        ),
        configMessage(
          'src/_utils',
          'configuration/non-existent-path',
          'does not exist',
          'FAF §1.2, §6.9',
          'Direct child "_utils" does not exist under "src"'
        ),
      ],
      tree: {
        'src/_domain/_types/a.type.ts': 'export type TA = string;\n',
        'src/_domain/_utils/w/index.ts': "export { w } from './w.util.js';\n",
        'src/_domain/_utils/w/w.util.ts': 'export const w = 1;\n',
      },
    },
    {
      caseName: 'member path containing slash separator',
      config: {
        faf: {
          locals: [
            {
              horizontalHierarchies: [
                {
                  hierarchy: [['_domain/_types'], ['_domain/_utils']],
                  path: 'src',
                },
              ],
              roles,
              rootLayers: ['src'],
              subGraphRoles,
            },
          ],
        },
      },
      getExpected: () => [
        configMessage(
          'src/_domain/_types',
          'configuration/non-existent-path',
          'does not exist',
          'FAF §1.2, §6.9',
          'Direct child "_domain/_types" does not exist under "src"'
        ),
        configMessage(
          'src/_domain/_utils',
          'configuration/non-existent-path',
          'does not exist',
          'FAF §1.2, §6.9',
          'Direct child "_domain/_utils" does not exist under "src"'
        ),
      ],
      tree: {
        'src/_domain/_types/a.type.ts': 'export type TA = string;\n',
        'src/_domain/_utils/w/index.ts': "export { w } from './w.util.js';\n",
        'src/_domain/_utils/w/w.util.ts': 'export const w = 1;\n',
      },
    },
  ] as const;

  it.each(referenceCases)(
    'validates horizontalHierarchies reference constraints: $caseName',
    async (item) => {
      const fixture = await createProject(item.tree, item.config);
      try {
        const result = await lintScenario(fixture.path);
        expectScenario(result, item.getExpected(fixture.path));
      } finally {
        await fixture.rm();
      }
    }
  );

  const conflictCases = [
    {
      caseName:
        'two subCategoryHierarchies select the same direct sub-category',
      config: {
        faf: {
          locals: [
            {
              roles: baseRoles,
              rootLayers: ['src'],
              subCategoryHierarchies: [
                [['_low'], ['_mid']],
                [['_low'], ['_high']],
              ],
              subGraphRoles,
            },
          ],
        },
      },
      expected: [
        classificationMessage(
          'faf.config.ts',
          'src/_utils/_low',
          'classification/horizontal-hierarchy-overlap',
          'is selected by more than one Horizontal Hierarchy',
          'FAF §4'
        ),
      ],
      tree: {
        'src/_utils/_high/c/c.util.ts': 'export const c = 1;\n',
        'src/_utils/_high/c/index.ts': "export { c } from './c.util.js';\n",
        'src/_utils/_low/a/a.util.ts': 'export const a = 1;\n',
        'src/_utils/_low/a/index.ts': "export { a } from './a.util.js';\n",
        'src/_utils/_mid/b/b.util.ts': 'export const b = 1;\n',
        'src/_utils/_mid/b/index.ts': "export { b } from './b.util.js';\n",
      },
    },
    {
      caseName:
        'subCategoryHierarchies (even with 1 matching child) and horizontalHierarchies select the same child',
      config: {
        faf: {
          locals: [
            {
              horizontalHierarchies: [
                {
                  hierarchy: [['_low'], ['_high']],
                  path: 'src/_utils',
                },
              ],
              roles: baseRoles,
              rootLayers: ['src'],
              subCategoryHierarchies: [[['_low'], ['_absent']]],
              subGraphRoles,
            },
          ],
        },
      },
      expected: [
        classificationMessage(
          'faf.config.ts',
          'src/_utils/_low',
          'classification/horizontal-hierarchy-overlap',
          'is selected by more than one Horizontal Hierarchy',
          'FAF §4'
        ),
      ],
      tree: {
        'src/_utils/_high/b/b.util.ts': 'export const b = 1;\n',
        'src/_utils/_high/b/index.ts': "export { b } from './b.util.js';\n",
        'src/_utils/_low/a/a.util.ts': 'export const a = 1;\n',
        'src/_utils/_low/a/index.ts': "export { a } from './a.util.js';\n",
      },
    },
    {
      caseName:
        'two horizontalHierarchies on the same path select the same direct child',
      config: {
        faf: {
          locals: [
            {
              horizontalHierarchies: [
                { hierarchy: [['_types'], ['_utils']], path: 'src' },
                { hierarchy: [['_types'], ['_apis']], path: 'src' },
              ],
              roles,
              rootLayers: ['src'],
              subGraphRoles,
            },
          ],
        },
      },
      expected: [
        classificationMessage(
          'src/_types/a.type.ts',
          'src/_types',
          'classification/horizontal-hierarchy-overlap',
          'is selected by more than one Horizontal Hierarchy',
          'FAF §4'
        ),
      ],
      tree: {
        'src/_apis/a/a.api.ts': 'export const a = 1;\n',
        'src/_apis/a/index.ts': "export { a } from './a.api.js';\n",
        'src/_types/a.type.ts': 'export type TA = string;\n',
        'src/_utils/u/index.ts': "export { u } from './u.util.js';\n",
        'src/_utils/u/u.util.ts': 'export const u = 1;\n',
      },
    },
    {
      caseName:
        'two horizontalHierarchies select disjoint subsets under the same parent',
      config: {
        faf: {
          locals: [
            {
              horizontalHierarchies: [
                { hierarchy: [['_types'], ['_utils']], path: 'src' },
                { hierarchy: [['_components'], ['_pages']], path: 'src' },
              ],
              roles,
              rootLayers: ['src'],
              subGraphRoles,
            },
          ],
        },
      },
      expected: [],
      tree: {
        'src/_components/btn/btn.component.tsx': 'export const btn = 1;\n',
        'src/_components/btn/index.ts':
          "export { btn } from './btn.component.js';\n",
        'src/_pages/home/home.page.tsx': 'export const home = 1;\n',
        'src/_pages/home/index.ts': "export { home } from './home.page.js';\n",
        'src/_types/a.type.ts': 'export type TA = string;\n',
        'src/_utils/u/index.ts': "export { u } from './u.util.js';\n",
        'src/_utils/u/u.util.ts': 'export const u = 1;\n',
      },
    },
    {
      caseName: '_types appears in horizontalHierarchies of distinct parents',
      config: {
        faf: {
          locals: [
            {
              horizontalHierarchies: [
                { hierarchy: [['_types'], ['_utils']], path: 'src/_network' },
                {
                  hierarchy: [['_types'], ['_components']],
                  path: 'src/_ui',
                },
              ],
              roles,
              rootLayers: ['src'],
              subGraphRoles,
            },
          ],
        },
      },
      expected: [],
      tree: {
        'src/_network/_types/a.type.ts': 'export type TA = string;\n',
        'src/_network/_utils/u/index.ts': "export { u } from './u.util.js';\n",
        'src/_network/_utils/u/u.util.ts': 'export const u = 1;\n',
        'src/_ui/_components/btn/btn.component.tsx': 'export const btn = 1;\n',
        'src/_ui/_components/btn/index.ts':
          "export { btn } from './btn.component.js';\n",
        'src/_ui/_types/a.type.ts': 'export type TA = string;\n',
      },
    },
    {
      caseName:
        'two subCategoryHierarchies share only absent names and select no common children',
      config: {
        faf: {
          locals: [
            {
              roles: baseRoles,
              rootLayers: ['src'],
              subCategoryHierarchies: [
                [['_low'], ['_mid']],
                [['_low'], ['_high']],
              ],
              subGraphRoles,
            },
          ],
        },
      },
      expected: [],
      tree: {
        'src/_utils/_high/b/b.util.ts': 'export const b = 1;\n',
        'src/_utils/_high/b/index.ts': "export { b } from './b.util.js';\n",
        'src/_utils/_mid/a/a.util.ts': 'export const a = 1;\n',
        'src/_utils/_mid/a/index.ts': "export { a } from './a.util.js';\n",
      },
    },
    {
      caseName: 'a name appears in two levels of the same hierarchy',
      config: {
        faf: {
          locals: [
            {
              horizontalHierarchies: [
                { hierarchy: [['_types'], ['_types']], path: 'src' },
              ],
              roles,
              rootLayers: ['src'],
              subGraphRoles,
            },
          ],
        },
      },
      expected: [
        configMessage(
          'faf.locals[0].horizontalHierarchies[0].hierarchy[1][0]',
          'configuration/duplicate-element',
          'is a duplicate element',
          'FAF §1.2, §6.9'
        ),
      ],
      tree: baseLayerTree,
    },
    {
      caseName: 'a model selects Path Sub-Categories as children',
      config: {
        faf: {
          locals: [
            {
              horizontalHierarchies: [
                { hierarchy: [['_health'], ['_users']], path: 'src/_apis' },
              ],
              mimeticPathStructures: [
                {
                  actions: ['get'],
                  paths: ['src/_apis'],
                },
              ],
              roles,
              rootLayers: ['src'],
              subGraphRoles,
            },
          ],
        },
      },
      expected: [
        classificationMessage(
          'faf.config.ts',
          'src/_apis',
          'classification/horizontal-hierarchy-members',
          'has a Horizontal Hierarchy over children that FAF does not allow to be ordered',
          'FAF §6.9'
        ),
      ],
      tree: {
        'src/_apis/_health/get-ping/get-ping.api.ts':
          'export const getPing = 1;\n',
        'src/_apis/_health/get-ping/index.ts':
          "export { getPing } from './get-ping.api.js';\n",
        'src/_apis/_users/get-user/get-user.api.ts':
          'export const getUser = 1;\n',
        'src/_apis/_users/get-user/index.ts':
          "export { getUser } from './get-user.api.js';\n",
      },
    },
    {
      caseName: 'a model selects Private Categories inside a Fragment',
      config: {
        faf: {
          locals: [
            {
              horizontalHierarchies: [
                { hierarchy: [['_types'], ['_apis']], path: 'src/_utils/u' },
              ],
              roles,
              rootLayers: ['src'],
              subGraphRoles,
            },
          ],
        },
      },
      expected: [
        classificationMessage(
          'src/_utils/u/u.util.ts',
          'src/_utils/u',
          'classification/horizontal-hierarchy-members',
          'has a Horizontal Hierarchy over children that FAF does not allow to be ordered',
          'FAF §6.9'
        ),
      ],
      tree: {
        'src/_utils/u/_apis/a/a.api.ts': 'export const a = 1;\n',
        'src/_utils/u/_apis/a/index.ts': "export { a } from './a.api.js';\n",
        'src/_utils/u/_types/a.type.ts': 'export type TA = string;\n',
        'src/_utils/u/index.ts': "export { u } from './u.util.js';\n",
        'src/_utils/u/u.util.ts': 'export const u = 1;\n',
      },
    },
    {
      caseName: 'a model selects a Fractal Branch',
      config: {
        faf: {
          locals: [
            {
              horizontalHierarchies: [
                {
                  hierarchy: [['_src@shared'], ['_types']],
                  path: 'src',
                },
              ],
              roles,
              rootLayers: ['src'],
              subGraphRoles,
            },
          ],
        },
      },
      expected: [
        classificationMessage(
          'faf.config.ts',
          'src',
          'classification/horizontal-hierarchy-members',
          'has a Horizontal Hierarchy over children that FAF does not allow to be ordered',
          'FAF §6.9'
        ),
      ],
      tree: {
        'src/_src@shared/_types/a.type.ts': 'export type TA = string;\n',
        'src/_types/b.type.ts': 'export type TB = string;\n',
      },
    },
    {
      caseName: 'a model attempts to order sibling Fragments',
      config: {
        faf: {
          locals: [
            {
              horizontalHierarchies: [
                { hierarchy: [['a'], ['b']], path: 'src/_utils' },
              ],
              roles,
              rootLayers: ['src'],
              subGraphRoles,
            },
          ],
        },
      },
      expected: [
        classificationMessage(
          'faf.config.ts',
          'src/_utils',
          'classification/horizontal-hierarchy-members',
          'has a Horizontal Hierarchy over children that FAF does not allow to be ordered',
          'FAF §6.9'
        ),
      ],
      tree: {
        'src/_utils/a/a.util.ts': 'export const a = 1;\n',
        'src/_utils/a/index.ts': "export { a } from './a.util.js';\n",
        'src/_utils/b/b.util.ts': 'export const b = 1;\n',
        'src/_utils/b/index.ts': "export { b } from './b.util.js';\n",
      },
    },
    {
      caseName: 'a model attempts to order sibling Category Nodes',
      config: {
        faf: {
          locals: [
            {
              horizontalHierarchies: [
                {
                  hierarchy: [['a.type.ts'], ['b.type.ts']],
                  path: 'src/_types',
                },
              ],
              roles,
              rootLayers: ['src'],
              subGraphRoles,
            },
          ],
        },
      },
      expected: [
        classificationMessage(
          'src/_types/a.type.ts',
          'src/_types',
          'classification/horizontal-hierarchy-members',
          'has a Horizontal Hierarchy over children that FAF does not allow to be ordered',
          'FAF §6.9'
        ),
      ],
      tree: {
        'src/_types/a.type.ts': 'export type TA = string;\n',
        'src/_types/b.type.ts': 'export type TB = string;\n',
      },
    },
    {
      caseName: 'a model selects sibling Root Fragments',
      config: {
        faf: {
          locals: [
            {
              horizontalHierarchies: [
                { hierarchy: [['app'], ['docs']], path: 'src' },
              ],
              roles,
              rootFragments: [
                {
                  path: 'src',
                  rootNodes: [['main.ts']],
                  subRootFragments: [
                    { path: 'src/app', rootNodes: [['main.ts']] },
                    { path: 'src/docs', rootNodes: [['main.ts']] },
                  ],
                },
              ],
              subGraphRoles,
            },
          ],
        },
      },
      expected: [
        classificationMessage(
          'src/main.ts',
          'src',
          'classification/horizontal-hierarchy-members',
          'has a Horizontal Hierarchy over children that FAF does not allow to be ordered',
          'FAF §6.9'
        ),
      ],
      tree: {
        'src/app/main.ts': 'export const a = 1;\n',
        'src/docs/main.ts': 'export const d = 1;\n',
        'src/main.ts': 'export const main = 1;\n',
      },
    },
    {
      caseName: 'a domain hierarchy selects files of a Root Fragment',
      config: {
        faf: {
          locals: [
            {
              horizontalHierarchies: [
                { hierarchy: [['a.ts'], ['b.ts']], path: 'src' },
              ],
              roles,
              rootFragments: [
                {
                  path: 'src',
                  rootNodes: [['a.ts', 'b.ts']],
                },
              ],
              subGraphRoles,
            },
          ],
        },
      },
      expected: [
        classificationMessage(
          'src/a.ts',
          'src',
          'classification/horizontal-hierarchy-members',
          'has a Horizontal Hierarchy over children that FAF does not allow to be ordered',
          'FAF §6.9'
        ),
        classificationMessage(
          'src/a.ts',
          'src/a.ts',
          'classification/horizontal-hierarchy-overlap',
          'is selected by more than one Horizontal Hierarchy',
          'FAF §4'
        ),
        classificationMessage(
          'src/b.ts',
          'src/b.ts',
          'classification/horizontal-hierarchy-overlap',
          'is selected by more than one Horizontal Hierarchy',
          'FAF §4'
        ),
      ],
      tree: {
        'src/a.ts': 'export const a = 1;\n',
        'src/b.ts': 'export const b = 1;\n',
      },
    },
  ] as const;

  it.each(conflictCases)(
    'evaluates conflicts and independence: $caseName',
    async (item) => {
      const fixture = await createProject(item.tree, item.config);
      try {
        const result = await lintScenario(fixture.path);
        expectScenario(result, item.expected);
      } finally {
        await fixture.rm();
      }
    }
  );

  it('prohibits dependency across disjoint hierarchies without a common scale', async () => {
    const config = {
      faf: {
        locals: [
          {
            horizontalHierarchies: [
              { hierarchy: [['_atoms'], ['_molecules']], path: 'src' },
              { hierarchy: [['_primitives'], ['_compounds']], path: 'src' },
            ],
            roles,
            rootLayers: ['src'],
            subGraphRoles,
          },
        ],
      },
    };

    const tree: FileTree = {
      'src/_atoms/at/at.atom.tsx': 'export const at = 1;\n',
      'src/_atoms/at/index.ts': "export { at } from './at.atom.js';\n",
      'src/_compounds/comp/comp.compound.ts': 'export const comp = 1;\n',
      'src/_compounds/comp/index.ts':
        "export { comp } from './comp.compound.js';\n",
      'src/_molecules/mol/index.ts':
        "export { mol } from './mol.molecule.js';\n",
      'src/_molecules/mol/mol.molecule.tsx':
        "import { prim } from '../../_primitives/prim/index.js';\nexport const mol = prim;\n",
      'src/_primitives/prim/index.ts':
        "export { prim } from './prim.primitive.js';\n",
      'src/_primitives/prim/prim.primitive.ts': 'export const prim = 1;\n',
    };

    const fixture = await createProject(tree, config);
    try {
      const result = await lintScenario(fixture.path);
      const expected = [
        dependencyMessage(
          'src/_molecules/mol/mol.molecule.tsx',
          'src/_primitives/prim/index.ts',
          '../../_primitives/prim/index.js',
          'dependency/peer-separation',
          'sibling subtrees may depend on each other only downward along a Horizontal Hierarchy',
          'FAF §5'
        ),
      ];
      expectScenario(result, expected);
    } finally {
      await fixture.rm();
    }

    const withinSetTree: FileTree = {
      'src/_atoms/at/at.atom.tsx': 'export const at = 1;\n',
      'src/_atoms/at/index.ts': "export { at } from './at.atom.js';\n",
      'src/_compounds/comp/comp.compound.ts':
        "import { prim } from '../../_primitives/prim/index.js';\nexport const comp = prim;\n",
      'src/_compounds/comp/index.ts':
        "export { comp } from './comp.compound.js';\n",
      'src/_molecules/mol/index.ts':
        "export { mol } from './mol.molecule.js';\n",
      'src/_molecules/mol/mol.molecule.tsx':
        "import { at } from '../../_atoms/at/index.js';\nexport const mol = at;\n",
      'src/_primitives/prim/index.ts':
        "export { prim } from './prim.primitive.js';\n",
      'src/_primitives/prim/prim.primitive.ts': 'export const prim = 1;\n',
    };

    const withinSetFixture = await createProject(withinSetTree, config);
    try {
      const result = await lintScenario(withinSetFixture.path);
      expectScenario(result, []);
    } finally {
      await withinSetFixture.rm();
    }
  });

  it('rejects invalid literal paths in horizontalHierarchies[i].path', async () => {
    const config = {
      faf: {
        locals: [
          {
            horizontalHierarchies: [
              { hierarchy: [['_types'], ['_utils']], path: 'src/../src' },
            ],
            roles,
            rootLayers: ['src'],
            subGraphRoles,
          },
        ],
      },
    };

    const fixture = await createProject(baseLayerTree, config);
    try {
      const result = await lintScenario(fixture.path);
      expectScenario(result, [
        configMessage(
          'faf.locals[0].horizontalHierarchies[0].path',
          'configuration/invalid-literal-path',
          'must be a POSIX relative path without empty or parent segments',
          'FAF §1.2, §6.9'
        ),
      ]);
    } finally {
      await fixture.rm();
    }
  });

  it('rejects _pages placed under _components outside a mimetic structure', async () => {
    const config = {
      faf: {
        locals: [
          {
            roles,
            rootLayers: ['src'],
            subGraphRoles,
          },
        ],
      },
    };

    const tree: FileTree = {
      'src/_components/_pages/home/home.page.tsx': 'export const home = 1;\n',
      'src/_components/_pages/home/index.ts':
        "export { home } from './home.page.js';\n",
    };

    const fixture = await createProject(tree, config);
    try {
      const result = await lintScenario(fixture.path);
      const expected = [
        classificationMessage(
          'faf.config.ts',
          'src/_components/_pages',
          'classification/containment-matrix',
          'is a child type that its parent Logical Domain does not admit',
          'FAF §6.8'
        ),
      ];
      expectScenario(result, expected);
    } finally {
      await fixture.rm();
    }
  });
});

describe('acceptance: Mimetic Path Structure declarations', () => {
  it('distinguishes omission and presence of actions for Path Fragments', async () => {
    const config = {
      faf: {
        locals: [
          {
            mimeticPathStructures: [
              { paths: ['src/_pages'] },
              { actions: ['get', 'post'], paths: ['src/_apis'] },
            ],
            roles,
            rootLayers: ['src'],
            subGraphRoles,
          },
        ],
      },
    };

    const tree: FileTree = {
      'src/_apis/invalid-target/index.ts':
        "export { invalidTarget } from './invalid-target.api.js';\n",
      'src/_apis/invalid-target/invalid-target.api.ts':
        'export const invalidTarget = 1;\n',
      'src/_pages/home/home.page.tsx': 'export const home = 1;\n',
      'src/_pages/home/index.ts': "export { home } from './home.page.js';\n",
    };

    const fixture = await createProject(tree, config);
    try {
      const result = await lintScenario(fixture.path);
      const expected = [
        classificationMessage(
          'src/_apis/invalid-target/invalid-target.api.ts',
          'src/_apis/invalid-target',
          'classification/nomenclature',
          'does not follow the naming contract of its classification',
          'FAF §4, §6.3.5, §6.6'
        ),
        classificationMessage(
          'src/_apis/invalid-target/invalid-target.api.ts',
          'src/_apis/invalid-target/invalid-target.api.ts',
          'classification/nomenclature',
          'does not follow the naming contract of its classification',
          'FAF §4, §6.3.5, §6.6'
        ),
      ];
      expectScenario(result, expected);
    } finally {
      await fixture.rm();
    }
  });

  type TMimeticRejectionCase = {
    readonly caseName: string;
    readonly extraMimeticStructures?: readonly Record<string, unknown>[];
    readonly getExpected: () => readonly TScenarioMessage[];
    readonly mimeticStructure: Record<string, unknown>;
    readonly tree: FileTree;
  };

  const mimeticRejectionCases: readonly TMimeticRejectionCase[] = [
    {
      caseName: 'paths absent or empty',
      getExpected: () => [
        configMessage(
          'faf.locals[0].mimeticPathStructures[0].paths',
          'configuration/empty-list',
          'cannot be an empty list',
          'FAF §1.2, §6.9'
        ),
      ],
      mimeticStructure: { paths: [] },
      tree: baseLayerTree,
    },
    {
      caseName: 'actions present but empty',
      getExpected: () => [
        configMessage(
          'faf.locals[0].mimeticPathStructures[0].actions',
          'configuration/empty-list',
          'cannot be an empty list',
          'FAF §1.2, §6.9'
        ),
      ],
      mimeticStructure: { actions: [], paths: ['src/_apis'] },
      tree: {
        'src/_apis/a/a.api.ts': 'export const a = 1;\n',
        'src/_apis/a/index.ts': "export { a } from './a.api.js';\n",
      },
    },
    {
      caseName: 'repeated actions',
      getExpected: () => [
        configMessage(
          'faf.locals[0].mimeticPathStructures[0].actions[1]',
          'configuration/duplicate-element',
          'is a duplicate element',
          'FAF §1.2, §6.9'
        ),
      ],
      mimeticStructure: { actions: ['get', 'get'], paths: ['src/_apis'] },
      tree: {
        'src/_apis/a/a.api.ts': 'export const a = 1;\n',
        'src/_apis/a/index.ts': "export { a } from './a.api.js';\n",
      },
    },
    {
      caseName: 'action with spaces instead of kebab-case',
      getExpected: () => [
        configMessage(
          'faf.locals[0].mimeticPathStructures[0].actions[0]',
          'configuration/invalid-action-name',
          'must adhere to kebab-case grammar',
          'FAF §6.3.5'
        ),
      ],
      mimeticStructure: { actions: ['get user'], paths: ['src/_apis'] },
      tree: {
        'src/_apis/a/a.api.ts': 'export const a = 1;\n',
        'src/_apis/a/index.ts': "export { a } from './a.api.js';\n",
      },
    },
    {
      caseName: 'path identifying category of Category Nodes',
      getExpected: () => [
        configMessage(
          'src/_types',
          'configuration/incompatible-mimetic-designation',
          'must identify a Category of Fragments',
          'FAF §6.3.5'
        ),
      ],
      mimeticStructure: { paths: ['src/_types'] },
      tree: {
        'src/_types/a.type.ts': 'export type TA = string;\n',
      },
    },
    {
      caseName: 'path identifying a Sub-Category',
      getExpected: () => [
        configMessage(
          'src/_utils/_sub',
          'configuration/incompatible-mimetic-designation',
          'must identify a Category of Fragments',
          'FAF §6.3.5'
        ),
      ],
      mimeticStructure: { paths: ['src/_utils/_sub'] },
      tree: {
        'src/_utils/_sub/a/a.util.ts': 'export const a = 1;\n',
        'src/_utils/_sub/a/index.ts': "export { a } from './a.util.js';\n",
      },
    },
    {
      caseName: 'path identifying a Path Sub-Category',
      extraMimeticStructures: [{ actions: ['get'], paths: ['src/_apis'] }],
      getExpected: () => [
        configMessage(
          'src/_apis/_health',
          'configuration/incompatible-mimetic-designation',
          'must identify a Category of Fragments',
          'FAF §6.3.5'
        ),
      ],
      mimeticStructure: { paths: ['src/_apis/_health'] },
      tree: {
        'src/_apis/_health/get-ping/get-ping.api.ts':
          'export const getPing = 1;\n',
        'src/_apis/_health/get-ping/index.ts':
          "export { getPing } from './get-ping.api.js';\n",
      },
    },
    {
      caseName: 'two declarations on the same path with equal actions',
      extraMimeticStructures: [{ paths: ['src/_apis'] }],
      getExpected: () => [
        configMessage(
          'faf.locals[0].mimeticPathStructures[1].paths[0]',
          'configuration/duplicate-mimetic-path',
          'is designated more than once as a mimetic path',
          'FAF §6.3.5'
        ),
      ],
      mimeticStructure: { paths: ['src/_apis'] },
      tree: {
        'src/_apis/a/a.api.ts': 'export const a = 1;\n',
        'src/_apis/a/index.ts': "export { a } from './a.api.js';\n",
      },
    },
  ];

  it.each(mimeticRejectionCases)(
    'rejects non-unique or inadmissible mimetic designations: $caseName',
    async (item) => {
      const config = {
        faf: {
          locals: [
            {
              mimeticPathStructures: [
                item.mimeticStructure,
                ...(item.extraMimeticStructures ?? []),
              ],
              roles,
              rootLayers: ['src'],
              subGraphRoles,
            },
          ],
        },
      };

      const fixture = await createProject(item.tree, config);
      try {
        const result = await lintScenario(fixture.path);
        const expected = item.getExpected();
        expectScenario(result, expected);
      } finally {
        await fixture.rm();
      }
    }
  );

  it('verifies mimetic designation without certifying external contract fidelity', async () => {
    const config = {
      faf: {
        locals: [
          {
            mimeticPathStructures: [
              { actions: ['get', 'post'], paths: ['src/_apis'] },
            ],
            roles,
            rootLayers: ['src'],
            subGraphRoles,
          },
        ],
      },
    };

    const tree: FileTree = {
      'src/_apis/get-user/get-user.api.ts': 'export const getUser = 1;\n',
      'src/_apis/get-user/index.ts':
        "export { getUser } from './get-user.api.js';\n",
    };

    const fixture = await createProject(tree, config);
    try {
      const result = await lintScenario(fixture.path);
      expectScenario(result, []);
    } finally {
      await fixture.rm();
    }
  });
});

describe('acceptance: Path Alias source exclusivity and validation', () => {
  const aliasSourceCases = [
    {
      aliases: null,
      caseName: 'imports absent, aliases absent',
      expected: [],
      imports: null,
    },
    {
      aliases: { '#shared': 'src/_src@shared' },
      caseName: 'imports absent, aliases present',
      expected: [],
      imports: null,
    },
    {
      aliases: null,
      caseName: 'valid imports map present, aliases absent',
      expected: [],
      imports: { '#shared/*': './src/_src@shared/*' },
    },
    {
      aliases: null,
      caseName: 'empty object imports present, aliases absent',
      expected: [],
      imports: {},
    },
    {
      aliases: { '#shared': 'src/_src@shared' },
      caseName: 'valid imports map present, aliases present',
      expected: [
        configMessage(
          'faf.config.ts',
          'configuration/duplicate-alias-source',
          'cannot declare path aliases when package.json imports are present',
          'FAF §7.4'
        ),
      ],
      imports: { '#shared/*': './src/_src@shared/*' },
    },
    {
      aliases: { '#shared': 'src/_src@shared' },
      caseName: 'empty object imports present, aliases present',
      expected: [
        configMessage(
          'faf.config.ts',
          'configuration/duplicate-alias-source',
          'cannot declare path aliases when package.json imports are present',
          'FAF §7.4'
        ),
      ],
      imports: {},
    },
    {
      aliases: null,
      caseName: 'invalid imports value present, aliases absent',
      expected: [
        configMessage(
          'package.json',
          'configuration/invalid-alias-source',
          'must declare valid imports with subpath keys',
          'FAF §7.4',
          'package.json imports must be a JSON object'
        ),
      ],
      imports: 'invalid',
    },
    {
      aliases: { '#shared': 'src/_src@shared' },
      caseName: 'invalid imports value present, aliases present',
      expected: [
        configMessage(
          'package.json',
          'configuration/invalid-alias-source',
          'must declare valid imports with subpath keys',
          'FAF §7.4',
          'package.json imports must be a JSON object'
        ),
      ],
      imports: 'invalid',
    },
  ] as const;

  it.each(aliasSourceCases)(
    'chooses alias source without merging or silent fallback: $caseName',
    async ({ aliases, expected, imports }) => {
      const config = {
        faf: {
          ...(aliases !== null && { common: { aliases } }),
          locals: [
            {
              roles,
              rootLayers: ['src'],
              subGraphRoles,
            },
          ],
        },
      };

      const tree: FileTree = {
        ...baseLayerTree,
        'src/_src@shared': {},
        ...(imports !== null && {
          'package.json': JSON.stringify({
            imports,
            type: 'module',
          }),
        }),
      };

      const fixture = await createProject(tree, config);
      try {
        const result = await lintScenario(fixture.path);
        expectScenario(result, expected);
      } finally {
        await fixture.rm();
      }
    }
  );

  it('validates direct alias map containing only literal prefixes and bases', async () => {
    const config = {
      faf: {
        common: {
          aliases: {
            '#shared': 'src/_src@shared',
          },
        },
        locals: [
          {
            roles,
            rootLayers: ['src'],
            subGraphRoles,
          },
        ],
      },
    };

    const tree: FileTree = {
      ...baseLayerTree,
      'src/_src@shared/_types/a.type.ts': 'export type TA = string;\n',
    };

    const fixture = await createProject(tree, config);
    try {
      const result = await lintScenario(fixture.path);
      expectScenario(result, []);
    } finally {
      await fixture.rm();
    }
  });

  it('matches prefixes respecting segment boundary and longest length', async () => {
    const config = {
      faf: {
        common: {
          aliases: {
            '#shared': 'src/_src@shared',
            '#shared/apis': 'src/_src@shared/_network/_apis/_apis@shared',
          },
        },
        locals: [
          {
            roles,
            rootLayers: ['src'],
            subGraphRoles,
          },
        ],
      },
    };

    const tsconfig = JSON.stringify({
      compilerOptions: {
        baseUrl: '.',
        paths: {
          '#shared/*': ['./src/_src@shared/*'],
          '#shared/apis/*': ['./src/_src@shared/_network/_apis/_apis@shared/*'],
        },
      },
    });

    const validTree: FileTree = {
      ...baseLayerTree,
      'src/_src@shared/_network/_apis/_apis@shared/_utils/u/index.ts':
        "export { u } from './u.util.js';\n",
      'src/_src@shared/_network/_apis/_apis@shared/_utils/u/u.util.ts':
        'export const u = 1;\n',
      'src/_src@shared/_network/_apis/service/index.ts':
        "export { service } from './service.api.js';\n",
      'src/_src@shared/_network/_apis/service/service.api.ts':
        "import { u } from '#shared/apis/_utils/u/index.js';\nexport const service = u;\n",
      'src/_src@shared/_ui/_types/a.type.ts': 'export type TA = string;\n',
      'src/_utils/widget/widget.util.ts':
        "import type { TA } from '#shared/_ui/_types/a.type.js';\nexport const widget: TA = 'widget';\n",
      'tsconfig.json': tsconfig,
    };

    const validFixture = await createProject(validTree, config);
    try {
      const result = await lintScenario(validFixture.path);
      expectScenario(result, []);
    } finally {
      await validFixture.rm();
    }

    const mismatchTree: FileTree = {
      ...validTree,
      'src/_utils/widget/widget.util.ts':
        "import '#sharedness/something.js';\nexport const widget = 1;\n",
    };
    const mismatchFixture = await createProject(mismatchTree, config);
    try {
      const result = await lintScenario(mismatchFixture.path);
      const expected = [
        createScenarioMessage(
          'src/_utils/widget/widget.util.ts',
          'src/_utils/widget/widget.util.ts',
          'unverified/unresolved-import',
          "'src/_utils/widget/widget.util.ts' contains an import that could not be resolved: Cannot find module '#sharedness/something.js'",
          'FAF §4',
          'unverified'
        ),
      ];
      expectScenario(result, expected);
    } finally {
      await mismatchFixture.rm();
    }

    const exactTree: FileTree = {
      ...validTree,
      'src/_utils/widget/widget.util.ts':
        "import '#shared';\nexport const widget = 1;\n",
    };
    const exactFixture = await createProject(exactTree, config);
    try {
      const result = await lintScenario(exactFixture.path);
      const expected = [
        createScenarioMessage(
          'src/_utils/widget/widget.util.ts',
          'src/_utils/widget/widget.util.ts',
          'unverified/unresolved-import',
          "'src/_utils/widget/widget.util.ts' contains an import that could not be resolved: Cannot find module '#shared'",
          'FAF §4',
          'unverified'
        ),
      ];
      expectScenario(result, expected);
    } finally {
      await exactFixture.rm();
    }
  });

  it('verifies branch anchoring across all local alternatives of imports', async () => {
    const root = { path: 'src', rootNodes: [['high.ts'], ['low.ts']] };
    const config = {
      faf: {
        locals: [
          {
            roles,
            rootFragments: [root],
            subGraphRoles,
          },
        ],
      },
    };

    const tree: FileTree = {
      ...baseLayerTree,
      'package.json': JSON.stringify({
        imports: {
          '#shared/*': ['./src/_src@shared/*', './src/_utils/widget/*'],
        },
        type: 'module',
      }),
      'src/_src@shared/_types/a.type.ts': 'export type TA = string;\n',
      'src/high.ts': "import '#shared/_types/a.type.ts';\n",
      'src/low.ts': 'export const low = 1;\n',
    };

    const fixture = await createProject(tree, config);
    try {
      const result = await lintScenario(fixture.path);
      const expected = [
        dependencyMessage(
          'src/high.ts',
          'src/_src@shared/_types/a.type.ts',
          '#shared/_types/a.type.ts',
          'dependency/path-alias-anchoring',
          'a Path Alias importing its own Fractal Tree must have a Fractal Branch of that Tree as base in every alternative',
          'FAF §7.4'
        ),
      ];
      expectScenario(result, expected);
    } finally {
      await fixture.rm();
    }
  });

  it('does not implicitly scan other tool manifests', async () => {
    const config = {
      faf: {
        common: {
          aliases: {
            '#shared': 'src/_src@shared',
          },
        },
        locals: [
          {
            roles,
            rootLayers: ['src'],
            subGraphRoles,
          },
        ],
      },
    };

    const tree: FileTree = {
      ...baseLayerTree,
      'src/_src@shared/_types/a.type.ts': 'export type TA = string;\n',
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          paths: {
            '@external/*': ['./other/*'],
          },
        },
      }),
    };

    const fixture = await createProject(tree, config);
    try {
      const result = await lintScenario(fixture.path);
      expectScenario(result, []);
    } finally {
      await fixture.rm();
    }
  });

  it('detects discordance when an undeclared tsconfig path alias is imported', async () => {
    const config = {
      faf: {
        common: {
          aliases: {
            '#shared': 'src/_src@shared',
          },
        },
        locals: [
          {
            roles,
            rootLayers: ['src'],
            subGraphRoles,
          },
        ],
      },
    };

    const tree: FileTree = {
      ...baseLayerTree,
      'src/_src@shared/_types/a.type.ts': 'export type TA = string;\n',
      'src/_utils/widget/widget.util.ts':
        "import '@undeclared/_types/a.type.js';\nexport const widget = 1;\n",
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          baseUrl: '.',
          paths: {
            '#shared/*': ['./src/_src@shared/*'],
            '@undeclared/*': ['./src/_src@shared/*'],
          },
        },
      }),
    };

    const fixture = await createProject(tree, config);
    try {
      const result = await lintScenario(fixture.path);
      const expected = [
        createScenarioMessage(
          'src/_utils/widget/widget.util.ts',
          'src/_utils/widget/widget.util.ts',
          'unverified/unresolved-import',
          "'src/_utils/widget/widget.util.ts' contains an import that could not be resolved: Path alias resolution falls outside the declared alias targets",
          'FAF §4',
          'unverified'
        ),
      ];
      expectScenario(result, expected);
    } finally {
      await fixture.rm();
    }
  });

  it('rejects common.aliases pointing to a missing directory', async () => {
    const config = {
      faf: {
        common: {
          aliases: {
            '#shared': 'src/nonexistent',
          },
        },
        locals: [
          {
            roles,
            rootLayers: ['src'],
            subGraphRoles,
          },
        ],
      },
    };

    const fixture = await createProject(baseLayerTree, config);
    try {
      const result = await lintScenario(fixture.path);
      const expected = [
        configMessage(
          'src/nonexistent',
          'configuration/non-existent-path',
          'does not exist',
          'FAF §1.2, §6.9',
          `Alias base "src/nonexistent" does not exist under configuration base "${fixture.path}"`
        ),
      ];
      expectScenario(result, expected);
    } finally {
      await fixture.rm();
    }
  });

  it('rejects common.aliases pointing to an existing file', async () => {
    const config = {
      faf: {
        common: {
          aliases: {
            '#shared': 'src/_utils/widget/widget.util.ts',
          },
        },
        locals: [
          {
            roles,
            rootLayers: ['src'],
            subGraphRoles,
          },
        ],
      },
    };

    const fixture = await createProject(baseLayerTree, config);
    try {
      const result = await lintScenario(fixture.path);
      const expected = [
        configMessage(
          'src/_utils/widget/widget.util.ts',
          'configuration/expected-directory',
          'must be a directory',
          'FAF §1.2, §6.9',
          'Alias base "src/_utils/widget/widget.util.ts" must be a directory'
        ),
      ];
      expectScenario(result, expected);
    } finally {
      await fixture.rm();
    }
  });

  it('rejects common.aliases containing wildcard asterisk in value', async () => {
    const config = {
      faf: {
        common: {
          aliases: {
            '#shared': 'src/_src@shared/*',
          },
        },
        locals: [
          {
            roles,
            rootLayers: ['src'],
            subGraphRoles,
          },
        ],
      },
    };

    const fixture = await createProject(baseLayerTree, config);
    try {
      const result = await lintScenario(fixture.path);
      const expected = [
        configMessage(
          'faf.common.aliases.#shared',
          'configuration/invalid-literal-path',
          'must be a POSIX relative path without empty or parent segments',
          'FAF §1.2, §6.9'
        ),
      ];
      expectScenario(result, expected);
    } finally {
      await fixture.rm();
    }
  });
});

describe('acceptance: frontier declarations and scope filtering', () => {
  it('exposes only enumerated root nodes via publicRootNodes', async () => {
    const config = {
      faf: {
        locals: [
          {
            publicRootNodes: ['src/app/app.tsx'],
            roles,
            rootFragments: [
              {
                path: 'src',
                rootNodes: [['main.ts']],
                subRootFragments: [
                  {
                    path: 'src/app',
                    rootNodes: [['app.tsx']],
                  },
                ],
              },
            ],
            subGraphRoles,
          },
        ],
      },
    };

    const tree: FileTree = {
      'src/app/app.tsx': 'export const app = 1;\n',
      'src/main.ts': 'export const main = 1;\n',
    };

    const fixture = await createProject(tree, config);
    try {
      const result = await lintScenario(fixture.path);
      expectScenario(result, []);
    } finally {
      await fixture.rm();
    }
  });

  it('preserves structural public surface for root layers when publicRootNodes is empty', async () => {
    const config = {
      faf: {
        locals: [
          {
            publicRootNodes: [],
            roles,
            rootLayers: ['src'],
            subGraphRoles,
          },
        ],
      },
    };

    const fixture = await createProject(baseLayerTree, config);
    try {
      const result = await lintScenario(fixture.path);
      expectScenario(result, []);
    } finally {
      await fixture.rm();
    }
  });

  it('authorizes tree relationships through origin cartesian product', async () => {
    const config = {
      faf: {
        locals: [
          {
            roles,
            rootLayers: ['src', 'lib', 'destA', 'destB'],
            subGraphRoles,
            treeDependencies: [
              {
                from: ['src', 'lib'],
                to: ['destA', 'destB'],
              },
            ],
          },
        ],
      },
    };

    const tree: FileTree = {
      'destA/_utils/w/index.ts': "export { w } from './w.util.js';\n",
      'destA/_utils/w/w.util.ts': 'export const w = 1;\n',
      'destB/_utils/w/index.ts': "export { w } from './w.util.js';\n",
      'destB/_utils/w/w.util.ts': 'export const w = 1;\n',
      'lib/_utils/w/index.ts': "export { w } from './w.util.js';\n",
      'lib/_utils/w/w.util.ts':
        "import { w as wa } from '../../../destA/_utils/w/index.js';\nimport { w as wb } from '../../../destB/_utils/w/index.js';\nexport const w = wa + wb;\n",
      'src/_utils/w/index.ts': "export { w } from './w.util.js';\n",
      'src/_utils/w/w.util.ts':
        "import { w as wa } from '../../../destA/_utils/w/index.js';\nimport { w as wb } from '../../../destB/_utils/w/index.js';\nexport const w = wa + wb;\n",
    };

    const fixture = await createProject(tree, config);
    try {
      const result = await lintScenario(fixture.path);
      expectScenario(result, []);
    } finally {
      await fixture.rm();
    }
  });

  it('rejects self tree dependency', async () => {
    const config = {
      faf: {
        locals: [
          {
            roles,
            rootLayers: ['src'],
            subGraphRoles,
            treeDependencies: [
              {
                from: ['src'],
                to: ['src'],
              },
            ],
          },
        ],
      },
    };

    const fixture = await createProject(baseLayerTree, config);
    try {
      const result = await lintScenario(fixture.path);
      const expected = [
        configMessage(
          'src',
          'configuration/tree-dependency-self',
          'cannot declare a tree dependency on itself',
          'FAF §7.2'
        ),
      ];
      expectScenario(result, expected);
    } finally {
      await fixture.rm();
    }
  });

  it('rejects tree dependency targeting a nested rootFragment path instead of tree origin', async () => {
    const config = {
      faf: {
        locals: [
          {
            roles,
            rootFragments: [
              {
                path: 'dest',
                rootNodes: [['main.ts']],
                subRootFragments: [
                  { path: 'dest/sub', rootNodes: [['sub.ts']] },
                ],
              },
            ],
            rootLayers: ['src'],
            subGraphRoles,
            treeDependencies: [
              {
                from: ['src'],
                to: ['dest/sub'],
              },
            ],
          },
        ],
      },
    };

    const tree: FileTree = {
      ...baseLayerTree,
      'dest/main.ts': 'export const main = 1;\n',
      'dest/sub/sub.ts': 'export const sub = 1;\n',
    };

    const fixture = await createProject(tree, config);
    try {
      const result = await lintScenario(fixture.path);
      const expected = [
        configMessage(
          'dest/sub',
          'configuration/tree-dependency-not-tree-origin',
          'must identify a declared tree origin as a tree dependency',
          'FAF §7.2'
        ),
      ];
      expectScenario(result, expected);
    } finally {
      await fixture.rm();
    }
  });

  it('rejects tree dependency targeting a non-existent origin path', async () => {
    const config = {
      faf: {
        locals: [
          {
            roles,
            rootLayers: ['src'],
            subGraphRoles,
            treeDependencies: [
              {
                from: ['src'],
                to: ['nonexistent'],
              },
            ],
          },
        ],
      },
    };

    const fixture = await createProject(baseLayerTree, config);
    try {
      const result = await lintScenario(fixture.path);
      const expected = [
        configMessage(
          'nonexistent',
          'configuration/non-existent-path',
          'does not exist',
          'FAF §1.2, §6.9',
          `Tree dependency target "nonexistent" does not exist under configuration base "${fixture.path}"`
        ),
      ];
      expectScenario(result, expected);
    } finally {
      await fixture.rm();
    }
  });

  it('authorizes only exact file pairs via externalDependencies', async () => {
    const config = {
      faf: {
        locals: [
          {
            externalDependencies: [
              {
                from: ['src/_utils/legacy-client/legacy-client.util.ts'],
                to: ['legacy/client.ts'],
              },
            ],
            roles,
            rootLayers: ['src'],
            subGraphRoles,
          },
        ],
      },
    };

    const tree: FileTree = {
      'legacy/client.ts': 'export const client = 1;\n',
      'src/_utils/legacy-client/index.ts':
        "export { legacyClient } from './legacy-client.util.js';\n",
      'src/_utils/legacy-client/legacy-client.util.ts':
        "import { client } from '../../../legacy/client.js';\nexport const legacyClient = client;\n",
    };

    const fixture = await createProject(tree, config);
    try {
      const result = await lintScenario(fixture.path);
      expectScenario(result, []);
    } finally {
      await fixture.rm();
    }
  });

  type TExternalSelectorCase = {
    readonly aliases?: Record<string, string>;
    readonly caseName: string;
    readonly extraForeignNodes?: readonly string[];
    readonly from: readonly string[];
    readonly getExpected: (
      baseDirectory: string
    ) => readonly TScenarioMessage[];
    readonly to: readonly string[];
    readonly tree: FileTree;
  };

  const externalSelectorCases: readonly TExternalSelectorCase[] = [
    {
      caseName: 'from identifies a Fragment directory',
      from: ['src/_utils/widget'],
      getExpected: () => [
        configMessage(
          'src/_utils/widget',
          'configuration/expected-file',
          'must be a file',
          'FAF §1.2, §6.9',
          'External dependency source "src/_utils/widget" must be a file'
        ),
      ],
      to: ['legacy/client.ts'],
      tree: { ...baseLayerTree, 'legacy/client.ts': 'export const c = 1;\n' },
    },
    {
      caseName: 'from identifies a Category directory',
      from: ['src/_utils'],
      getExpected: () => [
        configMessage(
          'src/_utils',
          'configuration/expected-file',
          'must be a file',
          'FAF §1.2, §6.9',
          'External dependency source "src/_utils" must be a file'
        ),
      ],
      to: ['legacy/client.ts'],
      tree: { ...baseLayerTree, 'legacy/client.ts': 'export const c = 1;\n' },
    },
    {
      caseName: 'to identifies an external directory',
      from: ['src/_utils/widget/widget.util.ts'],
      getExpected: () => [
        configMessage(
          'legacy',
          'configuration/expected-file',
          'must be a file',
          'FAF §1.2, §6.9',
          'External dependency target "legacy" must be a file'
        ),
      ],
      to: ['legacy'],
      tree: {
        ...baseLayerTree,
        'legacy/client.ts': 'export const c = 1;\n',
      },
    },
    {
      caseName: 'from identifies an Access Node',
      from: ['src/_utils/widget/index.ts'],
      getExpected: () => [
        configMessage(
          'src/_utils/widget/index.ts',
          'configuration/invalid-external-dependency-source',
          'must be an authorized logical node in externalDependencies',
          'FAF §7.3'
        ),
      ],
      to: ['legacy/client.ts'],
      tree: { ...baseLayerTree, 'legacy/client.ts': 'export const c = 1;\n' },
    },
    {
      caseName: 'from identifies a Foreign Node',
      extraForeignNodes: ['src/README.md'],
      from: ['src/README.md'],
      getExpected: () => [
        configMessage(
          'src/README.md',
          'configuration/invalid-external-dependency-source',
          'must be an authorized logical node in externalDependencies',
          'FAF §7.3'
        ),
      ],
      to: ['legacy/client.ts'],
      tree: {
        ...baseLayerTree,
        'legacy/client.ts': 'export const c = 1;\n',
        'src/README.md': '# Hello\n',
      },
    },
    {
      caseName: 'from identifies a file outside all Trees',
      from: ['outside.ts'],
      getExpected: () => [
        configMessage(
          'outside.ts',
          'configuration/reference-outside-trees',
          'must be inside a Fractal Tree of this configuration',
          'FAF §6',
          'External dependency source "outside.ts" must be inside a Fractal Tree of this configuration'
        ),
      ],
      to: ['legacy/client.ts'],
      tree: {
        ...baseLayerTree,
        'legacy/client.ts': 'export const c = 1;\n',
        'outside.ts': 'export const o = 1;\n',
      },
    },
    {
      caseName: 'to identifies a file inside a Tree',
      from: ['src/_utils/widget/widget.util.ts'],
      getExpected: () => [
        configMessage(
          'src/_utils/widget/index.ts',
          'configuration/external-dependency-to-inside-tree',
          'must be outside all Fractal Trees as an external dependency target',
          'FAF §7.3'
        ),
      ],
      to: ['src/_utils/widget/index.ts'],
      tree: baseLayerTree,
    },
    {
      caseName: 'to identifies a library in node_modules',
      from: ['src/_utils/widget/widget.util.ts'],
      getExpected: () => [
        configMessage(
          'node_modules/pkg/index.js',
          'configuration/external-dependency-to-library',
          'cannot be targeted as an external dependency because it is a node_modules library',
          'FAF §7.3'
        ),
      ],
      to: ['node_modules/pkg/index.js'],
      tree: {
        ...baseLayerTree,
        'node_modules/pkg/index.js': 'export const p = 1;\n',
      },
    },
    {
      caseName: 'one of the enumerated files does not exist',
      from: ['src/_utils/widget/widget.util.ts'],
      getExpected: (baseDirectory: string) => [
        configMessage(
          'legacy/missing.ts',
          'configuration/non-existent-path',
          'does not exist',
          'FAF §1.2, §6.9',
          `External dependency target "legacy/missing.ts" does not exist under configuration base "${baseDirectory}"`
        ),
      ],
      to: ['legacy/missing.ts'],
      tree: baseLayerTree,
    },
    {
      caseName: 'abbreviated reference requires extension search',
      from: ['src/_utils/widget/widget.util.ts'],
      getExpected: (baseDirectory: string) => [
        configMessage(
          'legacy/client',
          'configuration/non-existent-path',
          'does not exist',
          'FAF §1.2, §6.9',
          `External dependency target "legacy/client" does not exist under configuration base "${baseDirectory}"`
        ),
      ],
      to: ['legacy/client'],
      tree: { ...baseLayerTree, 'legacy/client.ts': 'export const c = 1;\n' },
    },
    {
      aliases: { '#shared': 'src/_src@shared' },
      caseName: 'target value attempts alias selection',
      from: ['src/_utils/widget/widget.util.ts'],
      getExpected: () => [
        configMessage(
          '#shared/client.ts',
          'configuration/external-dependency-to-alias',
          'cannot be targeted as an external dependency because it is a path alias',
          'FAF §7.3'
        ),
      ],
      to: ['#shared/client.ts'],
      tree: {
        ...baseLayerTree,
        'src/_src@shared/_types/a.type.ts': 'export type TA = string;\n',
      },
    },
  ];

  it.each(externalSelectorCases)(
    'rejects non-exact or out-of-scope external selectors: $caseName',
    async (item) => {
      const config = {
        faf: {
          ...(item.aliases !== undefined && {
            common: { aliases: item.aliases },
          }),
          locals: [
            {
              externalDependencies: [{ from: item.from, to: item.to }],
              ...(item.extraForeignNodes !== undefined && {
                foreignNodes: item.extraForeignNodes,
              }),
              roles,
              rootLayers: ['src'],
              subGraphRoles,
            },
          ],
        },
      };

      const fixture = await createProject(item.tree, config);
      try {
        const result = await lintScenario(fixture.path);
        const expected = item.getExpected(fixture.path);
        expectScenario(result, expected);
      } finally {
        await fixture.rm();
      }
    }
  );

  it('enforces exact file restriction without substituting FAF contract', async () => {
    const config = {
      faf: {
        locals: [
          {
            externalDependencies: [
              {
                from: ['src/_utils/widget'],
                to: ['legacy/client.ts'],
              },
            ],
            roles,
            rootLayers: ['src'],
            subGraphRoles,
          },
        ],
      },
    };

    const tree: FileTree = {
      ...baseLayerTree,
      'legacy/client.ts': 'export const c = 1;\n',
    };

    const fixture = await createProject(tree, config);
    try {
      const result = await lintScenario(fixture.path);
      const expected = [
        configMessage(
          'src/_utils/widget',
          'configuration/expected-file',
          'must be a file',
          'FAF §1.2, §6.9',
          'External dependency source "src/_utils/widget" must be a file'
        ),
      ];
      expectScenario(result, expected);
    } finally {
      await fixture.rm();
    }
  });
});

describe('acceptance: runtime validation of optional properties and structural types', () => {
  const runtimeValidatorCases = [
    {
      caseName: 'nonexistent punctual path',
      config: {
        faf: {
          locals: [
            {
              foreignNodes: ['src/nonexistent.ts'],
              roles,
              rootLayers: ['src'],
              subGraphRoles,
            },
          ],
        },
      },
      getExpected: (baseDirectory: string) => [
        configMessage(
          'src/nonexistent.ts',
          'configuration/non-existent-path',
          'does not exist',
          'FAF §1.2, §6.9',
          `Foreign node "src/nonexistent.ts" does not exist under configuration base "${baseDirectory}"`
        ),
      ],
      tree: baseLayerTree,
    },
    {
      caseName: 'existing directory in externalDependencies.from',
      config: {
        faf: {
          locals: [
            {
              externalDependencies: [
                {
                  from: ['src/_utils/widget'],
                  to: ['legacy/client.ts'],
                },
              ],
              roles,
              rootLayers: ['src'],
              subGraphRoles,
            },
          ],
        },
      },
      getExpected: () => [
        configMessage(
          'src/_utils/widget',
          'configuration/expected-file',
          'must be a file',
          'FAF §1.2, §6.9',
          'External dependency source "src/_utils/widget" must be a file'
        ),
      ],
      tree: { ...baseLayerTree, 'legacy/client.ts': 'export const c = 1;\n' },
    },
    {
      caseName: 'existing directory in externalDependencies.to',
      config: {
        faf: {
          locals: [
            {
              externalDependencies: [
                {
                  from: ['src/_utils/widget/widget.util.ts'],
                  to: ['legacy'],
                },
              ],
              roles,
              rootLayers: ['src'],
              subGraphRoles,
            },
          ],
        },
      },
      getExpected: () => [
        configMessage(
          'legacy',
          'configuration/expected-file',
          'must be a file',
          'FAF §1.2, §6.9',
          'External dependency target "legacy" must be a file'
        ),
      ],
      tree: { ...baseLayerTree, 'legacy/client.ts': 'export const c = 1;\n' },
    },
    {
      caseName: 'unknown property on composite object',
      config: {
        extra: true,
        faf: {
          locals: [
            {
              roles,
              rootLayers: ['src'],
              subGraphRoles,
            },
          ],
        },
      },
      getExpected: () => [
        configMessage(
          'extra',
          'configuration/unknown-property',
          'is not a recognized property',
          'FAF §1.2, §6.9'
        ),
      ],
      tree: baseLayerTree,
    },
    {
      caseName: 'roles missing in both common and local config',
      config: {
        faf: {
          locals: [
            {
              rootLayers: ['src'],
              subGraphRoles,
            },
          ],
        },
      },
      getExpected: () => [
        configMessage(
          'faf.config.ts',
          'configuration/missing-roles',
          'must declare a roles catalog in local or common configuration',
          'FAF §6.3.1'
        ),
      ],
      tree: baseLayerTree,
    },
    {
      caseName: 'explicit undefined in optional property',
      config: {
        faf: {
          locals: [
            {
              roles: [
                {
                  allowMultipleSymbols: void 0,
                  category: '_utils',
                  name: 'util',
                },
              ],
              rootLayers: ['src'],
              subGraphRoles,
            },
          ],
        },
      },
      getExpected: () => [
        configMessage(
          'faf.locals[0].roles[0].allowMultipleSymbols',
          'configuration/explicit-undefined',
          'cannot be explicitly undefined',
          'FAF §1.2, §6.9'
        ),
      ],
      tree: baseLayerTree,
    },
    {
      caseName: 'empty string in role category',
      config: {
        faf: {
          locals: [
            {
              roles: [{ category: '', name: 'util' }],
              rootLayers: ['src'],
              subGraphRoles,
            },
          ],
        },
      },
      getExpected: () => [
        configMessage(
          'faf.locals[0].roles[0].category',
          'configuration/empty-string',
          'cannot be an empty string',
          'FAF §1.2, §6.9'
        ),
      ],
      tree: baseLayerTree,
    },
    {
      caseName: 'duplicate role name across tiers',
      config: {
        faf: {
          locals: [
            {
              roles: [
                { category: '_utils', name: 'util' },
                { category: '_helpers', name: 'util' },
              ],
              rootLayers: ['src'],
              subGraphRoles,
            },
          ],
        },
      },
      getExpected: () => [
        configMessage(
          'faf.locals[0].roles[1].name',
          'configuration/duplicate-role-name',
          'is declared more than once in the role catalog',
          'FAF §6.3.1',
          'Duplicate role name "util"'
        ),
      ],
      tree: baseLayerTree,
    },
    {
      caseName: 'path containing dot-dot segment',
      config: {
        faf: {
          locals: [
            {
              roles,
              rootLayers: ['src/../src'],
              subGraphRoles,
            },
          ],
        },
      },
      getExpected: () => [
        configMessage(
          'faf.locals[0].rootLayers[0]',
          'configuration/invalid-literal-path',
          'must be a POSIX relative path without empty or parent segments',
          'FAF §1.2, §6.9'
        ),
      ],
      tree: baseLayerTree,
    },
  ] as const;

  it.each(runtimeValidatorCases)(
    'validates runtime constraints beyond static typing: $caseName',
    async (item) => {
      const fixture = await createProject(item.tree, item.config);
      try {
        const result = await lintScenario(fixture.path);
        const expected = item.getExpected(fixture.path);
        expectScenario(result, expected);
      } finally {
        await fixture.rm();
      }
    }
  );
});

describe('acceptance: multi-tree configuration verification on a synthetic inventory', () => {
  it('compiles without asserting that its paths exist and rejects missing path at runtime', async () => {
    const missingTree = { ...fullHypotheticalTree };
    delete missingTree['legacy/client.ts'];

    const fixture = await createProject(missingTree, fullHypotheticalConfig);
    try {
      const result = await lintScenario(fixture.path);
      const expected = [
        configMessage(
          'legacy/client.ts',
          'configuration/non-existent-path',
          'does not exist',
          'FAF §1.2, §6.9',
          `External dependency target "legacy/client.ts" does not exist under configuration base "${fixture.path}"`
        ),
      ];
      expectScenario(result, expected);
    } finally {
      await fixture.rm();
    }
  });

  const hypotheticalPropertiesCases = [
    {
      name: 'preserves custom role ranks without imposing reference model and treats src/_configs as foreign',
    },
    {
      name: 'replaces general hierarchies while preserving the three local hierarchies',
    },
  ] as const;

  it.each(hypotheticalPropertiesCases)('$name', async () => {
    const fixture = await createProject(
      fullHypotheticalTree,
      fullHypotheticalConfig
    );
    try {
      const result = await lintScenario(fixture.path);
      expectScenario(result, []);
    } finally {
      await fixture.rm();
    }
  });

  it('separates root hierarchy, exposure and inter-tree relations in example', async () => {
    const positiveFixture = await createProject(
      fullHypotheticalTree,
      fullHypotheticalConfig
    );
    try {
      const result = await lintScenario(positiveFixture.path);
      expectScenario(result, []);
    } finally {
      await positiveFixture.rm();
    }

    const inverseRootTree: FileTree = {
      ...fullHypotheticalTree,
      'src/app/app.tsx': "import '../main.js';\nexport const App = 1;\n",
      'src/main.tsx': "import './main.css';\nexport const Main = 1;\n",
    };
    const inverseRootFixture = await createProject(
      inverseRootTree,
      fullHypotheticalConfig
    );
    try {
      const result = await lintScenario(inverseRootFixture.path);
      const expected = [
        dependencyMessage(
          'src/app/app.tsx',
          'src/main.tsx',
          '../main.js',
          'dependency/root-node-discipline',
          'a Root Node is importable only by Root Nodes authorized by rootNodes or dependencyEdges',
          'FAF §6.2.2'
        ),
      ];
      expectScenario(result, expected);
    } finally {
      await inverseRootFixture.rm();
    }

    const inverseTreeTree: FileTree = {
      ...fullHypotheticalTree,
      'packages/contracts/src/_types/todo.type.ts':
        "import '../../../../src/app/app.js';\nexport type TTodo = string;\n",
      'src/_src@shared/_network/_apis/_health/get-health/get-health.api.ts':
        "import { legacyClientAdapter } from '#/_apis@shared/_utils/legacy-client/index.js';\nimport { formatLabel } from '../../../../../../packages/formatters/src/_utils/format-label/index.js';\nexport const getHealth = (): unknown => ({ a: formatLabel, b: legacyClientAdapter() });\n",
    };
    const inverseTreeFixture = await createProject(
      inverseTreeTree,
      fullHypotheticalConfig
    );
    try {
      const result = await lintScenario(inverseTreeFixture.path);
      const expected = [
        dependencyMessage(
          'packages/contracts/src/_types/todo.type.ts',
          'src/app/app.tsx',
          '../../../../src/app/app.js',
          'dependency/tree-authorization',
          'a dependency between Fractal Trees requires an oriented treeDependencies authorization',
          'FAF §7.2, §7.3'
        ),
      ];
      expectScenario(result, expected);
    } finally {
      await inverseTreeFixture.rm();
    }

    const deepImportTree: FileTree = {
      ...fullHypotheticalTree,
      'src/_src@shared/_network/_apis/_health/get-health/get-health.api.ts':
        "import { formatLabel } from '../../../../../../packages/formatters/src/_utils/format-label/format-label.util.js';\nimport { legacyClientAdapter } from '#/_apis@shared/_utils/legacy-client/index.js';\nimport type { TTodo } from '../../../../../../packages/contracts/src/_types/todo.type.js';\nexport const getHealth = (): unknown => ({ a: formatLabel, b: legacyClientAdapter() });\n",
    };
    const deepImportFixture = await createProject(
      deepImportTree,
      fullHypotheticalConfig
    );
    try {
      const result = await lintScenario(deepImportFixture.path);
      const expected = [
        dependencyMessage(
          'src/_src@shared/_network/_apis/_health/get-health/get-health.api.ts',
          'packages/formatters/src/_utils/format-label/format-label.util.ts',
          '../../../../../../packages/formatters/src/_utils/format-label/format-label.util.js',
          'dependency/tree-opacity',
          'only the Public Surface of a Fractal Tree is importable from outside the Tree',
          'FAF §7.1'
        ),
      ];
      expectScenario(result, expected);
    } finally {
      await deepImportFixture.rm();
    }

    const branchImportTree: FileTree = {
      ...fullHypotheticalTree,
      'packages/contracts/src/_types/todo.type.ts':
        "import '../../../../src/_src@shared/_domain/_utils/dom/dom.util.js';\nexport type TTodo = string;\n",
      'src/_src@shared/_network/_apis/_health/get-health/get-health.api.ts':
        "import { legacyClientAdapter } from '#/_apis@shared/_utils/legacy-client/index.js';\nimport { formatLabel } from '../../../../../../packages/formatters/src/_utils/format-label/index.js';\nexport const getHealth = (): unknown => ({ a: formatLabel, b: legacyClientAdapter() });\n",
    };
    const branchImportFixture = await createProject(
      branchImportTree,
      fullHypotheticalConfig
    );
    try {
      const result = await lintScenario(branchImportFixture.path);
      const expected = [
        dependencyMessage(
          'packages/contracts/src/_types/todo.type.ts',
          'src/_src@shared/_domain/_utils/dom/dom.util.ts',
          '../../../../src/_src@shared/_domain/_utils/dom/dom.util.js',
          'dependency/fractal-branch-visibility',
          'a Fractal Branch is importable only from the subtree of its parent, except the parent Access Node',
          'FAF §6.6.2'
        ),
        dependencyMessage(
          'packages/contracts/src/_types/todo.type.ts',
          'src/_src@shared/_domain/_utils/dom/dom.util.ts',
          '../../../../src/_src@shared/_domain/_utils/dom/dom.util.js',
          'dependency/tree-authorization',
          'a dependency between Fractal Trees requires an oriented treeDependencies authorization',
          'FAF §7.2, §7.3'
        ),
        dependencyMessage(
          'packages/contracts/src/_types/todo.type.ts',
          'src/_src@shared/_domain/_utils/dom/dom.util.ts',
          '../../../../src/_src@shared/_domain/_utils/dom/dom.util.js',
          'dependency/tree-opacity',
          'only the Public Surface of a Fractal Tree is importable from outside the Tree',
          'FAF §7.1'
        ),
      ];
      expectScenario(result, expected);
    } finally {
      await branchImportFixture.rm();
    }

    const intraBranchTree: FileTree = {
      ...fullHypotheticalTree,
      'src/app/app.tsx':
        "import '#/_apis@shared/_utils/legacy-client/legacy-client.util.js';\nexport const App = 1;\n",
    };
    const intraBranchFixture = await createProject(
      intraBranchTree,
      fullHypotheticalConfig
    );
    try {
      const result = await lintScenario(intraBranchFixture.path);
      const expected = [
        dependencyMessage(
          'src/app/app.tsx',
          'src/_src@shared/_network/_apis/_apis@shared/_utils/legacy-client/legacy-client.util.ts',
          '#/_apis@shared/_utils/legacy-client/legacy-client.util.js',
          'dependency/fractal-branch-visibility',
          'a Fractal Branch is importable only from the subtree of its parent, except the parent Access Node',
          'FAF §6.6.2'
        ),
        dependencyMessage(
          'src/app/app.tsx',
          'src/_src@shared/_network/_apis/_apis@shared/_utils/legacy-client/legacy-client.util.ts',
          '#/_apis@shared/_utils/legacy-client/legacy-client.util.js',
          'dependency/fragment-encapsulation',
          'a Fragment is importable from outside only through its index.ts',
          'FAF §6.1.1'
        ),
      ];
      expectScenario(result, expected);
    } finally {
      await intraBranchFixture.rm();
    }
  });

  it('requires repeating markdown family locally to maintain it after replacement', async () => {
    const withoutLocalMarkdown = {
      ...fullHypotheticalConfig,
      faf: {
        ...fullHypotheticalConfig.faf,
        locals: [
          {
            ...fullHypotheticalConfig.faf.locals[0],
            foreignNodes: ['src/vite-env.d.ts'],
          },
          fullHypotheticalConfig.faf.locals[1],
        ],
      },
    };

    const treeWithMarkdown: FileTree = {
      ...fullHypotheticalTree,
      'packages/contracts/src/README.md': '# Contracts\n',
      'packages/formatters/src/README.md': '# Formatters\n',
      'src/app/README.md': '# App\n',
    };

    const fixture = await createProject(treeWithMarkdown, withoutLocalMarkdown);
    try {
      const result = await lintScenario(fixture.path);
      const expected = [
        configMessage(
          'src/app/README.md',
          'configuration/unenumerated-root-file',
          'must be either enumerated as a Root Node or designated as a Foreign Node',
          'FAF §6.2.1'
        ),
        classificationMessage(
          'src/app/app.tsx',
          'src/app/README.md',
          'classification/unclassifiable-file',
          'is neither a uniquely classified Logical Node nor a Foreign Node',
          'FAF §6.9'
        ),
      ];
      expectScenario(result, expected);
    } finally {
      await fixture.rm();
    }
  });

  it('encapsulates contact with legacy module through api branch adapter', async () => {
    const fixture = await createProject(
      fullHypotheticalTree,
      fullHypotheticalConfig
    );
    try {
      const result = await lintScenario(fixture.path);
      expectScenario(result, []);
    } finally {
      await fixture.rm();
    }

    const treeWithDirectImport: FileTree = {
      ...fullHypotheticalTree,
      'src/_src@shared/_network/_apis/_health/get-health/get-health.api.ts':
        "import { legacyClient } from '../../../../../../legacy/client.js';\nexport const getHealth = () => legacyClient;\n",
    };

    const directFixture = await createProject(
      treeWithDirectImport,
      fullHypotheticalConfig
    );
    try {
      const directResult = await lintScenario(directFixture.path);
      const expected = [
        dependencyMessage(
          'src/_src@shared/_network/_apis/_health/get-health/get-health.api.ts',
          'legacy/client.ts',
          '../../../../../../legacy/client.js',
          'dependency/external-dependencies',
          'a local file outside all Fractal Trees is importable only with an externalDependencies authorization of this source',
          'FAF §7.3'
        ),
      ];
      expectScenario(directResult, expected);
    } finally {
      await directFixture.rm();
    }

    const indexImportTree: FileTree = {
      ...fullHypotheticalTree,
      'src/_src@shared/_network/_apis/_apis@shared/_utils/legacy-client/index.ts':
        "import '../../../../../../../legacy/client.js';\nexport { legacyClientAdapter } from './legacy-client.util.js';\n",
    };
    const indexImportFixture = await createProject(
      indexImportTree,
      fullHypotheticalConfig
    );
    try {
      const result = await lintScenario(indexImportFixture.path);
      const expected = [
        dependencyMessage(
          'src/_src@shared/_network/_apis/_apis@shared/_utils/legacy-client/index.ts',
          'legacy/client.ts',
          '../../../../../../../legacy/client.js',
          'dependency/access-node-sources',
          'an Access Node imports only direct Fragment Nodes of its own Fragment',
          'FAF §6.1.1'
        ),
      ];
      expectScenario(result, expected);
    } finally {
      await indexImportFixture.rm();
    }

    const branchVisibilityTree: FileTree = {
      ...fullHypotheticalTree,
      'src/main.tsx':
        "import { legacyClientAdapter } from '#/_apis@shared/_utils/legacy-client/index.js';\nimport './main.css';\nimport { App } from './app/app.js';\nexport const Main = App;\n",
    };
    const branchVisibilityFixture = await createProject(
      branchVisibilityTree,
      fullHypotheticalConfig
    );
    try {
      const result = await lintScenario(branchVisibilityFixture.path);
      const expected = [
        dependencyMessage(
          'src/main.tsx',
          'src/_src@shared/_network/_apis/_apis@shared/_utils/legacy-client/index.ts',
          '#/_apis@shared/_utils/legacy-client/index.js',
          'dependency/fractal-branch-visibility',
          'a Fractal Branch is importable only from the subtree of its parent, except the parent Access Node',
          'FAF §6.6.2'
        ),
      ];
      expectScenario(result, expected);
    } finally {
      await branchVisibilityFixture.rm();
    }

    const reEntryTree: FileTree = {
      ...fullHypotheticalTree,
      'legacy/client.ts':
        "import '../src/app/app.js';\nexport const legacyClient = 1;\n",
      'src/_src@shared/_network/_apis/_health/get-health/get-health.api.ts':
        "import type { TTodo } from '../../../../../../packages/contracts/src/_types/todo.type.js';\nimport { formatLabel } from '../../../../../../packages/formatters/src/_utils/format-label/index.js';\nexport const getHealth = (): unknown => ({ a: formatLabel });\n",
    };
    const reEntryFixture = await createProject(
      reEntryTree,
      fullHypotheticalConfig
    );
    try {
      const result = await lintScenario(reEntryFixture.path);
      const chain = [
        'src/_src@shared/_network/_apis/_apis@shared/_utils/legacy-client/legacy-client.util.ts',
        'legacy/client.ts',
        'src/app/app.tsx',
      ];
      const expected = [
        pathDependencyMessage(
          chain,
          'dependency/fractal-branch-unidirectionality',
          'a Fractal Branch must not depend on the other subtrees of its parent',
          'FAF §6.6.2'
        ),
        pathDependencyMessage(
          chain,
          'dependency/re-entry-prohibition',
          'a path through local files outside all Fractal Trees must not re-enter its Fractal Tree',
          'FAF §7.3'
        ),
      ];
      expectScenario(result, expected);
    } finally {
      await reEntryFixture.rm();
    }
  });
});
