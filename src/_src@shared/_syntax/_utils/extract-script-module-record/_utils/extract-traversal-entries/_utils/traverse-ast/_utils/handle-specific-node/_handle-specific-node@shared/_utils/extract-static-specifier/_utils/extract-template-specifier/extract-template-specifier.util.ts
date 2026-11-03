import type { TemplateLiteral } from 'oxc-parser';

export function extractTemplateSpecifier(node: TemplateLiteral): null | string {
  if (node.expressions.length > 0) {
    return null;
  }
  const quasi = node.quasis[0];
  return quasi === undefined ? null : (quasi.value.cooked ?? quasi.value.raw);
}
