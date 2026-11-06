import type { FileTree } from 'fs-fixture';

import { ESLint } from 'eslint';
import { parser } from 'typescript-eslint';
import { beforeAll, describe, expect, it } from 'vitest';

import type { TScenarioMessage } from '../support/acceptance-project.js';

import plugin from '../../src/main.js';
import {
  createProject,
  expectScenario,
  lintScenario,
  warmupESLint,
} from '../support/acceptance-project.js';

const roles = [
  { category: '_types', isCategoryNode: true, name: 'type' },
  { category: '_styles', implicitRoleExtensions: ['.css'], name: 'style' },
  {
    category: '_archives',
    implicitRoleExtensions: ['.tar.gz'],
    name: 'archive',
  },
  { category: '_modules', name: 'module' },
  { category: '_hooks', name: 'hook' },
  { category: '_utils', name: 'util' },
  { category: '_components', name: 'component' },
  { category: '_apis', name: 'api' },
  { category: '_pages', name: 'page' },
];

const rootLayer = (properties: Readonly<Record<string, unknown>> = {}) => ({
  faf: {
    locals: [
      {
        roles,
        rootLayers: ['src'],
        subGraphRoles: [{ name: 'spec' }],
        ...properties,
      },
    ],
  },
});

const fragment = (path: string, role = 'util'): FileTree => {
  const name = path.split('/').at(-1) ?? '';
  return {
    [`${path}/${name}.${role}.ts`]: 'export const value = 1;\n',
    [`${path}/index.ts`]: `export { value } from './${name}.${role}.js';\n`,
  };
};

const createScenarioMessage = (
  filePath: string,
  element: string,
  constraint: string,
  messageText: string,
  reference: string,
  messageId: string
): TScenarioMessage => ({
  column: 1,
  constraint,
  element,
  filePath,
  line: 1,
  message: `${constraint}: ${messageText} (${reference}).`,
  messageId,
  ruleId: 'faf/conformity',
  severity: 2,
});

const elementMessage = (
  filePath: string,
  element: string,
  constraint: string,
  predicate: string,
  reference: string,
  family = 'classification',
  detail?: string
): TScenarioMessage => {
  const messageText =
    detail === undefined || detail === ''
      ? `'${element}' ${predicate}`
      : `'${element}' ${predicate}: ${detail.replace(/\.$/, '')}`;
  return createScenarioMessage(
    filePath,
    element,
    constraint,
    messageText,
    reference,
    family
  );
};

const edgeMessage = (
  source: string,
  destination: string,
  specifier: string,
  constraint: string,
  predicate: string,
  reference: string
): TScenarioMessage => {
  const messageText = `'${source}' imports '${destination}' through '${specifier}': ${predicate}`;
  return createScenarioMessage(
    source,
    source,
    constraint,
    messageText,
    reference,
    'dependency'
  );
};

const invalidNomenclature = (
  filePath: string,
  element: string
): TScenarioMessage =>
  elementMessage(
    filePath,
    element,
    'classification/nomenclature',
    'does not follow the naming contract of its classification',
    'FAF §4, §6.3.5, §6.6'
  );

const invalidHierarchyMembers = (
  filePath: string,
  parent: string
): TScenarioMessage =>
  elementMessage(
    filePath,
    parent,
    'classification/horizontal-hierarchy-members',
    'has a Horizontal Hierarchy over children that FAF does not allow to be ordered',
    'FAF §6.9'
  );

const hierarchyOverlap = (
  filePath: string,
  element: string
): TScenarioMessage =>
  elementMessage(
    filePath,
    element,
    'classification/horizontal-hierarchy-overlap',
    'is selected by more than one Horizontal Hierarchy',
    'FAF §4'
  );

const unclassifiableDirectory = (
  filePath: string,
  element: string
): TScenarioMessage =>
  elementMessage(
    filePath,
    element,
    'classification/unclassifiable-directory',
    'has no unique Logical Domain classification',
    'FAF §6.9'
  );

const unclassifiableFile = (
  filePath: string,
  element: string
): TScenarioMessage =>
  elementMessage(
    filePath,
    element,
    'classification/unclassifiable-file',
    'is neither a uniquely classified Logical Node nor a Foreign Node',
    'FAF §6.9'
  );

const categoryRoleViolation = (
  filePath: string,
  element: string
): TScenarioMessage =>
  elementMessage(
    filePath,
    element,
    'classification/category-role',
    'does not have the form or the Role imposed by its Category',
    'FAF §6.3.1'
  );

const containmentViolation = (
  filePath: string,
  element: string
): TScenarioMessage =>
  elementMessage(
    filePath,
    element,
    'classification/containment-matrix',
    'is a child type that its parent Logical Domain does not admit',
    'FAF §6.8'
  );

const exclusiveFormsViolation = (element: string): TScenarioMessage =>
  elementMessage(
    'fafconfig.ts',
    element,
    'classification/exclusive-forms',
    'mixes mutually exclusive forms among its direct children',
    'FAF §6.3.2, §6.4.1, §6.5.1, §6.6.1'
  );

const missingMasterNode = (
  filePath: string,
  element: string
): TScenarioMessage =>
  elementMessage(
    filePath,
    element,
    'classification/missing-master-node',
    'has no direct Fragment Node with the Role imposed by its Category',
    'FAF §6.1.1'
  );

const fragmentAnatomyViolation = (
  element: string,
  filePath = element
): TScenarioMessage =>
  elementMessage(
    filePath,
    element,
    'classification/fragment-node-anatomy',
    'is not a Fragment Node, Access Node or Sub-Graph Node named after its Fragment',
    'FAF §6.1.1'
  );

const incompatibleMimetic = (element: string): TScenarioMessage =>
  elementMessage(
    'fafconfig.ts',
    element,
    'configuration/incompatible-mimetic-designation',
    'must identify a Category of Fragments',
    'FAF §6.3.5',
    'configuration'
  );

const invalidImplicitExtension = (propertyPath: string): TScenarioMessage =>
  elementMessage(
    'fafconfig.ts',
    propertyPath,
    'configuration/invalid-implicit-extension',
    'must start with a dot and contain only lowercase letters',
    'FAF §6.3.1',
    'configuration'
  );

const implicitExtensionRolePrefix = (
  propertyPath: string,
  extension: string
): TScenarioMessage => {
  const firstSegment = extension.split('.', 2)[1] ?? '';
  return elementMessage(
    'fafconfig.ts',
    propertyPath,
    'configuration/implicit-extension-role-name-prefix',
    'cannot start with a segment matching a role name',
    'FAF §6.3.1',
    'configuration',
    `First segment "${firstSegment}" of implicit extension "${extension}" cannot match a role name`
  );
};

const nestedRootFragmentNotDirectChild = (element: string): TScenarioMessage =>
  elementMessage(
    'fafconfig.ts',
    element,
    'configuration/nested-root-fragment-not-direct-child',
    'must be a direct child directory of the root fragment',
    'FAF §6.2.2',
    'configuration'
  );

const publicRootNodeNotEnumerated = (element: string): TScenarioMessage =>
  elementMessage(
    'fafconfig.ts',
    element,
    'configuration/public-root-node-not-enumerated',
    'must be an enumerated root node of its tree in publicRootNodes',
    'FAF §7.1',
    'configuration'
  );

