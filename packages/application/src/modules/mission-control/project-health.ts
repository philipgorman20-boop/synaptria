import type { Clock } from '@synaptria/core';
import type { DomainEventEnvelope } from '@synaptria/events';
import type { Milestone } from '@synaptria/domain/milestones';
import type { Project } from '@synaptria/domain/projects';
import type { Task } from '@synaptria/domain/tasks';

import { toIsoDate, isDeeplyOverdue, isDueSoon, isOverdue } from './date-signals';
import {
  isActiveProject,
  isBlockedTask,
  isOpenMilestone,
  isOpenTask,
} from './entity-classifiers';
import { projectAttentionSeverity, projectHealthState } from './severity';
import type { MissionControlProjectHealth } from './types';

export function buildProjectHealthSummaries(input: {
  readonly projects: readonly Project[];
  readonly milestones: readonly Milestone[];
  readonly tasks: readonly Task[];
  readonly recentEvents: readonly DomainEventEnvelope[];
  readonly clock: Clock;
}): readonly MissionControlProjectHealth[] {
  const milestonesByProject = groupBy(input.milestones, (milestone) => milestone.projectId);
  const tasksByMilestone = groupBy(input.tasks, (task) => task.milestoneId);
  const eventsByProject = countEventsByProject(input.recentEvents);

  return input.projects
    .filter(isActiveProject)
    .map((project) => {
      const projectMilestones = milestonesByProject.get(project.id) ?? [];
      const projectTasks = projectMilestones.flatMap(
        (milestone) => tasksByMilestone.get(milestone.id) ?? [],
      );

      const openMilestones = projectMilestones.filter(isOpenMilestone);
      const overdueMilestones = openMilestones.filter((milestone) =>
        isOverdue(milestone.plannedEndDate, input.clock),
      );
      const dueSoonMilestones = openMilestones.filter(
        (milestone) =>
          !isOverdue(milestone.plannedEndDate, input.clock) &&
          isDueSoon(milestone.plannedEndDate, input.clock),
      );

      const openTasks = projectTasks.filter(isOpenTask);
      const overdueTasks = openTasks.filter((task) =>
        isOverdue(task.plannedEndDate, input.clock),
      );
      const blockedTasks = openTasks.filter(isBlockedTask);
      const dueSoonTasks = openTasks.filter(
        (task) =>
          !isBlockedTask(task) &&
          !isOverdue(task.plannedEndDate, input.clock) &&
          isDueSoon(task.plannedEndDate, input.clock),
      );

      const deeplyOverdueMilestonePresent = overdueMilestones.some((milestone) =>
        isDeeplyOverdue(milestone.plannedEndDate, input.clock),
      );
      const deeplyOverdueTaskPresent = overdueTasks.some((task) =>
        isDeeplyOverdue(task.plannedEndDate, input.clock),
      );

      const nextMilestoneDueDate = openMilestones
        .map((milestone) => milestone.plannedEndDate)
        .filter((date): date is Date => date !== undefined)
        .sort((left, right) => left.getTime() - right.getTime())[0];

      const healthCounts = {
        overdueMilestones: overdueMilestones.length,
        overdueTasks: overdueTasks.length,
        blockedTasks: blockedTasks.length,
        dueSoonMilestones: dueSoonMilestones.length,
        dueSoonTasks: dueSoonTasks.length,
      };

      return {
        projectId: project.id,
        projectName: project.name,
        status: project.status,
        priority: project.priority,
        openMilestones: openMilestones.length,
        overdueMilestones: healthCounts.overdueMilestones,
        openTasks: openTasks.length,
        overdueTasks: healthCounts.overdueTasks,
        blockedTasks: healthCounts.blockedTasks,
        dueSoonMilestones: healthCounts.dueSoonMilestones,
        dueSoonTasks: healthCounts.dueSoonTasks,
        recentEventCount: eventsByProject.get(project.id) ?? 0,
        ...(nextMilestoneDueDate === undefined
          ? {}
          : { nextMilestoneDueDate: toIsoDate(nextMilestoneDueDate) }),
        attentionSeverity: projectAttentionSeverity({
          ...healthCounts,
          deeplyOverdueMilestonePresent,
          deeplyOverdueTaskPresent,
        }),
        healthState: projectHealthState(healthCounts),
      } satisfies MissionControlProjectHealth;
    });
}

function groupBy<T>(
  items: readonly T[],
  keySelector: (item: T) => string,
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  for (const item of items) {
    const key = keySelector(item);
    const bucket = grouped.get(key);
    if (bucket === undefined) {
      grouped.set(key, [item]);
    } else {
      bucket.push(item);
    }
  }

  return grouped;
}

function countEventsByProject(
  events: readonly DomainEventEnvelope[],
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const event of events) {
    if (event.aggregateType !== 'Project') {
      continue;
    }

    counts.set(event.aggregateId, (counts.get(event.aggregateId) ?? 0) + 1);
  }

  return counts;
}
