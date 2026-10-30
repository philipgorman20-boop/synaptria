import {
  AuthenticationError,
  OrganizationMembershipRequiredError,
  type ResolvedOrganizationContext,
} from '@synaptria/auth';
import { AuthorizationDeniedError } from '@synaptria/core/errors';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { toDailyBriefingContext } from '../../lib/daily-briefing-context';
import {
  loadDailyBriefingSnapshot,
  startDailyBriefingNarrativeGeneration,
} from '../../lib/daily-briefing-loader';
import { getOrganizationService } from '../../lib/organization-service';
import { getRequestContext } from '../../lib/request-context';

import { DailyBriefingAttentionList } from './components/briefing-attention-list';
import { DailyBriefingCompletenessPanel } from './components/briefing-completeness';
import { DailyBriefingHeader } from './components/daily-briefing-header';
import { DailyBriefingProjectHighlights } from './components/briefing-project-highlights';
import { DailyBriefingRecentChanges } from './components/briefing-recent-changes';
import { DailyBriefingUpcomingWork } from './components/briefing-upcoming-work';
import {
  DailyBriefingExecutiveSummaryContent,
  DailyBriefingExecutiveSummaryLoading,
  DailyBriefingHeadlineContent,
  DailyBriefingNarrativeLoadingStatus,
  DailyBriefingNarrativeStatusContent,
} from './components/daily-briefing-narrative-stream';
import { DailyBriefingExecutiveSignals } from './components/executive-signals';
import {
  resolveBriefingHeadline,
  shouldShowDailyBriefingEmptyState,
} from './daily-briefing-format';

export default async function DailyBriefingPage() {
  let context: ResolvedOrganizationContext;

  try {
    context = await getRequestContext();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect('/sign-in');
    }

    if (error instanceof OrganizationMembershipRequiredError) {
      redirect('/no-organization');
    }

    throw error;
  }

  const briefingContext = toDailyBriefingContext(context);

  const [organizationList, snapshot] = await Promise.all([
    getOrganizationService().listOrganizations({
      userId: context.userId,
      activeOrganizationId: context.organizationId,
    }),
    loadDailyBriefingSnapshot(briefingContext).catch((error: unknown) => {
      if (error instanceof AuthorizationDeniedError) {
        redirect('/no-organization');
      }

      throw error;
    }),
  ]);

  const narrativePromise = startDailyBriefingNarrativeGeneration(snapshot);
  const fallbackHeadline = resolveBriefingHeadline(null, snapshot);
  const showEmptyState = shouldShowDailyBriefingEmptyState(snapshot);

  return (
    <main className="dashboard mission-control-page daily-briefing-page">
      <div className="daily-briefing-content">
        <DailyBriefingHeader
          activeOrganizationId={context.organizationId}
          headline={
            <Suspense fallback={fallbackHeadline}>
              <DailyBriefingHeadlineContent
                narrativePromise={narrativePromise}
                snapshot={snapshot}
              />
            </Suspense>
          }
          organizations={organizationList.organizations.map((item) => ({
            id: item.organization.id,
            name: item.organization.name,
            role: item.membership.role,
          }))}
          snapshot={snapshot}
        />

        <Suspense fallback={<DailyBriefingNarrativeLoadingStatus />}>
          <DailyBriefingNarrativeStatusContent narrativePromise={narrativePromise} />
        </Suspense>

        <Suspense fallback={<DailyBriefingExecutiveSummaryLoading />}>
          <DailyBriefingExecutiveSummaryContent narrativePromise={narrativePromise} />
        </Suspense>

        <DailyBriefingExecutiveSignals snapshot={snapshot} />

        <DailyBriefingCompletenessPanel
          narrativePromise={narrativePromise}
          snapshot={snapshot}
        />

        {showEmptyState ? (
          <section
            className="mission-control-empty-organization daily-briefing-empty"
            aria-labelledby="daily-briefing-empty-heading"
          >
            <p className="eyebrow">QUIET PERIOD</p>
            <h2 id="daily-briefing-empty-heading">No operational activity in this briefing</h2>
            <p>
              The deterministic snapshot contains no attention items, project highlights,
              upcoming work, or recent changes for the current briefing window.
            </p>
          </section>
        ) : (
          <div className="mission-control-layout daily-briefing-layout">
            <div className="mission-control-primary-column">
              <DailyBriefingAttentionList
                items={snapshot.attentionItems}
                narrativePromise={narrativePromise}
              />
              <DailyBriefingUpcomingWork
                items={snapshot.upcomingWork}
                narrativePromise={narrativePromise}
              />
            </div>

            <div className="mission-control-secondary-column">
              <DailyBriefingProjectHighlights
                narrativePromise={narrativePromise}
                projects={snapshot.projectHighlights}
              />
              <DailyBriefingRecentChanges
                changes={snapshot.recentChanges}
                narrativePromise={narrativePromise}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
