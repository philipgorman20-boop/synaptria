import type { GetDailyBriefingSnapshotContext } from '../daily-briefing/get-daily-briefing-snapshot';
import type { DailyBriefingSnapshot } from '../daily-briefing/types';

/** Authorized read context for loading a Daily Briefing snapshot. */
export type DailyBriefingSnapshotReaderContext = GetDailyBriefingSnapshotContext;

/** Minimal application read contract consumed by the Recommendation Engine. */
export interface DailyBriefingSnapshotReader {
  getSnapshot(
    context: DailyBriefingSnapshotReaderContext,
  ): Promise<DailyBriefingSnapshot>;
}
