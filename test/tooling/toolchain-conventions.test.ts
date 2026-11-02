import { ESLint } from 'eslint';
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

type TRestrictedSyntaxOption = {
  readonly selector: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isRestrictedSyntaxOption = (
  entry: unknown
): entry is TRestrictedSyntaxOption =>
  isRecord(entry) &&
  'selector' in entry &&
  typeof entry['selector'] === 'string';

const hasSelector = (ruleConfig: unknown, selector: string): boolean =>
  Array.isArray(ruleConfig) &&
  ruleConfig.some(
    (entry) => isRestrictedSyntaxOption(entry) && entry['selector'] === selector
  );

const hasThrowStatementSelector = (ruleConfig: unknown): boolean =>
  hasSelector(ruleConfig, 'ThrowStatement');

describe('toolchain conventions', () => {
  const fixtureDirectory = path.resolve(import.meta.dirname, 'fixtures');
  const eslint = new ESLint();

  const calculateConfig = async (filePath: string): Promise<unknown> =>
    eslint.calculateConfigForFile(filePath);

  const getRuleConfig = async (
    filePath: string,
    ruleName: string
  ): Promise<unknown> => {
    const config = await calculateConfig(filePath);
    return isRecord(config) && 'rules' in config && isRecord(config['rules'])
      ? config['rules'][ruleName]
      : undefined;
  };

  const getRestrictedSyntaxRule = async (filePath: string): Promise<unknown> =>
    getRuleConfig(filePath, 'no-restricted-syntax');

  const WARMUP_TIMEOUT_MS = 30_000;

  beforeAll(async () => {
    fs.mkdirSync(fixtureDirectory, { recursive: true });
    const warmupFilePath = path.join(fixtureDirectory, 'warmup.ts');
    fs.writeFileSync(warmupFilePath, 'export const warmup = 1;\n');
    try {
      await eslint.lintFiles([warmupFilePath]);
      await eslint.calculateConfigForFile(warmupFilePath);
    } finally {
      fs.rmSync(warmupFilePath, { force: true });
    }
  }, WARMUP_TIMEOUT_MS);

  afterAll(() => {
    fs.rmSync(fixtureDirectory, { force: true, recursive: true });
  });

  const lintFixture = async (
    filename: string,
    content: string
  ): Promise<readonly string[]> => {
    const fullPath = path.join(fixtureDirectory, filename);
    fs.writeFileSync(fullPath, content);
    const results = await eslint.lintFiles([fullPath]);
    const firstResult = results[0];
    const messages = firstResult?.messages ?? [];
    return messages
      .map((m) => m.ruleId)
      .filter((id): id is string => typeof id === 'string');
  };

  it('rejects interface declarations in favor of type aliases', async () => {
    const errors = await lintFixture(
      'case1.ts',
      'export interface TFoo {\n  readonly a: string;\n}\n'
    );
    expect(errors).toContain('@typescript-eslint/consistent-type-definitions');
  });

  it('rejects type aliases without T prefix in PascalCase', async () => {
    const errors = await lintFixture(
      'case2.ts',
      'export type Foo = {\n  readonly id: string;\n};\n'
    );
    expect(errors).toContain('@typescript-eslint/naming-convention');
  });

  it('rejects class declarations and class expressions', async () => {
    const classDeclarationErrors = await lintFixture(
      'case3a.ts',
      'export class A {}\n'
    );
    expect(classDeclarationErrors).toContain('no-restricted-syntax');

    const classExpressionErrors = await lintFixture(
      'case3b.ts',
      'export const B = class {};\n'
    );
    expect(classExpressionErrors).toContain('no-restricted-syntax');
  });

  it('rejects this expressions in functions', async () => {
    const errors = await lintFixture(
      'case4.ts',
      'export function compute(): unknown {\n  return this;\n}\n'
    );
    expect(errors).toContain('no-restricted-syntax');
  });

  it('rejects throw statements outside assert-invariant', async () => {
    const errors = await lintFixture(
      'case5.ts',
      'export const execute = (): void => {\n  throw new Error("x");\n};\n'
    );
    expect(errors).toContain('no-restricted-syntax');
  });

  it('rejects line comments in type files', async () => {
    const errors = await lintFixture(
      'case6.type.ts',
      '// comment\n/**\n * Informative type documentation.\n */\nexport type TFoo = {\n  /**\n   * Informative property documentation.\n   */\n  readonly id: string;\n};\n'
    );
    expect(errors).toContain('repository/comment-policy');
  });

  it('rejects non-jsdoc block comments in type files', async () => {
    const errors = await lintFixture(
      'case7.type.ts',
      '/* non-jsdoc comment */\n/**\n * Informative type documentation.\n */\nexport type TFoo = {\n  /**\n   * Informative property documentation.\n   */\n  readonly id: string;\n};\n'
    );
    expect(errors).toContain('repository/comment-policy');
  });

  it('rejects jsdoc comments in files not ending with .type.ts', async () => {
    const errors = await lintFixture(
      'case8.ts',
      '/** doc */\nexport type TFoo = {\n  readonly id: string;\n};\n'
    );
    expect(errors).toContain('repository/comment-policy');
  });

  it('rejects shebang comments', async () => {
    const errors = await lintFixture(
      'case9.ts',
      '#!/usr/bin/env node\nexport const answer = 42;\n'
    );
    expect(errors).toContain('repository/comment-policy');
  });

  it('rejects type alias without jsdoc in type files', async () => {
    const errors = await lintFixture(
      'case10.type.ts',
      'export type TFoo = {\n  /**\n   * Informative property documentation.\n   */\n  readonly id: string;\n};\n'
    );
    expect(errors).toContain('jsdoc/require-jsdoc');
  });

  it('rejects property signature without jsdoc in type files', async () => {
    const errors = await lintFixture(
      'case11.type.ts',
      '/**\n * Informative type documentation.\n */\nexport type TFoo = {\n  readonly id: string;\n};\n'
    );
    expect(errors).toContain('jsdoc/require-jsdoc');
  });

  it('allows imported Rule type used in local type alias with T prefix', async () => {
    const errors = await lintFixture(
      'case12.ts',
      'import type { Rule } from "eslint";\n\nexport type TRuleConfig = {\n  readonly rule: Rule.RuleModule;\n};\n'
    );
    expect(errors).toEqual([]);
  });

  it('allows type files with complete and informative jsdoc on types and properties', async () => {
    const errors = await lintFixture(
      'case13.type.ts',
      '/**\n * Informative type description for valid configuration structure.\n */\nexport type TValidConfig = {\n  /**\n   * Informative property description for the identifier.\n   */\n  readonly id: string;\n};\n'
    );
    expect(errors).toEqual([]);
  });

  it('allows throw statements inside assert-invariant utility', async () => {
    const ruleConfig = await getRestrictedSyntaxRule(
      'src/_src@shared/_domain/_utils/assert-invariant/assert-invariant.util.ts'
    );
    expect(hasThrowStatementSelector(ruleConfig)).toBe(false);

    const otherSrcRuleConfig = await getRestrictedSyntaxRule('src/main.ts');
    expect(hasThrowStatementSelector(otherSrcRuleConfig)).toBe(true);
  });

  it('enforces throw statement prohibition on assert-invariant file in any other position', async () => {
    const otherPositionRuleConfig = await getRestrictedSyntaxRule(
      'src/other/assert-invariant.util.ts'
    );
    expect(hasThrowStatementSelector(otherPositionRuleConfig)).toBe(true);
  });

  it('enforces classes and this prohibitions on assert-invariant utility', async () => {
    const ruleConfig = await getRestrictedSyntaxRule(
      'src/_src@shared/_domain/_utils/assert-invariant/assert-invariant.util.ts'
    );
    expect(hasSelector(ruleConfig, 'ClassDeclaration')).toBe(true);
    expect(hasSelector(ruleConfig, 'ClassExpression')).toBe(true);
    expect(hasSelector(ruleConfig, 'ThisExpression')).toBe(true);
  });

  it('restricts unicorn asterisk prefix rule to type files only', async () => {
    const tsRuleConfig = await getRuleConfig(
      'src/main.ts',
      'unicorn/no-asterisk-prefix-in-documentation-comments'
    );
    expect(Array.isArray(tsRuleConfig) && tsRuleConfig[0] === 2).toBe(true);

    const typeRuleConfig = await getRuleConfig(
      'src/types/sample.type.ts',
      'unicorn/no-asterisk-prefix-in-documentation-comments'
    );
    expect(Array.isArray(typeRuleConfig) && typeRuleConfig[0] === 0).toBe(true);
  });

  it('rejects variable declarations in type files', async () => {
    const errors = await lintFixture(
      'executable-variable.type.ts',
      'export const invalidValue = 42;\n'
    );
    expect(errors).toContain('no-restricted-syntax');
  });

  it('rejects function declarations in type files', async () => {
    const errors = await lintFixture(
      'executable-function.type.ts',
      'export function compute(): void {}\n'
    );
    expect(errors).toContain('no-restricted-syntax');
  });

  it('rejects enum declarations in type files', async () => {
    const errors = await lintFixture(
      'executable-enum.type.ts',
      'export enum TDirection { Up, Down }\n'
    );
    expect(errors).toContain('no-restricted-syntax');
  });

  it('rejects module and namespace declarations in type files', async () => {
    const errors = await lintFixture(
      'executable-namespace.type.ts',
      'export namespace TNamespace {}\n'
    );
    expect(errors).toContain('no-restricted-syntax');
  });

  it('rejects expression statements in type files', async () => {
    const errors = await lintFixture(
      'executable-expression.type.ts',
      'void 0;\n'
    );
    expect(errors).toContain('no-restricted-syntax');
  });

  it('rejects default export declarations in type files', async () => {
    const errors = await lintFixture(
      'executable-default-export.type.ts',
      'export default 1;\n'
    );
    expect(errors).toContain('no-restricted-syntax');
  });

  it('rejects value import declarations in type files', async () => {
    const errors = await lintFixture(
      'executable-value-import.type.ts',
      'import { notAType } from "./dependency.js";\n'
    );
    expect(errors).toContain('no-restricted-syntax');
  });

  it('allows documented type files with import type, type aliases, and export type', async () => {
    const content =
      'import type { Rule } from "eslint";\n\n/**\n * Exported type definition.\n */\nexport type TExported = {\n  /**\n   * Local property.\n   */\n  readonly local: TLocal;\n  /**\n   * Rule property.\n   */\n  readonly rule: Rule.RuleModule;\n};\n\n/**\n * Local type definition.\n */\ntype TLocal = {\n  /**\n   * Identifier property.\n   */\n  readonly id: string;\n};\n';
    const errors = await lintFixture('valid-only-types.type.ts', content);
    expect(errors).toEqual([]);
  });

  it('enforces class, this, and throw prohibitions in type files', async () => {
    const classErrors = await lintFixture(
      'forbidden-class.type.ts',
      'export class TClass {}\n'
    );
    expect(classErrors).toContain('no-restricted-syntax');

    const thisErrors = await lintFixture(
      'forbidden-this.type.ts',
      'export function f(): unknown { return this; }\n'
    );
    expect(thisErrors).toContain('no-restricted-syntax');

    const throwErrors = await lintFixture(
      'forbidden-throw.type.ts',
      'export function f(): void { throw new Error("x"); }\n'
    );
    expect(throwErrors).toContain('no-restricted-syntax');

    const typeRuleConfig = await getRestrictedSyntaxRule(
      'src/types/sample.type.ts'
    );
    expect(hasSelector(typeRuleConfig, 'ClassDeclaration')).toBe(true);
    expect(hasSelector(typeRuleConfig, 'ClassExpression')).toBe(true);
    expect(hasSelector(typeRuleConfig, 'ThisExpression')).toBe(true);
    expect(hasSelector(typeRuleConfig, 'ThrowStatement')).toBe(true);
  });
});
