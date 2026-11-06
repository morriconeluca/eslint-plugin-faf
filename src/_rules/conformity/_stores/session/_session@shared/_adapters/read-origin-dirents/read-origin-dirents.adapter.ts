import nodeFs from 'node:fs';

export function readOriginDirents(origin: string): readonly nodeFs.Dirent[] {
  try {
    return nodeFs.readdirSync(origin, {
      recursive: true,
      withFileTypes: true,
    });
  } catch {
    return [];
  }
}
