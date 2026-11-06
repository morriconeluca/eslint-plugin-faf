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
  { category: '_fonts', implicitRoleExtensions: ['.woff2'], name: 'font' },
  { category: '_styles', implicitRoleExtensions: ['.css'], name: 'style' },
  { category: '_utils', name: 'util' },
];
const common = { roles, subGraphRoles: [{ name: 'spec' }] };
const root = { path: 'src', rootNodes: [['low.ts'], ['high.ts']] };
const rootTree = {
  'src/high.ts': 'export const high = 1;\n',
  'src/low.ts': 'export const low = 1;\n',
};
const layerTree = {
  'src/_types/a.type.ts': 'export type A = string;\n',
  'src/_types/b.type.ts': 'export type B = string;\n',
  'src/_utils/widget/index.ts': "export { widget } from './widget.util.js';\n",
  'src/_utils/widget/widget.util.ts': 'export const widget = 1;\n',
};

const PREDICATES = {
  accessNodeSources: {
    constraint: 'dependency/access-node-sources',
    predicate:
      'an Access Node imports only direct Fragment Nodes of its own Fragment',
    reference: 'FAF §6.1.1',
  },
  externalDependencies: {
    constraint: 'dependency/external-dependencies',
    predicate:
      'a local file outside all Fractal Trees is importable only with an externalDependencies authorization of this source',
    reference: 'FAF §7.3',
  },
  foreignNodeIsolation: {
    constraint: 'dependency/foreign-node-isolation',
    predicate: 'a Foreign Node has no import relation with codebase files',
    reference: 'FAF §4, §6.7',
  },
  fractalBranchVisibility: {
    constraint: 'dependency/fractal-branch-visibility',
    predicate:
      'a Fractal Branch is importable only from the subtree of its parent, except the parent Access Node',
    reference: 'FAF §6.6.2',
  },
  fragmentEncapsulation: {
    constraint: 'dependency/fragment-encapsulation',
    predicate:
      'a Fragment is importable from outside only through its index.ts',
    reference: 'FAF §6.1.1',
  },
  pathAliasAnchoring: {
    constraint: 'dependency/path-alias-anchoring',
    predicate:
      'a Path Alias importing its own Fractal Tree must have a Fractal Branch of that Tree as base in every alternative',
    reference: 'FAF §7.4',
  },
  peerSeparation: {
    constraint: 'dependency/peer-separation',
    predicate:
      'sibling subtrees may depend on each other only downward along a Horizontal Hierarchy',
    reference: 'FAF §5',
  },
  rootNodeDiscipline: {
    constraint: 'dependency/root-node-discipline',
    predicate:
      'a Root Node is importable only by Root Nodes authorized by rootNodes or dependencyEdges',
    reference: 'FAF §6.2.2',
  },
  treeAuthorization: {
    constraint: 'dependency/tree-authorization',
    predicate:
      'a dependency between Fractal Trees requires an oriented treeDependencies authorization',
    reference: 'FAF §7.2, §7.3',
  },
  treeOpacity: {
    constraint: 'dependency/tree-opacity',
    predicate:
      'only the Public Surface of a Fractal Tree is importable from outside the Tree',
    reference: 'FAF §7.1',
  },
} as const;

type TDependencyKind = keyof typeof PREDICATES;

const dependency = (
  kind: TDependencyKind,
  input: {
    readonly column?: number;
    readonly filePath?: string;
    readonly from: string;
    readonly line?: number;
    readonly specifier: string;
    readonly to: string;
  }
): TScenarioMessage => {
  const meta = PREDICATES[kind];
  return {
    column: input.column ?? 1,
    constraint: meta.constraint,
    element: input.from,
    filePath: input.filePath ?? input.from,
    line: input.line ?? 1,
    message: `${meta.constraint}: '${input.from}' imports '${input.to}' through '${input.specifier}': ${meta.predicate} (${meta.reference}).`,
    messageId: 'dependency',
    ruleId: 'faf/conformity',
    severity: 2,
  };
};

const reExportProhibition = (filePath: string): TScenarioMessage => ({
  column: 1,
  constraint: 'symbol/re-export-prohibition',
  element: filePath,
  filePath,
  line: 1,
  message: `symbol/re-export-prohibition: '${filePath}' re-exports an imported Symbol (FAF §5).`,
  messageId: 'symbol',
  ruleId: 'faf/conformity',
  severity: 2,
});

const invalidExternalDependencySource = (source: string): TScenarioMessage => ({
  column: 1,
  constraint: 'configuration/invalid-external-dependency-source',
  element: source,
  filePath: 'fafconfig.ts',
  line: 1,
  message: `configuration/invalid-external-dependency-source: '${source}' must be an authorized logical node in externalDependencies (FAF §7.3).`,
  messageId: 'configuration',
  ruleId: 'faf/conformity',
  severity: 2,
});

const unresolvedImport = (
  filePath: string,
  specifier: string
): TScenarioMessage => ({
  column: 1,
  constraint: 'unverified/unresolved-import',
  element: filePath,
  filePath,
  line: 1,
  message: `unverified/unresolved-import: '${filePath}' contains an import that could not be resolved: Cannot find module '${specifier}' (D-08).`,
  messageId: 'unverified',
  ruleId: 'faf/conformity',
  severity: 2,
});

const nonLiteralDynamicImport = (
  filePath: string,
  line: number
): TScenarioMessage => ({
  column: 1,
  constraint: 'unverified/non-literal-dynamic-import',
  element: filePath,
  filePath,
  line,
  message: `unverified/non-literal-dynamic-import: '${filePath}' contains a non-literal dynamic import that cannot be resolved statically (D-07).`,
  messageId: 'unverified',
  ruleId: 'faf/conformity',
  severity: 2,
});

type TAliasBaseCase = {
  readonly allowed: boolean;
  readonly base: string;
  readonly file?: boolean;
  readonly foreign?: boolean;
  readonly label: string;
  readonly layer?: boolean;
  readonly published?: boolean;
  readonly suffix: string;
};

type TScenario = {
  readonly config: Readonly<Record<string, unknown>>;
  readonly expected: readonly TScenarioMessage[];
  readonly files?: readonly string[];
  readonly name: string;
  readonly responsiblePart: string;
  readonly tree: FileTree;
};

const isRootBase = (base: string, isLayer = false): boolean =>
  base === 'src/child' || base === 'src/low.ts' || (!isLayer && base === 'src');

