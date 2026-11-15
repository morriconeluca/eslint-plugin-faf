import type {
  TDirectoryParent,
  TTreeClassificationContext,
} from '../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';
import type { TFileClassification } from './classify-file.type.js';

import {
  ABSENT_ROLE_KIND,
  DOMAIN_CATEGORY,
  DOMAIN_FRAGMENT,
  DOMAIN_ROOT_FRAGMENT,
  DOMAIN_SUB_CATEGORY,
  FORM_CATEGORY_NODES,
  NODE_CATEGORY,
  NODE_FOREIGN,
  NODE_ROOT,
  NODE_UNAUTHORIZED,
} from '../../_classify-taxonomy@shared/_constants/classification-constraints.constant.js';
import { readPathName } from '../../_classify-taxonomy@shared/_utils/read-path-name/index.js';
import { blankFileFields } from './_classify-file@shared/_utils/blank-file-fields/index.js';
import { classifyFragmentFile } from './_utils/classify-fragment-file/index.js';

export function classifyFile(
  path: string,
  parent: TDirectoryParent,
  context: TTreeClassificationContext
): TFileClassification {
  const classifyDesignatedFile = (
    parentFragmentPath: null | string
  ): null | TFileClassification => {
    const absentRole = { kind: ABSENT_ROLE_KIND, roleName: null } as const;
    const isDesignatedForeign = context.foreignNodePaths.has(path);
    const isDesignatedRoot = context.rootNodePaths.has(path);
    if (isDesignatedRoot && isDesignatedForeign) {
      return {
        conflict: 'contradictory-root-foreign',
        fields: blankFileFields(
          null,
          absentRole,
          null,
          null,
          parentFragmentPath
        ),
      };
    }
    if (!isDesignatedForeign) {
      return null;
    }
    return {
      conflict: null,
      fields: blankFileFields(
        NODE_FOREIGN,
        absentRole,
        null,
        null,
        parentFragmentPath
      ),
    };
  };

  const classifyRootFragmentFile = (
    parentFragmentPath: null | string
  ): TFileClassification => {
    const absentRole = { kind: ABSENT_ROLE_KIND, roleName: null } as const;
    if (context.rootNodePaths.has(path)) {
      return {
        conflict: null,
        fields: blankFileFields(
          NODE_ROOT,
          absentRole,
          null,
          null,
          parentFragmentPath
        ),
      };
    }
    return {
      conflict: 'unenumerated-root-file',
      fields: blankFileFields(null, absentRole, null, null, parentFragmentPath),
    };
  };

  const classifyCategoryFile = (
    parentFragmentPath: null | string
  ): TFileClassification => {
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
  };

  const parentFragmentPath =
    parent.domainKind === DOMAIN_FRAGMENT
      ? parent.path
      : parent.parentFragmentPath;
  const designated = classifyDesignatedFile(parentFragmentPath);
  if (designated !== null) {
    return designated;
  }
  if (parent.domainKind === null) {
    return {
      conflict: null,
      fields: blankFileFields(
        null,
        { kind: ABSENT_ROLE_KIND, roleName: null },
        null,
        null,
        parentFragmentPath
      ),
    };
  }
  if (parent.domainKind === DOMAIN_ROOT_FRAGMENT) {
    return classifyRootFragmentFile(parentFragmentPath);
  }
  if (parent.domainKind === DOMAIN_FRAGMENT) {
    return classifyFragmentFile(
      readPathName(path),
      parent,
      context,
      parentFragmentPath
    );
  }
  return classifyCategoryFile(parentFragmentPath);
}
