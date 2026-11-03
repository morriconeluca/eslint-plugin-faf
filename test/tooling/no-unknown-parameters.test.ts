import { RuleTester } from 'eslint';
import { parser as tsParser } from 'typescript-eslint';
import { describe, it } from 'vitest';

import { noUnknownParametersRule } from '../../scripts/eslint/no-unknown-parameters.rule.js';

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
  },
});

const BOUNDARY_FRAGMENT =
  'src/_src@shared/_declarations/_utils/validate-config-format';
const BOUNDARY_FILE = `${BOUNDARY_FRAGMENT}/validate-config-format.util.ts`;
const boundaryOptions = [{ allowedFragments: [BOUNDARY_FRAGMENT] }];

ruleTester.run('no-unknown-parameters', noUnknownParametersRule, {
  invalid: [
    {
      code: 'export function read(x: unknown): void {}',
      errors: [{ messageId: 'unknownParameter' }],
      filename: 'src/read.util.ts',
    },
    {
      code: 'export function read(x: Record<string, unknown>): void {}',
      errors: [{ messageId: 'unknownParameter' }],
      filename: 'src/read.util.ts',
    },
    {
      code: 'export function read(x: readonly unknown[]): void {}',
      errors: [{ messageId: 'unknownParameter' }],
      filename: 'src/read.util.ts',
    },
    {
      code: 'export function read(x: string | unknown): void {}',
      errors: [{ messageId: 'unknownParameter' }],
      filename: 'src/read.util.ts',
    },
    {
      code: 'export function read(cb: (v: unknown) => void): void {}',
      errors: [{ messageId: 'unknownParameter' }],
      filename: 'src/read.util.ts',
    },
    {
      code: 'export function read(x: unknown): void {}',
      errors: [{ messageId: 'unknownParameter' }],
      filename: `${BOUNDARY_FRAGMENT}/_utils/downstream/downstream.util.ts`,
      options: boundaryOptions,
    },
  ],
  valid: [
    {
      code: 'export const read = (value: string): string => value;',
      filename: 'src/read.util.ts',
    },
    {
      code: 'export function read(): void { try { return; } catch (error: unknown) { return; } }',
      filename: 'src/read.util.ts',
    },
    {
      code: 'export function read(): void { const value: unknown = 1; return; }',
      filename: 'src/read.util.ts',
    },
    {
      code: 'export function read(): unknown { return 1; }',
      filename: 'src/read.util.ts',
    },
    {
      code: 'export function read(raw: unknown): void {}',
      filename: BOUNDARY_FILE,
      options: boundaryOptions,
    },
  ],
});
