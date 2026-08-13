import type { MissionControlRestrictedSlice, MissionControlSnapshot } from '../mission-control/types';
import type { DailyBriefingExecutiveSignals, DailyBriefingRecentChange } from './types';

function isSliceRestricted(
  slice: MissionControlRestrictedSlice,
  restrictedSlices: readonly MissionControlRestrictedSlice[],
): boolean {
  return restrictedSlices.includes(slice);
}

export function buildDailyBriefingExecutiveSignals(input: {
  readonly missionControl: MissionControlSnapshot;
  readonly recentChanges: readonly DailyBriefingRecentChange[];
}): DailyBriefingExecutiveSignals {
  const restricted = input.missionControl.metadata.restrictedSlices;
  const projectsRestricted = isSliceRestricted('projects', restricted);
  const tasksRestricted = isSliceRestricted('tasks', restricted);
  const milestonesRestricted = isSliceRestricted('milestones', restricted);
  const recentActivityRestricted = isSliceRestricted('recentActivity', restricted);

  return {
    activeProjects: projectsRestricted
      ? null
      : input.missionControl.summary.activeProjects,
    projectsAtRisk: projectsRestricted
      ? null
      : input.missionControl.projectHealth.filter(
          (project) => project.healthState === 'at_risk',
        ).length,
    overdueTasks: tasksRestricted ? null : input.missionControl.summary.overdueTasks,
    blockedTasks: tasksRestricted ? null : input.missionControl.summary.blockedTasks,
    overdueMilestones: milestonesRestricted
      ? null
      : input.missionControl.summary.overdueMilestones,
    dueSoonMilestones: milestonesRestricted
      ? null
      : input.missionControl.milestoneSignals.filter((signal) => signal.dueSoon).length,
    dueSoonTasks: tasksRestricted
      ? null
      : input.missionControl.taskSignals.filter((signal) => signal.dueSoon).length,
    recentOrganizationEvents: recentActivityRestricted
      ? null
      : input.recentChanges.length,
    changedProjectCount: recentActivityRestricted
      ? null
      : countChangedProjects(input.recentChanges),
  };
}

function countChangedProjects(
  recentChanges: readonly DailyBriefingRecentChange[],
): number {
  const projectIds = new Set<string>();

  for (const change of recentChanges) {
    if (change.aggregateType !== 'Project') {
      continue;
    }

    if (!change.eventType.startsWith('project.')) {
      continue;
    }

    projectIds.add(change.aggregateId);
  }

  return projectIds.size;
}