const buildAliasTree = (item: TAliasBaseCase): FileTree => {
  const importTarget = item.file === true ? '#base' : '#base/*';
  const targetPath = `./${item.base}${item.file === true ? '' : '/*'}`;
  const sourceFile =
    item.layer === true ? 'src/_utils/source/source.util.ts' : 'src/high.ts';
  const sourceContent = `import '#base${item.suffix}';\n${item.layer === true ? 'export const source = 1;' : ''}\n`;

  const isSubCategoryTest = item.base === 'src/_types/_base';
  const isBranchLayerTest = item.base === 'src/_src@shared/_ui';

  const typesTree: FileTree = isSubCategoryTest
    ? { 'src/_types/_base/a.type.ts': 'export type A = string;\n' }
    : {
        'src/_types/a.type.ts': 'export type A = string;\n',
        'src/_types/b.type.ts': 'export type B = string;\n',
      };

  const branchTree: FileTree = isBranchLayerTest
    ? { 'src/_src@shared/_ui/_types/a.type.ts': 'export type A = string;\n' }
    : {
        'src/_src@shared/_types/a.type.ts': 'export type A = string;\n',
        'src/_utils/_utils@shared/_types/a.type.ts':
          'export type A = string;\n',
      };

  return {
    ...typesTree,
    ...branchTree,
    'src/_utils/widget/index.ts':
      "export { widget } from './widget.util.js';\n",
    'src/_utils/widget/widget.util.ts': 'export const widget = 1;\n',
    ...(item.layer !== true && rootTree),
    'package.json': JSON.stringify({
      imports: { [importTarget]: targetPath },
      type: 'module',
    }),
    'src/_utils/_users/get-user/get-user.util.ts':
      'export const getUser = 1;\n',
    'src/_utils/_users/get-user/index.ts':
      "export { getUser } from './get-user.util.js';\n",
    'src/_utils/source/index.ts':
      "export { source } from './source.util.js';\n",
    'src/_utils/source/source.util.ts': 'export const source = 1;\n',
    ...(item.layer !== true && {
      'src/child/main.ts': 'export const main = 1;\n',
    }),
    [sourceFile]: sourceContent,
    'src/static/document.ts': 'export const document = 1;\n',
  };
};

const buildAliasConfig = (
  item: TAliasBaseCase
): Readonly<Record<string, unknown>> => ({
  faf: {
    common,
    locals: [
      {
        foreignDomains: ['src/static'],
        horizontalHierarchies:
          item.layer === true ? [[['_types'], ['_utils']]] : [],
        mimeticPathStructures: [{ paths: ['src/_utils'] }],
        publicRootNodes: item.published === true ? ['src/low.ts'] : [],
        rootFragments:
          item.layer === true
            ? []
            : [
                {
                  ...root,
                  subRootFragments: [
                    { path: 'src/child', rootNodes: [['main.ts']] },
                  ],
                },
              ],
        rootLayers: item.layer === true ? ['src'] : [],
      },
    ],
  },
});

const build291Expected = (
  item: TAliasBaseCase,
  targetFile: string,
  resolvedTarget: string,
  importSpecifier: string
): readonly TScenarioMessage[] => {
  const expected: TScenarioMessage[] = [];

  if (item.foreign === true) {
    expected.push(
      dependency('foreignNodeIsolation', {
        from: 'src/high.ts',
        specifier: '#base/document.ts',
        to: 'src/static/document.ts',
      })
    );
  }

  if (!item.allowed) {
    expected.push(
      dependency('pathAliasAnchoring', {
        from: targetFile,
        specifier: importSpecifier,
        to: resolvedTarget,
      })
    );
  }

  if (item.layer === true && item.base.includes('widget')) {
    expected.push(
      dependency('peerSeparation', {
        from: 'src/_utils/source/source.util.ts',
        specifier: '#base',
        to: 'src/_utils/widget/index.ts',
      })
    );
  }

  if (isRootBase(item.base, item.layer)) {
    expected.push(
      dependency('rootNodeDiscipline', {
        from: 'src/high.ts',
        specifier: importSpecifier,
        to: resolvedTarget,
      })
    );
  }

  return expected;
};

const create291Scenario = (item: TAliasBaseCase): TScenario => {
  const targetFile =
    item.layer === true ? 'src/_utils/source/source.util.ts' : 'src/high.ts';
  const importSpecifier = item.file === true ? '#base' : `#base${item.suffix}`;
  const resolvedTarget =
    item.file === true ? item.base : `${item.base}${item.suffix}`;

  return {
    config: buildAliasConfig(item),
    expected: build291Expected(
      item,
      targetFile,
      resolvedTarget,
      importSpecifier
    ),
    name: `29.1 alias base classification: ${item.label}`,
    responsiblePart: 'path-alias-anchoring',
    tree: buildAliasTree(item),
  };
};

type T294Case = {
  readonly allowed: boolean;
  readonly isExternal: boolean;
  readonly isHidden: boolean;
  readonly label: string;
};

const resolve294TargetSpecifier = (
  isExternal: boolean,
  isHidden: boolean
): string => {
  if (isExternal) {
    return '#target/outside.ts';
  }
  if (isHidden) {
    return '#target/_b@shared/_types/a.type.ts';
  }
  return '#target/_types/a.type.ts';
};

const build294Expected = (
  item: T294Case,
  target: string,
  specifier: string
): readonly TScenarioMessage[] => {
  if (item.allowed && !item.isHidden) {
    return [];
  }
  if (item.isExternal) {
    return [
      dependency('externalDependencies', {
        from: 'src/high.ts',
        specifier,
        to: target,
      }),
    ];
  }
  if (item.isHidden) {
    return [
      dependency('treeOpacity', {
        from: 'src/high.ts',
        specifier,
        to: target,
      }),
      dependency('fractalBranchVisibility', {
        from: 'src/high.ts',
        specifier,
        to: target,
      }),
    ];
  }
  return [
    dependency('treeAuthorization', {
      from: 'src/high.ts',
      specifier,
      to: target,
    }),
  ];
};

const resolve294Target = (item: T294Case): string => {
  if (item.isExternal) {
    return 'legacy/outside.ts';
  }
  if (item.isHidden) {
    return 'b/_b@shared/_types/a.type.ts';
  }
  return 'b/_types/a.type.ts';
};

