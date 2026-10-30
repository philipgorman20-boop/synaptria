import type { MissionControlProjectHealth } from '../mission-control/types';
import type { DailyBriefingProjectHighlight } from './types';

export function buildDailyBriefingProjectHighlights(
  projectHealth: readonly MissionControlProjectHealth[],
  limit: number,
): readonly DailyBriefingProjectHighlight[] {
  return projectHealth.slice(0, limit).map(mapProjectHighlight);
}

function mapProjectHighlight(
  project: MissionControlProjectHealth,
): DailyBriefingProjectHighlight {
  return {
    projectId: project.projectId,
    projectName: project.projectName,
    healthState: project.healthState,
    attentionSeverity: project.attentionSeverity,
    overdueTasks: project.overdueTasks,
    blockedTasks: project.blockedTasks,
    overdueMilestones: project.overdueMilestones,
    dueSoonMilestones: project.dueSoonMilestones,
    dueSoonTasks: project.dueSoonTasks,
    recentEventCount: project.recentEventCount,
    ...(project.nextMilestoneDueDate === undefined
      ? {}
      : { nextMilestoneDueDate: project.nextMilestoneDueDate }),
  };
}
