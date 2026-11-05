import type { FileTree } from 'fs-fixture';

import { beforeAll, describe, expect, it } from 'vitest';

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
const dependency = (
  filePath: string,
  constraint: string,
  line = 1,
  column = 1
): ReturnType<typeof expect.objectContaining> =>
  expect.objectContaining({
    column,
    constraint,
    element: filePath,
    filePath,
    line,
    messageId: constraint.split('/', 1)[0],
    ruleId: 'faf/conformity',
    severity: 2,
  });

type TScenario = {
  readonly config: Readonly<Record<string, unknown>>;
  readonly expected: Parameters<typeof expectScenario>[2];
  readonly files?: readonly string[];
  readonly name: string;
  readonly responsiblePart: string;
  readonly tree: FileTree;
};

const create262Scenario = ({
  exposed,
  label,
  node,
}: {
  readonly exposed: boolean;
  readonly label: string;
  readonly node: string;
}): TScenario => {
  const expected: ReturnType<typeof expect.objectContaining>[] = [];
  if (!exposed) {
    expected.push(dependency('consumer.ts', 'dependency/tree-opacity'));
    switch (label) {
      case 'Foreign Node': {
        expected.push(
          dependency('consumer.ts', 'dependency/foreign-node-isolation')
        );
        break;
      }
      case 'Sub-Graph Node': {
        expected.push(
          dependency('consumer.ts', 'dependency/sub-graph-node-isolation')
        );
        break;
      }
      default: {
        break;
      }
    }
  }

  return {
    config: {
      faf: {
        common,
        locals: [
          {
            foreignNodes: ['src/readme.md'],
            mimeticPathStructures: [
              { actions: ['get'], paths: ['src/_ui/_web/_utils'] },
            ],
            rootLayers: ['src'],
          },
        ],
      },
    },
    expected,
    name: `26.2 Root Layer structural surface: ${label}`,
    responsiblePart: 'public-surface',
    tree: {
      ...layerTree,
      'consumer.ts': `import './${node}';\n`,
      'src/_src@shared/_types/a.type.ts': 'export type A = string;\n',
      'src/_types/_types@shared/_types/a.type.ts': 'export type A = string;\n',
      'src/_ui/_types/_base/a.type.ts': 'export type A = string;\n',
      'src/_ui/_web/_utils/get-user/get-user.util.ts':
        'export const getUser = 1;\n',
      'src/_ui/_web/_utils/get-user/index.ts':
        "export { getUser } from './get-user.util.js';\n",
      'src/_utils/widget/_utils/helper/helper.util.ts':
        'export const helper = 1;\n',
      'src/_utils/widget/_utils/helper/index.ts':
        "export { helper } from './helper.util.js';\n",
      'src/_utils/widget/widget.spec.ts': 'export const test = 1;\n',
      'src/readme.md': 'readme',
    },
  };
};

const resolveInducedConstraint = (
  isReciprocal = false,
  isPrivateTarget = false
): string => {
  if (isReciprocal) {
    return 'acyclicity/inter-tree-cycle';
  }
  if (isPrivateTarget) {
    return 'dependency/tree-opacity';
  }
  return 'dependency/induced-tree-authorization';
};

const resolveOutsideImport = (
  isViaY: boolean,
  isPrivateTarget: boolean
): string => {
  if (isViaY) {
    return "import './other.js';\n";
  }
  const subpath = isPrivateTarget ? 'private' : 'main';
  return `import './b/${subpath}.js';\n`;
};

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

const isRootBase = (base: string, isLayer = false): boolean =>
  base === 'src/child' || base === 'src/low.ts' || (!isLayer && base === 'src');

