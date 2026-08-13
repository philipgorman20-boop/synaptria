import { routes } from '@synaptria/config';
import Link from 'next/link';

import { signOutCurrentUser } from '../../actions/auth';
import { CreateOrganizationDialog } from './create-organization-dialog';
import { OrganizationSwitcher } from './organization-switcher';
import type { OrganizationSwitcherItem } from './organization-switcher';
import {
  MISSION_CONTROL_PAGE_TITLE,
  MISSION_CONTROL_SUBTITLE,
} from './mission-control-ui-constants';

export interface MissionControlHeaderProps {
  readonly organizations: readonly OrganizationSwitcherItem[];
  readonly activeOrganizationId: OrganizationSwitcherItem['id'];
}

export function MissionControlHeader({
  organizations,
  activeOrganizationId,
}: MissionControlHeaderProps) {
  return (
    <header className="dashboard-header mission-control-header">
      <div className="dashboard-heading mission-control-heading">
        <p className="eyebrow">OPERATIONS</p>
        <h1>{MISSION_CONTROL_PAGE_TITLE}</h1>
        <p className="mission-control-subtitle">{MISSION_CONTROL_SUBTITLE}</p>
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

export interface MissionControlEmptyOrganizationProps {
  readonly canManagePrograms: boolean;
  readonly canManageProjects: boolean;
}

export function MissionControlEmptyOrganization({
  canManagePrograms,
  canManageProjects,
}: MissionControlEmptyOrganizationProps) {
  return (
    <section
      className="mission-control-empty-organization"
      aria-labelledby="mission-control-empty-heading"
    >
      <p className="eyebrow">GET STARTED</p>
      <h2 id="mission-control-empty-heading">No execution data yet</h2>
      <p>
        Mission Control tracks programs, projects, milestones, and tasks across
        your organization. Start by creating a program or project to populate
        this workspace.
      </p>
      <div className="mission-control-empty-actions">
        {canManagePrograms ? (
          <Link className="primary-button" href={routes.programs}>
            Go to Programs
          </Link>
        ) : null}
        {canManageProjects ? (
          <Link className="secondary-button" href={routes.projects}>
            Go to Projects
          </Link>
        ) : (
          <Link className="secondary-button" href={routes.projects}>
            View Projects
          </Link>
        )}
      </div>
    </section>
  );
}
