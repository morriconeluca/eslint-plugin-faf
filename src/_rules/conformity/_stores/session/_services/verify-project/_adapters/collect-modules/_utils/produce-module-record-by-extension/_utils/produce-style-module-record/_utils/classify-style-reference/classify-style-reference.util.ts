import type { TSourceLocation } from '../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TImportSyntaxKind } from '../../../../../../../../../../_session@shared/_types/module-record.type.js';
import type { TClassifiedStyleReference } from './classify-style-reference.type.js';

import {
  EXCLUDED_PREFIXES,
  INTERPOLATION_MARKERS,
  PRESERVED_SPECIFIER_PREFIXES,
  QUOTE_WRAP_PATTERN,
} from './classify-style-reference.constant.js';

export function classifyStyleReference(
  kind: TImportSyntaxKind,
  position: TSourceLocation,
  raw: string
): TClassifiedStyleReference {
  const trimmed = raw.trim();
  const cleaned = trimmed.replace(QUOTE_WRAP_PATTERN, '$2').trim();

  if (cleaned.length === 0) {
    return {};
  }

  const hasInterpolation = INTERPOLATION_MARKERS.some((marker) =>
    cleaned.includes(marker)
  );
  if (hasInterpolation) {
    return {
      importItem: {
        isTypeOnly: false,
        kind,
        position,
        specifier: null,
      },
      unsupportedSyntax: {
        description:
          'Interpolated expressions in stylesheet references are unsupported',
        position,
      },
    };
  }

  if (cleaned.startsWith('#') && !cleaned.startsWith('#/')) {
    return {};
  }

  const lower = cleaned.toLowerCase();
  const isExcluded = EXCLUDED_PREFIXES.some((prefix) =>
    lower.startsWith(prefix)
  );
  if (isExcluded) {
    return {};
  }

  if (cleaned.startsWith('~')) {
    return {
      importItem: {
        isTypeOnly: false,
        kind,
        position,
        specifier: null,
      },
      unsupportedSyntax: {
        description: `Package-relative specifiers (~pkg) in stylesheets are unsupported: '${cleaned}'`,
        position,
      },
    };
  }

  if (cleaned.startsWith('/')) {
    return {
      importItem: {
        isTypeOnly: false,
        kind,
        position,
        specifier: null,
      },
      unsupportedSyntax: {
        description: `Absolute path specifiers (/x) in stylesheets are unsupported: '${cleaned}'`,
        position,
      },
    };
  }

  const isExplicitRelative = PRESERVED_SPECIFIER_PREFIXES.some((prefix) =>
    cleaned.startsWith(prefix)
  );
  const specifier = isExplicitRelative ? cleaned : `./${cleaned}`;

  return {
    importItem: {
      isTypeOnly: false,
      kind,
      position,
      specifier,
    },
  };
}
