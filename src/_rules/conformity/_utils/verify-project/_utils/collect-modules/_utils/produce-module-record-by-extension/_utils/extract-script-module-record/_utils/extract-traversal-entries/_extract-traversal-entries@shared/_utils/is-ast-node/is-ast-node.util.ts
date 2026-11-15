export function isAstNode(
  value: unknown
): value is Record<string, unknown> & { readonly type: string } {
  const isObject =
    typeof value === 'object' && value !== null && !Array.isArray(value);
  return isObject && 'type' in value && typeof value.type === 'string';
}
