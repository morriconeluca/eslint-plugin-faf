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
      filename: 'src/read.norm.ts',
    },
    {
      code: 'export function read(x: unknown): void {}',
      errors: [{ messageId: 'unknownParameter' }],
      filename: 'src/read.service.ts',
    },
    {
      code: 'export function read(x: unknown): void {}',
      errors: [{ messageId: 'unknownParameter' }],
      filename: 'src/read.store.ts',
    },
    {
      code: 'export function read(x: unknown): void {}',
      errors: [{ messageId: 'unknownParameter' }],
      filename: 'src/read.rule.ts',
    },
    {
      code: 'export function read(x: unknown): void {}',
      errors: [{ messageId: 'unknownParameter' }],
      filename: 'src/read.ts',
    },
    {
      code: 'export function read(value: unknown, other: string): other is string { return false; }',
      errors: [{ messageId: 'unknownParameter' }],
      filename: 'src/read.util.ts',
    },
    {
      code: 'export function read(value: unknown, other: unknown): value is string { return true; }',
      errors: [{ messageId: 'unknownParameter' }],
      filename: 'src/read.util.ts',
    },
    {
      code: 'export function read(value: unknown): asserts value { return; }',
      errors: [{ messageId: 'unknownParameter' }],
      filename: 'src/read.util.ts',
    },
    {
      code: 'export function read(value: unknown, cb: (item: unknown) => void): value is string { return true; }',
      errors: [{ messageId: 'unknownParameter' }],
      filename: 'src/_schemas/read/read.util.ts',
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
      code: 'export function isReady(value: unknown): value is string { return typeof value === "string"; }',
      filename: 'src/is-ready.util.ts',
    },
    {
      code: 'export function assertReady(value: unknown): asserts value is string { return; }',
      filename: 'src/assert-ready.util.ts',
    },
    {
      code: 'export const isReady = function (value: unknown): value is string { return typeof value === "string"; };',
      filename: 'src/is-ready.util.ts',
    },
    {
      code: 'export const isReady = (value: unknown): value is string => typeof value === "string";',
      filename: 'src/is-ready.util.ts',
    },
    {
      code: 'export const assertReady = (value: unknown): asserts value is string => { return; };',
      filename: 'src/assert-ready.util.ts',
    },
    {
      code: 'export function read(raw: unknown): void {}',
      filename: 'src/load.adapter.ts',
    },
    {
      code: 'export function read(raw: unknown): void {}',
      filename: 'src/parse.schema.ts',
    },
    {
      code: 'export function read(raw: Record<string, unknown>): void {}',
      filename: 'src/_utils/parse/parse.schema.ts',
    },
  ],
});
