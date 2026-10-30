import {
  AuthenticationError,
  OrganizationMembershipRequiredError,
  type ResolvedOrganizationContext,
} from '@synaptria/auth';
import { routes } from '@synaptria/config';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { toListAllBudgetLinesContext, toListBudgetCategoriesContext } from '../../lib/budget-context';
import { getBudgetLineService, getFundingEventService } from '../../lib/budget-service';
import { toListFundingEventsContext } from '../../lib/funding-event-context';
import { getRequestContext } from '../../lib/request-context';

import { FinanceHealthCards } from './components/finance-health-cards';
import { FundingEventsSection } from './components/funding-events-section';
import { OutflowSummarySection } from './components/outflow-summary-section';
import { CreateFundingEventDialog } from './components/create-funding-event-dialog';

export default async function FinancePage() {
  let context: ResolvedOrganizationContext;

  try {
    context = await getRequestContext();
  } catch (error) {
    if (error instanceof AuthenticationError) redirect('/sign-in');
    if (error instanceof OrganizationMembershipRequiredError) redirect('/no-organization');
    throw error;
  }

  const [fundingEventsResult, budgetLinesResult, categoriesResult] = await Promise.all([
    getFundingEventService().listFundingEvents(toListFundingEventsContext(context)),
    getBudgetLineService().listAllBudgetLines(toListAllBudgetLinesContext(context)),
    getBudgetLineService().listBudgetCategories(toListBudgetCategoriesContext(context)),
  ]);

  const fundingEvents = fundingEventsResult.fundingEvents.filter((e) => e.deletedAt === undefined);
  const budgetLines = budgetLinesResult.budgetLines.filter((l) => l.deletedAt === undefined);
  const categories = categoriesResult.budgetCategories.filter((c) => c.deletedAt === undefined);

  return (
    <main className="dashboard">
      <div className="page-header">
        <div>
          <h1>Finance</h1>
          <p className="page-subtitle">Financial health overview for {context.organizationName}</p>
        </div>
        <div className="page-header-actions">
          <CreateFundingEventDialog />
          <Link className="secondary-button" href={routes.budgets}>Budgets</Link>
          <Link className="secondary-button" href={routes.dashboard}>Dashboard</Link>
        </div>
      </div>

      <section aria-label="Financial health summary">
        <FinanceHealthCards fundingEvents={fundingEvents} budgetLines={budgetLines} />
      </section>

      <section aria-label="Funding events">
        <div className="section-header">
          <h2>Funding Events</h2>
          <p className="section-description">Investments, grants, and other capital inflows</p>
        </div>
        <FundingEventsSection events={fundingEvents} />
      </section>

      <section aria-label="Outflow summary">
        <div className="section-header">
          <h2>Outflow Summary</h2>
          <p className="section-description">Actual spend by operational and discretionary category</p>
        </div>
        <OutflowSummarySection lines={budgetLines} categories={categories} />
      </section>
    </main>
  );
}
