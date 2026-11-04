import type {
  TModuleImport,
  TUnsupportedSyntax,
} from '../../../../../../../../../../_session@shared/_types/module-record.type.js';

/**
 * Result of classifying and normalizing an extracted stylesheet reference.
 */
export type TClassifiedStyleReference = {
  /**
   * Module import record if the reference represents a valid codebase or non-literal import.
   */
  readonly importItem?: TModuleImport;

  /**
   * Unsupported syntax record if the reference uses unanalyzable syntax.
   */
  readonly unsupportedSyntax?: TUnsupportedSyntax;
};
