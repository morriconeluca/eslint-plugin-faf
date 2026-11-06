/**
 * Observed facts provided to assemble diagnostic outcome message strings.
 */
export type TFormatFacts = {
  /**
   * Real chain of dependency paths demonstrating transitively reached targets.
   */
  readonly chain?: readonly string[];

  /**
   * Ordered sequence of cycle path segments demonstrating graph circularity.
   */
  readonly cycle?: readonly (readonly string[])[];

  /**
   * Optional observed defect detail expanding the predicate.
   */
  readonly detail?: null | string;

  /**
   * Affected element codebase path or identifier.
   */
  readonly element?: string;

  /**
   * Originating source file path for dependency relations.
   */
  readonly from?: string;

  /**
   * Configuration property path for configuration diagnostics.
   */
  readonly propertyPath?: string;

  /**
   * Verbatim import specifier string written in source code.
   */
  readonly specifier?: string;

  /**
   * Target destination resolved path or package name for dependency relations.
   */
  readonly to?: string;
};
