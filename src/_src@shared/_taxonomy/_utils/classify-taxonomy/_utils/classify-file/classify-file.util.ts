import type {
  TDirectoryParent,
  TTreeClassificationContext,
} from '../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';
import type { TFileClassification } from './classify-file.type.js';

import {
  ABSENT_ROLE,
  DOMAIN_FRAGMENT,
  DOMAIN_ROOT_FRAGMENT,
} from '../../_classify-taxonomy@shared/_constants/classification-constraints.constant.js';
import { blankFileFields } from '../../_classify-taxonomy@shared/_utils/blank-file-fields/index.js';
import { readPathName } from '../../_classify-taxonomy@shared/_utils/read-path-name/index.js';
import { classifyCategoryFile } from './_utils/classify-category-file/index.js';
import { classifyDesignatedFile } from './_utils/classify-designated-file/index.js';
import { classifyFragmentFile } from './_utils/classify-fragment-file/index.js';
import { classifyRootFragmentFile } from './_utils/classify-root-fragment-file/index.js';

export function classifyFile(
  path: string,
  parent: TDirectoryParent,
  context: TTreeClassificationContext
): TFileClassification {
  const parentFragmentPath =
    parent.domainKind === DOMAIN_FRAGMENT
      ? parent.path
      : parent.parentFragmentPath;
  const designated = classifyDesignatedFile(path, context, parentFragmentPath);
  if (designated !== null) {
    return designated;
  }
  if (parent.domainKind === null) {
    return {
      conflict: null,
      fields: blankFileFields(
        null,
        ABSENT_ROLE,
        null,
        null,
        parentFragmentPath
      ),
    };
  }
  if (parent.domainKind === DOMAIN_ROOT_FRAGMENT) {
    return classifyRootFragmentFile(
      path,
      context.rootNodePaths,
      parentFragmentPath
    );
  }
  if (parent.domainKind === DOMAIN_FRAGMENT) {
    return classifyFragmentFile(
      readPathName(path),
      parent,
      context,
      parentFragmentPath
    );
  }
  return classifyCategoryFile(path, parent, context, parentFragmentPath);
}
