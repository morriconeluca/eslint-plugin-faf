import nodePath from 'node:path';

import type { TResolvedTarget } from '../../../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type { TClassifyResolutionInput } from './classify-resolution-target.type.js';

import { toPosixPath } from '../../../../../../../../_session@shared/_utils/to-posix-path/index.js';
import { DISCORDANCE_REASON } from '../../_resolve-specifiers@shared/_constants/resolve-specifiers.constant.js';
import { extractPackageName } from './_utils/extract-package-name/index.js';
import { isAlternativeMatch } from './_utils/is-alternative-match/index.js';
import { isInNodeModules } from './_utils/is-in-node-modules/index.js';

export function classifyResolutionTarget(
  input: TClassifyResolutionInput
): TResolvedTarget {
  const {
    aliasAlternatives,
    aliasUsed,
    canonicalBase,
    resolveResult,
    specifier,
  } = input;

  if (resolveResult.builtin !== undefined || specifier.startsWith('node:')) {
    if (aliasUsed !== null) {
      return {
        reason: DISCORDANCE_REASON,
        type: 'unresolved',
      };
    }
    return {
      packageName: resolveResult.builtin?.resolved ?? specifier,
      type: 'external-library',
    };
  }

  const classifyLocalFile = (realResolvedPath: string): TResolvedTarget => {
    const relativeToCanonical = toPosixPath(
      nodePath.relative(canonicalBase, realResolvedPath)
    );
    const posixRelative = relativeToCanonical;

    if (aliasUsed !== null) {
      const isMatched = aliasAlternatives.some((alt) =>
        isAlternativeMatch(posixRelative, alt)
      );
      if (!isMatched) {
        return {
          reason: DISCORDANCE_REASON,
          type: 'unresolved',
        };
      }
    }

    return {
      path: posixRelative,
      type: 'local-file',
    };
  };

  if (resolveResult.path !== undefined) {
    const posixReal = toPosixPath(resolveResult.path);

    if (isInNodeModules(posixReal)) {
      if (aliasUsed !== null) {
        return {
          reason: DISCORDANCE_REASON,
          type: 'unresolved',
        };
      }
      return {
        packageName: extractPackageName(posixReal),
        type: 'external-library',
      };
    }

    return classifyLocalFile(resolveResult.path);
  }

  return {
    reason: resolveResult.error ?? `Cannot resolve module '${specifier}'`,
    type: 'unresolved',
  };
}
