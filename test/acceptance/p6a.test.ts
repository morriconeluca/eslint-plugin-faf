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
  { category: '_modules', isCategoryNode: true, name: 'module' },
  { category: '_styles', implicitRoleExtensions: ['.css'], name: 'style' },
  { category: '_fonts', implicitRoleExtensions: ['.woff2'], name: 'font' },
  { category: '_types', isCategoryNode: true, name: 'type' },
  { category: '_styled', name: 'styled' },
  { category: '_utils', name: 'util' },
  { category: '_classes', name: 'class' },
  { category: '_factories', name: 'factory' },
  { category: '_hooks', name: 'hook' },
  [
    { category: '_components', name: 'component' },
    { category: '_contexts', name: 'context' },
  ],
  { category: '_pages', name: 'page' },
  { category: '_apis', name: 'api' },
  { category: '_schemas', isCategoryNode: true, name: 'schema' },
  { category: '_models', isCategoryNode: true, name: 'model' },
];

const local = {
  roles,
  rootLayers: ['src'],
  subGraphRoles: [{ name: 'spec' }, { name: 'story' }],
};

const button = {
  'src/_components/button/button.component.tsx': 'export const button = 1;\n',
  'src/_components/button/index.ts':
    "export { button } from './button.component.js';\n",
};

const diagnostic = (
  constraint: string,
  element: string,
  filePath: string,
  detail: string,
  messageId = 'classification'
): TScenarioMessage => ({
  column: 1,
  constraint,
  element,
  filePath,
  line: 1,
  message: `${constraint}: ${detail}`,
  messageId,
  ruleId: 'faf/conformity',
  severity: 2,
});

const unclassifiable = (path: string): TScenarioMessage =>
  diagnostic(
    'classification/unclassifiable-file',
    path,
    path,
    `'${path}' is neither a uniquely classified Logical Node nor a Foreign Node (FAF §6.9).`
  );

const unclassifiableDomain = (path: string, anchor: string): TScenarioMessage =>
  diagnostic(
    'classification/unclassifiable-directory',
    path,
    anchor,
    `'${path}' has no unique Logical Domain classification (FAF §6.9).`
  );

const containmentViolation = (
  element: string,
  filePath = element
): TScenarioMessage =>
  diagnostic(
    'classification/containment-matrix',
    element,
    filePath,
    `'${element}' is a child type that its parent Logical Domain does not admit (FAF §6.8).`
  );

const exclusiveFormsViolation = (
  element: string,
  filePath = 'fafconfig.ts'
): TScenarioMessage =>
  diagnostic(
    'classification/exclusive-forms',
    element,
    filePath,
    `'${element}' mixes mutually exclusive forms among its direct children (FAF §6.3.2, §6.4.1, §6.5.1, §6.6.1).`
  );

const categoryRoleViolation = (element: string): TScenarioMessage =>
  diagnostic(
    'classification/category-role',
    element,
    element,
    `'${element}' does not have the form or the Role imposed by its Category (FAF §6.3.1).`
  );

const missingMasterViolation = (
  element: string,
  filePath: string
): TScenarioMessage =>
  diagnostic(
    'classification/missing-master-node',
    element,
    filePath,
    `'${element}' has no direct Fragment Node with the Role imposed by its Category (FAF §6.1.1).`
  );

const missingAccessViolation = (filePath: string): TScenarioMessage =>
  diagnostic(
    'classification/missing-access-node',
    'src/_components/button',
    filePath,
    "'src/_components/button' has no index.ts Access Node (FAF §6.1.1)."
  );

const duplicateRoleViolation = (filePath: string): TScenarioMessage =>
  diagnostic(
    'classification/duplicate-fragment-role',
    'src/_components/button',
    filePath,
    "'src/_components/button' has more than one direct Logical Node with the same explicit Role (FAF §6.1.1)."
  );

const fragmentRankViolation = (element: string): TScenarioMessage =>
  diagnostic(
    'classification/fragment-node-rank',
    element,
    element,
    `'${element}' has a Rank not strictly lower than the Master Node of its Fragment (FAF §6.1.3).`
  );

const fragmentAnatomyViolation = (
  element: string,
  filePath = element
): TScenarioMessage =>
  diagnostic(
    'classification/fragment-node-anatomy',
    element,
    filePath,
    `'${element}' is not a Fragment Node, Access Node or Sub-Graph Node named after its Fragment (FAF §6.1.1).`
  );

const masterNotExportedViolation = (accessNode: string): TScenarioMessage =>
  diagnostic(
    'symbol/access-node-master-export',
    accessNode,
    accessNode,
    `'${accessNode}' does not re-export the Symbol of its Master Node (FAF §6.1.1).`,
    'symbol'
  );

const peerSeparationViolation = (
  source: string,
  target: string,
  specifier: string
): TScenarioMessage =>
  diagnostic(
    'dependency/peer-separation',
    source,
    source,
    `'${source}' imports '${target}' through '${specifier}': sibling subtrees may depend on each other only downward along a Horizontal Hierarchy (FAF §5).`,
    'dependency'
  );

