import {
  AuthenticationError,
  OrganizationMembershipRequiredError,
  type ResolvedOrganizationContext,
} from '@synaptria/auth';
import { AuthorizationDeniedError } from '@synaptria/core/errors';
import { PERMISSIONS, hasPermission } from '@synaptria/permissions';
import { redirect } from 'next/navigation';

import { RestrictedDataNotice } from '../dashboard/components/restricted-data-notice';
import { toRecommendationReviewReadContext } from '../../lib/recommendation-review-context';
import { toActionProposalsReadContext } from '../../lib/action-proposals-context';
import { getActionProposalsService } from '../../lib/action-proposals-service';
import { getRecommendationReviewService } from '../../lib/recommendation-review-service';
import { getOrganizationService } from '../../lib/organization-service';
import { getRequestContext } from '../../lib/request-context';

import { RecommendationReviewHeader } from './components/recommendation-review-header';
import { RecommendationReviewQueue } from './components/recommendation-review-queue';
import { RecommendationReviewSummaryPanel } from './components/recommendation-review-summary';

export default async function RecommendationsPage() {
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

  const [organizationList, snapshot, actionProposalsSnapshot] = await Promise.all([
    getOrganizationService().listOrganizations({
      userId: context.userId,
      activeOrganizationId: context.organizationId,
    }),
    getRecommendationReviewService()
      .getReviewSnapshot(toRecommendationReviewReadContext(context))
      .catch((error: unknown) => {
        if (error instanceof AuthorizationDeniedError) {
          redirect('/no-organization');
        }

        throw error;
      }),
    getActionProposalsService()
      .getActionProposals(toActionProposalsReadContext(context))
      .catch((error: unknown) => {
        if (error instanceof AuthorizationDeniedError) {
          redirect('/no-organization');
        }

        throw error;
      }),
  ]);

  const actionProposalRecommendationIds = new Set(
    actionProposalsSnapshot.proposals.map((item) => item.proposal.recommendationId),
  );

  const canReview = hasPermission(context.role, PERMISSIONS.AI_REVIEW);
  const allReviewed =
    snapshot.summary.total > 0 &&
    snapshot.summary.pending === 0;

  return (
    <main className="dashboard mission-control-page recommendation-review-page">
      <RecommendationReviewHeader
        activeOrganizationId={context.organizationId}
        organizations={organizationList.organizations.map((item) => ({
          id: item.organization.id,
          name: item.organization.name,
          role: item.membership.role,
        }))}
      />

      <RestrictedDataNotice restrictedSlices={snapshot.metadata.restrictedSlices} />

      <RecommendationReviewSummaryPanel snapshot={snapshot} />

      {snapshot.summary.total === 0 ? (
        <section
          className="mission-control-empty-organization recommendation-review-empty"
          aria-labelledby="recommendation-review-empty-heading"
        >
          <p className="eyebrow">NO RECOMMENDATIONS</p>
          <h2 id="recommendation-review-empty-heading">
            No recommendations in the current snapshot
          </h2>
          <p>
            The deterministic Recommendation Engine did not produce any review items for the
            authorized Daily Briefing snapshot. Restricted operational slices or a healthy
            execution state may reduce the recommendation queue.
          </p>
        </section>
      ) : null}

      {allReviewed ? (
        <aside className="recommendation-review-complete-notice" aria-live="polite">
          All current recommendations have a recorded review decision.
        </aside>
      ) : null}

      <RecommendationReviewQueue
        actionProposalRecommendationIds={actionProposalRecommendationIds}
        canReview={canReview}
        items={snapshot.items}
      />
    </main>
  );
}
