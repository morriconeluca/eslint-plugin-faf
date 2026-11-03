/**
 * Metadata capturing imported binding provenance used to resolve export origins.
 */
export type TImportedBinding = {
  /**
   * Name of the binding as originally exported from the foreign module.
   */
  readonly importedName: string;

  /**
   * Flag indicating whether the import binds a namespace object (* as ns).
   */
  readonly isNamespace: boolean;

  /**
   * Flag indicating whether the import participates exclusively in type space.
   */
  readonly isTypeOnly: boolean;

  /**
   * Identifier name through which the binding is accessible locally.
   */
  readonly localName: string;

  /**
   * Target module specifier string providing the imported binding.
   */
  readonly specifier: string;
};
