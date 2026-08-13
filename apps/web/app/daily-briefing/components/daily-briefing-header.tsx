import { routes } from '@synaptria/config';
import Link from 'next/link';

import { signOutCurrentUser } from '../../actions/auth';
import { CreateOrganizationDialog } from '../../dashboard/components/create-organization-dialog';
import { OrganizationSwitcher } from '../../dashboard/components/organization-switcher';
import type { OrganizationSwitcherItem } from '../../dashboard/components/organization-switcher';
import {
  DAILY_BRIEFING_EYEBROW,
  DAILY_BRIEFING_SUBTITLE,
} from './daily-briefing-ui-constants';
import { formatDailyBriefingWindow } from '../daily-briefing-format';
import type { DailyBriefingSnapshot } from '@synaptria/application';

export interface DailyBriefingHeaderProps {
  readonly organizations: readonly OrganizationSwitcherItem[];
  readonly activeOrganizationId: OrganizationSwitcherItem['id'];
  readonly snapshot: DailyBriefingSnapshot;
  readonly headline: string;
}

export function DailyBriefingHeader({
  organizations,
  activeOrganizationId,
  snapshot,
  headline,
}: DailyBriefingHeaderProps) {
  return (
    <header className="dashboard-header mission-control-header daily-briefing-header">
      <div className="dashboard-heading mission-control-heading daily-briefing-heading">
        <p className="eyebrow">{DAILY_BRIEFING_EYEBROW}</p>
        <h1>{headline}</h1>
        <p className="mission-control-subtitle daily-briefing-window">
          {formatDailyBriefingWindow(snapshot)}
        </p>
        <p className="daily-briefing-subtitle">{DAILY_BRIEFING_SUBTITLE}</p>
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
