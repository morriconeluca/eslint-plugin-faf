/**
 * Description of an imported binding tracked for re-export analysis.
 */
export type TImportedBinding = {
  /**
   * Name of the exported member imported from the target module.
   */
  readonly importedName: string;

  /**
   * Whether the import represents an entire module namespace.
   */
  readonly isNamespace: boolean;

  /**
   * Whether the import binding is exclusively a type reference.
   */
  readonly isTypeOnly: boolean;

  /**
   * Local identifier bound to the imported symbol in the current scope.
   */
  readonly localName: string;

  /**
   * Module specifier string referenced by the import statement.
   */
  readonly specifier: string;
};
