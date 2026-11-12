import type { FileTree } from 'fs-fixture';

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
  'src/app/_components/shell/shell.type.ts': value,
  'src/app/_utils/helper/helper.util.ts': value,
  'src/app/_utils/helper/index.ts':
    "export { value } from './helper.util.js';\n",
  'src/app/app.ts': value,
  'src/app/child/child.ts': value,
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
      subRootFragments: [
        {
          path: 'src/app',
          rootNodes: [['app.ts']],
          subRootFragments: [
            { path: 'src/app/child', rootNodes: [['child.ts']] },
          ],
        },
      ],
    },
  ],
  subGraphRoles: [{ name: 'spec' }, { name: 'story' }],
};

const specifier = (source: string, destination: string): string => {
  const relative = nodePath.posix.relative(
    nodePath.posix.dirname(source),
    destination
  );
  return relative.startsWith('.') ? relative : `./${relative}`;
};

const formatEdgeMessage = (
  constraint: string,
  from: string,
  to: string,
  spec: string,
  predicate: string,
  reference: string
): string =>
  `${constraint}: '${from}' imports '${to}' through '${spec}': ${predicate} (${reference}).`;

const fragmentEncapsulationOutcome = (
  from: string,
  to: string,
  spec: string,
  line = 1,
  column = 1
): TScenarioMessage => ({
  column,
  constraint: 'dependency/fragment-encapsulation',
  element: from,
  filePath: from,
  line,
  message: formatEdgeMessage(
    'dependency/fragment-encapsulation',
    from,
    to,
    spec,
    'a Fragment is importable from outside only through its index.ts',
    'FAF §6.1.1'
  ),
  messageId: 'dependency',
  ruleId: 'faf/conformity',
  severity: 2,
});

const peerSeparationOutcome = (
  from: string,
  to: string,
  spec: string
): TScenarioMessage => ({
  column: 1,
  constraint: 'dependency/peer-separation',
  element: from,
  filePath: from,
  line: 1,
  message: formatEdgeMessage(
    'dependency/peer-separation',
    from,
    to,
    spec,
    'sibling subtrees may depend on each other only downward along a Horizontal Hierarchy',
    'FAF §5'
  ),
  messageId: 'dependency',
  ruleId: 'faf/conformity',
  severity: 2,
});

const subGraphNodeIsolationOutcome = (
  from: string,
  to: string,
  spec: string
): TScenarioMessage => ({
  column: 1,
  constraint: 'dependency/sub-graph-node-isolation',
  element: from,
  filePath: from,
  line: 1,
  message: formatEdgeMessage(
    'dependency/sub-graph-node-isolation',
    from,
    to,
    spec,
    'a Sub-Graph Node is not importable',
    'FAF §4'
  ),
  messageId: 'dependency',
  ruleId: 'faf/conformity',
  severity: 2,
});

const privateCategoryVisibilityOutcome = (
  from: string,
  to: string,
  spec: string
): TScenarioMessage => ({
  column: 1,
  constraint: 'dependency/private-category-visibility',
  element: from,
  filePath: from,
  line: 1,
  message: formatEdgeMessage(
    'dependency/private-category-visibility',
    from,
    to,
    spec,
    'a Private Category is importable from outside only by the enabled direct Logical Nodes of its parent',
    'FAF §6.3.3'
  ),
  messageId: 'dependency',
  ruleId: 'faf/conformity',
  severity: 2,
});

const privateCategoryUnidirectionalityOutcome = (
  from: string,
  to: string,
  spec: string
): TScenarioMessage => ({
  column: 1,
  constraint: 'dependency/private-category-unidirectionality',
  element: from,
  filePath: from,
  line: 1,
  message: formatEdgeMessage(
    'dependency/private-category-unidirectionality',
    from,
    to,
    spec,
    'a Private Category must not import the direct Logical Nodes of its parent',
    'FAF §6.3.3'
  ),
  messageId: 'dependency',
  ruleId: 'faf/conformity',
  severity: 2,
});

const rootNodeDisciplineOutcome = (
  from: string,
  to: string,
  spec: string
): TScenarioMessage => ({
  column: 1,
  constraint: 'dependency/root-node-discipline',
  element: from,
  filePath: from,
  line: 1,
  message: formatEdgeMessage(
    'dependency/root-node-discipline',
    from,
    to,
    spec,
    'a Root Node is importable only by Root Nodes authorized by rootNodes or dependencyEdges',
    'FAF §6.2.2'
  ),
  messageId: 'dependency',
  ruleId: 'faf/conformity',
  severity: 2,
});

const fractalBranchVisibilityOutcome = (
  from: string,
  to: string,
  spec: string
): TScenarioMessage => ({
  column: 1,
  constraint: 'dependency/fractal-branch-visibility',
  element: from,
  filePath: from,
  line: 1,
  message: formatEdgeMessage(
    'dependency/fractal-branch-visibility',
    from,
    to,
    spec,
    'a Fractal Branch is importable only from the subtree of its parent, except the parent Access Node',
    'FAF §6.6.2'
  ),
  messageId: 'dependency',
  ruleId: 'faf/conformity',
  severity: 2,
});

const fractalBranchUnidirectionalityOutcome = (
  from: string,
  to: string,
  spec: string
): TScenarioMessage => ({
  column: 1,
  constraint: 'dependency/fractal-branch-unidirectionality',
  element: from,
  filePath: from,
  line: 1,
  message: formatEdgeMessage(
    'dependency/fractal-branch-unidirectionality',
    from,
    to,
    spec,
    'a Fractal Branch must not depend on the other subtrees of its parent',
    'FAF §6.6.2'
  ),
  messageId: 'dependency',
  ruleId: 'faf/conformity',
  severity: 2,
});

const foreignNodeIsolationOutcome = (
  from: string,
  to: string,
  spec: string
): TScenarioMessage => ({
  column: 1,
  constraint: 'dependency/foreign-node-isolation',
  element: from,
  filePath: from,
  line: 1,
  message: formatEdgeMessage(
    'dependency/foreign-node-isolation',
    from,
    to,
    spec,
    'a Foreign Node has no import relation with codebase files',
    'FAF §4, §6.7'
  ),
  messageId: 'dependency',
  ruleId: 'faf/conformity',
  severity: 2,
});

const accessNodeSourcesOutcome = (
  from: string,
  to: string,
  spec: string
): TScenarioMessage => ({
  column: 1,
  constraint: 'dependency/access-node-sources',
  element: from,
  filePath: from,
  line: 1,
  message: formatEdgeMessage(
    'dependency/access-node-sources',
    from,
    to,
    spec,
    'an Access Node imports only direct Fragment Nodes of its own Fragment',
    'FAF §6.1.1'
  ),
  messageId: 'dependency',
  ruleId: 'faf/conformity',
  severity: 2,
});

const accessNodeMasterExportOutcome = (file: string): TScenarioMessage => ({
  column: 1,
  constraint: 'symbol/access-node-master-export',
  element: file,
  filePath: file,
  line: 1,
  message: `symbol/access-node-master-export: '${file}' does not re-export the Symbol of its Master Node (FAF §6.1.1).`,
  messageId: 'symbol',
  ruleId: 'faf/conformity',
  severity: 2,
});

const treeAuthorizationOutcome = (
  from: string,
  to: string,
  spec: string
): TScenarioMessage => ({
  column: 1,
  constraint: 'dependency/tree-authorization',
  element: from,
  filePath: from,
  line: 1,
  message: formatEdgeMessage(
    'dependency/tree-authorization',
    from,
    to,
    spec,
    'a dependency between Fractal Trees requires an oriented treeDependencies authorization',
    'FAF §7.2, §7.3'
  ),
  messageId: 'dependency',
  ruleId: 'faf/conformity',
  severity: 2,
});

const treeOpacityOutcome = (
  from: string,
  to: string,
  spec: string
): TScenarioMessage => ({
  column: 1,
  constraint: 'dependency/tree-opacity',
  element: from,
  filePath: from,
  line: 1,
  message: formatEdgeMessage(
    'dependency/tree-opacity',
    from,
    to,
    spec,
    'only the Public Surface of a Fractal Tree is importable from outside the Tree',
    'FAF §7.1'
  ),
  messageId: 'dependency',
  ruleId: 'faf/conformity',
  severity: 2,
});

