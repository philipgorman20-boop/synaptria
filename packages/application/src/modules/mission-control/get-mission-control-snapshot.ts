import type { Clock, OrganizationId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type { MilestoneRepository } from '@synaptria/domain/milestones';
import type { ProgramRepository } from '@synaptria/domain/programs';
import type { ProjectRepository } from '@synaptria/domain/projects';
import type { TaskRepository } from '@synaptria/domain/tasks';
import { AuthorizationDeniedError } from '@synaptria/core/errors';

import { ListRecentOrganizationEventsUseCase } from '../events/list-recent-organization-events';
import {
  createDefaultMissionControlAccessPolicy,
  type MissionControlAccessPolicy,
} from './access-policy';
import { buildAttentionItems } from './attention';
import { MISSION_CONTROL_RECENT_ACTIVITY_LIMIT } from './constants';
import {
  isAccessibleProgram,
  isActiveProgram,
  isActiveProject,
  isAccessibleProject,
  isBlockedTask,
  isCompletedTask,
  isOpenMilestone,
  isOpenTask,
} from './entity-classifiers';
import { isDueSoon, isOverdue } from './date-signals';
import { buildProjectHealthSummaries } from './project-health';
import { mapRecentActivityItems } from './recent-activity';
import { buildMilestoneSignals, buildTaskSignals } from './signals';
import {
  compareProjectsByNameThenId,
  sortAttentionItems,
  sortMilestoneSignals,
  sortProjectHealth,
  sortRecentActivity,
  sortTaskSignals,
} from './sorting';
import type { Milestone } from '@synaptria/domain/milestones';
import type { Program } from '@synaptria/domain/programs';
import type { Project } from '@synaptria/domain/projects';
import type { Task } from '@synaptria/domain/tasks';

import type {
  MissionControlRestrictedSlice,
  MissionControlSnapshot,
  MissionControlSummary,
} from './types';

export interface GetMissionControlSnapshotContext {
  readonly organizationId: OrganizationId;
  readonly role: OrganizationRole;
}

export interface GetMissionControlSnapshotDependencies {
  readonly programs: ProgramRepository;
  readonly projects: ProjectRepository;
  readonly milestones: MilestoneRepository;
  readonly tasks: TaskRepository;
  readonly listRecentOrganizationEvents: ListRecentOrganizationEventsUseCase;
  readonly clock: Clock;
  readonly accessPolicy?: MissionControlAccessPolicy;
}

export class GetMissionControlSnapshotUseCase {
  private readonly accessPolicy: MissionControlAccessPolicy;

  constructor(private readonly dependencies: GetMissionControlSnapshotDependencies) {
    this.accessPolicy =
      dependencies.accessPolicy ?? createDefaultMissionControlAccessPolicy();
  }

  async execute(context: GetMissionControlSnapshotContext): Promise<MissionControlSnapshot> {
    if (!this.accessPolicy.canAccessDashboard(context.role)) {
      throw new AuthorizationDeniedError('Missing required permission: dashboard.read.');
    }

    const restrictedSlices: MissionControlRestrictedSlice[] = [];

    let programs: Awaited<
      ReturnType<ProgramRepository['listForOrganization']>
    > = [];
    if (this.accessPolicy.canReadPrograms(context.role)) {
      programs = (await this.dependencies.programs.listForOrganization(
        context.organizationId,
      ))
        .filter(isAccessibleProgram)
        .sort(compareProgramsByNameThenId);
    } else {
      restrictedSlices.push('programs');
    }

    let projects: Awaited<
      ReturnType<ProjectRepository['listForOrganization']>
    > = [];
    if (this.accessPolicy.canReadProjects(context.role)) {
      projects = (await this.dependencies.projects.listForOrganization(
        context.organizationId,
      ))
        .filter(isAccessibleProject)
        .sort(compareProjectsByNameThenId);
    } else {
      restrictedSlices.push('projects');
    }

    let milestones: Awaited<
      ReturnType<MilestoneRepository['listForOrganization']>
    > = [];
    if (this.accessPolicy.canReadMilestones(context.role)) {
      milestones = [
        ...(await this.dependencies.milestones.listForOrganization(
          context.organizationId,
        )),
      ];
    } else {
      restrictedSlices.push('milestones');
    }

    let tasks: Awaited<ReturnType<TaskRepository['listForOrganization']>> = [];
    if (this.accessPolicy.canReadTasks(context.role)) {
      tasks = [
        ...(await this.dependencies.tasks.listForOrganization(context.organizationId)),
      ];
    } else {
      restrictedSlices.push('tasks');
    }

    let recentEvents: Awaited<
      ReturnType<ListRecentOrganizationEventsUseCase['execute']>
    >['events'] = [];
    if (this.accessPolicy.canReadRecentActivity(context.role)) {
      recentEvents = (
        await this.dependencies.listRecentOrganizationEvents.execute(
          {
            organizationId: context.organizationId,
            role: context.role,
          },
          { limit: MISSION_CONTROL_RECENT_ACTIVITY_LIMIT },
        )
      ).events;
    } else {
      restrictedSlices.push('recentActivity');
    }

    const projectsById = new Map(projects.map((project) => [project.id, project]));
    const milestonesById = new Map(
      milestones.map((milestone) => [milestone.id, milestone]),
    );

    const milestoneSignals = sortMilestoneSignals(
      buildMilestoneSignals({
        milestones,
        tasks,
        projectsById,
        clock: this.dependencies.clock,
      }),
    );

    const taskSignals = sortTaskSignals(
      buildTaskSignals({
        tasks,
        milestonesById,
        projectsById,
        clock: this.dependencies.clock,
      }),
    );

    const projectHealth = sortProjectHealth(
      buildProjectHealthSummaries({
        projects,
        milestones,
        tasks,
        recentEvents,
        clock: this.dependencies.clock,
      }),
    );

    const attentionItems = sortAttentionItems(
      buildAttentionItems({
        milestones,
        tasks,
        projectsById,
        milestonesById,
        recentEvents,
        clock: this.dependencies.clock,
      }),
    );

    const recentActivity = sortRecentActivity(mapRecentActivityItems(recentEvents));

    const summary = buildSummary({
      programs,
      projects,
      milestones,
      tasks,
      recentActivityCount: recentActivity.length,
      clock: this.dependencies.clock,
    });

    return {
      generatedAt: this.dependencies.clock.now(),
      organization: {
        organizationId: context.organizationId,
      },
      summary,
      attentionItems,
      projectHealth,
      milestoneSignals,
      taskSignals,
      recentActivity,
      metadata: {
        deterministic: true,
        restrictedSlices: [...restrictedSlices].sort(),
      },
    };
  }
}

function compareProgramsByNameThenId(
  left: { readonly name: string; readonly id: string; readonly code?: string },
  right: { readonly name: string; readonly id: string; readonly code?: string },
): number {
  const byName = left.name.localeCompare(right.name, 'en', { sensitivity: 'base' });
  if (byName !== 0) {
    return byName;
  }

  const leftCode = left.code ?? '';
  const rightCode = right.code ?? '';
  const byCode = leftCode.localeCompare(rightCode, 'en', { sensitivity: 'base' });
  if (byCode !== 0) {
    return byCode;
  }

  return left.id.localeCompare(right.id, 'en', { sensitivity: 'base' });
}

function buildSummary(input: {
  readonly programs: readonly Program[];
  readonly projects: readonly Project[];
  readonly milestones: readonly Milestone[];
  readonly tasks: readonly Task[];
  readonly recentActivityCount: number;
  readonly clock: Clock;
}): MissionControlSummary {
  return {
    activePrograms: input.programs.filter(isActiveProgram).length,
    activeProjects: input.projects.filter(isActiveProject).length,
    openMilestones: input.milestones.filter(isOpenMilestone).length,
    openTasks: input.tasks.filter(isOpenTask).length,
    overdueMilestones: input.milestones.filter(
      (milestone) =>
        isOpenMilestone(milestone) &&
        isOverdue(milestone.plannedEndDate, input.clock),
    ).length,
    overdueTasks: input.tasks.filter(
      (task) => isOpenTask(task) && isOverdue(task.plannedEndDate, input.clock),
    ).length,
    blockedTasks: input.tasks.filter((task) => isOpenTask(task) && isBlockedTask(task))
      .length,
    completedTasks: input.tasks.filter(isCompletedTask).length,
    recentActivityCount: input.recentActivityCount,
  };
}
