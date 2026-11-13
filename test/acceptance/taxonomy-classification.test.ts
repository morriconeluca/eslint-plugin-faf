import type { FileTree } from 'fs-fixture';

import { beforeAll, describe, it } from 'vitest';

import type { TScenarioMessage } from '../support/acceptance-project.js';

import {
  createProject,
  expectScenario,
  lintScenario,
  warmupESLint,
} from '../support/acceptance-project.js';

const diagnostic = (
  filePath: string,
  element: string,
  constraint: string,
  detail: string,
  reference: string,
  messageId: string
): TScenarioMessage => ({
  column: 1,
  constraint,
  element,
  filePath,
  line: 1,
  message: `${constraint}: ${detail} (${reference}).`,
  messageId,
  ruleId: 'faf/conformity',
  severity: 2,
});

const runScenario = async (
  tree: FileTree,
  config: Readonly<Record<string, unknown>>,
  expected: readonly TScenarioMessage[]
): Promise<void> => {
  const fixture = await createProject(tree, config);
  try {
    expectScenario(await lintScenario(fixture.path), expected);
  } finally {
    await fixture.rm();
  }
};

describe('acceptance: taxonomy classification', () => {
  const WARMUP_TIMEOUT_MS = 120_000;

  beforeAll(warmupESLint, WARMUP_TIMEOUT_MS);

  describe('autonomous and disjoint Fractal Trees (FAF §3, §4, §6.2, §6.5)', () => {
    it('analyzes multiple independent disjoint trees', async () => {
      await runScenario(
        {
          'client/src/_components/button/button.component.tsx':
            'export const button = 1;\n',
          'client/src/_components/button/index.ts':
            "export { button } from './button.component.js';\n",
          'client/src/main.ts': 'export const main = 1;\n',
          'server/src/_services/user/index.ts':
            "export { user } from './user.service.js';\n",
          'server/src/_services/user/user.service.ts':
            'export const user = 1;\n',
        },
        {
          faf: {
            locals: [
              {
                roles: [{ category: '_components', name: 'component' }],
                rootFragments: [
                  { path: 'client/src', rootNodes: [['main.ts']] },
                ],
              },
              {
                roles: [{ category: '_services', name: 'service' }],
                rootLayers: ['server/src'],
              },
            ],
          },
        },
        []
      );
    });

    it('rejects overlapping origins: identical origins src and src', async () => {
      await runScenario(
        {
          'src/_utils/widget/index.ts':
            "export { widget } from './widget.util.js';\n",
          'src/_utils/widget/widget.util.ts': 'export const widget = 1;\n',
        },
        {
          faf: {
            locals: [
              {
                roles: [{ category: '_utils', name: 'util' }],
                rootLayers: ['src'],
              },
              {
                roles: [{ category: '_utils', name: 'util' }],
                rootLayers: ['src'],
              },
            ],
          },
        },
        [
          diagnostic(
            'fafconfig.ts',
            'src',
            'configuration/duplicate-origin',
            "'src' is declared more than once as a tree origin",
            'FAF §3',
            'configuration'
          ),
        ]
      );
    });

    it('rejects overlapping origins: nested origins src and src/app', async () => {
      await runScenario(
        {
          'src/_utils/widget/index.ts':
            "export { widget } from './widget.util.js';\n",
          'src/_utils/widget/widget.util.ts': 'export const widget = 1;\n',
          'src/app': {},
        },
        {
          faf: {
            locals: [
              {
                roles: [{ category: '_utils', name: 'util' }],
                rootLayers: ['src', 'src/app'],
              },
            ],
          },
        },
        [
          diagnostic(
            'fafconfig.ts',
            'src/app',
            'configuration/overlapping-origins',
            "'src/app' overlaps with another declared tree origin: Origin 'src/app' is contained within origin 'src'",
            'FAF §3',
            'configuration'
          ),
        ]
      );
    });

    it('recognizes nested route as Root Fragment of the same tree admitting direct containment', async () => {
      await runScenario(
        {
          'app/blog/article/page.tsx': 'export const page = 1;\n',
          'app/blog/page.tsx': 'export const page = 1;\n',
          'app/page.tsx': 'export const page = 1;\n',
        },
        {
          faf: {
            locals: [
              {
                roles: [{ category: '_components', name: 'component' }],
                rootFragments: [
                  {
                    path: 'app',
                    rootNodes: [['page.tsx']],
                    subRootFragments: [
                      {
                        path: 'app/blog',
                        rootNodes: [['page.tsx']],
                        subRootFragments: [
                          {
                            path: 'app/blog/article',
                            rootNodes: [['page.tsx']],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
        []
      );
    });

    it('does not apply taxonomy to files external to trees', async () => {
      await runScenario(
        {
          'scripts/Build.Tool.ts': 'export const tool = 1;\n',
          'src/_utils/widget/index.ts':
            "export { widget } from './widget.util.js';\n",
          'src/_utils/widget/widget.util.ts': 'export const widget = 1;\n',
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
        },
        []
      );
    });

    it('requires tree origin to be Root Fragment or Root Layer, rejecting other domain types', async () => {
      await runScenario(
        {
          'src/_utils/widget/index.ts':
            "export { widget } from './widget.util.js';\n",
          'src/_utils/widget/widget.util.ts': 'export const widget = 1;\n',
        },
        {
          faf: {
            locals: [
              {
                layers: ['src'],
                roles: [{ category: '_utils', name: 'util' }],
              },
            ],
          },
        },
        [
          diagnostic(
            'fafconfig.ts',
            'faf.locals[0]',
            'configuration/missing-origin',
            "'faf.locals[0]' must be an existing tree origin directory",
            'FAF §3',
            'configuration'
          ),
          diagnostic(
            'fafconfig.ts',
            'faf.locals[0].layers',
            'configuration/unknown-property',
            "'faf.locals[0].layers' is not a recognized property",
            'FAF §1.2, §6.9',
            'configuration'
          ),
        ]
      );
    });

    it('requires explicit Root Fragment designation and does not infer it from file names', async () => {
      await runScenario(
        {
          'src/blog/layout.tsx': 'export const layout = 1;\n',
          'src/blog/page.tsx': 'export const page = 1;\n',
          'src/main.ts': 'export const main = 1;\n',
        },
        {
          faf: {
            locals: [
              {
                roles: [{ category: '_components', name: 'component' }],
                rootFragments: [{ path: 'src', rootNodes: [['main.ts']] }],
              },
            ],
          },
        },
        [
          diagnostic(
            'fafconfig.ts',
            'src/blog',
            'configuration/undeclared-sub-root-fragment',
            "'src/blog' must be declared in subRootFragments",
            'FAF §6.2',
            'configuration'
          ),
          diagnostic(
            'src/blog/layout.tsx',
            'src/blog',
            'classification/unclassifiable-directory',
            "'src/blog' has no unique Logical Domain classification",
            'FAF §6.9',
            'classification'
          ),
          diagnostic(
            'src/blog/layout.tsx',
            'src/blog/layout.tsx',
            'classification/unclassifiable-file',
            "'src/blog/layout.tsx' is neither a uniquely classified Logical Node nor a Foreign Node",
            'FAF §6.9',
            'classification'
          ),
          diagnostic(
            'src/blog/page.tsx',
            'src/blog/page.tsx',
            'classification/unclassifiable-file',
            "'src/blog/page.tsx' is neither a uniquely classified Logical Node nor a Foreign Node",
            'FAF §6.9',
            'classification'
          ),
        ]
      );
    });
  });

  describe('classification completeness before ordering and authorization (FAF §4, §6.3, §6.7, §6.9)', () => {
    it('associates exact catalog names without linguistic inference', async () => {
      await runScenario(
        {
          'src/_utils/widget/index.ts':
            "export { widget } from './widget.util.js';\n",
          'src/_utils/widget/widget.util.ts': 'export const widget = 1;\n',
        },
        {
          faf: {
            locals: [
              {
                roles: [
                  { category: '_people', name: 'person' },
                  { category: '_utils', name: 'util' },
                ],
                rootLayers: ['src'],
              },
            ],
          },
        },
        []
      );
    });

    it('punctual Foreign Domain prevails over Category name', async () => {
      await runScenario(
        {
          'src/_configs/secret.ts': 'export const secret = 1;\n',
          'src/_domain/_configs/app/app.config.ts': 'export const app = 1;\n',
          'src/_domain/_configs/app/index.ts':
            "export { app } from './app.config.js';\n",
        },
        {
          faf: {
            locals: [
              {
                foreignDomains: ['src/_configs'],
                mimeticPathStructures: [{ paths: ['src/_configs'] }],
                roles: [{ category: '_configs', name: 'config' }],
                rootLayers: ['src'],
              },
            ],
          },
        },
        [
          diagnostic(
            'fafconfig.ts',
            'src/_configs',
            'configuration/incompatible-mimetic-designation',
            "'src/_configs' must identify a Category of Fragments",
            'FAF §6.3.5',
            'configuration'
          ),
        ]
      );
    });

    it('mimetic segment prevails over nominal Category association', async () => {
      await runScenario(
        {
          'src/_apis/_pages/get-pages/get-pages.api.ts':
            'export const getPages = 1;\n',
          'src/_apis/_pages/get-pages/index.ts':
            "export { getPages } from './get-pages.api.js';\n",
        },
        {
          faf: {
            locals: [
              {
                mimeticPathStructures: [
                  { actions: ['get'], paths: ['src/_apis'] },
                ],
                roles: [
                  { category: '_apis', name: 'api' },
                  { category: '_pages', name: 'page' },
                ],
                rootLayers: ['src'],
              },
            ],
          },
        },
        []
      );
    });

    it('directory named after Category cannot be reinterpreted as Sub-Category: under Category _components', async () => {
      await runScenario(
        {
          'src/_components/_pages': {},
          'src/_components/button/button.component.tsx':
            'export const button = 1;\n',
          'src/_components/button/index.ts':
            "export { button } from './button.component.js';\n",
        },
        {
          faf: {
            locals: [
              {
                roles: [
                  { category: '_components', name: 'component' },
                  { category: '_pages', name: 'page' },
                ],
                rootLayers: ['src'],
              },
            ],
          },
        },
        [
          diagnostic(
            'fafconfig.ts',
            'src/_components/_pages',
            'classification/containment-matrix',
            "'src/_components/_pages' is a child type that its parent Logical Domain does not admit",
            'FAF §6.8',
            'classification'
          ),
        ]
      );
    });

    it('directory named after Category cannot be reinterpreted as Sub-Category: under Sub-Category _atoms of _components', async () => {
      await runScenario(
        {
          'src/_components/_atoms/_pages': {},
          'src/_components/_atoms/button/button.component.tsx':
            'export const button = 1;\n',
          'src/_components/_atoms/button/index.ts':
            "export { button } from './button.component.js';\n",
        },
        {
          faf: {
            locals: [
              {
                roles: [
                  { category: '_components', name: 'component' },
                  { category: '_pages', name: 'page' },
                ],
                rootLayers: ['src'],
              },
            ],
          },
        },
        [
          diagnostic(
            'fafconfig.ts',
            'src/_components/_atoms/_pages',
            'classification/containment-matrix',
            "'src/_components/_atoms/_pages' is a child type that its parent Logical Domain does not admit",
            'FAF §6.8',
            'classification'
          ),
        ]
      );
    });

    it('recognizes Layers by exclusion in eligible containers', async () => {
      await runScenario(
        {
          'src/_domain/_utils/widget/index.ts':
            "export { widget } from './widget.util.js';\n",
          'src/_domain/_utils/widget/widget.util.ts':
            'export const widget = 1;\n',
          'src/_network/_domain/_utils/client/client.util.ts':
            'export const client = 1;\n',
          'src/_network/_domain/_utils/client/index.ts':
            "export { client } from './client.util.js';\n",
          'src/_src@shared/_domain/_utils/helper/helper.util.ts':
            'export const helper = 1;\n',
          'src/_src@shared/_domain/_utils/helper/index.ts':
            "export { helper } from './helper.util.js';\n",
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
        },
        []
      );
    });

    it('recognizes Sub-Categories and Path Sub-Categories by exclusion and placement', async () => {
      await runScenario(
        {
          'src/_apis/_todos/get-todos/get-todos.api.ts':
            'export const getTodos = 1;\n',
          'src/_apis/_todos/get-todos/index.ts':
            "export { getTodos } from './get-todos.api.js';\n",
          'src/_components/_atoms/button/button.component.tsx':
            'export const button = 1;\n',
          'src/_components/_atoms/button/index.ts':
            "export { button } from './button.component.js';\n",
        },
        {
          faf: {
            locals: [
              {
                mimeticPathStructures: [
                  { actions: ['get'], paths: ['src/_apis'] },
                ],
                roles: [
                  { category: '_components', name: 'component' },
                  { category: '_apis', name: 'api' },
                ],
                rootLayers: ['src'],
              },
            ],
          },
        },
        []
      );
    });

    it('recognizes Fractal Branch from reserved name', async () => {
      await runScenario(
        {
          'src/_apis/_apis@shared/_utils/helper/helper.util.ts':
            'export const helper = 1;\n',
          'src/_apis/_apis@shared/_utils/helper/index.ts':
            "export { helper } from './helper.util.js';\n",
          'src/_apis/get-todos/get-todos.api.ts':
            'export const getTodos = 1;\n',
          'src/_apis/get-todos/index.ts':
            "export { getTodos } from './get-todos.api.js';\n",
        },
        {
          faf: {
            locals: [
              {
                roles: [
                  { category: '_apis', name: 'api' },
                  { category: '_utils', name: 'util' },
                ],
                rootLayers: ['src'],
              },
            ],
          },
        },
        []
      );
    });

    it('does not allow unclassifiable files to escape classification due to lack of imports', async () => {
      await runScenario(
        {
          'src/_utils/widget/index.ts':
            "export { widget } from './widget.util.js';\n",
          'src/_utils/widget/widget.util.ts': 'export const widget = 1;\n',
          'src/notes/orphan.ts': 'export const orphan = 1;\n',
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
        },
        [
          diagnostic(
            'src/notes/orphan.ts',
            'src/notes',
            'classification/unclassifiable-directory',
            "'src/notes' has no unique Logical Domain classification",
            'FAF §6.9',
            'classification'
          ),
          diagnostic(
            'src/notes/orphan.ts',
            'src/notes/orphan.ts',
            'classification/unclassifiable-file',
            "'src/notes/orphan.ts' is neither a uniquely classified Logical Node nor a Foreign Node",
            'FAF §6.9',
            'classification'
          ),
        ]
      );
    });
  });
});
