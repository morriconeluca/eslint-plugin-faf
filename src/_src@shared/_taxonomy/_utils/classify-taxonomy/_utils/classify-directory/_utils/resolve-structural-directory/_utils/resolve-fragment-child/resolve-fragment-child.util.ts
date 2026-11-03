import type {
  TDirectoryClassification,
  TDirectoryParent,
} from '../../../../../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import {
  DOMAIN_FRAGMENT,
  DOMAIN_PATH_SUB_CATEGORY,
  FORM_FRAGMENTS,
  UNDERSCORE,
} from '../../../../../../_classify-taxonomy@shared/_constants/classification-constraints.constant.js';
import { createDirectoryBase } from '../../../../../../_classify-taxonomy@shared/_utils/create-directory-base/index.js';
import { readPathName } from '../../../../../../_classify-taxonomy@shared/_utils/read-path-name/index.js';

export function resolveFragmentChild(
  path: string,
  parent: TDirectoryParent
): null | TDirectoryClassification {
  if (
    readPathName(path).startsWith(UNDERSCORE) ||
    parent.form !== FORM_FRAGMENTS
  ) {
    return null;
  }
  return {
    ...createDirectoryBase(parent.parentFragmentPath),
    domainKind: DOMAIN_FRAGMENT,
    imposedRoleName: parent.imposedRoleName,
    isPathFragment:
      parent.domainKind === DOMAIN_PATH_SUB_CATEGORY || parent.isMimeticContext,
    isSubFragment: parent.parentFragmentPath !== null,
  };
}
