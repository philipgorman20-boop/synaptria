import {
  AuthenticationError,
  OrganizationMembershipRequiredError,
  type ResolvedOrganizationContext,
} from '@synaptria/auth';
import { AuthorizationDeniedError } from '@synaptria/core/errors';
import { PERMISSIONS, hasPermission } from '@synaptria/permissions';
import { redirect } from 'next/navigation';

import { getMissionControlService } from '../../lib/mission-control-service';
import { toMissionControlContext } from '../../lib/mission-control-context';
import { getOrganizationService } from '../../lib/organization-service';
import { getRequestContext } from '../../lib/request-context';

import { AttentionList } from './components/attention-list';
import {
  MissionControlEmptyOrganization,
  MissionControlHeader,
} from './components/mission-control-header';
import { MissionControlKpis } from './components/mission-control-kpis';
import { ProjectHealthList } from './components/project-health-list';
import { RecentActivityFeed } from './components/recent-activity-feed';
import { RestrictedDataNotice } from './components/restricted-data-notice';
import { UpcomingWork } from './components/upcoming-work';
import { shouldShowEmptyOrganizationState } from './mission-control-format';

export default async function DashboardPage() {
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

  const [organizationList, snapshot] = await Promise.all([
    getOrganizationService().listOrganizations({
      userId: context.userId,
      activeOrganizationId: context.organizationId,
    }),
    getMissionControlService()
      .getSnapshot(toMissionControlContext(context))
      .catch((error: unknown) => {
        if (error instanceof AuthorizationDeniedError) {
          redirect('/no-organization');
        }

        throw error;
      }),
  ]);

  const canManagePrograms = hasPermission(context.role, PERMISSIONS.PROGRAMS_MANAGE);
  const canManageProjects = hasPermission(context.role, PERMISSIONS.PROJECTS_MANAGE);
  const showEmptyOrganization = shouldShowEmptyOrganizationState(snapshot);

  return (
    <main className="dashboard mission-control-page">
      <MissionControlHeader
        activeOrganizationId={context.organizationId}
        organizations={organizationList.organizations.map((item) => ({
          id: item.organization.id,
          name: item.organization.name,
          role: item.membership.role,
        }))}
      />

      <RestrictedDataNotice restrictedSlices={snapshot.metadata.restrictedSlices} />

      <MissionControlKpis
        summary={snapshot.summary}
        restrictedSlices={snapshot.metadata.restrictedSlices}
      />

      {showEmptyOrganization ? (
        <MissionControlEmptyOrganization
          canManagePrograms={canManagePrograms}
          canManageProjects={canManageProjects}
        />
      ) : (
        <div className="mission-control-layout">
          <div className="mission-control-primary-column">
            <AttentionList items={snapshot.attentionItems} />
            <UpcomingWork
              milestoneSignals={snapshot.milestoneSignals}
              taskSignals={snapshot.taskSignals}
            />
          </div>

          <div className="mission-control-secondary-column">
            <ProjectHealthList projectHealth={snapshot.projectHealth} />
            <RecentActivityFeed recentActivity={snapshot.recentActivity} />
          </div>
        </div>
      )}
    </main>
  );
}
