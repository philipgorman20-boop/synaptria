import {
  AuthenticationError,
  OrganizationMembershipRequiredError,
  type ResolvedOrganizationContext,
} from '@synaptria/auth';
import { routes } from '@synaptria/config';
import type { Budget } from '@synaptria/domain/budgets';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { toListBudgetsContext } from '../../lib/budget-context';
import { getBudgetService } from '../../lib/budget-service';
import { getRequestContext } from '../../lib/request-context';

import { getBudgetDetailHref } from './budgets-format';

import { CreateBudgetDialog } from './components/create-budget-dialog';

export default async function BudgetsPage() {
  let context: ResolvedOrganizationContext;

  try {
    context = await getRequestContext();
  } catch (error) {
    if (error instanceof AuthenticationError) redirect('/sign-in');
    if (error instanceof OrganizationMembershipRequiredError) redirect('/no-organization');
    throw error;
  }

  const result = await getBudgetService().listBudgets(toListBudgetsContext(context));
  const budgets = result.budgets.filter(isVisibleBudget);

  return (
    <main className="dashboard">
      <div className="page-header">
        <div>
          <h1>Budgets</h1>
          <p className="page-subtitle">
            {budgets.length} {budgets.length === 1 ? 'budget' : 'budgets'} in {context.organizationName}
          </p>
        </div>
        <div className="page-header-actions">
          <CreateBudgetDialog />
          <Link className="secondary-button" href={routes.dashboard}>Dashboard</Link>
        </div>
      </div>

      {budgets.length === 0 ? (
        <div className="empty-state">
          <h2>No budgets yet</h2>
          <p>Create annual or project budgets to track planned, committed, and actual spend.</p>
        </div>
      ) : (
        <section aria-label="Budgets">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Period</th>
                <th>Status</th>
                <th>Currency</th>
                <th>Start</th>
                <th>End</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map((budget) => (
                <tr key={budget.id}>
                  <td><Link href={getBudgetDetailHref(budget.id)}>{budget.name}</Link></td>
                  <td>{budget.periodType}</td>
                  <td>{budget.status}</td>
                  <td>{budget.currency}</td>
                  <td>{budget.startDate.toLocaleDateString()}</td>
                  <td>{budget.endDate.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}

function isVisibleBudget(budget: Budget): boolean {
  return budget.deletedAt === undefined;
}
