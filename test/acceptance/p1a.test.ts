import type { FileTree } from 'fs-fixture';

import { createFixture } from 'fs-fixture';
import nodePath from 'node:path';
import { beforeAll, describe, it } from 'vitest';

import type { TScenarioMessage } from '../support/acceptance-project.js';

import {
  createProject,
  expectScenario,
  lintScenario,
  warmupESLint,
} from '../support/acceptance-project.js';

const defaultRoles = [
  { category: '_utils', name: 'util' },
  { category: '_types', isCategoryNode: true, name: 'type' },
];

const defaultTree: FileTree = {
  'src/_utils/widget/index.ts': "export { widget } from './widget.util.js';\n",
  'src/_utils/widget/widget.util.ts':
    "export function widget() {\n  return 'ok';\n}\n",
};

const configMessage = ({
  constraint,
  detail,
  element,
  family = 'configuration',
  filePath = 'fafconfig.ts',
  predicate,
  reference,
}: {
  readonly constraint: string;
  readonly detail?: string;
  readonly element: string;
  readonly family?: string;
  readonly filePath?: string;
  readonly predicate: string;
  readonly reference: string;
}): TScenarioMessage => {
  const detailText =
    detail === undefined || detail === ''
      ? ''
      : `: ${detail.replace(/\.$/, '')}`;
  return {
    column: 1,
    constraint,
    element,
    filePath,
    line: 1,
    message: `${constraint}: '${element}' ${predicate}${detailText} (${reference}).`,
    messageId: family,
    ruleId: 'faf/conformity',
    severity: 2,
  };
};

const runScenario = async (
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

const runDynamicScenario = async (
  tree: FileTree,
  config: Readonly<Record<string, unknown>>,
  getExpected: (projectPath: string) => readonly TScenarioMessage[]
): Promise<void> => {
  const project = await createProject(tree, config);
  try {
    expectScenario(
      await lintScenario(project.path),
      'prepare-project',
      getExpected(project.path)
    );
  } finally {
    await project.rm();
  }
};

const runRawScenario = async (
  tree: FileTree,
  rawConfig: string,
  getExpected: (projectPath: string) => readonly TScenarioMessage[] = () => []
): Promise<void> => {
  const project = await createFixture({
    'package.json': JSON.stringify({ type: 'module' }),
    ...tree,
    'fafconfig.ts': rawConfig,
  });
  try {
    expectScenario(
      await lintScenario(project.path),
      'prepare-project',
      getExpected(project.path)
    );
  } finally {
    await project.rm();
  }
};

describe('Rule 35: Il formato è un modulo TypeScript che esporta dati architetturali', () => {
  const WARMUP_TIMEOUT_MS = 120_000;

  beforeAll(warmupESLint, WARMUP_TIMEOUT_MS);

  it('loads a composite configuration object with comments, constants, imports and spread', async () => {
    await runRawScenario(
      {
        ...defaultTree,
        'roles.ts':
          "export const sharedRoles = [{ category: '_utils', name: 'util' }];\n",
      },
      `
        import { sharedRoles } from './roles.ts';
        const shared = { roles: sharedRoles };
        const local = { rootLayers: ['src'] };
        export default {
          faf: {
            common: { ...shared },
            locals: [{ ...local }],
          },
        };
      `,
      () => []
    );
  });

  it('rejects default export of a function instead of an object', async () => {
    await runRawScenario(
      defaultTree,
      `export default function () {
        return { faf: { locals: [{ roles: [{ category: '_utils', name: 'util' }], rootLayers: ['src'] }] } };
      };\n`,
      (projectPath) => [
        configMessage({
          constraint: 'configuration/invalid-default-export-function',
          element: nodePath.join(projectPath, 'fafconfig.ts'),
          predicate: 'cannot export a function as its default export',
          reference: 'D-09',
        }),
      ]
    );
  });

  it('rejects default export of a Promise instead of an object', async () => {
    await runRawScenario(
      defaultTree,
      `export default Promise.resolve({
        faf: { locals: [{ roles: [{ category: '_utils', name: 'util' }], rootLayers: ['src'] }] },
      });\n`,
      (projectPath) => [
        configMessage({
          constraint: 'configuration/invalid-default-export-promise',
          element: nodePath.join(projectPath, 'fafconfig.ts'),
          predicate: 'cannot export a Promise as its default export',
          reference: 'D-09',
        }),
      ]
    );
  });

  it('rejects missing root property faf', async () => {
    await runScenario(defaultTree, {}, 'prepare-project', [
      configMessage({
        constraint: 'configuration/missing-property',
        element: 'faf',
        predicate: 'is required and missing',
        reference: 'D-14',
      }),
    ]);
  });

  it('rejects root property trees', async () => {
    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
        trees: [],
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/unknown-property',
          element: 'trees',
          predicate: 'is not a recognized property',
          reference: 'D-14',
        }),
      ]
    );
  });

  it('rejects root property $schema', async () => {
    await runScenario(
      defaultTree,
      {
        $schema: 'https://example.com/schema.json',
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/unknown-property',
          element: '$schema',
          predicate: 'is not a recognized property',
          reference: 'D-14',
        }),
      ]
    );
  });

  it('rejects property layers in a configuration', async () => {
    await runScenario(
      defaultTree,
      {
        faf: {
          common: {
            layers: [],
          },
          locals: [
            {
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/unknown-property',
          element: 'faf.common.layers',
          predicate: 'is not a recognized property',
          reference: 'D-14',
        }),
      ]
    );
  });

  it('rejects property master in a Fragment declaration', async () => {
    await runScenario(
      { 'app/index.ts': "export const app = 'ok';\n" },
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootFragments: [
                {
                  master: 'main.ts',
                  path: 'app',
                  rootNodes: [['index.ts']],
                },
              ],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/unknown-property',
          element: 'faf.locals[0].rootFragments[0].master',
          predicate: 'is not a recognized property',
          reference: 'D-14',
        }),
      ]
    );
  });

  it('rejects property publicNodes in common or locals', async () => {
    await runScenario(
      defaultTree,
      {
        faf: {
          common: {
            publicNodes: [],
          },
          locals: [
            {
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/unknown-property',
          element: 'faf.common.publicNodes',
          predicate: 'is not a recognized property',
          reference: 'D-14',
        }),
      ]
    );
  });

  it('rejects property namingContracts in common or locals', async () => {
    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              namingContracts: [],
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/unknown-property',
          element: 'faf.locals[0].namingContracts',
          predicate: 'is not a recognized property',
          reference: 'D-14',
        }),
      ]
    );
  });

  it('rejects properties severity or warnings in configuration', async () => {
    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
        severity: 'error',
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/unknown-property',
          element: 'severity',
          predicate: 'is not a recognized property',
          reference: 'D-14',
        }),
      ]
    );
    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
        warnings: [],
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/unknown-property',
          element: 'warnings',
          predicate: 'is not a recognized property',
          reference: 'D-14',
        }),
      ]
    );
  });

  it('rejects unknown property in a nested role object', async () => {
    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: [
                {
                  category: '_utils',
                  extraProperty: true,
                  name: 'util',
                },
              ],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/unknown-property',
          element: 'faf.locals[0].roles[0].extraProperty',
          predicate: 'is not a recognized property',
          reference: 'D-14',
        }),
      ]
    );
  });

  it('rejects null in place of a value or missing property', async () => {
    await runScenario(
      defaultTree,
      {
        faf: null,
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/null-forbidden',
          element: 'faf',
          predicate: 'cannot be null',
          reference: 'D-14',
        }),
      ]
    );
  });

  it('rejects explicit undefined for an optional property', async () => {
    await runRawScenario(
      defaultTree,
      `export default {
        faf: {
          common: undefined,
          locals: [
            {
              roles: [{ category: '_utils', name: 'util' }],
              rootLayers: ['src'],
            },
          ],
        },
      };\n`,
      () => [
        configMessage({
          constraint: 'configuration/explicit-undefined',
          element: 'faf.common',
          predicate: 'cannot be explicitly undefined',
          reference: 'D-14',
        }),
      ]
    );
  });

  it('rejects empty string in a role name', async () => {
    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: [{ category: '_utils', name: '' }],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/empty-string',
          element: 'faf.locals[0].roles[0].name',
          predicate: 'cannot be an empty string',
          reference: 'D-14',
        }),
      ]
    );
  });

  it('rejects string true instead of a boolean value', async () => {
    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: [
                {
                  allowMultipleSymbols: 'true',
                  category: '_utils',
                  name: 'util',
                },
              ],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/invalid-type',
          element: 'faf.locals[0].roles[0].allowMultipleSymbols',
          predicate: 'has an invalid type',
          reference: 'D-14',
        }),
      ]
    );
  });

  it('rejects empty selector list for paths', async () => {
    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              foreignNodes: [{ paths: [], patterns: ['*.md'] }],
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/empty-list',
          element: 'faf.locals[0].foreignNodes[0].paths',
          predicate: 'cannot be an empty list',
          reference: 'D-14',
        }),
      ]
    );
  });

  it('rejects duplicate element repetition in paths selector list', async () => {
    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              foreignNodes: [{ paths: ['src', 'src'], patterns: ['*.md'] }],
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/duplicate-element',
          element: 'faf.locals[0].foreignNodes[0].paths[1]',
          predicate: 'is a duplicate element',
          reference: 'D-14',
        }),
      ]
    );
  });

  it('preserves declarations regardless of property order in configuration objects', async () => {
    await runScenario(
      defaultTree,
      {
        faf: {
          common: { roles: defaultRoles },
          locals: [{ rootLayers: ['src'] }],
        },
      },
      'prepare-project',
      []
    );
    await runRawScenario(
      defaultTree,
      `export default {
        faf: {
          locals: [{ roles: [{ category: '_utils', name: 'util' }], rootLayers: ['src'] }],
          common: { subGraphRoles: [{ name: 'spec' }] },
        },
      };\n`,
      () => []
    );
  });

  it('distinguishes empty optional arrays and non-empty mandatory selectors', async () => {
    await runScenario(
      defaultTree,
      {
        faf: {
          common: {
            externalDependencies: [],
            foreignDomains: [],
            foreignNodes: [],
            horizontalHierarchies: [],
            localHorizontalHierarchies: [],
            mimeticPathStructures: [],
            publicRootNodes: [],
            roles: defaultRoles,
            subGraphRoles: [],
            treeDependencies: [],
          },
          locals: [{ rootLayers: ['src'] }],
        },
      },
      'prepare-project',
      []
    );
    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: [[]],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/empty-list',
          element: 'faf.locals[0].roles[0]',
          predicate: 'cannot be an empty list',
          reference: 'D-14',
        }),
      ]
    );
    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              horizontalHierarchies: [[[]]],
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/empty-tier',
          element: 'faf.locals[0].horizontalHierarchies[0][0]',
          predicate: 'cannot be an empty tier',
          reference: 'D-14',
        }),
      ]
    );
    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              mimeticPathStructures: [{ actions: [], paths: ['src/_utils'] }],
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/empty-list',
          element: 'faf.locals[0].mimeticPathStructures[0].actions',
          predicate: 'cannot be an empty list',
          reference: 'D-14',
        }),
      ]
    );
    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: [
                {
                  category: '_fonts',
                  implicitRoleExtensions: [],
                  name: 'font',
                },
              ],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/empty-list',
          element: 'faf.locals[0].roles[0].implicitRoleExtensions',
          predicate: 'cannot be an empty list',
          reference: 'D-14',
        }),
      ]
    );
  });
});

