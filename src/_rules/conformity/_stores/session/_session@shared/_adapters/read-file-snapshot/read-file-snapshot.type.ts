/**
 * Disk snapshot used to detect stale configuration and source overlays.
 */
export type TFileSnapshot =
  | {
      /**
       * Discriminant for a path that cannot be read as a regular file.
       */
      readonly present: false;
    }
  | {
      /**
       * Modification time in milliseconds since the Unix epoch.
       */
      readonly mtimeMs: number;

      /**
       * Discriminant for a readable regular file.
       */
      readonly present: true;

      /**
       * File size in bytes.
       */
      readonly size: number;

      /**
       * UTF-8 text of the file.
       */
      readonly text: string;
    };
