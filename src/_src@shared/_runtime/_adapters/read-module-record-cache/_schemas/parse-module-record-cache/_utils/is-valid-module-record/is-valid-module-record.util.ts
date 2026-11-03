import type { TSourceLocation } from '../../../../../../../_domain/_types/outcome.type.js';
import type {
  TExportOrigin,
  TImportSyntaxKind,
  TModuleExport,
  TModuleImport,
  TModuleRecord,
  TRootSymbol,
  TUnsupportedSyntax,
} from '../../../../../../../_syntax/_types/module-record.type.js';

import { isPlainRecord } from '../../../../../../../_domain/_utils/is-plain-record/index.js';

export function isValidModuleRecord(
  candidate: unknown
): candidate is TModuleRecord {
  if (!isPlainRecord(candidate)) {
    return false;
  }

  const validLanguages = new Set<string>(['binary', 'script', 'style']);
  const validImportKinds: ReadonlySet<string> = new Set<TImportSyntaxKind>([
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

  const hasValidLanguage = (): boolean => {
    const lang = candidate['language'];
    return typeof lang === 'string' && validLanguages.has(lang);
  };

  if (!hasValidLanguage()) {
    return false;
  }

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
      const hasImportedName = typeof value['importedName'] === 'string';
      const hasSpecifier = typeof value['specifier'] === 'string';
      return hasImportedName && hasSpecifier;
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
      validImportKinds.has(kind);
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
}
