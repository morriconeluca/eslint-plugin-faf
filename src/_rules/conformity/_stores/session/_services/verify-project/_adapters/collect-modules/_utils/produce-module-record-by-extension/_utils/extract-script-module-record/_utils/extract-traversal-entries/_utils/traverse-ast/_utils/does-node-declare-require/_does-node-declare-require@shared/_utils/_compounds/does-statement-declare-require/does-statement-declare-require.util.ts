import type { Statement } from 'oxc-parser';

import { REQUIRE_NAME } from '../../../../../../_traverse-ast@shared/_constants/traversal-entries.constant.js';
import { doesPatternBindRequire } from '../../_primitives/does-pattern-bind-require/index.js';
import { doesTargetDeclareRequire } from './_utils/does-target-declare-require/index.js';

export function doesStatementDeclareRequire(
  statement: Statement,
  name: string = REQUIRE_NAME
): boolean {
  if (statement.type === 'ExportNamedDeclaration') {
    return (
      statement.declaration !== null &&
      doesStatementDeclareRequire(statement.declaration, name)
    );
  }
  if (statement.type === 'VariableDeclaration') {
    return statement.declarations.some((declarator) =>
      doesPatternBindRequire(declarator.id, name)
    );
  }
  if (statement.type === 'ImportDeclaration') {
    return statement.specifiers.some(
      (specifier) => specifier.local.name === name
    );
  }
  if (statement.type === 'TSImportEqualsDeclaration') {
    return statement.id.name === name;
  }
  return doesTargetDeclareRequire(statement, name);
}
