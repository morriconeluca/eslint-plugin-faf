import { isRecord } from '../../../../../_traverse-ast@shared/_utils/is-record/index.js';
import { extractTemplateSpecifier } from './_utils/extract-template-specifier/index.js';
import { isTemplateLiteral } from './_utils/is-template-literal/index.js';

export function extractStaticSpecifier(node: unknown): null | string {
  if (!isRecord(node)) {
    return null;
  }

  if (node['type'] === 'Literal' && typeof node['value'] === 'string') {
    return node['value'];
  }

  if (isTemplateLiteral(node)) {
    return extractTemplateSpecifier(node);
  }

  return null;
}
