import { dailyBriefingEvidenceKey } from '../evidence-keys';
import type { DailyBriefingSnapshot } from '../types';
import type { DailyBriefingNarrativeModelInput } from './types';

export function mapDailyBriefingSnapshotToModelInput(
  snapshot: DailyBriefingSnapshot,
): DailyBriefingNarrativeModelInput {
  return {
    capabilityVersion: 'v0',
    generatedAt: snapshot.generatedAt.toISOString(),
    organizationId: snapshot.organization.organizationId,
    briefingWindow: {
      lookbackHours: snapshot.briefingWindow.lookbackHours,
      startsAt: snapshot.briefingWindow.startsAt.toISOString(),
      endsAt: snapshot.briefingWindow.endsAt.toISOString(),
    },
    executiveSignals: snapshot.executiveSignals,
    attentionItems: snapshot.attentionItems,
    projectHighlights: snapshot.projectHighlights,
    upcomingWork: snapshot.upcomingWork,
    recentChanges: snapshot.recentChanges,
    evidenceCatalog: snapshot.evidence
      .map((item) => ({
        key: dailyBriefingEvidenceKey(item),
        evidenceType: item.evidenceType,
        reference:
          item.evidenceType === 'operationalEntity'
            ? {
                organizationId: item.reference.organizationId,
                entityType: item.reference.entityType,
                entityId: item.reference.entityId,
              }
            : {
                eventId: item.reference.eventId,
              },
      }))
      .sort((left, right) => left.key.localeCompare(right.key, 'en', { sensitivity: 'base' })),
    completeness: snapshot.completeness,
    metadata: {
      restrictedSlices: snapshot.metadata.restrictedSlices,
      missionControlGeneratedAt: snapshot.metadata.missionControlGeneratedAt.toISOString(),
    },
  };
}

export function serializeDailyBriefingNarrativeModelInput(
  modelInput: DailyBriefingNarrativeModelInput,
): string {
  return JSON.stringify(modelInput);
}
