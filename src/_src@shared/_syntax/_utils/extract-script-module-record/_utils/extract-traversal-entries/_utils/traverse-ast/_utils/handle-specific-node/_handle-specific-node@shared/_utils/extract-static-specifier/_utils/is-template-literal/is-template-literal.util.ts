import type { TemplateLiteral } from 'oxc-parser';

export function isTemplateLiteral(node: {
  readonly type: string;
}): node is TemplateLiteral {
  return node.type === 'TemplateLiteral';
}
