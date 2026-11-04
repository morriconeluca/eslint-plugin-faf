import { createFixture } from 'fs-fixture';
import nodeFs from 'node:fs';
import nodePath from 'node:path';
import { describe, expect, it } from 'vitest';

import { readModuleText } from './index.js';

describe('readModuleText', () => {
  it('reads a UTF-8 file and an empty file', async () => {
    const fixture = await createFixture({
      'src/app.ts': 'export const app = 1;\n',
      'src/empty.ts': '',
    });
    try {
      expect(readModuleText(fixture.path, 'src/app.ts')).toEqual({
        status: 'text',
        text: 'export const app = 1;\n',
      });
      expect(readModuleText(fixture.path, 'src/empty.ts')).toEqual({
        status: 'text',
        text: '',
      });
    } finally {
      await fixture.rm();
    }
  });

  it('reports a missing file without throwing', async () => {
    const fixture = await createFixture({});
    try {
      expect(readModuleText(fixture.path, 'src/gone.ts')).toEqual({
        reason: 'File is missing',
        status: 'missing',
      });
    } finally {
      await fixture.rm();
    }
  });

  it('reports a directory in place of a file', async () => {
    const fixture = await createFixture({
      'src/file.ts': {},
    });
    try {
      expect(readModuleText(fixture.path, 'src/file.ts')).toEqual({
        reason: 'Path is a directory',
        status: 'directory',
      });
    } finally {
      await fixture.rm();
    }
  });

  it('reports an unreadable file without throwing', async () => {
    const fixture = await createFixture({
      'src/secret.ts': 'export const secret = 1;\n',
    });
    const absolute = nodePath.join(fixture.path, 'src/secret.ts');
    nodeFs.chmodSync(absolute, 0);
    try {
      const result = readModuleText(fixture.path, 'src/secret.ts');
      expect(result.status).toBe('unreadable');
      if (result.status === 'unreadable') {
        expect(result.reason.length).toBeGreaterThan(0);
      }
    } finally {
      nodeFs.chmodSync(absolute, 0o700);
      await fixture.rm();
    }
  });

  it('reports a non-file path that is not a directory', async () => {
    const fixture = await createFixture({});
    const deviceLink = nodePath.join(fixture.path, 'pipe');
    nodeFs.symlinkSync('/dev/null', deviceLink);
    try {
      expect(readModuleText(fixture.path, 'pipe')).toEqual({
        reason: 'Path is not a regular file',
        status: 'unreadable',
      });
    } finally {
      await fixture.rm();
    }
  });

  it('reports undecodable bytes', async () => {
    const fixture = await createFixture({
      'src/broken.ts': Buffer.from([255, 254, 0]),
    });
    try {
      const result = readModuleText(fixture.path, 'src/broken.ts');
      expect(result.status).toBe('undecodable');
      if (result.status === 'undecodable') {
        expect(result.reason).toContain('Text is not valid UTF-8');
      }
    } finally {
      await fixture.rm();
    }
  });
});
