import type {
  GetMissionControlSnapshotContext,
  GetMissionControlSnapshotUseCase,
} from './get-mission-control-snapshot';

/** Application facade consumed by delivery mechanisms such as Next.js. */
export class MissionControlService {
  constructor(
    private readonly getMissionControlSnapshotUseCase: GetMissionControlSnapshotUseCase,
  ) {}

  getSnapshot(context: GetMissionControlSnapshotContext) {
    return this.getMissionControlSnapshotUseCase.execute(context);
  }
}