describe('Rule 36: Ogni oggetto del formato ha un contratto chiuso indipendente dalla sua costruzione TypeScript', () => {
  it('verifies all mandatory and admitted properties across the 14 configuration object types', async () => {
    await runScenario(defaultTree, {}, 'prepare-project', [
      configMessage({
        constraint: 'configuration/missing-property',
        element: 'faf',
        predicate: 'is required and missing',
        reference: 'D-14',
      }),
    ]);
    await runScenario(
      defaultTree,
      {
        extra: true,
        faf: { locals: [{ roles: defaultRoles, rootLayers: ['src'] }] },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/unknown-property',
          element: 'extra',
          predicate: 'is not a recognized property',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(defaultTree, { faf: {} }, 'prepare-project', [
      configMessage({
        constraint: 'configuration/missing-property',
        element: 'faf.locals',
        predicate: 'is required and missing',
        reference: 'D-14',
      }),
    ]);
    await runScenario(
      defaultTree,
      {
        faf: {
          extra: true,
          locals: [{ roles: defaultRoles, rootLayers: ['src'] }],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/unknown-property',
          element: 'faf.extra',
          predicate: 'is not a recognized property',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: [{ category: '_utils' }],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/missing-property',
          element: 'faf.locals[0].roles[0].name',
          predicate: 'is required and missing',
          reference: 'D-14',
        }),
      ]
    );
    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: [{ name: 'util' }],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/missing-property',
          element: 'faf.locals[0].roles[0].category',
          predicate: 'is required and missing',
          reference: 'D-14',
        }),
      ]
    );
    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: [
                {
                  category: '_utils',
                  extraProperty: true,
                  name: 'util',
                },
              ],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/unknown-property',
          element: 'faf.locals[0].roles[0].extraProperty',
          predicate: 'is not a recognized property',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootLayers: ['src'],
              subGraphRoles: [{}],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/missing-property',
          element: 'faf.locals[0].subGraphRoles[0].name',
          predicate: 'is required and missing',
          reference: 'D-14',
        }),
      ]
    );
    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootLayers: ['src'],
              subGraphRoles: [{ category: '_specs', name: 'spec' }],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/unknown-property',
          element: 'faf.locals[0].subGraphRoles[0].category',
          predicate: 'is not a recognized property',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      { 'app/index.ts': "export const app = 'ok';\n" },
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootFragments: [{ rootNodes: [['index.ts']] }],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/missing-property',
          element: 'faf.locals[0].rootFragments[0].path',
          predicate: 'is required and missing',
          reference: 'D-14',
        }),
      ]
    );
    await runScenario(
      { 'app/index.ts': "export const app = 'ok';\n" },
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootFragments: [{ path: 'app' }],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/missing-property',
          element: 'faf.locals[0].rootFragments[0].rootNodes',
          predicate: 'is required and missing',
          reference: 'D-14',
        }),
      ]
    );
    await runScenario(
      { 'app/index.ts': "export const app = 'ok';\n" },
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootFragments: [
                {
                  extra: true,
                  path: 'app',
                  rootNodes: [['index.ts']],
                },
              ],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/unknown-property',
          element: 'faf.locals[0].rootFragments[0].extra',
          predicate: 'is not a recognized property',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      { 'app/index.ts': 'export const a = 1;\n' },
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootFragments: [
                {
                  dependencyEdges: [{ to: ['app/index.ts'] }],
                  path: 'app',
                  rootNodes: [['index.ts']],
                },
              ],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/missing-property',
          element: 'faf.locals[0].rootFragments[0].dependencyEdges[0].from',
          predicate: 'is required and missing',
          reference: 'D-14',
        }),
      ]
    );
    await runScenario(
      { 'app/index.ts': 'export const a = 1;\n' },
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootFragments: [
                {
                  dependencyEdges: [{ from: ['index.ts'] }],
                  path: 'app',
                  rootNodes: [['index.ts']],
                },
              ],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/missing-property',
          element: 'faf.locals[0].rootFragments[0].dependencyEdges[0].to',
          predicate: 'is required and missing',
          reference: 'D-14',
        }),
      ]
    );
    await runScenario(
      { 'app/index.ts': 'export const a = 1;\n' },
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootFragments: [
                {
                  dependencyEdges: [
                    { extra: true, from: ['index.ts'], to: ['app/index.ts'] },
                  ],
                  path: 'app',
                  rootNodes: [['index.ts']],
                },
              ],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/unknown-property',
          element: 'faf.locals[0].rootFragments[0].dependencyEdges[0].extra',
          predicate: 'is not a recognized property',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              foreignNodes: [{ patterns: ['*.md'] }],
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/missing-property',
          element: 'faf.locals[0].foreignNodes[0].paths',
          predicate: 'is required and missing',
          reference: 'D-14',
        }),
      ]
    );
    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              foreignNodes: [{ paths: ['src'] }],
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/missing-property',
          element: 'faf.locals[0].foreignNodes[0].patterns',
          predicate: 'is required and missing',
          reference: 'D-14',
        }),
      ]
    );
    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              foreignNodes: [
                { extra: true, paths: ['src'], patterns: ['*.md'] },
              ],
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/unknown-property',
          element: 'faf.locals[0].foreignNodes[0].extra',
          predicate: 'is not a recognized property',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              localHorizontalHierarchies: [{ hierarchies: [] }],
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/missing-property',
          element: 'faf.locals[0].localHorizontalHierarchies[0].paths',
          predicate: 'is required and missing',
          reference: 'D-14',
        }),
      ]
    );
    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              localHorizontalHierarchies: [{ paths: ['src'] }],
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/missing-property',
          element: 'faf.locals[0].localHorizontalHierarchies[0].hierarchies',
          predicate: 'is required and missing',
          reference: 'D-14',
        }),
      ]
    );
    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              localHorizontalHierarchies: [
                { extra: true, hierarchies: [], paths: ['src'] },
              ],
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/unknown-property',
          element: 'faf.locals[0].localHorizontalHierarchies[0].extra',
          predicate: 'is not a recognized property',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              mimeticPathStructures: [{}],
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/missing-property',
          element: 'faf.locals[0].mimeticPathStructures[0].paths',
          predicate: 'is required and missing',
          reference: 'D-14',
        }),
      ]
    );
    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              mimeticPathStructures: [{ extra: true, paths: ['src/_utils'] }],
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/unknown-property',
          element: 'faf.locals[0].mimeticPathStructures[0].extra',
          predicate: 'is not a recognized property',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootLayers: ['src'],
              treeDependencies: [{ to: ['lib'] }],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/missing-property',
          element: 'faf.locals[0].treeDependencies[0].from',
          predicate: 'is required and missing',
          reference: 'D-14',
        }),
      ]
    );
    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootLayers: ['src'],
              treeDependencies: [{ from: ['src'] }],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/missing-property',
          element: 'faf.locals[0].treeDependencies[0].to',
          predicate: 'is required and missing',
          reference: 'D-14',
        }),
      ]
    );
    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootLayers: ['src'],
              treeDependencies: [{ extra: true, from: ['src'], to: ['lib'] }],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/unknown-property',
          element: 'faf.locals[0].treeDependencies[0].extra',
          predicate: 'is not a recognized property',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              externalDependencies: [{ to: ['legacy.ts'] }],
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/missing-property',
          element: 'faf.locals[0].externalDependencies[0].from',
          predicate: 'is required and missing',
          reference: 'D-14',
        }),
      ]
    );
    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              externalDependencies: [
                { from: ['src/_utils/widget/widget.util.ts'] },
              ],
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/missing-property',
          element: 'faf.locals[0].externalDependencies[0].to',
          predicate: 'is required and missing',
          reference: 'D-14',
        }),
      ]
    );
    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              externalDependencies: [
                {
                  extra: true,
                  from: ['src/_utils/widget/widget.util.ts'],
                  to: ['legacy.ts'],
                },
              ],
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/unknown-property',
          element: 'faf.locals[0].externalDependencies[0].extra',
          predicate: 'is not a recognized property',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          common: {
            extra: true,
          },
          locals: [{ roles: defaultRoles, rootLayers: ['src'] }],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/unknown-property',
          element: 'faf.common.extra',
          predicate: 'is not a recognized property',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          common: {
            rootLayers: ['src'],
          },
          locals: [{ roles: defaultRoles, rootLayers: ['src'] }],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/scope-mismatch',
          element: 'faf.common.rootLayers',
          predicate: 'cannot be declared in this configuration scope',
          reference: 'D-14',
        }),
      ]
    );
    await runScenario(
      defaultTree,
      {
        faf: {
          common: {
            rootFragments: [],
          },
          locals: [{ roles: defaultRoles, rootLayers: ['src'] }],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/scope-mismatch',
          element: 'faf.common.rootFragments',
          predicate: 'cannot be declared in this configuration scope',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/missing-origin',
          element: 'faf.locals[0]',
          predicate: 'must be an existing tree origin directory',
          reference: 'D-06',
        }),
      ]
    );
    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              aliases: {},
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/scope-mismatch',
          element: 'faf.locals[0].aliases',
          predicate: 'cannot be declared in this configuration scope',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootFragments: [],
              rootLayers: [],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/missing-origin',
          element: 'faf.locals[0]',
          predicate: 'must be an existing tree origin directory',
          reference: 'D-06',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootFragments: [],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      []
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          common: { roles: defaultRoles },
          locals: [{ rootLayers: ['src'] }],
        },
      },
      'prepare-project',
      []
    );
    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [{ rootLayers: ['src'] }],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/missing-roles',
          element: 'fafconfig.ts',
          predicate:
            'must declare a roles catalog in local or common configuration',
          reference: 'FAF §6.3.1',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: [
                {
                  allowMultipleSymbols: null,
                  category: '_utils',
                  name: 'util',
                },
              ],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/null-forbidden',
          element: 'faf.locals[0].roles[0].allowMultipleSymbols',
          predicate: 'cannot be null',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          common: {
            aliases: {
              '#custom-shared': 'src/_utils/widget',
              '#other-shared': 'src/_utils',
            },
          },
          locals: [{ roles: defaultRoles, rootLayers: ['src'] }],
        },
      },
      'prepare-project',
      []
    );
  });

  it('verifies value types without conversion across all documented properties', async () => {
    await runScenario(
      defaultTree,
      {
        faf: {
          common: 'invalid',
          locals: [{ roles: defaultRoles, rootLayers: ['src'] }],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/invalid-type',
          element: 'faf.common',
          predicate: 'has an invalid type',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: [{ category: '_utils', name: 123 }],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/invalid-type',
          element: 'faf.locals[0].roles[0].name',
          predicate: 'has an invalid type',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: [
                {
                  category: '_utils',
                  isCategoryNode: 'yes',
                  name: 'util',
                },
              ],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/invalid-type',
          element: 'faf.locals[0].roles[0].isCategoryNode',
          predicate: 'has an invalid type',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: 'not-an-array',
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/invalid-type',
          element: 'faf.locals[0].roles',
          predicate: 'has an invalid type',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      { 'app/index.ts': 'export const a = 1;\n' },
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootFragments: [{ path: 'app', rootNodes: ['index.ts'] }],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/invalid-type',
          element: 'faf.locals[0].rootFragments[0].rootNodes[0]',
          predicate: 'has an invalid type',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootLayers: 'src',
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/invalid-type',
          element: 'faf.locals[0].rootLayers',
          predicate: 'has an invalid type',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootLayers: ['src'],
              subGraphRoles: ['spec'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/invalid-type',
          element: 'faf.locals[0].subGraphRoles[0]',
          predicate: 'has an invalid type',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      { 'app/index.ts': 'export const a = 1;\n' },
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootFragments: ['app'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/invalid-type',
          element: 'faf.locals[0].rootFragments[0]',
          predicate: 'has an invalid type',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      { 'app/index.ts': 'export const a = 1;\n' },
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootFragments: [
                {
                  dependencyEdges: 'invalid',
                  path: 'app',
                  rootNodes: [['index.ts']],
                },
              ],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/invalid-type',
          element: 'faf.locals[0].rootFragments[0].dependencyEdges',
          predicate: 'has an invalid type',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              foreignNodes: 'invalid',
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/invalid-type',
          element: 'faf.locals[0].foreignNodes',
          predicate: 'has an invalid type',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              horizontalHierarchies: 'invalid',
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/invalid-type',
          element: 'faf.locals[0].horizontalHierarchies',
          predicate: 'has an invalid type',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              localHorizontalHierarchies: ['invalid'],
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/invalid-type',
          element: 'faf.locals[0].localHorizontalHierarchies[0]',
          predicate: 'has an invalid type',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              mimeticPathStructures: ['src/_apis'],
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/invalid-type',
          element: 'faf.locals[0].mimeticPathStructures[0]',
          predicate: 'has an invalid type',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootLayers: ['src'],
              treeDependencies: 'invalid',
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/invalid-type',
          element: 'faf.locals[0].treeDependencies',
          predicate: 'has an invalid type',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootLayers: ['src'],
              treeDependencies: [{ from: 'src', to: ['lib'] }],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/invalid-type',
          element: 'faf.locals[0].treeDependencies[0].from',
          predicate: 'has an invalid type',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              mimeticPathStructures: [
                { actions: 'index', paths: ['src/_utils'] },
              ],
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/invalid-type',
          element: 'faf.locals[0].mimeticPathStructures[0].actions',
          predicate: 'has an invalid type',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: 'invalid',
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/invalid-type',
          element: 'faf.locals',
          predicate: 'has an invalid type',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          common: {
            aliases: ['#a'],
          },
          locals: [{ roles: defaultRoles, rootLayers: ['src'] }],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/invalid-type',
          element: 'faf.common.aliases',
          predicate: 'has an invalid type',
          reference: 'D-14',
        }),
      ]
    );
  });

  it('determines set order invariance and rejects hierarchy repetitions', async () => {
    const doubleTree: FileTree = {
      ...defaultTree,
      'src/a.md': '',
      'src/b.md': '',
    };
    await runScenario(
      doubleTree,
      {
        faf: {
          locals: [
            {
              foreignNodes: ['src/a.md', 'src/b.md'],
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      []
    );
    await runScenario(
      doubleTree,
      {
        faf: {
          locals: [
            {
              foreignNodes: ['src/b.md', 'src/a.md'],
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      []
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              horizontalHierarchies: [[['_utils'], ['_utils']]],
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/duplicate-element',
          element: 'faf.locals[0].horizontalHierarchies[0][1][0]',
          predicate: 'is a duplicate element',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              horizontalHierarchies: [],
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      []
    );
  });
});

describe('Rule 37: Common e locals compongono configurazioni per proprietà intere', () => {
  it('identifies multiple trees with shared catalog from a single locals element', async () => {
    await runScenario(
      {
        'app/index.ts': 'export const a = 1;\n',
        'packages/a/src/_utils/widget/index.ts':
          "export { widget } from './widget.util.js';\n",
        'packages/a/src/_utils/widget/widget.util.ts':
          "export function widget() { return 'a'; }\n",
        'packages/b/src/_utils/widget/index.ts':
          "export { widget } from './widget.util.js';\n",
        'packages/b/src/_utils/widget/widget.util.ts':
          "export function widget() { return 'b'; }\n",
      },
      {
        faf: {
          common: { roles: defaultRoles },
          locals: [
            { rootLayers: ['packages/a/src', 'packages/b/src'] },
            { rootFragments: [{ path: 'app', rootNodes: [['index.ts']] }] },
          ],
        },
      },
      'prepare-project',
      []
    );
  });

  it('verifies unique local owner for origins across all nine error examples', async () => {
    await runScenario(defaultTree, { faf: {} }, 'prepare-project', [
      configMessage({
        constraint: 'configuration/missing-property',
        element: 'faf.locals',
        predicate: 'is required and missing',
        reference: 'D-14',
      }),
    ]);

    await runScenario(defaultTree, { faf: { locals: [] } }, 'prepare-project', [
      configMessage({
        constraint: 'configuration/empty-list',
        element: 'faf.locals',
        predicate: 'cannot be an empty list',
        reference: 'D-14',
      }),
    ]);

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [{ roles: defaultRoles }],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/missing-origin',
          element: 'faf.locals[0]',
          predicate: 'must be an existing tree origin directory',
          reference: 'D-06',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootFragments: [],
              rootLayers: [],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/missing-origin',
          element: 'faf.locals[0]',
          predicate: 'must be an existing tree origin directory',
          reference: 'D-06',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          common: { rootLayers: ['src'] },
          locals: [{ roles: defaultRoles, rootLayers: ['src'] }],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/scope-mismatch',
          element: 'faf.common.rootLayers',
          predicate: 'cannot be declared in this configuration scope',
          reference: 'D-14',
        }),
      ]
    );
    await runScenario(
      defaultTree,
      {
        faf: {
          common: { rootFragments: [] },
          locals: [{ roles: defaultRoles, rootLayers: ['src'] }],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/scope-mismatch',
          element: 'faf.common.rootFragments',
          predicate: 'cannot be declared in this configuration scope',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              aliases: {},
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/scope-mismatch',
          element: 'faf.locals[0].aliases',
          predicate: 'cannot be declared in this configuration scope',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            { roles: defaultRoles, rootLayers: ['src'] },
            { roles: defaultRoles, rootLayers: ['src'] },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/duplicate-origin',
          element: 'src',
          predicate: 'is declared more than once as a tree origin',
          reference: 'D-06',
        }),
      ]
    );

    await runScenario(
      { 'src/index.ts': 'export const s = 1;\n' },
      {
        faf: {
          locals: [
            { roles: defaultRoles, rootLayers: ['src'] },
            {
              roles: defaultRoles,
              rootFragments: [{ path: 'src', rootNodes: [['index.ts']] }],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/conflicting-origin-kind',
          element: 'src',
          predicate:
            'cannot be declared as both a Root Layer and a Root Fragment',
          reference: 'D-06',
        }),
      ]
    );

    await runScenario(
      {
        ...defaultTree,
        'src/sub/pkg/widget.ts': 'export const w = 1;\n',
      },
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootLayers: ['src', 'src/sub'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/overlapping-origins',
          detail: "Origin 'src/sub' is contained within origin 'src'",
          element: 'src/sub',
          predicate: 'overlaps with another declared tree origin',
          reference: 'D-06',
        }),
      ]
    );
  });

  it('replaces property entirely without concatenating or merging by name', async () => {
    await runScenario(
      {
        'src/_queries/widget/index.ts':
          "export { widget } from './widget.query.js';\n",
        'src/_queries/widget/widget.query.ts':
          "export function widget() { return 'ok'; }\n",
      },
      {
        faf: {
          common: {
            horizontalHierarchies: [[['_utils'], ['_types']]],
            roles: [
              { category: '_types', isCategoryNode: true, name: 'type' },
              { category: '_utils', name: 'util' },
            ],
            subGraphRoles: [{ name: 'spec' }],
          },
          locals: [
            {
              horizontalHierarchies: [],
              roles: [{ category: '_queries', name: 'query' }],
              rootLayers: ['src'],
              subGraphRoles: [],
            },
          ],
        },
      },
      'prepare-project',
      []
    );
  });

  it('applies default values after property replacement and requires roles in effective config', async () => {
    await runScenario(
      {
        'src/_types/token.type.ts':
          'export type TToken = string;\nexport type TOther = number;\n',
      },
      {
        faf: {
          common: {
            roles: [
              {
                allowMultipleSymbols: true,
                category: '_types',
                isCategoryNode: true,
                name: 'type',
              },
            ],
          },
          locals: [
            {
              roles: [
                {
                  category: '_types',
                  isCategoryNode: true,
                  name: 'type',
                },
              ],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'symbol-uniqueness',
      [
        configMessage({
          constraint: 'symbol/symbol-uniqueness',
          element: 'src/_types/token.type.ts',
          family: 'symbol',
          filePath: 'src/_types/token.type.ts',
          predicate: 'defines more than one Symbol in its root scope',
          reference: 'FAF §5',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [{ rootLayers: ['src'] }],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/missing-roles',
          element: 'fafconfig.ts',
          predicate:
            'must declare a roles catalog in local or common configuration',
          reference: 'FAF §6.3.1',
        }),
      ]
    );
  });

  it('respects property scopes and defaults for all configuration properties', async () => {
    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              externalDependencies: [],
              foreignDomains: [],
              foreignNodes: [],
              horizontalHierarchies: [],
              localHorizontalHierarchies: [],
              mimeticPathStructures: [],
              publicRootNodes: [],
              roles: defaultRoles,
              rootLayers: ['src'],
              subGraphRoles: [],
              treeDependencies: [],
            },
          ],
        },
      },
      'prepare-project',
      []
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              aliases: {},
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/scope-mismatch',
          element: 'faf.locals[0].aliases',
          predicate: 'cannot be declared in this configuration scope',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          common: { rootLayers: ['src'] },
          locals: [{ roles: defaultRoles, rootLayers: ['src'] }],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/scope-mismatch',
          element: 'faf.common.rootLayers',
          predicate: 'cannot be declared in this configuration scope',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          common: { rootFragments: [] },
          locals: [{ roles: defaultRoles, rootLayers: ['src'] }],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/scope-mismatch',
          element: 'faf.common.rootFragments',
          predicate: 'cannot be declared in this configuration scope',
          reference: 'D-14',
        }),
      ]
    );
  });

  it('filters common references by tree membership without rebasing paths', async () => {
    await runScenario(
      {
        'app/main.ts': 'export const app = 1;\n',
        'app/notes.md': '',
        'lib/index.ts': 'export const lib = 1;\n',
        'lib/rules.txt': '',
      },
      {
        faf: {
          common: {
            foreignNodes: [
              { paths: ['app'], patterns: ['*.md'] },
              { paths: ['lib'], patterns: ['*.txt'] },
            ],
            publicRootNodes: ['app/main.ts'],
            roles: defaultRoles,
          },
          locals: [
            { rootFragments: [{ path: 'app', rootNodes: [['main.ts']] }] },
            { rootFragments: [{ path: 'lib', rootNodes: [['index.ts']] }] },
          ],
        },
      },
      'prepare-project',
      []
    );

    await runDynamicScenario(
      {
        'app/main.ts': 'export const app = 1;\n',
        'app/notes.md': '',
        'lib/index.ts': 'export const lib = 1;\n',
        'lib/rules.txt': '',
      },
      {
        faf: {
          common: {
            foreignNodes: [{ paths: ['nonexistent'], patterns: ['*.md'] }],
            roles: defaultRoles,
          },
          locals: [
            { rootFragments: [{ path: 'app', rootNodes: [['main.ts']] }] },
            { rootFragments: [{ path: 'lib', rootNodes: [['index.ts']] }] },
          ],
        },
      },
      (projectPath) => [
        configMessage({
          constraint: 'configuration/non-existent-path',
          detail: `Foreign family path "nonexistent" does not exist under configuration base "${projectPath}"`,
          element: 'nonexistent',
          predicate: 'does not exist',
          reference: 'D-14',
        }),
      ]
    );
  });

  it('rejects local reference attempting to classify another tree', async () => {
    await runScenario(
      {
        'app/index.ts': 'export const a = 1;\n',
        'lib/index.ts': 'export const lib = 1;\n',
      },
      {
        faf: {
          locals: [
            {
              foreignNodes: [{ paths: ['lib'], patterns: ['*.md'] }],
              roles: defaultRoles,
              rootFragments: [{ path: 'app', rootNodes: [['index.ts']] }],
            },
            {
              roles: defaultRoles,
              rootFragments: [{ path: 'lib', rootNodes: [['index.ts']] }],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/reference-outside-local-scope',
          detail:
            'Foreign family path "lib" belongs to tree "lib" outside this local configuration',
          element: 'lib',
          predicate: 'must belong to a tree within this local configuration',
          reference: 'FAF §6',
        }),
      ]
    );

    await runScenario(
      {
        'app/index.ts': 'export const a = 1;\n',
        'lib/index.ts': 'export const lib = 1;\n',
      },
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootFragments: [{ path: 'app', rootNodes: [['index.ts']] }],
              treeDependencies: [{ from: ['app'], to: ['lib'] }],
            },
            {
              roles: defaultRoles,
              rootFragments: [{ path: 'lib', rootNodes: [['index.ts']] }],
            },
          ],
        },
      },
      'prepare-project',
      []
    );

    await runScenario(
      {
        'app/index.ts': 'export const a = 1;\n',
        'lib/index.ts': 'export const lib = 1;\n',
      },
      {
        faf: {
          locals: [
            {
              externalDependencies: [
                { from: ['app/index.ts'], to: ['lib/index.ts'] },
              ],
              roles: defaultRoles,
              rootFragments: [{ path: 'app', rootNodes: [['index.ts']] }],
            },
            {
              roles: defaultRoles,
              rootFragments: [{ path: 'lib', rootNodes: [['index.ts']] }],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/external-dependency-to-inside-tree',
          element: 'lib/index.ts',
          predicate:
            'must be outside all Fractal Trees as an external dependency target',
          reference: 'FAF §7.3',
        }),
      ]
    );
  });
});

