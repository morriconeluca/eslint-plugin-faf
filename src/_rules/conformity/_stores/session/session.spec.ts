import { describe, expect, it } from 'vitest';

import { moduleRecordStore } from './_session@shared/_stores/module-record-store/index.js';
import { session } from './index.js';

describe('session', () => {
  it('clears the module record cache owned by the session', () => {
    const producer = moduleRecordStore.wrapProducer(() => ({
      exports: [],
      imports: [],
      language: 'binary',
      symbols: [],
      unsupportedSyntaxes: [],
    }));
    producer('src/a.ts', 'text');
    expect(moduleRecordStore.getAllEntries().size).toBe(1);
    session.clearModuleRecords();
    expect(moduleRecordStore.getAllEntries().size).toBe(0);
  });
});
