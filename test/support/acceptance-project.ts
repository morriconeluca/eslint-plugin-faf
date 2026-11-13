import type { FileTree } from 'fs-fixture';

import { ESLint } from 'eslint';
import { createFixture } from 'fs-fixture';
import nodePath from 'node:path';
import { inspect } from 'node:util';
import { parser } from 'typescript-eslint';
import { expect } from 'vitest';

import plugin from '../../src/main.js';

export type TLintFile = {
  readonly filePath: string;
  readonly messages: readonly TLintMessage[];
};

export type TLintMessage = {
  readonly column: number;
  readonly line: number;
  readonly message: string;
  readonly messageId: null | string;
  readonly ruleId: null | string;
  readonly severity: number;
};

export type TScenarioMessage = TLintMessage & {
  readonly constraint: null | string;
  readonly element: string;
  readonly filePath: string;
};

const recommendedConfig = {
  languageOptions: { parser },
  ...plugin.configs.recommended,
};

const orderedByText = <T>(
  values: readonly T[],
  key: (value: T) => string
): readonly T[] => {
  const ordered = [...values];
  ordered.sort((left, right) =>
    Buffer.compare(
      Buffer.from(key(left), 'utf16le').swap16(),
      Buffer.from(key(right), 'utf16le').swap16()
    )
  );
  return ordered;
};

export const createProject = (
  tree: FileTree,
  config: Readonly<Record<string, unknown>>
): ReturnType<typeof createFixture> =>
  createFixture({
    'package.json': JSON.stringify({ type: 'module' }),
    ...tree,
    'fafconfig.ts': `export default ${inspect(config, {
      breakLength: Infinity,
      compact: true,
      depth: null,
      maxArrayLength: null,
      maxStringLength: null,
    })};\n`,
  });

export const lintProject = async (
  cwd: string,
  files: readonly string[] = ['.']
): Promise<readonly TLintFile[]> => {
  const eslint = new ESLint({
    cwd,
    overrideConfig: [recommendedConfig],
    overrideConfigFile: true,
  });
  const results = await eslint.lintFiles([...files]);
  return orderedByText(
    results.map((result) => ({
      filePath: result.filePath,
      messages: orderedByText(
        result.messages.map((message) => ({
          column: message.column,
          line: message.line,
          message: message.message,
          messageId: message.messageId ?? null,
          ruleId: message.ruleId,
          severity: message.severity,
        })),
        (message) =>
          JSON.stringify([
            message.line.toString().padStart(16, '0'),
            message.column.toString().padStart(16, '0'),
            message.messageId,
            message.message,
            message.ruleId,
            message.severity,
          ])
      ),
    })),
    (result) => result.filePath
  );
};

const normalizeMessage = (
  filePath: string,
  message: TLintMessage
): TScenarioMessage => {
  const constraint =
    message.ruleId === 'faf/conformity'
      ? (/^([a-z-]+\/[a-z-]+): /.exec(message.message)?.[1] ?? null)
      : null;
  return {
    ...message,
    constraint,
    element:
      constraint === null
        ? filePath
        : (/'([^']+)'/.exec(message.message)?.[1] ?? filePath),
    filePath,
  };
};

export const lintScenario = async (
  cwd: string,
  files: readonly string[] = ['.']
): Promise<readonly TScenarioMessage[]> => {
  const results = await lintProject(cwd, files);
  const messages: TScenarioMessage[] = [];
  for (const result of results) {
    const filePath = nodePath
      .relative(cwd, result.filePath)
      .split(nodePath.sep)
      .join('/');
    for (const message of result.messages) {
      messages.push(normalizeMessage(filePath, message));
    }
  }
  return messages;
};

export const expectScenario = (
  actual: readonly TScenarioMessage[],
  expected: readonly TScenarioMessage[]
): void => {
  expect(actual).toEqual(expected);
};

export const warmupESLint = async (): Promise<void> => {
  if ('__stryker__' in globalThis) {
    return;
  }
  await lintProject(nodePath.resolve(import.meta.dirname, '../..'), [
    'src/main.ts',
  ]);
};
