import type { DailyBriefingSnapshot } from '../types';

export function dailyBriefingSnapshotRequiresNarrativeEvidence(
  snapshot: DailyBriefingSnapshot,
): boolean {
  if (snapshot.attentionItems.length > 0) {
    return true;
  }

  if (snapshot.projectHighlights.length > 0) {
    return true;
  }

  if (snapshot.upcomingWork.length > 0) {
    return true;
  }

  if (snapshot.recentChanges.length > 0) {
    return true;
  }

  const signals = snapshot.executiveSignals;
  return (
    (signals.activeProjects ?? 0) > 0 ||
    (signals.projectsAtRisk ?? 0) > 0 ||
    (signals.overdueTasks ?? 0) > 0 ||
    (signals.blockedTasks ?? 0) > 0 ||
    (signals.overdueMilestones ?? 0) > 0 ||
    (signals.dueSoonMilestones ?? 0) > 0 ||
    (signals.dueSoonTasks ?? 0) > 0 ||
    (signals.recentOrganizationEvents ?? 0) > 0 ||
    (signals.changedProjectCount ?? 0) > 0
  );
}