const buildAliasTree = (item: TAliasBaseCase): FileTree => {
  const importTarget = item.file === true ? '#base' : '#base/*';
  const targetPath = `./${item.base}${item.file === true ? '' : '/*'}`;
  const sourceFile =
    item.layer === true ? 'src/_utils/source/source.util.ts' : 'src/high.ts';
  const sourceContent = `import '#base${item.suffix}';\n${item.layer === true ? 'export const source = 1;' : ''}\n`;

  return {
    ...layerTree,
    ...(item.layer !== true && rootTree),
    'package.json': JSON.stringify({
      imports: { [importTarget]: targetPath },
      type: 'module',
    }),
    'src/_src@shared/_types/_types@shared/_types/a.type.ts':
      'export type A = string;\n',
    'src/_src@shared/_types/a.type.ts': 'export type A = string;\n',
    'src/_src@shared/_ui/_types/a.type.ts': 'export type A = string;\n',
    'src/_types/_base/a.type.ts': 'export type A = string;\n',
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
        horizontalHierarchies: [[['_types'], ['_utils']]],
        mimeticPathStructures: [{ actions: ['get'], paths: ['src/_utils'] }],
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

const create291Scenario = (item: TAliasBaseCase): TScenario => {
  const expected: ReturnType<typeof expect.objectContaining>[] = [];
  if (!item.allowed && item.foreign !== true) {
    const targetFile =
      item.layer === true ? 'src/_utils/source/source.util.ts' : 'src/high.ts';
    expected.push(dependency(targetFile, 'dependency/path-alias-anchoring'));
  }
  if (item.foreign === true) {
    expected.push(
      dependency('src/high.ts', 'dependency/foreign-node-isolation')
    );
  }
  if (isRootBase(item.base, item.layer)) {
    expected.push(dependency('src/high.ts', 'dependency/root-node-discipline'));
  }
  if (item.layer === true && item.base.includes('widget')) {
    expected.push(
      dependency(
        'src/_utils/source/source.util.ts',
        'dependency/peer-separation'
      )
    );
  }

  return {
    config: buildAliasConfig(item),
    expected,
    name: `29.1 alias base classification: ${item.label}`,
    responsiblePart:
      item.foreign === true ? 'foreign-node-isolation' : 'path-alias-anchoring',
    tree: buildAliasTree(item),
  };
};

type T294Case = {
  readonly allowed: boolean;
  readonly isExternal: boolean;
  readonly isHidden: boolean;
  readonly label: string;
};

const resolve294Constraint = (
  isExternal: boolean,
  isHidden: boolean
): string => {
  if (isExternal) {
    return 'dependency/external-dependencies';
  }
  if (isHidden) {
    return 'dependency/tree-opacity';
  }
  return 'dependency/tree-authorization';
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

const create294Scenario = (item: T294Case): TScenario => {
  const expected: ReturnType<typeof expect.objectContaining>[] = [];
  if (!item.allowed || item.isHidden) {
    expected.push(
      dependency(
        'src/high.ts',
        resolve294Constraint(item.isExternal, item.isHidden)
      )
    );
  }

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
    expected,
    name: `29.4 aliases outside the source Tree need only destination authorization: ${item.label}`,
    responsiblePart: item.isExternal
      ? 'external-dependencies'
      : 'tree-frontier',
    tree: {
      ...rootTree,
      'b/_b@shared/_types/a.type.ts': 'export type A = string;\n',
      'b/_types/a.type.ts': 'export type A = string;\n',
      'legacy/outside.ts': 'export const outside = 1;\n',
      'src/high.ts': `import '${resolve294TargetSpecifier(item.isExternal, item.isHidden)}';\n`,
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
      : [dependency('src/high.ts', 'dependency/root-node-discipline')],
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
        : [dependency(from, 'dependency/root-node-discipline')],
      name: `12.2 ${label}: ${allowed ? 'direct authorization' : 'no authorization'}`,
      responsiblePart: 'root-node-discipline',
      tree: {
        [from]: `import '${specifier}';\nexport const value = 1;\n`,
        'src/a/main.ts': 'export const a = 1;\n',
        'src/b/main.ts': 'export const b = 1;\n',
        'src/main.ts': 'export const main = 1;\n',
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
    expected: [dependency('src/main.tsx', 'dependency/root-node-discipline')],
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
      dependency('src/a/main.ts', 'dependency/root-node-discipline'),
      dependency('src/b/main.ts', 'dependency/root-node-discipline'),
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
  ].map(({ file, label }) => ({
    config: {
      faf: {
        common,
        locals: [{ publicRootNodes: ['src/high.ts'], rootFragments: [root] }],
      },
    },
    expected: [dependency(file, 'dependency/root-node-discipline')],
    name: `12.5 ${label} cannot import a Root Node even when exposed`,
    responsiblePart: 'root-node-discipline',
    tree: {
      ...rootTree,
      ...layerTree,
      [file]: `import '${file.includes('_utils') ? '../../high.js' : '../high.js'}';\nexport const value = 1;\n`,
    },
  })),
  {
    config: { faf: { common, locals: [{ rootFragments: [root] }] } },
    expected: [dependency('src/high.ts', 'dependency/fragment-encapsulation')],
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
  ].map(({ asset, code, column = 1, label }) => ({
    config: {
      faf: {
        common,
        locals: [
          {
            rootFragments: [
              {
                path: 'src',
                rootNodes: [['high.ts', asset === true ? 'low.css' : 'low.ts']],
              },
            ],
          },
        ],
      },
    },
    expected: [
      dependency('src/high.ts', 'dependency/root-node-discipline', 1, column),
    ],
    name: `25.1 resolved forbidden dependency: ${label}`,
    responsiblePart: 'root-node-discipline',
    tree: {
      [asset === true ? 'src/low.css' : 'src/low.ts']:
        asset === true
          ? 'body {}\n'
          : 'export const low = 1;\nexport type Low = string;\nexport default low;\n',
      'src/high.ts': `${code}\n`,
    },
  })),
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
    expected: [dependency('consumer.ts', 'dependency/tree-opacity')],
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
    expected: [dependency('src/high.ts', 'dependency/fragment-encapsulation')],
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
    expected: [dependency('src/_styles/a.css', 'dependency/peer-separation')],
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
    expected: [dependency('src/high.ts', 'unverified/unresolved-import')],
    name: '25.6 unresolved imports remain explicitly unverified',
    responsiblePart: 'collect-modules',
    tree: { ...rootTree, 'src/high.ts': "import './missing.js';\n" },
  },
  {
    config: { faf: { common, locals: [{ rootFragments: [root] }] } },
    expected: [
      dependency('src/high.ts', 'unverified/non-literal-dynamic-import', 2),
    ],
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
    expected: [dependency('src/high.ts', 'dependency/root-node-discipline')],
    files: ['fafconfig.ts', 'src/high.ts'],
    name: '25.8 dependency is checked even when ESLint does not visit the target',
    responsiblePart: 'root-node-discipline',
    tree: { ...rootTree, 'src/high.ts': "import './low.js';\n" },
  },
  ...[
    { exposed: true, label: 'direct Root Node', node: 'src/high.ts' },
    { exposed: true, label: 'nested Root Node', node: 'src/child/main.ts' },
    {
      exposed: false,
      label: 'private Access Node',
      node: 'src/_utils/widget/index.ts',
    },
    {
      exposed: false,
      label: 'apical Branch Category Node',
      node: 'src/_src@shared/_types/a.type.ts',
    },
    {
      exposed: false,
      label: 'Fragment Node',
      node: 'src/_utils/widget/widget.util.ts',
    },
    {
      exposed: false,
      label: 'Sub-Graph Node',
      node: 'src/_utils/widget/widget.spec.ts',
    },
    { exposed: false, label: 'Foreign Node', node: 'src/readme.md' },
  ].map(({ exposed, label, node }) => ({
    config: {
      faf: {
        common,
        locals: [
          {
            foreignNodes: ['src/readme.md'],
            publicRootNodes: [node],
            rootFragments: [
              {
                ...root,
                subRootFragments: [
                  { path: 'src/child', rootNodes: [['main.ts']] },
                ],
              },
            ],
          },
        ],
      },
    },
    expected: exposed
      ? []
      : [
          expect.objectContaining({
            constraint: 'configuration/public-root-node-not-enumerated',
            element: 'fafconfig.ts',
            filePath: 'fafconfig.ts',
            line: 1,
            messageId: 'configuration',
            ruleId: 'faf/conformity',
            severity: 2,
          }),
        ],
    name: `26.1 Root Fragment publication: ${label}`,
    responsiblePart: 'public-surface',
    tree: {
      ...rootTree,
      ...layerTree,
      'src/_src@shared/_types/a.type.ts': 'export type A = string;\n',
      'src/_utils/widget/widget.spec.ts': 'export const test = 1;\n',
      'src/child/main.ts': 'export const main = 1;\n',
      'src/readme.md': 'readme',
    },
  })),
  ...[
    {
      exposed: true,
      label: 'direct Category Fragment Access Node',
      node: 'src/_utils/widget/index.ts',
    },
    {
      exposed: true,
      label: 'direct Category Node',
      node: 'src/_types/a.type.ts',
    },
    {
      exposed: true,
      label: 'Sub-Category Node in a Layer',
      node: 'src/_ui/_types/_base/a.type.ts',
    },
    {
      exposed: true,
      label: 'Path Fragment in a Sub-Layer',
      node: 'src/_ui/_web/_utils/get-user/index.ts',
    },
    {
      exposed: false,
      label: 'Fragment Node',
      node: 'src/_utils/widget/widget.util.ts',
    },
    {
      exposed: false,
      label: 'Sub-Graph Node',
      node: 'src/_utils/widget/widget.spec.ts',
    },
    {
      exposed: false,
      label: 'Private Category Access Node',
      node: 'src/_utils/widget/_utils/helper/index.ts',
    },
    {
      exposed: false,
      label: 'apical Branch Category Node',
      node: 'src/_src@shared/_types/a.type.ts',
    },
    {
      exposed: false,
      label: 'deeper Branch Category Node',
      node: 'src/_types/_types@shared/_types/a.type.ts',
    },
    { exposed: false, label: 'Foreign Node', node: 'src/readme.md' },
  ].map((entry) => create262Scenario(entry)),
  ...[0, 1, 3].map((count) => ({
    config: {
      faf: {
        common,
        locals: [
          {
            publicRootNodes: ['src/a.ts', 'src/b.ts', 'src/c.ts'].slice(
              0,
              count
            ),
            rootFragments: [
              { path: 'src', rootNodes: [['a.ts', 'b.ts', 'c.ts']] },
            ],
          },
        ],
      },
    },
    expected: [],
    name: `26.3 ${count.toString()} published Root Nodes require no barrel`,
    responsiblePart: 'public-surface',
    tree: {
      'src/a.ts': 'export const a = 1;\n',
      'src/b.ts': 'export const b = 1;\n',
      'src/c.ts': 'export const c = 1;\n',
    },
  })),
  ...[
    { exposed: true, label: 'new public unit', node: 'src/_types/new.type.ts' },
    {
      exposed: false,
      label: 'unit relocated into Branch',
      node: 'src/_src@shared/_types/new.type.ts',
    },
  ].map(({ exposed, label, node }) => ({
    config: { faf: { common, locals: [{ rootLayers: ['src'] }] } },
    expected: exposed
      ? []
      : [dependency('consumer.ts', 'dependency/tree-opacity')],
    name: `26.4 surface follows structure: ${label}`,
    responsiblePart: 'public-surface',
    tree: {
      'consumer.ts': `import './${node}';\n`,
      [node]: 'export type New = string;\n',
    },
  })),
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
      : [dependency('consumer.ts', 'dependency/tree-opacity')],
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
    expected: [dependency('consumer.ts', 'dependency/tree-opacity', 2)],
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
      dependency(
        'src/_utils/widget/widget.util.ts',
        'dependency/root-node-discipline'
      ),
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
      dependency('src/_types/a.type.ts', 'dependency/peer-separation'),
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
          dependency(
            'a/main.ts',
            published
              ? 'dependency/tree-authorization'
              : 'dependency/tree-opacity'
          ),
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
  ].map(({ access, label, node, rootSource, specifier }) => ({
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
      ? [dependency(node, 'dependency/access-node-contract')]
      : [],
    name: `27.2 inter-Tree source: ${label}`,
    responsiblePart: access ? 'access-node-contract' : 'tree-frontier',
    tree: {
      ...layerTree,
      ...(rootSource && rootTree),
      'b/main.ts': 'export const main = 1;\n',
      [node]: `import '${specifier}';\n${access ? "export { widget } from './widget.util.js';" : 'export const value = 1;'}\n`,
    },
  })),
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
    expected: [
      dependency('src/_types/a.type.ts', 'symbol/re-export-prohibition'),
    ],
    name: '27.4 inter-Tree authorization does not permit explicit Role re-exports',
    responsiblePart: 're-export-prohibition',
    tree: {
      ...layerTree,
      'b/main.ts': 'export type Main = string;\n',
      'src/_types/a.type.ts': "export type { Main } from '../../b/main.js';\n",
    },
  },
  ...[
    {
      cycle: false,
      edges: [
        ['a', 'b'],
        ['b', 'c'],
      ],
      label: 'chain',
    },
    {
      cycle: false,
      edges: [
        ['a', 'b'],
        ['a', 'c'],
        ['b', 'c'],
      ],
      label: 'diamond',
    },
    {
      cycle: true,
      edges: [
        ['a', 'b'],
        ['b', 'a'],
      ],
      label: 'two-Tree cycle with distinct modules',
    },
    {
      cycle: true,
      edges: [
        ['a', 'b'],
        ['b', 'c'],
        ['c', 'a'],
      ],
      label: 'three-Tree cycle with distinct modules',
    },
  ].map(({ cycle, edges, label }) => ({
    config: {
      faf: {
        common,
        locals: [
          {
            publicRootNodes: ['a/in.ts', 'b/in.ts', 'c/in.ts'],
            rootFragments: ['a', 'b', 'c'].map((path) => ({
              path,
              rootNodes: [['in.ts', 'out.ts']],
            })),
            treeDependencies: edges.map(([from, to]) => ({
              from: [from],
              to: [to],
            })),
          },
        ],
      },
    },
    expected: cycle
      ? [dependency('fafconfig.ts', 'acyclicity/inter-tree-cycle')]
      : [],
    name: `27.5 induced Tree DAG: ${label}`,
    responsiblePart: 'acyclicity',
    tree: {
      'a/in.ts': 'export const a = 1;\n',
      'a/out.ts': "import '../b/in.js';\n",
      'b/in.ts': 'export const b = 1;\n',
      'b/out.ts': edges
        .filter(([from]) => from === 'b')
        .map(([, to = '']) => `import '../${to}/in.js';`)
        .join('\n'),
      'c/in.ts': 'export const c = 1;\n',
      'c/out.ts':
        cycle && edges.length === 3
          ? "import '../a/in.js';\n"
          : 'export const c = 1;\n',
    },
  })),
  {
    config: {
      faf: {
        common,
        locals: [{ publicRootNodes: ['src/high.ts'], rootFragments: [root] }],
      },
    },
    expected: [dependency('outside.ts', 'dependency/tree-opacity', 2)],
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
  ].map(({ allowed, from, label, to }) => ({
    config: {
      faf: {
        common,
        locals: [
          {
            externalDependencies: from.length === 0 ? [] : [{ from, to }],
            rootFragments: [root],
          },
        ],
      },
    },
    expected: allowed
      ? []
      : [dependency('src/high.ts', 'dependency/external-dependencies')],
    name: `28.2 local exit: ${label}`,
    responsiblePart: 'external-dependencies',
    tree: {
      ...rootTree,
      'other.ts': 'export const other = 1;\n',
      'outside.ts': 'export const outside = 1;\n',
      'src/high.ts': "import '../outside.js';\n",
    },
  })),
  {
    config: { faf: { common, locals: [{ rootLayers: ['src'] }] } },
    expected: [
      dependency(
        'src/_utils/widget/index.ts',
        'dependency/access-node-contract'
      ),
      dependency(
        'src/_utils/widget/index.ts',
        'dependency/external-dependencies'
      ),
    ],
    name: '28.2 Access Nodes cannot exit to local external files',
    responsiblePart: 'external-dependencies',
    tree: {
      ...layerTree,
      'outside.ts': 'export const outside = 1;\n',
      'src/_utils/widget/index.ts':
        "import '../../../outside.js';\nexport { widget } from './widget.util.js';\n",
    },
  },
  ...[
    {
      contract: 'src/_utils/widget/index.ts',
      label: 'Fragment',
      node: 'src/_utils/widget/widget.util.ts',
      specifier: '../../../outside.js',
    },
    {
      contract: 'src/_types/a.type.ts',
      label: 'Category Node',
      node: 'src/_types/a.type.ts',
      specifier: '../../outside.js',
    },
  ].map(({ contract, label, node, specifier }) => ({
    config: {
      faf: {
        common,
        locals: [
          {
            externalDependencies: [{ from: [node], to: ['outside.ts'] }],
            rootLayers: ['src'],
          },
        ],
      },
    },
    expected: [
      dependency('consumer.ts', 'dependency/tree-opacity'),
      dependency('src/_types/b.type.ts', 'dependency/external-dependencies'),
    ].filter((_message, index) => index !== 0 || contract.includes('_utils')),
    name: `28.3 qualified adapter static contract: ${label}`,
    responsiblePart: 'external-dependencies',
    tree: {
      ...layerTree,
      'consumer.ts': `import './${contract}';\n`,
      [node]: `import '${specifier}';\n${label === 'Fragment' ? 'export const widget = 1;' : 'export type A = string;'}\n`,
      'outside.ts': 'export const outside = 1;\n',
      'src/_types/b.type.ts':
        "import '../../outside.js';\nexport type B = string;\n",
    },
  })),
  {
    config: { faf: { common, locals: [{ rootFragments: [root] }] } },
    expected: [dependency('src/high.ts', 'dependency/external-dependencies')],
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
    { chain: ['outside.ts', 'src/low.ts'], label: 'direct same-Tree return' },
    {
      chain: ['outside.ts', 'other.ts', 'src/low.ts'],
      label: 'two-external-file same-Tree return',
    },
    {
      chain: ['outside.ts', 'b/main.ts', 'other.ts', 'src/low.ts'],
      label: 'return through another Tree',
    },
  ].map(({ chain, label }) => ({
    config: {
      faf: {
        common,
        locals: [
          {
            externalDependencies: [
              { from: ['src/high.ts'], to: ['outside.ts'] },
              { from: ['b/main.ts'], to: ['other.ts'] },
            ],
            publicRootNodes: ['src/low.ts', 'b/main.ts'],
            rootFragments: [root, { path: 'b', rootNodes: [['main.ts']] }],
            treeDependencies: [
              { from: ['src'], to: ['b'] },
              { from: ['b'], to: ['src'] },
            ],
          },
        ],
      },
    },
    expected: [dependency('src/high.ts', 'acyclicity/re-entry-prohibition')],
    name: `28.5 local authorization never permits re-entry: ${label}`,
    responsiblePart: 're-entry-prohibition',
    tree: {
      ...rootTree,
      'b/main.ts': 'export const main = 1;\n',
      'other.ts': 'export const other = 1;\n',
      'outside.ts': 'export const outside = 1;\n',
      'src/high.ts': "import '../outside.js';\n",
      ...Object.fromEntries(
        chain
          .slice(0, -1)
          .map((path, index) => [
            path,
            `import '${path === 'b/main.ts' ? '../' : './'}${chain[index + 1] ?? ''}';\n`,
          ])
      ),
    },
  })),
  {
    config: {
      faf: {
        common,
        locals: [
          {
            externalDependencies: [
              { from: ['src/high.ts'], to: ['outside.ts'] },
            ],
            rootFragments: [root],
          },
        ],
      },
    },
    expected: [],
    name: '28.6 authorized exit through external-only files has no FAF taxonomy or re-entry violation',
    responsiblePart: 're-entry-prohibition',
    tree: {
      ...rootTree,
      'Other_EXTERNAL.ts':
        'export const first = 1;\nexport const second = 2;\n',
      'outside.ts': "import './Other_EXTERNAL.js';\n",
      'src/high.ts': "import '../outside.js';\n",
    },
  },
  ...[
    {
      allowed: true,
      edges: [{ from: ['src'], to: ['b'] }],
      label: 'direct authorized induced dependency',
      privateTarget: false,
      viaY: false,
    },
    {
      allowed: true,
      edges: [{ from: ['src'], to: ['b'] }],
      label: 'authorized dependency through two external files',
      privateTarget: false,
      viaY: true,
    },
    {
      allowed: false,
      edges: [],
      label: 'missing induced authorization',
      privateTarget: false,
      viaY: false,
    },
    {
      allowed: false,
      edges: [{ from: ['b'], to: ['src'] }],
      label: 'inverse induced authorization only',
      privateTarget: false,
      viaY: false,
    },
    {
      allowed: false,
      edges: [{ from: ['src'], to: ['b'] }],
      label: 'induced dependency into private destination',
      privateTarget: true,
      viaY: false,
    },
    {
      allowed: false,
      edges: [
        { from: ['src'], to: ['b'] },
        { from: ['b'], to: ['src'] },
      ],
      label: 'exercised induced reciprocal dependency',
      privateTarget: false,
      reciprocal: true,
      viaY: false,
    },
  ].map(({ allowed, edges, label, privateTarget, reciprocal, viaY }) => ({
    config: {
      faf: {
        common,
        locals: [
          {
            externalDependencies: [
              { from: ['src/high.ts'], to: ['outside.ts'] },
            ],
            publicRootNodes: ['src/low.ts', 'b/main.ts'],
            rootFragments: [
              root,
              { path: 'b', rootNodes: [['main.ts', 'private.ts']] },
            ],
            treeDependencies: edges,
          },
        ],
      },
    },
    expected: allowed
      ? []
      : [
          dependency(
            privateTarget ? 'outside.ts' : 'src/high.ts',
            resolveInducedConstraint(reciprocal, privateTarget)
          ),
        ],
    name: `28.7 induced inter-Tree dependency: ${label}`,
    responsiblePart: 're-entry-prohibition',
    tree: {
      ...rootTree,
      'b/main.ts':
        reciprocal === true
          ? "import '../src/low.js';\n"
          : 'export const main = 1;\n',
      'b/private.ts': 'export const hidden = 1;\n',
      'other.ts': "import './b/main.js';\n",
      'outside.ts': resolveOutsideImport(viaY, privateTarget),
      'src/high.ts': "import '../outside.js';\n",
    },
  })),
  {
    config: {
      faf: {
        common,
        locals: [
          {
            externalDependencies: [
              { from: ['src/high.ts'], to: ['outside.ts'] },
            ],
            rootFragments: [root],
          },
        ],
      },
    },
    expected: [],
    name: '28.8 an entirely external cycle is not a FAF violation',
    responsiblePart: 're-entry-prohibition',
    tree: {
      ...rootTree,
      'other.ts': "import './outside.js';\n",
      'outside.ts': "import './other.js';\n",
      'src/high.ts': "import '../outside.js';\n",
    },
  },
  {
    config: {
      faf: {
        common,
        locals: [
          {
            externalDependencies: [
              {
                from: ['src/_src@shared/_types/a.type.ts'],
                to: ['outside.ts'],
              },
            ],
            publicRootNodes: ['src/low.ts'],
            rootFragments: [root],
          },
        ],
      },
    },
    expected: [
      dependency(
        'src/_src@shared/_types/a.type.ts',
        'acyclicity/re-entry-prohibition'
      ),
    ],
    name: '28.9 a Branch return through external code remains forbidden despite publication',
    responsiblePart: 're-entry-prohibition',
    tree: {
      ...rootTree,
      'outside.ts': "import './src/low.js';\n",
      'src/_src@shared/_types/a.type.ts':
        "import '../../../outside.js';\nexport type A = string;\n",
    },
  },
  {
    config: {
      faf: {
        common,
        locals: [
          {
            externalDependencies: [
              { from: ['src/high.ts'], to: ['outside.ts'] },
            ],
            rootFragments: [root],
          },
        ],
      },
    },
    expected: [dependency('outside.ts', 'unverified/unresolved-import')],
    name: '28.10 unavailable external dependencies make transitive verification incomplete',
    responsiblePart: 'collect-modules',
    tree: {
      ...rootTree,
      'outside.ts': "import './missing.js';\n",
      'src/high.ts': "import '../outside.js';\n",
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
      base: 'src/_src@shared/_types/_types@shared',
      label: 'nested Fractal Branch',
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
    expected: [dependency('src/high.ts', 'dependency/path-alias-anchoring', 2)],
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
    expected: [dependency('src/high.ts', 'dependency/path-alias-anchoring')],
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
        common: { ...common, aliases: { '#shared': 'src/_src@shared' } },
        locals: [{ rootFragments: [root] }],
      },
    },
    expected: [
      dependency('src/high.ts', 'dependency/fragment-encapsulation'),
      dependency('src/high.ts', 'dependency/fragment-encapsulation', 2),
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
    },
    {
      allowed: false,
      label: 'Logical Node outside parent scope',
      owner: 'fractal-branch-visibility',
      source: 'src/high.ts',
      specifier: '#local/_types/a.type.ts',
    },
    {
      allowed: false,
      label: 'parent Fragment Access Node',
      owner: 'access-node-contract',
      source: 'src/_utils/widget/index.ts',
      specifier: '#local/_types/a.type.ts',
    },
    {
      allowed: false,
      label: 'authorized other Tree',
      owner: 'tree-frontier',
      source: 'b/main.ts',
      specifier: '#shared/_types/a.type.ts',
    },
    {
      allowed: false,
      label: 'local external consumer',
      owner: 'tree-frontier',
      source: 'outside.ts',
      specifier: '#shared/_types/a.type.ts',
    },
  ].map(({ allowed, label, owner, source, specifier }) => ({
    config: {
      faf: {
        common: {
          ...common,
          aliases: {
            '#local': 'src/_utils/widget/_widget@shared',
            '#shared': 'src/_src@shared',
          },
        },
        locals: [
          {
            rootFragments: [root, { path: 'b', rootNodes: [['main.ts']] }],
            treeDependencies: [{ from: ['b'], to: ['src'] }],
          },
        ],
      },
    },
    expected: allowed
      ? []
      : [
          dependency(
            source,
            owner === 'tree-frontier'
              ? 'dependency/tree-opacity'
              : `dependency/${owner}`
          ),
        ],
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
  })),
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
