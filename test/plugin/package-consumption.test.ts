import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  createProgram,
  flattenDiagnosticMessageText,
  getPreEmitDiagnostics,
  ModuleKind,
  ModuleResolutionKind,
  resolveModuleName,
  ScriptTarget,
  sys,
} from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const PACKAGE_NAME = '@morriconeluca/eslint-plugin-faf';
const TSUP_CLI = 'node_modules/tsup/dist/cli-default.js';
const UTF8 = 'utf8';

const CONFIGURATION_TYPE_NAMES = [
  'TFAFCommonConfig',
  'TFAFConfig',
  'TFAFExternalDependency',
  'TFAFForeignNodeFamily',
  'TFAFHierarchy',
  'TFAFLocalConfig',
  'TFAFLocalHorizontalHierarchy',
  'TFAFMimeticPathStructure',
  'TFAFNonEmptyArray',
  'TFAFRole',
  'TFAFRoles',
  'TFAFRootDependencyEdge',
  'TFAFRootFragment',
  'TFAFSharedConfig',
  'TFAFSubGraphRole',
  'TFAFTreeDependency',
] as const;

type TRuntimeReport = {
  readonly defaultProperty: unknown;
  readonly keys: readonly string[];
  readonly name: string;
  readonly namespace: 'faf';
  readonly namespaceKeys: readonly string[];
  readonly ruleType: string;
  readonly self: boolean;
  readonly version: string;
};