const unknownPropertyOutcome = (propertyPath: string): TScenarioMessage => ({
  column: 1,
  constraint: 'configuration/unknown-property',
  element: propertyPath,
  filePath: 'fafconfig.ts',
  line: 1,
  message: `configuration/unknown-property: '${propertyPath}' is not a recognized property (D-14).`,
  messageId: 'configuration',
  ruleId: 'faf/conformity',
  severity: 2,
});

const fragmentNodeRankOutcome = (element: string): TScenarioMessage => ({
  column: 1,
  constraint: 'classification/fragment-node-rank',
  element,
  filePath: element,
  line: 1,
  message: `classification/fragment-node-rank: '${element}' has a Rank not strictly lower than the Master Node of its Fragment (FAF §6.1.3).`,
  messageId: 'classification',
  ruleId: 'faf/conformity',
  severity: 2,
});

const horizontalHierarchyMembersOutcome = (
  element: string
): TScenarioMessage => ({
  column: 1,
  constraint: 'classification/horizontal-hierarchy-members',
  element,
  filePath: 'fafconfig.ts',
  line: 1,
  message: `classification/horizontal-hierarchy-members: '${element}' has a Horizontal Hierarchy over children that FAF does not allow to be ordered (FAF §6.9).`,
  messageId: 'classification',
  ruleId: 'faf/conformity',
  severity: 2,
});

const sortMessages = (
  messages: readonly TScenarioMessage[]
): readonly TScenarioMessage[] => {
  const sorted = [...messages];
  sorted.sort((left, right) => {
    if (left.filePath !== right.filePath) {
      return left.filePath < right.filePath ? -1 : 1;
    }
    if (left.line !== right.line) {
      return left.line - right.line;
    }
    if (left.column !== right.column) {
      return left.column - right.column;
    }
    if (left.message !== right.message) {
      return left.message < right.message ? -1 : 1;
    }
    return 0;
  });
  return sorted;
};

const cycleOutcome = (
  filePath: string,
  segments: readonly (readonly string[])[]
): TScenarioMessage => {
  const segmentsText = segments
    .map((segment) => segment.join(' -> '))
    .join('; ');
  return {
    column: 1,
    constraint: 'acyclicity/dependency-cycle',
    element: filePath,
    filePath,
    line: 1,
    message: `acyclicity/dependency-cycle: '${filePath}' is part of a dependency cycle: ${segmentsText} (FAF §5).`,
    messageId: 'acyclicity',
    ruleId: 'faf/conformity',
    severity: 2,
  };
};

const collectInternalRankViolations = (
  from: string,
  to: string,
  isAllowed: boolean,
  source: string,
  destination: string,
  directory: string
): readonly TScenarioMessage[] => {
  const violations: TScenarioMessage[] = [];
  if (!isAllowed) {
    if (from === 'index') {
      violations.push(
        accessNodeSourcesOutcome(
          source,
          destination,
          specifier(source, destination)
        )
      );
    }
    violations.push(
      peerSeparationOutcome(source, destination, specifier(source, destination))
    );
    if (to === 'spec' || to === 'story') {
      violations.push(
        subGraphNodeIsolationOutcome(
          source,
          destination,
          specifier(source, destination)
        )
      );
    }
  }

  if (from === 'component' && to === 'index') {
    violations.push(
      cycleOutcome(`${directory}/index.ts`, [
        [
          `${directory}/index.ts`,
          `${directory}/unit.component.ts`,
          `${directory}/index.ts`,
        ],
      ])
    );
  }

  const rankRoles = new Set(['context', 'job', 'repository', 'service']);
  if (rankRoles.has(from)) {
    violations.push(fragmentNodeRankOutcome(source));
  }
  if (rankRoles.has(to)) {
    violations.push(fragmentNodeRankOutcome(destination));
  }
  return violations;
};

const runScenario = async (
  tree: FileTree,
  config: Readonly<Record<string, unknown>>,
  responsiblePart: string,
  expected: readonly TScenarioMessage[]
): Promise<void> => {
  const fixture = await createProject(tree, config);
  try {
    expectScenario(
      await lintScenario(fixture.path),
      responsiblePart,
      sortMessages(expected)
    );
  } finally {
    await fixture.rm();
  }
};

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

const children = [
  'table-body',
  'table-cell',
  'table-head',
  'table-header-cell',
  'table-row',
] as const;

const childPairs = children.flatMap((from) =>
  children.filter((to) => from !== to).map((to) => [from, to] as const)
);

const moleculesTree: Readonly<Record<string, string>> = {
  'src/_components/_atoms/unit/index.ts':
    "export { value } from './unit.component.js';\n",
  'src/_components/_atoms/unit/unit.component.ts': value,
  'src/_components/_atoms/unit/unit.type.ts': value,
  'src/_components/_molecules/consumer/consumer.component.ts': value,
  'src/_components/_molecules/consumer/consumer.type.ts': value,
  'src/_components/_molecules/consumer/index.ts':
    "export { value } from './consumer.component.js';\n",
};

const layersTree: Readonly<Record<string, string>> = {
  'src/_high/_types/consumer.type.ts': value,
  'src/_low/_components/unit/index.ts':
    "export { value } from './unit.component.js';\n",
  'src/_low/_components/unit/unit.component.ts': value,
  'src/_low/_components/unit/unit.type.ts': value,
};

const foreignTree: Readonly<Record<string, string>> = {
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
  publicRootNodes: ['other/main.ts'],
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
] as const;

