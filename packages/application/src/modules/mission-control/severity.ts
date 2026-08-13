import type { Clock } from '@synaptria/core';

import type { MissionControlSeverity } from './constants';
import { daysPastDue, isDeeplyOverdue, isDueSoon, isOverdue } from './date-signals';

export function severityForOverdueDueDate(
  plannedEndDate: Date | undefined,
  clock: Clock,
): MissionControlSeverity {
  if (plannedEndDate === undefined || !isOverdue(plannedEndDate, clock)) {
    return 'medium';
  }

  return isDeeplyOverdue(plannedEndDate, clock) ? 'critical' : 'high';
}

export function severityForBlockedTask(
  plannedEndDate: Date | undefined,
  clock: Clock,
): MissionControlSeverity {
  if (plannedEndDate !== undefined && isOverdue(plannedEndDate, clock)) {
    return isDeeplyOverdue(plannedEndDate, clock) ? 'critical' : 'high';
  }

  return 'high';
}

export function severityForDueSoon(): MissionControlSeverity {
  return 'medium';
}

export function severityForRecentActivity(): MissionControlSeverity {
  return 'low';
}

export function projectAttentionSeverity(input: {
  readonly overdueMilestones: number;
  readonly overdueTasks: number;
  readonly blockedTasks: number;
  readonly dueSoonMilestones: number;
  readonly dueSoonTasks: number;
  readonly deeplyOverdueMilestonePresent: boolean;
  readonly deeplyOverdueTaskPresent: boolean;
}): MissionControlSeverity {
  if (
    input.deeplyOverdueMilestonePresent ||
    input.deeplyOverdueTaskPresent ||
    (input.blockedTasks > 0 && input.overdueTasks > 0)
  ) {
    return 'critical';
  }

  if (input.overdueMilestones > 0 || input.overdueTasks > 0 || input.blockedTasks > 0) {
    return 'high';
  }

  if (input.dueSoonMilestones > 0 || input.dueSoonTasks > 0) {
    return 'medium';
  }

  return 'low';
}

export function projectHealthState(input: {
  readonly overdueMilestones: number;
  readonly overdueTasks: number;
  readonly blockedTasks: number;
  readonly dueSoonMilestones: number;
  readonly dueSoonTasks: number;
}): 'at_risk' | 'watch' | 'on_track' {
  if (input.overdueMilestones > 0 || input.overdueTasks > 0 || input.blockedTasks > 0) {
    return 'at_risk';
  }

  if (input.dueSoonMilestones > 0 || input.dueSoonTasks > 0) {
    return 'watch';
  }

  return 'on_track';
}

export { daysPastDue, isDueSoon, isOverdue };
