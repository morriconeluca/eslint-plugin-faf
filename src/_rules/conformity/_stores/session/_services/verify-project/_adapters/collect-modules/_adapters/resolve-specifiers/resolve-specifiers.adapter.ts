import nodeFs from 'node:fs';
import nodePath from 'node:path';
import { ResolverFactory } from 'oxc-resolver';

import type { TModuleImport } from '../../../../../../_session@shared/_types/module-record.type.js';
import type { TImportResolution } from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type { TEffectivePathAlias } from '../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type { TSpecifierResolver } from '../../_collect-modules@shared/_types/_compounds/specifier-resolver.type.js';
import type { TCachedResolution } from './resolve-specifiers.type.js';

import { toPosixPath } from '../../../../../../_session@shared/_utils/to-posix-path/index.js';
import { assertInvariant } from '../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import { canonicalizeDirectory } from '../../_collect-modules@shared/_adapters/canonicalize-directory/index.js';
import {
  DISCORDANCE_REASON,
  NODE_MODULES_MARKER,
  NON_LITERAL_DYNAMIC_IMPORT_REASON,
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

  const resolverOptions = {
    builtinModules: true,
    conditionNames: ['import', 'require', 'node', 'types', 'style', 'default'],
    extensionAlias: {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js'],
      '.jsx': ['.tsx', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    },
    extensions: [
      '.ts',
      '.tsx',
      '.mts',
      '.cts',
      '.js',
      '.jsx',
      '.mjs',
      '.cjs',
      '.json',
      '.css',
    ],
    importsFields: [['imports']],
  };

  const resolver = new ResolverFactory({
    ...resolverOptions,
    tsconfig,
  });

  const noTsconfigResolver = hasTsconfig
    ? new ResolverFactory(resolverOptions)
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
    hasUsedRelativeFallback: boolean,
    isBuiltin: boolean,
    resolvedPath: string | undefined
  ): boolean => {
    const isContextEligible =
      hasTsconfig && aliasUsed === null && !hasUsedRelativeFallback;
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
    canFallbackToBare: boolean
  ) => {
    let result = resolver.sync(directory, specifier);
    if (
      canFallbackToBare &&
      result.path === undefined &&
      specifier.startsWith('./')
    ) {
      result = resolver.sync(directory, specifier.slice(2));
      return { hasUsedFallback: true, result };
    }
    return { hasUsedFallback: false, result };
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

  const resolveSingle = (
    directory: string,
    specifier: string,
    canFallbackToBare: boolean
  ): TCachedResolution => {
    const cleanSpecifier = specifier.split('?', 1)[0] ?? specifier;
    const matchedAlias = matchPathAlias(cleanSpecifier, aliases);
    const aliasUsed = matchedAlias?.alias.prefix ?? null;
    const aliasAlternatives = matchedAlias?.targets ?? [];

    let fallbackOutcome;
    try {
      fallbackOutcome = resolveWithFallback(
        directory,
        specifier,
        canFallbackToBare
      );
    } catch (error: unknown) {
      assertInvariant(error instanceof Error, 'Expected resolver error');
      return {
        aliasAlternatives,
        aliasUsed,
        target: {
          reason: error.message,
          type: 'unresolved',
        },
      };
    }

    const acquiredResolveResult = acquireCanonicalResult(
      fallbackOutcome.result
    );

    const isCandidate = isCandidateForDiscordanceCheck(
      cleanSpecifier,
      aliasUsed,
      fallbackOutcome.hasUsedFallback,
      acquiredResolveResult.builtin !== undefined,
      acquiredResolveResult.path
    );

    if (isCandidate) {
      const nonTsconfigPath = resolveWithoutTsconfig(directory, specifier);
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
      specifier,
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
        const canFallbackToBare =
          importItem.kind === 'css-at-import' || importItem.kind === 'css-url';
        const cacheKey = `${directory}\0${importItem.specifier}\0${String(canFallbackToBare)}`;
        let cached = resolutionCache.get(cacheKey);

        if (cached === undefined) {
          cached = resolveSingle(
            directory,
            importItem.specifier,
            canFallbackToBare
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