describe('acceptance: p7a', () => {
  const WARMUP_TIMEOUT_MS = 120_000;
  beforeAll(warmupESLint, WARMUP_TIMEOUT_MS);

  describe('Rule: The public interface of a Fragment cannot be bypassed by external consumers', () => {
    it.each([
      [
        'Root Node of the parent of the Private Category containing F',
        'src/app/app.ts',
        'src/app/_components/shell',
        'shell',
      ],
      [
        'Fragment Node of the parent of the Private Category containing F',
        `${table}/table.component.ts`,
        body,
        'table-body',
      ],
      [
        'Sub-Graph Node of the parent of the Private Category containing F',
        `${table}/table.spec.ts`,
        body,
        'table-body',
      ],
      [
        'Fragment Node in a sibling Sub-Category of higher Rank',
        'src/_components/_molecules/consumer/consumer.component.ts',
        'src/_components/_atoms/unit',
        'unit',
      ],
      [
        'Category Node in a sibling Layer of higher Rank',
        'src/_high/_types/consumer.type.ts',
        'src/_low/_components/unit',
        'unit',
      ],
      [
        'authorized consumer of the Fractal Branch that exposes F',
        'src/main.ts',
        table,
        'table',
      ],
    ] as const)(
      'a permission to reach the Fragment does not expose its Fragment Nodes: %s',
      async (_label, consumer, target, name) => {
        const access = `${target}/index.ts`;
        const master = `${target}/${name}.component.ts`;
        const type = `${target}/${name}.type.ts`;
        const isMolecules = consumer.includes('_molecules');
        const isHighLayer = consumer.includes('_high');

        let baseTree = tableTree;
        if (isMolecules) {
          baseTree = moleculesTree;
        }
        if (isHighLayer) {
          baseTree = layersTree;
        }
        const extraTree: Record<string, string> = {
          ...baseTree,
          [consumer]: `import '${specifier(consumer, access)}';\nimport '${specifier(consumer, master)}';\nimport '${specifier(consumer, type)}';\n${value}`,
          [type]: value,
        };

        const config =
          isMolecules || isHighLayer
            ? {
                faf: {
                  locals: [
                    {
                      horizontalHierarchies: [
                        isMolecules
                          ? [['_atoms'], ['_molecules']]
                          : [['_low'], ['_high']],
                      ],
                      roles,
                      rootLayers: ['src'],
                    },
                  ],
                },
              }
            : { faf: { locals: [local] } };

        await runScenario(extraTree, config, 'fragment-encapsulation', [
          fragmentEncapsulationOutcome(
            consumer,
            master,
            specifier(consumer, master),
            2,
            1
          ),
          fragmentEncapsulationOutcome(
            consumer,
            type,
            specifier(consumer, type),
            3,
            1
          ),
        ]);
      }
    );

    it('anchors an encapsulation error at the import rather than the configuration', async () => {
      const source = 'src/main.ts';
      const destination = `${table}/table.component.ts`;
      await runScenario(
        {
          ...tableTree,
          [source]: `\n  import '${specifier(source, destination)}';\n`,
        },
        { faf: { locals: [local] } },
        'fragment-encapsulation',
        [
          fragmentEncapsulationOutcome(
            source,
            destination,
            specifier(source, destination),
            2,
            3
          ),
        ]
      );
    });

    it('the existence of the Access Node does not cancel peer separation', async () => {
      const source = 'src/_components/first/first.component.ts';
      const destination = 'src/_components/second/index.ts';
      await runScenario(
        {
          'src/_components/first/first.component.ts': `import '${specifier(source, destination)}';\n${value}`,
          'src/_components/first/index.ts':
            "export { value } from './first.component.js';\n",
          'src/_components/second/index.ts':
            "export { value } from './second.component.js';\n",
          'src/_components/second/second.component.ts': value,
        },
        { faf: { locals: [{ roles, rootLayers: ['src'] }] } },
        'peer-separation',
        [
          peerSeparationOutcome(
            source,
            destination,
            specifier(source, destination)
          ),
        ]
      );
    });
  });

  describe('Rule: The internal hierarchy of a Fragment is mandatory and strictly descending', () => {
    it('applies the reference Roles model when adopted by the architect', async () => {
      await runScenario(
        {
          'src/_components/unit/index.ts':
            "export { value } from './unit.component.js';\n",
          'src/_components/unit/unit.component.ts':
            "import './unit.type.js';\nimport './unit.constant.js';\nexport const value = 1;\n",
          'src/_components/unit/unit.constant.ts': value,
          'src/_components/unit/unit.type.ts':
            "import './unit.constant.js';\nexport const value = 1;\n",
          'src/main.ts': "import './_components/unit/index.js';\n",
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
        },
        'peer-separation',
        []
      );
    });

    it.each(internalRanks)(
      'compares only direct Fragment siblings: %s to %s (%s)',
      async (from, to, allowed) => {
        const directory = 'src/_components/unit';
        const source = `${directory}/${nodeFile(from)}`;
        const destination = `${directory}/${nodeFile(to)}`;
        const violations = collectInternalRankViolations(
          from,
          to,
          allowed,
          source,
          destination,
          directory
        );

        const getResponsiblePart = (): string => {
          if (to === 'spec' || to === 'story') {
            return 'sub-graph-node-isolation';
          }
          if (from === 'index' && !allowed) {
            return 'access-node-contract';
          }
          return 'peer-separation';
        };
        const responsiblePart = getResponsiblePart();

        const indexExport = "export { value } from './unit.component.js';\n";
        const sourceTail = from === 'index' ? indexExport : value;
        const destinationContent = to === 'index' ? indexExport : value;

        await runScenario(
          {
            [`${directory}/index.ts`]: indexExport,
            [`${directory}/unit.component.ts`]: value,
            [destination]: destinationContent,
            [source]: `import '${specifier(source, destination)}';\n${sourceTail}`,
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
          },
          responsiblePart,
          violations
        );
      }
    );

    it('allows same-Rank local responsibilities to coexist without mutual internal dependencies', async () => {
      await runScenario(
        {
          'src/_components/unit/index.ts':
            "export { value } from './unit.component.js';\n",
          'src/_components/unit/unit.component.ts': value,
          'src/_components/unit/unit.controller.ts':
            "import './unit.type.js';\n",
          'src/_components/unit/unit.handler.ts': "import './unit.type.js';\n",
          'src/_components/unit/unit.hook.ts': "import './unit.type.js';\n",
          'src/_components/unit/unit.type.ts': value,
        },
        { faf: { locals: [{ roles, rootLayers: ['src'] }] } },
        'peer-separation',
        []
      );

      const source = 'src/_components/unit/unit.controller.ts';
      const destination = 'src/_components/unit/unit.handler.ts';
      await runScenario(
        {
          'src/_components/unit/index.ts':
            "export { value } from './unit.component.js';\n",
          'src/_components/unit/unit.component.ts': value,
          'src/_components/unit/unit.controller.ts': `import '${specifier(source, destination)}';\n`,
          'src/_components/unit/unit.handler.ts': value,
          'src/_components/unit/unit.hook.ts': value,
          'src/_components/unit/unit.type.ts': value,
        },
        { faf: { locals: [{ roles, rootLayers: ['src'] }] } },
        'peer-separation',
        [
          peerSeparationOutcome(
            source,
            destination,
            specifier(source, destination)
          ),
        ]
      );
    });

    it('composes collaborating capabilities using distinct Fragments without applying same-rank peer restrictions', async () => {
      const source = `${table}/_components/consumer/consumer.component.ts`;
      const destination = `${context}/index.ts`;
      await runScenario(
        {
          ...tableTree,
          [`${table}/_components/consumer/index.ts`]:
            "export { value } from './consumer.component.js';\n",
          [source]: `import '${specifier(source, destination)}';\n${value}`,
        },
        { faf: { locals: [local] } },
        'peer-separation',
        []
      );
    });

    it('forbids placing a Fragment Node whose Rank is not strictly lower than the Master in the same Fragment', async () => {
      const contextNode = 'src/_components/unit/unit.context.ts';
      await runScenario(
        {
          [contextNode]: value,
          'src/_components/unit/index.ts':
            "export { value } from './unit.component.js';\n",
          'src/_components/unit/unit.component.ts': value,
        },
        { faf: { locals: [{ roles, rootLayers: ['src'] }] } },
        'fragment-anatomy',
        [fragmentNodeRankOutcome(contextNode)]
      );
    });

    it('derives a common top Rank from a custom catalog without imposing the reference model', async () => {
      await runScenario(
        {
          'src/_utils/unit/index.ts':
            "export { value } from './unit.util.js';\n",
          'src/_utils/unit/unit.spec.ts':
            "import './unit.util.js';\nimport './unit.type.js';\n",
          'src/_utils/unit/unit.story.ts': "import './unit.type.js';\n",
          'src/_utils/unit/unit.type.ts': value,
          'src/_utils/unit/unit.util.ts':
            "import './unit.type.js';\nexport const value = 1;\n",
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
        },
        'peer-separation',
        []
      );
    });

    it.each([
      [
        'Access Node Rank',
        { ...local, accessNodeRank: 0 },
        'faf.locals[0].accessNodeRank',
      ],
      [
        'Sub-Graph Role Rank',
        { ...local, subGraphRoles: [{ name: 'spec', rank: 0 }] },
        'faf.locals[0].subGraphRoles[0].rank',
      ],
    ] as const)(
      'rejects a declaration that tries to assign a rank to %s',
      async (_name, declaration, propertyPath) => {
        await runScenario(
          tableTree,
          { faf: { locals: [declaration] } },
          'validate-config-format',
          [unknownPropertyOutcome(propertyPath)]
        );
      }
    );

    it('the hierarchy of Roles does not automatically order different Fragments', async () => {
      const source = 'src/_components/alpha/alpha.component.ts';
      const destination = 'src/_components/beta/index.ts';
      await runScenario(
        {
          'src/_components/alpha/alpha.component.ts': `import '${specifier(source, destination)}';\n${value}`,
          'src/_components/alpha/index.ts':
            "export { value } from './alpha.component.js';\n",
          'src/_components/beta/beta.component.ts': value,
          'src/_components/beta/beta.type.ts': value,
          'src/_components/beta/index.ts':
            "export { value } from './beta.component.js';\nexport { value as typeValue } from './beta.type.js';\n",
        },
        { faf: { locals: [{ roles, rootLayers: ['src'] }] } },
        'peer-separation',
        [
          peerSeparationOutcome(
            source,
            destination,
            specifier(source, destination)
          ),
        ]
      );
    });

    it('local Ranks do not become global constraints across Sub-Categories', async () => {
      const source = 'src/_components/_molecules/consumer/consumer.type.ts';
      const destination = 'src/_components/_atoms/unit/index.ts';
      await runScenario(
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
        },
        'peer-separation',
        []
      );
    });
  });

  describe('Rule: Sub-Graph Nodes are non-importable entries, not FAF-exempt zones', () => {
    it('allows a Sub-Graph Node to consume lower Fragment Nodes of the same Fragment', async () => {
      await runScenario(
        {
          'src/_components/unit/index.ts':
            "export { value } from './unit.component.js';\n",
          'src/_components/unit/unit.component.ts': value,
          'src/_components/unit/unit.spec.ts':
            "import './unit.component.js';\n",
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
        },
        'peer-separation',
        []
      );
    });

    it.each([
      [
        'Fragment Node of the same Fragment',
        `${body}/table-body.component.ts`,
        (source: string, destination: string, spec: string) => [
          peerSeparationOutcome(source, destination, spec),
          subGraphNodeIsolationOutcome(source, destination, spec),
        ],
      ],
      [
        'Access Node of the same Fragment',
        `${body}/index.ts`,
        (source: string, destination: string, spec: string) => [
          accessNodeSourcesOutcome(source, destination, spec),
          peerSeparationOutcome(source, destination, spec),
          subGraphNodeIsolationOutcome(source, destination, spec),
        ],
      ],
      [
        'another Sub-Graph Node of the same Fragment',
        `${body}/table-body.spec.ts`,
        (source: string, destination: string, spec: string) => [
          peerSeparationOutcome(source, destination, spec),
          subGraphNodeIsolationOutcome(source, destination, spec),
        ],
      ],
      [
        'a node in a Sub-Fragment',
        `${body}/_utils/deep/deep.util.ts`,
        (source: string, destination: string, spec: string) => [
          privateCategoryUnidirectionalityOutcome(source, destination, spec),
          subGraphNodeIsolationOutcome(source, destination, spec),
        ],
      ],
      [
        'Root Node',
        'src/main.ts',
        (source: string, destination: string, spec: string) => [
          privateCategoryVisibilityOutcome(source, destination, spec),
          subGraphNodeIsolationOutcome(source, destination, spec),
        ],
      ],
      [
        'node of another Execution Sub-Graph',
        `${table}/table.spec.ts`,
        (source: string, destination: string, spec: string) => [
          subGraphNodeIsolationOutcome(source, destination, spec),
        ],
      ],
    ] as const)(
      'no Logical Node may import a Sub-Graph Node: %s',
      async (_label, source, buildExpected) => {
        const destination = `${body}/table-body.story.ts`;
        const spec = specifier(source, destination);
        await runScenario(
          {
            ...tableTree,
            [destination]: value,
            [source]: `import '${spec}';\n${tableTree[source] ?? value}`,
          },
          { faf: { locals: [local] } },
          'sub-graph-node-isolation',
          buildExpected(source, destination, spec)
        );
      }
    );

    it('an external runner entry is not an import between Logical Nodes', async () => {
      await runScenario(
        {
          'src/_utils/unit/index.ts':
            "export { value } from './unit.util.js';\n",
          'src/_utils/unit/unit.spec.ts': "import './unit.util.js';\n",
          'src/_utils/unit/unit.util.ts': value,
        },
        {
          faf: {
            locals: [
              {
                roles: [{ category: '_utils', name: 'util' }],
                rootFragments: [{ path: 'src', rootNodes: [] }],
                subGraphRoles: [{ name: 'spec' }],
              },
            ],
          },
        },
        'sub-graph-node-isolation',
        []
      );
    });

    it('an Execution Sub-Graph is defined by reachability and may share dependencies', async () => {
      await runScenario(
        {
          'src/_utils/unit/index.ts':
            "export { value } from './unit.util.js';\n",
          'src/_utils/unit/unit.spec.ts': "import './unit.util.js';\n",
          'src/_utils/unit/unit.util.ts': value,
          'src/main.ts': "import './_utils/unit/index.js';\n",
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
        },
        'sub-graph-node-isolation',
        []
      );
    });
  });

  describe('Rule: Private Categories are accessible from outside only to enabled direct nodes of the parent', () => {
    it('privacy is automatic and cannot be disabled by label', async () => {
      const propertyPath = 'faf.locals[0].privateCategories';
      await runScenario(
        tableTree,
        {
          faf: {
            locals: [
              {
                ...local,
                privateCategories: { [`${table}/_components`]: false },
              },
            ],
          },
        },
        'validate-config-format',
        [unknownPropertyOutcome(propertyPath)]
      );
    });

    it.each([
      [
        'direct Fragment Node of parent',
        `${table}/table.component.ts`,
        () => [],
      ],
      ['direct Sub-Graph Node of parent', `${table}/table.spec.ts`, () => []],
      [
        'Access Node of parent',
        `${table}/index.ts`,
        (source: string, destination: string, spec: string) => [
          accessNodeSourcesOutcome(source, destination, spec),
          privateCategoryVisibilityOutcome(source, destination, spec),
        ],
      ],
      [
        'node in sibling Private Category',
        `${sorter}/sort-table-rows.util.ts`,
        (source: string, destination: string, spec: string) => [
          peerSeparationOutcome(source, destination, spec),
          privateCategoryVisibilityOutcome(source, destination, spec),
        ],
      ],
      [
        'node in direct Fractal Branch of parent',
        `${context}/table-context.context.ts`,
        (source: string, destination: string, spec: string) => [
          fractalBranchUnidirectionalityOutcome(source, destination, spec),
          peerSeparationOutcome(source, destination, spec),
          privateCategoryVisibilityOutcome(source, destination, spec),
        ],
      ],
      [
        'node outside parent subtree',
        'src/main.ts',
        (source: string, destination: string, spec: string) => [
          privateCategoryVisibilityOutcome(source, destination, spec),
        ],
      ],
    ] as const)(
      'verifies external consumers of a Fragment Private Category: %s',
      async (_label, source, buildExpected) => {
        const destination = `${body}/index.ts`;
        const spec = specifier(source, destination);
        await runScenario(
          {
            ...tableTree,
            [source]: `import '${spec}';\n${tableTree[source] ?? value}`,
          },
          { faf: { locals: [local] } },
          'private-category-visibility',
          buildExpected(source, destination, spec)
        );
      }
    );

    it.each([
      ['direct Root Node of R', 'src/app/app.ts', () => []],
      [
        'Root Node in child Root Fragment',
        'src/app/child/child.ts',
        (source: string, destination: string, spec: string) => [
          privateCategoryVisibilityOutcome(source, destination, spec),
        ],
      ],
      [
        'Root Node in ancestor Root Fragment',
        'src/main.ts',
        (source: string, destination: string, spec: string) => [
          privateCategoryVisibilityOutcome(source, destination, spec),
        ],
      ],
      [
        'node in sibling Private Category',
        'src/app/_utils/helper/helper.util.ts',
        (source: string, destination: string, spec: string) => [
          peerSeparationOutcome(source, destination, spec),
          privateCategoryVisibilityOutcome(source, destination, spec),
        ],
      ],
      [
        'node in direct Fractal Branch of R',
        'src/app/_app@shared/_types/local.type.ts',
        (source: string, destination: string, spec: string) => [
          fractalBranchUnidirectionalityOutcome(source, destination, spec),
          peerSeparationOutcome(source, destination, spec),
          privateCategoryVisibilityOutcome(source, destination, spec),
        ],
      ],
    ] as const)(
      'verifies external consumers of a Root Fragment Private Category: %s',
      async (_label, source, buildExpected) => {
        const destination = 'src/app/_components/shell/index.ts';
        const spec = specifier(source, destination);
        await runScenario(
          {
            ...tableTree,
            [source]: `import '${spec}';\n${tableTree[source] ?? value}`,
          },
          { faf: { locals: [local] } },
          'private-category-visibility',
          buildExpected(source, destination, spec)
        );
      }
    );

    it('privacy does not forbid collaboration inside the same Private Category', async () => {
      const source =
        'src/_components/_molecules/consumer/consumer.component.ts';
      const destination = 'src/_components/_atoms/unit/index.ts';
      await runScenario(
        {
          [source]: `import '${specifier(source, destination)}';\n${value}`,
          'src/_components/_atoms/unit/index.ts':
            "export { value } from './unit.component.js';\n",
          'src/_components/_atoms/unit/unit.component.ts': value,
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
        },
        'private-category-visibility',
        []
      );
    });

    it.each([
      [`${table}/table.component.ts`],
      [`${table}/table.type.ts`],
      [`${table}/table.spec.ts`],
    ] as const)(
      'an authorized parent must still pass through the Access Node of the Sub-Fragment: %s',
      async (source) => {
        const access = `${body}/index.ts`;
        const master = `${body}/table-body.component.ts`;
        const type = `${body}/table-body.type.ts`;
        await runScenario(
          {
            ...tableTree,
            [source]: `import '${specifier(source, access)}';\nimport '${specifier(source, master)}';\nimport '${specifier(source, type)}';\n${value}`,
          },
          { faf: { locals: [local] } },
          'fragment-encapsulation',
          [
            fragmentEncapsulationOutcome(
              source,
              master,
              specifier(source, master),
              2,
              1
            ),
            fragmentEncapsulationOutcome(
              source,
              type,
              specifier(source, type),
              3,
              1
            ),
          ]
        );
      }
    );

    it('parent authorization does not cross a second Private Category', async () => {
      const source = `${table}/table.component.ts`;
      const destination = `${body}/_utils/deep/index.ts`;
      await runScenario(
        {
          ...tableTree,
          [source]: `import '${specifier(source, destination)}';\n${value}`,
        },
        { faf: { locals: [local] } },
        'private-category-visibility',
        [
          privateCategoryVisibilityOutcome(
            source,
            destination,
            specifier(source, destination)
          ),
        ]
      );
    });

    it.each([
      [`${body}/table-body.component.ts`, `${table}/table.component.ts`],
      [`${body}/table-body.component.ts`, `${table}/table.type.ts`],
      [`${body}/table-body.component.ts`, `${table}/table.spec.ts`],
      [`${body}/table-body.component.ts`, `${table}/index.ts`],
      ['src/app/_components/shell/shell.component.ts', 'src/app/app.ts'],
    ] as const)(
      'forbids flow from private details to direct nodes of the parent: %s to %s',
      async (source, destination) => {
        const spec = specifier(source, destination);
        const violations = [
          privateCategoryUnidirectionalityOutcome(source, destination, spec),
        ];
        if (destination === `${table}/table.spec.ts`) {
          violations.push(
            subGraphNodeIsolationOutcome(source, destination, spec)
          );
        }
        if (destination === 'src/app/app.ts') {
          violations.push(rootNodeDisciplineOutcome(source, destination, spec));
        }
        await runScenario(
          {
            ...tableTree,
            [source]: `import '${spec}';\n${value}`,
          },
          { faf: { locals: [local] } },
          'private-category-visibility',
          violations
        );
      }
    );

    it('a hierarchy cannot make sibling Private Categories communicate', async () => {
      const source = 'src/_components/button/button.component.ts';
      const destination = 'src/_hooks/use-toggle/index.ts';
      const spec = specifier(source, destination);
      await runScenario(
        {
          [source]: `import '${spec}';\n${value}`,
          'src/_components/button/index.ts':
            "export { value } from './button.component.js';\n",
          'src/_hooks/use-toggle/index.ts':
            "export { value } from './use-toggle.hook.js';\n",
          'src/_hooks/use-toggle/use-toggle.hook.ts': value,
        },
        {
          faf: {
            locals: [
              {
                horizontalHierarchies: [[['_hooks'], ['_components']]],
                roles,
                rootFragments: [{ path: 'src', rootNodes: [] }],
              },
            ],
          },
        },
        'horizontal-hierarchies',
        [
          horizontalHierarchyMembersOutcome('src'),
          peerSeparationOutcome(source, destination, spec),
          privateCategoryVisibilityOutcome(source, destination, spec),
        ]
      );
    });
  });

  describe('Rule: Visibility of a Fractal Branch descends recursively in the perimeter of its parent', () => {
    it.each([
      ['direct Root Node of src', 'src/main.ts', () => []],
      ['nested Root Fragment Root Node', 'src/app/app.ts', () => []],
      [
        'Fragment Node in Private Category of nested Root Fragment',
        'src/app/_components/shell/shell.component.ts',
        () => [],
      ],
      [
        'Category Node in Branch of nested Root Fragment',
        'src/app/_app@shared/_types/local.type.ts',
        () => [],
      ],
      [
        'Fragment Node in deeper Sub-Fragment',
        'src/app/_utils/helper/helper.util.ts',
        () => [],
      ],
      [
        'Logical Node outside src',
        'outside/outside.ts',
        (source: string, destination: string, spec: string) => [
          fractalBranchVisibilityOutcome(source, destination, spec),
          treeAuthorizationOutcome(source, destination, spec),
          treeOpacityOutcome(source, destination, spec),
        ],
      ],
    ] as const)(
      'verifies who can enter the Branch of the Root Fragment src: %s',
      async (_label, source, buildExpected) => {
        const destination = `${table}/index.ts`;
        const spec = specifier(source, destination);
        await runScenario(
          {
            ...tableTree,
            'outside/outside.ts': value,
            [source]: `import '${spec}';\n${tableTree[source] ?? value}`,
          },
          {
            faf: {
              locals: [
                local,
                {
                  roles: [],
                  rootFragments: [
                    { path: 'outside', rootNodes: [['outside.ts']] },
                  ],
                },
              ],
            },
          },
          'fractal-branch-visibility',
          buildExpected(source, destination, spec)
        );
      }
    );

    it.each([
      ['direct Fragment Node of F', `${table}/table.component.ts`, () => []],
      ['direct Sub-Graph Node of F', `${table}/table.spec.ts`, () => []],
      [
        'Fragment Node in Private Category of F',
        `${body}/table-body.component.ts`,
        () => [],
      ],
      [
        'Category Node in deeper Branch of F',
        `${reader}/use-table-context.hook.ts`,
        () => [],
      ],
      [
        'direct Access Node of F',
        `${table}/index.ts`,
        (source: string, destination: string, spec: string) => [
          accessNodeSourcesOutcome(source, destination, spec),
          fractalBranchVisibilityOutcome(source, destination, spec),
        ],
      ],
      [
        'node outside F subtree',
        'src/main.ts',
        (source: string, destination: string, spec: string) => [
          fractalBranchVisibilityOutcome(source, destination, spec),
        ],
      ],
    ] as const)(
      'verifies who can enter the local Branch of a Fragment: %s',
      async (_label, source, buildExpected) => {
        const destination = `${context}/index.ts`;
        const spec = specifier(source, destination);
        await runScenario(
          {
            ...tableTree,
            [source]: `import '${spec}';\n${tableTree[source] ?? value}`,
          },
          { faf: { locals: [local] } },
          'fractal-branch-visibility',
          buildExpected(source, destination, spec)
        );
      }
    );

    it('nodes inside the Branch do not obtain universal authorization from the Branch itself', async () => {
      const source = 'src/_src@shared/_components/first/first.component.ts';
      const destination = 'src/_src@shared/_components/second/index.ts';
      await runScenario(
        {
          'src/_src@shared/_components/first/first.component.ts': `import '${specifier(source, destination)}';\n${value}`,
          'src/_src@shared/_components/first/index.ts':
            "export { value } from './first.component.js';\n",
          'src/_src@shared/_components/second/index.ts':
            "export { value } from './second.component.js';\n",
          'src/_src@shared/_components/second/second.component.ts': value,
          'src/main.ts': value,
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
        },
        'peer-separation',
        [
          peerSeparationOutcome(
            source,
            destination,
            specifier(source, destination)
          ),
        ]
      );
    });

    it.each([
      '_domain/_types/_primitives/public.type.ts',
      '_domain/_nested/_types/public.type.ts',
      '_domain/_pages/get-user/index.ts',
      '_ui/_types/public.type.ts',
    ])(
      'a consumer outside the Branch does not have to satisfy internal hierarchies not crossed as peers: %s',
      async (target) => {
        const prefix = 'src/_src@shared';
        const destination = `${prefix}/${target}`;
        const isNested = target.includes('_nested');
        const isPages = target.includes('_pages');
        let domainTree: FileTree = {
          [`${prefix}/_domain/_types/_primitives/public.type.ts`]: value,
        };
        if (isNested) {
          domainTree = {
            [`${prefix}/_domain/_nested/_types/public.type.ts`]: value,
          };
        }
        if (isPages) {
          domainTree = {
            [`${prefix}/_domain/_pages/get-user/get-user.page.ts`]: value,
            [`${prefix}/_domain/_pages/get-user/index.ts`]:
              "export { value } from './get-user.page.js';\n",
          };
        }

        await runScenario(
          {
            ...domainTree,
            [`${prefix}/_ui/_types/public.type.ts`]: value,
            'src/main.ts': `import '${specifier('src/main.ts', destination)}';\n`,
          },
          {
            faf: {
              locals: [
                {
                  horizontalHierarchies: [[['_domain'], ['_ui']]],
                  mimeticPathStructures: isPages
                    ? [
                        {
                          actions: ['get'],
                          paths: [`${prefix}/_domain/_pages`],
                        },
                      ]
                    : [],
                  roles,
                  rootFragments: [{ path: 'src', rootNodes: [['main.ts']] }],
                },
              ],
            },
          },
          'fractal-branch-visibility',
          []
        );
      }
    );

    it.each([
      [
        'direct Category Node',
        '_types/public.type.ts',
        'fractal-branch-visibility',
        () => [],
      ],
      [
        'Fragment interface',
        '_components/unit/index.ts',
        'fractal-branch-visibility',
        () => [],
      ],
      [
        'Sub-Category Category Node',
        '_domain/_types/_primitives/public.type.ts',
        'fractal-branch-visibility',
        () => [],
      ],
      [
        'Sub-Layer Category Node',
        '_domain/_nested/_types/public.type.ts',
        'fractal-branch-visibility',
        () => [],
      ],
      [
        'Path Fragment Access Node',
        '_domain/_pages/get-user/index.ts',
        'fractal-branch-visibility',
        () => [],
      ],
      [
        'internal Fragment Node',
        '_components/unit/unit.component.ts',
        'fragment-encapsulation',
        (source: string, destination: string, spec: string) => [
          fragmentEncapsulationOutcome(source, destination, spec),
        ],
      ],
      [
        'internal Sub-Graph Node',
        '_components/unit/unit.spec.ts',
        'sub-graph-node-isolation',
        (source: string, destination: string, spec: string) => [
          subGraphNodeIsolationOutcome(source, destination, spec),
        ],
      ],
      [
        'unit in Private Category',
        '_components/unit/_utils/detail/index.ts',
        'private-category-visibility',
        (source: string, destination: string, spec: string) => [
          privateCategoryVisibilityOutcome(source, destination, spec),
        ],
      ],
      [
        'unit in further Branch whose parent does not contain consumer',
        '_components/unit/_unit@shared/_types/shared.type.ts',
        'fractal-branch-visibility',
        (source: string, destination: string, spec: string) => [
          fractalBranchVisibilityOutcome(source, destination, spec),
        ],
      ],
    ] as const)(
      'does not make Branch visibility transitive: %s',
      async (_label, target, responsiblePart, buildExpected) => {
        const prefix = 'src/_src@shared';
        const destination = `${prefix}/${target}`;
        const source = 'src/main.ts';
        const spec = specifier(source, destination);

        const isDomain = target.startsWith('_domain/');
        const isNested = target.includes('_nested');
        const isPages = target.includes('_pages');

        let targetTree: FileTree = {
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
        };

        if (isDomain) {
          targetTree = {
            [`${prefix}/_domain/_types/_primitives/public.type.ts`]: value,
          };
          if (isNested) {
            targetTree = {
              [`${prefix}/_domain/_nested/_types/public.type.ts`]: value,
            };
          }
          if (isPages) {
            targetTree = {
              [`${prefix}/_domain/_pages/get-user/get-user.page.ts`]: value,
              [`${prefix}/_domain/_pages/get-user/index.ts`]:
                "export { value } from './get-user.page.js';\n",
            };
          }
        }

        await runScenario(
          {
            ...targetTree,
            'src/main.ts': `import '${spec}';\n`,
          },
          {
            faf: {
              locals: [
                {
                  mimeticPathStructures: isPages
                    ? [
                        {
                          actions: ['get'],
                          paths: [`${prefix}/_domain/_pages`],
                        },
                      ]
                    : [],
                  roles,
                  rootFragments: [{ path: 'src', rootNodes: [['main.ts']] }],
                  subGraphRoles: [{ name: 'spec' }],
                },
              ],
            },
          },
          responsiblePart,
          buildExpected(source, destination, spec)
        );
      }
    );

    it('respects simultaneously the boundaries of apical and local Branches', async () => {
      const source = 'src/main.ts';
      const destination = 'src/app/_app@shared/_types/local.type.ts';
      const globalType = 'src/_src@shared/_types/global.type.ts';
      await runScenario(
        {
          ...tableTree,
          [destination]: `import '${specifier(destination, globalType)}';\n${value}`,
          [globalType]: value,
          [source]: `import '${specifier(source, destination)}';\n${value}`,
        },
        { faf: { locals: [local] } },
        'fractal-branch-visibility',
        [
          fractalBranchVisibilityOutcome(
            source,
            destination,
            specifier(source, destination)
          ),
        ]
      );
    });

    it('shared Branch does not grant access to sibling Private Categories', async () => {
      const branchSource = 'src/_components/btn/_btn@shared/_types/btn.type.ts';
      const privateDestination =
        'src/_components/btn/_components/icon/index.ts';
      const privateSource =
        'src/_components/btn/_components/icon/icon.component.ts';
      const branchDestination =
        'src/_components/btn/_btn@shared/_types/btn.type.ts';

      await runScenario(
        {
          'src/_components/btn/_btn@shared/_types/btn.type.ts': `import '${specifier(branchSource, privateDestination)}';\n${value}`,
          'src/_components/btn/_components/icon/icon.component.ts': `import '${specifier(privateSource, branchDestination)}';\n${value}`,
          'src/_components/btn/_components/icon/index.ts':
            "export { value } from './icon.component.js';\n",
          'src/_components/btn/btn.component.ts': value,
          'src/_components/btn/index.ts':
            "export { value } from './btn.component.js';\n",
        },
        { faf: { locals: [{ roles, rootLayers: ['src'] }] } },
        'private-category-visibility',
        [
          cycleOutcome(branchSource, [
            [branchSource, privateDestination, privateSource, branchSource],
          ]),
          fractalBranchUnidirectionalityOutcome(
            branchSource,
            privateDestination,
            specifier(branchSource, privateDestination)
          ),
          peerSeparationOutcome(
            branchSource,
            privateDestination,
            specifier(branchSource, privateDestination)
          ),
          privateCategoryVisibilityOutcome(
            branchSource,
            privateDestination,
            specifier(branchSource, privateDestination)
          ),
        ]
      );
    });

    it('authorizations stop at each further boundary encountered', async () => {
      const aliasPrefix = '#shared';
      const source = 'src/main.ts';
      const importSpec = `${aliasPrefix}/_components/table/_components/table-body/index.ts`;
      const destination = `${body}/index.ts`;

      await runScenario(
        {
          ...tableTree,
          [source]: `import '${importSpec}';\n`,
          'tsconfig.json': JSON.stringify({
            compilerOptions: {
              baseUrl: '.',
              paths: {
                [`${aliasPrefix}/*`]: ['./src/_src@shared/*'],
              },
            },
          }),
        },
        {
          faf: {
            common: {
              aliases: { [aliasPrefix]: 'src/_src@shared' },
              roles,
              subGraphRoles: local.subGraphRoles,
            },
            locals: [local],
          },
        },
        'private-category-visibility',
        [privateCategoryVisibilityOutcome(source, destination, importSpec)]
      );
    });
  });

  describe('Rule: Compound Component table composes isolated units and shares details through Branches of distinct scopes', () => {
    it('recognizes the complete Compound Component structure and distinct Branch scopes', async () => {
      await runScenario(
        tableTree,
        { faf: { locals: [local] } },
        'containment-matrix',
        []
      );
    });

    it.each(children)(
      'the parent aggregates %s through its Access Node and forbids its Master',
      async (child) => {
        const source = `${table}/table.component.ts`;
        const accessDestination = `${table}/_components/${child}/index.ts`;
        const masterDestination = `${table}/_components/${child}/${child}.component.ts`;

        await runScenario(
          {
            ...tableTree,
            [source]: `import '${specifier(source, accessDestination)}';\n${value}`,
          },
          { faf: { locals: [local] } },
          'private-category-visibility',
          []
        );

        await runScenario(
          {
            ...tableTree,
            [source]: `import '${specifier(source, masterDestination)}';\n${value}`,
          },
          { faf: { locals: [local] } },
          'fragment-encapsulation',
          [
            fragmentEncapsulationOutcome(
              source,
              masterDestination,
              specifier(source, masterDestination)
            ),
          ]
        );
      }
    );

    it.each(childPairs)(
      'parent composition does not authorize horizontal dependencies between %s and %s',
      async (from, to) => {
        const source = `${table}/_components/${from}/${from}.component.ts`;
        const accessDestination = `${table}/_components/${to}/index.ts`;
        const masterDestination = `${table}/_components/${to}/${to}.component.ts`;

        await runScenario(
          {
            ...tableTree,
            [source]: `import '${specifier(source, accessDestination)}';\n${value}`,
          },
          { faf: { locals: [local] } },
          'peer-separation',
          [
            peerSeparationOutcome(
              source,
              accessDestination,
              specifier(source, accessDestination)
            ),
          ]
        );

        await runScenario(
          {
            ...tableTree,
            [source]: `import '${specifier(source, masterDestination)}';\n${value}`,
          },
          { faf: { locals: [local] } },
          'peer-separation',
          [
            fragmentEncapsulationOutcome(
              source,
              masterDestination,
              specifier(source, masterDestination)
            ),
            peerSeparationOutcome(
              source,
              masterDestination,
              specifier(source, masterDestination)
            ),
          ]
        );
      }
    );

    it.each([
      [
        '_components/table-body/table-body.component.ts',
        'fractal-branch-visibility',
        () => [],
      ],
      [
        '_components/table-cell/table-cell.component.ts',
        'fractal-branch-visibility',
        () => [],
      ],
      [
        '_components/table-head/table-head.component.ts',
        'fractal-branch-visibility',
        () => [],
      ],
      [
        '_components/table-header-cell/table-header-cell.component.ts',
        'fractal-branch-visibility',
        () => [],
      ],
      [
        '_components/table-header-cell/table-header-cell.hook.ts',
        'fractal-branch-visibility',
        () => [],
      ],
      [
        '_components/table-row/table-row.component.ts',
        'fractal-branch-visibility',
        () => [],
      ],
      [
        '_components/table-row/index.ts',
        'access-node-contract',
        (s: string, d: string, spec: string) => [
          accessNodeSourcesOutcome(s, d, spec),
        ],
      ],
      [
        'table.component.ts',
        'fractal-branch-visibility',
        (s: string, d: string, spec: string) => [
          fractalBranchVisibilityOutcome(s, d, spec),
        ],
      ],
      [
        'table.hook.ts',
        'fractal-branch-visibility',
        (s: string, d: string, spec: string) => [
          fractalBranchVisibilityOutcome(s, d, spec),
        ],
      ],
      [
        'table.spec.ts',
        'fractal-branch-visibility',
        (s: string, d: string, spec: string) => [
          fractalBranchVisibilityOutcome(s, d, spec),
        ],
      ],
      [
        'index.ts',
        'access-node-contract',
        (s: string, d: string, spec: string) => [
          accessNodeSourcesOutcome(s, d, spec),
          fractalBranchVisibilityOutcome(s, d, spec),
          privateCategoryVisibilityOutcome(s, d, spec),
        ],
      ],
      [
        '_utils/sort-table-rows/sort-table-rows.util.ts',
        'fractal-branch-visibility',
        (s: string, d: string, spec: string) => [
          fractalBranchVisibilityOutcome(s, d, spec),
          peerSeparationOutcome(s, d, spec),
          privateCategoryVisibilityOutcome(s, d, spec),
        ],
      ],
      [
        '_table@shared/_contexts/table-context/table-context.context.ts',
        'fractal-branch-visibility',
        (s: string, d: string, spec: string) => [
          fractalBranchUnidirectionalityOutcome(s, d, spec),
          fractalBranchVisibilityOutcome(s, d, spec),
          peerSeparationOutcome(s, d, spec),
          privateCategoryVisibilityOutcome(s, d, spec),
        ],
      ],
    ] as const)(
      'the reading hook has the scope of the _components Private Category only: %s',
      async (subSource, responsiblePart, buildExpected) => {
        const source = `${table}/${subSource}`;
        const destination = `${reader}/index.ts`;
        const spec = specifier(source, destination);

        await runScenario(
          {
            ...tableTree,
            [source]: `import '${spec}';\n${tableTree[source] ?? value}`,
          },
          { faf: { locals: [local] } },
          responsiblePart,
          buildExpected(source, destination, spec)
        );
      }
    );

    it.each([
      [
        `${table}/table.component.ts`,
        `${context}/index.ts`,
        'peer-separation',
        () => [],
      ],
      [
        `${table}/table.hook.ts`,
        `${context}/index.ts`,
        'peer-separation',
        () => [],
      ],
      [
        `${body}/table-body.component.ts`,
        `${context}/index.ts`,
        'peer-separation',
        () => [],
      ],
      [
        `${reader}/use-table-context.hook.ts`,
        `${context}/index.ts`,
        'peer-separation',
        () => [],
      ],
      [
        `${sorter}/sort-table-rows.util.ts`,
        sortType,
        'peer-separation',
        () => [],
      ],
      [
        `${sorter}/sort-table-rows.type.ts`,
        sortType,
        'peer-separation',
        () => [],
      ],
      [
        `${context}/table-context.context.ts`,
        sortType,
        'peer-separation',
        () => [],
      ],
      [
        `${context}/table-context.type.ts`,
        sortType,
        'peer-separation',
        () => [],
      ],
      [
        sortType,
        `${context}/index.ts`,
        'peer-separation',
        (s: string, d: string, spec: string) => [
          peerSeparationOutcome(s, d, spec),
        ],
      ],
      [
        `${table}/index.ts`,
        `${context}/index.ts`,
        'access-node-contract',
        (s: string, d: string, spec: string) => [
          accessNodeSourcesOutcome(s, d, spec),
          fractalBranchVisibilityOutcome(s, d, spec),
        ],
      ],
      [
        `${table}/index.ts`,
        sortType,
        'access-node-contract',
        (s: string, d: string, spec: string) => [
          accessNodeSourcesOutcome(s, d, spec),
          fractalBranchVisibilityOutcome(s, d, spec),
        ],
      ],
    ] as const)(
      'apical Branch exposes context and types within table respecting Category hierarchy: %s to %s',
      async (source, destination, responsiblePart, buildExpected) => {
        const spec = specifier(source, destination);
        await runScenario(
          {
            ...tableTree,
            [source]: `import '${spec}';\n${tableTree[source] ?? value}`,
          },
          { faf: { locals: [local] } },
          responsiblePart,
          buildExpected(source, destination, spec)
        );
      }
    );

    it('composes the reading hook and context without re-exporting imported Symbols', async () => {
      const source = `${table}/_components/table-header-cell/table-header-cell.hook.ts`;
      const hook = `${reader}/use-table-context.hook.ts`;
      const provider = `${context}/table-context.context.ts`;
      const hookAccess = `${reader}/index.ts`;
      const contextAccess = `${context}/index.ts`;

      await runScenario(
        {
          ...tableTree,
          [hook]: `import { value as context } from '${specifier(hook, contextAccess)}';\nexport const value = () => context;\n`,
          [provider]: `import { value as sort } from '${specifier(provider, sortType)}';\nexport const value = { sort };\n`,
          [source]: `import { value as read } from '${specifier(source, hookAccess)}';\nexport const value = () => read();\n`,
        },
        { faf: { locals: [local] } },
        're-export-prohibition',
        []
      );
    });

    it.each([
      [
        `${table}/_components/table-header-cell/table-header-cell.hook.ts`,
        'private-category-visibility',
        (s: string, d: string, spec: string) => [
          privateCategoryUnidirectionalityOutcome(s, d, spec),
        ],
      ],
      [
        `${reader}/use-table-context.hook.ts`,
        'private-category-visibility',
        (s: string, d: string, spec: string) => [
          privateCategoryUnidirectionalityOutcome(s, d, spec),
        ],
      ],
      [
        `${context}/table-context.context.ts`,
        'fractal-branch-unidirectionality',
        (s: string, d: string, spec: string) => [
          fractalBranchUnidirectionalityOutcome(s, d, spec),
        ],
      ],
      [
        `${sorter}/sort-table-rows.util.ts`,
        'private-category-visibility',
        (s: string, d: string, spec: string) => [
          privateCategoryUnidirectionalityOutcome(s, d, spec),
        ],
      ],
    ] as const)(
      'neither private details nor shared context may depend on direct nodes of table: %s',
      async (source, responsiblePart, buildExpected) => {
        for (const role of ['type', 'hook'] as const) {
          const destination = `${table}/table.${role}.ts`;
          const spec = specifier(source, destination);
          await runScenario(
            {
              ...tableTree,
              [source]: `import '${spec}';\n${tableTree[source] ?? value}`,
            },
            { faf: { locals: [local] } },
            responsiblePart,
            buildExpected(source, destination, spec)
          );
        }
      }
    );

    it.each([
      ['table.component.ts', () => []],
      [
        '_components/table-body/index.ts',
        (s: string, d: string, spec: string) => [
          accessNodeSourcesOutcome(s, d, spec),
          accessNodeMasterExportOutcome(s),
          privateCategoryVisibilityOutcome(s, d, spec),
        ],
      ],
      [
        '_components/table-cell/index.ts',
        (s: string, d: string, spec: string) => [
          accessNodeSourcesOutcome(s, d, spec),
          accessNodeMasterExportOutcome(s),
          privateCategoryVisibilityOutcome(s, d, spec),
        ],
      ],
      [
        '_components/table-head/index.ts',
        (s: string, d: string, spec: string) => [
          accessNodeSourcesOutcome(s, d, spec),
          accessNodeMasterExportOutcome(s),
          privateCategoryVisibilityOutcome(s, d, spec),
        ],
      ],
      [
        '_components/table-header-cell/index.ts',
        (s: string, d: string, spec: string) => [
          accessNodeSourcesOutcome(s, d, spec),
          accessNodeMasterExportOutcome(s),
          privateCategoryVisibilityOutcome(s, d, spec),
        ],
      ],
      [
        '_components/table-row/index.ts',
        (s: string, d: string, spec: string) => [
          accessNodeSourcesOutcome(s, d, spec),
          accessNodeMasterExportOutcome(s),
          privateCategoryVisibilityOutcome(s, d, spec),
        ],
      ],
      [
        '_components/_components@shared/_hooks/use-table-context/index.ts',
        (s: string, d: string, spec: string) => [
          accessNodeSourcesOutcome(s, d, spec),
          accessNodeMasterExportOutcome(s),
          fractalBranchVisibilityOutcome(s, d, spec),
          privateCategoryVisibilityOutcome(s, d, spec),
        ],
      ],
      [
        '_table@shared/_contexts/table-context/index.ts',
        (s: string, d: string, spec: string) => [
          accessNodeSourcesOutcome(s, d, spec),
          accessNodeMasterExportOutcome(s),
          fractalBranchVisibilityOutcome(s, d, spec),
        ],
      ],
    ] as const)(
      'limits the Compound Component Access Node to its own Fragment Nodes: %s',
      async (target, buildExpected) => {
        const source = `${table}/index.ts`;
        const destination = `${table}/${target}`;
        const spec = specifier(source, destination);

        await runScenario(
          {
            ...tableTree,
            [source]: `export { value } from '${spec}';\n`,
          },
          { faf: { locals: [local] } },
          'access-node-contract',
          buildExpected(source, destination, spec)
        );
      }
    );
  });

  describe('Rule: Foreign Nodes do not participate in the Dependency Graph', () => {
    it.each([
      'src/Foreign File.ts',
      `${table}/Foreign File.ts`,
      `${table}/_components/Foreign File.ts`,
      `${table}/_table@shared/Foreign File.ts`,
      `${body}/_table-body@shared/_layer/Foreign File.ts`,
      `${table}/_table@shared/_configs/_primitives/Foreign File.ts`,
      `${table}/_table@shared/_pages/users/Foreign File.ts`,
      'src/_tooling/_fixtures/Foreign File.ts',
    ] as const)(
      'hosts Foreign Nodes in any Logical Domain: %s',
      async (path) => {
        const isTooling = path.startsWith('src/_tooling');
        const isMimetic = path.includes('_pages');
        const usersFragment: FileTree = isMimetic
          ? {
              [`${table}/_table@shared/_pages/users/index.ts`]:
                "export { value } from './users.page.js';\n",
              [`${table}/_table@shared/_pages/users/users.page.tsx`]: value,
            }
          : {};
        await runScenario(
          { ...tableTree, ...usersFragment, [path]: value },
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
          },
          'containment-matrix',
          []
        );
      }
    );

    const resolveMainContent = (source: string, operation: string): string => {
      if (source === 'src/main.ts') {
        return operation;
      }
      if (source === 'external.ts') {
        return "import '../external.ts';\n";
      }
      return value;
    };

    it.each(foreignArcs)(
      'Foreign Nodes do not engage in import relations with codebase files: %s to %s (reExport: %s)',
      async (source, destination, reExport) => {
        const spec = specifier(source, destination);
        const operation = reExport
          ? `export { value } from '${spec}';\n`
          : `import '${spec}';\n`;
        const expected = [
          foreignNodeIsolationOutcome(source, destination, spec),
        ];
        if (source === 'src/foreign.ts' && destination === 'other/main.ts') {
          expected.push(treeAuthorizationOutcome(source, destination, spec));
        }
        if (source === 'external.ts' && destination === 'src/foreign.ts') {
          expected.push(treeOpacityOutcome(source, destination, spec));
        }
        await runScenario(
          {
            ...foreignTree,
            [source]: operation,
            'src/main.ts': resolveMainContent(source, operation),
          },
          { faf: { locals: [foreignLocal] } },
          'foreign-node-isolation',
          expected
        );
      }
    );

    it('a local file external to all Trees in a subdirectory importing a Foreign Node emits foreign-node-isolation and tree-opacity', async () => {
      const source = 'scripts/external.ts';
      const destination = 'src/foreign.ts';
      const spec = specifier(source, destination);
      await runScenario(
        {
          ...foreignTree,
          [source]: `import '${spec}';\n`,
        },
        { faf: { locals: [foreignLocal] } },
        'foreign-node-isolation',
        [
          foreignNodeIsolationOutcome(source, destination, spec),
          treeOpacityOutcome(source, destination, spec),
        ]
      );
    });

    it.each([
      ['ambient declarations', 'declare const ambient: string;\n'],
      ['empty export', 'export {};\n'],
      ['local Symbol', value],
      ['external library import', "import 'node:fs';\n"],
      ['external library re-export', "export { join } from 'node:path';\n"],
    ] as const)(
      'does not forbid activities that do not connect codebase files: %s',
      async (_label, content) => {
        await runScenario(
          { ...foreignTree, 'src/foreign.ts': content },
          { faf: { locals: [foreignLocal] } },
          'foreign-node-isolation',
          []
        );
      }
    );

    it('admits an importable font Asset as a Logical Node rather than Foreign Node', async () => {
      await runScenario(
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
        },
        'foreign-node-isolation',
        []
      );
    });

    it('the Foreign Domain exclusively preserves Foreign contents', async () => {
      await runScenario(
        foreignTree,
        { faf: { locals: [foreignLocal] } },
        'containment-matrix',
        []
      );

      const logicalUtil = 'src/_tooling/_utils/tool/tool.util.ts';
      const logicalIndex = 'src/_tooling/_utils/tool/index.ts';
      await runScenario(
        {
          ...foreignTree,
          [logicalIndex]: "export { value } from './tool.util.js';\n",
          [logicalUtil]: value,
        },
        { faf: { locals: [foreignLocal] } },
        'containment-matrix',
        [
          foreignNodeIsolationOutcome(
            logicalIndex,
            logicalUtil,
            './tool.util.js'
          ),
        ]
      );
    });

    it('the name _tooling is not by itself a Foreign designation', async () => {
      await runScenario(
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
        },
        'foreign-node-isolation',
        []
      );
    });

    it.each(['globals.d.ts', 'vite-env.d.ts', 'vitest-setup.ts'] as const)(
      'example files are not automatic exemptions: %s',
      async (file) => {
        const source = `src/${file}`;
        const destination = 'src/main.ts';
        const spec = specifier(source, destination);
        await runScenario(
          {
            ...foreignTree,
            [source]: `import '${spec}';\n`,
          },
          { faf: { locals: [foreignLocal] } },
          'foreign-node-isolation',
          [foreignNodeIsolationOutcome(source, destination, spec)]
        );
      }
    );
  });
});
