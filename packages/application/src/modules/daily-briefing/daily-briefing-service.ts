import type {
  GetDailyBriefingSnapshotContext,
  GetDailyBriefingSnapshotOptions,
  GetDailyBriefingSnapshotUseCase,
} from './get-daily-briefing-snapshot';

export class DailyBriefingService {
  constructor(
    private readonly getDailyBriefingSnapshotUseCase: GetDailyBriefingSnapshotUseCase,
  ) {}

  getSnapshot(
    context: GetDailyBriefingSnapshotContext,
    options?: GetDailyBriefingSnapshotOptions,
  ) {
    return this.getDailyBriefingSnapshotUseCase.execute(context, options);
  }
}
