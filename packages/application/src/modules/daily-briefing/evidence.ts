import { identifier, type OrganizationId } from '@synaptria/core';
import type {
  EntityReference,
  EventEvidenceReference,
} from '@synaptria/domain/context';

import { toEntityReference } from '../context/mappers/entity-reference';
import type { MissionControlAttentionItem } from '../mission-control/types';
import { dailyBriefingEvidenceKey } from './evidence-keys';
import type {
  DailyBriefingEvidenceItem,
  DailyBriefingProjectHighlight,
  DailyBriefingRecentChange,
  DailyBriefingUpcomingItem,
} from './types';

export function buildDailyBriefingEvidence(input: {
  readonly organizationId: OrganizationId;
  readonly attentionItems: readonly MissionControlAttentionItem[];
  readonly projectHighlights: readonly DailyBriefingProjectHighlight[];
  readonly upcomingWork: readonly DailyBriefingUpcomingItem[];
  readonly recentChanges: readonly DailyBriefingRecentChange[];
}): readonly DailyBriefingEvidenceItem[] {
  const evidence = new Map<string, DailyBriefingEvidenceItem>();

  for (const item of input.attentionItems) {
    addEntityEvidence(evidence, {
      organizationId: input.organizationId,
      entityType: item.entity.entityType,
      entityId: item.entity.entityId,
      source: 'missionControl',
    });
  }

  for (const project of input.projectHighlights) {
    addEntityEvidence(evidence, {
      organizationId: input.organizationId,
      entityType: 'Project',
      entityId: project.projectId,
      source: 'missionControl',
    });
  }

  for (const item of input.upcomingWork) {
    addEntityEvidence(evidence, {
      organizationId: input.organizationId,
      entityType: item.kind === 'milestone' ? 'Milestone' : 'Task',
      entityId: item.entityId,
      source: 'missionControl',
    });
  }

  for (const change of input.recentChanges) {
    addEventEvidence(evidence, change.eventId);
  }

  return [...evidence.values()].sort((left, right) => {
    const leftKey = dailyBriefingEvidenceKey(left);
    const rightKey = dailyBriefingEvidenceKey(right);
    return leftKey.localeCompare(rightKey, 'en', { sensitivity: 'base' });
  });
}

function addEntityEvidence(
  evidence: Map<string, DailyBriefingEvidenceItem>,
  input: {
    readonly organizationId: OrganizationId;
    readonly entityType: EntityReference['entityType'];
    readonly entityId: string;
    readonly source: DailyBriefingEvidenceItem['source'];
  },
): void {
  const reference = toEntityReference({
    organizationId: input.organizationId,
    entityType: input.entityType,
    entityId: input.entityId,
  });
  const key = `entity:${reference.entityType}:${reference.entityId}`;
  evidence.set(key, {
    evidenceType: 'operationalEntity',
    reference,
    source: input.source,
  });
}

function addEventEvidence(evidence: Map<string, DailyBriefingEvidenceItem>, eventId: string): void {
  const reference: EventEvidenceReference = {
    eventId: identifier(eventId, 'DomainEventId'),
  };
  const key = `event:${eventId}`;
  evidence.set(key, {
    evidenceType: 'domainEvent',
    reference,
    source: 'recentEvents',
  });
}
