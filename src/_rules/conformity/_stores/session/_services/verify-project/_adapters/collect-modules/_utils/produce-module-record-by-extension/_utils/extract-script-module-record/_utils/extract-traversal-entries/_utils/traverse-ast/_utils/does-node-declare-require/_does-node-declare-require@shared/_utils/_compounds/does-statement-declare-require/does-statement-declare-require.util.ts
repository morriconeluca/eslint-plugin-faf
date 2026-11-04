import type { Statement } from 'oxc-parser';

import { REQUIRE_NAME } from '../../../../../../_traverse-ast@shared/_constants/traversal-entries.constant.js';
import { doesPatternBindRequire } from '../../_primitives/does-pattern-bind-require/index.js';
import { doesTargetDeclareRequire } from './_utils/does-target-declare-require/index.js';

export function doesStatementDeclareRequire(statement: Statement): boolean {
  if (statement.type === 'ExportNamedDeclaration') {
    return (
      statement.declaration !== null &&
      doesStatementDeclareRequire(statement.declaration)
    );
  }
  if (statement.type === 'VariableDeclaration') {
    return statement.declarations.some((declarator) =>
      doesPatternBindRequire(declarator.id)
    );
  }
  if (statement.type === 'ImportDeclaration') {
    return statement.specifiers.some(
      (specifier) => specifier.local.name === REQUIRE_NAME
    );
  }
  if (statement.type === 'TSImportEqualsDeclaration') {
    return statement.id.name === REQUIRE_NAME;
  }
  return doesTargetDeclareRequire(statement);
}
