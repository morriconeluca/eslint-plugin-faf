import { z } from 'zod';

import type {
  TConfigConstraint,
  TConfigOutcome,
} from '../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';

import { collectStringDuplicates } from '../../_validate-config-format@shared/_utils/collect-string-duplicates/index.js';
import {
  formFields,
  translateConfigIssues,
} from '../../_validate-config-format@shared/_utils/config-diagnostic-codec/index.js';
import { isKebabCase } from './_utils/is-kebab-case/index.js';
import { mimeticStructuresSchema } from './validate-mimetic-structures.schema.js';

export const validateMimeticStructures = (() => {
  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

  const actionGrammar = z.string().superRefine((value, context) => {
    if (!isKebabCase(value)) {
      context.addIssue({
        code: 'custom',
        message: formFields.fixed('configuration/invalid-action-name'),
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
    constraint: TConfigConstraint
  ): readonly TConfigOutcome[] =>
    Array.isArray(items)
      ? collectStringDuplicates(
          items,
          seen,
          (index) => `${listPath}[${index}]`,
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
          'configuration/duplicate-element'
        ),
        ...listDuplicates(
          item['paths'],
          `${itemPath}.paths`,
          seenPaths,
          'configuration/duplicate-mimetic-path'
        ),
        ...listDuplicates(
          item['actions'],
          `${itemPath}.actions`,
          new Set<string>(),
          'configuration/duplicate-element'
        ),
        ...actionOutcomes(item['actions'], `${itemPath}.actions`)
      );
    }
    return outcomes;
  };
})();
