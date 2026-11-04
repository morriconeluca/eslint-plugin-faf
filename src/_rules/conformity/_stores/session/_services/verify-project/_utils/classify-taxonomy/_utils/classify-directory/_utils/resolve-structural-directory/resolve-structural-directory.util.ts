import type {
  TDirectoryClassification,
  TDirectoryParent,
  TTreeClassificationContext,
} from '../../../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import { resolveCatalogCategory } from './_utils/resolve-catalog-category/index.js';
import { resolveFragmentChild } from './_utils/resolve-fragment-child/index.js';
import { resolveLayerChild } from './_utils/resolve-layer-child/index.js';
import { resolveMimeticChild } from './_utils/resolve-mimetic-child/index.js';
import { resolveSubCategoryChild } from './_utils/resolve-sub-category-child/index.js';

export function resolveStructuralDirectory(
  path: string,
  parent: TDirectoryParent,
  context: TTreeClassificationContext
): null | TDirectoryClassification {
  const mimeticChild = resolveMimeticChild(path, parent);
  if (mimeticChild !== null) {
    return mimeticChild;
  }
  const category = resolveCatalogCategory(path, parent, context);
  if (category !== null) {
    return category;
  }
  const fragment = resolveFragmentChild(path, parent);
  if (fragment !== null) {
    return fragment;
  }
  const layer = resolveLayerChild(path, parent);
  return layer ?? resolveSubCategoryChild(path, parent);
}