const peerSeparationViolation = (
  source: string,
  destination: string,
  specifier: string
): TScenarioMessage =>
  edgeMessage(
    source,
    destination,
    specifier,
    'dependency/peer-separation',
    'sibling subtrees may depend on each other only downward along a Horizontal Hierarchy',
    'FAF §5'
  );

const privateCategoryVisibilityViolation = (
  source: string,
  destination: string,
  specifier: string
): TScenarioMessage =>
  edgeMessage(
    source,
    destination,
    specifier,
    'dependency/private-category-visibility',
    'is inside a Private Category and not accessible from outside the parent',
    'FAF §6.3.3'
  );

const fragmentEncapsulationViolation = (
  source: string,
  destination: string,
  specifier: string
): TScenarioMessage =>
  edgeMessage(
    source,
    destination,
    specifier,
    'dependency/fragment-encapsulation',
    'a Fragment is importable from outside only through its index.ts',
    'FAF §6.1.1'
  );

const rootNodeDisciplineViolation = (
  source: string,
  destination: string,
  specifier: string
): TScenarioMessage =>
  edgeMessage(
    source,
    destination,
    specifier,
    'dependency/root-node-discipline',
    'a Root Node is importable only by Root Nodes authorized by rootNodes or dependencyEdges',
    'FAF §6.2.2'
  );

const foreignNodeIsolationViolation = (
  source: string,
  destination: string,
  specifier: string
): TScenarioMessage =>
  edgeMessage(
    source,
    destination,
    specifier,
    'dependency/foreign-node-isolation',
    'a Foreign Node has no import relation with codebase files',
    'FAF §4, §6.7'
  );

const treeOpacityViolation = (
  source: string,
  destination: string,
  specifier: string
): TScenarioMessage =>
  edgeMessage(
    source,
    destination,
    specifier,
    'dependency/tree-opacity',
    'only the Public Surface of a Fractal Tree is importable from outside the Tree',
    'FAF §7.1'
  );

const scenario = async (
  tree: FileTree,
  config: Readonly<Record<string, unknown>>,
  responsiblePart: string,
  expected: readonly TScenarioMessage[] = []
): Promise<void> => {
  const project = await createProject(tree, config);
  try {
    expectScenario(await lintScenario(project.path), responsiblePart, expected);
  } finally {
    await project.rm();
  }
};

const mimetic = (actions: null | readonly string[] = null) =>
  rootLayer({
    mimeticPathStructures: [
      { paths: ['src/_apis'], ...(actions !== null && { actions }) },
    ],
  });

const linkedFragments = (
  source: string,
  target: string,
  specifier: string
): FileTree => ({
  ...fragment(source),
  ...fragment(target),
  [`${source}/${source.split('/').at(-1) ?? ''}.util.ts`]: `import { value } from '${specifier}';\nexport const linked = value;\n`,
});

const publicTree: FileTree = {
  ...fragment('src/_utils/widget'),
  ...fragment('src/_utils/widget/_utils/detail'),
  ...fragment('src/_src@shared/_utils/shared'),
  'src/_types/direct.type.ts': 'export type TDirect = string;\n',
  'src/_utils/widget/widget.spec.ts': 'export const testValue = 1;\n',
  'src/Design.Notes.MD': 'notes',
};

const surfaceLayerTree = (target: string): FileTree => {
  if (target.endsWith('.type.ts')) {
    return { [target]: 'export type TValue = string;\n' };
  }
  return fragment(
    target.slice(0, -'/index.ts'.length),
    target.includes('/_apis/') ? 'api' : 'util'
  );
};

const surfaceConfig = (target: string) => {
  if (target.includes('/_apis/')) {
    return rootLayer({
      mimeticPathStructures: [{ paths: ['src/_domain/_nested/_apis'] }],
    });
  }
  if (target === 'src/Design.Notes.MD' || !target.startsWith('src/_domain/')) {
    return rootLayer({ foreignNodes: ['src/Design.Notes.MD'] });
  }
  return rootLayer();
};

const surfaceProbe = async (
  tree: FileTree,
  config: Readonly<Record<string, unknown>>,
  target: string,
  isExposed: boolean
) => {
  await scenario(
    { ...tree, 'consumer.ts': `import './${target}';\n` },
    config,
    'tree-frontier',
    isExposed
      ? []
      : [treeOpacityViolation('consumer.ts', target, `./${target}`)]
  );
};

const WARMUP_TIMEOUT_MS = 120_000;

beforeAll(warmupESLint, WARMUP_TIMEOUT_MS);

