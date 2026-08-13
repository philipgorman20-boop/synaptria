import type { Milestone } from '@synaptria/domain/milestones';
import type { Project } from '@synaptria/domain/projects';
import type { Task } from '@synaptria/domain/tasks';

import type {
  MissionControlAttentionItem,
  MissionControlMilestoneSignal,
  MissionControlProjectHealth,
  MissionControlRecentActivityItem,
  MissionControlTaskSignal,
} from './types';

const SEVERITY_ORDER = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
} as const;

const ATTENTION_TYPE_ORDER = {
  overdue_task: 0,
  overdue_milestone: 1,
  blocked_task: 2,
  task_due_soon: 3,
  milestone_due_soon: 4,
  recent_significant_activity: 5,
} as const;

export function compareProjectsByNameThenId(left: Project, right: Project): number {
  const byName = left.name.localeCompare(right.name, 'en', { sensitivity: 'base' });
  if (byName !== 0) {
    return byName;
  }

  return left.id.localeCompare(right.id, 'en', { sensitivity: 'base' });
}

export function compareMilestonesByNameThenId(
  left: Milestone,
  right: Milestone,
): number {
  const byName = left.name.localeCompare(right.name, 'en', { sensitivity: 'base' });
  if (byName !== 0) {
    return byName;
  }

  return left.id.localeCompare(right.id, 'en', { sensitivity: 'base' });
}

export function compareTasksForAttention(left: Task, right: Task): number {
  const byPlannedEnd = compareOptionalIsoDates(
    left.plannedEndDate?.toISOString(),
    right.plannedEndDate?.toISOString(),
  );
  if (byPlannedEnd !== 0) {
    return byPlannedEnd;
  }

  const byName = left.name.localeCompare(right.name, 'en', { sensitivity: 'base' });
  if (byName !== 0) {
    return byName;
  }

  return left.id.localeCompare(right.id, 'en', { sensitivity: 'base' });
}

export function sortAttentionItems(
  items: readonly MissionControlAttentionItem[],
): readonly MissionControlAttentionItem[] {
  return [...items].sort((left, right) => {
    const bySeverity = SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity];
    if (bySeverity !== 0) {
      return bySeverity;
    }

    const byType =
      ATTENTION_TYPE_ORDER[left.type] - ATTENTION_TYPE_ORDER[right.type];
    if (byType !== 0) {
      return byType;
    }

    const byDueDate = compareOptionalIsoDates(left.dueDate, right.dueDate);
    if (byDueDate !== 0) {
      return byDueDate;
    }

    const byTitle = left.title.localeCompare(right.title, 'en', { sensitivity: 'base' });
    if (byTitle !== 0) {
      return byTitle;
    }

    return left.entity.entityId.localeCompare(right.entity.entityId, 'en', {
      sensitivity: 'base',
    });
  });
}

export function sortProjectHealth(
  items: readonly MissionControlProjectHealth[],
): readonly MissionControlProjectHealth[] {
  return [...items].sort((left, right) => {
    const bySeverity =
      SEVERITY_ORDER[left.attentionSeverity] - SEVERITY_ORDER[right.attentionSeverity];
    if (bySeverity !== 0) {
      return bySeverity;
    }

    const byName = left.projectName.localeCompare(right.projectName, 'en', {
      sensitivity: 'base',
    });
    if (byName !== 0) {
      return byName;
    }

    return left.projectId.localeCompare(right.projectId, 'en', { sensitivity: 'base' });
  });
}

export function sortMilestoneSignals(
  items: readonly MissionControlMilestoneSignal[],
): readonly MissionControlMilestoneSignal[] {
  return [...items].sort((left, right) => {
    const byOverdue = Number(right.overdue) - Number(left.overdue);
    if (byOverdue !== 0) {
      return byOverdue;
    }

    const byDueSoon = Number(right.dueSoon) - Number(left.dueSoon);
    if (byDueSoon !== 0) {
      return byDueSoon;
    }

    const byPlannedEnd = compareOptionalIsoDates(
      left.plannedEndDate,
      right.plannedEndDate,
    );
    if (byPlannedEnd !== 0) {
      return byPlannedEnd;
    }

    const byName = left.milestoneName.localeCompare(right.milestoneName, 'en', {
      sensitivity: 'base',
    });
    if (byName !== 0) {
      return byName;
    }

    return left.milestoneId.localeCompare(right.milestoneId, 'en', {
      sensitivity: 'base',
    });
  });
}

export function sortTaskSignals(
  items: readonly MissionControlTaskSignal[],
): readonly MissionControlTaskSignal[] {
  return [...items].sort((left, right) => {
    const byOverdue = Number(right.overdue) - Number(left.overdue);
    if (byOverdue !== 0) {
      return byOverdue;
    }

    const byBlocked = Number(right.blocked) - Number(left.blocked);
    if (byBlocked !== 0) {
      return byBlocked;
    }

    const byDueSoon = Number(right.dueSoon) - Number(left.dueSoon);
    if (byDueSoon !== 0) {
      return byDueSoon;
    }

    const byPlannedEnd = compareOptionalIsoDates(
      left.plannedEndDate,
      right.plannedEndDate,
    );
    if (byPlannedEnd !== 0) {
      return byPlannedEnd;
    }

    const byName = left.taskName.localeCompare(right.taskName, 'en', {
      sensitivity: 'base',
    });
    if (byName !== 0) {
      return byName;
    }

    return left.taskId.localeCompare(right.taskId, 'en', { sensitivity: 'base' });
  });
}

export function sortRecentActivity(
  items: readonly MissionControlRecentActivityItem[],
): readonly MissionControlRecentActivityItem[] {
  return [...items].sort((left, right) => {
    const byOccurredAt = right.occurredAt.localeCompare(left.occurredAt, 'en', {
      sensitivity: 'base',
    });
    if (byOccurredAt !== 0) {
      return byOccurredAt;
    }

    return left.eventId.localeCompare(right.eventId, 'en', { sensitivity: 'base' });
  });
}

function compareOptionalIsoDates(
  left: string | undefined,
  right: string | undefined,
): number {
  if (left === undefined && right === undefined) {
    return 0;
  }

  if (left === undefined) {
    return 1;
  }

  if (right === undefined) {
    return -1;
  }

  return left.localeCompare(right, 'en', { sensitivity: 'base' });
}
