import type { FileTree } from 'fs-fixture';

import { beforeAll, describe, it } from 'vitest';

import type { TScenarioMessage } from '../support/acceptance-project.js';

import {
  createProject,
  expectScenario,
  lintScenario,
  warmupESLint,
} from '../support/acceptance-project.js';

const fragment = 'src/_components/example';
const master = `${fragment}/example.component.tsx`;
const access = `${fragment}/index.ts`;
const detail = `${fragment}/example.type.ts`;
const masterExport = "export { Example } from './example.component';\n";
const tree = {
  [access]: masterExport,
  [detail]: 'export type ExampleProps = string;\n',
  [master]: 'export function Example() { return 1; }\n',
};
const roles = [
  { category: '_constants', isCategoryNode: true, name: 'constant' },
  { category: '_types', isCategoryNode: true, name: 'type' },
  { category: '_utils', isCategoryNode: true, name: 'util' },
  { category: '_hooks', name: 'hook' },
  { category: '_components', name: 'component' },
];
const declarations = {
  roles,
  rootLayers: ['src'],
  subGraphRoles: [{ name: 'spec' }, { name: 'story' }],
};

const diagnostic = (
  filePath: string,
  constraint: string,
  detail: string,
  line = 1
): TScenarioMessage => ({
  column: 1,
  constraint,
  element: filePath,
  filePath,
  line,
  message: `${constraint}: ${detail}`,
  messageId: constraint.split('/', 1)[0] ?? null,
  ruleId: 'faf/conformity',
  severity: 2,
});

const cardinality = (file: string): TScenarioMessage =>
  diagnostic(
    file,
    'symbol/symbol-uniqueness',
    `'${file}' defines more than one Symbol in its root scope (FAF §5).`
  );

const masterCardinality = (): TScenarioMessage =>
  diagnostic(
    master,
    'symbol/master-symbol',
    `'${master}' does not define and export exactly one Symbol as Master Node (FAF §6.1.1).`
  );

const missingMaster = (): TScenarioMessage =>
  diagnostic(
    access,
    'symbol/access-node-master-export',
    `'${access}' does not re-export the Symbol of its Master Node (FAF §6.1.1).`
  );

const ownSymbols = (): TScenarioMessage =>
  diagnostic(
    access,
    'symbol/access-node-own-symbols',
    `'${access}' defines its own Symbols as Access Node (FAF §6.1.1).`
  );

const reExport = (file: string, line = 1): TScenarioMessage =>
  diagnostic(
    file,
    'symbol/re-export-prohibition',
    `'${file}' re-exports an imported Symbol (FAF §5).`,
    line
  );

const accessNodeSource = (
  specifier: string,
  target: string
): TScenarioMessage =>
  diagnostic(
    access,
    'dependency/access-node-sources',
    `'${access}' imports '${target}' through '${specifier}': an Access Node imports only direct Fragment Nodes of its own Fragment (FAF §6.1.1).`,
    2
  );

const otherDependencyViolations = {
  'fractal-branch-visibility': {
    predicate:
      'a Fractal Branch is importable only from the subtree of its parent, except the parent Access Node',
    reference: 'FAF §6.6.2',
  },
  'peer-separation': {
    predicate:
      'sibling subtrees may depend on each other only downward along a Horizontal Hierarchy',
    reference: 'FAF §5',
  },
  'private-category-unidirectionality': {
    predicate:
      'a Private Category must not import the direct Logical Nodes of its parent',
    reference: 'FAF §6.3.3',
  },
  'private-category-visibility': {
    predicate:
      'a Private Category is importable from outside only by the enabled direct Logical Nodes of its parent',
    reference: 'FAF §6.3.3',
  },
  'root-node-discipline': {
    predicate:
      'a Root Node is importable only by Root Nodes authorized by rootNodes or dependencyEdges',
    reference: 'FAF §6.2.2',
  },
  'sub-graph-node-isolation': {
    predicate: 'a Sub-Graph Node is not importable',
    reference: 'FAF §4',
  },
} as const;

const otherDependency = (
  constraint: keyof typeof otherDependencyViolations,
  specifier: string,
  target: string
): TScenarioMessage => {
  const meta = otherDependencyViolations[constraint];
  return diagnostic(
    access,
    `dependency/${constraint}`,
    `'${access}' imports '${target}' through '${specifier}': ${meta.predicate} (${meta.reference}).`,
    2
  );
};

