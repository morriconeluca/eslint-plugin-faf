import type { Statement } from 'oxc-parser';

import { isRecord } from '../../../../../_traverse-ast@shared/_utils/is-record/index.js';

export function isStatement(value: unknown): value is Statement {
  return isRecord(value) && typeof value['type'] === 'string';
}
