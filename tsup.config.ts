import { readFileSync, writeFileSync } from 'node:fs';
import { build, defineConfig } from 'tsup';

const CJS_DECLARATION_PATH = 'dist/main.d.cts';
const EXPORT_EQUALS = 'export = plugin;\n';
const TYPE_SPECIFIER_PREFIX = 'type ';

const configTypeList = (exportClause: string): string =>
  exportClause
    .split(',')
    .map((specifier) => specifier.trim())
    .filter((specifier) => specifier.startsWith(TYPE_SPECIFIER_PREFIX))
    .map((specifier) => specifier.slice(TYPE_SPECIFIER_PREFIX.length))
    .join(',\n    ');

const toCommonJsDeclaration = (source: string): string => {
  const exportMatch = /export \{(?<clause>[^}]+)\};\s*$/u.exec(source);
  if (exportMatch === null) {
    return source;
  }
  const clause = exportMatch.groups?.['clause'];
  if (clause === undefined) {
    return source;
  }
  const typeList = configTypeList(clause);
  const namespace = `declare namespace plugin {\n  export type {\n    ${typeList}\n  };\n}\n${EXPORT_EQUALS}`;
  return `${source.slice(0, exportMatch.index)}${namespace}`;
};

const publishCommonJsTypes = (): void => {
  const source = readFileSync(CJS_DECLARATION_PATH, 'utf8');
  if (source.includes(EXPORT_EQUALS.trim())) {
    return;
  }
  writeFileSync(CJS_DECLARATION_PATH, toCommonJsDeclaration(source));
};

const emitDeclarations = async (): Promise<void> => {
  await build({
    clean: false,
    config: false,
    dts: {
      compilerOptions: {
        ignoreDeprecations: '6.0',
      },
      only: true,
    },
    entry: ['src/main.ts'],
    format: ['cjs', 'esm'],
    silent: true,
  });
  publishCommonJsTypes();
};

export default defineConfig({
  clean: true,
  entry: ['src/main.ts'],
  external: ['oxc-parser', 'oxc-resolver'],
  footer: (context) =>
    context.format === 'cjs'
      ? { js: 'module.exports = module.exports.default;' }
      : undefined,
  format: ['cjs', 'esm'],
  minify: false,
  onSuccess: emitDeclarations,
  shims: true,
  sourcemap: true,
});