const compilerOptions = {
  exactOptionalPropertyTypes: true,
  module: ModuleKind.NodeNext,
  moduleResolution: ModuleResolutionKind.NodeNext,
  noEmit: true,
  strict: true,
  target: ScriptTarget.ES2022,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isStringArray = (value: unknown): value is readonly string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string');

const hasRuntimeIdentity = (value: Record<string, unknown>): boolean => {
  const hasName =
    typeof value['name'] === 'string' && value['namespace'] === 'faf';
  const hasVersion =
    typeof value['version'] === 'string' &&
    typeof value['ruleType'] === 'string';
  return hasName && hasVersion && value['self'] === true;
};

const hasRuntimeCollections = (value: Record<string, unknown>): boolean =>
  isStringArray(value['keys']) &&
  isStringArray(value['namespaceKeys']) &&
  'defaultProperty' in value;

const isRuntimeReport = (value: unknown): value is TRuntimeReport =>
  isRecord(value) && hasRuntimeIdentity(value) && hasRuntimeCollections(value);

const isDefinedReport = (
  report: TRuntimeReport | undefined
): report is TRuntimeReport => report !== undefined;

const readReport = (source: string): TRuntimeReport | undefined => {
  const parsed: unknown = JSON.parse(source);
  return isRuntimeReport(parsed) ? parsed : undefined;
};

const runNode = (scriptPath: string): TRuntimeReport | undefined => {
  const stdout = execFileSync(process.execPath, [scriptPath], {
    encoding: UTF8,
  });
  return readReport(stdout);
};

const compile = (fileName: string): readonly string[] => {
  const program = createProgram({
    options: compilerOptions,
    rootNames: [fileName],
  });
  return getPreEmitDiagnostics(program).map((diagnostic) =>
    flattenDiagnosticMessageText(diagnostic.messageText, '\n')
  );
};

const resolvedDeclaration = (
  containingFile: string,
  resolutionMode: ModuleKind.CommonJS | ModuleKind.ESNext
): string | undefined =>
  resolveModuleName(
    PACKAGE_NAME,
    containingFile,
    compilerOptions,
    sys,
    undefined,
    undefined,
    resolutionMode
  ).resolvedModule?.resolvedFileName;

const cjsConsumerSource = `const plugin = require(${JSON.stringify(PACKAGE_NAME)});
const absentDefault = (value) => value === undefined ? null : value;
process.stdout.write(JSON.stringify({
  defaultProperty: absentDefault(plugin.default),
  keys: Object.keys(plugin).sort(),
  name: plugin.meta.name,
  namespace: plugin.meta.namespace,
  namespaceKeys: [],
  ruleType: plugin.rules.conformity.meta.type,
  self: plugin.configs.recommended.plugins.faf === plugin,
  version: plugin.meta.version,
}));
`;

const esmConsumerSource = `import plugin from ${JSON.stringify(PACKAGE_NAME)};
import * as namespace from ${JSON.stringify(PACKAGE_NAME)};
const absentDefault = (value) => value === undefined ? null : value;
process.stdout.write(JSON.stringify({
  defaultProperty: absentDefault(plugin.default),
  keys: Object.keys(plugin).sort(),
  name: plugin.meta.name,
  namespace: plugin.meta.namespace,
  namespaceKeys: Object.keys(namespace).sort(),
  ruleType: plugin.rules.conformity.meta.type,
  self: plugin.configs.recommended.plugins.faf === plugin && namespace.default === plugin,
  version: plugin.meta.version,
}));
`;

const configTypeProbes = CONFIGURATION_TYPE_NAMES.map((typeName) =>
  typeName === 'TFAFNonEmptyArray'
    ? `  ${typeName}: plugin.TFAFNonEmptyArray<string>;`
    : `  ${typeName}: plugin.${typeName};`
).join('\n');

const importedTypeProbes = CONFIGURATION_TYPE_NAMES.map((typeName) =>
  typeName === 'TFAFNonEmptyArray'
    ? `  ${typeName}: TFAFNonEmptyArray<string>;`
    : `  ${typeName}: ${typeName};`
).join('\n');

const cjsTypeSource = `import plugin = require(${JSON.stringify(PACKAGE_NAME)});
const name: string = plugin.meta.name;
const conformity = plugin.rules.conformity;
const identity: typeof plugin = plugin.configs.recommended.plugins.faf;
export type TAccessibleConfiguration = {
${configTypeProbes}
};
export { conformity, identity, name };
`;

const esmTypeSource = `import plugin from ${JSON.stringify(PACKAGE_NAME)};
import type { ${CONFIGURATION_TYPE_NAMES.join(', ')} } from ${JSON.stringify(PACKAGE_NAME)};
const name: string = plugin.meta.name;
const conformity = plugin.rules.conformity;
export type TImportedConfiguration = {
${importedTypeProbes}
};
export { conformity, name };
`;

const cjsDefaultAccessSource = `import plugin = require(${JSON.stringify(PACKAGE_NAME)});
export const viaDefault = plugin.default;
`;

describe('published package consumption', () => {
  const consumerDirectory = path.join(
    tmpdir(),
    `eslint-plugin-faf-consumer-${Date.now()}`
  );
  const packageLink = path.join(
    consumerDirectory,
    'node_modules',
    PACKAGE_NAME
  );
  const cjsScriptPath = path.join(consumerDirectory, 'consume.cjs');
  const esmScriptPath = path.join(consumerDirectory, 'consume.mjs');
  const cjsTypesPath = path.join(consumerDirectory, 'consume.cts');
  const esmTypesPath = path.join(consumerDirectory, 'consume.mts');
  const cjsDefaultPath = path.join(consumerDirectory, 'default-access.cts');

  beforeAll(() => {
    execFileSync(process.execPath, [path.resolve(TSUP_CLI)], {
      cwd: process.cwd(),
      encoding: UTF8,
      stdio: 'pipe',
    });
    mkdirSync(path.dirname(packageLink), { recursive: true });
    symlinkSync(process.cwd(), packageLink);
    writeFileSync(cjsScriptPath, cjsConsumerSource);
    writeFileSync(esmScriptPath, esmConsumerSource);
    writeFileSync(cjsTypesPath, cjsTypeSource);
    writeFileSync(esmTypesPath, esmTypeSource);
    writeFileSync(cjsDefaultPath, cjsDefaultAccessSource);
  }, 30_000);

  afterAll(() => {
    rmSync(consumerDirectory, { force: true, recursive: true });
  });

  it('returns the plugin object from CommonJS require', () => {
    const report = runNode(cjsScriptPath);
    expect(report).toMatchObject({
      keys: ['configs', 'meta', 'rules'],
      name: PACKAGE_NAME,
      namespace: 'faf',
      namespaceKeys: [],
      ruleType: 'problem',
      self: true,
      version: '0.5.0',
    });
    if (!isDefinedReport(report)) {
      expect(isDefinedReport(report)).toBe(true);
      return;
    }
    expect(report.defaultProperty).toBeNull();
  });

  it('returns the same plugin object from the ESM default import', () => {
    const report = runNode(esmScriptPath);
    expect(report).toMatchObject({
      keys: ['configs', 'meta', 'rules'],
      name: PACKAGE_NAME,
      namespace: 'faf',
      namespaceKeys: ['default'],
      ruleType: 'problem',
      self: true,
      version: '0.5.0',
    });
    if (!isDefinedReport(report)) {
      expect(isDefinedReport(report)).toBe(true);
      return;
    }
    expect(report.defaultProperty).toBeNull();
  });

  it('types CommonJS require as the plugin object with configuration types', () => {
    const declarationPath = resolvedDeclaration(
      cjsTypesPath,
      ModuleKind.CommonJS
    );
    expect(declarationPath).toMatch(/dist\/main\.d\.cts$/u);
    if (declarationPath === undefined) {
      return;
    }
    expect(readFileSync(declarationPath, UTF8)).toContain('export = plugin;');
    expect(compile(cjsTypesPath)).toEqual([]);
  });

  it('keeps ESM default and named configuration types', () => {
    const declarationPath = resolvedDeclaration(
      esmTypesPath,
      ModuleKind.ESNext
    );
    expect(declarationPath).toMatch(/dist\/main\.d\.ts$/u);
    if (declarationPath === undefined) {
      return;
    }
    const declaration = readFileSync(declarationPath, UTF8);
    expect(declaration).toContain('plugin as default');
    expect(declaration).not.toContain('export = plugin;');
    expect(compile(esmTypesPath)).toEqual([]);
  });

  it('rejects a CommonJS .default access that the runtime does not need', () => {
    expect(compile(cjsDefaultPath).join('\n')).toContain(
      "Property 'default' does not exist"
    );
  });
});
