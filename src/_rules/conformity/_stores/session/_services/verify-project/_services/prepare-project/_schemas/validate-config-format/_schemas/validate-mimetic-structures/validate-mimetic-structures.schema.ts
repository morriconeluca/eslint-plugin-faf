import { z } from 'zod';

import type { TConfigOutcome } from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { collectStringDuplicates } from '../../_validate-config-format@shared/_schemas/collect-string-duplicates/index.js';
import { formFields } from '../../_validate-config-format@shared/_schemas/form-fields/index.js';
import { translateConfigIssues } from '../../_validate-config-format@shared/_schemas/translate-config-issues/index.js';
import { mimeticStructuresSchema } from './_schemas/mimetic-structures-schema/index.js';
import { isKebabCase } from './_utils/is-kebab-case/index.js';

export const validateMimeticStructures = (() => {
  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

  const actionGrammar = z.string().superRefine((value, context) => {
    if (!isKebabCase(value)) {
      context.addIssue({
        code: 'custom',
        message: formFields.fixed(
          'configuration/invalid-action-name',
          'CONFIG_8',
          `Action "${value}" must be in kebab-case.`
        ),
      });
    }
  });

  const actionOutcomes = (
    actions: unknown,
    actionsPath: string
  ): readonly TConfigOutcome[] => {
    if (!Array.isArray(actions)) {
      return [];
    }
    const outcomes: TConfigOutcome[] = [];
    for (const [index, action] of actions.entries()) {
      if (typeof action !== 'string' || action.length === 0) {
        continue;
      }
      const parsed = actionGrammar.safeParse(action);
      if (!parsed.success) {
        outcomes.push(
          ...translateConfigIssues(
            parsed.error.issues,
            action,
            `${actionsPath}[${index}]`
          )
        );
      }
    }
    return outcomes;
  };

  const listDuplicates = (
    items: unknown,
    listPath: string,
    seen: Set<string>,
    message: (value: string) => string,
    normativeReference: string,
    constraint: `configuration/${string}`
  ): readonly TConfigOutcome[] =>
    Array.isArray(items)
      ? collectStringDuplicates(
          items,
          seen,
          (index) => `${listPath}[${index}]`,
          message,
          normativeReference,
          constraint
        )
      : [];

  return function validateMimeticStructures(
    mimeticStructures: unknown,
    basePath: string
  ): readonly TConfigOutcome[] {
    if (mimeticStructures === undefined) {
      return [];
    }
    const propertyPath = `${basePath}.mimeticPathStructures`;
    const parsed = mimeticStructuresSchema.safeParse(mimeticStructures);
    const outcomes: TConfigOutcome[] = parsed.success
      ? []
      : [
          ...translateConfigIssues(
            parsed.error.issues,
            mimeticStructures,
            propertyPath
          ),
        ];
    if (!Array.isArray(mimeticStructures)) {
      return outcomes;
    }
    const seenPaths = new Set<string>();
    for (const [index, item] of mimeticStructures.entries()) {
      if (!isRecord(item)) {
        continue;
      }
      const itemPath = `${propertyPath}[${index}]`;
      outcomes.push(
        ...listDuplicates(
          item['paths'],
          `${itemPath}.paths`,
          new Set<string>(),
          (value) => `Duplicate path "${value}".`,
          'CONFIG_2',
          'configuration/duplicate-element'
        ),
        ...listDuplicates(
          item['paths'],
          `${itemPath}.paths`,
          seenPaths,
          (value) =>
            `Path "${value}" is declared in multiple mimetic path structures.`,
          'CONFIG_8',
          'configuration/duplicate-mimetic-path'
        ),
        ...listDuplicates(
          item['actions'],
          `${itemPath}.actions`,
          new Set<string>(),
          (value) => `Duplicate action "${value}".`,
          'CONFIG_8',
          'configuration/duplicate-element'
        ),
        ...actionOutcomes(item['actions'], `${itemPath}.actions`)
      );
    }
    return outcomes;
  };
})();
