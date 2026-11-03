import type { TemplateLiteral } from 'oxc-parser';

import { isRecord } from '../../../is-record/index.js';

export function isTemplateLiteral(node: unknown): node is TemplateLiteral {
  return isRecord(node) && node['type'] === 'TemplateLiteral';
}
