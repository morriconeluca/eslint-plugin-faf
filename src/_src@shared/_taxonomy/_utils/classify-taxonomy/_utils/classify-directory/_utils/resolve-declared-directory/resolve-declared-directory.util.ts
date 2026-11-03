import type {
  TDirectoryClassification,
  TDirectoryParent,
  TTreeClassificationContext,
} from '../../../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import {
  SHARED_SUFFIX,
  UNDERSCORE,
} from '../../../../_classify-taxonomy@shared/_constants/classification-constraints.constant.js';
import { createDirectoryBase } from '../../../../_classify-taxonomy@shared/_utils/create-directory-base/index.js';
import { readPathName } from '../../../../_classify-taxonomy@shared/_utils/read-path-name/index.js';

export function resolveDeclaredDirectory(
  path: string,
  parent: TDirectoryParent,
  context: TTreeClassificationContext
): null | TDirectoryClassification {
  const enclosedFragmentPath =
    parent.domainKind === 'fragment' ? parent.path : parent.parentFragmentPath;
  const isForeign =
    context.foreignDomainPaths.has(path) ||
    parent.domainKind === 'foreign-domain';
  if (isForeign) {
    return {
      ...createDirectoryBase(enclosedFragmentPath),
      domainKind: 'foreign-domain',
    };
  }

  if (context.rootFragmentPaths.has(path)) {
    return {
      ...createDirectoryBase(null),
      domainKind: 'root-fragment',
    };
  }

  const name = readPathName(path);
  const isReservedBranch =
    name.startsWith(UNDERSCORE) && name.endsWith(SHARED_SUFFIX);
  if (!isReservedBranch) {
    return null;
  }

  const parentName = readPathName(parent.path);
  const scope = parentName.startsWith(UNDERSCORE)
    ? parentName.slice(1)
    : parentName;
  if (name !== `${UNDERSCORE}${scope}${SHARED_SUFFIX}`) {
    return createDirectoryBase(enclosedFragmentPath);
  }
  return {
    ...createDirectoryBase(enclosedFragmentPath),
    domainKind: 'fractal-branch',
  };
}