const create294Scenario = (item: T294Case): TScenario => {
  const specifier = resolve294TargetSpecifier(item.isExternal, item.isHidden);
  const target = resolve294Target(item);

  return {
    config: {
      faf: {
        common: {
          ...common,
          aliases: { '#target': item.isExternal ? 'legacy' : 'b' },
        },
        locals: [
          {
            externalDependencies:
              item.allowed && item.isExternal
                ? [{ from: ['src/high.ts'], to: ['legacy/outside.ts'] }]
                : [],
            rootFragments: [root],
            rootLayers: ['b'],
            treeDependencies:
              item.allowed && !item.isExternal
                ? [{ from: ['src'], to: ['b'] }]
                : [],
          },
        ],
      },
    },
    expected: build294Expected(item, target, specifier),
    name: `29.4 aliases outside the source Tree need only destination authorization: ${item.label}`,
    responsiblePart: item.isExternal
      ? 'external-dependencies'
      : 'tree-frontier',
    tree: {
      ...rootTree,
      'b/_b@shared/_types/a.type.ts': 'export type A = string;\n',
      'b/_types/a.type.ts': 'export type A = string;\n',
      'legacy/outside.ts': 'export const outside = 1;\n',
      'src/high.ts': `import '${specifier}';\n`,
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          baseUrl: '.',
          paths: {
            '#target/*': [item.isExternal ? './legacy/*' : './b/*'],
          },
        },
      }),
    },
  };
};

type T282Case = {
  readonly allowed: boolean;
  readonly from: readonly string[];
  readonly isAccessNode?: boolean;
  readonly label: string;
  readonly to: readonly string[];
};

const build282Expected = (item: T282Case): readonly TScenarioMessage[] => {
  if (item.allowed) {
    return [];
  }
  if (item.isAccessNode === true) {
    return [invalidExternalDependencySource('src/_utils/widget/index.ts')];
  }
  return [
    dependency('externalDependencies', {
      from: 'src/high.ts',
      specifier: '../outside.js',
      to: 'outside.ts',
    }),
  ];
};

type T297Case = {
  readonly allowed: boolean;
  readonly label: string;
  readonly owner: string;
  readonly source: string;
  readonly specifier: string;
  readonly target: string;
};

const build297Expected = (item: T297Case): readonly TScenarioMessage[] => {
  if (item.allowed) {
    return [];
  }
  const messages: TScenarioMessage[] = [];
  switch (item.owner) {
    case 'access-node-contract': {
      messages.push(
        dependency('accessNodeSources', {
          from: item.source,
          specifier: item.specifier,
          to: item.target,
        })
      );
      break;
    }
    case 'tree-frontier': {
      messages.push(
        dependency('treeOpacity', {
          from: item.source,
          specifier: item.specifier,
          to: item.target,
        })
      );
      break;
    }
    default: {
      break;
    }
  }
  if (item.source !== 'outside.ts') {
    messages.push(
      dependency('fractalBranchVisibility', {
        from: item.source,
        specifier: item.specifier,
        to: item.target,
      })
    );
  }
  return messages;
};

