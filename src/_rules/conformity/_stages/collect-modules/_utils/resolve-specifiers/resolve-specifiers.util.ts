import nodeFs from 'node:fs';
import nodePath from 'node:path';
import { ResolverFactory } from 'oxc-resolver';

import type {
  TEffectivePathAlias,
  TImportResolution,
  TModuleImport,
} from '../../../../_conformity@shared/_types/verification-model.type.js';
import type { TSpecifierResolver } from '../../_collect-modules@shared/_types/collect-modules.type.js';
import type { TCachedResolution } from './resolve-specifiers.type.js';

import { toPosixPath } from '../../../../../../_src@shared/_utils/to-posix-path/index.js';
import { assertInvariant } from '../../../../_conformity@shared/_utils/assert-invariant/index.js';
import { canonicalizeDirectory } from '../../_collect-modules@shared/_utils/canonicalize-directory/index.js';
import {
  CSS_NON_BARE_PREFIXES,
  DISCORDANCE_REASON,
  NODE_MODULES_MARKER,
  NON_LITERAL_DYNAMIC_IMPORT_REASON,
  RELATIVE_OR_ABSOLUTE_PREFIXES,
  RESOLVER_OPTIONS,
} from './_resolve-specifiers@shared/_constants/resolve-specifiers.constant.js';
import { classifyResolutionTarget } from './_utils/classify-resolution-target/index.js';
import { matchPathAlias } from './_utils/match-path-alias/index.js';

