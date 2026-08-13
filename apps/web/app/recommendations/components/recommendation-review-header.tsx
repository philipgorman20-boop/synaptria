import { routes } from '@synaptria/config';
import Link from 'next/link';

import { signOutCurrentUser } from '../../actions/auth';
import { CreateOrganizationDialog } from '../../dashboard/components/create-organization-dialog';
import { OrganizationSwitcher } from '../../dashboard/components/organization-switcher';
import type { OrganizationSwitcherItem } from '../../dashboard/components/organization-switcher';
import {
  RECOMMENDATION_REVIEW_EYEBROW,
  RECOMMENDATION_REVIEW_SUBTITLE,
  RECOMMENDATION_REVIEW_TITLE,
} from '../../../lib/recommendations-format';

export interface RecommendationReviewHeaderProps {
  readonly organizations: readonly OrganizationSwitcherItem[];
  readonly activeOrganizationId: OrganizationSwitcherItem['id'];
}

export function RecommendationReviewHeader({
  organizations,
  activeOrganizationId,
}: RecommendationReviewHeaderProps) {
  return (
    <header className="dashboard-header mission-control-header recommendation-review-header">
      <div className="dashboard-heading mission-control-heading recommendation-review-heading">
        <p className="eyebrow">{RECOMMENDATION_REVIEW_EYEBROW}</p>
        <h1>{RECOMMENDATION_REVIEW_TITLE}</h1>
        <p className="mission-control-subtitle recommendation-review-subtitle">
          {RECOMMENDATION_REVIEW_SUBTITLE}
        </p>
        <p className="daily-briefing-nav">
          <Link className="mission-control-inline-link" href={routes.dashboard}>
            Back to Mission Control
          </Link>
        </p>
      </div>

      <div className="dashboard-controls">
        <OrganizationSwitcher
          activeOrganizationId={activeOrganizationId}
          organizations={organizations}
        />

        <div className="dashboard-button-row">
          <CreateOrganizationDialog />

          <form action={signOutCurrentUser}>
            <button className="sign-out-button" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
