import type { CompilerHost, CompilerOptions, Diagnostic } from 'typescript';
import type { z } from 'zod';

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createCompilerHost,
  createProgram,
  createSourceFile,
  flattenDiagnosticMessageText,
  ModuleKind,
  ModuleResolutionKind,
  ScriptKind,
  ScriptTarget,
} from 'typescript';
import { describe, expect, expectTypeOf, it } from 'vitest';

import type { TFAFConfig } from '../../../../../../../../../../../../_src@shared/_types/faf-config.type.js';

import { configFormatSchema } from './config-format-schema.schema.js';

const CONFIG_TYPE_SPECIFIER =
  '../../../../../../../../../../../../_src@shared/_types/faf-config.type.js';
const VIRTUAL_FILE_NAME = 'schema-output-equivalence.virtual.ts';

const EXACT_OPTIONAL_OPTIONS: CompilerOptions = {
  exactOptionalPropertyTypes: true,
  module: ModuleKind.NodeNext,
  moduleResolution: ModuleResolutionKind.NodeNext,
  noEmit: true,
  noUnusedLocals: true,
  skipLibCheck: true,
  strict: true,
  target: ScriptTarget.ES2022,
};

const EQUIVALENCE_SOURCE = `
import type { z } from 'zod';
import { expectTypeOf } from 'vitest';
import type { TFAFConfig } from '${CONFIG_TYPE_SPECIFIER}';
import { configFormatSchema } from './config-format-schema.schema.js';

expectTypeOf<z.output<typeof configFormatSchema>>().toEqualTypeOf<TFAFConfig>();
`;

const DIVERGENCE_SOURCE = `
import { expectTypeOf } from 'vitest';
import type { TFAFConfig } from '${CONFIG_TYPE_SPECIFIER}';

type TDivergent = { readonly extra: string };
expectTypeOf<TDivergent>().toEqualTypeOf<TFAFConfig>();
`;

const fragmentDirectory = path.dirname(fileURLToPath(import.meta.url));

const virtualFileName = path.join(fragmentDirectory, VIRTUAL_FILE_NAME);

const createExactOptionalHost = (virtualSource: string): CompilerHost => {
  const base = createCompilerHost(EXACT_OPTIONAL_OPTIONS, true);
  return {
    directoryExists: (directoryName) =>
      base.directoryExists?.(directoryName) ?? false,
    fileExists: (fileName) =>
      fileName === virtualFileName || base.fileExists(fileName),
    getCanonicalFileName: (fileName) => base.getCanonicalFileName(fileName),
    getCurrentDirectory: () => base.getCurrentDirectory(),
    getDefaultLibFileName: (options) => base.getDefaultLibFileName(options),
    getDirectories: (directoryName) =>
      base.getDirectories?.(directoryName) ?? [],
    getNewLine: () => base.getNewLine(),
    getSourceFile: (
      fileName,
      languageVersion,
      onError,
      shouldCreateNewSourceFile
    ) =>
      fileName === virtualFileName
        ? createSourceFile(
            fileName,
            virtualSource,
            languageVersion,
            true,
            ScriptKind.TS
          )
        : base.getSourceFile(
            fileName,
            languageVersion,
            onError,
            shouldCreateNewSourceFile
          ),
    readFile: (fileName) =>
      fileName === virtualFileName ? virtualSource : base.readFile(fileName),
    realpath: (fileName) => base.realpath?.(fileName) ?? fileName,
    useCaseSensitiveFileNames: () => base.useCaseSensitiveFileNames(),
    writeFile: (fileName, data, writeByteOrderMark, onError, sourceFiles) => {
      base.writeFile(fileName, data, writeByteOrderMark, onError, sourceFiles);
    },
  };
};

const diagnosticTexts = (virtualSource: string): readonly string[] => {
  const program = createProgram(
    [virtualFileName],
    EXACT_OPTIONAL_OPTIONS,
    createExactOptionalHost(virtualSource)
  );
  const sourceFile = program.getSourceFile(virtualFileName);
  if (sourceFile === undefined) {
    return ['virtual file was not part of the program'];
  }
  const diagnostics: readonly Diagnostic[] = [
    ...program.getSyntacticDiagnostics(sourceFile),
    ...program.getSemanticDiagnostics(sourceFile),
  ];
  return diagnostics.map((diagnostic) =>
    flattenDiagnosticMessageText(diagnostic.messageText, '\n')
  );
};

describe('configFormatSchema', () => {
  it('accepts one local origin and rejects an unknown root property', () => {
    expect(
      configFormatSchema.safeParse({
        faf: { locals: [{ rootLayers: ['src'] }] },
      }).success
    ).toBe(true);
    expect(configFormatSchema.safeParse({ trees: [] }).success).toBe(false);
    expect(
      configFormatSchema.safeParse({ faf: { locals: [{}] } }).success
    ).toBe(false);
    expect(configFormatSchema.safeParse(null).success).toBe(false);
    expect(
      configFormatSchema.safeParse({
        faf: {
          locals: [{}, { rootLayers: ['src'] }],
        },
      }).success
    ).toBe(false);
  });

  it('equates schema output to TFAFConfig', () => {
    expectTypeOf<
      z.output<typeof configFormatSchema>
    >().toEqualTypeOf<TFAFConfig>();
  });

  it('equates schema output to TFAFConfig under exactOptionalPropertyTypes', () => {
    expect(diagnosticTexts(EQUIVALENCE_SOURCE)).toEqual([]);
    expect(diagnosticTexts(DIVERGENCE_SOURCE).length).toBeGreaterThan(0);
  });
});
