import {
  AuthenticationError,
  OrganizationMembershipRequiredError,
  type ResolvedOrganizationContext,
} from '@synaptria/auth';
import { AuthorizationDeniedError } from '@synaptria/core/errors';
import { redirect } from 'next/navigation';

import { RestrictedDataNotice } from '../dashboard/components/restricted-data-notice';
import { toActionProposalsReadContext } from '../../lib/action-proposals-context';
import { getActionProposalsService } from '../../lib/action-proposals-service';
import { getOrganizationService } from '../../lib/organization-service';
import { getRequestContext } from '../../lib/request-context';

import { ActionProposalsHeader } from './components/action-proposals-header';
import { ActionProposalsList } from './components/action-proposals-list';

export default async function ActionProposalsPage() {
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
    getActionProposalsService()
      .getActionProposals(toActionProposalsReadContext(context))
      .catch((error: unknown) => {
        if (error instanceof AuthorizationDeniedError) {
          redirect('/no-organization');
        }

        throw error;
      }),
  ]);

  return (
    <main className="dashboard mission-control-page action-proposals-page">
      <ActionProposalsHeader
        activeOrganizationId={context.organizationId}
        organizations={organizationList.organizations.map((item) => ({
          id: item.organization.id,
          name: item.organization.name,
          role: item.membership.role,
        }))}
      />

      <aside className="action-proposals-safety-notice" aria-label="Action proposal safety boundary">
        Recommendation → Human Accept → Action Proposal → Stop. No operational execution occurs
        from this surface.
      </aside>

      <RestrictedDataNotice restrictedSlices={snapshot.metadata.restrictedSlices} />

      <ActionProposalsList items={snapshot.proposals} />
    </main>
  );
}
