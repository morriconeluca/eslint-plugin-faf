import type { TModuleRecord } from '../../../../../../_session@shared/_types/module-record.type.js';
import type { TModuleCollection } from '../../../../_verify-project@shared/_types/_aggregates/module-collection.type.js';
import type { TImportResolution } from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type { TUnorderedModuleCollection } from '../../_collect-modules@shared/_types/_aggregates/collect-modules.type.js';

import { compareOrdinal } from '../../../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { compareUnverifiedOutcomes } from './_utils/compare-unverified-outcomes/index.js';

export function orderModuleCollection(
  input: TUnorderedModuleCollection
): TModuleCollection {
  const recordEntries: [string, TModuleRecord][] = [];
  input.records.forEach((record, key) => {
    recordEntries.push([key, record]);
  });
  recordEntries.sort((left, right) => compareOrdinal(left[0], right[0]));

  const resolutionEntries: [string, readonly TImportResolution[]][] = [];
  input.resolutions.forEach((resolution, key) => {
    resolutionEntries.push([key, resolution]);
  });
  resolutionEntries.sort((left, right) => compareOrdinal(left[0], right[0]));

  const unverifiedOutcomes = [];
  for (const outcome of input.unverifiedOutcomes) {
    unverifiedOutcomes.push(outcome);
  }
  unverifiedOutcomes.sort(compareUnverifiedOutcomes);

  return {
    records: new Map(recordEntries),
    resolutions: new Map(resolutionEntries),
    unverifiedOutcomes,
  };
}