describe('acceptance: contextual nomenclature and qualifications', () => {
  it.each([
    ['Category', 'src/_components', true],
    ['Category without underscore', 'src/components', false],
    ['Sub-Category', 'src/_utils/_atoms', true],
    ['Sub-Category without underscore', 'src/atoms', false],
    ['Layer', 'src/_domain', true],
    ['Layer without underscore', 'src/domain', false],
  ])(
    'verifies ordinary naming through classification: %s',
    async (_kind, path, valid) => {
      await scenario(
        { [path]: {} },
        rootLayer(),
        valid ? 'nomenclature' : 'classification-completeness',
        valid ? [] : [unclassifiableDirectory('fafconfig.ts', path)]
      );
    }
  );

  it('does not reinterpret an underscored Fragment as a functional domain', async () => {
    const path = 'src/_utils/_user-profile';
    await scenario(fragment(path), rootLayer(), 'category-role', [
      categoryRoleViolation(
        `${path}/_user-profile.util.ts`,
        `${path}/_user-profile.util.ts`
      ),
    ]);
  });

  it.each([
    ['user-profile', true],
    ['UserProfile', false],
    ['user_profile', false],
  ])('checks ordinary Fragment name %s', async (name, valid) => {
    const path = `src/_utils/${name}`;
    await scenario(
      fragment(path),
      rootLayer(),
      'nomenclature',
      valid
        ? []
        : [
            invalidNomenclature(`${path}/${name}.util.ts`, path),
            invalidNomenclature(
              `${path}/${name}.util.ts`,
              `${path}/${name}.util.ts`
            ),
          ]
    );
  });

  it.each(['lib', 'SharedLibrary', '_lib'])(
    'allows origin name %s',
    async (name) => {
      await scenario(
        fragment(`${name}/_utils/widget`),
        rootLayer({ rootLayers: [name] }),
        'nomenclature'
      );
    }
  );

  it.each(['_tooling', 'tooling'])(
    'allows designated Foreign Domain %s',
    async (name) => {
      await scenario(
        {
          ...fragment('src/_utils/widget'),
          [`src/${name}/arbitrary.ts`]: 'export const x = 1;\n',
        },
        rootLayer({ foreignDomains: [`src/${name}`] }),
        'nomenclature'
      );
    }
  );

  it.each([
    ['user-profile', true],
    ['userProfile', false],
  ])('checks Category Node basename %s', async (basename, valid) => {
    const path = `src/_types/${basename}.type.ts`;
    await scenario(
      { [path]: 'export type TProfile = string;\n' },
      rootLayer(),
      'nomenclature',
      valid ? [] : [invalidNomenclature(path, path)]
    );
  });

  it('accepts singular Categories and Sub-Categories without pluralization', async () => {
    await scenario(
      {
        'src/_component/_atom/button.component.tsx':
          'export const button = 1;\n',
        'src/_component/_atom/index.ts':
          "export { button } from './button.component.js';\n",
      },
      rootLayer({ roles: [{ category: '_component', name: 'component' }] }),
      'nomenclature'
    );
  });

  it.each([
    ['button.component.tsx', 'component', true],
    ['button.module.css', 'module', true],
    ['user-profile.type.ts', 'type', true],
    ['bundle.archive.tar.gz', 'archive', true],
    ['bundle.tar.gz', 'archive', true],
    ['index.ts', 'type', false],
    ['button.component.hook.tsx', 'type', false],
    ['example.util.spec.ts', 'type', false],
    ['user.profile.type.ts', 'type', false],
    ['button.unknown.ts', 'type', false],
    ['globals.d.ts', 'type', false],
  ])('determines Role from filename form: %s', async (name, role, conforms) => {
    if (conforms) {
      const directory =
        roles.find((entry) => entry.name === role)?.category ?? '';
      const tree: FileTree = ['archive', 'type'].includes(role)
        ? {
            [`src/${directory}/${name}`]: name.endsWith('.ts')
              ? 'export type TValue = string;\n'
              : '',
          }
        : {
            ...(role === 'module' &&
              fragment('src/_components/button', 'component')),
            [`src/_components/button/${name}`]: name.endsWith('.tsx')
              ? 'export const value = 1;\n'
              : '',
            'src/_components/button/index.ts':
              "export { value } from './button.component.js';\n",
          };
      await scenario(tree, rootLayer(), 'category-role');
    } else {
      const path = `src/_types/${name}`;
      await scenario(
        { [path]: 'export type TValue = string;\n' },
        rootLayer(),
        'category-role',
        [categoryRoleViolation(path, path)]
      );
    }
  });

  it('keeps explicit module.css disjoint from implicit css attribution', async () => {
    await scenario(
      {
        ...fragment('src/_components/button', 'component'),
        'src/_components/button/button.module.css': 'body {}\n',
      },
      rootLayer(),
      'category-role'
    );
  });

  it.each([
    ['.css', 'style', true],
    ['.tar.gz', 'archive', true],
    ['.module.css', 'style', false],
    ['.style.css', 'style', false],
  ])(
    'validates implicit extension %s for %s',
    async (extension, role, valid) => {
      await scenario(
        { src: {} },
        rootLayer({
          roles: [
            { category: '_modules', name: 'module' },
            {
              category: '_styles',
              implicitRoleExtensions: [role === 'style' ? extension : '.css'],
              name: 'style',
            },
            {
              category: '_archives',
              implicitRoleExtensions: [
                role === 'archive' ? extension : '.tar.gz',
              ],
              name: 'archive',
            },
          ],
        }),
        'validate-config-format',
        valid
          ? []
          : [
              implicitExtensionRolePrefix(
                'faf.locals[0].roles[1].implicitRoleExtensions[0]',
                extension
              ),
            ]
      );
    }
  );

  it.each([
    ['Category', 'src/_styles/theme.css', true],
    ['Sub-Category', 'src/_styles/_themes/theme.css', true],
    ['wrong Category', 'src/_fonts/theme.css', false],
    ['Fragment', 'src/_utils/widget/theme.css', false],
    ['Root Fragment', 'src/main.css', true],
  ])(
    'limits implicit Roles to Asset Category Nodes in %s',
    async (kind, path, valid) => {
      if (kind === 'Root Fragment') {
        await scenario(
          { [path]: 'body {}\n' },
          {
            faf: {
              locals: [
                {
                  roles,
                  rootFragments: [
                    { path: 'src', rootNodes: [[path.slice(4)]] },
                  ],
                },
              ],
            },
          },
          'nomenclature'
        );
        return;
      }
      const expectedViolations = (): readonly TScenarioMessage[] => {
        if (valid) {
          return [];
        }
        if (kind === 'Fragment') {
          return [
            categoryRoleViolation(path, path),
            fragmentAnatomyViolation(path, 'src/_utils/widget/widget.util.ts'),
          ];
        }
        return [categoryRoleViolation(path, path)];
      };
      await scenario(
        { ...fragment('src/_utils/widget'), [path]: 'body {}\n' },
        rootLayer({
          roles: [
            ...roles,
            { category: '_fonts', isCategoryNode: true, name: 'font' },
          ],
        }),
        'category-role',
        expectedViolations()
      );
    }
  );

  it.each([
    ['theme.css', true],
    ['dark-theme.css', true],
    ['theme.dark.css', false],
  ])('checks the complete implicit Asset name %s', async (name, valid) => {
    const path = `src/_styles/${name}`;
    await scenario(
      { [path]: 'body {}\n' },
      rootLayer(),
      'category-role',
      valid ? [] : [categoryRoleViolation('fafconfig.ts', path)]
    );
  });

  it('rejects implicit TypeScript Roles rather than weakening the Asset boundary', async () => {
    await scenario(
      { src: {} },
      rootLayer({
        roles: [
          { category: '_utils', implicitRoleExtensions: ['.ts'], name: 'util' },
        ],
      }),
      'validate-config-format',
      [
        invalidImplicitExtension(
          'faf.locals[0].roles[0].implicitRoleExtensions[0]'
        ),
      ]
    );
  });

  it.each(['src', 'AppShell', '[todoId]', '(auth)', '_root'])(
    'allows nested Root Fragment name %s',
    async (name) => {
      await scenario(
        {
          [`src/${name}/app.ts`]: 'export const app = 1;\n',
          'src/main.ts': 'export const main = 1;\n',
        },
        {
          faf: {
            locals: [
              {
                roles,
                rootFragments: [
                  {
                    path: 'src',
                    rootNodes: [['main.ts']],
                    subRootFragments: [
                      { path: `src/${name}`, rootNodes: [['app.ts']] },
                    ],
                  },
                ],
              },
            ],
          },
        },
        'nomenclature'
      );
    }
  );

  it('does not let a technological Root Node name exempt a forbidden import', async () => {
    await scenario(
      {
        ...fragment('src/_utils/widget'),
        'src/_utils/widget/widget.util.ts':
          "import { entry } from '../../AppEntry.js';\nexport const widget = entry;\n",
        'src/AppEntry.ts': 'export const entry = 1;\n',
      },
      {
        faf: {
          locals: [
            {
              roles,
              rootFragments: [{ path: 'src', rootNodes: [['AppEntry.ts']] }],
            },
          ],
        },
      },
      'root-node-discipline',
      [
        rootNodeDisciplineViolation(
          'src/_utils/widget/widget.util.ts',
          'src/AppEntry.ts',
          '../../AppEntry.js'
        ),
      ]
    );
  });

  it('classifies files named like a Role as Root Nodes with absent Role', async () => {
    await scenario(
      {
        'src/app.component.tsx': 'export const component = 1;\n',
        'src/app.spec.tsx': 'export const spec = 1;\n',
        'src/index.ts': 'export const index = 1;\n',
        'src/main.css': 'body {}\n',
      },
      {
        faf: {
          locals: [
            {
              roles,
              rootFragments: [
                {
                  path: 'src',
                  rootNodes: [
                    [
                      'app.component.tsx',
                      'app.spec.tsx',
                      'index.ts',
                      'main.css',
                    ],
                  ],
                },
              ],
            },
          ],
        },
      },
      'nomenclature'
    );
  });
});

