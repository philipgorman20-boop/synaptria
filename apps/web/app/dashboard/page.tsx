import {
  AuthenticationError,
  OrganizationMembershipRequiredError,
  type ResolvedOrganizationContext,
} from '@synaptria/auth';
import { appConfig, primaryNavigation, routes } from '@synaptria/config';
import { Card, Stack } from '@synaptria/ui';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getOrganizationService } from '../../lib/organization-service';
import { getRequestContext } from '../../lib/request-context';

import { signOutCurrentUser } from '../actions/auth';
import { CreateOrganizationDialog } from './components/create-organization-dialog';
import { OrganizationSwitcher } from './components/organization-switcher';

const executionModules = [
  {
    label: 'Programs',
    href: routes.programs,
    description: 'Portfolio-level program management',
  },
  {
    label: 'Projects',
    href: routes.projects,
    description: 'Scientific and operational projects',
  },
  {
    label: 'Milestones',
    href: routes.projects,
    description: 'Phase gates and delivery checkpoints within projects',
  },
  {
    label: 'Tasks',
    href: routes.projects,
    description: 'Actionable work items within milestone execution',
  },
] as const;

const implementedModuleRoutes = new Set<string>([
  routes.dashboard,
  routes.programs,
  routes.projects,
]);

const plannedModules = primaryNavigation.filter(
  (item) => !implementedModuleRoutes.has(item.href),
);

const metricCards = [
  { label: 'Programs', value: 'View portfolio', href: routes.programs },
  { label: 'Projects', value: 'View projects', href: routes.projects },
  { label: 'Open risks', value: '0' },
  { label: 'Pending decisions', value: '0' },
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
        {metricCards.map((card) =>
          'href' in card ? (
            <Link key={card.label} className="dashboard-metric-link" href={card.href}>
              <Card>
                <Stack gap={12}>
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                </Stack>
              </Card>
            </Link>
          ) : (
            <Card key={card.label}>
              <Stack gap={12}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </Stack>
            </Card>
          ),
        )}
      </section>

      <section
        className="dashboard-section"
        aria-labelledby="execution-modules-heading"
      >
        <h2 id="execution-modules-heading">Portfolio &amp; execution</h2>

        <div className="module-list">
          {executionModules.map((item) => (
            <Link key={item.label} className="module-list-link" href={item.href}>
              <Card>
                <Stack gap={8}>
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                </Stack>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Planned modules</h2>

        <div className="module-list">
          {plannedModules.map((item) => (
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
