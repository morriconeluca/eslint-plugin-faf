import type { TemplateLiteral } from 'oxc-parser';

import { isRecord } from '../../../../../../../_traverse-ast@shared/_utils/is-record/index.js';

export function isTemplateLiteral(node: unknown): node is TemplateLiteral {
  return isRecord(node) && node['type'] === 'TemplateLiteral';
}
