import type {
  TDirectoryParent,
  TFileClassification,
  TTreeClassificationContext,
} from '../../../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import {
  DOMAIN_CATEGORY,
  DOMAIN_SUB_CATEGORY,
  FORM_CATEGORY_NODES,
  NODE_CATEGORY,
  NODE_UNAUTHORIZED,
} from '../../../../_classify-taxonomy@shared/_constants/classification-constraints.constant.js';
import { readPathName } from '../../../../_classify-taxonomy@shared/_utils/read-path-name/index.js';
import { blankFileFields } from '../../_classify-file@shared/_utils/blank-file-fields/index.js';

export function classifyCategoryFile(
  path: string,
  parent: TDirectoryParent,
  context: TTreeClassificationContext,
  parentFragmentPath: null | string
): TFileClassification {
  const role = context.getRoleFromName(readPathName(path), context.catalog);
  const isCategoryContainer =
    parent.form === FORM_CATEGORY_NODES &&
    (parent.domainKind === DOMAIN_CATEGORY ||
      parent.domainKind === DOMAIN_SUB_CATEGORY);
  const isRoleMatches = role.roleName === parent.imposedRoleName;
  const nodeKind =
    isCategoryContainer && isRoleMatches ? NODE_CATEGORY : NODE_UNAUTHORIZED;
  return {
    conflict: null,
    fields: blankFileFields(
      nodeKind,
      role,
      parent.imposedRoleName,
      null,
      parentFragmentPath
    ),
  };
}
