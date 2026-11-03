import type {
  CompilerOptions,
  CompletionEntry,
  CompletionEntryDetails,
  Diagnostic,
  IScriptSnapshot,
  LanguageServiceHost,
  ResolvedModuleWithFailedLookupLocations,
  StringLiteralLike,
} from 'typescript';

import fs from 'node:fs';
import path from 'node:path';
import {
  createLanguageService,
  DiagnosticCategory,
  Extension,
  getDefaultLibFilePath,
  ModuleKind,
  ModuleResolutionKind,
  resolveModuleName,
  ScriptSnapshot,
  ScriptTarget,
  sys,
} from 'typescript';

export type TBothModesResult = {
  readonly looseErrors: readonly Diagnostic[];
  readonly strictErrors: readonly Diagnostic[];
};

export type TCompilationResult = {
  readonly diagnostics: readonly Diagnostic[];
  readonly errors: readonly Diagnostic[];
};

export type TVirtualCompiler = {
  readonly compile: (sourceText: string) => TCompilationResult;
  readonly getCompletionDetails: (
    sourceText: string,
    marker: string,
    entryName: string
  ) => CompletionEntryDetails | undefined;
  readonly getCompletions: (
    sourceText: string,
    marker: string
  ) => readonly CompletionEntry[];
};

export const CONFIG_TYPES_IMPORT =
  "import type { TFAFCommonConfig, TFAFConfig, TFAFExternalDependency, TFAFForeignNodeFamily, TFAFHierarchy, TFAFLocalConfig, TFAFLocalHorizontalHierarchy, TFAFMimeticPathStructure, TFAFNonEmptyArray, TFAFRole, TFAFRoles, TFAFRootDependencyEdge, TFAFRootFragment, TFAFSharedConfig, TFAFSubGraphRole, TFAFTreeDependency } from './src/main.js';";

const DEFAULT_FILE_VERSION = '1';
const UTF8_ENCODING = 'utf8';
const ALIAS_SPECIFIERS = new Set([
  './fafconfig.type',
  './src/main.js',
  './src/main.ts',
  '@morriconeluca/eslint-plugin-faf',
]);

const readDiskFile = (filePath: string): string =>
  fs.readFileSync(filePath, UTF8_ENCODING);

const resolveVirtualModule = (
  literalText: string,
  containingFile: string,
  options: CompilerOptions,
  mainTsPath: string
): ResolvedModuleWithFailedLookupLocations => {
  if (ALIAS_SPECIFIERS.has(literalText)) {
    return {
      resolvedModule: {
        extension: Extension.Ts,
        isExternalLibraryImport: false,
        resolvedFileName: mainTsPath,
      },
    };
  }
  return resolveModuleName(literalText, containingFile, options, sys);
};

const createVirtualCompiler = (hasExactOptional: boolean): TVirtualCompiler => {
  const rootDirectory = process.cwd();
  const mainTsPath = path.resolve(rootDirectory, 'src/main.ts');
  const virtualFileName = path.resolve(
    rootDirectory,
    `__virtual_test_${hasExactOptional ? 'strict' : 'loose'}__.ts`
  );

  const options: CompilerOptions = {
    exactOptionalPropertyTypes: hasExactOptional,
    module: ModuleKind.NodeNext,
    moduleResolution: ModuleResolutionKind.NodeNext,
    noEmit: true,
    strict: true,
    target: ScriptTarget.ES2022,
  };

  let currentContent = '';
  let currentVersion = 0;

  const host: LanguageServiceHost = {
    directoryExists: (directory: string) => fs.existsSync(directory),
    fileExists: (fileName: string) =>
      fileName === virtualFileName || fs.existsSync(fileName),
    getCompilationSettings: () => options,
    getCurrentDirectory: () => rootDirectory,
    getDefaultLibFileName: (options_: CompilerOptions) =>
      getDefaultLibFilePath(options_),
    getDirectories: (directory: string) => fs.readdirSync(directory),
    getScriptFileNames: () => [virtualFileName, mainTsPath],
    getScriptSnapshot: (fileName: string): IScriptSnapshot | undefined => {
      if (fileName === virtualFileName) {
        return ScriptSnapshot.fromString(currentContent);
      }
      if (fs.existsSync(fileName)) {
        return ScriptSnapshot.fromString(readDiskFile(fileName));
      }
      return undefined;
    },
    getScriptVersion: (fileName: string) =>
      fileName === virtualFileName
        ? String(currentVersion)
        : DEFAULT_FILE_VERSION,
    readFile: (fileName: string) => {
      if (fileName === virtualFileName) {
        return currentContent;
      }
      return fs.existsSync(fileName) ? readDiskFile(fileName) : undefined;
    },
    resolveModuleNameLiterals: (
      moduleLiterals: readonly StringLiteralLike[],
      containingFile: string
    ) =>
      moduleLiterals.map((literal) =>
        resolveVirtualModule(literal.text, containingFile, options, mainTsPath)
      ),
  };

  const service = createLanguageService(host);

  const compile = (sourceText: string): TCompilationResult => {
    currentContent = sourceText;
    currentVersion += 1;
    const syntactic = service.getSyntacticDiagnostics(virtualFileName);
    const semantic = service.getSemanticDiagnostics(virtualFileName);
    const diagnostics = [...syntactic, ...semantic];
    const errors = diagnostics.filter(
      (d) => d.category === DiagnosticCategory.Error
    );
    return { diagnostics, errors };
  };

  const getCompletions = (
    sourceText: string,
    marker: string
  ): readonly CompletionEntry[] => {
    currentContent = sourceText;
    currentVersion += 1;
    const markerIndex = sourceText.indexOf(marker);
    const offset = markerIndex === -1 ? 0 : markerIndex + marker.length;
    const info = service.getCompletionsAtPosition(virtualFileName, offset, {});
    return info === undefined ? [] : info.entries;
  };

  const getCompletionDetails = (
    sourceText: string,
    marker: string,
    entryName: string
  ): CompletionEntryDetails | undefined => {
    currentContent = sourceText;
    currentVersion += 1;
    const markerIndex = sourceText.indexOf(marker);
    const offset = markerIndex === -1 ? 0 : markerIndex + marker.length;
    return service.getCompletionEntryDetails(
      virtualFileName,
      offset,
      entryName,
      {},
      undefined,
      undefined,
      undefined
    );
  };

  return {
    compile,
    getCompletionDetails,
    getCompletions,
  };
};

export const compilerStrict = createVirtualCompiler(true);
export const compilerLoose = createVirtualCompiler(false);

export const compileInBothModes = (snippet: string): TBothModesResult => {
  const code = snippet.includes('import type')
    ? snippet
    : `${CONFIG_TYPES_IMPORT}\n${snippet}`;
  const strictResult = compilerStrict.compile(code);
  const looseResult = compilerLoose.compile(code);
  return {
    looseErrors: looseResult.errors,
    strictErrors: strictResult.errors,
  };
};
