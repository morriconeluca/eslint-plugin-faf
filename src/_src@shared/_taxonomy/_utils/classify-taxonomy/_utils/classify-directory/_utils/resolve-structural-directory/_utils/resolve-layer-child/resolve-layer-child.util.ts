import type {
  TDirectoryClassification,
  TDirectoryParent,
} from '../../../../../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import {
  DOMAIN_FRACTAL_BRANCH,
  DOMAIN_LAYER,
  DOMAIN_ROOT_LAYER,
  UNDERSCORE,
} from '../../../../../../_classify-taxonomy@shared/_constants/classification-constraints.constant.js';
import { createDirectoryBase } from '../../../../../../_classify-taxonomy@shared/_utils/create-directory-base/index.js';
import { readPathName } from '../../../../../../_classify-taxonomy@shared/_utils/read-path-name/index.js';

export function resolveLayerChild(
  path: string,
  parent: TDirectoryParent
): null | TDirectoryClassification {
  if (!readPathName(path).startsWith(UNDERSCORE)) {
    return null;
  }
  const isAdmitsLayers =
    parent.domainKind === DOMAIN_FRACTAL_BRANCH ||
    parent.domainKind === DOMAIN_LAYER ||
    parent.domainKind === DOMAIN_ROOT_LAYER;
  if (!isAdmitsLayers) {
    return null;
  }
  return {
    ...createDirectoryBase(parent.parentFragmentPath),
    domainKind: DOMAIN_LAYER,
    isSubLayer: parent.domainKind === DOMAIN_LAYER,
  };
}
