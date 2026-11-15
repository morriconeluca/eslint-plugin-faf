import type {
  TFAFConfig,
  TFAFForeignNodeFamily,
} from '../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TReferenceContext,
  TScopeBinding,
} from '../../_validate-config-references@shared/_utils/reference-scope/index.js';

import { createOutcome } from '../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import { referenceScope } from '../../_validate-config-references@shared/_utils/reference-scope/index.js';

export const validateForeignReferences = (() => {
  const rejectForeignDomain = (
    path: string,
    propertyPath: string,
    scope: TScopeBinding,
    context: TReferenceContext
  ): readonly TConfigOutcome[] => {
    const directoryOutcomes = referenceScope.rejectDirectoryInScope({
      context,
      label: 'Foreign domain',
      path,
      propertyPath,
      scope,
    });
    if (!context.ownedOrigins.has(path)) {
      return directoryOutcomes;
    }

    return [
      ...directoryOutcomes,
      createOutcome('configuration/origin-designated-foreign-domain', {
        element: path,
        propertyPath,
      }),
    ];
  };

  const rejectForeignNodeEntry = (
    entry: string | TFAFForeignNodeFamily,
    propertyPath: string,
    scope: TScopeBinding,
    context: TReferenceContext
  ): readonly TConfigOutcome[] => {
    if (typeof entry === 'string') {
      return referenceScope.rejectFileInScope({
        context,
        label: 'Foreign node',
        path: entry,
        propertyPath,
        scope,
      });
    }

    return entry.paths.flatMap((path, index) =>
      referenceScope.rejectDirectoryInScope({
        context,
        label: 'Foreign family path',
        path,
        propertyPath: `${propertyPath}.paths[${index}]`,
        scope,
      })
    );
  };

  const validateForeignSection = (
    domains: readonly string[] | undefined,
    nodes: readonly (string | TFAFForeignNodeFamily)[] | undefined,
    basePath: string,
    scope: TScopeBinding,
    context: TReferenceContext
  ): readonly TConfigOutcome[] => {
    const domainOutcomes = (domains ?? []).flatMap((path, index) =>
      rejectForeignDomain(
        path,
        `${basePath}.foreignDomains[${index}]`,
        scope,
        context
      )
    );
    const nodeOutcomes = (nodes ?? []).flatMap((entry, index) =>
      rejectForeignNodeEntry(
        entry,
        `${basePath}.foreignNodes[${index}]`,
        scope,
        context
      )
    );
    return [...domainOutcomes, ...nodeOutcomes];
  };

  return function validateForeignReferences(
    config: TFAFConfig,
    context: TReferenceContext
  ): readonly TConfigOutcome[] {
    const commonOutcomes = validateForeignSection(
      config.faf.common?.foreignDomains,
      config.faf.common?.foreignNodes,
      'faf.common',
      { kind: 'common' },
      context
    );
    const localOutcomes = config.faf.locals.flatMap((local, localIndex) =>
      validateForeignSection(
        local.foreignDomains,
        local.foreignNodes,
        `faf.locals[${localIndex}]`,
        { kind: 'local', localIndex },
        context
      )
    );
    return [...commonOutcomes, ...localOutcomes];
  };
})();
