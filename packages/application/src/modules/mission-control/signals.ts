import type { Clock } from '@synaptria/core';
import type { Milestone } from '@synaptria/domain/milestones';
import type { Project } from '@synaptria/domain/projects';
import type { Task } from '@synaptria/domain/tasks';

import { toIsoDate, isDueSoon, isOverdue } from './date-signals';
import {
  isBlockedTask,
  isOpenMilestone,
  isOpenTask,
} from './entity-classifiers';
import type { MissionControlMilestoneSignal, MissionControlTaskSignal } from './types';

export function buildMilestoneSignals(input: {
  readonly milestones: readonly Milestone[];
  readonly tasks: readonly Task[];
  readonly projectsById: ReadonlyMap<string, Project>;
  readonly clock: Clock;
}): readonly MissionControlMilestoneSignal[] {
  const tasksByMilestone = groupTasksByMilestone(input.tasks);

  return input.milestones
    .filter(isOpenMilestone)
    .map((milestone) => {
      const project = input.projectsById.get(milestone.projectId);
      const milestoneTasks = (tasksByMilestone.get(milestone.id) ?? []).filter(isOpenTask);

      return {
        milestoneId: milestone.id,
        milestoneName: milestone.name,
        projectId: milestone.projectId,
        projectName: project?.name ?? milestone.projectId,
        status: milestone.status,
        ...(milestone.plannedEndDate === undefined
          ? {}
          : { plannedEndDate: toIsoDate(milestone.plannedEndDate) }),
        overdue: isOverdue(milestone.plannedEndDate, input.clock),
        dueSoon: isDueSoon(milestone.plannedEndDate, input.clock),
        openTaskCount: milestoneTasks.length,
        blockedTaskCount: milestoneTasks.filter(isBlockedTask).length,
        overdueTaskCount: milestoneTasks.filter((task) =>
          isOverdue(task.plannedEndDate, input.clock),
        ).length,
      } satisfies MissionControlMilestoneSignal;
    });
}

export function buildTaskSignals(input: {
  readonly tasks: readonly Task[];
  readonly milestonesById: ReadonlyMap<string, Milestone>;
  readonly projectsById: ReadonlyMap<string, Project>;
  readonly clock: Clock;
}): readonly MissionControlTaskSignal[] {
  return input.tasks
    .filter(isOpenTask)
    .map((task) => {
      const milestone = input.milestonesById.get(task.milestoneId);
      const project =
        milestone === undefined
          ? undefined
          : input.projectsById.get(milestone.projectId);

      return {
        taskId: task.id,
        taskName: task.name,
        milestoneId: task.milestoneId,
        milestoneName: milestone?.name ?? task.milestoneId,
        projectId: milestone?.projectId ?? '',
        projectName: project?.name ?? milestone?.projectId ?? '',
        status: task.status,
        priority: task.priority,
        ...(task.plannedEndDate === undefined
          ? {}
          : { plannedEndDate: toIsoDate(task.plannedEndDate) }),
        overdue: isOverdue(task.plannedEndDate, input.clock),
        dueSoon: isDueSoon(task.plannedEndDate, input.clock),
        blocked: isBlockedTask(task),
      } satisfies MissionControlTaskSignal;
    });
}

function groupTasksByMilestone(tasks: readonly Task[]): Map<string, Task[]> {
  const grouped = new Map<string, Task[]>();

  for (const task of tasks) {
    const bucket = grouped.get(task.milestoneId);
    if (bucket === undefined) {
      grouped.set(task.milestoneId, [task]);
    } else {
      bucket.push(task);
    }
  }

  return grouped;
}
