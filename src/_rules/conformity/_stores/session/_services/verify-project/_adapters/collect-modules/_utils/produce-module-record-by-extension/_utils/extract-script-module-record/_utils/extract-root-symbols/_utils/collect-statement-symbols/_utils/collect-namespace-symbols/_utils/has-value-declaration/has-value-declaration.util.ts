import type { Statement, TSModuleDeclaration } from 'oxc-parser';

export function hasValueDeclaration(
  body: TSModuleDeclaration['body']
): boolean {
  if (body === null) {
    return false;
  }

  const isValueStatement = (statement: Statement): boolean => {
    const target =
      statement.type === 'ExportNamedDeclaration' &&
      statement.declaration !== null
        ? statement.declaration
        : statement;

    if (
      target.type === 'ClassDeclaration' ||
      target.type === 'FunctionDeclaration' ||
      target.type === 'TSEnumDeclaration' ||
      target.type === 'VariableDeclaration'
    ) {
      return true;
    }
    if (target.type === 'TSModuleDeclaration') {
      return hasValueDeclaration(target.body);
    }
    return false;
  };

  return body.body.some((statement) => isValueStatement(statement));
}