const checkScenario = async (
  files: FileTree,
  responsiblePart: string,
  expected: readonly TScenarioMessage[],
  local: Readonly<Record<string, unknown>> = declarations
): Promise<void> => {
  const fixture = await createProject(files, { faf: { locals: [local] } });
  try {
    expectScenario(await lintScenario(fixture.path), responsiblePart, expected);
  } finally {
    await fixture.rm();
  }
};

describe('acceptance: Symbol laws and Access Node contract', () => {
  const WARMUP_TIMEOUT_MS = 120_000;
  beforeAll(warmupESLint, WARMUP_TIMEOUT_MS);

  it.each([
    ['one variable', 'const value = 1;', 1],
    ['multiple declarators', 'const first = 1, second = 2;', 2],
    ['object bindings', 'const { first, second } = source;', 2],
    ['array bindings', 'const [first, second] = source;', 2],
    ['renamed binding', 'const { value: renamed } = source;', 1],
    ['value and type names', 'const Value = 1; type Value = number;', 2],
    [
      'overloads',
      'function f(x: string): string; function f(x: number): number; function f(x: any): any { return x; }',
      1,
    ],
    ['anonymous default function', 'export default function () {}', 1],
    ['anonymous default class', 'export default class {}', 1],
    ['default expression', 'export default 42;', 1],
    [
      'nested declarations',
      'function f(parameter: number) { const local = parameter; function helper() {} return local; }',
      1,
    ],
    [
      'class members',
      'class C { field = 1; method(parameter: number) { const local = parameter; return local; } }',
      1,
    ],
    [
      'multiple public aliases',
      'const value = 1; export { value, value as renamed };',
      1,
    ],
    [
      'merged interfaces',
      'interface A { x: string } interface A { y: string }',
      2,
    ],
    [
      'merged namespace',
      'function f() {} namespace f { export const x = 1; }',
      2,
    ],
    ['named class', 'class C {}', 1],
    ['enum', 'enum E { A }', 1],
    [
      'initialized imported binding',
      "import { x } from './example.constant'; export const y = x;",
      1,
    ],
    ['import only', "import { x } from './example.constant';", 0],
  ])('counts root Symbols: %s', async (_name, content, count) => {
    await checkScenario(
      {
        ...tree,
        [`${fragment}/example.constant.ts`]: 'export const x = 1;\n',
        [detail]: content,
      },
      'symbol-uniqueness',
      count > 1 ? [cardinality(detail)] : []
    );
    await checkScenario(
      {
        ...tree,
        [`${fragment}/example.constant.ts`]: 'export const x = 1;\n',
        [detail]: `${content}\nconst sentinel = 0;`,
      },
      'symbol-uniqueness',
      count === 0 ? [] : [cardinality(detail)]
    );
  });

  it('does not count nested bindings against the Master', async () => {
    await checkScenario(
      {
        ...tree,
        [master]:
          'export function Example(parameter: number) { const local = parameter; function helper() { return local; } return helper(); }\n',
      },
      'symbol-uniqueness',
      []
    );
  });

  it.each([
    ['empty node', '', 0],
    ['unexported definition', 'const value = 1;', 1],
    ['exported definition', 'export const value = 1;', 1],
    [
      'two exported definitions',
      'export const first = 1; export const second = 2;',
      2,
    ],
    ['hidden definition', 'const hidden = 1; export const visible = 2;', 2],
    ['two private definitions', 'const first = 1; const second = 2;', 2],
    ['exported declarators', 'export const first = 1, second = 2;', 2],
    [
      'schema and inferred type',
      'export const schema = makeSchema(); export type T = Infer<typeof schema>;',
      2,
    ],
  ])('enforces ordinary cardinality: %s', async (_name, content, count) => {
    await checkScenario(
      { ...tree, [detail]: content },
      'symbol-uniqueness',
      count > 1 ? [cardinality(detail)] : []
    );
  });

  it.each([
    [0, 0, 'export {};'],
    [1, 0, 'function Example() {}'],
    [1, 1, 'export function Example() {}'],
    [2, 1, 'const hidden = 1; export function Example() {}'],
    [2, 2, 'export const Example = 1; export const other = 2;'],
  ])(
    'requires exactly one defined and exported Master Symbol: %i/%i',
    async (count, exported, content) => {
      await checkScenario(
        { ...tree, [master]: content },
        'symbol-uniqueness',
        count === 1 && exported === 1 ? [] : [masterCardinality()]
      );
    }
  );

  it('never applies a Role exemption to the Master', async () => {
    await checkScenario(
      { ...tree, [master]: 'const hidden = 1; export function Example() {}' },
      'symbol-uniqueness',
      [masterCardinality()],
      {
        ...declarations,
        roles: roles.map((role) => ({ ...role, allowMultipleSymbols: true })),
      }
    );
  });

  it.each(['type', 'util'])(
    'requires an explicit ordinary Role exemption: %s',
    async (role) => {
      const file = `src/_${role}s/example.${role}.ts`;
      await checkScenario(
        { ...tree, [file]: 'export const first = 1; export const second = 2;' },
        'symbol-uniqueness',
        [cardinality(file)]
      );
    }
  );

  it.each(['spec', 'story'])(
    'exempts Sub-Graph Nodes without a flag: %s',
    async (role) => {
      await checkScenario(
        {
          ...tree,
          [`${fragment}/example.${role}.ts`]:
            'const first = 1; const second = 2;',
        },
        'symbol-uniqueness',
        []
      );
    }
  );

  it('retains the re-export prohibition for exempt Roles', async () => {
    const file = 'src/_types/public.type.ts';
    await checkScenario(
      {
        ...tree,
        [file]:
          "export type { ExampleProps } from './_types@shared/_types/source.type';",
        'src/_types/_types@shared/_types/source.type.ts':
          'export type ExampleProps = string;',
      },
      're-export-prohibition',
      [reExport(file)],
      {
        ...declarations,
        roles: roles.map((role) => ({ ...role, allowMultipleSymbols: true })),
      }
    );
  });

  it('does not apply Symbol laws to explicit or implicit Assets', async () => {
    await checkScenario(
      {
        ...tree,
        [`${fragment}/_example@shared/_styles/base.css`]: 'body {}',
        [`${fragment}/example.module.css`]:
          '@import "./_example@shared/_styles/base.css"; body {} a {}',
        'src/_styles/_styles@shared/_styles/base.css': 'body {}',
        'src/_styles/theme.css':
          '@import "./_styles@shared/_styles/base.css"; body {} a {}',
      },
      'symbol-uniqueness',
      [],
      {
        ...declarations,
        roles: [
          {
            category: '_styles',
            implicitRoleExtensions: ['.css'],
            name: 'style',
          },
          { category: '_modules', isCategoryNode: true, name: 'module' },
          ...roles,
        ],
      }
    );
  });

  it.each([
    "export { value } from './example.constant';",
    "export { value as renamed } from './example.constant';",
    "export { default } from './example.constant';",
    "export * from './example.constant';",
    "export * as source from './example.constant';",
    "export type { Value } from './example.constant';",
    "export type * from './example.constant';",
    "import { value } from './example.constant';\nexport { value };",
    "import { value as local } from './example.constant';\nexport { local as value };",
    "import value from './example.constant';\nexport default value;",
    "import * as source from './example.constant';\nexport { source };",
    "import type { Value } from './example.constant';\nexport type { Value };",
  ])('rejects imported export provenance: %s', async (content) => {
    await checkScenario(
      {
        ...tree,
        [`${fragment}/example.constant.ts`]:
          'const value = 1; type Value = number; export { value, value as default }; export type { Value };',
        [detail]: content,
      },
      're-export-prohibition',
      [reExport(detail, content.includes('\n') ? 2 : 1)],
      {
        ...declarations,
        roles: roles.map((role) =>
          role.name === 'constant'
            ? { ...role, allowMultipleSymbols: true }
            : role
        ),
      }
    );
  });

  it.each([
    [
      'a local function using an import',
      "import { source } from './example.constant';\nexport function execute() { return source(); }",
    ],
    ['a separate local export', 'const value = 1; export { value };'],
    [
      'a definition initialized from an import',
      "import { x } from './example.constant';\nexport const y = x;",
    ],
  ])('allows local export provenance: %s', async (_name, content) => {
    await checkScenario(
      {
        ...tree,
        [`${fragment}/example.constant.ts`]:
          'export const source = () => 1; export const x = 1;',
        [detail]: content,
      },
      're-export-prohibition',
      [],
      {
        ...declarations,
        roles: roles.map((role) =>
          role.name === 'constant'
            ? { ...role, allowMultipleSymbols: true }
            : role
        ),
      }
    );
  });

  it.each([
    "export { Example } from './example.component';",
    "export { Example as PublicExample } from './example.component';",
    "export * from './example.component';",
    "export { Example } from './example.component'; export type { ExampleProps } from './example.type';",
    "export { Example } from './example.component'; export type * from './example.type';",
    "import { Example } from './example.component'; export { Example };",
    "export * from './example.component'; export type * from './example.type';",
  ])('allows exposure of direct Fragment Nodes: %s', async (content) => {
    await checkScenario(
      { ...tree, [access]: content },
      'access-node-contract',
      []
    );
  });

  it('allows public selection to omit internal hook and constants', async () => {
    await checkScenario(
      {
        ...tree,
        [`${fragment}/example.constant.ts`]: 'export const value = 1;',
        [`${fragment}/example.hook.ts`]: 'export function useExample() {}',
        [access]:
          "export * from './example.component'; export type * from './example.type';",
      },
      'access-node-contract',
      []
    );
  });

  it.each([
    'export const value = 1;',
    'const hidden = 1;',
    'export function wrapper() {}',
    'export type PublicType = string;',
    'export interface PublicContract {}',
    'export class PublicClass {}',
  ])('rejects own Access Node definitions: %s', async (content) => {
    await checkScenario(
      { ...tree, [access]: `${content}\n${masterExport}` },
      'access-node-contract',
      [ownSymbols()]
    );
  });

  it.each([
    [
      'Sub-Graph Node',
      './example.spec',
      `${fragment}/example.spec.ts`,
      ['peer-separation', 'sub-graph-node-isolation'],
    ],
    [
      'Root Node',
      '../../main',
      'src/main.ts',
      ['private-category-unidirectionality', 'root-node-discipline'],
    ],
    [
      'private Sub-Fragment',
      './_hooks/child/index',
      `${fragment}/_hooks/child/index.ts`,
      ['private-category-visibility'],
    ],
    [
      'private Category Node',
      './_types/private.type',
      `${fragment}/_types/private.type.ts`,
      ['private-category-visibility'],
    ],
    [
      'own Fractal Branch',
      './_example@shared/_types/value.type',
      `${fragment}/_example@shared/_types/value.type.ts`,
      ['fractal-branch-visibility'],
    ],
    [
      'ancestor Fractal Branch',
      '../../_src@shared/_types/value.type',
      'src/_src@shared/_types/value.type.ts',
      [],
    ],
    [
      'other Fragment',
      '../other/index',
      'src/_components/other/index.ts',
      ['peer-separation'],
    ],
    ['external package', 'external-source', 'external-source', []],
  ] as const)(
    'rejects foreign Access Node sources: %s',
    async (_name, specifier, target, otherConstraints) => {
      await checkScenario(
        {
          ...tree,
          [`${fragment}/_example@shared/_types/value.type.ts`]:
            'export const value = 1;',
          [`${fragment}/_hooks/child/child.hook.ts`]:
            'export function child() {}',
          [`${fragment}/_hooks/child/index.ts`]:
            "export { child } from './child.hook';",
          [`${fragment}/_types/private.type.ts`]:
            'export type Private = string;',
          [`${fragment}/example.spec.ts`]: 'export const test = 1;',
          [access]: `${masterExport}import * as foreign from '${specifier}';\n`,
          'node_modules/external-source/index.js': 'export const value = 1;',
          'node_modules/external-source/package.json':
            '{"type":"module","exports":"./index.js"}',
          'src/_components/other/index.ts':
            "export { Other } from './other.component';",
          'src/_components/other/other.component.ts':
            'export function Other() {}',
          'src/_src@shared/_types/value.type.ts': 'export const value = 1;',
          'src/main.ts': 'export const root = 1;',
        },
        'access-node-contract',
        [
          accessNodeSource(specifier, target),
          ...otherConstraints.map((constraint) =>
            otherDependency(constraint, specifier, target)
          ),
        ],
        {
          ...declarations,
          rootFragments: [{ path: 'src', rootNodes: [['main.ts']] }],
          rootLayers: [],
        }
      );
    }
  );

  it.each([
    ['empty', '', 'export function Example() {}', false],
    ['empty export', 'export {};', 'export function Example() {}', false],
    [
      'import without export',
      "import { Example } from './example.component';",
      'export function Example() {}',
      false,
    ],
    [
      'only non-Master types',
      "export type { ExampleProps } from './example.type';",
      'export function Example() {}',
      false,
    ],
    [
      'named star',
      "export * from './example.component';",
      'export function Example() {}',
      true,
    ],
    [
      'default omitted by star',
      "export * from './example.component';",
      'export default function Example() {}',
      false,
    ],
    [
      'explicit default',
      "export { default } from './example.component';",
      'export default function Example() {}',
      true,
    ],
    [
      'renamed default',
      "export { default as PublicExample } from './example.component';",
      'export default function Example() {}',
      true,
    ],
    [
      'Master type',
      "export type { Example } from './example.component';",
      'export type Example = string;',
      true,
    ],
  ])(
    'checks effective Master exposure: %s',
    async (_name, content, masterContent, exposed) => {
      await checkScenario(
        { ...tree, [access]: content, [master]: masterContent },
        'access-node-contract',
        exposed ? [] : [missingMaster()]
      );
    }
  );

  it('does not confuse a public alias with Master provenance', async () => {
    await checkScenario(
      {
        ...tree,
        [access]:
          "export type { ExampleProps as Example } from './example.type';",
      },
      'access-node-contract',
      [missingMaster()]
    );
  });

  it.each([
    [
      'cohesion of exempt Symbols',
      'export const first = 1; export const second = 2;',
    ],
    [
      'mechanical derivation of distinct competences',
      'export const schema = () => 1; export type Inferred = ReturnType<typeof schema>;',
    ],
  ])('emits no semantic judgment about %s', async (_name, content) => {
    await checkScenario(
      { ...tree, [detail]: content },
      'symbol-uniqueness',
      [],
      {
        ...declarations,
        roles: roles.map((role) =>
          role.name === 'type' ? { ...role, allowMultipleSymbols: true } : role
        ),
      }
    );
  });

  it.each([
    [
      'Role competence incompatible with an architectural judgment',
      'export function Example() { return fetch("https://example.invalid"); }',
    ],
    [
      'ambiguous function competence',
      'export function Example() { return 1; }',
    ],
    [
      'collaborating primary responsibilities',
      'export class Example { readData() { return 1; } renderView() { return "view"; } }',
    ],
    [
      'incomplete placement evidence',
      'export function Example() { return globalThis; }',
    ],
  ])('emits no heuristic outcome for %s', async (_name, content) => {
    await checkScenario(
      { ...tree, [master]: content },
      'symbol-uniqueness',
      []
    );
  });

  it.each(['exclusive detail proximity', 'primary concept with one consumer'])(
    'does not prescribe placement for %s',
    async () => {
      await checkScenario(
        {
          ...tree,
          [master]:
            'import { value } from "../../_types/value.type";\nexport function Example() { return value; }',
          'src/_types/value.type.ts': 'export const value = 1;',
        },
        'symbol-uniqueness',
        [],
        {
          ...declarations,
          horizontalHierarchies: [[['_types'], ['_components']]],
        }
      );
    }
  );

  it('does not prescribe nearest common ancestor sharing', async () => {
    await checkScenario(
      {
        ...tree,
        [master]:
          'import { value } from "../../_types/value.type";\nexport function Example() { return value; }',
        'src/_components/other/index.ts':
          'export { Other } from "./other.component";',
        'src/_components/other/other.component.ts':
          'import { value } from "../../_types/value.type";\nexport function Other() { return value; }',
        'src/_types/value.type.ts': 'export const value = 1;',
      },
      'symbol-uniqueness',
      [],
      {
        ...declarations,
        horizontalHierarchies: [[['_types'], ['_components']]],
      }
    );
  });

  it.each(['error', 'class', 'repository', 'service'])(
    'does not infer a Role from class syntax: %s',
    async (role) => {
      await checkScenario(
        {
          [`src/_${role}s/example/example.${role}.ts`]:
            'export class Example {}',
          [`src/_${role}s/example/index.ts`]: `export { Example } from './example.${role}';`,
        },
        'symbol-uniqueness',
        [],
        { ...declarations, roles: [{ category: `_${role}s`, name: role }] }
      );
    }
  );
});
