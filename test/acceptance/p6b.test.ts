import type { FileTree } from 'fs-fixture';

import { ESLint } from 'eslint';
import { parser } from 'typescript-eslint';
import { beforeAll, describe, expect, it } from 'vitest';

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

const diagnostic = (
  filePath: string,
  element: string,
  constraint: string,
  detail: string,
  messageId = 'classification'
) => ({
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

const invalidName = (filePath: string, element: string) =>
  diagnostic(
    filePath,
    element,
    'classification/invalid-nomenclature',
    `Name of '${element}' does not satisfy its FAF nomenclature contract.`
  );

const scenario = async (
  tree: FileTree,
  config: Readonly<Record<string, unknown>>,
  responsiblePart: string,
  expected: Parameters<typeof expectScenario>[2] = []
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

const WARMUP_TIMEOUT_MS = 120_000;

beforeAll(warmupESLint, WARMUP_TIMEOUT_MS);

describe('acceptance: contextual nomenclature', () => {
  it.each([
    ['Category', 'src/_components', true],
    ['Category without underscore', 'src/components', false],
    ['Sub-Category', 'src/_utils/_atoms', true],
    ['Sub-Category without underscore', 'src/atoms', false],
    ['Layer', 'src/_domain', true],
    ['Layer without underscore', 'src/domain', false],
  ])(
    'checks organizational naming through classification: %s',
    async (_kind, path, valid) => {
      await scenario(
        { [path]: {} },
        rootLayer(),
        valid ? 'nomenclature' : 'classification-completeness',
        valid
          ? []
          : [
              diagnostic(
                'fafconfig.ts',
                path,
                'classification/unclassifiable-directory',
                `'${path}' has no unique Logical Domain classification (FAF §6.9).`
              ),
            ]
      );
    }
  );

  it('does not reinterpret an underscored Fragment as a functional domain', async () => {
    const path = 'src/_utils/_user-profile';
    await scenario(fragment(path), rootLayer(), 'category-role', [
      diagnostic(
        `${path}/_user-profile.util.ts`,
        `${path}/_user-profile.util.ts`,
        'classification/category-role',
        `Node '${path}/_user-profile.util.ts' does not have the Role imposed by its Category.`
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
            invalidName(`${path}/${name}.util.ts`, path),
            invalidName(`${path}/${name}.util.ts`, `${path}/${name}.util.ts`),
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
          [`src/${name}/Design.Notes.MD`]: 'notes',
          'src/_types/value.type.ts': 'export type TValue = string;\n',
        },
        rootLayer({ foreignDomains: [`src/${name}`] }),
        'nomenclature'
      );
    }
  );

  it.each([
    ['user-profile', true],
    ['userProfile', false],
  ])('checks Category Node basename %s', async (name, valid) => {
    const path = `src/_types/${name}.type.ts`;
    await scenario(
      { [path]: 'export type TValue = string;\n' },
      rootLayer(),
      'nomenclature',
      valid ? [] : [invalidName(path, path)]
    );
  });

  it('accepts singular Categories and Sub-Categories without pluralization', async () => {
    await scenario(
      fragment('src/_component/_atom/widget', 'component'),
      rootLayer({ roles: [{ category: '_component', name: 'component' }] }),
      'nomenclature'
    );
  });

  it.each(['src', 'AppShell', '[todoId]', '(auth)', '_root'])(
    'allows nested Root Fragment name %s',
    async (name) => {
      await scenario(
        {
          [`app/${name}/page.ts`]: 'export const page = 1;\n',
          'app/main.ts': 'export const main = 1;\n',
        },
        {
          faf: {
            locals: [
              {
                roles,
                rootFragments: [
                  {
                    path: 'app',
                    rootNodes: [['main.ts']],
                    subRootFragments: [
                      { path: `app/${name}`, rootNodes: [['page.ts']] },
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

  it('accepts a designated Foreign Node without a naming exception catalog', async () => {
    await scenario(
      { ...fragment('src/_utils/widget'), 'src/Design.Notes.MD': 'notes' },
      rootLayer({ foreignNodes: ['src/Design.Notes.MD'] }),
      'nomenclature'
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
      [invalidName(`${path}/_utils/widget/widget.util.ts`, path)]
    );
  });
});

describe('acceptance: Mimetic Path nomenclature', () => {
  it.each(['todos', '[todo-id]'])(
    'does not accept unprefixed coordinate %s as a Path Sub-Category',
    async (name) => {
      const path = `src/_apis/${name}`;
      await scenario(
        { [`${path}/index.ts`]: 'export {};\n' },
        mimetic(),
        'fragment-anatomy',
        [
          diagnostic(
            `${path}/index.ts`,
            path,
            'classification/fragment-anatomy',
            `Fragment '${path}' has no Master Node.`
          ),
        ]
      );
    }
  );

  it('does not allow an underscored target to masquerade as a Path Fragment', async () => {
    await scenario(
      fragment('src/_apis/_home', 'api'),
      mimetic(),
      'category-role',
      [
        diagnostic(
          'src/_apis/_home/_home.api.ts',
          'src/_apis/_home/_home.api.ts',
          'classification/category-role',
          "Node 'src/_apis/_home/_home.api.ts' does not have the Role imposed by its Category."
        ),
      ]
    );
  });
  it.each([
    ['_todos', true],
    ['_status', true],
    ['_v1', true],
    ['_[todo-id]', true],
    ['_[todoId]', false],
    ['_[]', false],
    ['_todo[id]', false],
    ['_[todo-id', false],
  ])('checks Path Sub-Category segment %s', async (name, valid) => {
    const path = `src/_apis/${name}`;
    const master = `${path}/get-todo/get-todo.api.ts`;
    await scenario(
      fragment(`${path}/get-todo`, 'api'),
      mimetic(['get']),
      'nomenclature',
      valid ? [] : [invalidName(master, path)]
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
            invalidName(`${path}/${name}.api.ts`, path),
            ...(['get-', 'Get-Todo'].includes(name)
              ? [
                  invalidName(
                    `${path}/${name}.api.ts`,
                    `${path}/${name}.api.ts`
                  ),
                ]
              : []),
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
      const expected = valid
        ? []
        : [
            invalidName(`${path}/${name}.api.ts`, path),
            ...(name === 'get-or-create-'
              ? [
                  invalidName(
                    `${path}/${name}.api.ts`,
                    `${path}/${name}.api.ts`
                  ),
                ]
              : []),
          ];
      await scenario(
        fragment(path, 'api'),
        mimetic(['get', 'get-or-create']),
        'nomenclature',
        expected
      );
      await scenario(
        fragment(path, 'api'),
        mimetic(['get-or-create', 'get']),
        'nomenclature',
        expected
      );
    }
  );

  it.each([
    ['home', true],
    ['blog-feed', true],
    ['blog-post', true],
    ['post-comments', true],
    ['get-todos', true],
    ['BlogPost', false],
  ])(
    'uses an ordinary target without an Action Catalog for %s',
    async (name, valid) => {
      const path = `src/_apis/${name}`;
      await scenario(
        fragment(path, 'api'),
        mimetic(),
        'nomenclature',
        valid
          ? []
          : [
              invalidName(`${path}/${name}.api.ts`, path),
              invalidName(`${path}/${name}.api.ts`, `${path}/${name}.api.ts`),
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
      [invalidName(`${path}/home.api.ts`, path)]
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
  ])('does not diagnose unobservable address fidelity: %s', async (mapping) => {
    await scenario(
      { ...fragment('src/_apis/blog', 'api'), 'src/Mapping.MD': mapping },
      rootLayer({
        foreignNodes: ['src/Mapping.MD'],
        mimeticPathStructures: [{ paths: ['src/_apis'] }],
      }),
      'nomenclature'
    );
  });

  it.each(['command', 'topic', 'procedure'])(
    'accepts non-HTTP mimetic Role %s',
    async (role) => {
      await scenario(
        fragment('src/_entries/_v1/list-items', role),
        rootLayer({
          mimeticPathStructures: [
            { actions: ['list'], paths: ['src/_entries'] },
          ],
          roles: [{ category: '_entries', name: role }],
        }),
        'nomenclature'
      );
    }
  );

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
});

const invalidHierarchy = (file: string, parent: string) =>
  diagnostic(
    file,
    parent,
    'classification/horizontal-hierarchy-members',
    `Horizontal Hierarchy under '${parent}' selects a non-orderable sibling set.`
  );

const dependency = (
  source: string,
  target: string,
  constraint = 'dependency/peer-separation'
) =>
  diagnostic(
    source,
    source,
    constraint,
    `Import from '${source}' to '${target}' violates ${constraint.slice('dependency/'.length)}.`,
    'dependency'
  );

const linkedFragments = (
  source: string,
  target: string,
  specifier: string
): FileTree => ({
  ...fragment(source),
  ...fragment(target),
  [`${source}/${source.split('/').at(-1) ?? ''}.util.ts`]: `import { value } from '${specifier}';\nexport const linked = value;\n`,
});

describe('acceptance: admissible Horizontal Hierarchies', () => {
  it('rejects a hierarchy mixing Logical Nodes and Logical Domains', async () => {
    await scenario(
      {
        'src/_types/_low': {},
        'src/_types/value.type.ts': 'export type TValue = string;\n',
      },
      rootLayer({
        localHorizontalHierarchies: [
          { hierarchies: [['value.type.ts'], ['_low']], paths: ['src/_types'] },
        ],
      }),
      'horizontal-hierarchies',
      [invalidHierarchy('src/_types/value.type.ts', 'src/_types')]
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
        dependency(
          'src/_left/_a/_utils/source/source.util.ts',
          'src/_right/_b/_utils/target/index.ts'
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
        invalidHierarchy('src/a.ts', 'src'),
        ...files.map((file) =>
          diagnostic(
            `src/${file}`,
            `src/${file}`,
            'classification/horizontal-hierarchy-overlap',
            `Item 'src/${file}' belongs to more than one Horizontal Hierarchy.`
          )
        ),
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
    const tree: FileTree = isNode
      ? {
          [`${parent}/${high}`]: 'export type THigh = string;\n',
          [`${parent}/${low}`]: 'export type TLow = string;\n',
        }
      : { [`${parent}/${high}`]: {}, [`${parent}/${low}`]: {} };
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
            invalidHierarchy(
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
        ...fragment('src/_utils/widget/_utils/_low/a'),
        ...fragment('src/_utils/widget/_utils/_high/b'),
      },
      rootLayer({
        localHorizontalHierarchies: [
          {
            hierarchies: [['_low'], ['_high']],
            paths: ['src/_utils/widget/_utils'],
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
        [`${parent}/_types/value.type.ts`]: 'export type TValue = string;\n',
        ...fragment(`${parent}/_utils/helper`),
      },
      rootLayer({
        localHorizontalHierarchies: [
          { hierarchies: [['_types'], ['_utils']], paths: [parent] },
        ],
      }),
      'horizontal-hierarchies',
      [invalidHierarchy(`${parent}/widget.util.ts`, parent)]
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
      [invalidHierarchy('src/main.ts', 'src')]
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
    await scenario(
      linkedFragments(source, target, '../../../_low/_utils/target/index.js'),
      rootLayer({ horizontalHierarchies: [hierarchy] }),
      'peer-separation',
      valid
        ? []
        : [dependency(`${source}/source.util.ts`, `${target}/index.ts`)]
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
      [dependency('src/_high/_types/a.type.ts', 'src/_high/_types/b.type.ts')]
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
      const tree = {
        ...Object.fromEntries(
          partitions.map((name) => [`src/_utils/${name}`, {}])
        ),
        ...linkedFragments(
          source,
          target,
          `../../${targetPartition}/target/index.js`
        ),
      };
      await scenario(
        tree,
        rootLayer({
          horizontalHierarchies: [partitions.map((name) => [name])],
        }),
        'peer-separation'
      );
      await scenario(tree, rootLayer(), 'peer-separation', [
        dependency(`${source}/source.util.ts`, `${target}/index.ts`),
      ]);
      await scenario(
        linkedFragments(
          `src/_utils/${targetPartition}/target`,
          `src/_utils/${sourcePartition}/source`,
          `../../${sourcePartition}/source/index.js`
        ),
        rootLayer({
          horizontalHierarchies: [partitions.map((name) => [name])],
        }),
        'peer-separation',
        [dependency(`${target}/target.util.ts`, `${source}/index.ts`)]
      );
    }
  );

  it('keeps same-rank Atomic Design Fragments isolated', async () => {
    await scenario(
      linkedFragments(
        'src/_utils/_atoms/a',
        'src/_utils/_atoms/b',
        '../b/index.js'
      ),
      rootLayer({
        horizontalHierarchies: [
          [['_atoms'], ['_molecules'], ['_organisms'], ['_templates']],
        ],
      }),
      'peer-separation',
      [
        dependency(
          'src/_utils/_atoms/a/a.util.ts',
          'src/_utils/_atoms/b/index.ts'
        ),
      ]
    );
  });

  it('admits collaboration only after peers move into ordered Sub-Categories', async () => {
    await scenario(
      linkedFragments('src/_utils/a', 'src/_utils/b', '../b/index.js'),
      rootLayer(),
      'peer-separation',
      [dependency('src/_utils/a/a.util.ts', 'src/_utils/b/index.ts')]
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

const publicTree = {
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
      : [dependency('consumer.ts', target, 'dependency/tree-frontier')]
  );
};

describe('acceptance: Public Surface designation and structural determination', () => {
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
      valid
        ? []
        : [
            diagnostic(
              'fafconfig.ts',
              path,
              'configuration/public-root-node-not-enumerated',
              `'${path}' must be an enumerated root node of its tree in publicRootNodes (FAF §7.1).`,
              'configuration'
            ),
          ]
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
    'allows %s designated Root Nodes without an origin barrel',
    async (count) => {
      const names = ['a.ts', 'b.ts', 'c.ts'];
      await scenario(
        Object.fromEntries(
          names.map((name) => [`src/${name}`, 'export const value = 1;\n'])
        ),
        {
          faf: {
            locals: [
              {
                publicRootNodes: names
                  .slice(0, count)
                  .map((name) => `src/${name}`),
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

describe('acceptance: structural scenarios owned by adjacent norms', () => {
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
        diagnostic(
          'fafconfig.ts',
          'faf.locals[0].roles[0].implicitRoleExtensions[0]',
          'configuration/invalid-implicit-extension',
          "'faf.locals[0].roles[0].implicitRoleExtensions[0]' must start with a dot and contain only lowercase letters (FAF §6.3.1).",
          'configuration'
        ),
      ]
    );
  });

  it('rejects a mimetic designation on a Category Node Role', async () => {
    await scenario(
      { 'src/_types/value.type.ts': 'export type TValue = string;\n' },
      rootLayer({ mimeticPathStructures: [{ paths: ['src/_types'] }] }),
      'classify-taxonomy',
      [
        diagnostic(
          'fafconfig.ts',
          'src/_types',
          'configuration/incompatible-mimetic-designation',
          "'src/_types' must identify a Category of Fragments (FAF §6.3.5).",
          'configuration'
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
        diagnostic(
          'src/_components/_pages/home/home.page.ts',
          'src/_components/_pages',
          'classification/containment-matrix',
          "Domain 'src/_components/_pages' is not allowed in its direct parent."
        ),
      ]
    );
  });

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
      'src/_apis/value.type.ts',
      'export type TValue = string;\n',
    ],
    ['Access Node', 'src/_apis/index.ts', 'export {};\n'],
  ])('rejects direct mimetic %s', async (_kind, path, contents) => {
    await scenario({ [path]: contents }, mimetic(), 'containment-matrix', [
      diagnostic(
        path,
        path,
        'classification/containment-matrix',
        `Node '${path}' is not allowed in its direct parent.`
      ),
    ]);
  });

  it('keeps mimetic Private Categories private across nested Root Fragments', async () => {
    await scenario(
      {
        ...fragment('src/_apis/_todos/get-todos', 'api'),
        'src/main.ts': 'export const main = 1;\n',
        'src/route/page.ts':
          "import { value } from '../_apis/_todos/get-todos/index.js';\nexport const page = value;\n",
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
        dependency(
          'src/route/page.ts',
          'src/_apis/_todos/get-todos/index.ts',
          'dependency/private-category-visibility'
        ),
      ]
    );
  });

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
        dependency(
          'src/_utils/widget/widget.util.ts',
          'src/AppEntry.ts',
          'dependency/root-node-discipline'
        ),
      ]
    );
  });

  it('keeps Foreign Node import isolation despite free names', async () => {
    await scenario(
      {
        ...fragment('src/_utils/widget'),
        'src/_utils/widget/widget.util.ts':
          "import '../../Design.Notes.js';\nexport const value = 1;\n",
        'src/Design.Notes.ts': 'export const notes = 1;\n',
      },
      rootLayer({ foreignNodes: ['src/Design.Notes.ts'] }),
      'foreign-node-isolation',
      [
        dependency(
          'src/_utils/widget/widget.util.ts',
          'src/Design.Notes.ts',
          'dependency/foreign-node-isolation'
        ),
      ]
    );
  });
  it.each([
    ['button.component.tsx', 'component'],
    ['button.module.css', 'module'],
    ['user-profile.type.ts', 'type'],
    ['bundle.archive.tar.gz', 'archive'],
    ['bundle.tar.gz', 'archive'],
  ])('recognizes the explicit or implicit Role of %s', async (name, role) => {
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
  });

  it.each([
    'index.ts',
    'button.component.hook.tsx',
    'example.util.spec.ts',
    'user.profile.type.ts',
    'button.unknown.ts',
    'globals.d.ts',
  ])('rejects absent Role in a Category for %s', async (name) => {
    const path = `src/_types/${name}`;
    await scenario(
      { [path]: 'export type TValue = string;\n' },
      rootLayer(),
      'category-role',
      [
        diagnostic(
          path,
          path,
          'classification/category-role',
          `Node '${path}' does not have the Role imposed by its Category.`
        ),
      ]
    );
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
              diagnostic(
                'fafconfig.ts',
                'faf.locals[0].roles[1].implicitRoleExtensions[0]',
                'configuration/implicit-extension-role-name-prefix',
                `'faf.locals[0].roles[1].implicitRoleExtensions[0]' cannot start with a segment matching a role name: First segment "${extension.split('.', 2)[1] ?? ''}" of implicit extension "${extension}" cannot match a role name (FAF §6.3.1).`,
                'configuration'
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
  ])(
    'limits implicit Roles to Asset Category Nodes in %s',
    async (_kind, path, valid) => {
      await scenario(
        { ...fragment('src/_utils/widget'), [path]: 'body {}\n' },
        rootLayer({
          roles: [
            ...roles,
            { category: '_fonts', isCategoryNode: true, name: 'font' },
          ],
        }),
        'category-role',
        valid
          ? []
          : [
              diagnostic(
                path,
                path,
                'classification/category-role',
                `Node '${path}' does not have the Role imposed by its Category.`
              ),
            ]
      );
    }
  );

  it('does not infer an implicit Role for a Root Node Asset', async () => {
    await scenario(
      { 'src/main.css': 'body {}\n' },
      {
        faf: {
          locals: [
            {
              roles,
              rootFragments: [{ path: 'src', rootNodes: [['main.css']] }],
            },
          ],
        },
      },
      'nomenclature'
    );
  });

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
      valid
        ? []
        : [
            diagnostic(
              'fafconfig.ts',
              path,
              'classification/category-role',
              `Node '${path}' does not have the Role imposed by its Category.`
            ),
          ]
    );
  });

  it('allows a designated mimetic Category to mix coordinates and units', async () => {
    await scenario(
      {
        ...fragment('src/_apis/root', 'api'),
        ...fragment('src/_apis/_todos/list', 'api'),
      },
      mimetic(),
      'exclusive-forms'
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
      [
        diagnostic(
          'fafconfig.ts',
          'src/_apis',
          'classification/exclusive-forms',
          "Domain 'src/_apis' mixes mutually exclusive forms."
        ),
      ]
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
        diagnostic(
          'src/_apis/_todos/_[todo-id]/_status/patch-todo-status/patch-todo-status.util.ts',
          'src/_apis/_todos/_[todo-id]/_status/patch-todo-status/patch-todo-status.util.ts',
          'classification/category-role',
          "Node 'src/_apis/_todos/_[todo-id]/_status/patch-todo-status/patch-todo-status.util.ts' does not have the Role imposed by its Category."
        ),
      ]
    );
  });

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
    await scenario(
      {
        ...fragment('src/_apis/_todos/get-todos', 'api'),
        ...fragment('src/_apis/_todos/_[todo-id]/get-todo', 'api'),
        'src/_apis/_todos/get-todos/get-todos.api.ts':
          "import { value } from '../_[todo-id]/get-todo/index.js';\nexport const all = value;\n",
      },
      mimetic(['get']),
      'peer-separation',
      [
        dependency(
          'src/_apis/_todos/get-todos/get-todos.api.ts',
          'src/_apis/_todos/_[todo-id]/get-todo/index.ts'
        ),
      ]
    );
  });

  it('extraction into a Private Category does not compare the parent and child internal ranks', async () => {
    const tree = {
      ...fragment('src/_components/button', 'component'),
      'src/_components/button/button.type.ts':
        "import { value } from './_utils/normalize/index.js';\nexport type TValue = typeof value;\n",
      ...fragment('src/_components/button/_utils/normalize'),
    };
    await scenario(tree, rootLayer(), 'private-category-visibility');
    await scenario(
      {
        ...tree,
        'src/_components/button/index.ts':
          "export { value } from './_utils/normalize/index.js';\n",
      },
      rootLayer(),
      'private-category-visibility',
      [
        dependency(
          'src/_components/button/index.ts',
          'src/_components/button/_utils/normalize/index.ts',
          'dependency/private-category-visibility'
        ),
      ]
    );
  });

  it('promotion broadens consumers without exposing internal Fragment Nodes', async () => {
    await scenario(
      {
        ...fragment('src/_components/button', 'component'),
        ...fragment('src/_components/button/_button@shared/_utils/helper'),
        'src/_components/button/button.component.ts':
          "import { value } from './_button@shared/_utils/helper/index.js';\nexport const button = value;\n",
      },
      rootLayer(),
      'fractal-branch-visibility'
    );
    await scenario(
      {
        ...fragment('src/_components/button', 'component'),
        ...fragment('src/_components/button/_button@shared/_utils/helper'),
        'src/_components/button/button.component.ts':
          "import { value } from './_button@shared/_utils/helper/helper.util.js';\nexport const button = value;\n",
      },
      rootLayer(),
      'fragment-encapsulation',
      [
        dependency(
          'src/_components/button/button.component.ts',
          'src/_components/button/_button@shared/_utils/helper/helper.util.ts',
          'dependency/fragment-encapsulation'
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
        diagnostic(
          'src/_types/value/index.ts',
          'src/_types/value',
          'classification/unclassifiable-directory',
          "'src/_types/value' has no unique Logical Domain classification (FAF §6.9)."
        ),
        diagnostic(
          'src/_types/value/index.ts',
          'src/_types/value/index.ts',
          'classification/unclassifiable-file',
          "'src/_types/value/index.ts' is neither a uniquely classified Logical Node nor a Foreign Node (FAF §6.9)."
        ),
        diagnostic(
          'src/_types/value/value.type.ts',
          'src/_types/value/value.type.ts',
          'classification/unclassifiable-file',
          "'src/_types/value/value.type.ts' is neither a uniquely classified Logical Node nor a Foreign Node (FAF §6.9)."
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
      [
        diagnostic(
          'fafconfig.ts',
          'src',
          'classification/exclusive-forms',
          "Domain 'src' mixes mutually exclusive forms."
        ),
      ]
    );
  });
});
