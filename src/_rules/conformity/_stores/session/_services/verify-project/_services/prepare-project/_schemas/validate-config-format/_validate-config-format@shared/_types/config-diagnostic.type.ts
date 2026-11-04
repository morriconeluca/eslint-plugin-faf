/**
 * Diagnostic that distinguishes a missing key, explicit undefined, an empty tuple, and a wrong type.
 */
export type TAbsentDiagnostic = {
  /**
   * Outcome used when a non-empty tuple schema sees an empty array.
   */
  readonly emptyList: null | TFixedDiagnostic;

  /**
   * Outcome used when the key is present and its value is undefined.
   */
  readonly explicit: TFixedDiagnostic;

  /**
   * Outcome used when the value has the wrong type.
   */
  readonly invalid: TFixedDiagnostic;

  /**
   * Discriminant for absence-sensitive diagnostics.
   */
  readonly kind: 'absent';

  /**
   * Outcome used when a required key is not present.
   */
  readonly missing: TFixedDiagnostic;
};

/**
 * Payload encoded into a Zod issue message and decoded by the translator.
 */
export type TConfigDiagnostic =
  | TAbsentDiagnostic
  | TFixedDiagnostic
  | TKeyDiagnostic;

/**
 * Fixed configuration diagnostic carried inside a Zod issue message.
 */
export type TFixedDiagnostic = {
  /**
   * Constraint identifier preserved from the hand-written validator contract.
   */
  readonly constraint: `configuration/${string}`;

  /**
   * Discriminant for a diagnostic whose text does not depend on absence.
   */
  readonly kind: 'fixed';

  /**
   * Human-readable diagnostic text. `{path}` and `{key}` are filled by the translator.
   */
  readonly message: string;

  /**
   * Normative reference preserved from the hand-written validator contract.
   */
  readonly normativeReference: string;
};

/**
 * Diagnostic expanded once per unrecognized object key.
 */
export type TKeyDiagnostic = {
  /**
   * Constraint identifier for every unrecognized key.
   */
  readonly constraint: `configuration/${string}`;

  /**
   * Discriminant for unrecognized-key expansion.
   */
  readonly kind: 'keys';

  /**
   * Message family selected by the object that owns the key.
   */
  readonly messageStyle: 'faf' | 'plain' | 'root' | 'sub-graph';

  /**
   * Normative reference preserved from the hand-written validator contract.
   */
  readonly normativeReference: string;
};