const branchUnidirectionalityViolation = (
  source: string,
  target: string,
  specifier: string
): TScenarioMessage =>
  diagnostic(
    'dependency/fractal-branch-unidirectionality',
    source,
    source,
    `'${source}' imports '${target}' through '${specifier}': a Fractal Branch must not depend on the other subtrees of its parent (FAF §6.6.2).`,
    'dependency'
  );

const treeOpacityViolation = (
  source: string,
  target: string,
  specifier: string
): TScenarioMessage =>
  diagnostic(
    'dependency/tree-opacity',
    source,
    source,
    `'${source}' imports '${target}' through '${specifier}': only the Public Surface of a Fractal Tree is importable from outside the Tree (FAF §7.1).`,
    'dependency'
  );

const scenario = (
  name: string,
  responsiblePart: string,
  tree: FileTree,
  expected: readonly TScenarioMessage[] = [],
  declarations: Readonly<Record<string, unknown>> = local,
  additionalLocals: readonly Readonly<Record<string, unknown>>[] = []
): void => {
  it(name, async () => {
    const fixture = await createProject(tree, {
      faf: { locals: [declarations, ...additionalLocals] },
    });
    try {
      expectScenario(
        await lintScenario(fixture.path),
        responsiblePart,
        expected
      );
    } finally {
      await fixture.rm();
    }
  });
};

