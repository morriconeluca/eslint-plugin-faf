import type { Statement } from 'oxc-parser';

import { REQUIRE_NAME } from '../../../../../../extract-traversal-entries.constant.js';

export function doesTargetDeclareRequire(statement: Statement): boolean {
  if (statement.type === 'TSModuleDeclaration') {
    return 'name' in statement.id && statement.id.name === REQUIRE_NAME;
  }
  if (
    statement.type === 'ClassDeclaration' ||
    statement.type === 'FunctionDeclaration' ||
    statement.type === 'TSEnumDeclaration'
  ) {
    return statement.id?.name === REQUIRE_NAME;
  }
  return false;
}
