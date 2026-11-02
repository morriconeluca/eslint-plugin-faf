import { ESLint, RuleTester } from 'eslint';
import { parser as tsParser } from 'typescript-eslint';
import { describe, expect, it } from 'vitest';

import fafConfig from '../../fafconfig.js';
import { symbolLawsRule } from '../../scripts/eslint/symbol-laws.rule.js';

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
  },
});

const localTree = fafConfig.faf.locals[0];
const baseRoles = localTree.roles.map((r) => r.name);
const baseMultiple = localTree.roles
  .filter((r) => 'allowMultipleSymbols' in r)
  .map((r) => r.name);
const baseSubGraph = localTree.subGraphRoles.map((r) => r.name);
const baseCategories = Object.fromEntries(
  localTree.roles.map((r) => [r.category, r.name])
);

const testOptions = [
  {
    allowMultipleSymbols: [...baseMultiple, 'type'],
    categories: {
      ...baseCategories,
      _components: 'component',
      _hooks: 'hook',
    },
    roles: [...baseRoles, 'component', 'hook', 'type', 'util'],
    subGraphRoles: [...baseSubGraph, 'spec'],
  },
];

const NON_MASTER_FILE = '/repo/src/_src@shared/_utils/category/example.util.ts';
const MASTER_FILE = '/repo/src/_src@shared/_utils/example/example.util.ts';
const ACCESS_NODE_FILE = '/repo/src/_src@shared/_components/example/index.ts';

