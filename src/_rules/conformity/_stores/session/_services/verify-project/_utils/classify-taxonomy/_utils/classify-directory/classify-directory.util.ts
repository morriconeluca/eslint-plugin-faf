import type {
  TDirectoryParent,
  TTreeClassificationContext,
} from '../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';
import type { TDirectoryClassification } from './classify-directory.type.js';

import { createDirectoryBase } from './_classify-directory@shared/_utils/create-directory-base/index.js';
import { resolveDeclaredDirectory } from './_utils/resolve-declared-directory/index.js';
import { resolveStructuralDirectory } from './_utils/resolve-structural-directory/index.js';

export function classifyDirectory(
  path: string,
  parent: TDirectoryParent,
  context: TTreeClassificationContext
): TDirectoryClassification {
  const declared = resolveDeclaredDirectory(path, parent, context);
  if (declared !== null) {
    return declared;
  }
  const structural = resolveStructuralDirectory(path, parent, context);
  if (structural !== null) {
    return structural;
  }
  if (parent.domainKind === 'fragment') {
    return createDirectoryBase(parent.path);
  }
  return createDirectoryBase(parent.parentFragmentPath);
}