const buildSiblingTree = (
  kind: string,
  parent: string,
  low: string,
  high: string
): FileTree => {
  if (kind === 'Category Nodes') {
    return {
      [`${parent}/${high}`]: 'export type THigh = string;\n',
      [`${parent}/${low}`]: 'export type TLow = string;\n',
    };
  }
  const isFragmentHigh = kind === 'Fragments' || kind.includes('Path Fragment');
  const isFragmentLow = kind === 'Fragments' || kind === 'Path Fragments';
  const fragmentRole = parent === 'src/_apis' ? 'api' : 'util';
  return {
    ...(isFragmentHigh
      ? fragment(`${parent}/${high}`, fragmentRole)
      : { [`${parent}/${high}`]: {} }),
    ...(isFragmentLow
      ? fragment(`${parent}/${low}`, fragmentRole)
      : { [`${parent}/${low}`]: {} }),
  };
};

describe('acceptance: admissible Horizontal Hierarchies', () => {
  it('rejects a hierarchy mixing Logical Nodes and Logical Domains', async () => {
    await scenario(
      {
        'src/_types/_low': {},
        'src/_types/value.type.ts': 'export type TValue = string;\n',
      },
      rootLayer({
        localHorizontalHierarchies: [
          {
            hierarchies: [['value.type.ts'], ['_low']],
            paths: ['src/_types'],
          },
        ],
      }),
      'horizontal-hierarchies',
      [invalidHierarchyMembers('src/_types/value.type.ts', 'src/_types')]
    );
  });

  it('does not compare ranks from different parents as one sibling hierarchy', async () => {
    await scenario(
      linkedFragments(
        'src/_left/_a/_utils/source',
        'src/_right/_b/_utils/target',
        '../../../../_right/_b/_utils/target/index.js'
      ),
      rootLayer({ horizontalHierarchies: [[['_a'], ['_b']]] }),
      'peer-separation',
      [
        peerSeparationViolation(
          'src/_left/_a/_utils/source/source.util.ts',
          'src/_right/_b/_utils/target/index.ts',
          '../../../../_right/_b/_utils/target/index.js'
        ),
      ]
    );
  });

  it('rejects two additional disjoint Root Node hierarchies instead of replacing rootNodes', async () => {
    const files = ['a.ts', 'b.ts', 'c.ts', 'd.ts'];
    await scenario(
      Object.fromEntries(
        files.map((file) => [`src/${file}`, 'export const value = 1;\n'])
      ),
      {
        faf: {
          locals: [
            {
              horizontalHierarchies: [
                [['a.ts'], ['b.ts']],
                [['c.ts'], ['d.ts']],
              ],
              roles,
              rootFragments: [{ path: 'src', rootNodes: [files] }],
            },
          ],
        },
      },
      'horizontal-hierarchies',
      [
        invalidHierarchyMembers('src/a.ts', 'src'),
        ...files.map((file) => hierarchyOverlap(`src/${file}`, `src/${file}`)),
      ]
    );
  });

  it.each([
    ['Categories', 'src', '_types', '_styles', true],
    ['Sub-Categories', 'src/_utils', '_low', '_high', true],
    ['Layers', 'src', '_low', '_high', true],
    ['Sub-Layers', 'src/_domain', '_low', '_high', true],
    ['Fragments', 'src/_utils', 'low', 'high', false],
    ['Category Nodes', 'src/_types', 'low.type.ts', 'high.type.ts', false],
    ['Path Sub-Categories', 'src/_apis', '_low', '_high', false],
    ['Path Sub-Category and Path Fragment', 'src/_apis', '_low', 'high', false],
    ['Path Fragments', 'src/_apis', 'low', 'high', false],
    ['Fractal Branch', 'src', '_src@shared', '_high', false],
    ['Foreign Domain', 'src', '_foreign', '_high', false],
  ])('validates sibling set %s', async (kind, parent, low, high, valid) => {
    const isNode = kind === 'Category Nodes';
    const tree = buildSiblingTree(kind, parent, low, high);
    await scenario(
      tree,
      rootLayer({
        ...(kind.startsWith('Path') && {
          mimeticPathStructures: [{ paths: ['src/_apis'] }],
        }),
        ...(kind === 'Foreign Domain' && { foreignDomains: ['src/_foreign'] }),
        localHorizontalHierarchies: [
          { hierarchies: [[low], [high]], paths: [parent] },
        ],
      }),
      'horizontal-hierarchies',
      valid
        ? []
        : [
            invalidHierarchyMembers(
              isNode ? `${parent}/high.type.ts` : 'fafconfig.ts',
              parent
            ),
          ]
    );
  });

  it('allows ordered Sub-Categories within a Private Category', async () => {
    await scenario(
      {
        ...fragment('src/_utils/widget'),
        'src/_utils/widget/_types/_high/a.type.ts':
          'export type TA = string;\n',
        'src/_utils/widget/_types/_low/b.type.ts': 'export type TB = string;\n',
      },
      rootLayer({
        localHorizontalHierarchies: [
          {
            hierarchies: [['_low'], ['_high']],
            paths: ['src/_utils/widget/_types'],
          },
        ],
      }),
      'horizontal-hierarchies'
    );
  });

  it('rejects ordering Private Category siblings', async () => {
    const parent = 'src/_utils/widget';
    await scenario(
      {
        ...fragment(parent),
        ...fragment(`${parent}/_utils/helper`),
        [`${parent}/_types/value.type.ts`]: 'export type TValue = string;\n',
      },
      rootLayer({
        localHorizontalHierarchies: [
          { hierarchies: [['_types'], ['_utils']], paths: [parent] },
        ],
      }),
      'horizontal-hierarchies',
      [invalidHierarchyMembers(`${parent}/widget.util.ts`, parent)]
    );
  });

  it('rejects ordering sibling Root Fragments', async () => {
    await scenario(
      {
        'src/a/main.ts': 'export const a = 1;\n',
        'src/b/main.ts': 'export const b = 1;\n',
        'src/main.ts': 'export const main = 1;\n',
      },
      {
        faf: {
          locals: [
            {
              localHorizontalHierarchies: [
                { hierarchies: [['a'], ['b']], paths: ['src'] },
              ],
              roles,
              rootFragments: [
                {
                  path: 'src',
                  rootNodes: [['main.ts']],
                  subRootFragments: [
                    { path: 'src/a', rootNodes: [['main.ts']] },
                    { path: 'src/b', rootNodes: [['main.ts']] },
                  ],
                },
              ],
            },
          ],
        },
      },
      'horizontal-hierarchies',
      [invalidHierarchyMembers('src/main.ts', 'src')]
    );
  });

  it('orders Root Nodes only through their single exhaustive rootNodes hierarchy', async () => {
    await scenario(
      {
        'src/high.ts':
          "import { low } from './low.js';\nexport const high = low;\n",
        'src/low.ts': 'export const low = 1;\n',
      },
      {
        faf: {
          locals: [
            {
              roles,
              rootFragments: [
                { path: 'src', rootNodes: [['low.ts'], ['high.ts']] },
              ],
            },
          ],
        },
      },
      'horizontal-hierarchies'
    );
  });

  it.each([
    ['none', [], false],
    ['two-to-one', [['_unused'], ['_low'], ['_high']], true],
    ['two-to-zero', [['_low'], ['_unused'], ['_high']], true],
    ['equal-ranks', [['_unused'], ['_low', '_high']], false],
    ['ascending', [['_high'], ['_unused'], ['_low']], false],
    ['unselected-target', [['_high']], false],
  ])('enforces strict local rank for %s', async (_name, hierarchy, valid) => {
    const source = 'src/_high/_utils/source';
    const target = 'src/_low/_utils/target';
    const specifier = '../../../_low/_utils/target/index.js';
    await scenario(
      linkedFragments(source, target, specifier),
      rootLayer({ horizontalHierarchies: [hierarchy] }),
      'peer-separation',
      valid
        ? []
        : [
            peerSeparationViolation(
              `${source}/source.util.ts`,
              `${target}/index.ts`,
              specifier
            ),
          ]
    );
  });

  it('does not let an ancestor hierarchy order internal Category Node peers', async () => {
    await scenario(
      {
        'src/_high/_types/a.type.ts':
          "import type { TB } from './b.type.js';\nexport type TA = TB;\n",
        'src/_high/_types/b.type.ts': 'export type TB = string;\n',
        'src/_low': {},
      },
      rootLayer({ horizontalHierarchies: [[['_low'], ['_high']]] }),
      'peer-separation',
      [
        peerSeparationViolation(
          'src/_high/_types/a.type.ts',
          'src/_high/_types/b.type.ts',
          './b.type.js'
        ),
      ]
    );
  });

  it('uses the Layer hierarchy without ordering Categories with different parents', async () => {
    await scenario(
      {
        ...fragment('src/_network/_apis/fetch', 'api'),
        ...fragment('src/_ui/_components/view', 'component'),
        'src/_ui/_components/view/view.component.ts':
          "import { value } from '../../../_network/_apis/fetch/index.js';\nexport const view = value;\n",
      },
      rootLayer({ horizontalHierarchies: [[['_network'], ['_ui']]] }),
      'peer-separation'
    );
  });

  it.each([
    [
      'Atomic Design',
      ['_atoms', '_molecules', '_organisms', '_templates'],
      1,
      0,
    ],
    [
      'Systemic Design',
      ['_primitives', '_compounds', '_aggregates', '_systems', '_ecosystems'],
      3,
      1,
    ],
  ])(
    'uses every declared rank of %s without installing defaults',
    async (_name, partitions, high, low) => {
      const sourcePartition = partitions[high] ?? '';
      const targetPartition = partitions[low] ?? '';
      const source = `src/_utils/${sourcePartition}/source`;
      const target = `src/_utils/${targetPartition}/target`;
      const forwardSpecifier = `../../${targetPartition}/target/index.js`;
      const reverseSpecifier = `../../${sourcePartition}/source/index.js`;
      const tree = {
        ...Object.fromEntries(
          partitions.map((name) => [`src/_utils/${name}`, {}])
        ),
        ...linkedFragments(source, target, forwardSpecifier),
      };
      await scenario(
        tree,
        rootLayer({
          horizontalHierarchies: [partitions.map((name) => [name])],
        }),
        'peer-separation'
      );
      await scenario(tree, rootLayer(), 'peer-separation', [
        peerSeparationViolation(
          `${source}/source.util.ts`,
          `${target}/index.ts`,
          forwardSpecifier
        ),
      ]);
      await scenario(
        linkedFragments(
          `src/_utils/${targetPartition}/target`,
          `src/_utils/${sourcePartition}/source`,
          reverseSpecifier
        ),
        rootLayer({
          horizontalHierarchies: [partitions.map((name) => [name])],
        }),
        'peer-separation',
        [
          peerSeparationViolation(
            `${target}/target.util.ts`,
            `${source}/index.ts`,
            reverseSpecifier
          ),
        ]
      );
    }
  );

  it('keeps same-rank Atomic Design Fragments isolated', async () => {
    const specifier = '../b/index.js';
    await scenario(
      linkedFragments('src/_utils/_atoms/a', 'src/_utils/_atoms/b', specifier),
      rootLayer({
        horizontalHierarchies: [
          [['_atoms'], ['_molecules'], ['_organisms'], ['_templates']],
        ],
      }),
      'peer-separation',
      [
        peerSeparationViolation(
          'src/_utils/_atoms/a/a.util.ts',
          'src/_utils/_atoms/b/index.ts',
          specifier
        ),
      ]
    );
  });

  it('keeps pages a catalog Category rather than an Atomic Design Sub-Category', async () => {
    await scenario(
      {
        ...fragment('src/_components/_templates/layout', 'component'),
        ...fragment('src/_pages/home', 'page'),
      },
      rootLayer(),
      'containment-matrix'
    );
    await scenario(
      fragment('src/_components/_pages/home', 'page'),
      rootLayer(),
      'containment-matrix',
      [
        containmentViolation(
          'src/_components/_pages/home/home.page.ts',
          'src/_components/_pages'
        ),
      ]
    );
  });

  it('admits collaboration only after peers move into ordered Sub-Categories', async () => {
    const directSpecifier = '../b/index.js';
    await scenario(
      linkedFragments('src/_utils/a', 'src/_utils/b', directSpecifier),
      rootLayer(),
      'peer-separation',
      [
        peerSeparationViolation(
          'src/_utils/a/a.util.ts',
          'src/_utils/b/index.ts',
          directSpecifier
        ),
      ]
    );
    await scenario(
      linkedFragments(
        'src/_utils/_high/a',
        'src/_utils/_low/b',
        '../../_low/b/index.js'
      ),
      rootLayer({ horizontalHierarchies: [[['_low'], ['_high']]] }),
      'peer-separation'
    );
  });
});

