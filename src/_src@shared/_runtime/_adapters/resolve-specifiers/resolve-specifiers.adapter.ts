import nodeFs from 'node:fs';
import nodePath from 'node:path';
import { ResolverFactory } from 'oxc-resolver';

import type { TEffectivePathAlias } from '../../../_declarations/_types/declarations.type.js';
import type { TImportResolution } from '../../../_graph/_types/dependency-graph.type.js';
import type { TModuleImport } from '../../../_syntax/_types/module-record.type.js';
import type {
  TCachedResolution,
  TSpecifierResolver,
} from './resolve-specifiers.type.js';

import { matchPathAlias } from '../../../_declarations/_utils/match-path-alias/index.js';
import { assertInvariant } from '../../../_domain/_utils/assert-invariant/index.js';
import { toPosixPath } from '../../../_domain/_utils/to-posix-path/index.js';
import { NON_LITERAL_DYNAMIC_IMPORT_REASON } from './_resolve-specifiers@shared/_constants/resolve-specifiers.constant.js';
import { classifyResolutionTarget } from './_utils/classify-resolution-target/index.js';

export function resolveSpecifiers(
  baseDirectory: string,
  aliases: readonly TEffectivePathAlias[]
): TSpecifierResolver {
  const resolvedBase = nodePath.resolve(baseDirectory);
  const canonicalBase = toPosixPath(
    nodeFs.existsSync(resolvedBase)
      ? nodeFs.realpathSync(resolvedBase)
      : resolvedBase
  );

  const tsconfigCandidate = nodePath.join(resolvedBase, 'tsconfig.json');
  const hasTsconfig = nodeFs.existsSync(tsconfigCandidate);
  const tsconfig = hasTsconfig
    ? { configFile: tsconfigCandidate, references: 'auto' as const }
    : undefined;

  const resolver = new ResolverFactory({
    builtinModules: true,
    conditionNames: ['import', 'require', 'node', 'types', 'default'],
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
    tsconfig,
  });

  const resolutionCache = new Map<string, TCachedResolution>();

  const toCanonicalPath = (filePath: string): string => {
    try {
      return nodeFs.realpathSync(filePath);
    } catch {
      return filePath;
    }
  };

  const resolveSingle = (
    directory: string,
    specifier: string
  ): TCachedResolution => {
    const matchedAlias = matchPathAlias(specifier, aliases);
    const aliasUsed = matchedAlias?.alias.prefix ?? null;
    const aliasAlternatives = matchedAlias?.targets ?? [];

    let resolveResult;
    try {
      resolveResult = resolver.sync(directory, specifier);
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

    const acquiredResolveResult =
      resolveResult.path === undefined
        ? resolveResult
        : {
            ...resolveResult,
            path: toCanonicalPath(resolveResult.path),
          };

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
        const cacheKey = `${directory}\0${importItem.specifier}`;
        let cached = resolutionCache.get(cacheKey);

        if (cached === undefined) {
          cached = resolveSingle(directory, importItem.specifier);
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
