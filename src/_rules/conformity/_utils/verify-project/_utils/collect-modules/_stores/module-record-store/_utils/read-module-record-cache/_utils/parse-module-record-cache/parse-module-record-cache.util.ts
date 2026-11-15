import type { TSourceLocation } from '../../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TExportOrigin,
  TImportSyntaxKind,
  TModuleExport,
  TModuleImport,
  TModuleRecord,
  TRootSymbol,
  TUnsupportedSyntax,
} from '../../../../../../../../_verify-project@shared/_types/verification-model.type.js';
import type { TParseModuleRecordCacheInput } from './parse-module-record-cache.type.js';

import { isPlainRecord } from '../../../../../../../../../../../../_src@shared/_utils/is-plain-record/index.js';

export const parseModuleRecordCache = (() => {
  const VALID_LANGUAGES = new Set<string>(['binary', 'script', 'style']);
  const VALID_IMPORT_KINDS: ReadonlySet<string> = new Set<TImportSyntaxKind>([
    'css-at-import',
    'css-url',
    'default-import',
    'export-all-from',
    'export-named-from',
    'export-type-from',
    'literal-dynamic-import',
    'mixed-type-specifier-import',
    'named-import',
    'namespace-import',
    'non-literal-dynamic-import',
    'require-call',
    'side-effect-import',
    'type-only-import',
    'typescript-import-type',
    'typescript-require-import',
  ]);

  const isValidLocation = (value: unknown): value is TSourceLocation =>
    isPlainRecord(value) &&
    typeof value['line'] === 'number' &&
    typeof value['column'] === 'number';

  const isValidOrigin = (value: unknown): value is TExportOrigin => {
    if (!isPlainRecord(value)) {
      return false;
    }
    const type = value['type'];
    if (type === 'local-symbol') {
      return typeof value['symbolName'] === 'string';
    }
    if (type === 'export-all' || type === 'namespace') {
      return typeof value['specifier'] === 'string';
    }
    if (type === 'imported-binding') {
      return (
        typeof value['importedName'] === 'string' &&
        typeof value['specifier'] === 'string'
      );
    }
    return false;
  };

  const isValidExport = (value: unknown): value is TModuleExport => {
    if (!isPlainRecord(value)) {
      return false;
    }
    const hasNames =
      typeof value['exportedName'] === 'string' &&
      typeof value['isTypeOnly'] === 'boolean';
    if (!hasNames) {
      return false;
    }
    const hasLocation = isValidLocation(value['position']);
    const hasOrigin = isValidOrigin(value['origin']);
    return hasLocation && hasOrigin;
  };

  const isValidImport = (value: unknown): value is TModuleImport => {
    if (!isPlainRecord(value)) {
      return false;
    }
    const kind = value['kind'];
    const hasHeader =
      typeof value['isTypeOnly'] === 'boolean' &&
      typeof kind === 'string' &&
      VALID_IMPORT_KINDS.has(kind);
    if (!hasHeader) {
      return false;
    }
    const specifier = value['specifier'];
    const hasSpecifier = specifier === null || typeof specifier === 'string';
    return hasSpecifier && isValidLocation(value['position']);
  };

  const isValidSymbol = (value: unknown): value is TRootSymbol => {
    if (!isPlainRecord(value)) {
      return false;
    }
    const space = value['space'];
    const hasSpace = space === 'type' || space === 'value';
    const hasName = typeof value['name'] === 'string' && hasSpace;
    return hasName && isValidLocation(value['position']);
  };

  const isValidUnsupported = (value: unknown): value is TUnsupportedSyntax =>
    isPlainRecord(value) &&
    typeof value['description'] === 'string' &&
    isValidLocation(value['position']);

  const isValidModuleRecord = (
    candidate: unknown
  ): candidate is TModuleRecord => {
    if (!isPlainRecord(candidate)) {
      return false;
    }
    const hasValidLanguage = (): boolean => {
      const language = candidate['language'];
      return typeof language === 'string' && VALID_LANGUAGES.has(language);
    };
    if (!hasValidLanguage()) {
      return false;
    }
    const {
      exports,
      imports,
      symbols,
      unsupportedSyntaxes: unsupported,
    } = candidate;
    if (
      !Array.isArray(exports) ||
      !Array.isArray(imports) ||
      !Array.isArray(symbols) ||
      !Array.isArray(unsupported)
    ) {
      return false;
    }
    const hasExportsAndImports =
      exports.every(isValidExport) && imports.every(isValidImport);
    const hasSymbolsAndSyntax =
      symbols.every(isValidSymbol) && unsupported.every(isValidUnsupported);
    return hasExportsAndImports && hasSymbolsAndSyntax;
  };

  return function parseModuleRecordCache(
    input: TParseModuleRecordCacheInput
  ): ReadonlyMap<string, TModuleRecord> | undefined {
    const { packageVersion, raw, schemaVersion } = input;
    if (
      !isPlainRecord(raw) ||
      raw['schemaVersion'] !== schemaVersion ||
      raw['packageVersion'] !== packageVersion
    ) {
      return undefined;
    }
    const entries = raw['entries'];
    if (!Array.isArray(entries)) {
      return undefined;
    }

    const result = new Map<string, TModuleRecord>();
    for (const item of entries) {
      if (!Array.isArray(item) || item.length !== 2) {
        return undefined;
      }
      const entry: readonly unknown[] = item;
      const [key, record] = entry;
      if (typeof key !== 'string' || !isValidModuleRecord(record)) {
        return undefined;
      }
      result.set(key, record);
    }
    return result;
  };
})();
