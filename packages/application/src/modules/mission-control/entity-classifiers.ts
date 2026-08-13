import type { Program } from '@synaptria/domain/programs';
import type { Project } from '@synaptria/domain/projects';
import type { Milestone } from '@synaptria/domain/milestones';
import type { Task } from '@synaptria/domain/tasks';

export function isAccessibleProgram(program: Program): boolean {
  return program.deletedAt === undefined;
}

export function isActiveProgram(program: Program): boolean {
  return (
    isAccessibleProgram(program) &&
    program.status !== 'COMPLETED' &&
    program.status !== 'TERMINATED' &&
    program.status !== 'ON_HOLD'
  );
}

export function isAccessibleProject(project: Project): boolean {
  return project.deletedAt === undefined;
}

export function isActiveProject(project: Project): boolean {
  return isAccessibleProject(project) && project.status === 'ACTIVE';
}

export function isOpenMilestone(milestone: Milestone): boolean {
  return milestone.status !== 'COMPLETED' && milestone.status !== 'CANCELLED';
}

export function isOpenTask(task: Task): boolean {
  return task.status !== 'COMPLETED' && task.status !== 'CANCELLED';
}

export function isBlockedTask(task: Task): boolean {
  return task.status === 'BLOCKED';
}

export function isCompletedTask(task: Task): boolean {
  return task.status === 'COMPLETED';
}
