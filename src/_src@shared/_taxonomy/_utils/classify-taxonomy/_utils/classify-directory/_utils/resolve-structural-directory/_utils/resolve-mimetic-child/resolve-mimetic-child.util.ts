import type {
  TDirectoryClassification,
  TDirectoryParent,
} from '../../../../../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import {
  DOMAIN_PATH_SUB_CATEGORY,
  UNDERSCORE,
} from '../../../../../../_classify-taxonomy@shared/_constants/classification-constraints.constant.js';
import { createDirectoryBase } from '../../../../../../_classify-taxonomy@shared/_utils/create-directory-base/index.js';
import { readPathName } from '../../../../../../_classify-taxonomy@shared/_utils/read-path-name/index.js';

export function resolveMimeticChild(
  path: string,
  parent: TDirectoryParent
): null | TDirectoryClassification {
  const name = readPathName(path);
  if (!parent.isMimeticContext || !name.startsWith(UNDERSCORE)) {
    return null;
  }
  return {
    ...createDirectoryBase(parent.parentFragmentPath),
    domainKind: DOMAIN_PATH_SUB_CATEGORY,
    form: parent.form,
    imposedRoleName: parent.imposedRoleName,
    isMimeticContext: true,
  };
}
