import type {
  TDirectoryClassification,
  TDirectoryParent,
} from '../../../../../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import {
  DOMAIN_CATEGORY,
  DOMAIN_SUB_CATEGORY,
  UNDERSCORE,
} from '../../../../../../_classify-taxonomy@shared/_constants/classification-constraints.constant.js';
import { readPathName } from '../../../../../../_classify-taxonomy@shared/_utils/read-path-name/index.js';
import { createDirectoryBase } from '../../../../_classify-directory@shared/_utils/create-directory-base/index.js';

export function resolveSubCategoryChild(
  path: string,
  parent: TDirectoryParent
): null | TDirectoryClassification {
  if (!readPathName(path).startsWith(UNDERSCORE) || parent.isMimeticContext) {
    return null;
  }
  const isAdmitsSubCategories =
    parent.domainKind === DOMAIN_CATEGORY ||
    parent.domainKind === DOMAIN_SUB_CATEGORY;
  if (!isAdmitsSubCategories) {
    return null;
  }
  return {
    ...createDirectoryBase(parent.parentFragmentPath),
    domainKind: DOMAIN_SUB_CATEGORY,
    form: parent.form,
    imposedRoleName: parent.imposedRoleName,
  };
}
