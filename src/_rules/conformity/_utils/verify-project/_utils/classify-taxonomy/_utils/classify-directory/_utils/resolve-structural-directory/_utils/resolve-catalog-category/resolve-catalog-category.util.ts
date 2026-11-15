import type {
  TDirectoryClassification,
  TDirectoryParent,
  TTreeClassificationContext,
} from '../../../../../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import {
  DOMAIN_CATEGORY,
  DOMAIN_FRAGMENT,
  DOMAIN_ROOT_FRAGMENT,
  FORM_FRAGMENTS,
} from '../../../../../../_classify-taxonomy@shared/_constants/classification-constraints.constant.js';
import { readPathName } from '../../../../../../_classify-taxonomy@shared/_utils/read-path-name/index.js';
import { createDirectoryBase } from '../../../../_classify-directory@shared/_utils/create-directory-base/index.js';

export function resolveCatalogCategory(
  path: string,
  parent: TDirectoryParent,
  context: TTreeClassificationContext
): null | TDirectoryClassification {
  const categoryRole = context.catalog.categoryToRole.get(readPathName(path));
  if (categoryRole === undefined) {
    return null;
  }
  const enclosedFragmentPath =
    parent.domainKind === DOMAIN_FRAGMENT
      ? parent.path
      : parent.parentFragmentPath;
  const isPrivateCategory =
    parent.domainKind === DOMAIN_FRAGMENT ||
    parent.domainKind === DOMAIN_ROOT_FRAGMENT;
  const isMimeticContext =
    categoryRole.form === FORM_FRAGMENTS && context.mimeticPaths.has(path);
  return {
    ...createDirectoryBase(enclosedFragmentPath),
    domainKind: DOMAIN_CATEGORY,
    form: categoryRole.form,
    imposedRoleName: categoryRole.name,
    isMimeticContext,
    isPrivateCategory,
  };
}
