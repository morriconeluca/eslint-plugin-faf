import type { TAstNode } from '../../../../extract-traversal-entries.type.js';

import { REQUIRE_NAME } from '../../../../extract-traversal-entries.constant.js';
import { doesPatternBindRequire } from '../../../does-pattern-bind-require/index.js';
import { isBindingPattern } from '../../../is-binding-pattern/index.js';
import { isRecord } from '../../../is-record/index.js';
import { isStatement } from '../../../is-statement/index.js';
import { doesStatementDeclareRequire } from '../does-statement-declare-require/index.js';

export function doesFunctionDeclareRequire(node: TAstNode): boolean {
  const id = node['id'];
  if (isRecord(id) && id['name'] === REQUIRE_NAME) {
    return true;
  }
  const parameters = node['params'];
  if (
    Array.isArray(parameters) &&
    parameters.some(
      (parameter) =>
        isBindingPattern(parameter) && doesPatternBindRequire(parameter)
    )
  ) {
    return true;
  }
  const body = node['body'];
  if (isRecord(body)) {
    const inner = body['body'];
    if (Array.isArray(inner)) {
      return inner
        .filter(isStatement)
        .some((statement) => doesStatementDeclareRequire(statement));
    }
  }
  return false;
}
