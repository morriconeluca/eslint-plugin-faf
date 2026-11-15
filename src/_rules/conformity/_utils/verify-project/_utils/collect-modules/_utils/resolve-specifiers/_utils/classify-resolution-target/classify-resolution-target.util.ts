import nodePath from 'node:path';

import type { TResolvedTarget } from '../../../../../../_verify-project@shared/_types/verification-model.type.js';
import type { TClassifyResolutionInput } from './classify-resolution-target.type.js';

import { toPosixPath } from '../../../../../../../../../../_src@shared/_utils/to-posix-path/index.js';
import { assertInvariant } from '../../../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import {
  DISCORDANCE_REASON,
  NODE_MODULES_MARKER,
  NODE_MODULES_PREFIX,
} from '../../_resolve-specifiers@shared/_constants/resolve-specifiers.constant.js';

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

  const extractPackageName = (posixPath: string): string => {
    const index = posixPath.lastIndexOf(NODE_MODULES_MARKER);
    let remainder: string;

    if (index !== -1) {
      remainder = posixPath.slice(index + NODE_MODULES_MARKER.length);
    } else if (posixPath.startsWith(NODE_MODULES_PREFIX)) {
      remainder = posixPath.slice(NODE_MODULES_PREFIX.length);
    } else {
      remainder = posixPath;
    }

    const segments = remainder.split('/');
    const first = segments[0];
    assertInvariant(first !== undefined, 'Expected segment');
    const second = segments[1];
    return second !== undefined && first.startsWith('@')
      ? `${first}/${second}`
      : first;
  };

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
    const posixRelative = toPosixPath(
      nodePath.relative(canonicalBase, realResolvedPath)
    );
    const normResolved = toPosixPath(nodePath.posix.normalize(posixRelative));

    const isAlternativeMatch = (alternative: string): boolean => {
      const normAlt = toPosixPath(nodePath.posix.normalize(alternative));

      if (normAlt === '.' || normAlt === './') {
        return !normResolved.startsWith('../');
      }

      if (
        normResolved === normAlt ||
        normResolved.startsWith(`${normAlt}/`) ||
        normResolved.startsWith(`${normAlt}.`)
      ) {
        return true;
      }

      const altExtension = nodePath.posix.extname(normAlt);
      if (altExtension !== '') {
        const altWithoutExtension = normAlt.slice(0, -altExtension.length);
        const resolvedExtension = nodePath.posix.extname(normResolved);
        if (
          resolvedExtension !== '' &&
          normResolved.slice(0, -resolvedExtension.length) ===
            altWithoutExtension
        ) {
          return true;
        }
      }

      return false;
    };

    if (aliasUsed !== null) {
      const isMatched = aliasAlternatives.some((alt) =>
        isAlternativeMatch(alt)
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
    const isInNodeModules = posixReal.split('/').includes('node_modules');

    if (isInNodeModules) {
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
