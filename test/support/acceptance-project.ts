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
): Promise<{
  readonly messages: readonly TScenarioMessage[];
  readonly unimplementedParts: ReadonlyMap<string, readonly TScenarioMessage[]>;
}> => {
  const results = await lintProject(cwd, files);
  const messages: TScenarioMessage[] = [];
  const unimplementedParts = new Map<string, TScenarioMessage[]>();
  for (const result of results) {
    const filePath = nodePath
      .relative(cwd, result.filePath)
      .split(nodePath.sep)
      .join('/');
    for (const message of result.messages) {
      const normalized = normalizeMessage(filePath, message);
      const part =
        normalized.constraint === 'unverified/not-implemented' &&
        message.messageId === 'unverified'
          ? /^unverified\/not-implemented: '([^']+)' is not implemented \(D-03\)\./.exec(
              message.message
            )?.[1]
          : undefined;
      if (part === undefined) {
        messages.push(normalized);
      } else {
        const outcomes = unimplementedParts.get(part) ?? [];
        outcomes.push(normalized);
        unimplementedParts.set(part, outcomes);
      }
    }
  }
  return { messages, unimplementedParts };
};

export const expectScenario = (
  result: Awaited<ReturnType<typeof lintScenario>>,
  responsiblePart: string,
  expected: readonly TScenarioMessage[]
): void => {
  const absent = result.unimplementedParts.get(responsiblePart);
  if (absent === undefined) {
    expect(result.messages).toEqual(expected);
    return;
  }
  expect(absent).toEqual([
    expect.objectContaining({
      constraint: 'unverified/not-implemented',
      element: responsiblePart,
      messageId: 'unverified',
      ruleId: 'faf/conformity',
      severity: 2,
    }),
  ]);
  expect(absent[0]?.message).toContain(
    `'${responsiblePart}' is not implemented (D-03).`
  );
  expect(result.messages).toEqual([]);
};

export const warmupESLint = async (): Promise<void> => {
  await lintProject(nodePath.resolve(import.meta.dirname, '../..'), [
    'src/main.ts',
  ]);
};
