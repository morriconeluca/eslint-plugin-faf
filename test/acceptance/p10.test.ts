import type { FileTree } from 'fs-fixture';

import nodeFs from 'node:fs';
import nodePath from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

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

const makeScenarioMessage = ({
  column = 1,
  constraint,
  detail,
  element,
  filePath,
  messageId,
  predicate,
  reference,
}: {
  readonly column?: number;
  readonly constraint: string;
  readonly detail?: string;
  readonly element: string;
  readonly filePath: string;
  readonly messageId: string;
  readonly predicate: string;
  readonly reference: string;
}): TScenarioMessage => {
  const detailSuffix =
    detail === undefined || detail === ''
      ? ''
      : `: ${detail.replace(/\.$/, '')}`;
  return {
    column,
    constraint,
    element,
    filePath,
    line: 1,
    message: `${constraint}: '${element}' ${predicate}${detailSuffix} (${reference}).`,
    messageId,
    ruleId: 'faf/conformity',
    severity: 2,
  };
};

const makeDirectEdgeMessage = ({
  constraint,
  from,
  predicate,
  reference,
  specifier,
  to,
}: {
  readonly constraint: string;
  readonly from: string;
  readonly predicate: string;
  readonly reference: string;
  readonly specifier: string;
  readonly to: string;
}): TScenarioMessage => ({
  column: 1,
  constraint,
  element: from,
  filePath: from,
  line: 1,
  message: `${constraint}: '${from}' imports '${to}' through '${specifier}': ${predicate} (${reference}).`,
  messageId: 'dependency',
  ruleId: 'faf/conformity',
  severity: 2,
});

const runScenario = async (
  tree: FileTree,
  config: Readonly<Record<string, unknown>>,
  responsiblePart: string,
  expected: readonly TScenarioMessage[] = []
): Promise<void> => {
  const project = await createProject(tree, config);
  try {
    const result = await lintScenario(project.path);
    expectScenario(result, responsiblePart, expected);
  } finally {
    await project.rm();
  }
};

