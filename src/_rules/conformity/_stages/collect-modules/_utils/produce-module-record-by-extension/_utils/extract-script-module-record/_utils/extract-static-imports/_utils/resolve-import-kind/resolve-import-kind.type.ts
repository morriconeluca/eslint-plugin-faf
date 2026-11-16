import type { TImportSyntaxKind } from '../../../../../../../../../../_conformity@shared/_types/verification-model.type.js';

/**
 * Result of analyzing the structural syntax kind of an import declaration.
 */
export type TResolvedImportKind = {
  /**
   * Whether the import declaration represents an exclusively type-level import.
   */
  readonly isTypeOnly: boolean;

  /**
   * Specific syntactic form classification of the import statement.
   */
  readonly kind: TImportSyntaxKind;
};
