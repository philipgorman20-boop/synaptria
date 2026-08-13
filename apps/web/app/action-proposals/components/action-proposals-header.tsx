import { routes } from '@synaptria/config';
import Link from 'next/link';

import { signOutCurrentUser } from '../../actions/auth';
import { CreateOrganizationDialog } from '../../dashboard/components/create-organization-dialog';
import { OrganizationSwitcher } from '../../dashboard/components/organization-switcher';
import type { OrganizationSwitcherItem } from '../../dashboard/components/organization-switcher';
import {
  ACTION_PROPOSALS_EYEBROW,
  ACTION_PROPOSALS_SUBTITLE,
  ACTION_PROPOSALS_TITLE,
} from '../../../lib/action-proposals-format';

export interface ActionProposalsHeaderProps {
  readonly organizations: readonly OrganizationSwitcherItem[];
  readonly activeOrganizationId: OrganizationSwitcherItem['id'];
}

export function ActionProposalsHeader({
  organizations,
  activeOrganizationId,
}: ActionProposalsHeaderProps) {
  return (
    <header className="dashboard-header mission-control-header action-proposals-header">
      <div className="dashboard-heading mission-control-heading action-proposals-heading">
        <p className="eyebrow">{ACTION_PROPOSALS_EYEBROW}</p>
        <h1>{ACTION_PROPOSALS_TITLE}</h1>
        <p className="mission-control-subtitle action-proposals-subtitle">
          {ACTION_PROPOSALS_SUBTITLE}
        </p>
        <p className="daily-briefing-nav">
          <Link className="mission-control-inline-link" href={routes.recommendations}>
            Back to Recommendation Review
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
