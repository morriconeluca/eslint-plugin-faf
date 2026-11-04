import { moduleRecordStore } from './_session@shared/_stores/module-record-store/index.js';

export const session = {
  clearModuleRecords(): void {
    moduleRecordStore.clear();
  },
};