describe('acceptance: Mimetic Path Structures', () => {
  it('requires mimetic structure designation and Fragment form', async () => {
    await scenario(
      {
        ...fragment('src/_apis/root', 'api'),
        ...fragment('src/_apis/_todos/list', 'api'),
      },
      mimetic(),
      'exclusive-forms'
    );
    await scenario(
      { 'src/_types/value.type.ts': 'export type TValue = string;\n' },
      rootLayer({ mimeticPathStructures: [{ paths: ['src/_types'] }] }),
      'classify-taxonomy',
      [incompatibleMimetic('src/_types')]
    );
  });

  it('does not infer mimetic designation from the Category name', async () => {
    await scenario(
      {
        ...fragment('src/_apis/root', 'api'),
        ...fragment('src/_apis/_todos/list', 'api'),
      },
      rootLayer(),
      'exclusive-forms',
      [exclusiveFormsViolation('src/_apis')]
    );
  });

  it.each([
    ['todos', false],
    ['[todo-id]', false],
    ['_todos', true],
    ['_status', true],
    ['_v1', true],
    ['_[todo-id]', true],
    ['_[todoId]', false],
    ['_[]', false],
    ['_todo[id]', false],
    ['_[todo-id', false],
  ])('checks mimetic coordinate segment %s', async (segment, valid) => {
    const path = `src/_apis/${segment}`;
    if (segment === 'todos' || segment === '[todo-id]') {
      await scenario(
        { [`${path}/index.ts`]: 'export {};\n' },
        mimetic(),
        'fragment-anatomy',
        [missingMasterNode(`${path}/index.ts`, path)]
      );
      return;
    }
    await scenario(
      { [path]: {} },
      mimetic(),
      'nomenclature',
      valid ? [] : [invalidNomenclature('fafconfig.ts', path)]
    );
  });

  it('propagates the Parent Category Role through mimetic coordinates', async () => {
    await scenario(
      fragment('src/_apis/_todos/_[todo-id]/_status/patch-todo-status', 'api'),
      mimetic(['patch']),
      'category-role'
    );
    await scenario(
      fragment('src/_apis/_todos/_[todo-id]/_status/patch-todo-status', 'util'),
      mimetic(['patch']),
      'category-role',
      [
        categoryRoleViolation(
          'src/_apis/_todos/_[todo-id]/_status/patch-todo-status/patch-todo-status.util.ts',
          'src/_apis/_todos/_[todo-id]/_status/patch-todo-status/patch-todo-status.util.ts'
        ),
        missingMasterNode(
          'src/_apis/_todos/_[todo-id]/_status/patch-todo-status/index.ts',
          'src/_apis/_todos/_[todo-id]/_status/patch-todo-status'
        ),
      ]
    );
  });

  it.each([
    ['get-todos', true],
    ['post-todo', true],
    ['patch-todo-status', true],
    ['delete-todo', false],
    ['get', false],
    ['get-', false],
    ['Get-Todo', false],
  ])('checks closed action-target name %s', async (name, valid) => {
    const path = `src/_apis/${name}`;
    await scenario(
      fragment(path, 'api'),
      mimetic(['get', 'post', 'patch']),
      'nomenclature',
      valid
        ? []
        : [
            invalidNomenclature(`${path}/${name}.api.ts`, path),
            invalidNomenclature(
              `${path}/${name}.api.ts`,
              `${path}/${name}.api.ts`
            ),
          ]
    );
  });

  it.each([
    ['get-or-create-todo', true],
    ['get-todo', true],
    ['get-or-create-todo-list', true],
    ['get-or-create-', false],
    ['getter-todo', false],
  ])(
    'uses the longest action prefix for %s in either catalog order',
    async (name, valid) => {
      const path = `src/_apis/${name}`;
      for (const actions of [
        ['get', 'get-or-create'],
        ['get-or-create', 'get'],
      ]) {
        await scenario(
          fragment(path, 'api'),
          mimetic(actions),
          'nomenclature',
          valid
            ? []
            : [
                invalidNomenclature(`${path}/${name}.api.ts`, path),
                invalidNomenclature(
                  `${path}/${name}.api.ts`,
                  `${path}/${name}.api.ts`
                ),
              ]
        );
      }
    }
  );

  it.each([
    ['home', true],
    ['blog-feed', true],
    ['blog-post', true],
    ['post-comments', true],
    ['get-todos', true],
    ['_home', false],
    ['BlogPost', false],
  ])(
    'uses an ordinary target without an Action Catalog for %s',
    async (name, valid) => {
      const path = `src/_pages/${name}`;
      if (name === '_home') {
        await scenario(fragment(path, 'page'), rootLayer(), 'category-role', [
          categoryRoleViolation(
            `${path}/_home.page.ts`,
            `${path}/_home.page.ts`
          ),
        ]);
        return;
      }
      await scenario(
        fragment(path, 'page'),
        rootLayer({ mimeticPathStructures: [{ paths: ['src/_pages'] }] }),
        'nomenclature',
        valid
          ? []
          : [
              invalidNomenclature(`${path}/${name}.page.ts`, path),
              invalidNomenclature(
                `${path}/${name}.page.ts`,
                `${path}/${name}.page.ts`
              ),
            ]
      );
    }
  );

  it('applies the Parent Category Action Catalog at every coordinate', async () => {
    const path = 'src/_apis/_todos/_[todo-id]/home';
    await scenario(
      fragment(path, 'api'),
      mimetic(['get', 'post']),
      'nomenclature',
      [
        invalidNomenclature(`${path}/home.api.ts`, path),
        invalidNomenclature(`${path}/home.api.ts`, `${path}/home.api.ts`),
      ]
    );
  });

  it('does not infer external addresses from Fragment target names', async () => {
    await scenario(
      {
        ...fragment('src/_apis/home', 'api'),
        ...fragment('src/_apis/_blog/blog-feed', 'api'),
        ...fragment('src/_apis/_blog/_[post-id]/blog-post', 'api'),
        ...fragment(
          'src/_apis/_blog/_[post-id]/_comments/post-comments',
          'api'
        ),
      },
      mimetic(),
      'nomenclature'
    );
  });

  it.each([
    'missing-segment',
    'two-external-segments',
    'extra-segment',
    'different-external-name',
  ])('does not diagnose unobservable address fidelity: %s', async (_kind) => {
    await scenario(
      {
        ...fragment('src/_apis/_blog/blog-feed', 'api'),
        ...fragment('src/_apis/blog', 'api'),
      },
      mimetic(),
      'nomenclature'
    );
  });

  it.each(['command', 'topic', 'procedure'])(
    'accepts non-HTTP mimetic Role %s',
    async (role) => {
      const category = `_${role}s`;
      await scenario(
        fragment(`src/${category}/_v1/apply`, role),
        rootLayer({
          mimeticPathStructures: [{ paths: [`src/${category}`] }],
          roles: [...roles, { category, name: role }],
        }),
        'nomenclature'
      );
    }
  );

  it('distinguishes programmatic Path Fragments from filesystem Root Nodes', async () => {
    await scenario(
      {
        ...fragment('src/_pages/home', 'page'),
        'app/page.tsx': 'export const page = 1;\n',
      },
      {
        faf: {
          locals: [
            {
              mimeticPathStructures: [{ paths: ['src/_pages'] }],
              roles,
              rootFragments: [{ path: 'app', rootNodes: [['page.tsx']] }],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'fragment-anatomy'
    );
  });

  it.each([
    [
      'Category Node',
      { 'src/_apis/value.type.ts': 'export type TValue = string;\n' },
      mimetic(),
      'containment-matrix',
      [
        containmentViolation(
          'src/_apis/value.type.ts',
          'src/_apis/value.type.ts'
        ),
      ],
    ],
    [
      'Access Node',
      { 'src/_apis/index.ts': 'export {};\n' },
      mimetic(),
      'containment-matrix',
      [containmentViolation('src/_apis/index.ts', 'src/_apis/index.ts')],
    ],
    [
      'Layer',
      {
        'src/_apis/_domain/_types/value.type.ts':
          'export type TValue = string;\n',
      },
      mimetic(),
      'containment-matrix',
      [
        containmentViolation(
          'src/_apis/_domain/_types/value.type.ts',
          'src/_apis/_domain'
        ),
      ],
    ],
    [
      'Root Fragment',
      {
        'src/_apis/sub/sub.ts': 'export const sub = 1;\n',
        'src/main.ts': 'export const main = 1;\n',
      },
      {
        faf: {
          locals: [
            {
              mimeticPathStructures: [{ paths: ['src/_apis'] }],
              roles,
              rootFragments: [
                {
                  path: 'src',
                  rootNodes: [['main.ts']],
                  subRootFragments: [
                    { path: 'src/_apis/sub', rootNodes: [['sub.ts']] },
                  ],
                },
              ],
            },
          ],
        },
      },
      'validate-config-references',
      [nestedRootFragmentNotDirectChild('src/_apis/sub')],
    ],
  ])(
    'rejects direct mimetic %s',
    async (_kind, tree, config, responsiblePart, expected) => {
      await scenario(tree, config, responsiblePart, expected);
    }
  );

  it('allows Path Fragments at the root and at non-leaf coordinates', async () => {
    await scenario(
      {
        ...fragment('src/_apis/root', 'api'),
        ...fragment('src/_apis/_todos/list', 'api'),
        ...fragment('src/_apis/_todos/_[todo-id]/detail', 'api'),
      },
      mimetic(),
      'exclusive-forms'
    );
  });

  it('does not infer peer ordering from coordinate depth or action verbs', async () => {
    const specifier = '../_[todo-id]/get-todo/index.js';
    await scenario(
      {
        ...fragment('src/_apis/_todos/get-todos', 'api'),
        ...fragment('src/_apis/_todos/_[todo-id]/get-todo', 'api'),
        'src/_apis/_todos/get-todos/get-todos.api.ts': `import { value } from '${specifier}';\nexport const all = value;\n`,
      },
      mimetic(['get']),
      'peer-separation',
      [
        peerSeparationViolation(
          'src/_apis/_todos/get-todos/get-todos.api.ts',
          'src/_apis/_todos/_[todo-id]/get-todo/index.ts',
          specifier
        ),
      ]
    );
  });

  it('stops action-target naming at Fragment and Fractal Branch boundaries', async () => {
    await scenario(
      {
        ...fragment('src/_apis/_todos/get-todos', 'api'),
        ...fragment('src/_apis/_todos/get-todos/_utils/normalize'),
        ...fragment('src/_apis/_todos/_todos@shared/_utils/serialize'),
      },
      mimetic(['get']),
      'nomenclature'
    );
  });

  it('keeps mimetic Private Categories private across nested Root Fragments', async () => {
    const specifier = '../_apis/_todos/get-todos/index.js';
    await scenario(
      {
        ...fragment('src/_apis/_todos/get-todos', 'api'),
        'src/main.ts': 'export const main = 1;\n',
        'src/route/page.ts': `import { value } from '${specifier}';\nexport const page = value;\n`,
      },
      {
        faf: {
          locals: [
            {
              mimeticPathStructures: [
                { actions: ['get'], paths: ['src/_apis'] },
              ],
              roles,
              rootFragments: [
                {
                  path: 'src',
                  rootNodes: [['main.ts']],
                  subRootFragments: [
                    { path: 'src/route', rootNodes: [['page.ts']] },
                  ],
                },
              ],
            },
          ],
        },
      },
      'private-category-visibility',
      [
        privateCategoryVisibilityViolation(
          'src/route/page.ts',
          'src/_apis/_todos/get-todos/index.ts',
          specifier
        ),
      ]
    );
  });
});

describe('acceptance: proportionality and evolution without arbitrary thresholds', () => {
  it('does not invent a depth limit', async () => {
    await scenario(
      fragment(
        `src/${Array.from({ length: 40 }, () => '_domain').join('/')}/_utils/widget`
      ),
      rootLayer(),
      'containment-matrix'
    );
  });

  it('does not diagnose redundancy from a single Category or consumer', async () => {
    await scenario(
      {
        ...fragment('src/_domain/_utils/widget'),
        ...fragment('src/_domain/_utils/widget/_utils/helper'),
      },
      rootLayer(),
      'exclusive-forms'
    );
  });

  it('requires Fragment anatomy after extraction into a Fragment-form Role', async () => {
    await scenario(
      {
        ...fragment('src/_components/button', 'component'),
        ...fragment('src/_components/button/_utils/normalize'),
      },
      rootLayer(),
      'fragment-anatomy'
    );
  });

  it('does not allow converting one Category Node into a Fragment', async () => {
    await scenario(
      fragment('src/_types/value', 'type'),
      rootLayer(),
      'classification-completeness',
      [
        unclassifiableDirectory(
          'src/_types/value/index.ts',
          'src/_types/value'
        ),
        unclassifiableFile(
          'src/_types/value/index.ts',
          'src/_types/value/index.ts'
        ),
        unclassifiableFile(
          'src/_types/value/value.type.ts',
          'src/_types/value/value.type.ts'
        ),
      ]
    );
  });

  it('allows extraction of independent Symbols as private Category Nodes', async () => {
    await scenario(
      {
        ...fragment('src/_utils/widget'),
        'src/_utils/widget/_types/a.type.ts': 'export type TA = string;\n',
        'src/_utils/widget/_types/b.type.ts': 'export type TB = number;\n',
      },
      rootLayer(),
      'category-role'
    );
  });

  it('extraction into a Private Category does not compare parent and child internal ranks', async () => {
    const internalSpecifier = './_utils/normalize/index.js';
    const tree = {
      ...fragment('src/_components/button', 'component'),
      ...fragment('src/_components/button/_utils/normalize'),
      'src/_components/button/button.type.ts': `import { value } from '${internalSpecifier}';\nexport type TValue = typeof value;\n`,
    };
    await scenario(tree, rootLayer(), 'private-category-visibility');
    await scenario(
      {
        ...tree,
        'src/_components/button/index.ts': `export { value } from '${internalSpecifier}';\n`,
      },
      rootLayer(),
      'private-category-visibility',
      [
        privateCategoryVisibilityViolation(
          'src/_components/button/index.ts',
          'src/_components/button/_utils/normalize/index.ts',
          internalSpecifier
        ),
      ]
    );
  });

  it('promotion broadens consumers without exposing internal Fragment Nodes', async () => {
    const branchIndexSpecifier = './_button@shared/_utils/helper/index.js';
    const branchInternalSpecifier =
      './_button@shared/_utils/helper/helper.util.js';
    await scenario(
      {
        ...fragment('src/_components/button', 'component'),
        ...fragment('src/_components/button/_button@shared/_utils/helper'),
        'src/_components/button/button.component.ts': `import { value } from '${branchIndexSpecifier}';\nexport const button = value;\n`,
      },
      rootLayer(),
      'fractal-branch-visibility'
    );
    await scenario(
      {
        ...fragment('src/_components/button', 'component'),
        ...fragment('src/_components/button/_button@shared/_utils/helper'),
        'src/_components/button/button.component.ts': `import { value } from '${branchInternalSpecifier}';\nexport const button = value;\n`,
      },
      rootLayer(),
      'fragment-encapsulation',
      [
        fragmentEncapsulationViolation(
          'src/_components/button/button.component.ts',
          'src/_components/button/_button@shared/_utils/helper/helper.util.ts',
          branchInternalSpecifier
        ),
      ]
    );
  });

  it('keeps an unchanged public index usable after internal refactoring', async () => {
    const client = 'src/main.ts';
    const config = {
      faf: {
        locals: [
          { roles, rootFragments: [{ path: 'src', rootNodes: [['main.ts']] }] },
        ],
      },
    };
    const tree = {
      ...fragment('src/_utils/widget'),
      [client]:
        "import { value } from './_utils/widget/index.js';\nexport const main = value;\n",
    };
    await scenario(tree, config, 'fragment-encapsulation');
    await scenario(
      { ...tree, ...fragment('src/_utils/widget/_utils/helper') },
      config,
      'fragment-encapsulation'
    );
    await scenario(
      {
        ...tree,
        ...fragment('src/_utils/widget/_widget@shared/_utils/helper'),
      },
      config,
      'fragment-encapsulation'
    );
  });

  it('allows contraction to direct Categories but rejects residual Layers', async () => {
    await scenario(
      fragment('src/_utils/widget'),
      rootLayer(),
      'exclusive-forms'
    );
    await scenario(
      {
        ...fragment('src/_utils/widget'),
        ...fragment('src/_domain/_utils/other'),
      },
      rootLayer(),
      'exclusive-forms',
      [exclusiveFormsViolation('src')]
    );
  });

  it('does not perform heuristic architectural refactoring with ESLint fix enabled', async () => {
    const project = await createProject(
      fragment('src/_utils/widget'),
      rootLayer()
    );
    try {
      expectScenario(await lintScenario(project.path), 'fragment-anatomy', []);
      const eslint = new ESLint({
        cwd: project.path,
        fix: true,
        overrideConfig: [
          { ...plugin.configs.recommended, languageOptions: { parser } },
        ],
        overrideConfigFile: true,
      });
      const results = await eslint.lintFiles(['.']);
      expect(results.map((result) => result.output)).toEqual([
        undefined,
        undefined,
        undefined,
      ]);
      expect(
        results
          .flatMap((result) => result.messages)
          .every(
            (message) =>
              message.fix === undefined && message.suggestions === undefined
          )
      ).toBe(true);
    } finally {
      await project.rm();
    }
  });
});

describe('acceptance: naming of Root Nodes and Foreign Nodes without exception catalog', () => {
  it('accepts exact Root Node names without interpreting their suffixes', async () => {
    await scenario(
      {
        'src/AppEntry.tsx': 'export const entry = 1;\n',
        'src/global.styles.css': 'body {}\n',
      },
      {
        faf: {
          locals: [
            {
              roles,
              rootFragments: [
                {
                  path: 'src',
                  rootNodes: [['AppEntry.tsx', 'global.styles.css']],
                },
              ],
            },
          ],
        },
      },
      'nomenclature'
    );
  });

  it('accepts a designated Foreign Node without a naming exception catalog and keeps it isolated', async () => {
    await scenario(
      { ...fragment('src/_utils/widget'), 'src/Design.Notes.MD': 'notes' },
      rootLayer({ foreignNodes: ['src/Design.Notes.MD'] }),
      'nomenclature'
    );
    const specifier = '../../Design.Notes.js';
    await scenario(
      {
        ...fragment('src/_utils/widget'),
        'src/_utils/widget/widget.util.ts': `import '${specifier}';\nexport const value = 1;\n`,
        'src/Design.Notes.ts': 'export const notes = 1;\n',
      },
      rootLayer({ foreignNodes: ['src/Design.Notes.ts'] }),
      'foreign-node-isolation',
      [
        foreignNodeIsolationViolation(
          'src/_utils/widget/widget.util.ts',
          'src/Design.Notes.ts',
          specifier
        ),
      ]
    );
  });

  it('does not treat a configured hierarchy path as a naming exemption', async () => {
    const path = 'src/_BadLayer';
    await scenario(
      fragment(`${path}/_utils/widget`),
      rootLayer({
        localHorizontalHierarchies: [{ hierarchies: [], paths: [path] }],
      }),
      'nomenclature',
      [invalidNomenclature(`${path}/_utils/widget/widget.util.ts`, path)]
    );
  });
});

describe('acceptance: Public Surface origin dependence and structural determination', () => {
  it.each([
    ['origin Root Node', 'src/main.ts', true],
    ['nested Root Node', 'src/routes/page.ts', true],
    ['private Access Node', 'src/_utils/widget/index.ts', false],
    [
      'apical Branch Category Node',
      'src/_src@shared/_types/shared.type.ts',
      false,
    ],
    ['Fragment Node', 'src/_utils/widget/widget.util.ts', false],
    ['Sub-Graph Node', 'src/_utils/widget/widget.spec.ts', false],
    ['Foreign Node', 'src/Design.Notes.MD', false],
  ])('accepts publicRootNodes only for %s', async (_kind, path, valid) => {
    await scenario(
      {
        ...fragment('src/_utils/widget'),
        'src/_src@shared/_types/shared.type.ts':
          'export type TShared = string;\n',
        'src/_utils/widget/widget.spec.ts': 'export const test = 1;\n',
        'src/Design.Notes.MD': 'notes',
        'src/main.ts': 'export const main = 1;\n',
        'src/routes/page.ts': 'export const page = 1;\n',
      },
      {
        faf: {
          locals: [
            {
              foreignNodes: ['src/Design.Notes.MD'],
              publicRootNodes: [path],
              roles,
              rootFragments: [
                {
                  path: 'src',
                  rootNodes: [['main.ts']],
                  subRootFragments: [
                    { path: 'src/routes', rootNodes: [['page.ts']] },
                  ],
                },
              ],
              subGraphRoles: [{ name: 'spec' }],
            },
          ],
        },
      },
      'classify-taxonomy',
      valid ? [] : [publicRootNodeNotEnumerated(path)]
    );
  });

  it.each([
    ['direct Fragment interface', 'src/_utils/widget/index.ts', true],
    ['direct Category Node', 'src/_types/direct.type.ts', true],
    [
      'Sub-Category Node in a Layer',
      'src/_domain/_types/_primitives/value.type.ts',
      true,
    ],
    [
      'Path Fragment interface in a Sub-Layer',
      'src/_domain/_nested/_apis/_v1/endpoint/index.ts',
      true,
    ],
    ['Fragment Node', 'src/_utils/widget/widget.util.ts', false],
    ['Sub-Graph Node', 'src/_utils/widget/widget.spec.ts', false],
    [
      'Private Category interface',
      'src/_utils/widget/_utils/detail/index.ts',
      false,
    ],
    [
      'apical Branch interface',
      'src/_src@shared/_utils/shared/index.ts',
      false,
    ],
    [
      'nested Branch interface',
      'src/_domain/_domain@shared/_utils/shared/index.ts',
      false,
    ],
    ['Foreign Node', 'src/Design.Notes.MD', false],
  ])(
    'observes structural exposure of %s through ESLint',
    async (_kind, target, exposed) => {
      await surfaceProbe(
        target.startsWith('src/_domain/')
          ? surfaceLayerTree(target)
          : publicTree,
        surfaceConfig(target),
        target,
        exposed
      );
    }
  );

  it.each([0, 1, 3])(
    'allows %d designated Root Nodes without an origin barrel',
    async (count) => {
      const names = ['a.ts', 'b.ts', 'c.ts'];
      const designated = names.slice(0, count).map((name) => `src/${name}`);
      await scenario(
        {
          'src/a.ts': 'export const a = 1;\n',
          'src/b.ts': 'export const b = 1;\n',
          'src/c.ts': 'export const c = 1;\n',
        },
        {
          faf: {
            locals: [
              {
                publicRootNodes: designated,
                roles,
                rootFragments: [{ path: 'src', rootNodes: [names] }],
              },
            ],
          },
        },
        'classify-taxonomy'
      );
    }
  );

  it('changes Root Layer exposure after adding and relocating an entire unit', async () => {
    await scenario({ src: {} }, rootLayer(), 'classify-taxonomy');
    await surfaceProbe(
      fragment('src/_utils/widget'),
      rootLayer(),
      'src/_utils/widget/index.ts',
      true
    );
    await surfaceProbe(
      fragment('src/_src@shared/_utils/widget'),
      rootLayer(),
      'src/_src@shared/_utils/widget/index.ts',
      false
    );
  });
});
