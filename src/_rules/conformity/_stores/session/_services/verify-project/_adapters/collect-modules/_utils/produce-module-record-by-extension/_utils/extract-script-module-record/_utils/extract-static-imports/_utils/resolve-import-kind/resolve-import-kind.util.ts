import type { ImportDeclaration } from 'oxc-parser';

import type { TResolvedImportKind } from './resolve-import-kind.type.js';

export function resolveImportKind(
  statement: ImportDeclaration
): TResolvedImportKind {
  if (statement.importKind === 'type') {
    return { isTypeOnly: true, kind: 'type-only-import' };
  }

  const specifiers = statement.specifiers;
  if (specifiers.length === 0) {
    return { isTypeOnly: false, kind: 'side-effect-import' };
  }

  const hasTypeSpecifier = specifiers.some(
    (specifier) =>
      specifier.type === 'ImportSpecifier' && specifier.importKind === 'type'
  );

  if (hasTypeSpecifier) {
    const hasValueBinding = specifiers.some(
      (specifier) =>
        specifier.type !== 'ImportSpecifier' || specifier.importKind !== 'type'
    );
    return {
      isTypeOnly: !hasValueBinding,
      kind: 'mixed-type-specifier-import',
    };
  }

  if (
    specifiers.length === 1 &&
    specifiers[0]?.type === 'ImportDefaultSpecifier'
  ) {
    return { isTypeOnly: false, kind: 'default-import' };
  }

  if (
    specifiers.length === 1 &&
    specifiers[0]?.type === 'ImportNamespaceSpecifier'
  ) {
    return { isTypeOnly: false, kind: 'namespace-import' };
  }

  return { isTypeOnly: false, kind: 'named-import' };
}
