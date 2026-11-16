import type { Comment } from 'oxc-parser';

import type { TModuleImport } from '../../../../../../../../_conformity@shared/_types/verification-model.type.js';
import type { TSourceLocator } from '../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';

import { assertInvariant } from '../../../../../../../../_conformity@shared/_utils/assert-invariant/index.js';

export function extractReferenceDirectives(
  comments: readonly Comment[],
  locator: TSourceLocator
): readonly TModuleImport[] {
  const tripleSlashPathPattern =
    /^\/\s*<reference\s+path\s*=\s*(?:"([^"]+)"|'([^']+)')\s*\/>\s*$/u;

  const parseReferencePath = (comment: Comment): null | string => {
    if (comment.type !== 'Line' || !comment.value.startsWith('/')) {
      return null;
    }

    const match = tripleSlashPathPattern.exec(comment.value);
    if (match === null) {
      return null;
    }

    const specifier = match[1] ?? match[2];
    assertInvariant(
      specifier !== undefined,
      'Expected triple-slash reference path specifier'
    );
    return specifier;
  };

  const directives: TModuleImport[] = [];

  for (const comment of comments) {
    const specifier = parseReferencePath(comment);
    if (specifier !== null) {
      directives.push({
        isTypeOnly: true,
        kind: 'typescript-reference-path',
        position: locator(comment.start),
        specifier,
      });
    }
  }

  return directives;
}
