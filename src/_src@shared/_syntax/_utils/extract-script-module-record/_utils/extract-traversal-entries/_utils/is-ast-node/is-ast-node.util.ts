import type { TAstNode } from '../../extract-traversal-entries.type.js';

export function isAstNode(value: unknown): value is TAstNode {
  const isObject =
    typeof value === 'object' && value !== null && !Array.isArray(value);
  return isObject && 'type' in value && typeof value.type === 'string';
}
