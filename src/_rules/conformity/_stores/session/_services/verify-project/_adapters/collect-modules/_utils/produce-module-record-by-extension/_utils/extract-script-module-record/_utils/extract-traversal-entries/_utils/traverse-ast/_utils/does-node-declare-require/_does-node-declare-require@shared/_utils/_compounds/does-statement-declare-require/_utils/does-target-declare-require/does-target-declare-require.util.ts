import type { Statement } from 'oxc-parser';

import { REQUIRE_NAME } from '../../../../../../../../_traverse-ast@shared/_constants/traversal-entries.constant.js';

export function doesTargetDeclareRequire(
  statement: Statement,
  name: string = REQUIRE_NAME
): boolean {
  if (statement.type === 'TSModuleDeclaration') {
    return 'name' in statement.id && statement.id.name === name;
  }
  if (
    statement.type === 'ClassDeclaration' ||
    statement.type === 'FunctionDeclaration' ||
    statement.type === 'TSEnumDeclaration'
  ) {
    return statement.id?.name === name;
  }
  return false;
}
