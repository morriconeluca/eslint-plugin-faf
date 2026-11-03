import { extractTemplateSpecifier } from './_utils/extract-template-specifier/index.js';
import { isTemplateLiteral } from './_utils/is-template-literal/index.js';

export function extractStaticSpecifier(node: {
  readonly type: string;
}): null | string {
  if (
    node.type === 'Literal' &&
    'value' in node &&
    typeof node.value === 'string'
  ) {
    return node.value;
  }

  if (isTemplateLiteral(node)) {
    return extractTemplateSpecifier(node);
  }

  return null;
}
