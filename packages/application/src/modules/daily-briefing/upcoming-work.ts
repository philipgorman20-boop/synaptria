import type {
  MissionControlMilestoneSignal,
  MissionControlTaskSignal,
} from '../mission-control/types';
import type { DailyBriefingUpcomingItem } from './types';

export function buildDailyBriefingUpcomingWork(input: {
  readonly milestoneSignals: readonly MissionControlMilestoneSignal[];
  readonly taskSignals: readonly MissionControlTaskSignal[];
  readonly limit: number;
}): readonly DailyBriefingUpcomingItem[] {
  const items: DailyBriefingUpcomingItem[] = [];

  for (const signal of input.milestoneSignals) {
    if (signal.dueSoon && !signal.overdue) {
      items.push({
        kind: 'milestone',
        entityId: signal.milestoneId,
        title: signal.milestoneName,
        projectId: signal.projectId,
        projectName: signal.projectName,
        status: signal.status,
        ...(signal.plannedEndDate === undefined
          ? {}
          : { plannedEndDate: signal.plannedEndDate }),
      });
    }
  }

  for (const signal of input.taskSignals) {
    if (signal.dueSoon && !signal.overdue) {
      items.push({
        kind: 'task',
        entityId: signal.taskId,
        title: signal.taskName,
        projectId: signal.projectId,
        projectName: signal.projectName,
        milestoneId: signal.milestoneId,
        milestoneName: signal.milestoneName,
        status: signal.status,
        priority: signal.priority,
        ...(signal.plannedEndDate === undefined
          ? {}
          : { plannedEndDate: signal.plannedEndDate }),
      });
    }
  }

  items.sort((left, right) => {
    const leftDate = left.plannedEndDate ?? '';
    const rightDate = right.plannedEndDate ?? '';
    const byDate = leftDate.localeCompare(rightDate, 'en', { sensitivity: 'base' });
    if (byDate !== 0) {
      return byDate;
    }

    return left.title.localeCompare(right.title, 'en', { sensitivity: 'base' });
  });

  return items.slice(0, input.limit);
}