describe("Rule 1: La configurazione esprime le decisioni dell'architetto senza introdurre convenzioni implicite", () => {
  const WARMUP_TIMEOUT_MS = 120_000;

  beforeAll(warmupESLint, WARMUP_TIMEOUT_MS);

  it('accepts decisions specified by the architectural contract', async () => {
    await runScenario(
      {
        'client/src/_components/button/button.component.tsx':
          "import { service } from '../../../../server/src/_services/user/index.js';\nexport const button = service;\n",
        'client/src/_components/button/index.ts':
          "export { button } from './button.component.js';\n",
        'client/src/main.ts':
          "export { button } from './_components/button/index.js';\n",
        'legacy/client.ts': 'export const legacyClient = 1;\n',
        'server/src/_services/user/index.ts':
          "export { service } from './user.service.js';\n",
        'server/src/_services/user/user.service.ts':
          "import { legacyClient } from '../../../../legacy/client.js';\nexport const service = legacyClient;\n",
      },
      {
        faf: {
          locals: [
            {
              publicRootNodes: ['client/src/main.ts'],
              roles: [{ category: '_components', name: 'component' }],
              rootFragments: [
                {
                  path: 'client/src',
                  rootNodes: [['main.ts']],
                },
              ],
              treeDependencies: [{ from: ['client/src'], to: ['server/src'] }],
            },
            {
              externalDependencies: [
                {
                  from: ['server/src/_services/user/user.service.ts'],
                  to: ['legacy/client.ts'],
                },
              ],
              roles: [{ category: '_services', name: 'service' }],
              rootLayers: ['server/src'],
            },
          ],
        },
      },
      'prepare-project',
      []
    );
  });

  describe('rejects missing or contradictory classification without arbitrary fallback', () => {
    it('row 1: rejects when a declaration requires a Layer but path mixes exclusive forms', async () => {
      await runScenario(
        {
          'src/_domain/_sub/_types/value.type.ts':
            'export type TValue = number;\n',
          'src/_types/value.type.ts': 'export type TValue = number;\n',
        },
        {
          faf: {
            locals: [
              {
                roles: [
                  { category: '_types', isCategoryNode: true, name: 'type' },
                ],
                rootLayers: ['src'],
              },
            ],
          },
        },
        'exclusive-forms',
        [
          makeScenarioMessage({
            constraint: 'classification/exclusive-forms',
            element: 'src',
            filePath: 'fafconfig.ts',
            messageId: 'classification',
            predicate:
              'mixes mutually exclusive forms among its direct children',
            reference: 'FAF §6.3.2, §6.4.1, §6.5.1, §6.6.1',
          }),
        ]
      );
    });

    it('row 2: rejects origin designated as both Root Fragment and Root Layer', async () => {
      await runScenario(
        defaultTree,
        {
          faf: {
            locals: [
              {
                roles: defaultRoles,
                rootFragments: [{ path: 'src', rootNodes: [['widget.ts']] }],
                rootLayers: ['src'],
              },
            ],
          },
        },
        'prepare-project',
        [
          makeScenarioMessage({
            constraint: 'configuration/conflicting-origin-kind',
            element: 'src',
            filePath: 'fafconfig.ts',
            messageId: 'configuration',
            predicate:
              'cannot be declared as both a Root Layer and a Root Fragment',
            reference: 'D-06',
          }),
        ]
      );
    });

    it('row 3: rejects missing origin type designation in tree', async () => {
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
          makeScenarioMessage({
            constraint: 'configuration/missing-origin',
            element: 'faf.locals[0]',
            filePath: 'fafconfig.ts',
            messageId: 'configuration',
            predicate: 'must be an existing tree origin directory',
            reference: 'D-06',
          }),
        ]
      );
    });

    it('row 4: rejects an organizational directory without determinable classification', async () => {
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
        'classification-completeness',
        [
          makeScenarioMessage({
            constraint: 'classification/unclassifiable-directory',
            element: 'src/notes',
            filePath: 'src/notes/orphan.ts',
            messageId: 'classification',
            predicate: 'has no unique Logical Domain classification',
            reference: 'FAF §6.9',
          }),
          makeScenarioMessage({
            constraint: 'classification/unclassifiable-file',
            element: 'src/notes/orphan.ts',
            filePath: 'src/notes/orphan.ts',
            messageId: 'classification',
            predicate:
              'is neither a uniquely classified Logical Node nor a Foreign Node',
            reference: 'FAF §6.9',
          }),
        ]
      );
    });

    it('row 5: rejects duplicate implicit extension associated with two roles', async () => {
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
          makeScenarioMessage({
            constraint: 'configuration/duplicate-implicit-extension',
            detail:
              'Implicit extension ".woff2" is already associated with role "font"',
            element: 'faf.locals[0].roles[1].implicitRoleExtensions[0]',
            filePath: 'fafconfig.ts',
            messageId: 'configuration',
            predicate: 'is declared more than once across roles',
            reference: 'FAF §6.3.1',
          }),
        ]
      );
    });

    it('row 6: rejects category requiring a role outside tree catalog', async () => {
      await runScenario(
        {
          'src/_components/button/button.component.tsx':
            'export const button = 1;\n',
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
        'classification-completeness',
        [
          makeScenarioMessage({
            constraint: 'classification/unclassifiable-directory',
            element: 'src/_components/button',
            filePath: 'src/_components/button/button.component.tsx',
            messageId: 'classification',
            predicate: 'has no unique Logical Domain classification',
            reference: 'FAF §6.9',
          }),
          makeScenarioMessage({
            constraint: 'classification/unclassifiable-file',
            element: 'src/_components/button/button.component.tsx',
            filePath: 'src/_components/button/button.component.tsx',
            messageId: 'classification',
            predicate:
              'is neither a uniquely classified Logical Node nor a Foreign Node',
            reference: 'FAF §6.9',
          }),
        ]
      );
    });

    it('row 7: rejects conflicting Fragment and Node form assignments for same role', async () => {
      await runScenario(
        defaultTree,
        {
          faf: {
            locals: [
              {
                roles: [
                  { category: '_utils', name: 'util' },
                  { category: '_helpers', isCategoryNode: true, name: 'util' },
                ],
                rootLayers: ['src'],
              },
            ],
          },
        },
        'prepare-project',
        [
          makeScenarioMessage({
            constraint: 'configuration/duplicate-role-name',
            detail: 'Duplicate role name "util"',
            element: 'faf.locals[0].roles[1].name',
            filePath: 'fafconfig.ts',
            messageId: 'configuration',
            predicate: 'is declared more than once in the role catalog',
            reference: 'FAF §6.3.1',
          }),
        ]
      );
    });

    it('row 8: rejects missing category association for a role', async () => {
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
          makeScenarioMessage({
            constraint: 'configuration/missing-property',
            element: 'faf.locals[0].roles[0].category',
            filePath: 'fafconfig.ts',
            messageId: 'configuration',
            predicate: 'is required and missing',
            reference: 'D-14',
          }),
        ]
      );
    });

    it('row 9: rejects fragment node with Rank not strictly lower than Master', async () => {
      await runScenario(
        {
          'src/_utils/widget/index.ts':
            "export { widget } from './widget.util.js';\n",
          'src/_utils/widget/widget.hook.ts': 'export const hook = 1;\n',
          'src/_utils/widget/widget.util.ts': 'export const widget = 1;\n',
        },
        {
          faf: {
            locals: [
              {
                roles: [
                  { category: '_utils', name: 'util' },
                  { category: '_hooks', name: 'hook' },
                ],
                rootLayers: ['src'],
              },
            ],
          },
        },
        'fragment-anatomy',
        [
          makeScenarioMessage({
            constraint: 'classification/fragment-node-rank',
            element: 'src/_utils/widget/widget.hook.ts',
            filePath: 'src/_utils/widget/widget.hook.ts',
            messageId: 'classification',
            predicate:
              'has a Rank not strictly lower than the Master Node of its Fragment',
            reference: 'FAF §6.1.3',
          }),
        ]
      );
    });

    it('row 10: rejects implicit extension starting with role name', async () => {
      await runScenario(
        defaultTree,
        {
          faf: {
            locals: [
              {
                roles: [
                  { category: '_utils', name: 'util' },
                  {
                    category: '_fonts',
                    implicitRoleExtensions: ['.util.woff'],
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
          makeScenarioMessage({
            constraint: 'configuration/implicit-extension-role-name-prefix',
            detail:
              'First segment "util" of implicit extension ".util.woff" cannot match a role name',
            element: 'faf.locals[0].roles[1].implicitRoleExtensions[0]',
            filePath: 'fafconfig.ts',
            messageId: 'configuration',
            predicate: 'cannot start with a segment matching a role name',
            reference: 'FAF §6.3.1',
          }),
        ]
      );
    });

    it('row 11: rejects fragments form assigned to role with implicit extensions', async () => {
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
          makeScenarioMessage({
            constraint:
              'configuration/implicit-extension-category-node-mismatch',
            element: 'faf.locals[0].roles[0].isCategoryNode',
            filePath: 'fafconfig.ts',
            messageId: 'configuration',
            predicate: 'must be true for a role with implicit extensions',
            reference: 'FAF §6.3.1',
          }),
        ]
      );
    });

    it('row 12: rejects horizontal hierarchy over elements with different parents', async () => {
      await runScenario(
        {
          'src/_utils/widget/_types/widget.type.ts':
            'export type TWidget = number;\n',
          'src/_utils/widget/index.ts':
            "export { widget } from './widget.util.js';\n",
          'src/_utils/widget/widget.util.ts': 'export const widget = 1;\n',
        },
        {
          faf: {
            locals: [
              {
                localHorizontalHierarchies: [
                  {
                    hierarchies: [['_types']],
                    paths: ['src/_utils/widget'],
                  },
                ],
                roles: [
                  { category: '_types', isCategoryNode: true, name: 'type' },
                  { category: '_utils', name: 'util' },
                ],
                rootLayers: ['src'],
              },
            ],
          },
        },
        'horizontal-hierarchies',
        [
          makeScenarioMessage({
            constraint: 'classification/horizontal-hierarchy-members',
            element: 'src/_utils/widget',
            filePath: 'src/_utils/widget/widget.util.ts',
            messageId: 'classification',
            predicate:
              'has a Horizontal Hierarchy over children that FAF does not allow to be ordered',
            reference: 'FAF §6.9',
          }),
        ]
      );
    });
  });

  it('uses declared catalog and custom hierarchy without requiring reference models', async () => {
    await runScenario(
      {
        'src/_contracts/user.contract.ts': 'export type TUser = string;\n',
        'src/_queries/get-user/get-user.contract.ts':
          'export type TLocal = number;\n',
        'src/_queries/get-user/get-user.query.ts':
          'export const getUser = 1;\n',
        'src/_queries/get-user/index.ts':
          "export { getUser } from './get-user.query.js';\n",
      },
      {
        faf: {
          locals: [
            {
              roles: [
                {
                  category: '_contracts',
                  isCategoryNode: true,
                  name: 'contract',
                },
                { category: '_queries', name: 'query' },
              ],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'classify-taxonomy',
      []
    );
  });

  describe('does not emit violations for non-observance of recommendations', () => {
    it('row 1: allows category with singular name declared in catalog', async () => {
      await runScenario(
        {
          'src/_util/widget/index.ts':
            "export { widget } from './widget.util.js';\n",
          'src/_util/widget/widget.util.ts': 'export const widget = 1;\n',
        },
        {
          faf: {
            locals: [
              {
                roles: [{ category: '_util', name: 'util' }],
                rootLayers: ['src'],
              },
            ],
          },
        },
        'nomenclature',
        []
      );
    });

    it('row 2: allows sub-category with singular name', async () => {
      await runScenario(
        {
          'src/_utils/_atom/widget/index.ts':
            "export { widget } from './widget.util.js';\n",
          'src/_utils/_atom/widget/widget.util.ts':
            'export const widget = 1;\n',
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
        'nomenclature',
        []
      );
    });

    it('row 3: allows nested root fragment with underscore prefix', async () => {
      await runScenario(
        {
          'src/_admin/dashboard.ts': 'export const dashboard = 1;\n',
          'src/main.ts': 'export const main = 1;\n',
        },
        {
          faf: {
            locals: [
              {
                roles: [{ category: '_utils', name: 'util' }],
                rootFragments: [
                  {
                    path: 'src',
                    rootNodes: [['main.ts']],
                    subRootFragments: [
                      {
                        path: 'src/_admin',
                        rootNodes: [['dashboard.ts']],
                      },
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

    it('row 4: allows foreign domain without underscore prefix and without external contract', async () => {
      await runScenario(
        {
          'src/_utils/widget/index.ts':
            "export { widget } from './widget.util.js';\n",
          'src/_utils/widget/widget.util.ts': 'export const widget = 1;\n',
          'src/assets/logo.png': '',
        },
        {
          faf: {
            locals: [
              {
                foreignDomains: ['src/assets'],
                roles: [{ category: '_utils', name: 'util' }],
                rootLayers: ['src'],
              },
            ],
          },
        },
        'foreign-node-isolation',
        []
      );
    });

    it('row 5: allows role admitting multiple symbols without correlated declarations', async () => {
      await runScenario(
        {
          'src/_types/models.type.ts':
            'export type TA = string;\nexport type TB = number;\n',
        },
        {
          faf: {
            locals: [
              {
                roles: [
                  {
                    allowMultipleSymbols: true,
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
        []
      );
    });

    it('row 6: allows placement deviating from proximity and domain relevance guidelines', async () => {
      await runScenario(
        {
          'src/_src@shared/_utils/helper/helper.util.ts':
            'export const helper = 1;\n',
          'src/_src@shared/_utils/helper/index.ts':
            "export { helper } from './helper.util.js';\n",
          'src/_utils/consumer/consumer.util.ts':
            "import { helper } from '../../_src@shared/_utils/helper/index.js';\nexport const consumer = helper;\n",
          'src/_utils/consumer/index.ts':
            "export { consumer } from './consumer.util.js';\n",
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
        'fractal-branch-visibility',
        []
      );
    });

    it('row 7: allows Atomic Design pages as Sub-Category of _components', async () => {
      await runScenario(
        {
          'src/_components/_pages/home/home.component.tsx':
            'export const home = 1;\n',
          'src/_components/_pages/home/index.ts':
            "export { home } from './home.component.js';\n",
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
        'containment-matrix',
        []
      );
    });
  });
});

describe('Rule 32: La concentrazione delle dipendenze locali esterne in adattatori richiede una valutazione architetturale', () => {
  it('does not emit an isolation violation for validly authorized external dependencies', async () => {
    await runScenario(
      {
        'legacy/client.ts': 'export const legacyClient = 1;\n',
        'src/_adapters/user/index.ts':
          "export { userAdapter } from './user.adapter.js';\n",
        'src/_adapters/user/user.adapter.ts':
          "import { legacyClient } from '../../../legacy/client.js';\nexport const userAdapter = legacyClient;\n",
      },
      {
        faf: {
          locals: [
            {
              externalDependencies: [
                {
                  from: ['src/_adapters/user/user.adapter.ts'],
                  to: ['legacy/client.ts'],
                },
              ],
              roles: [{ category: '_adapters', name: 'adapter' }],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'external-dependencies',
      []
    );
  });

  it('does not infer diffuse coupling solely from multiple authorized units', async () => {
    await runScenario(
      {
        'generated/client.ts': 'export const client = 1;\n',
        'src/_repositories/order/index.ts':
          "export { orderRepo } from './order.repository.js';\n",
        'src/_repositories/order/order.repository.ts':
          "import { client } from '../../../generated/client.js';\nexport const orderRepo = client;\n",
        'src/_repositories/user/index.ts':
          "export { userRepo } from './user.repository.js';\n",
        'src/_repositories/user/user.repository.ts':
          "import { client } from '../../../generated/client.js';\nexport const userRepo = client;\n",
      },
      {
        faf: {
          locals: [
            {
              externalDependencies: [
                {
                  from: [
                    'src/_repositories/order/order.repository.ts',
                    'src/_repositories/user/user.repository.ts',
                  ],
                  to: ['generated/client.ts'],
                },
              ],
              roles: [{ category: '_repositories', name: 'repository' }],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'external-dependencies',
      []
    );
  });

  it('does not emit outcomes on adapter qualification from node name alone', async () => {
    await runScenario(
      {
        'src/_utils/adapter/adapter.util.ts': 'export const adapter = 1;\n',
        'src/_utils/adapter/index.ts':
          "export { adapter } from './adapter.util.js';\n",
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
      'external-dependencies',
      []
    );
  });
});

describe('Rule 33: I dettagli non determinati dalla bozza sono espliciti e non diventano norme FAF inventate', () => {
  describe('clarifies whether inter-Tree DAG constrains unexercised authorizations', () => {
    const interTreeConfig = {
      faf: {
        locals: [
          {
            roles: [{ category: '_utils', name: 'util' }],
            rootLayers: ['treeA'],
            treeDependencies: [{ from: ['treeA'], to: ['treeB'] }],
          },
          {
            roles: [{ category: '_utils', name: 'util' }],
            rootLayers: ['treeB'],
            treeDependencies: [{ from: ['treeB'], to: ['treeA'] }],
          },
        ],
      },
    };

    it('row 1: verifies reciprocal authorizations with no actual import between A and B', async () => {
      await runScenario(
        {
          'treeA/_utils/a/a.util.ts': 'export const a = 1;\n',
          'treeA/_utils/a/index.ts': "export { a } from './a.util.js';\n",
          'treeB/_utils/b/b.util.ts': 'export const b = 1;\n',
          'treeB/_utils/b/index.ts': "export { b } from './b.util.js';\n",
        },
        interTreeConfig,
        'acyclicity',
        [
          makeScenarioMessage({
            constraint: 'unverified/cyclic-tree-authorization',
            element: 'treeA',
            filePath: 'fafconfig.ts',
            messageId: 'unverified',
            predicate:
              'declares reciprocal tree dependencies without physical code cycle',
            reference: 'D-04',
          }),
        ]
      );
    });

    it('row 2: verifies reciprocal authorizations with actual import only from A to B', async () => {
      await runScenario(
        {
          'treeA/_utils/a/a.util.ts':
            "import { b } from '../../../treeB/_utils/b/index.js';\nexport const a = b;\n",
          'treeA/_utils/a/index.ts': "export { a } from './a.util.js';\n",
          'treeB/_utils/b/b.util.ts': 'export const b = 1;\n',
          'treeB/_utils/b/index.ts': "export { b } from './b.util.js';\n",
        },
        interTreeConfig,
        'acyclicity',
        [
          makeScenarioMessage({
            constraint: 'unverified/cyclic-tree-authorization',
            element: 'treeA',
            filePath: 'fafconfig.ts',
            messageId: 'unverified',
            predicate:
              'declares reciprocal tree dependencies without physical code cycle',
            reference: 'D-04',
          }),
        ]
      );
    });

    it('row 3: verifies reciprocal authorizations with actual import only from B to A', async () => {
      await runScenario(
        {
          'treeA/_utils/a/a.util.ts': 'export const a = 1;\n',
          'treeA/_utils/a/index.ts': "export { a } from './a.util.js';\n",
          'treeB/_utils/b/b.util.ts':
            "import { a } from '../../../treeA/_utils/a/index.js';\nexport const b = a;\n",
          'treeB/_utils/b/index.ts': "export { b } from './b.util.js';\n",
        },
        interTreeConfig,
        'acyclicity',
        [
          makeScenarioMessage({
            constraint: 'unverified/cyclic-tree-authorization',
            element: 'treeA',
            filePath: 'fafconfig.ts',
            messageId: 'unverified',
            predicate:
              'declares reciprocal tree dependencies without physical code cycle',
            reference: 'D-04',
          }),
        ]
      );
    });
  });

  it('explicates nominal grammar beyond unequivocal cases', async () => {
    await runScenario(
      {
        'src/_utils/v2-parser/index.ts':
          "export { v2Parser } from './v2-parser.util.js';\n",
        'src/_utils/v2-parser/v2-parser.util.ts':
          'export const v2Parser = 1;\n',
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
      'nomenclature',
      []
    );
  });

  it('leaves mimetic path fidelity to architectural review without emitting outcomes', async () => {
    await runScenario(
      {
        'src/_apis/_users/get-user/get-user.api.ts':
          'export const getUser = 1;\n',
        'src/_apis/_users/get-user/index.ts':
          "export { getUser } from './get-user.api.js';\n",
      },
      {
        faf: {
          locals: [
            {
              mimeticPathStructures: [
                { actions: ['get'], paths: ['src/_apis'] },
              ],
              roles: [{ category: '_apis', name: 'api' }],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'nomenclature',
      []
    );
  });

  it('explicates physical identity and perimeter in presence of file system symbolic links', async () => {
    const project = await createProject(
      {
        'src/_utils/widget/index.ts':
          "export { widget } from './widget.util.js';\n",
        'src/_utils/widget/widget.util.ts': 'export const widget = 1;\n',
        'src/real.ts': 'export const real = 1;\n',
      },
      {
        faf: {
          locals: [
            {
              roles: [{ category: '_utils', name: 'util' }],
              rootFragments: [
                { path: 'src', rootNodes: [['real.ts', 'link.ts']] },
              ],
            },
          ],
        },
      }
    );
    try {
      nodeFs.symlinkSync(
        nodePath.join(project.path, 'src/real.ts'),
        nodePath.join(project.path, 'src/link.ts')
      );
      const result = await lintScenario(project.path);
      expectScenario(result, 'prepare-project', [
        makeScenarioMessage({
          constraint: 'unverified/symbolic-link',
          detail: 'src/real.ts',
          element: 'src/link.ts',
          filePath: 'src/link.ts',
          messageId: 'unverified',
          predicate: 'is a symbolic link within a tree',
          reference: 'D-06',
        }),
      ]);
    } finally {
      await project.rm();
    }
  });

  it('explicates analysis limits for unsupported constructs such as dynamic imports', async () => {
    await runScenario(
      {
        'src/_utils/loader/index.ts':
          "export { load } from './loader.util.js';\n",
        'src/_utils/loader/loader.util.ts':
          'export const load = (target: string) => import(target);\n',
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
      'collect-modules',
      [
        makeScenarioMessage({
          column: 41,
          constraint: 'unverified/non-literal-dynamic-import',
          element: 'src/_utils/loader/loader.util.ts',
          filePath: 'src/_utils/loader/loader.util.ts',
          messageId: 'unverified',
          predicate:
            'contains a non-literal dynamic import that cannot be resolved statically',
          reference: 'D-07',
        }),
      ]
    );
  });
});

describe('Rule 49: Le restrizioni del formato e i limiti di verifica producono esiti bloccanti distinti', () => {
  it('distinguishes configuration errors, demonstrated violations and incomplete checks without warning substitutes', async () => {
    await runScenario(
      defaultTree,
      {
        faf: {
          extraUnknownProperty: true,
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
        makeScenarioMessage({
          constraint: 'configuration/unknown-property',
          element: 'faf.extraUnknownProperty',
          filePath: 'fafconfig.ts',
          messageId: 'configuration',
          predicate: 'is not a recognized property',
          reference: 'D-14',
        }),
      ]
    );

    await runScenario(
      {
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
      'fragment-anatomy',
      [
        makeScenarioMessage({
          constraint: 'classification/missing-access-node',
          element: 'src/_utils/widget',
          filePath: 'src/_utils/widget/widget.util.ts',
          messageId: 'classification',
          predicate: 'has no index.ts Access Node',
          reference: 'FAF §6.1.1',
        }),
      ]
    );

    await runScenario(
      {
        'src/_utils/loader/index.ts':
          "export { load } from './loader.util.js';\n",
        'src/_utils/loader/loader.util.ts':
          'export const load = (target: string) => import(target);\n',
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
      'collect-modules',
      [
        makeScenarioMessage({
          column: 41,
          constraint: 'unverified/non-literal-dynamic-import',
          element: 'src/_utils/loader/loader.util.ts',
          filePath: 'src/_utils/loader/loader.util.ts',
          messageId: 'unverified',
          predicate:
            'contains a non-literal dynamic import that cannot be resolved statically',
          reference: 'D-07',
        }),
      ]
    );
  });

  it('produces no outcomes for recommendations and out-of-perimeter properties in a conforming project', async () => {
    await runScenario(
      {
        'src/_util/widget/index.ts':
          "export { widget } from './widget.util.js';\n",
        'src/_util/widget/widget.util.ts': 'export const widget = 1;\n',
      },
      {
        faf: {
          locals: [
            {
              roles: [{ category: '_util', name: 'util' }],
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

describe("Rule 50: Le diagnostiche rendono falsificabile la verifica senza prescrivere l'implementazione del plugin", () => {
  it('signals structural violation even when a mandatory file is missing without visiting it', async () => {
    await runScenario(
      {
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
      'fragment-anatomy',
      [
        makeScenarioMessage({
          constraint: 'classification/missing-access-node',
          element: 'src/_utils/widget',
          filePath: 'src/_utils/widget/widget.util.ts',
          messageId: 'classification',
          predicate: 'has no index.ts Access Node',
          reference: 'FAF §6.1.1',
        }),
      ]
    );
  });

  it('identifies source, resolved destination and constraint for dependency diagnostic', async () => {
    await runScenario(
      {
        'src/_hooks/counter/counter.hook.ts': 'export const counter = 1;\n',
        'src/_hooks/counter/index.ts':
          "export { counter } from './counter.hook.js';\n",
        'src/_utils/widget/index.ts':
          "export { widget } from './widget.util.js';\n",
        'src/_utils/widget/widget.util.ts':
          "import { counter } from '../../_hooks/counter/index.js';\nexport const widget = counter;\n",
      },
      {
        faf: {
          locals: [
            {
              roles: [
                { category: '_utils', name: 'util' },
                { category: '_hooks', name: 'hook' },
              ],
              rootLayers: ['src'],
            },
          ],
        },
      },
      'peer-separation',
      [
        makeDirectEdgeMessage({
          constraint: 'dependency/peer-separation',
          from: 'src/_utils/widget/widget.util.ts',
          predicate:
            'sibling subtrees may depend on each other only downward along a Horizontal Hierarchy',
          reference: 'FAF §5',
          specifier: '../../_hooks/counter/index.js',
          to: 'src/_hooks/counter/index.ts',
        }),
      ]
    );
  });

  it('does not let specific authorizations cancel independent violations', async () => {
    await runScenario(
      {
        'src/_utils/consumer/consumer.util.ts':
          "import { helper } from '../provider/_utils/helper/helper.util.js';\nexport const consumer = helper;\n",
        'src/_utils/consumer/index.ts':
          "export { consumer } from './consumer.util.js';\n",
        'src/_utils/provider/_utils/helper/helper.util.ts':
          'export const helper = 1;\n',
        'src/_utils/provider/_utils/helper/index.ts':
          "export { helper } from './helper.util.js';\n",
        'src/_utils/provider/index.ts':
          "export { provider } from './provider.util.js';\n",
        'src/_utils/provider/provider.util.ts': 'export const provider = 1;\n',
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
      'fragment-encapsulation',
      [
        makeDirectEdgeMessage({
          constraint: 'dependency/fragment-encapsulation',
          from: 'src/_utils/consumer/consumer.util.ts',
          predicate:
            'a Fragment is importable from outside only through its index.ts',
          reference: 'FAF §6.1.1',
          specifier: '../provider/_utils/helper/helper.util.js',
          to: 'src/_utils/provider/_utils/helper/helper.util.ts',
        }),
        makeDirectEdgeMessage({
          constraint: 'dependency/peer-separation',
          from: 'src/_utils/consumer/consumer.util.ts',
          predicate:
            'sibling subtrees may depend on each other only downward along a Horizontal Hierarchy',
          reference: 'FAF §5',
          specifier: '../provider/_utils/helper/helper.util.js',
          to: 'src/_utils/provider/_utils/helper/helper.util.ts',
        }),
        makeDirectEdgeMessage({
          constraint: 'dependency/private-category-visibility',
          from: 'src/_utils/consumer/consumer.util.ts',
          predicate:
            'a Private Category is importable from outside only by the enabled direct Logical Nodes of its parent',
          reference: 'FAF §6.3.3',
          specifier: '../provider/_utils/helper/helper.util.js',
          to: 'src/_utils/provider/_utils/helper/helper.util.ts',
        }),
      ]
    );
  });

  it('produces identical architectural outcomes regardless of file visit order', async () => {
    const tree: FileTree = {
      'src/_utils/widget/widget.util.ts': 'export const widget = 1;\n',
      'src/main.ts': 'export const main = 1;\n',
    };
    const config = {
      faf: {
        locals: [
          {
            publicRootNodes: ['main.ts'],
            roles: [{ category: '_utils', name: 'util' }],
            rootFragments: [
              {
                path: 'src',
                rootNodes: [['main.ts']],
              },
            ],
          },
        ],
      },
    };
    const project = await createProject(tree, config);
    try {
      const orderA = await lintScenario(project.path, [
        'src/_utils/widget/widget.util.ts',
        'src/main.ts',
      ]);
      const orderB = await lintScenario(project.path, [
        'src/main.ts',
        'src/_utils/widget/widget.util.ts',
      ]);
      expect(orderA.messages).toEqual(orderB.messages);
      expect(orderA.unimplementedParts).toEqual(orderB.unimplementedParts);
    } finally {
      await project.rm();
    }
  });

  it('declares conformity of verified perimeter without asserting out-of-perimeter properties', async () => {
    await runScenario(
      {
        'src/_types/values.type.ts':
          'export type TAlpha = 1;\nexport type TBeta = 2;\n',
      },
      {
        faf: {
          locals: [
            {
              roles: [
                {
                  allowMultipleSymbols: true,
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
  });

  it('satisfies contract acceptance criteria across positive, negative and unverified boundaries', async () => {
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
      'fragment-anatomy',
      [
        makeScenarioMessage({
          constraint: 'classification/missing-access-node',
          element: 'src/_utils/widget',
          filePath: 'src/_utils/widget/widget.util.ts',
          messageId: 'classification',
          predicate: 'has no index.ts Access Node',
          reference: 'FAF §6.1.1',
        }),
      ]
    );

    await runScenario(
      {
        'src/_utils/loader/index.ts':
          "export { load } from './loader.util.js';\n",
        'src/_utils/loader/loader.util.ts':
          'export const load = (target: string) => import(target);\n',
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
      'collect-modules',
      [
        makeScenarioMessage({
          column: 41,
          constraint: 'unverified/non-literal-dynamic-import',
          element: 'src/_utils/loader/loader.util.ts',
          filePath: 'src/_utils/loader/loader.util.ts',
          messageId: 'unverified',
          predicate:
            'contains a non-literal dynamic import that cannot be resolved statically',
          reference: 'D-07',
        }),
      ]
    );
  });
});
