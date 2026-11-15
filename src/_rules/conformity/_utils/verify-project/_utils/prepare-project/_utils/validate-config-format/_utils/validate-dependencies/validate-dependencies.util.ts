import type { ZodError } from 'zod';

import type { TConfigOutcome } from '../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';

import { collectStringDuplicates } from '../../_validate-config-format@shared/_utils/collect-string-duplicates/index.js';
import { translateConfigIssues } from '../../_validate-config-format@shared/_utils/config-diagnostic-codec/index.js';
import { dependenciesSchema } from './validate-dependencies.schema.js';

export const validateDependencies = (() => {
  type TSchema = {
    safeParse: (
      value: unknown
    ) => { error: ZodError; success: false } | { success: true };
  };

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

  const parseProperty = (
    schema: TSchema,
    value: unknown,
    propertyPath: string
  ): readonly TConfigOutcome[] => {
    const parsed = schema.safeParse(value);
    return parsed.success
      ? []
      : translateConfigIssues(parsed.error.issues, value, propertyPath);
  };

  const pathDuplicates = (
    paths: unknown,
    pathsPath: string
  ): readonly TConfigOutcome[] =>
    Array.isArray(paths)
      ? collectStringDuplicates(
          paths,
          new Set<string>(),
          (index) => `${pathsPath}[${index}]`,
          'configuration/duplicate-element'
        )
      : [];

  const pairDuplicates = (
    pairs: unknown,
    listPath: string
  ): readonly TConfigOutcome[] => {
    if (!Array.isArray(pairs)) {
      return [];
    }
    const outcomes: TConfigOutcome[] = [];
    for (const [index, pair] of pairs.entries()) {
      if (!isRecord(pair)) {
        continue;
      }
      const pairPath = `${listPath}[${index}]`;
      outcomes.push(
        ...pathDuplicates(pair['from'], `${pairPath}.from`),
        ...pathDuplicates(pair['to'], `${pairPath}.to`)
      );
    }
    return outcomes;
  };

  const readList = (
    config: Record<string, unknown>,
    key: string,
    schema: TSchema,
    basePath: string,
    duplicates: (
      value: unknown,
      propertyPath: string
    ) => readonly TConfigOutcome[]
  ): readonly TConfigOutcome[] => {
    if (!Object.hasOwn(config, key) || config[key] === undefined) {
      return [];
    }
    const propertyPath = `${basePath}.${key}`;
    return [
      ...parseProperty(schema, config[key], propertyPath),
      ...duplicates(config[key], propertyPath),
    ];
  };

  return function validateDependencies(
    config: Record<string, unknown>,
    basePath: string
  ): readonly TConfigOutcome[] {
    return [
      ...readList(
        config,
        'publicRootNodes',
        dependenciesSchema.publicRootNodes,
        basePath,
        pathDuplicates
      ),
      ...readList(
        config,
        'treeDependencies',
        dependenciesSchema.pairs,
        basePath,
        pairDuplicates
      ),
      ...readList(
        config,
        'externalDependencies',
        dependenciesSchema.pairs,
        basePath,
        pairDuplicates
      ),
    ];
  };
})();