export function resolveSpecifiers(
  baseDirectory: string,
  aliases: readonly TEffectivePathAlias[]
): TSpecifierResolver {
  const resolvedBase = nodePath.resolve(baseDirectory);
  const canonicalBase = toPosixPath(canonicalizeDirectory(baseDirectory));

  const tsconfigCandidate = nodePath.join(resolvedBase, 'tsconfig.json');
  const hasTsconfig = nodeFs.existsSync(tsconfigCandidate);
  const tsconfig = hasTsconfig
    ? { configFile: tsconfigCandidate, references: 'auto' as const }
    : undefined;

  const resolver = new ResolverFactory({
    ...RESOLVER_OPTIONS,
    tsconfig,
  });

  const noTsconfigResolver = hasTsconfig
    ? new ResolverFactory(RESOLVER_OPTIONS)
    : null;

  const resolutionCache = new Map<string, TCachedResolution>();

  const toCanonicalPath = (filePath: string): string => {
    try {
      return nodeFs.realpathSync(filePath);
    } catch {
      return filePath;
    }
  };

  const isCandidateForDiscordanceCheck = (
    cleanSpecifier: string,
    aliasUsed: null | string,
    isBuiltin: boolean,
    resolvedPath: string | undefined
  ): boolean => {
    const isContextEligible = hasTsconfig && aliasUsed === null;
    const isBare =
      !cleanSpecifier.startsWith('.') && !cleanSpecifier.startsWith('/');
    const isLocal = !isBuiltin && resolvedPath !== undefined;
    const isOutsideNodeModules =
      resolvedPath !== undefined &&
      !toPosixPath(resolvedPath).includes(NODE_MODULES_MARKER);

    return isContextEligible && isBare && isLocal && isOutsideNodeModules;
  };

  const resolveWithoutTsconfig = (
    directory: string,
    specifier: string
  ): null | string => {
    if (noTsconfigResolver === null) {
      return null;
    }
    try {
      const result = noTsconfigResolver.sync(directory, specifier);
      if (result.path === undefined) {
        return null;
      }
      const cleanPath = result.path.split('?', 1)[0] ?? result.path;
      return toCanonicalPath(cleanPath);
    } catch {
      return null;
    }
  };

  const resolveWithFallback = (
    directory: string,
    specifier: string,
    isBareStyleSpecifier: boolean
  ) => {
    if (!isBareStyleSpecifier) {
      return {
        effectiveSpecifier: specifier,
        result: resolver.sync(directory, specifier),
      };
    }

    const relativeSpecifier = `./${specifier}`;
    const relativeResult = resolver.sync(directory, relativeSpecifier);
    if (relativeResult.path !== undefined) {
      return {
        effectiveSpecifier: relativeSpecifier,
        result: relativeResult,
      };
    }

    return {
      effectiveSpecifier: specifier,
      result: resolver.sync(directory, specifier),
    };
  };

  const acquireCanonicalResult = (
    rawResult: ReturnType<typeof resolver.sync>
  ) => {
    if (rawResult.path === undefined) {
      return rawResult;
    }
    const cleanPath = rawResult.path.split('?', 1)[0] ?? rawResult.path;
    return {
      ...rawResult,
      path: toCanonicalPath(cleanPath),
    };
  };

  const resolveAliasMetadata = (
    cleanSpecifier: string
  ): {
    readonly aliasAlternatives: readonly string[];
    readonly aliasUsed: null | string;
  } => {
    const matchedAlias = matchPathAlias(cleanSpecifier, aliases);
    return {
      aliasAlternatives: matchedAlias?.targets ?? [],
      aliasUsed: matchedAlias?.alias.prefix ?? null,
    };
  };

  const resolveSingle = (
    directory: string,
    specifier: string,
    isBareStyleSpecifier: boolean
  ): TCachedResolution => {
    let fallbackOutcome;
    try {
      fallbackOutcome = resolveWithFallback(
        directory,
        specifier,
        isBareStyleSpecifier
      );
    } catch (error: unknown) {
      assertInvariant(error instanceof Error, 'Expected resolver error');
      return {
        aliasAlternatives: [],
        aliasUsed: null,
        target: {
          reason: error.message,
          type: 'unresolved',
        },
      };
    }

    const { effectiveSpecifier } = fallbackOutcome;
    const effectiveCleanSpecifier =
      effectiveSpecifier.split('?', 1)[0] ?? effectiveSpecifier;
    const { aliasAlternatives, aliasUsed } = resolveAliasMetadata(
      effectiveCleanSpecifier
    );

    const acquiredResolveResult = acquireCanonicalResult(
      fallbackOutcome.result
    );

    const isCandidate = isCandidateForDiscordanceCheck(
      effectiveCleanSpecifier,
      aliasUsed,
      acquiredResolveResult.builtin !== undefined,
      acquiredResolveResult.path
    );

    if (isCandidate) {
      const nonTsconfigPath = resolveWithoutTsconfig(
        directory,
        effectiveSpecifier
      );
      if (
        nonTsconfigPath === null ||
        nonTsconfigPath !== acquiredResolveResult.path
      ) {
        return {
          aliasAlternatives,
          aliasUsed,
          target: {
            reason: DISCORDANCE_REASON,
            type: 'unresolved',
          },
        };
      }
    }

    const target = classifyResolutionTarget({
      aliasAlternatives,
      aliasUsed,
      canonicalBase,
      resolveResult: acquiredResolveResult,
      specifier: effectiveSpecifier,
    });

    return {
      aliasAlternatives,
      aliasUsed,
      target,
    };
  };

  return (
    sourcePath: string,
    imports: readonly TModuleImport[]
  ): readonly TImportResolution[] => {
    const posixInputSource = toPosixPath(sourcePath);
    const resolvedSourceFile = nodePath.resolve(resolvedBase, posixInputSource);
    const directory = nodePath.dirname(resolvedSourceFile);
    const relativeSource = nodePath.relative(resolvedBase, resolvedSourceFile);
    const posixSourcePath = toPosixPath(relativeSource);

    const resolutions: TImportResolution[] = [];

    for (const [index, importItem] of imports.entries()) {
      if (importItem.specifier === null) {
        resolutions.push({
          aliasAlternatives: [],
          aliasUsed: null,
          importIndex: index,
          sourcePath: posixSourcePath,
          target: {
            reason: NON_LITERAL_DYNAMIC_IMPORT_REASON,
            type: 'unresolved',
          },
        });
      } else {
        const rawSpecifier = importItem.specifier;
        const isUnprefixedReferencePath =
          importItem.kind === 'typescript-reference-path' &&
          RELATIVE_OR_ABSOLUTE_PREFIXES.every(
            (prefix) => !rawSpecifier.startsWith(prefix)
          );
        const resolutionSpecifier = isUnprefixedReferencePath
          ? `./${rawSpecifier}`
          : rawSpecifier;
        const isStyleImport =
          importItem.kind === 'css-at-import' || importItem.kind === 'css-url';
        const isBareStyleSpecifier =
          isStyleImport &&
          CSS_NON_BARE_PREFIXES.every(
            (prefix) => !rawSpecifier.startsWith(prefix)
          );
        const cacheKey = `${directory}\0${resolutionSpecifier}\0${String(isBareStyleSpecifier)}`;
        let cached = resolutionCache.get(cacheKey);

        if (cached === undefined) {
          cached = resolveSingle(
            directory,
            resolutionSpecifier,
            isBareStyleSpecifier
          );
          resolutionCache.set(cacheKey, cached);
        }

        resolutions.push({
          aliasAlternatives: cached.aliasAlternatives,
          aliasUsed: cached.aliasUsed,
          importIndex: index,
          sourcePath: posixSourcePath,
          target: cached.target,
        });
      }
    }

    return resolutions;
  };
}