describe('Rule 38: I percorsi della configurazione hanno una base unica e non sono import abbreviati', () => {
  it('resolves all configuration paths from configuration module directory', async () => {
    await runScenario(
      {
        'app/main.ts':
          "import { child } from './sub/child.js';\nexport const app = child;\n",
        'app/sub/child.ts': 'export const child = 1;\n',
      },
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootFragments: [
                {
                  dependencyEdges: [
                    { from: ['main.ts'], to: ['app/sub/child.ts'] },
                  ],
                  path: 'app',
                  rootNodes: [['main.ts']],
                  subRootFragments: [
                    { path: 'app/sub', rootNodes: [['child.ts']] },
                  ],
                },
              ],
            },
          ],
        },
      },
      'prepare-project',
      []
    );
  });

  it('verifies the syntax of literal paths across all thirteen examples', async () => {
    await runScenario(
      {},
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootFragments: [
                {
                  path: '.',
                  rootNodes: [['fafconfig.ts', 'package.json']],
                },
              ],
            },
          ],
        },
      },
      'prepare-project',
      []
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [{ roles: defaultRoles, rootLayers: ['src'] }],
        },
      },
      'prepare-project',
      []
    );

    await runScenario(
      {
        'src/app/[todoId]/index.ts': 'export const page = 1;\n',
      },
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootFragments: [
                { path: 'src/app/[todoId]', rootNodes: [['index.ts']] },
              ],
            },
          ],
        },
      },
      'prepare-project',
      []
    );

    await runScenario(
      {
        'src/app/(auth)/index.ts': 'export const page = 1;\n',
      },
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootFragments: [
                { path: 'src/app/(auth)', rootNodes: [['index.ts']] },
              ],
            },
          ],
        },
      },
      'prepare-project',
      []
    );

    await runScenario(
      {
        'src/_apis/_[todo-id]/endpoint/endpoint.api.ts':
          'export const endpoint = 1;\n',
        'src/_apis/_[todo-id]/endpoint/index.ts':
          "export { endpoint } from './endpoint.api.js';\n",
      },
      {
        faf: {
          locals: [
            {
              mimeticPathStructures: [{ paths: ['src/_apis'] }],
              roles: [
                { category: '_apis', name: 'api' },
                { category: '_utils', name: 'util' },
              ],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      []
    );

    await runScenario(
      {
        'src/_src@shared/_utils/util/index.ts':
          "export { util } from './util.util.js';\n",
        'src/_src@shared/_utils/util/util.util.ts':
          'export function util() { return 1; }\n',
        ...defaultTree,
      },
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      []
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [{ roles: defaultRoles, rootLayers: ['/src'] }],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/invalid-literal-path',
          element: 'faf.locals[0].rootLayers[0]',
          predicate:
            'must be a POSIX relative path without empty or parent segments',
          reference: 'D-05',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [{ roles: defaultRoles, rootLayers: ['./src'] }],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/invalid-literal-path',
          element: 'faf.locals[0].rootLayers[0]',
          predicate:
            'must be a POSIX relative path without empty or parent segments',
          reference: 'D-05',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [{ roles: defaultRoles, rootLayers: ['src/'] }],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/invalid-literal-path',
          element: 'faf.locals[0].rootLayers[0]',
          predicate:
            'must be a POSIX relative path without empty or parent segments',
          reference: 'D-05',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [{ roles: defaultRoles, rootLayers: ['src//app'] }],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/invalid-literal-path',
          element: 'faf.locals[0].rootLayers[0]',
          predicate:
            'must be a POSIX relative path without empty or parent segments',
          reference: 'D-05',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [{ roles: defaultRoles, rootLayers: ['src/./app'] }],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/invalid-literal-path',
          element: 'faf.locals[0].rootLayers[0]',
          predicate:
            'must be a POSIX relative path without empty or parent segments',
          reference: 'D-05',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [{ roles: defaultRoles, rootLayers: ['src/../app'] }],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/invalid-literal-path',
          element: 'faf.locals[0].rootLayers[0]',
          predicate:
            'must be a POSIX relative path without empty or parent segments',
          reference: 'D-05',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [{ roles: defaultRoles, rootLayers: ['../src'] }],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/invalid-literal-path',
          element: 'faf.locals[0].rootLayers[0]',
          predicate:
            'must be a POSIX relative path without empty or parent segments',
          reference: 'D-05',
        }),
      ]
    );
  });

  it('requires point references to identify existing filesystem elements of expected kind', async () => {
    await runDynamicScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              foreignNodes: ['src/missing.ts'],
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      (projectPath) => [
        configMessage({
          constraint: 'configuration/non-existent-path',
          detail: `Foreign node "src/missing.ts" does not exist under configuration base "${projectPath}"`,
          element: 'src/missing.ts',
          predicate: 'does not exist',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              foreignNodes: ['src'],
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/expected-file',
          detail: 'Foreign node "src" must be a file',
          element: 'src',
          predicate: 'must be a file',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              foreignDomains: ['src/_utils/widget/widget.util.ts'],
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/expected-directory',
          detail:
            'Foreign domain "src/_utils/widget/widget.util.ts" must be a directory',
          element: 'src/_utils/widget/widget.util.ts',
          predicate: 'must be a directory',
          reference: 'D-14',
        }),
      ]
    );
  });

  it('allows empty potential categories, hierarchies and foreign matches', async () => {
    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              foreignNodes: [{ paths: ['src'], patterns: ['*.pdf'] }],
              horizontalHierarchies: [[['_empty1'], ['_empty2']]],
              roles: [...defaultRoles, { category: '_styles', name: 'style' }],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      []
    );
  });
});