ruleTester.run('symbol-laws', symbolLawsRule, {
  invalid: [
    {
      code: 'const first = 1, second = 2;',
      errors: [{ messageId: 'symbolUniqueness' }],
      filename: NON_MASTER_FILE,
      options: testOptions,
    },
    {
      code: 'const { first, second } = source;',
      errors: [{ messageId: 'symbolUniqueness' }],
      filename: NON_MASTER_FILE,
      options: testOptions,
    },
    {
      code: 'const [first, second] = source;',
      errors: [{ messageId: 'symbolUniqueness' }],
      filename: NON_MASTER_FILE,
      options: testOptions,
    },
    {
      code: 'const Value = 1; type Value = number;',
      errors: [{ messageId: 'symbolUniqueness' }],
      filename: NON_MASTER_FILE,
      options: testOptions,
    },
    {
      code: 'interface A { x: string } interface A { y: string }',
      errors: [{ messageId: 'symbolUniqueness' }],
      filename: NON_MASTER_FILE,
      options: testOptions,
    },
    {
      code: 'function f() {} namespace f { export const x = 1; }',
      errors: [{ messageId: 'symbolUniqueness' }],
      filename: NON_MASTER_FILE,
      options: testOptions,
    },
    {
      code: "export { value } from './source';",
      errors: [{ messageId: 'reExportProhibition' }],
      filename: NON_MASTER_FILE,
      options: testOptions,
    },
    {
      code: "export { value as renamed } from './source';",
      errors: [{ messageId: 'reExportProhibition' }],
      filename: NON_MASTER_FILE,
      options: testOptions,
    },
    {
      code: "export { default } from './source';",
      errors: [{ messageId: 'reExportProhibition' }],
      filename: NON_MASTER_FILE,
      options: testOptions,
    },
    {
      code: "export * from './source';",
      errors: [{ messageId: 'reExportProhibition' }],
      filename: NON_MASTER_FILE,
      options: testOptions,
    },
    {
      code: "export * as source from './source';",
      errors: [{ messageId: 'reExportProhibition' }],
      filename: NON_MASTER_FILE,
      options: testOptions,
    },
    {
      code: "export type { Value } from './source';",
      errors: [{ messageId: 'reExportProhibition' }],
      filename: NON_MASTER_FILE,
      options: testOptions,
    },
    {
      code: "export type * from './source';",
      errors: [{ messageId: 'reExportProhibition' }],
      filename: NON_MASTER_FILE,
      options: testOptions,
    },
    {
      code: "import { value } from './source'; export { value };",
      errors: [{ messageId: 'reExportProhibition' }],
      filename: NON_MASTER_FILE,
      options: testOptions,
    },
    {
      code: "import { value as local } from './source'; export { local as value };",
      errors: [{ messageId: 'reExportProhibition' }],
      filename: NON_MASTER_FILE,
      options: testOptions,
    },
    {
      code: "import value from './source'; export default value;",
      errors: [{ messageId: 'reExportProhibition' }],
      filename: NON_MASTER_FILE,
      options: testOptions,
    },
    {
      code: "import * as source from './source'; export { source };",
      errors: [{ messageId: 'reExportProhibition' }],
      filename: NON_MASTER_FILE,
      options: testOptions,
    },
    {
      code: "import type { Value } from './source'; export type { Value };",
      errors: [{ messageId: 'reExportProhibition' }],
      filename: NON_MASTER_FILE,
      options: testOptions,
    },
    {
      code: "import { x } from './source';",
      errors: [{ messageId: 'masterNode' }],
      filename: MASTER_FILE,
      options: testOptions,
    },
    {
      code: 'const value = 1;',
      errors: [{ messageId: 'masterNode' }],
      filename: MASTER_FILE,
      options: testOptions,
    },
    {
      code: 'const hidden = 1; export const visible = 2;',
      errors: [{ messageId: 'masterNode' }],
      filename: MASTER_FILE,
      options: testOptions,
    },
    {
      code: 'export const first = 1; export const second = 2;',
      errors: [{ messageId: 'masterNode' }],
      filename: MASTER_FILE,
      options: testOptions,
    },
    {
      code: 'export const value = 1;',
      errors: [{ messageId: 'accessNode' }],
      filename: ACCESS_NODE_FILE,
      options: testOptions,
    },
    {
      code: 'const hidden = 1;',
      errors: [{ messageId: 'accessNode' }],
      filename: ACCESS_NODE_FILE,
      options: testOptions,
    },
    {
      code: 'export function wrapper() {}',
      errors: [{ messageId: 'accessNode' }],
      filename: ACCESS_NODE_FILE,
      options: testOptions,
    },
    {
      code: 'export type PublicType = string;',
      errors: [{ messageId: 'accessNode' }],
      filename: ACCESS_NODE_FILE,
      options: testOptions,
    },
    {
      code: 'export interface PublicContract {}',
      errors: [{ messageId: 'accessNode' }],
      filename: ACCESS_NODE_FILE,
      options: testOptions,
    },
    {
      code: 'export class PublicClass {}',
      errors: [{ messageId: 'accessNode' }],
      filename: ACCESS_NODE_FILE,
      options: testOptions,
    },
    {
      code: "export type { ExampleProps } from './example.type';",
      errors: [{ messageId: 'accessNode' }],
      filename: ACCESS_NODE_FILE,
      options: testOptions,
    },
    {
      code: "export * from './example.spec';",
      errors: [{ messageId: 'accessNode' }],
      filename: ACCESS_NODE_FILE,
      options: testOptions,
    },
    {
      code: "export * from '../../main';",
      errors: [{ messageId: 'accessNode' }],
      filename: ACCESS_NODE_FILE,
      options: testOptions,
    },
    {
      code: "export { debounce } from 'lodash';",
      errors: [{ messageId: 'accessNode' }],
      filename: ACCESS_NODE_FILE,
      options: testOptions,
    },
    {
      code: 'export const first = 1;\nexport const second = 2;',
      errors: [{ messageId: 'masterNode' }],
      filename:
        '/repo/src/_src@shared/_runtime/_adapters/load-config/load-config.adapter.ts',
      options: testOptions,
    },
    {
      code: "export type * from './load-config.type.js';",
      errors: [{ messageId: 'accessNode' }],
      filename: '/repo/src/_src@shared/_runtime/_adapters/load-config/index.ts',
      options: testOptions,
    },
    {
      code: 'const first = 1;\nexport const second = 2;',
      errors: [{ messageId: 'masterNode' }],
      filename:
        '/repo/src/_src@shared/_runtime/_adapters/load-config/_utils/x/x.util.ts',
      options: testOptions,
    },
    {
      code: 'export const first = 1;\nexport const second = 2;',
      errors: [{ messageId: 'masterNode' }],
      filename: '/repo/src/_src@shared/_utils/_compounds/x/x.util.ts',
      options: testOptions,
    },
    {
      code: 'const first = 1;\nconst second = 2;',
      errors: [{ messageId: 'symbolUniqueness' }],
      filename: '/repo/src/_src@shared/x/x.util.ts',
      options: testOptions,
    },
  ],
  valid: [
    {
      code: 'const value = 1;',
      filename: NON_MASTER_FILE,
      options: testOptions,
    },
    {
      code: 'const { value: renamed } = source;',
      filename: NON_MASTER_FILE,
      options: testOptions,
    },
    {
      code: 'function f(x: string): string; function f(x: number): number; function f(x: any): any { return x; }',
      filename: NON_MASTER_FILE,
      options: testOptions,
    },
    {
      code: 'export default function () {}',
      filename: NON_MASTER_FILE,
      options: testOptions,
    },
    {
      code: 'export default class {}',
      filename: NON_MASTER_FILE,
      options: testOptions,
    },
    {
      code: 'export default 42;',
      filename: NON_MASTER_FILE,
      options: testOptions,
    },
    {
      code: 'function f(parameter: number) { const local = parameter; function helper() {} return local; }',
      filename: NON_MASTER_FILE,
      options: testOptions,
    },
    {
      code: 'class C { field = 1; method(parameter: number) { const local = parameter; return local; } }',
      filename: NON_MASTER_FILE,
      options: testOptions,
    },
    {
      code: 'const value = 1; export { value, value as renamed };',
      filename: NON_MASTER_FILE,
      options: testOptions,
    },
    {
      code: 'class C {}',
      filename: NON_MASTER_FILE,
      options: testOptions,
    },
    {
      code: 'enum E { A }',
      filename: NON_MASTER_FILE,
      options: testOptions,
    },
    {
      code: "import { x } from './x'; export const y = x;",
      filename: NON_MASTER_FILE,
      options: testOptions,
    },
    {
      code: "import { x } from './x';",
      filename: NON_MASTER_FILE,
      options: testOptions,
    },
    {
      code: "import { source } from './source'; export function execute() { return source(); }",
      filename: NON_MASTER_FILE,
      options: testOptions,
    },
    {
      code: 'const value = 1; export { value };',
      filename: NON_MASTER_FILE,
      options: testOptions,
    },
    {
      code: 'export const value = 1;',
      filename: MASTER_FILE,
      options: testOptions,
    },
    {
      code: 'function f() {} export default f;',
      filename: MASTER_FILE,
      options: testOptions,
    },
    {
      code: "export { Example } from './example.component';",
      filename: ACCESS_NODE_FILE,
      options: testOptions,
    },
    {
      code: "export { Example as PublicExample } from './example.component';",
      filename: ACCESS_NODE_FILE,
      options: testOptions,
    },
    {
      code: "export * from './example.component';",
      filename: ACCESS_NODE_FILE,
      options: testOptions,
    },
    {
      code: "export { Example } from './example.component'; export type { ExampleProps } from './example.type';",
      filename: ACCESS_NODE_FILE,
      options: testOptions,
    },
    {
      code: "export { Example } from './example.component'; export type * from './example.type';",
      filename: ACCESS_NODE_FILE,
      options: testOptions,
    },
    {
      code: "import { Example } from './example.component'; export { Example };",
      filename: ACCESS_NODE_FILE,
      options: testOptions,
    },
    {
      code: "export * from './example.component'; export type * from './example.type';",
      filename: ACCESS_NODE_FILE,
      options: testOptions,
    },
    {
      code: 'export type TFirst = string;\nexport type TSecond = number;',
      filename: '/repo/src/_src@shared/_types/example.type.ts',
      options: testOptions,
    },
    {
      code: 'const a = 1;\nconst b = 2;\nexport const helper = () => {};',
      filename: '/repo/src/_src@shared/example/example.spec.ts',
      options: testOptions,
    },
    {
      code: "export type { TFoo } from './foo.js';\nexport const meta = { name: 'faf' };\nexport default meta;\nconst internal = 1;",
      filename: '/repo/src/main.ts',
      options: testOptions,
    },
    {
      code: 'export type TFirst = string;\nexport type TSecond = number;\nexport type TThird = boolean;',
      filename:
        '/repo/src/_src@shared/_runtime/_adapters/load-config/load-config.type.ts',
      options: testOptions,
    },
    {
      code: "export * from './load-config.adapter.js';\nexport type * from './load-config.type.js';",
      filename: '/repo/src/_src@shared/_runtime/_adapters/load-config/index.ts',
      options: testOptions,
    },
    {
      code: 'export const x = 1;',
      filename:
        '/repo/src/_src@shared/_runtime/_adapters/load-config/_utils/x/x.util.ts',
      options: testOptions,
    },
    {
      code: 'export type TOne = string;\nexport type TTwo = number;',
      filename:
        '/repo/src/_src@shared/_runtime/_adapters/load-config/_utils/x/x.type.ts',
      options: testOptions,
    },
    {
      code: "export { x } from './x.util.js';",
      filename:
        '/repo/src/_src@shared/_runtime/_adapters/load-config/_utils/x/index.ts',
      options: testOptions,
    },
    {
      code: 'export const x = 1;',
      filename: '/repo/src/_src@shared/_utils/_compounds/x/x.util.ts',
      options: testOptions,
    },
    {
      code: 'export type TA = string;\nexport type TB = number;',
      filename: '/repo/src/_src@shared/_utils/_compounds/x/x.type.ts',
      options: testOptions,
    },
    {
      code: "export { x } from './x.util.js';",
      filename: '/repo/src/_src@shared/_utils/_compounds/x/index.ts',
      options: testOptions,
    },
    {
      code: 'const value = 1;',
      filename: '/repo/src/_src@shared/x/x.util.ts',
      options: testOptions,
    },
  ],
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const calculateConfig = async (filePath: string): Promise<unknown> => {
  const eslint = new ESLint();
  return eslint.calculateConfigForFile(filePath);
};

describe('symbol-laws integration in eslint.config.ts', () => {
  it('enables repository/symbol-laws with options derived from fafconfig on src/**/*.ts', async () => {
    const config = await calculateConfig(
      'src/_src@shared/_domain/_utils/assert-invariant/assert-invariant.util.ts'
    );
    const rules =
      isRecord(config) && isRecord(config['rules'])
        ? config['rules']
        : undefined;

    const ruleEntry = rules?.['repository/symbol-laws'];
    expect(Array.isArray(ruleEntry)).toBe(true);
    if (!Array.isArray(ruleEntry)) {
      return;
    }

    expect(ruleEntry[0]).toBe(2);
    const ruleOptions = isRecord(ruleEntry[1]) ? ruleEntry[1] : undefined;
    expect(ruleOptions?.['roles']).toEqual(baseRoles);
    expect(ruleOptions?.['allowMultipleSymbols']).toEqual(baseMultiple);
    expect(ruleOptions?.['subGraphRoles']).toEqual(baseSubGraph);
    expect(ruleOptions?.['categories']).toEqual(baseCategories);
  });

  it('does not enable repository/symbol-laws outside src/', async () => {
    const config = await calculateConfig(
      'scripts/eslint/comment-policy.rule.ts'
    );
    const rules =
      isRecord(config) && isRecord(config['rules'])
        ? config['rules']
        : undefined;

    expect(rules?.['repository/symbol-laws']).toBeUndefined();
  });
});
