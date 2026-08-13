import type { Clock } from '@synaptria/core';
import type { DomainEventEnvelope } from '@synaptria/events';
import type { Milestone } from '@synaptria/domain/milestones';
import type { Project } from '@synaptria/domain/projects';
import type { Task } from '@synaptria/domain/tasks';

import type { MissionControlAttentionItem } from './types';
import { toIsoDate, isDueSoon, isOverdue } from './date-signals';
import {
  isBlockedTask,
  isOpenMilestone,
  isOpenTask,
} from './entity-classifiers';
import {
  severityForBlockedTask,
  severityForDueSoon,
  severityForOverdueDueDate,
  severityForRecentActivity,
} from './severity';

export function buildAttentionItems(input: {
  readonly milestones: readonly Milestone[];
  readonly tasks: readonly Task[];
  readonly projectsById: ReadonlyMap<string, Project>;
  readonly milestonesById: ReadonlyMap<string, Milestone>;
  readonly recentEvents: readonly DomainEventEnvelope[];
  readonly clock: Clock;
}): readonly MissionControlAttentionItem[] {
  const items: MissionControlAttentionItem[] = [];

  for (const milestone of input.milestones) {
    if (!isOpenMilestone(milestone)) {
      continue;
    }

    const project = input.projectsById.get(milestone.projectId);
    const projectName = project?.name ?? milestone.projectId;

    if (isOverdue(milestone.plannedEndDate, input.clock)) {
      items.push({
        type: 'overdue_milestone',
        severity: severityForOverdueDueDate(milestone.plannedEndDate, input.clock),
        entity: { entityType: 'Milestone', entityId: milestone.id },
        title: milestone.name,
        reason: `Milestone is overdue for project ${projectName}.`,
        ...(milestone.plannedEndDate === undefined
          ? {}
          : { dueDate: toIsoDate(milestone.plannedEndDate) }),
        projectId: milestone.projectId,
      });
      continue;
    }

    if (isDueSoon(milestone.plannedEndDate, input.clock)) {
      items.push({
        type: 'milestone_due_soon',
        severity: severityForDueSoon(),
        entity: { entityType: 'Milestone', entityId: milestone.id },
        title: milestone.name,
        reason: `Milestone is due soon for project ${projectName}.`,
        ...(milestone.plannedEndDate === undefined
          ? {}
          : { dueDate: toIsoDate(milestone.plannedEndDate) }),
        projectId: milestone.projectId,
      });
    }
  }

  for (const task of input.tasks) {
    if (!isOpenTask(task)) {
      continue;
    }

    const milestone = input.milestonesById.get(task.milestoneId);
    const project =
      milestone === undefined
        ? undefined
        : input.projectsById.get(milestone.projectId);
    const milestoneName = milestone?.name ?? task.milestoneId;
    const projectId = milestone?.projectId;
    const projectName = project?.name;

    if (isBlockedTask(task)) {
      items.push({
        type: 'blocked_task',
        severity: severityForBlockedTask(task.plannedEndDate, input.clock),
        entity: { entityType: 'Task', entityId: task.id },
        title: task.name,
        reason: `Task is blocked under milestone ${milestoneName}.`,
        ...(task.plannedEndDate === undefined
          ? {}
          : { dueDate: toIsoDate(task.plannedEndDate) }),
        ...(projectId === undefined ? {} : { projectId }),
        milestoneId: task.milestoneId,
      });
      continue;
    }

    if (isOverdue(task.plannedEndDate, input.clock)) {
      items.push({
        type: 'overdue_task',
        severity: severityForOverdueDueDate(task.plannedEndDate, input.clock),
        entity: { entityType: 'Task', entityId: task.id },
        title: task.name,
        reason:
          projectName === undefined
            ? `Task is overdue under milestone ${milestoneName}.`
            : `Task is overdue for project ${projectName}.`,
        ...(task.plannedEndDate === undefined
          ? {}
          : { dueDate: toIsoDate(task.plannedEndDate) }),
        ...(projectId === undefined ? {} : { projectId }),
        milestoneId: task.milestoneId,
      });
      continue;
    }

    if (isDueSoon(task.plannedEndDate, input.clock)) {
      items.push({
        type: 'task_due_soon',
        severity: severityForDueSoon(),
        entity: { entityType: 'Task', entityId: task.id },
        title: task.name,
        reason:
          projectName === undefined
            ? `Task is due soon under milestone ${milestoneName}.`
            : `Task is due soon for project ${projectName}.`,
        ...(task.plannedEndDate === undefined
          ? {}
          : { dueDate: toIsoDate(task.plannedEndDate) }),
        ...(projectId === undefined ? {} : { projectId }),
        milestoneId: task.milestoneId,
      });
    }
  }

  for (const event of input.recentEvents) {
    items.push({
      type: 'recent_significant_activity',
      severity: severityForRecentActivity(),
      entity: {
        entityType: mapAggregateType(event.aggregateType),
        entityId: event.aggregateId,
      },
      title: event.eventType,
      reason: `Recent ${event.aggregateType.toLowerCase()} activity: ${event.eventType}.`,
      eventId: event.id,
      ...(event.aggregateType === 'Project'
        ? { projectId: event.aggregateId }
        : {}),
      ...(event.aggregateType === 'Milestone'
        ? { milestoneId: event.aggregateId }
        : {}),
    });
  }

  return items;
}

function mapAggregateType(
  aggregateType: string,
): MissionControlAttentionItem['entity']['entityType'] {
  switch (aggregateType) {
    case 'Program':
      return 'Program';
    case 'Project':
      return 'Project';
    case 'Milestone':
      return 'Milestone';
    case 'Task':
      return 'Task';
    default:
      return 'Project';
  }
}
