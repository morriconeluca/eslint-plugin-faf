import type { TDirectoryClassification } from '../../../../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

export function createDirectoryBase(
  parentFragmentPath: null | string
): TDirectoryClassification {
  return {
    domainKind: null,
    form: null,
    imposedRoleName: null,
    isMimeticContext: false,
    isPathFragment: false,
    isPrivateCategory: false,
    isSubFragment: false,
    isSubLayer: false,
    parentFragmentPath,
  };
}
