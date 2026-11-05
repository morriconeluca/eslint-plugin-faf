/**
 * Public Surface of every Fractal Tree in the project.
 */
export type TPublicSurface = {
  /**
   * Exposed nodes grouped by Fractal Tree origin.
   */
  readonly trees: readonly TTreePublicSurface[];
};

/**
 * Logical Nodes of one Fractal Tree that consumers outside that Tree may import.
 */
export type TTreePublicSurface = {
  /**
   * POSIX paths of the Logical Nodes that form this Tree's Public Surface.
   */
  readonly nodes: readonly string[];

  /**
   * POSIX path of the Fractal Tree origin.
   */
  readonly originPath: string;
};