describe('Rule 39: I cataloghi posizionali determinano Roles, forma delle unità e Ranks', () => {
  it('calculates positional ranks from single items and groups', async () => {
    await runScenario(
      {
        'src/_components/button/button.component.tsx':
          "export const button = 'ok';\n",
        'src/_components/button/button.type.ts':
          'export type ButtonProps = string;\n',
        'src/_components/button/index.ts':
          "export { button } from './button.component.js';\n",
      },
      {
        faf: {
          locals: [
            {
              roles: [
                [
                  {
                    category: '_fonts',
                    implicitRoleExtensions: ['.woff2'],
                    isCategoryNode: true,
                    name: 'font',
                  },
                  {
                    category: '_images',
                    implicitRoleExtensions: ['.png'],
                    isCategoryNode: true,
                    name: 'image',
                  },
                ],
                { category: '_types', name: 'type' },
                { category: '_components', name: 'component' },
              ],
              rootLayers: ['src'],
              subGraphRoles: [{ name: 'spec' }],
            },
          ],
        },
      },
      'prepare-project',
      []
    );
  });

  it('validates closed role catalog across all sixteen examples before classification', async () => {
    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: [{ category: '_utils' }],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/missing-property',
          element: 'faf.locals[0].roles[0].name',
          predicate: 'is required and missing',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: [
                { category: '_utils', name: 'util' },
                { category: '_helpers', name: 'util' },
              ],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/duplicate-role-name',
          detail: 'Duplicate role name "util"',
          element: 'faf.locals[0].roles[1].name',
          predicate: 'is declared more than once in the role catalog',
          reference: 'FAF §6.3.1',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: [
                { category: '_utils', name: 'util' },
                { category: '_utils', name: 'helper' },
              ],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/duplicate-category',
          detail: 'Category is already assigned to another role "_utils"',
          element: 'faf.locals[0].roles[1].category',
          predicate: 'is declared more than once in the role catalog',
          reference: 'FAF §6.3.1',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: [{ category: '_utils', name: 'util' }],
              rootLayers: ['src'],
              subGraphRoles: [{ name: 'util' }],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/role-name-conflict',
          detail: 'Sub-graph role "util" conflicts with standard role name',
          element: 'faf.locals[0].subGraphRoles[0].name',
          predicate: 'conflicts with a standard role name',
          reference: 'FAF §6.3.1',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootLayers: ['src'],
              subGraphRoles: [{ name: 'spec' }, { name: 'spec' }],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/duplicate-role-name',
          detail: 'Duplicate sub-graph role name "spec"',
          element: 'faf.locals[0].subGraphRoles[1].name',
          predicate: 'is declared more than once in the role catalog',
          reference: 'FAF §6.3.1',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: [[]],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/empty-list',
          element: 'faf.locals[0].roles[0]',
          predicate: 'cannot be an empty list',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: [[[{ category: '_utils', name: 'util' }]]],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/invalid-type',
          element: 'faf.locals[0].roles[0][0]',
          predicate: 'has an invalid type',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootLayers: ['src'],
              subGraphRoles: [{ category: '_specs', name: 'spec' }],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/unknown-property',
          element: 'faf.locals[0].subGraphRoles[0].category',
          predicate: 'is not a recognized property',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootLayers: ['src'],
              subGraphRoles: [{ allowMultipleSymbols: true, name: 'spec' }],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/unknown-property',
          element: 'faf.locals[0].subGraphRoles[0].allowMultipleSymbols',
          predicate: 'is not a recognized property',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: [
                {
                  category: '_fonts',
                  implicitRoleExtensions: [],
                  name: 'font',
                },
              ],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/empty-list',
          element: 'faf.locals[0].roles[0].implicitRoleExtensions',
          predicate: 'cannot be an empty list',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: [
                {
                  category: '_fonts',
                  implicitRoleExtensions: ['woff2'],
                  isCategoryNode: true,
                  name: 'font',
                },
              ],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/invalid-implicit-extension',
          element: 'faf.locals[0].roles[0].implicitRoleExtensions[0]',
          predicate: 'must start with a dot and contain only lowercase letters',
          reference: 'FAF §6.3.1',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: [
                {
                  category: '_fonts',
                  implicitRoleExtensions: ['.dir/png'],
                  isCategoryNode: true,
                  name: 'font',
                },
              ],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/invalid-implicit-extension',
          element: 'faf.locals[0].roles[0].implicitRoleExtensions[0]',
          predicate: 'must start with a dot and contain only lowercase letters',
          reference: 'FAF §6.3.1',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: [
                {
                  category: '_fonts',
                  implicitRoleExtensions: ['.woff2'],
                  isCategoryNode: true,
                  name: 'font',
                },
                {
                  category: '_webfonts',
                  implicitRoleExtensions: ['.woff2'],
                  isCategoryNode: true,
                  name: 'webfont',
                },
              ],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/duplicate-implicit-extension',
          detail:
            'Implicit extension ".woff2" is already associated with role "font"',
          element: 'faf.locals[0].roles[1].implicitRoleExtensions[0]',
          predicate: 'is declared more than once across roles',
          reference: 'FAF §6.3.1',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: [
                {
                  category: '_fonts',
                  implicitRoleExtensions: ['.ts'],
                  isCategoryNode: true,
                  name: 'font',
                },
              ],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/invalid-implicit-extension',
          element: 'faf.locals[0].roles[0].implicitRoleExtensions[0]',
          predicate: 'must start with a dot and contain only lowercase letters',
          reference: 'FAF §6.3.1',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: [
                {
                  category: '_fonts',
                  implicitRoleExtensions: ['.woff2'],
                  isCategoryNode: false,
                  name: 'font',
                },
              ],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/implicit-extension-category-node-mismatch',
          element: 'faf.locals[0].roles[0].isCategoryNode',
          predicate: 'must be true for a role with implicit extensions',
          reference: 'FAF §6.3.1',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              roles: [
                { category: '_utils', name: 'module' },
                {
                  category: '_styles',
                  implicitRoleExtensions: ['.module.css'],
                  isCategoryNode: true,
                  name: 'style',
                },
              ],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/implicit-extension-role-name-prefix',
          detail:
            'First segment "module" of implicit extension ".module.css" cannot match a role name',
          element: 'faf.locals[0].roles[1].implicitRoleExtensions[0]',
          predicate: 'cannot start with a segment matching a role name',
          reference: 'FAF §6.3.1',
        }),
      ]
    );
  });

  it('derives role form and default multiple symbols permission across all five examples', async () => {
    await runScenario(
      {
        'src/_components/button/button.component.tsx':
          'export const button = 1;\n',
        'src/_components/button/index.ts':
          "export { button } from './button.component.js';\n",
      },
      {
        faf: {
          locals: [
            {
              roles: [{ category: '_components', name: 'component' }],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      []
    );

    await runScenario(
      {
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
                {
                  category: '_components',
                  isCategoryNode: false,
                  name: 'component',
                },
              ],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      []
    );

    await runScenario(
      {
        'src/_types/token.type.ts': 'export type TToken = string;\n',
      },
      {
        faf: {
          locals: [
            {
              roles: [
                {
                  category: '_types',
                  isCategoryNode: true,
                  name: 'type',
                },
              ],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      []
    );

    await runScenario(
      {
        'src/_fonts/font.woff2': '',
      },
      {
        faf: {
          locals: [
            {
              roles: [
                {
                  category: '_fonts',
                  implicitRoleExtensions: ['.woff2'],
                  name: 'font',
                },
              ],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      []
    );

    await runScenario(
      {
        'src/_fonts/font.woff2': '',
      },
      {
        faf: {
          locals: [
            {
              roles: [
                {
                  category: '_fonts',
                  implicitRoleExtensions: ['.woff2'],
                  isCategoryNode: true,
                  name: 'font',
                },
              ],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      []
    );
  });

  it('admits Category Node role on non-Master Fragment Node', async () => {
    await runScenario(
      {
        'src/_components/button/button.component.tsx':
          'export const button = 1;\n',
        'src/_components/button/button.type.ts':
          'export type ButtonProps = string;\n',
        'src/_components/button/index.ts':
          "export { button } from './button.component.js';\n",
      },
      {
        faf: {
          locals: [
            {
              roles: [
                { category: '_types', isCategoryNode: true, name: 'type' },
                { category: '_components', name: 'component' },
              ],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      []
    );
  });
});

describe('Rule 40: Le dichiarazioni Root separano appartenenza, gerarchia locale e archi inter-Fragment', () => {
  it('enumerates direct Root Nodes and Root Fragments without name deductions', async () => {
    await runScenario(
      {
        'app/layout.tsx': 'export const layout = 1;\n',
        'app/page.tsx': 'export const page = 1;\n',
        'app/sub/sub-page.tsx': 'export const subPage = 1;\n',
      },
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootFragments: [
                {
                  path: 'app',
                  rootNodes: [['layout.tsx'], ['page.tsx']],
                  subRootFragments: [
                    { path: 'app/sub', rootNodes: [['sub-page.tsx']] },
                  ],
                },
              ],
            },
          ],
        },
      },
      'prepare-project',
      []
    );
  });

  it('rejects declarations inconsistent with inventory across all thirteen examples', async () => {
    await runScenario(
      {
        'app/extra.ts': 'export const extra = 1;\n',
        'app/index.ts': 'export const a = 1;\n',
      },
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootFragments: [{ path: 'app', rootNodes: [['index.ts']] }],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'classification/unclassifiable-file',
          element: 'app/extra.ts',
          family: 'classification',
          filePath: 'app/extra.ts',
          predicate:
            'is neither a uniquely classified Logical Node nor a Foreign Node',
          reference: 'FAF §6.9',
        }),
        configMessage({
          constraint: 'configuration/unenumerated-root-file',
          element: 'app/extra.ts',
          predicate:
            'must be either enumerated as a Root Node or designated as a Foreign Node',
          reference: 'FAF §6.2.2',
        }),
      ]
    );

    await runDynamicScenario(
      {
        'app/index.ts': 'export const a = 1;\n',
      },
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootFragments: [
                {
                  path: 'app',
                  rootNodes: [['index.ts'], ['missing.ts']],
                },
              ],
            },
          ],
        },
      },
      (projectPath) => [
        configMessage({
          constraint: 'configuration/non-existent-path',
          detail: `Root node "app/missing.ts" does not exist under configuration base "${projectPath}"`,
          element: 'app/missing.ts',
          predicate: 'does not exist',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      {
        'app/index.ts': 'export const a = 1;\n',
      },
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootFragments: [
                {
                  path: 'app',
                  rootNodes: [['app/app.tsx']],
                },
              ],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/invalid-file-name',
          element: 'faf.locals[0].rootFragments[0].rootNodes[0][0]',
          predicate: 'must adhere to kebab-case grammar',
          reference: 'FAF §4',
        }),
      ]
    );

    await runScenario(
      {
        'app/index.ts': 'export const a = 1;\n',
      },
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootFragments: [
                {
                  path: 'app',
                  rootNodes: [['index.ts'], ['index.ts']],
                },
              ],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/duplicate-element',
          element: 'faf.locals[0].rootFragments[0].rootNodes[1][0]',
          predicate: 'is a duplicate element',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      {
        'app/index.ts': 'export const a = 1;\n',
      },
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootFragments: [
                {
                  path: 'app',
                  rootNodes: [[]],
                },
              ],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/empty-tier',
          element: 'faf.locals[0].rootFragments[0].rootNodes[0]',
          predicate: 'cannot be an empty tier',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      {
        'app/a.ts': 'export const a = 1;\n',
        'app/b.ts': 'export const b = 1;\n',
      },
      {
        faf: {
          locals: [
            {
              foreignNodes: ['app/b.ts'],
              roles: defaultRoles,
              rootFragments: [{ path: 'app', rootNodes: [['a.ts', 'b.ts']] }],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'classification/horizontal-hierarchy-members',
          element: 'app',
          family: 'classification',
          filePath: 'app/a.ts',
          predicate:
            'has a Horizontal Hierarchy over children that FAF does not allow to be ordered',
          reference: 'FAF §6.9',
        }),
        configMessage({
          constraint: 'classification/unclassifiable-file',
          element: 'app/b.ts',
          family: 'classification',
          filePath: 'app/b.ts',
          predicate:
            'is neither a uniquely classified Logical Node nor a Foreign Node',
          reference: 'FAF §6.9',
        }),
        configMessage({
          constraint: 'configuration/contradictory-root-foreign',
          element: 'app/b.ts',
          predicate:
            'cannot be declared as both a Root Node and a Foreign Node',
          reference: 'FAF §6.7',
        }),
      ]
    );

    await runScenario(
      {
        'app/index.ts': 'export const a = 1;\n',
        'app/nested/deep/page.ts': 'export const p = 1;\n',
      },
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootFragments: [
                {
                  path: 'app',
                  rootNodes: [['index.ts']],
                  subRootFragments: [
                    { path: 'app/nested/deep', rootNodes: [['page.ts']] },
                  ],
                },
              ],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/nested-root-fragment-not-direct-child',
          element: 'app/nested/deep',
          predicate: 'must be a direct child directory of the root fragment',
          reference: 'FAF §6.2.2',
        }),
      ]
    );

    await runScenario(
      {
        'app/child/page.ts': 'export const p = 1;\n',
        'app/index.ts': 'export const a = 1;\n',
      },
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootFragments: [{ path: 'app', rootNodes: [['index.ts']] }],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'classification/unclassifiable-directory',
          element: 'app/child',
          family: 'classification',
          filePath: 'app/child/page.ts',
          predicate: 'has no unique Logical Domain classification',
          reference: 'FAF §6.9',
        }),
        configMessage({
          constraint: 'classification/unclassifiable-file',
          element: 'app/child/page.ts',
          family: 'classification',
          filePath: 'app/child/page.ts',
          predicate:
            'is neither a uniquely classified Logical Node nor a Foreign Node',
          reference: 'FAF §6.9',
        }),
        configMessage({
          constraint: 'configuration/undeclared-sub-root-fragment',
          element: 'app/child',
          predicate: 'must be declared in subRootFragments',
          reference: 'FAF §6.2.2',
        }),
      ]
    );

    await runScenario(
      defaultTree,
      {
        faf: {
          locals: [
            {
              foreignDomains: ['src'],
              roles: defaultRoles,
              rootLayers: ['src'],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/origin-designated-foreign-domain',
          element: 'src',
          predicate: 'cannot be designated as a foreign domain',
          reference: 'FAF §6.7',
        }),
      ]
    );

    await runScenario(
      {
        'app/index.ts': 'export const a = 1;\n',
        'app/sub/page.ts': 'export const p = 1;\n',
      },
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootFragments: [
                {
                  dependencyEdges: [
                    { from: ['missing.ts'], to: ['app/sub/page.ts'] },
                  ],
                  path: 'app',
                  rootNodes: [['index.ts']],
                  subRootFragments: [
                    { path: 'app/sub', rootNodes: [['page.ts']] },
                  ],
                },
              ],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/invalid-root-dependency-from',
          element: 'missing.ts',
          predicate:
            'must be an enumerated root node as a root dependency source',
          reference: 'FAF §6.2.2',
        }),
      ]
    );

    await runScenario(
      {
        'app/index.ts': 'export const a = 1;\n',
        'app/sub/page.ts': 'export const p = 1;\n',
      },
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootFragments: [
                {
                  dependencyEdges: [
                    { from: ['index.ts'], to: ['app/sub/missing.ts'] },
                  ],
                  path: 'app',
                  rootNodes: [['index.ts']],
                  subRootFragments: [
                    { path: 'app/sub', rootNodes: [['page.ts']] },
                  ],
                },
              ],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/invalid-root-dependency-to',
          element: 'app/sub/missing.ts',
          predicate:
            'must be an enumerated root node as a root dependency target',
          reference: 'FAF §6.2.2',
        }),
      ]
    );

    await runScenario(
      {
        'app/a.ts': 'export const a = 1;\n',
        'app/b.ts': 'export const b = 1;\n',
      },
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootFragments: [
                {
                  dependencyEdges: [{ from: ['a.ts'], to: ['app/b.ts'] }],
                  path: 'app',
                  rootNodes: [['a.ts', 'b.ts']],
                },
              ],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/root-dependency-same-fragment',
          detail:
            'Root dependency target "app/b.ts" belongs to the same root fragment "app"',
          element: 'app/b.ts',
          predicate: 'cannot belong to the same root fragment as its source',
          reference: 'FAF §6.2.2',
        }),
      ]
    );

    await runScenario(
      {
        'app/a.ts': 'export const a = 1;\n',
        'lib/index.ts': 'export const lib = 1;\n',
      },
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootFragments: [
                {
                  dependencyEdges: [{ from: ['a.ts'], to: ['lib/index.ts'] }],
                  path: 'app',
                  rootNodes: [['a.ts']],
                },
              ],
            },
            {
              roles: defaultRoles,
              rootFragments: [
                {
                  path: 'lib',
                  rootNodes: [['index.ts']],
                },
              ],
            },
          ],
        },
      },
      'prepare-project',
      [
        configMessage({
          constraint: 'configuration/root-dependency-different-tree',
          detail:
            'Root dependency target "lib/index.ts" belongs to tree "lib", not "app"',
          element: 'lib/index.ts',
          predicate:
            'must belong to the same tree as the root dependency source',
          reference: 'FAF §6.2.2',
        }),
      ]
    );
  });

  it('authorizes strictly descending root node pairs along local hierarchy', async () => {
    await runScenario(
      {
        'app/a.ts':
          "import { b } from './b.js';\nimport { c } from './c.js';\nexport const a = b + c;\n",
        'app/b.ts': "import { c } from './c.js';\nexport const b = c + 1;\n",
        'app/c.ts': 'export const c = 1;\n',
      },
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootFragments: [
                {
                  path: 'app',
                  rootNodes: [['c.ts'], ['b.ts'], ['a.ts']],
                },
              ],
            },
          ],
        },
      },
      'root-node-discipline',
      []
    );

    await runScenario(
      {
        'app/a.ts': 'export const a = 1;\n',
        'app/b.ts': "import { a } from './a.js';\nexport const b = a + 1;\n",
      },
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootFragments: [
                {
                  path: 'app',
                  rootNodes: [['b.ts'], ['a.ts']],
                },
              ],
            },
          ],
        },
      },
      'root-node-discipline',
      [
        configMessage({
          constraint: 'dependency/root-node-discipline',
          element: 'app/b.ts',
          family: 'dependency',
          filePath: 'app/b.ts',
          predicate:
            "imports 'app/a.ts' through './a.js': a Root Node is importable only by Root Nodes authorized by rootNodes or dependencyEdges",
          reference: 'FAF §6.2.2',
        }),
      ]
    );
  });

  it('authorizes cartesian product between root fragments via dependencyEdges', async () => {
    await runScenario(
      {
        'app/a.ts':
          "import { c } from './sub/c.js';\nimport { d } from './sub/d.js';\nexport const a = c + d;\n",
        'app/b.ts':
          "import { c } from './sub/c.js';\nimport { d } from './sub/d.js';\nexport const b = c + d;\n",
        'app/sub/c.ts': 'export const c = 1;\n',
        'app/sub/d.ts': 'export const d = 2;\n',
      },
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootFragments: [
                {
                  dependencyEdges: [
                    {
                      from: ['a.ts', 'b.ts'],
                      to: ['app/sub/c.ts', 'app/sub/d.ts'],
                    },
                  ],
                  path: 'app',
                  rootNodes: [['a.ts', 'b.ts']],
                  subRootFragments: [
                    { path: 'app/sub', rootNodes: [['c.ts', 'd.ts']] },
                  ],
                },
              ],
            },
          ],
        },
      },
      'root-node-discipline',
      []
    );

    await runScenario(
      {
        'app/a.ts': 'export const a = 1;\n',
        'app/b.ts': 'export const b = 2;\n',
        'app/sub/c.ts': "import { a } from '../a.js';\nexport const c = a;\n",
        'app/sub/d.ts': 'export const d = 4;\n',
      },
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootFragments: [
                {
                  dependencyEdges: [
                    {
                      from: ['a.ts', 'b.ts'],
                      to: ['app/sub/c.ts', 'app/sub/d.ts'],
                    },
                  ],
                  path: 'app',
                  rootNodes: [['a.ts', 'b.ts']],
                  subRootFragments: [
                    { path: 'app/sub', rootNodes: [['c.ts', 'd.ts']] },
                  ],
                },
              ],
            },
          ],
        },
      },
      'root-node-discipline',
      [
        configMessage({
          constraint: 'dependency/root-node-discipline',
          element: 'app/sub/c.ts',
          family: 'dependency',
          filePath: 'app/sub/c.ts',
          predicate:
            "imports 'app/a.ts' through '../a.js': a Root Node is importable only by Root Nodes authorized by rootNodes or dependencyEdges",
          reference: 'FAF §6.2.2',
        }),
      ]
    );
  });

  it('does not synthesize code cycle from unused reciprocal root authorizations', async () => {
    await runScenario(
      {
        'app/a.ts': "import { b } from './sub/b.js';\nexport const a = b;\n",
        'app/sub/b.ts': 'export const b = 1;\n',
      },
      {
        faf: {
          locals: [
            {
              roles: defaultRoles,
              rootFragments: [
                {
                  dependencyEdges: [{ from: ['a.ts'], to: ['app/sub/b.ts'] }],
                  path: 'app',
                  rootNodes: [['a.ts']],
                  subRootFragments: [
                    {
                      dependencyEdges: [{ from: ['b.ts'], to: ['app/a.ts'] }],
                      path: 'app/sub',
                      rootNodes: [['b.ts']],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
      'acyclicity',
      [
        configMessage({
          constraint: 'unverified/cyclic-root-authorization',
          element: 'app/a.ts',
          family: 'unverified',
          predicate:
            'declares reciprocal root dependency authorizations without physical code cycle',
          reference: 'D-04',
        }),
      ]
    );
  });
});
