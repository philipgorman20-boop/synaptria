import {
  attentionItemEvidenceKey,
  dailyBriefingEvidenceKey,
  projectHighlightEvidenceKey,
  recentChangeEvidenceKey,
  upcomingWorkEvidenceKey,
} from '../evidence-keys';
import type { DailyBriefingSnapshot } from '../types';
import type { DailyBriefingNarrativeModelInput } from './types';
import { selectDailyBriefingNarrativeTargets } from './select-narrative-targets';

function buildEvidenceCatalogLabel(
  snapshot: DailyBriefingSnapshot,
  key: string,
): string {
  const attentionItem = snapshot.attentionItems.find(
    (item) => attentionItemEvidenceKey(item) === key,
  );
  if (attentionItem !== undefined) {
    return `${attentionItem.type}: ${attentionItem.title}`;
  }

  const project = snapshot.projectHighlights.find(
    (item) => projectHighlightEvidenceKey(item) === key,
  );
  if (project !== undefined) {
    return `Project ${project.projectName} (${project.healthState})`;
  }

  const upcomingItem = snapshot.upcomingWork.find(
    (item) => upcomingWorkEvidenceKey(item) === key,
  );
  if (upcomingItem !== undefined) {
    return `${upcomingItem.kind}: ${upcomingItem.title} (${upcomingItem.projectName})`;
  }

  const recentChange = snapshot.recentChanges.find(
    (change) => recentChangeEvidenceKey(change) === key,
  );
  if (recentChange !== undefined) {
    return `${recentChange.eventType} on ${recentChange.aggregateType}`;
  }

  return key;
}

export function mapDailyBriefingSnapshotToModelInput(
  snapshot: DailyBriefingSnapshot,
): DailyBriefingNarrativeModelInput {
  const narrativeTargets = selectDailyBriefingNarrativeTargets(snapshot);

  return {
    capabilityVersion: 'v0',
    briefingWindow: {
      lookbackHours: snapshot.briefingWindow.lookbackHours,
      startsAt: snapshot.briefingWindow.startsAt.toISOString(),
      endsAt: snapshot.briefingWindow.endsAt.toISOString(),
    },
    attentionItems: snapshot.attentionItems.map((item) => ({
      evidenceKey: attentionItemEvidenceKey(item),
      type: item.type,
      severity: item.severity,
      title: item.title,
      reason: item.reason,
      ...(item.dueDate === undefined ? {} : { dueDate: item.dueDate }),
    })),
    projectHighlights: snapshot.projectHighlights.map((project) => ({
      evidenceKey: projectHighlightEvidenceKey(project),
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
    })),
    upcomingWork: snapshot.upcomingWork.map((item) => ({
      evidenceKey: upcomingWorkEvidenceKey(item),
      kind: item.kind,
      title: item.title,
      projectName: item.projectName,
      status: item.status,
      ...(item.plannedEndDate === undefined ? {} : { plannedEndDate: item.plannedEndDate }),
      ...(item.priority === undefined ? {} : { priority: item.priority }),
    })),
    recentChanges: snapshot.recentChanges.map((change) => ({
      evidenceKey: recentChangeEvidenceKey(change),
      eventType: change.eventType,
      aggregateType: change.aggregateType,
      occurredAt: change.occurredAt,
    })),
    evidenceCatalog: snapshot.evidence
      .map((item) => ({
        key: dailyBriefingEvidenceKey(item),
        label: buildEvidenceCatalogLabel(snapshot, dailyBriefingEvidenceKey(item)),
      }))
      .sort((left, right) => left.key.localeCompare(right.key, 'en', { sensitivity: 'base' })),
    narrativeTargets,
    completeness: {
      status: snapshot.completeness.status,
      degradationNotes: snapshot.completeness.degradationNotes,
    },
    restrictedSlices: snapshot.metadata.restrictedSlices,
  };
}

export function serializeDailyBriefingNarrativeModelInput(
  modelInput: DailyBriefingNarrativeModelInput,
): string {
  return JSON.stringify(modelInput);
}
