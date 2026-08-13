import type { Clock, OrganizationId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import { AuthorizationDeniedError } from '@synaptria/core/errors';

import { ListRecentOrganizationEventsUseCase } from '../events/list-recent-organization-events';
import type { MissionControlService } from '../mission-control/mission-control-service';
import type { MissionControlRestrictedSlice } from '../mission-control/types';
import {
  createDefaultDailyBriefingAccessPolicy,
  type DailyBriefingAccessPolicy,
} from './access-policy';
import { resolveDailyBriefingWindow } from './briefing-window';
import {
  DAILY_BRIEFING_ATTENTION_LIMIT,
  DAILY_BRIEFING_PROJECT_HIGHLIGHT_LIMIT,
  DAILY_BRIEFING_RECENT_CHANGES_LIMIT,
  DAILY_BRIEFING_UPCOMING_LIMIT,
} from './constants';
import { assessDailyBriefingCompleteness } from './completeness';
import { buildDailyBriefingEvidence } from './evidence';
import { buildDailyBriefingExecutiveSignals } from './executive-signals';
import { buildDailyBriefingProjectHighlights } from './project-highlights';
import { mapDailyBriefingRecentChanges } from './recent-changes';
import type { DailyBriefingSnapshot } from './types';
import { buildDailyBriefingUpcomingWork } from './upcoming-work';

export interface GetDailyBriefingSnapshotContext {
  readonly organizationId: OrganizationId;
  readonly role: OrganizationRole;
}

export interface GetDailyBriefingSnapshotOptions {
  readonly lookbackHours?: number;
}

export interface GetDailyBriefingSnapshotDependencies {
  readonly missionControl: MissionControlService;
  readonly listRecentOrganizationEvents: ListRecentOrganizationEventsUseCase;
  readonly clock: Clock;
  readonly accessPolicy?: DailyBriefingAccessPolicy;
}

export class GetDailyBriefingSnapshotUseCase {
  private readonly accessPolicy: DailyBriefingAccessPolicy;

  constructor(private readonly dependencies: GetDailyBriefingSnapshotDependencies) {
    this.accessPolicy =
      dependencies.accessPolicy ?? createDefaultDailyBriefingAccessPolicy();
  }

  async execute(
    context: GetDailyBriefingSnapshotContext,
    options: GetDailyBriefingSnapshotOptions = {},
  ): Promise<DailyBriefingSnapshot> {
    if (!this.accessPolicy.canAccessDailyBriefing(context.role)) {
      throw new AuthorizationDeniedError('Missing required permission: dashboard.read.');
    }

    const briefingWindow = resolveDailyBriefingWindow({
      clock: this.dependencies.clock,
      ...(options.lookbackHours === undefined ? {} : { lookbackHours: options.lookbackHours }),
    });

    const missionControl = await this.dependencies.missionControl.getSnapshot({
      organizationId: context.organizationId,
      role: context.role,
    });

    const restrictedSlices = missionControl.metadata.restrictedSlices;
    const recentChanges = await this.loadRecentChanges(context, briefingWindow.startsAt, restrictedSlices);

    const attentionItems = missionControl.attentionItems.slice(0, DAILY_BRIEFING_ATTENTION_LIMIT);
    const projectHighlights = isSliceRestricted('projects', restrictedSlices)
      ? []
      : buildDailyBriefingProjectHighlights(
          missionControl.projectHealth,
          DAILY_BRIEFING_PROJECT_HIGHLIGHT_LIMIT,
        );
    const upcomingWork = buildDailyBriefingUpcomingWork({
      milestoneSignals: isSliceRestricted('milestones', restrictedSlices)
        ? []
        : missionControl.milestoneSignals,
      taskSignals: isSliceRestricted('tasks', restrictedSlices)
        ? []
        : missionControl.taskSignals,
      limit: DAILY_BRIEFING_UPCOMING_LIMIT,
    });

    const evidence = buildDailyBriefingEvidence({
      organizationId: context.organizationId,
      attentionItems,
      projectHighlights,
      upcomingWork,
      recentChanges,
    });

    return {
      generatedAt: this.dependencies.clock.now(),
      organization: {
        organizationId: context.organizationId,
      },
      briefingWindow,
      executiveSignals: buildDailyBriefingExecutiveSignals({
        missionControl,
        recentChanges,
      }),
      attentionItems,
      projectHighlights,
      upcomingWork,
      recentChanges,
      evidence,
      completeness: assessDailyBriefingCompleteness({ restrictedSlices }),
      metadata: {
        deterministic: true,
        restrictedSlices,
        missionControlGeneratedAt: missionControl.generatedAt,
      },
    };
  }

  private async loadRecentChanges(
    context: GetDailyBriefingSnapshotContext,
    startsAt: Date,
    restrictedSlices: readonly MissionControlRestrictedSlice[],
  ) {
    if (isSliceRestricted('recentActivity', restrictedSlices)) {
      return [];
    }

    const { events } = await this.dependencies.listRecentOrganizationEvents.execute(
      {
        organizationId: context.organizationId,
        role: context.role,
      },
      {
        limit: DAILY_BRIEFING_RECENT_CHANGES_LIMIT,
        occurredAtOnOrAfter: startsAt,
      },
    );

    return mapDailyBriefingRecentChanges(events);
  }
}

function isSliceRestricted(
  slice: MissionControlRestrictedSlice,
  restrictedSlices: readonly MissionControlRestrictedSlice[],
): boolean {
  return restrictedSlices.includes(slice);
}