describe('acceptance: structural norms', () => {
  const WARMUP_TIMEOUT_MS = 120_000;
  beforeAll(warmupESLint, WARMUP_TIMEOUT_MS);

  describe('Fragment anatomy', () => {
    for (const [container, role, name] of [
      ['src/_components', 'component', 'button'],
      ['src/_components/button/_utils', 'util', 'normalize'],
      ['src/_components/_atoms', 'component', 'button'],
      ['src/_components/_atoms/_controls', 'component', 'button'],
      ['src/_pages', 'page', 'home'],
      ['src/_apis/_todos', 'api', 'get-todos'],
      ['src/_apis/_todos/_[todo-id]', 'api', 'get-todo'],
    ]) {
      const path = `${container}/${name}`;
      scenario(
        `derives the Master from ${container} for ${role}`,
        'fragment-anatomy',
        {
          ...(container?.startsWith('src/_components/_atoms') !== true &&
            button),
          [`${path}/${name}.${role}.tsx`]: 'export const value = 1;\n',
          [`${path}/index.ts`]: `export { value } from './${name}.${role}.js';\n`,
          'src/_apis': {},
          'src/_pages': {},
        },
        [],
        {
          ...local,
          mimeticPathStructures: [
            { paths: ['src/_pages'] },
            { actions: ['get'], paths: ['src/_apis'] },
          ],
        }
      );
    }

    scenario('does not inherit the Parent Fragment Role', 'fragment-anatomy', {
      ...button,
      'src/_components/button/_utils/normalize/index.ts':
        "export { normalize } from './normalize.util.js';\n",
      'src/_components/button/_utils/normalize/normalize.type.ts':
        'export type TValue = number;\n',
      'src/_components/button/_utils/normalize/normalize.util.ts':
        'export const normalize = 1;\n',
    });

    scenario(
      'recognizes every direct Fragment node qualification',
      'fragment-anatomy',
      {
        ...button,
        'src/_components/button/button.hook.ts': 'export const hook = 1;\n',
        'src/_components/button/button.module.css': '',
        'src/_components/button/button.spec.tsx': 'export {};\n',
        'src/_components/button/button.story.tsx': 'export {};\n',
        'src/_components/button/button.type.ts':
          'export type TValue = number;\n',
        'src/_components/button/README.md': '',
      },
      [],
      { ...local, foreignNodes: ['src/_components/button/README.md'] }
    );

    for (const [name, tree, expected] of [
      [
        'missing Master',
        { 'src/_components/button/index.ts': 'export {};\n' },
        [
          missingMasterViolation(
            'src/_components/button',
            'src/_components/button/index.ts'
          ),
        ],
      ],
      [
        'duplicate Master Role',
        {
          ...button,
          'src/_components/button/button.component.ts':
            'export const another = 2;\n',
        },
        [duplicateRoleViolation('src/_components/button/button.component.ts')],
      ],
      [
        'Sub-Graph is not a Master',
        {
          'src/_components/button/button.spec.tsx': '',
          'src/_components/button/index.ts': 'export {};\n',
        },
        [
          missingMasterViolation(
            'src/_components/button',
            'src/_components/button/button.spec.tsx'
          ),
        ],
      ],
      [
        'Access Node is not a Master',
        { 'src/_components/button/index.ts': 'export {};\n' },
        [
          missingMasterViolation(
            'src/_components/button',
            'src/_components/button/index.ts'
          ),
        ],
      ],
      [
        'descendant Master is not direct',
        {
          'src/_components/button/_components/icon/icon.component.ts':
            'export const icon = 1;\n',
          'src/_components/button/_components/icon/index.ts':
            "export { icon } from './icon.component.js';\n",
          'src/_components/button/index.ts': 'export {};\n',
        },
        [
          missingMasterViolation(
            'src/_components/button',
            'src/_components/button/index.ts'
          ),
        ],
      ],
      [
        'missing Access Node',
        {
          'src/_components/button/button.component.tsx':
            'export const button = 1;\n',
        },
        [missingAccessViolation('src/_components/button/button.component.tsx')],
      ],
      [
        'duplicate internal Role',
        {
          ...button,
          'src/_components/button/button.hook.ts': '',
          'src/_components/button/button.hook.tsx': '',
        },
        [duplicateRoleViolation('src/_components/button/button.component.tsx')],
      ],
      [
        'duplicate Sub-Graph Role',
        {
          ...button,
          'src/_components/button/button.spec.ts': '',
          'src/_components/button/button.spec.tsx': '',
        },
        [duplicateRoleViolation('src/_components/button/button.component.tsx')],
      ],
      [
        'equal Rank is forbidden',
        {
          ...button,
          'src/_components/button/button.context.ts':
            'export const context = 1;\n',
        },
        [fragmentRankViolation('src/_components/button/button.context.ts')],
      ],
    ] as const) {
      scenario(`rejects ${name}`, 'fragment-anatomy', tree, expected);
    }

    for (const file of [
      'index.tsx',
      'utility.ts',
      'other.component.tsx',
      'other.spec.tsx',
      'button.component.spec.tsx',
    ]) {
      scenario(
        `rejects unauthorized Fragment file ${file}`,
        'fragment-anatomy',
        {
          ...button,
          [`src/_components/button/${file}`]: 'export {};\n',
        },
        [fragmentAnatomyViolation(`src/_components/button/${file}`)]
      );
    }

    scenario(
      'a Foreign index is not a logical Access Node',
      'fragment-anatomy',
      { ...button, 'src/_components/button/index.ts': '' },
      [missingAccessViolation('src/_components/button/button.component.tsx')],
      { ...local, foreignNodes: ['src/_components/button/index.ts'] }
    );

    scenario(
      'allows the same internal Role in separate Fragments',
      'fragment-anatomy',
      {
        ...button,
        'src/_components/button/button.type.ts':
          'export type TValue = number;\n',
        'src/_components/icon/icon.component.ts': 'export const icon = 1;\n',
        'src/_components/icon/icon.type.ts': 'export type TValue = number;\n',
        'src/_components/icon/index.ts':
          "export { icon } from './icon.component.js';\n",
      }
    );
    scenario(
      'rejects two type nodes in one Fragment',
      'fragment-anatomy',
      {
        ...button,
        'src/_components/button/button.type.ts':
          'export type TValue = number;\n',
        'src/_components/button/button.type.tsx':
          'export type TOther = number;\n',
      },
      [duplicateRoleViolation('src/_components/button/button.component.tsx')]
    );

    for (const [role, accepted] of [
      ['type', true],
      ['styled', true],
      ['class', false],
      ['factory', false],
    ] as const) {
      const path = `src/_utils/normalize/normalize.${role}.ts`;
      scenario(
        `requires strict internal Rank for ${role}`,
        'fragment-anatomy',
        {
          [path]: 'export const value = 1;\n',
          'src/_utils/normalize/index.ts':
            "export { normalize } from './normalize.util.js';\n",
          'src/_utils/normalize/normalize.util.ts':
            'export const normalize = 1;\n',
        },
        accepted ? [] : [fragmentRankViolation(path)]
      );
    }

    scenario(
      'exporting the hook does not select a different Master',
      'access-node-contract',
      {
        ...button,
        'src/_components/button/button.hook.ts': 'export const hook = 1;\n',
        'src/_components/button/index.ts':
          "export { hook } from './button.hook.js';\n",
      },
      [masterNotExportedViolation('src/_components/button/index.ts')]
    );

    scenario(
      'keeps complete anatomy across three Parent Fragment boundaries',
      'fragment-anatomy',
      {
        ...button,
        'src/_components/button/_components/icon/_utils/normalize/index.ts':
          "export { normalize } from './normalize.util.js';\n",
        'src/_components/button/_components/icon/_utils/normalize/normalize.util.ts':
          'export const normalize = 1;\n',
        'src/_components/button/_components/icon/icon.component.ts':
          'export const icon = 1;\n',
        'src/_components/button/_components/icon/index.ts':
          "export { icon } from './icon.component.js';\n",
      }
    );
  });

  describe('Category Role and forms', () => {
    scenario('imposes the Category Role only on the Master', 'category-role', {
      ...button,
      'src/_components/button/button.hook.ts': 'export const hook = 1;\n',
      'src/_components/button/button.type.ts': 'export type TValue = number;\n',
    });

    scenario(
      'requires the imposed type Master in the Fragments form',
      'fragment-anatomy',
      {
        'src/_types/user/index.ts': 'export {};\n',
        'src/_types/user/user.schema.ts': 'export const user = 1;\n',
      },
      [missingMasterViolation('src/_types/user', 'src/_types/user/index.ts')],
      {
        ...local,
        roles: [
          { category: '_schemas', name: 'schema' },
          { category: '_types', name: 'type' },
        ],
      }
    );

    for (const [file, nodes] of [
      ['user.type.ts', false],
      ['user.schema.ts', true],
      ['user.ts', true],
      ['index.ts', true],
    ] as const) {
      scenario(
        `rejects nonhomogeneous ${file} in ${nodes ? 'Nodes' : 'Fragments'} form`,
        'category-role',
        {
          [`src/_types/${file}`]: 'export {};\n',
        },
        [categoryRoleViolation(`src/_types/${file}`)],
        {
          ...local,
          roles: [
            { category: '_schemas', name: 'schema' },
            { category: '_types', isCategoryNode: nodes, name: 'type' },
          ],
        }
      );
    }

    scenario(
      'does not encapsulate a Category Node as a Fragment',
      'classification-completeness',
      {
        'src/_types/user/index.ts':
          "export type { TUser } from './user.type.js';\n",
        'src/_types/user/user.type.ts': 'export type TUser = number;\n',
      },
      [
        unclassifiableDomain('src/_types/user', 'src/_types/user/index.ts'),
        unclassifiable('src/_types/user/index.ts'),
        unclassifiable('src/_types/user/user.type.ts'),
      ]
    );

    scenario(
      'does not mix direct Fragments and Category Nodes',
      'category-role',
      {
        ...button,
        'src/_components/other.component.ts': 'export const other = 1;\n',
      },
      [categoryRoleViolation('src/_components/other.component.ts')]
    );

    scenario(
      'the Role form cannot be overridden for one occurrence',
      'classification-completeness',
      {
        'src/_src@shared/_types/other/index.ts':
          "export type { TOther } from './other.type.js';\n",
        'src/_src@shared/_types/other/other.type.ts':
          'export type TOther = number;\n',
        'src/_types/user.type.ts': 'export type TUser = number;\n',
      },
      [
        unclassifiableDomain(
          'src/_src@shared/_types/other',
          'src/_src@shared/_types/other/index.ts'
        ),
        unclassifiable('src/_src@shared/_types/other/index.ts'),
        unclassifiable('src/_src@shared/_types/other/other.type.ts'),
      ]
    );

    for (const role of ['spec', 'story']) {
      scenario(
        `does not give a Category Node a dedicated ${role} node`,
        'category-role',
        {
          [`src/_types/user.${role}.ts`]: 'export {};\n',
          'src/_types/user.type.ts': 'export type TUser = number;\n',
        },
        [categoryRoleViolation(`src/_types/user.${role}.ts`)]
      );
    }

    scenario(
      'allows different Role forms in different Trees',
      'category-role',
      {
        'lib/_utils/normalize.util.ts': 'export const normalize = 1;\n',
        'src/_utils/normalize/index.ts':
          "export { normalize } from './normalize.util.js';\n",
        'src/_utils/normalize/normalize.util.ts':
          'export const normalize = 1;\n',
      },
      [],
      local,
      [
        {
          ...local,
          roles: [{ category: '_utils', isCategoryNode: true, name: 'util' }],
          rootLayers: ['lib'],
        },
      ]
    );

    scenario(
      'allows explicit and implicit Category Nodes together',
      'category-role',
      {
        'src/_styles/reset.style.css': '',
        'src/_styles/theme.css': '',
      }
    );
    scenario(
      'propagates Role and Nodes form through nested Sub-Categories',
      'category-role',
      {
        'src/_schemas/_dtos/_requests/user.schema.ts':
          'export const user = 1;\n',
      }
    );

    for (const [container, unit, tree, anchor] of [
      [
        'src/_components',
        'Fragment',
        {
          'src/_components/_nested': {},
          'src/_components/item/index.ts':
            "export { item } from './item.component.js';\n",
          'src/_components/item/item.component.ts': 'export const item = 1;\n',
        },
        'fafconfig.ts',
      ],
      [
        'src/_types',
        'Category Node',
        {
          'src/_types/_nested': {},
          'src/_types/item.type.ts': 'export type TItem = number;\n',
        },
        'src/_types/item.type.ts',
      ],
      [
        'src/_components/button/_utils',
        'Fragment',
        {
          ...button,
          'src/_components/button/_utils/_nested': {},
          'src/_components/button/_utils/item/index.ts':
            "export { item } from './item.util.js';\n",
          'src/_components/button/_utils/item/item.util.ts':
            'export const item = 1;\n',
        },
        'src/_components/button/button.component.tsx',
      ],
      [
        'src/_components/_atoms',
        'Fragment',
        {
          'src/_components/_atoms/_nested': {},
          'src/_components/_atoms/item/index.ts':
            "export { item } from './item.component.js';\n",
          'src/_components/_atoms/item/item.component.ts':
            'export const item = 1;\n',
        },
        'fafconfig.ts',
      ],
      [
        'src/_types/_primitives',
        'Category Node',
        {
          'src/_types/_primitives/_nested': {},
          'src/_types/_primitives/item.type.ts':
            'export type TItem = number;\n',
        },
        'src/_types/_primitives/item.type.ts',
      ],
    ] as const) {
      scenario(
        `rejects branching with direct ${unit} in ${container}`,
        'exclusive-forms',
        tree,
        [exclusiveFormsViolation(container, anchor)]
      );
    }

    for (const container of ['src/_types', 'src/_types/_primitives']) {
      scenario(
        `does not create a collective barrel in ${container}`,
        'category-role',
        {
          [`${container}/index.ts`]:
            "export type { TUser } from './user.type.js';\nexport type { TOther } from './other.type.js';\n",
          [`${container}/other.type.ts`]: 'export type TOther = number;\n',
          [`${container}/user.type.ts`]: 'export type TUser = number;\n',
        },
        [categoryRoleViolation(`${container}/index.ts`)]
      );
    }
    scenario('a Category Branch resets the imposed Role', 'category-role', {
      'src/_styles/_styles@shared/_fonts/inter.woff2': '',
      'src/_styles/theme.css': '',
    });
  });

  describe('Layer forms', () => {
    scenario('a Layer accepts heterogeneous Categories', 'category-role', {
      'src/_domain/_models/value.model.ts': 'export const value = 1;\n',
      'src/_domain/_schemas/value.schema.ts': 'export const value = 1;\n',
      'src/_domain/_types/value.type.ts': 'export type TValue = number;\n',
    });
    scenario(
      'Sub-Layers retain the ordinary Layer contract',
      'exclusive-forms',
      {
        'src/_domain/_one/_types/value.type.ts':
          'export type TValue = number;\n',
        'src/_domain/_two/_schemas/value.schema.ts':
          'export const value = 1;\n',
      }
    );
    scenario(
      'rejects direct Categories together with Sub-Layers',
      'exclusive-forms',
      {
        'src/_domain/_types/value.type.ts': 'export type TValue = number;\n',
        'src/_domain/_ui': {},
      },
      [exclusiveFormsViolation('src/_domain', 'fafconfig.ts')]
    );
    scenario(
      'an accessory Branch does not change the Layer form',
      'exclusive-forms',
      {
        'src/_domain/_domain@shared/_utils': {},
        'src/_domain/_types/value.type.ts': 'export type TValue = number;\n',
      }
    );
    scenario(
      'preserves explicit origin designations even without Root Nodes',
      'containment-matrix',
      {
        'app/_types/value.type.ts': 'export type TValue = number;\n',
        'src/_types/value.type.ts': 'export type TValue = number;\n',
      },
      [],
      { ...local, rootFragments: [{ path: 'app', rootNodes: [] }] }
    );
    scenario(
      'a direct module does not convert a Root Layer to a Root Fragment',
      'containment-matrix',
      {
        'src/main.ts': 'export const main = 1;\n',
      },
      [containmentViolation('src/main.ts')]
    );

    for (const [name, tree, valid] of [
      ['Categories', { 'src/_types': {}, 'src/_utils': {} }, true],
      ['Layers', { 'src/_domain': {}, 'src/_ui': {} }, true],
      ['Categories and Layers', { 'src/_types': {}, 'src/_ui': {} }, false],
      [
        'Categories with Branch and Foreign Node',
        { 'src/_src@shared': {}, 'src/_types': {}, 'src/README.md': '' },
        true,
      ],
      [
        'Layers with Branch and Foreign Domain',
        { 'src/_foreign': {}, 'src/_src@shared': {}, 'src/_ui': {} },
        true,
      ],
    ] as const) {
      scenario(
        `Root Layer form: ${name}`,
        'exclusive-forms',
        tree,
        valid ? [] : [exclusiveFormsViolation('src', 'fafconfig.ts')],
        {
          ...local,
          foreignDomains: name.includes('Foreign Domain')
            ? ['src/_foreign']
            : [],
          foreignNodes: name.includes('Foreign Node') ? ['src/README.md'] : [],
        }
      );
    }
    for (const file of ['index.ts', 'value.type.ts']) {
      scenario(
        `Root Layer rejects direct ${file}`,
        'containment-matrix',
        { [`src/${file}`]: 'export {};\n' },
        [containmentViolation(`src/${file}`)]
      );
    }
  });

  describe('direct containment', () => {
    for (const [name, path, contents, declarations] of [
      [
        'Root Fragment',
        'src',
        {
          '_src@shared': {},
          _utils: {},
          app: {},
          'main.ts': 'export const main = 1;\n',
        },
        {
          ...local,
          rootFragments: [
            {
              path: 'src',
              rootNodes: [['main.ts']],
              subRootFragments: [{ path: 'src/app', rootNodes: [] }],
            },
          ],
          rootLayers: [],
        },
      ],
      [
        'Fragment',
        'src/_components/host',
        {
          '_host@shared': {},
          _utils: {},
          'host.component.ts': 'export const host = 1;\n',
          'host.spec.ts': '',
          'host.type.ts': 'export type TValue = number;\n',
          'index.ts': "export { host } from './host.component.js';\n",
        },
        local,
      ],
      [
        'branched Category',
        'src/_components',
        { _atoms: {}, '_components@shared': {} },
        local,
      ],
      [
        'branched Sub-Category',
        'src/_components/_atoms',
        { '_atoms@shared': {}, _controls: {} },
        local,
      ],
      [
        'Category with Fragments',
        'src/_components',
        {
          '_components@shared': {},
          host: {
            'host.component.ts': 'export const host = 1;\n',
            'index.ts': "export { host } from './host.component.js';\n",
          },
        },
        local,
      ],
      [
        'Sub-Category with Fragments',
        'src/_components/_atoms',
        {
          '_atoms@shared': {},
          host: {
            'host.component.ts': 'export const host = 1;\n',
            'index.ts': "export { host } from './host.component.js';\n",
          },
        },
        local,
      ],
      [
        'Category with Nodes',
        'src/_types',
        {
          '_types@shared': {},
          'value.type.ts': 'export type TValue = number;\n',
        },
        local,
      ],
      [
        'Sub-Category with Nodes',
        'src/_types/_primitives',
        {
          '_primitives@shared': {},
          'value.type.ts': 'export type TValue = number;\n',
        },
        local,
      ],
      [
        'mimetic Parent Category',
        'src/_pages',
        {
          _blog: {},
          '_pages@shared': {},
          home: {
            'home.page.ts': 'export const home = 1;\n',
            'index.ts': "export { home } from './home.page.js';\n",
          },
        },
        { ...local, mimeticPathStructures: [{ paths: ['src/_pages'] }] },
      ],
      [
        'Path Sub-Category',
        'src/_pages/_blog',
        {
          '_blog@shared': {},
          _posts: {},
          home: {
            'home.page.ts': 'export const home = 1;\n',
            'index.ts': "export { home } from './home.page.js';\n",
          },
        },
        { ...local, mimeticPathStructures: [{ paths: ['src/_pages'] }] },
      ],
      [
        'branched Layer',
        'src/_domain',
        { '_domain@shared': {}, _one: {} },
        local,
      ],
      [
        'Layer with Categories',
        'src/_domain',
        { '_domain@shared': {}, _types: {} },
        local,
      ],
      [
        'Root Layer with Layers',
        'src',
        { _domain: {}, '_src@shared': {} },
        local,
      ],
      [
        'Root Layer with Categories',
        'src',
        { '_src@shared': {}, _types: {} },
        local,
      ],
      ['Branch with Layers', 'src/_src@shared', { _domain: {} }, local],
      ['Branch with Categories', 'src/_src@shared', { _types: {} }, local],
      [
        'Foreign Domain',
        'src/_foreign',
        { _nested: { 'file.ts': '' }, 'arbitrary.ts': '' },
        { ...local, foreignDomains: ['src/_foreign'] },
      ],
    ] as const) {
      scenario(
        `matrix row admits contextual children: ${name}`,
        'containment-matrix',
        {
          [path]: { ...contents, _foreign: {}, 'README.md': '' },
        },
        [],
        {
          ...declarations,
          foreignDomains: [
            `${path}/_foreign`,
            ...(name === 'Foreign Domain' ? [path] : []),
          ],
          foreignNodes: [`${path}/README.md`],
        }
      );
    }

    for (const [name, tree, path, anchor] of [
      [
        'a direct Fragment under a Root Layer despite its component suffix',
        { 'src/button/button.component.tsx': 'export const button = 1;\n' },
        'src/button',
        'src/button/button.component.tsx',
      ],
      [
        'a direct Fragment under another Fragment',
        { ...button, 'src/_components/button/icon': {} },
        'src/_components/button/icon',
        'src/_components/button/button.component.tsx',
      ],
      [
        'a direct Fragment under a Layer',
        { 'src/_ui/button': {} },
        'src/_ui/button',
        'fafconfig.ts',
      ],
      [
        'a Layer under a Fragment',
        { ...button, 'src/_components/button/_domain': {} },
        'src/_components/button/_domain',
        'src/_components/button/button.component.tsx',
      ],
      [
        'a Layer under a Root Fragment',
        { 'src/_domain': {} },
        'src/_domain',
        'fafconfig.ts',
      ],
    ] as const) {
      const expected = [unclassifiableDomain(path, anchor)];
      if (name.includes('suffix')) {
        expected.push(unclassifiable(anchor));
      }
      scenario(
        `rejects ${name}`,
        'classification-completeness',
        tree,
        expected,
        name === 'a Layer under a Root Fragment'
          ? {
              ...local,
              rootFragments: [{ path: 'src', rootNodes: [] }],
              rootLayers: [],
            }
          : local
      );
    }
    scenario(
      'allows a Sub-Fragment mediated by a Private Category',
      'containment-matrix',
      {
        ...button,
        'src/_components/button/_components/icon/icon.component.ts':
          'export const icon = 1;\n',
        'src/_components/button/_components/icon/index.ts':
          "export { icon } from './icon.component.js';\n",
      }
    );
    scenario(
      'a nested Root Layer cannot become a Sub-Layer',
      'prepare-project',
      { 'src/internal': {} },
      [
        diagnostic(
          'configuration/overlapping-origins',
          'src/internal',
          'fafconfig.ts',
          "'src/internal' overlaps with another declared tree origin: Origin 'src/internal' is contained within origin 'src' (D-06).",
          'configuration'
        ),
      ],
      { ...local, rootLayers: ['src', 'src/internal'] }
    );
    scenario(
      'a Root Fragment cannot be a direct child of a Root Layer',
      'prepare-project',
      { 'src/app': {} },
      [
        diagnostic(
          'configuration/overlapping-origins',
          'src/app',
          'fafconfig.ts',
          "'src/app' overlaps with another declared tree origin: Origin 'src/app' is contained within origin 'src' (D-06).",
          'configuration'
        ),
      ],
      { ...local, rootFragments: [{ path: 'src/app', rootNodes: [] }] }
    );
    scenario(
      'allows a Branch nested through an intermediate Category',
      'containment-matrix',
      {
        'src/_src@shared/_utils/_utils@shared/_types': {},
      }
    );
    scenario(
      'forbids a direct Branch child of another Branch',
      'containment-matrix',
      {
        'src/_src@shared/_src@shared@shared': {},
      },
      [
        containmentViolation(
          'src/_src@shared/_src@shared@shared',
          'fafconfig.ts'
        ),
      ]
    );
  });

  describe('Branch nomenclature and placements', () => {
    for (const [path, branch, base, declarations] of [
      ['src', '_src@shared', {}, local],
      ['src/_components/button', '_button@shared', button, local],
      ['src/_hooks', '_hooks@shared', {}, local],
      ['src/_domain', '_domain@shared', {}, local],
      [
        'src/_apis/_todos/_[todo-id]',
        '_[todo-id]@shared',
        {},
        {
          ...local,
          mimeticPathStructures: [{ actions: ['get'], paths: ['src/_apis'] }],
        },
      ],
    ] as const) {
      scenario(
        `requires the exact Branch scope ${branch}`,
        'nomenclature',
        {
          ...base,
          [`${path}/${branch}`]: {},
        },
        [],
        declarations
      );
    }
    for (const name of [
      '_shared',
      '_other@shared',
      'button@shared',
      '_button-shared',
      '__button@shared',
    ]) {
      scenario(
        `rejects the Branch name variant ${name}`,
        'classification-completeness',
        {
          ...button,
          [`src/_components/button/${name}`]: {},
        },
        [
          unclassifiableDomain(
            `src/_components/button/${name}`,
            'src/_components/button/button.component.tsx'
          ),
        ]
      );
    }
    scenario(
      'does not admit a second Branch with an artificial scope',
      'classification-completeness',
      {
        ...button,
        'src/_components/button/_button@shared': {},
        'src/_components/button/_other@shared': {},
      },
      [
        unclassifiableDomain(
          'src/_components/button/_other@shared',
          'src/_components/button/button.component.tsx'
        ),
      ]
    );

    for (const [name, path, base, declarations] of [
      [
        'Root Fragment',
        'src/_src@shared',
        {},
        {
          ...local,
          rootFragments: [{ path: 'src', rootNodes: [] }],
          rootLayers: [],
        },
      ],
      ['Root Layer', 'src/_src@shared', {}, local],
      ['Fragment', 'src/_components/button/_button@shared', button, local],
      ['Category', 'src/_utils/_utils@shared', {}, local],
      [
        'Private Category',
        'src/_components/button/_utils/_utils@shared',
        button,
        local,
      ],
      ['Sub-Category', 'src/_utils/_primitives/_primitives@shared', {}, local],
      [
        'Path Sub-Category',
        'src/_apis/_todos/_todos@shared',
        {},
        {
          ...local,
          mimeticPathStructures: [{ actions: ['get'], paths: ['src/_apis'] }],
        },
      ],
      ['Layer', 'src/_domain/_domain@shared', {}, local],
    ] as const) {
      scenario(
        `permits a Branch owned by a ${name}`,
        'containment-matrix',
        {
          ...base,
          [`${path}/_types/value.type.ts`]: 'export type TValue = number;\n',
        },
        [],
        declarations
      );
    }
  });

  describe('assigned edge scenarios', () => {
    scenario(
      'direct Root Layer Categories allow descending edges',
      'peer-separation',
      {
        ...button,
        'src/_components/button/button.component.tsx':
          "import { hook } from '../../_hooks/use-value/index.js';\nimport type { TValue } from '../../_types/value.type.js';\nexport const button: TValue = hook;\n",
        'src/_hooks/use-value/index.ts':
          "export { hook } from './use-value.hook.js';\n",
        'src/_hooks/use-value/use-value.hook.ts': 'export const hook = 1;\n',
        'src/_types/value.type.ts': 'export type TValue = number;\n',
      },
      [],
      {
        ...local,
        horizontalHierarchies: [[['_types'], ['_hooks'], ['_components']]],
      }
    );
    scenario(
      'direct Root Layer Categories forbid ascending edges',
      'peer-separation',
      {
        ...button,
        'src/_hooks/use-value/index.ts':
          "export { hook } from './use-value.hook.js';\n",
        'src/_hooks/use-value/use-value.hook.ts':
          "import { button } from '../../_components/button/index.js';\nexport const hook = button;\n",
      },
      [
        peerSeparationViolation(
          'src/_hooks/use-value/use-value.hook.ts',
          'src/_components/button/index.ts',
          '../../_components/button/index.js'
        ),
      ],
      { ...local, horizontalHierarchies: [[['_hooks'], ['_components']]] }
    );
    for (const [source, target, accepted] of [
      ['_ui', '_domain', true],
      ['_domain', '_ui', false],
    ] as const) {
      const path = `src/${source}/_types/value.type.ts`;
      const targetPath = `src/${target}/_types/value.type.ts`;
      const specifier = `../../${target}/_types/value.type.js`;
      scenario(
        `Root Layer Layers require ${source} to ${target} direction`,
        'peer-separation',
        {
          [path]: `import type { TValue } from '${specifier}';\nexport type TSource = TValue;\n`,
          [targetPath]: 'export type TValue = number;\n',
        },
        accepted ? [] : [peerSeparationViolation(path, targetPath, specifier)],
        { ...local, horizontalHierarchies: [[['_domain'], ['_ui']]] }
      );
    }
    scenario(
      'Root Layer partitions consume their accessible Branch details',
      'fractal-branch-visibility',
      {
        'src/_src@shared/_types/shared.type.ts':
          'export type TShared = number;\n',
        'src/_types/value.type.ts':
          "import type { TShared } from '../_src@shared/_types/shared.type.js';\nexport type TValue = TShared;\n",
      }
    );
    scenario(
      'a Root Layer Branch cannot return to its consumers',
      'fractal-branch-unidirectionality',
      {
        'src/_src@shared/_types/shared.type.ts':
          "import type { TValue } from '../../_types/value.type.js';\nexport type TShared = TValue;\n",
        'src/_types/value.type.ts': 'export type TValue = number;\n',
      },
      [
        branchUnidirectionalityViolation(
          'src/_src@shared/_types/shared.type.ts',
          'src/_types/value.type.ts',
          '../../_types/value.type.js'
        ),
        peerSeparationViolation(
          'src/_src@shared/_types/shared.type.ts',
          'src/_types/value.type.ts',
          '../../_types/value.type.js'
        ),
      ]
    );
    scenario(
      'Root Layer Branch details are not exposed outside the Tree',
      'tree-frontier',
      {
        'consumer.ts':
          "import type { TShared } from './src/_src@shared/_types/shared.type.js';\nexport type TValue = TShared;\n",
        'src/_src@shared/_types/shared.type.ts':
          'export type TShared = number;\n',
      },
      [
        treeOpacityViolation(
          'consumer.ts',
          'src/_src@shared/_types/shared.type.ts',
          './src/_src@shared/_types/shared.type.js'
        ),
      ]
    );
  });

  describe('Branch forms and empty domains', () => {
    for (const [name, tree, valid] of [
      [
        'Categories',
        { 'src/_src@shared/_types': {}, 'src/_src@shared/_utils': {} },
        true,
      ],
      [
        'Layers',
        { 'src/_src@shared/_domain': {}, 'src/_src@shared/_ui': {} },
        true,
      ],
      [
        'Categories and Layers',
        { 'src/_src@shared/_ui': {}, 'src/_src@shared/_utils': {} },
        false,
      ],
      [
        'Categories with Foreign contents',
        {
          'src/_src@shared/_foreign': {},
          'src/_src@shared/_utils': {},
          'src/_src@shared/README.md': '',
        },
        true,
      ],
      [
        'Layers with Foreign contents',
        {
          'src/_src@shared/_foreign': {},
          'src/_src@shared/_ui': {},
          'src/_src@shared/README.md': '',
        },
        true,
      ],
    ] as const) {
      scenario(
        `Branch form: ${name}`,
        'exclusive-forms',
        tree,
        valid
          ? []
          : [exclusiveFormsViolation('src/_src@shared', 'fafconfig.ts')],
        {
          ...local,
          foreignDomains: name.includes('Foreign')
            ? ['src/_src@shared/_foreign']
            : [],
          foreignNodes: name.includes('Foreign')
            ? ['src/_src@shared/README.md']
            : [],
          horizontalHierarchies: [[['_utils'], ['_types']]],
        }
      );
    }

    for (const path of [
      'src/_types',
      'src/_domain',
      'src',
      'src/_src@shared',
    ]) {
      scenario(
        `does not require descendants in empty ${path}`,
        'containment-matrix',
        { [path]: {} }
      );
    }
    scenario(
      'empty Fragments still need both mandatory nodes',
      'fragment-anatomy',
      { 'src/_components/button': {} },
      [
        missingAccessViolation('fafconfig.ts'),
        missingMasterViolation('src/_components/button', 'fafconfig.ts'),
      ]
    );
    scenario(
      'Foreign contents do not mix organizational or taxonomic forms',
      'exclusive-forms',
      {
        ...button,
        'src/_components/_foreign': {},
        'src/_components/README.md': '',
        'src/_foreign': {},
        'src/_src@shared/_domain/_foreign': {},
        'src/_src@shared/_domain/_types': {},
        'src/_src@shared/_domain/README.md': '',
        'src/_src@shared/_foreign': {},
        'src/_src@shared/README.md': '',
        'src/_types/_foreign': {},
        'src/_types/_primitives/value.type.ts':
          'export type TValue = number;\n',
        'src/_types/README.md': '',
        'src/README.md': '',
      },
      [],
      {
        ...local,
        foreignDomains: [
          'src/_foreign',
          'src/_components/_foreign',
          'src/_types/_foreign',
          'src/_src@shared/_domain/_foreign',
          'src/_src@shared/_foreign',
        ],
        foreignNodes: [{ paths: ['src'], patterns: ['*.md'] }],
        rootFragments: [{ path: 'src', rootNodes: [] }],
        rootLayers: [],
      }
    );
  });
});
