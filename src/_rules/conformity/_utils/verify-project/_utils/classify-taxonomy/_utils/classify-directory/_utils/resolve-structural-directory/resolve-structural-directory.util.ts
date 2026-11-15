import type {
  TDirectoryClassification,
  TDirectoryParent,
  TTreeClassificationContext,
} from '../../../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import {
  DOMAIN_CATEGORY,
  DOMAIN_FRACTAL_BRANCH,
  DOMAIN_FRAGMENT,
  DOMAIN_LAYER,
  DOMAIN_PATH_SUB_CATEGORY,
  DOMAIN_ROOT_FRAGMENT,
  DOMAIN_ROOT_LAYER,
  DOMAIN_SUB_CATEGORY,
  FORM_FRAGMENTS,
  UNDERSCORE,
} from '../../../../_classify-taxonomy@shared/_constants/classification-constraints.constant.js';
import { readPathName } from '../../../../_classify-taxonomy@shared/_utils/read-path-name/index.js';
import { createDirectoryBase } from '../../_classify-directory@shared/_utils/create-directory-base/index.js';

export const resolveStructuralDirectory = (() => {
  const resolveMimeticChild = (
    path: string,
    parent: TDirectoryParent
  ): null | TDirectoryClassification => {
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
  };

  const resolveCatalogCategory = (
    path: string,
    parent: TDirectoryParent,
    context: TTreeClassificationContext
  ): null | TDirectoryClassification => {
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
  };

  const resolveFragmentChild = (
    path: string,
    parent: TDirectoryParent
  ): null | TDirectoryClassification => {
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
        parent.domainKind === DOMAIN_PATH_SUB_CATEGORY ||
        parent.isMimeticContext,
      isSubFragment: parent.parentFragmentPath !== null,
    };
  };

  const resolveLayerChild = (
    path: string,
    parent: TDirectoryParent
  ): null | TDirectoryClassification => {
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
  };

  const resolveSubCategoryChild = (
    path: string,
    parent: TDirectoryParent
  ): null | TDirectoryClassification => {
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
  };

  return function resolveStructuralDirectory(
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
  };
})();
