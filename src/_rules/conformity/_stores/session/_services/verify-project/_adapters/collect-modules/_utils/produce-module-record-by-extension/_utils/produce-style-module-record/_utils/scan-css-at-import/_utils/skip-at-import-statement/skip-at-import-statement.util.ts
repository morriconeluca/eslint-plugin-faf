import type { TSkipAtImportStatementResult } from './skip-at-import-statement.type.js';

import {
  SASS_NEWLINES,
  STATEMENT_TERMINATORS,
} from './skip-at-import-statement.constant.js';

export function skipAtImportStatement(
  text: string,
  startIndex: number,
  isSass: boolean
): TSkipAtImportStatementResult {
  const isStatementTerminator = (char: string | undefined): boolean =>
    char === undefined ||
    STATEMENT_TERMINATORS.includes(char) ||
    (isSass && SASS_NEWLINES.includes(char));

  let statementEnd = startIndex;
  while (!isStatementTerminator(text[statementEnd])) {
    statementEnd += 1;
  }

  const nextIndex =
    text[statementEnd] === ';' ? statementEnd + 1 : statementEnd;
  return { nextIndex };
}
