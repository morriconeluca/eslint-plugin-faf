import type { ZodError } from 'zod';

import type { TConfigOutcome } from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { createOutcome } from '../../../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { compileForeignPattern } from '../../../../../../_verify-project@shared/_utils/compile-foreign-pattern/index.js';
import { collectStringDuplicates } from '../../_validate-config-format@shared/_utils/collect-string-duplicates/index.js';
import { translateConfigIssues } from '../../_validate-config-format@shared/_utils/translate-config-issues/index.js';
import { foreignNodesSchema } from './_schemas/foreign-nodes-schema/index.js';

export const validateForeignNodes = (() => {
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

  const patternOutcomes = (
    patterns: unknown,
    patternsPath: string
  ): readonly TConfigOutcome[] => {
    if (!Array.isArray(patterns)) {
      return [];
    }
    const outcomes: TConfigOutcome[] = [
      ...collectStringDuplicates(
        patterns,
        new Set<string>(),
        (index) => `${patternsPath}[${index}]`,
        'configuration/duplicate-element'
      ),
    ];
    for (const [index, pattern] of patterns.entries()) {
      if (
        typeof pattern === 'string' &&
        pattern.length > 0 &&
        !compileForeignPattern(pattern).ok
      ) {
        outcomes.push(
          createOutcome('configuration/invalid-foreign-pattern', {
            propertyPath: `${patternsPath}[${index}]`,
          })
        );
      }
    }
    return outcomes;
  };

  const familyOutcomes = (
    nodes: unknown,
    nodesPath: string
  ): readonly TConfigOutcome[] => {
    if (!Array.isArray(nodes)) {
      return [];
    }
    const outcomes: TConfigOutcome[] = [];
    for (const [index, item] of nodes.entries()) {
      if (!isRecord(item)) {
        continue;
      }

      const itemPath = `${nodesPath}[${index}]`;
      outcomes.push(
        ...pathDuplicates(item['paths'], `${itemPath}.paths`),
        ...patternOutcomes(item['patterns'], `${itemPath}.patterns`)
      );
    }
    return outcomes;
  };

  return function validateForeignNodes(
    config: Record<string, unknown>,
    basePath: string
  ): readonly TConfigOutcome[] {
    const outcomes: TConfigOutcome[] = [];
    if (config['foreignDomains'] !== undefined) {
      const domainsPath = `${basePath}.foreignDomains`;
      outcomes.push(
        ...parseProperty(
          foreignNodesSchema.domains,
          config['foreignDomains'],
          domainsPath
        ),
        ...pathDuplicates(config['foreignDomains'], domainsPath)
      );
    }
    if (config['foreignNodes'] !== undefined) {
      const nodesPath = `${basePath}.foreignNodes`;
      const nodes = config['foreignNodes'];
      outcomes.push(
        ...parseProperty(foreignNodesSchema.nodes, nodes, nodesPath),
        ...pathDuplicates(nodes, nodesPath),
        ...familyOutcomes(nodes, nodesPath)
      );
    }
    return outcomes;
  };
})();