const scenarios: readonly TScenario[] = [
  {
    config: {
      faf: {
        common,
        locals: [
          {
            rootFragments: [
              { path: 'src', rootNodes: [['page.tsx', 'layout.tsx']] },
            ],
          },
        ],
      },
    },
    expected: [],
    name: '12.1 Root Fragments need no Master or Access Node and allow heterogeneous Symbols',
    responsiblePart: 'fragment-anatomy',
    tree: {
      'src/layout.tsx':
        'export const layout = 1;\nexport type Layout = string;\n',
      'src/page.tsx': 'export const page = 1;\nexport type Page = string;\n',
    },
  },
  ...[
    {
      allowed: false,
      hierarchy: [['low.ts', 'high.ts']],
      label: 'no authorization',
    },
    {
      allowed: true,
      hierarchy: [['low.ts'], ['high.ts']],
      label: 'strict descending hierarchy',
    },
  ].map(({ allowed, hierarchy, label }) => ({
    config: {
      faf: {
        common,
        locals: [{ rootFragments: [{ ...root, rootNodes: hierarchy }] }],
      },
    },
    expected: allowed
      ? []
      : [
          dependency('rootNodeDiscipline', {
            from: 'src/high.ts',
            specifier: './low.js',
            to: 'src/low.ts',
          }),
        ],
    name: `12.2 same Root Fragment: ${label}`,
    responsiblePart: 'root-node-discipline',
    tree: {
      ...rootTree,
      'src/high.ts': "import './low.js';\nexport const high = 1;\n",
    },
  })),
  ...[
    {
      from: 'src/a/main.ts',
      label: 'siblings',
      specifier: '../b/main.js',
      to: 'src/b/main.ts',
    },
    {
      from: 'src/main.ts',
      label: 'ancestor to child',
      specifier: './a/main.js',
      to: 'src/a/main.ts',
    },
    {
      from: 'src/a/main.ts',
      label: 'child to ancestor',
      specifier: '../main.js',
      to: 'src/main.ts',
    },
  ].flatMap(({ from, label, specifier, to }) =>
    [false, true].map((allowed) => ({
      config: {
        faf: {
          common,
          locals: [
            {
              rootFragments: [
                {
                  dependencyEdges:
                    allowed && from === 'src/main.ts'
                      ? [{ from: ['main.ts'], to: [to] }]
                      : [],
                  path: 'src',
                  rootNodes: [['main.ts']],
                  subRootFragments: ['a', 'b'].map((child) => ({
                    dependencyEdges:
                      allowed && from === `src/${child}/main.ts`
                        ? [{ from: ['main.ts'], to: [to] }]
                        : [],
                    path: `src/${child}`,
                    rootNodes: [['main.ts']],
                  })),
                },
              ],
            },
          ],
        },
      },
      expected: allowed
        ? []
        : [
            dependency('rootNodeDiscipline', {
              from,
              specifier,
              to,
            }),
          ],
      name: `12.2 ${label}: ${allowed ? 'direct authorization' : 'no authorization'}`,
      responsiblePart: 'root-node-discipline',
      tree: {
        'src/a/main.ts':
          from === 'src/a/main.ts'
            ? `import '${specifier}';\nexport const value = 1;\n`
            : 'export const a = 1;\n',
        'src/b/main.ts':
          from === 'src/b/main.ts'
            ? `import '${specifier}';\nexport const value = 1;\n`
            : 'export const b = 1;\n',
        'src/main.ts':
          from === 'src/main.ts'
            ? `import '${specifier}';\nexport const value = 1;\n`
            : 'export const main = 1;\n',
      },
    }))
  ),
  {
    config: {
      faf: {
        common,
        locals: [
          {
            rootFragments: [
              { path: 'src', rootNodes: [['main.tsx', 'main.css']] },
            ],
          },
        ],
      },
    },
    expected: [
      dependency('rootNodeDiscipline', {
        from: 'src/main.tsx',
        specifier: './main.css',
        to: 'src/main.css',
      }),
    ],
    name: '12.3 Root Asset needs authorization',
    responsiblePart: 'root-node-discipline',
    tree: {
      'src/main.css': 'body {}\n',
      'src/main.tsx': "import './main.css';\n",
    },
  },
  {
    config: {
      faf: {
        common,
        locals: [
          {
            rootFragments: [
              {
                path: 'src',
                rootNodes: [],
                subRootFragments: [
                  {
                    dependencyEdges: [
                      { from: ['main.ts'], to: ['src/b/main.ts'] },
                    ],
                    path: 'src/a',
                    rootNodes: [['main.ts']],
                  },
                  {
                    dependencyEdges: [
                      { from: ['main.ts'], to: ['src/c/main.ts'] },
                    ],
                    path: 'src/b',
                    rootNodes: [['main.ts']],
                  },
                  { path: 'src/c', rootNodes: [['main.ts']] },
                ],
              },
            ],
          },
        ],
      },
    },
    expected: [
      dependency('rootNodeDiscipline', {
        from: 'src/a/main.ts',
        specifier: '../c/main.js',
        to: 'src/c/main.ts',
      }),
      dependency('rootNodeDiscipline', {
        from: 'src/b/main.ts',
        specifier: '../a/main.js',
        to: 'src/a/main.ts',
      }),
    ],
    name: '12.4 authorization grants neither inverse nor transitive shortcut',
    responsiblePart: 'root-node-discipline',
    tree: {
      'src/a/main.ts': "import '../c/main.js';\n",
      'src/b/main.ts': "import '../a/main.js';\n",
      'src/c/main.ts': 'export const c = 1;\n',
    },
  },
  ...[
    { file: 'src/_utils/widget/widget.util.ts', label: 'Fragment Node' },
    { file: 'src/_utils/widget/widget.spec.ts', label: 'Sub-Graph Node' },
    { file: 'src/_types/a.type.ts', label: 'Category Node' },
  ].map(({ file, label }) => {
    const specifier = file.includes('_utils') ? '../../high.js' : '../high.js';
    return {
      config: {
        faf: {
          common,
          locals: [{ publicRootNodes: ['src/high.ts'], rootFragments: [root] }],
        },
      },
      expected: [
        dependency('rootNodeDiscipline', {
          from: file,
          specifier,
          to: 'src/high.ts',
        }),
      ],
      name: `12.5 ${label} cannot import a Root Node even when exposed`,
      responsiblePart: 'root-node-discipline',
      tree: {
        ...rootTree,
        ...layerTree,
        [file]: `import '${specifier}';\n${file.endsWith('widget.util.ts') ? 'export const widget = 1;\n' : 'export const value = 1;\n'}`,
      },
    };
  }),
  {
    config: { faf: { common, locals: [{ rootFragments: [root] }] } },
    expected: [
      dependency('fragmentEncapsulation', {
        from: 'src/high.ts',
        specifier: './_utils/widget/widget.util.js',
        to: 'src/_utils/widget/widget.util.ts',
      }),
    ],
    name: '12.6 permitted Root re-export does not bypass Fragment encapsulation',
    responsiblePart: 'fragment-encapsulation',
    tree: {
      ...rootTree,
      ...layerTree,
      'src/high.ts':
        "export { widget } from './_utils/widget/widget.util.js';\n",
    },
  },
  ...[
    { code: "import { low } from './low.js';", label: 'named import' },
    { code: "import low from './low.js';", label: 'default import' },
    { code: "import * as low from './low.js';", label: 'namespace import' },
    { code: "import './low.js';", label: 'side-effect import' },
    { code: "import type { Low } from './low.js';", label: 'import type' },
    {
      code: "import { low, type Low } from './low.js';",
      label: 'mixed type specifier',
    },
    { code: "export { low } from './low.js';", label: 'named re-export' },
    { code: "export * from './low.js';", label: 'star re-export' },
    { code: "export type { Low } from './low.js';", label: 'type re-export' },
    { code: "import('./low.js');", label: 'literal dynamic import' },
    {
      code: "const low = require('./low.js');",
      column: 13,
      label: 'loader require',
    },
    {
      code: "import low = require('./low.js');",
      label: 'TypeScript require import',
    },
    {
      code: "type Low = import('./low.js').Low;",
      column: 12,
      label: 'TypeScript import type query',
    },
    {
      asset: true,
      code: "import './low.css';",
      label: 'recognized Asset import',
    },
  ].map(({ asset, code, column = 1, label }) => {
    const target = asset === true ? 'src/low.css' : 'src/low.ts';
    const specifier = asset === true ? './low.css' : './low.js';
    return {
      config: {
        faf: {
          common,
          locals: [
            {
              rootFragments: [
                {
                  path: 'src',
                  rootNodes: [
                    ['high.ts', asset === true ? 'low.css' : 'low.ts'],
                  ],
                },
              ],
            },
          ],
        },
      },
      expected: [
        dependency('rootNodeDiscipline', {
          column,
          from: 'src/high.ts',
          specifier,
          to: target,
        }),
      ],
      name: `25.1 resolved forbidden dependency: ${label}`,
      responsiblePart: 'root-node-discipline',
      tree: {
        'src/high.ts': `${code}\n`,
        [target]:
          asset === true
            ? 'body {}\n'
            : 'export const low = 1;\nexport type Low = string;\nexport default low;\n',
      },
    };
  }),
  {
    config: { faf: { common, locals: [{ rootFragments: [root] }] } },
    expected: [],
    name: '25.2 strings and a shadowed require create no dependency',
    responsiblePart: 'root-node-discipline',
    tree: {
      ...rootTree,
      'src/high.ts':
        "const path = './low.js';\nfunction require(value: string) { return value; }\nrequire('./low.js');\n",
    },
  },
  ...[
    {
      label: 'relative with extension',
      specifier: './src/_utils/widget/index.ts',
    },
    {
      label: 'relative without extension',
      specifier: './src/_utils/widget/index',
    },
    { label: 'directory index', specifier: './src/_utils/widget' },
    { label: 'resolved path alias', specifier: '#widget/index.ts' },
    {
      label: 'normalized dot segments',
      specifier: './src/./_utils/../_utils/widget/index.ts',
    },
    {
      label: 'normalized platform separators',
      specifier: './src//_utils/widget/index.ts',
    },
    { label: 'configured package redirect', specifier: '#redirect' },
  ].map(({ label, specifier }) => ({
    config: { faf: { common, locals: [{ rootFragments: [root] }] } },
    expected: [
      dependency('treeOpacity', {
        from: 'consumer.ts',
        specifier,
        to: 'src/_utils/widget/index.ts',
      }),
    ],
    name: `25.3 equivalent resolved target: ${label}`,
    responsiblePart: 'tree-frontier',
    tree: {
      ...rootTree,
      ...layerTree,
      'consumer.ts': `import '${specifier}';\n`,
      'package.json': JSON.stringify({
        imports: {
          '#redirect': './src/_utils/widget/index.ts',
          '#widget/*': './src/_utils/widget/*',
        },
        type: 'module',
      }),
    },
  })),
  {
    config: {
      faf: {
        common,
        locals: [
          {
            foreignNodes: ['src/_utils/widget/package.json'],
            rootFragments: [root],
          },
        ],
      },
    },
    expected: [
      dependency('fragmentEncapsulation', {
        from: 'src/high.ts',
        specifier: './_utils/widget',
        to: 'src/_utils/widget/widget.util.ts',
      }),
    ],
    name: '25.4 directory resolving to Master is not an Access Node',
    responsiblePart: 'fragment-encapsulation',
    tree: {
      ...rootTree,
      ...layerTree,
      'src/_utils/widget/package.json': JSON.stringify({
        main: './widget.util.ts',
      }),
      'src/high.ts': "import './_utils/widget';\n",
    },
  },
  {
    config: { faf: { common, locals: [{ rootLayers: ['src'] }] } },
    expected: [
      dependency('peerSeparation', {
        filePath: 'fafconfig.ts',
        from: 'src/_styles/a.css',
        specifier: './b.css',
        to: 'src/_styles/b.css',
      }),
    ],
    name: '25.5 CSS sibling import is forbidden while a shared font is visible',
    responsiblePart: 'peer-separation',
    tree: {
      'src/_styles/_styles@shared/_fonts/main.woff2': 'font',
      'src/_styles/a.css':
        '@import "./b.css";\nbody { src: url("./_styles@shared/_fonts/main.woff2"); }\n',
      'src/_styles/b.css': 'body {}\n',
    },
  },
  {
    config: { faf: { common, locals: [{ rootFragments: [root] }] } },
    expected: [unresolvedImport('src/high.ts', './missing.js')],
    name: '25.6 unresolved imports remain explicitly unverified',
    responsiblePart: 'collect-modules',
    tree: { ...rootTree, 'src/high.ts': "import './missing.js';\n" },
  },
  {
    config: { faf: { common, locals: [{ rootFragments: [root] }] } },
    expected: [nonLiteralDynamicImport('src/high.ts', 2)],
    name: '25.7 runtime dynamic imports remain explicitly unverified',
    responsiblePart: 'collect-modules',
    tree: {
      ...rootTree,
      'src/high.ts': "const destination = './low.js';\nimport(destination);\n",
    },
  },
  {
    config: {
      faf: {
        common,
        locals: [
          { rootFragments: [{ ...root, rootNodes: [['high.ts', 'low.ts']] }] },
        ],
      },
    },
    expected: [
      dependency('rootNodeDiscipline', {
        from: 'src/high.ts',
        specifier: './low.js',
        to: 'src/low.ts',
      }),
    ],
    files: ['fafconfig.ts', 'src/high.ts'],
    name: '25.8 dependency is checked even when ESLint does not visit the target',
    responsiblePart: 'root-node-discipline',
    tree: { ...rootTree, 'src/high.ts': "import './low.js';\n" },
  },
  ...[
    {
      exposed: true,
      label: 'published Root Node',
      layer: false,
      node: 'src/high.ts',
      publish: true,
    },
    {
      exposed: false,
      label: 'unpublished Root Node',
      layer: false,
      node: 'src/low.ts',
      publish: true,
    },
    {
      exposed: true,
      label: 'structural Access Node',
      layer: true,
      node: 'src/_utils/widget/index.ts',
      publish: false,
    },
    {
      exposed: true,
      label: 'structural Category Node',
      layer: true,
      node: 'src/_types/a.type.ts',
      publish: false,
    },
    {
      exposed: false,
      label: 'opaque Tree',
      layer: false,
      node: 'src/high.ts',
      publish: false,
    },
    {
      exposed: false,
      label: 'deep internal import',
      layer: false,
      node: 'src/_utils/widget/widget.util.ts',
      publish: true,
    },
  ].map(({ exposed, label, layer, node, publish }) => ({
    config: {
      faf: {
        common,
        locals: [
          layer
            ? { rootLayers: ['src'] }
            : {
                publicRootNodes: publish ? ['src/high.ts'] : [],
                rootFragments: [root],
              },
        ],
      },
    },
    expected: exposed
      ? []
      : [
          dependency('treeOpacity', {
            from: 'consumer.ts',
            specifier: `./${node}`,
            to: node,
          }),
        ],
    name: `26.5 external opacity: ${label}`,
    responsiblePart: 'tree-frontier',
    tree: {
      ...layerTree,
      ...(!layer && rootTree),
      'consumer.ts': `import './${node}';\n`,
    },
  })),
  {
    config: {
      faf: {
        common,
        locals: [{ publicRootNodes: ['src/high.ts'], rootFragments: [root] }],
      },
    },
    expected: [
      dependency('treeOpacity', {
        from: 'consumer.ts',
        line: 2,
        specifier: './src/_utils/widget/index.js',
        to: 'src/_utils/widget/index.ts',
      }),
    ],
    name: '26.6 public Root re-export does not transitively publish its private implementation',
    responsiblePart: 'tree-frontier',
    tree: {
      ...rootTree,
      ...layerTree,
      'consumer.ts':
        "import './src/high.js';\nimport './src/_utils/widget/index.js';\n",
      'src/high.ts': "export { widget } from './_utils/widget/index.js';\n",
    },
  },
  {
    config: {
      faf: {
        common,
        locals: [{ publicRootNodes: ['src/high.ts'], rootFragments: [root] }],
      },
    },
    expected: [
      dependency('rootNodeDiscipline', {
        from: 'src/_utils/widget/widget.util.ts',
        specifier: '../../high.js',
        to: 'src/high.ts',
      }),
    ],
    name: '26.7 publication does not permit internal non-Root consumers',
    responsiblePart: 'root-node-discipline',
    tree: {
      ...rootTree,
      ...layerTree,
      'src/_utils/widget/widget.util.ts':
        "import '../../high.js';\nexport const widget = 1;\n",
    },
  },
  {
    config: { faf: { common, locals: [{ rootLayers: ['src'] }] } },
    expected: [
      dependency('peerSeparation', {
        from: 'src/_types/a.type.ts',
        specifier: './b.type.js',
        to: 'src/_types/b.type.ts',
      }),
    ],
    name: '26.8 public Category Nodes retain internal peer separation',
    responsiblePart: 'peer-separation',
    tree: {
      ...layerTree,
      'src/_types/a.type.ts':
        "import './b.type.js';\nexport type A = string;\n",
    },
  },
  ...[
    { allowed: false, edges: [], label: 'no authorization', published: true },
    {
      allowed: true,
      edges: [{ from: ['a'], to: ['b'] }],
      label: 'direct A to B',
      published: true,
    },
    {
      allowed: false,
      edges: [{ from: ['b'], to: ['a'] }],
      label: 'inverse only',
      published: true,
    },
    {
      allowed: false,
      edges: [
        { from: ['a'], to: ['c'] },
        { from: ['c'], to: ['b'] },
      ],
      label: 'transitive only',
      published: true,
    },
    {
      allowed: false,
      edges: [{ from: ['a'], to: ['b'] }],
      label: 'authorized but unpublished',
      published: false,
    },
  ].map(({ allowed, edges, label, published }) => ({
    config: {
      faf: {
        common,
        locals: [
          {
            publicRootNodes: published ? ['b/main.ts'] : [],
            rootFragments: ['a', 'b', 'c'].map((path) => ({
              path,
              rootNodes: [['main.ts']],
            })),
            treeDependencies: edges,
          },
        ],
      },
    },
    expected: allowed
      ? []
      : [
          dependency(published ? 'treeAuthorization' : 'treeOpacity', {
            from: 'a/main.ts',
            specifier: '../b/main.js',
            to: 'b/main.ts',
          }),
        ],
    name: `27.1 conjunctive authorization and publication: ${label}`,
    responsiblePart: 'tree-frontier',
    tree: {
      'a/main.ts': "import '../b/main.js';\n",
      'b/main.ts': 'export const main = 1;\n',
      'c/main.ts': 'export const main = 1;\n',
    },
  })),
  ...[
    {
      access: false,
      label: 'Root Node',
      node: 'src/high.ts',
      rootSource: true,
      specifier: '../b/main.js',
    },
    {
      access: false,
      label: 'Fragment Node',
      node: 'src/_utils/widget/widget.util.ts',
      rootSource: false,
      specifier: '../../../b/main.js',
    },
    {
      access: false,
      label: 'Sub-Graph Node',
      node: 'src/_utils/widget/widget.spec.ts',
      rootSource: false,
      specifier: '../../../b/main.js',
    },
    {
      access: false,
      label: 'Category Node',
      node: 'src/_types/a.type.ts',
      rootSource: false,
      specifier: '../../b/main.js',
    },
    {
      access: false,
      label: 'private Fragment Node',
      node: 'src/_utils/widget/widget.util.ts',
      rootSource: true,
      specifier: '../../../b/main.js',
    },
    {
      access: false,
      label: 'Branch Category Node',
      node: 'src/_src@shared/_types/a.type.ts',
      rootSource: false,
      specifier: '../../../b/main.js',
    },
    {
      access: true,
      label: 'Access Node',
      node: 'src/_utils/widget/index.ts',
      rootSource: false,
      specifier: '../../../b/main.js',
    },
  ].map(({ access, label, node, rootSource, specifier }) => {
    let nodeTail: string;
    if (node.endsWith('widget.util.ts')) {
      nodeTail = 'export const widget = 1;\n';
    } else if (access) {
      nodeTail = "export { widget } from './widget.util.js';\n";
    } else {
      nodeTail = 'export const value = 1;\n';
    }

    return {
      config: {
        faf: {
          common,
          locals: [
            {
              publicRootNodes: ['b/main.ts'],
              rootFragments: [
                { path: 'b', rootNodes: [['main.ts']] },
                ...(rootSource ? [root] : []),
              ],
              rootLayers: rootSource ? [] : ['src'],
              treeDependencies: [{ from: ['src'], to: ['b'] }],
            },
          ],
        },
      },
      expected: access
        ? [
            dependency('accessNodeSources', {
              from: node,
              specifier,
              to: 'b/main.ts',
            }),
          ]
        : [],
      name: `27.2 inter-Tree source: ${label}`,
      responsiblePart: access ? 'access-node-contract' : 'tree-frontier',
      tree: {
        ...layerTree,
        ...(rootSource && rootTree),
        'b/main.ts': 'export const main = 1;\n',
        [node]: `import '${specifier}';\n${nodeTail}`,
      },
    };
  }),
  {
    config: {
      faf: {
        common,
        locals: [
          {
            publicRootNodes: ['b/main.ts'],
            rootFragments: [root, { path: 'b', rootNodes: [['main.ts']] }],
            treeDependencies: [{ from: ['src'], to: ['b'] }],
          },
        ],
      },
    },
    expected: [],
    name: '27.3 inter-Tree Root import and re-export need no internal Root-pair authorization',
    responsiblePart: 'root-node-discipline',
    tree: {
      ...rootTree,
      'b/main.ts': 'export const main = 1;\n',
      'src/high.ts': "export { main } from '../b/main.js';\n",
    },
  },
  {
    config: {
      faf: {
        common,
        locals: [
          {
            publicRootNodes: ['b/main.ts'],
            rootFragments: [{ path: 'b', rootNodes: [['main.ts']] }],
            rootLayers: ['src'],
            treeDependencies: [{ from: ['src'], to: ['b'] }],
          },
        ],
      },
    },
    expected: [reExportProhibition('src/_types/a.type.ts')],
    name: '27.4 inter-Tree authorization does not permit explicit Role re-exports',
    responsiblePart: 're-export-prohibition',
    tree: {
      ...layerTree,
      'b/main.ts': 'export type Main = string;\n',
      'src/_types/a.type.ts': "export type { Main } from '../../b/main.js';\n",
    },
  },
  {
    config: {
      faf: {
        common,
        locals: [{ publicRootNodes: ['src/high.ts'], rootFragments: [root] }],
      },
    },
    expected: [
      dependency('treeOpacity', {
        from: 'outside.ts',
        line: 2,
        specifier: './src/low.js',
        to: 'src/low.ts',
      }),
    ],
    name: '28.1 local external consumers enter only through Public Surface without Tree authorization',
    responsiblePart: 'tree-frontier',
    tree: {
      ...rootTree,
      'outside.ts': "import './src/high.js';\nimport './src/low.js';\n",
    },
  },
  ...[
    { allowed: false, from: [], label: 'no authorization', to: [] },
    {
      allowed: true,
      from: ['src/high.ts'],
      label: 'exact source and destination',
      to: ['outside.ts'],
    },
    {
      allowed: false,
      from: ['src/low.ts'],
      label: 'different consumer only',
      to: ['outside.ts'],
    },
    {
      allowed: false,
      from: ['src/high.ts'],
      label: 'different destination only',
      to: ['other.ts'],
    },
    {
      allowed: false,
      from: ['src/_utils/widget/index.ts'],
      isAccessNode: true,
      label: 'Access Node configured in externalDependencies',
      to: ['outside.ts'],
    },
  ].map((item) => ({
    config: {
      faf: {
        common,
        locals: [
          {
            externalDependencies:
              item.from.length === 0 ? [] : [{ from: item.from, to: item.to }],
            rootFragments: item.isAccessNode === true ? [] : [root],
            rootLayers: item.isAccessNode === true ? ['src'] : [],
          },
        ],
      },
    },
    expected: build282Expected(item),
    name: `28.2 local exit: ${item.label}`,
    responsiblePart:
      item.isAccessNode === true
        ? 'classify-taxonomy'
        : 'external-dependencies',
    tree:
      item.isAccessNode === true
        ? {
            ...layerTree,
            'outside.ts': 'export const outside = 1;\n',
            'src/_utils/widget/index.ts':
              "export { widget } from './widget.util.js';\n",
          }
        : {
            ...rootTree,
            'other.ts': 'export const other = 1;\n',
            'outside.ts': 'export const outside = 1;\n',
            'src/high.ts': "import '../outside.js';\n",
          },
  })),
  ...[
    {
      contract: './_utils/widget/index.js',
      label: 'Fragment',
      node: 'src/_utils/widget/widget.util.ts',
      specifier: '../../../outside.js',
    },
    {
      contract: './_types/adapter.type.js',
      label: 'Category Node',
      node: 'src/_types/adapter.type.ts',
      specifier: '../../outside.js',
    },
  ].map(({ contract, label, node, specifier }) => ({
    config: {
      faf: {
        common,
        locals: [
          {
            externalDependencies: [{ from: [node], to: ['outside.ts'] }],
            rootFragments: [{ path: 'src', rootNodes: [['main.ts']] }],
          },
        ],
      },
    },
    expected: [
      dependency('externalDependencies', {
        from: 'src/main.ts',
        line: 2,
        specifier: '../outside.js',
        to: 'outside.ts',
      }),
    ],
    name: `28.3 qualified adapter static contract: ${label}`,
    responsiblePart: 'external-dependencies',
    tree: {
      'outside.ts': 'export const outside = 1;\n',
      'src/main.ts': `import '${contract}';\nimport '../outside.js';\nexport const main = 1;\n`,
      ...(label === 'Fragment'
        ? {
            'src/_utils/widget/index.ts':
              "export { widget } from './widget.util.js';\n",
            'src/_utils/widget/widget.util.ts': `import '${specifier}';\nexport const widget = 1;\n`,
          }
        : {
            'src/_types/adapter.type.ts': `import '${specifier}';\nexport type Adapter = string;\n`,
          }),
    },
  })),
  {
    config: { faf: { common, locals: [{ rootFragments: [root] }] } },
    expected: [
      dependency('externalDependencies', {
        from: 'src/high.ts',
        specifier: '#workspace',
        to: 'outside.ts',
      }),
    ],
    name: '28.4 package names distinguish workspace local files from external library sinks',
    responsiblePart: 'external-dependencies',
    tree: {
      ...rootTree,
      'outside.ts': 'export const outside = 1;\n',
      'package.json': JSON.stringify({
        imports: { '#workspace': './outside.ts' },
        type: 'module',
      }),
      'src/high.ts': "import '#workspace';\nimport 'node:path';\n",
    },
  },
  ...[
    {
      allowed: true,
      base: 'src/_src@shared',
      label: 'Fractal Branch',
      suffix: '/_types/a.type.ts',
    },
    {
      allowed: true,
      base: 'src/_utils/_utils@shared',
      label: 'nested Fractal Branch',
      layer: true,
      suffix: '/_types/a.type.ts',
    },
    {
      allowed: false,
      base: 'src',
      label: 'Root Fragment origin',
      suffix: '/low.ts',
    },
    {
      allowed: false,
      base: 'src',
      label: 'Root Layer origin',
      layer: true,
      suffix: '/_types/a.type.ts',
    },
    {
      allowed: false,
      base: 'src/child',
      label: 'nested Root Fragment',
      suffix: '/main.ts',
    },
    {
      allowed: false,
      base: 'src/_utils/widget',
      label: 'Fragment',
      suffix: '/index.ts',
    },
    {
      allowed: false,
      base: 'src/_types',
      label: 'Category',
      layer: true,
      suffix: '/a.type.ts',
    },
    {
      allowed: false,
      base: 'src/_types',
      label: 'Private Category',
      suffix: '/a.type.ts',
    },
    {
      allowed: false,
      base: 'src/_types/_base',
      label: 'Sub-Category',
      suffix: '/a.type.ts',
    },
    {
      allowed: false,
      base: 'src/_utils/_users',
      label: 'Path Sub-Category',
      suffix: '/get-user/index.ts',
    },
    {
      allowed: false,
      base: 'src/_src@shared/_ui',
      label: 'Layer',
      suffix: '/_types/a.type.ts',
    },
    {
      allowed: false,
      base: 'src/static',
      foreign: true,
      label: 'Foreign Domain',
      suffix: '/document.ts',
    },
    {
      allowed: false,
      base: 'src/_utils/widget/index.ts',
      file: true,
      label: 'unexposed Access Node',
      suffix: '',
    },
    {
      allowed: false,
      base: 'src/_types/a.type.ts',
      file: true,
      label: 'unexposed Category Node',
      suffix: '',
    },
    {
      allowed: false,
      base: 'src/low.ts',
      file: true,
      label: 'unexposed Root Node',
      suffix: '',
    },
    {
      allowed: false,
      base: 'src/_utils/widget/index.ts',
      file: true,
      label: 'structurally exposed Access Node',
      layer: true,
      suffix: '',
    },
    {
      allowed: false,
      base: 'src/_types/a.type.ts',
      file: true,
      label: 'structurally exposed Category Node',
      layer: true,
      suffix: '',
    },
    {
      allowed: false,
      base: 'src/low.ts',
      file: true,
      label: 'formally exposed Root Node',
      published: true,
      suffix: '',
    },
  ].map((item) => create291Scenario(item)),
  {
    config: {
      faf: {
        common: {
          ...common,
          aliases: {
            '#_src@shared': 'src/_src@shared/_ui',
            '#shared': 'src/_src@shared',
          },
        },
        locals: [{ rootFragments: [root] }],
      },
    },
    expected: [
      dependency('pathAliasAnchoring', {
        from: 'src/high.ts',
        line: 2,
        specifier: '#_src@shared/_types/a.type.ts',
        to: 'src/_src@shared/_ui/_types/a.type.ts',
      }),
    ],
    name: '29.2 alias text does not determine its actual base domain',
    responsiblePart: 'path-alias-anchoring',
    tree: {
      ...rootTree,
      'src/_src@shared/_ui/_types/a.type.ts': 'export type A = string;\n',
      'src/high.ts':
        "import '#shared/_ui/_types/a.type.ts';\nimport '#_src@shared/_types/a.type.ts';\n",
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          baseUrl: '.',
          paths: {
            '#_src@shared/*': ['./src/_src@shared/_ui/*'],
            '#shared/*': ['./src/_src@shared/*'],
          },
        },
      }),
    },
  },
  {
    config: { faf: { common, locals: [{ rootFragments: [root] }] } },
    expected: [
      dependency('pathAliasAnchoring', {
        from: 'src/high.ts',
        specifier: '#shared/_types/a.type.ts',
        to: 'src/_src@shared/_types/a.type.ts',
      }),
    ],
    name: '29.3 every alternative of a used alias must be anchored, not only the selected one',
    responsiblePart: 'path-alias-anchoring',
    tree: {
      ...rootTree,
      ...layerTree,
      'package.json': JSON.stringify({
        imports: {
          '#shared/*': ['./src/_src@shared/*', './src/_utils/widget/*'],
        },
        type: 'module',
      }),
      'src/_src@shared/_types/a.type.ts': 'export type A = string;\n',
      'src/high.ts': "import '#shared/_types/a.type.ts';\n",
    },
  },
  ...[
    {
      allowed: true,
      isExternal: false,
      isHidden: false,
      label: 'other Tree authorized surface',
    },
    {
      allowed: false,
      isExternal: false,
      isHidden: false,
      label: 'other Tree missing authorization',
    },
    {
      allowed: true,
      isExternal: false,
      isHidden: true,
      label: 'other Tree hidden destination',
    },
    {
      allowed: true,
      isExternal: true,
      isHidden: false,
      label: 'authorized local external file',
    },
    {
      allowed: false,
      isExternal: true,
      isHidden: false,
      label: 'unauthorized local external file',
    },
  ].map((item) => create294Scenario(item)),
  {
    config: {
      faf: {
        common: { ...common, aliases: { '#unused': 'legacy' } },
        locals: [{ rootFragments: [root] }],
      },
    },
    expected: [],
    name: '29.5 aliases unused for internal imports produce no anchoring violations',
    responsiblePart: 'path-alias-anchoring',
    tree: { ...rootTree, 'legacy/outside.ts': 'export const outside = 1;\n' },
  },
  {
    config: {
      faf: {
        common,
        locals: [{ rootFragments: [root] }],
      },
    },
    expected: [
      dependency('fragmentEncapsulation', {
        from: 'src/high.ts',
        line: 1,
        specifier: './_src@shared/_utils/widget/widget.util.js',
        to: 'src/_src@shared/_utils/widget/widget.util.ts',
      }),
      dependency('fragmentEncapsulation', {
        from: 'src/high.ts',
        line: 2,
        specifier: '#shared/_utils/widget/widget.util.js',
        to: 'src/_src@shared/_utils/widget/widget.util.ts',
      }),
    ],
    name: '29.6 relative and valid alias imports preserve encapsulation of deep details',
    responsiblePart: 'fragment-encapsulation',
    tree: {
      ...rootTree,
      'src/_src@shared/_utils/widget/index.ts':
        "export { widget } from './widget.util.js';\n",
      'src/_src@shared/_utils/widget/widget.util.ts':
        'export const widget = 1;\n',
      'src/high.ts':
        "import './_src@shared/_utils/widget/widget.util.js';\nimport '#shared/_utils/widget/widget.util.js';\n",
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          baseUrl: '.',
          paths: {
            '#shared/*': ['./src/_src@shared/*'],
          },
        },
      }),
    },
  },
  ...[
    {
      allowed: true,
      label: 'Logical Node within parent scope',
      owner: 'fractal-branch-visibility',
      source: 'src/high.ts',
      specifier: '#shared/_types/a.type.ts',
      target: 'src/_src@shared/_types/a.type.ts',
    },
    {
      allowed: false,
      label: 'Logical Node outside parent scope',
      owner: 'fractal-branch-visibility',
      source: 'src/high.ts',
      specifier: '#local/_types/a.type.ts',
      target: 'src/_utils/widget/_widget@shared/_types/a.type.ts',
    },
    {
      allowed: false,
      label: 'parent Fragment Access Node',
      owner: 'access-node-contract',
      source: 'src/_utils/widget/index.ts',
      specifier: '#local/_types/a.type.ts',
      target: 'src/_utils/widget/_widget@shared/_types/a.type.ts',
    },
    {
      allowed: false,
      label: 'authorized other Tree',
      owner: 'tree-frontier',
      source: 'b/main.ts',
      specifier: '#shared/_types/a.type.ts',
      target: 'src/_src@shared/_types/a.type.ts',
    },
    {
      allowed: false,
      label: 'local external consumer',
      owner: 'tree-frontier',
      source: 'outside.ts',
      specifier: '#shared/_types/a.type.ts',
      target: 'src/_src@shared/_types/a.type.ts',
    },
  ].map((item) => {
    const { label, owner, source, specifier } = item;
    return {
      config: {
        faf: {
          common,
          locals: [
            {
              rootFragments: [root, { path: 'b', rootNodes: [['main.ts']] }],
              treeDependencies: [{ from: ['b'], to: ['src'] }],
            },
          ],
        },
      },
      expected: build297Expected(item),
      name: `29.7 valid Branch alias does not widen scope: ${label}`,
      responsiblePart: owner,
      tree: {
        ...rootTree,
        ...layerTree,
        'b/main.ts': 'export const main = 1;\n',
        'outside.ts': 'export const outside = 1;\n',
        [source]: `import '${specifier}';\n${source.endsWith('index.ts') ? "export { widget } from './widget.util.js';" : ''}\n`,
        'src/_src@shared/_types/a.type.ts': 'export type A = string;\n',
        'src/_utils/widget/_widget@shared/_types/a.type.ts':
          'export type A = string;\n',
        'tsconfig.json': JSON.stringify({
          compilerOptions: {
            baseUrl: '.',
            paths: {
              '#local/*': ['./src/_utils/widget/_widget@shared/*'],
              '#shared/*': ['./src/_src@shared/*'],
            },
          },
        }),
      },
    };
  }),
  {
    config: { faf: { common, locals: [{ rootFragments: [root] }] } },
    expected: [],
    name: '29.8 aliases remain optional and relative depth has no invented threshold',
    responsiblePart: 'path-alias-anchoring',
    tree: {
      ...rootTree,
      ...layerTree,
      'src/high.ts': "import './_utils/widget/index.js';\n",
    },
  },
];

const WARMUP_TIMEOUT_MS = 120_000;

beforeAll(warmupESLint, WARMUP_TIMEOUT_MS);

describe('acceptance: P7b frontier edges', () => {
  it.each(scenarios)(
    '$name [$responsiblePart]',
    async ({ config, expected, files, responsiblePart, tree }) => {
      const fixture = await createProject(tree, config);
      try {
        const result = await lintScenario(fixture.path, files);
        expectScenario(result, responsiblePart, expected);
      } finally {
        await fixture.rm();
      }
    }
  );
});
