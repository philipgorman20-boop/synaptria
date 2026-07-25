import {
  AuthenticationError,
  OrganizationMembershipRequiredError,
  type ResolvedOrganizationContext,
} from '@synaptria/auth';
import { appConfig, primaryNavigation } from '@synaptria/config';
import { Card, Stack } from '@synaptria/ui';
import { redirect } from 'next/navigation';

import { getOrganizationService } from '../../lib/organization-service';
import { getRequestContext } from '../../lib/request-context';

import { signOutCurrentUser } from '../actions/auth';
import { CreateOrganizationDialog } from './components/create-organization-dialog';
import { OrganizationSwitcher } from './components/organization-switcher';

const cards = [
  ['Programs', '0 active'],
  ['Projects', '0 in progress'],
  ['Open risks', '0'],
  ['Pending decisions', '0'],
] as const;

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

  const organizationList = await getOrganizationService().listOrganizations({
    userId: context.userId,
    activeOrganizationId: context.organizationId,
  });

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-heading">
          <p className="eyebrow">WORKSPACE</p>
          <h1>Executive dashboard</h1>
          <p>
            Welcome to the {appConfig.name} operating workspace. You are working
            in {context.organizationName} as {context.role.toLowerCase()}.
          </p>
        </div>

        <div className="dashboard-controls">
          <OrganizationSwitcher
            activeOrganizationId={context.organizationId}
            organizations={organizationList.organizations.map((item) => ({
              id: item.organization.id,
              name: item.organization.name,
              role: item.membership.role,
            }))}
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

      <section className="grid" aria-label="Workspace metrics">
        {cards.map(([label, value]) => (
          <Card key={label}>
            <Stack gap={12}>
              <span>{label}</span>
              <strong>{value}</strong>
            </Stack>
          </Card>
        ))}
      </section>

      <section className="dashboard-section">
        <h2>Planned modules</h2>

        <div className="module-list">
          {primaryNavigation.map((item) => (
            <Card key={item.href}>
              <Stack gap={8}>
                <strong>{item.label}</strong>
                <span>{item.description}</span>
              </Stack>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
