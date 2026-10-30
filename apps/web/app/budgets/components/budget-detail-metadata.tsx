import type { Budget } from '@synaptria/domain/budgets';

import { formatBudgetDate, formatBudgetPeriodType, formatBudgetStatus } from '../budgets-format';

export interface BudgetDetailMetadataProps {
  readonly budget: Budget;
}

export function BudgetDetailMetadata({ budget }: BudgetDetailMetadataProps) {
  return (
    <section aria-labelledby="budget-detail-metadata-heading" className="detail-metadata">
      <h2 id="budget-detail-metadata-heading">Budget details</h2>

      <dl className="detail-metadata-list">
        <div className="detail-field">
          <dt>Status</dt>
          <dd>{formatBudgetStatus(budget.status)}</dd>
        </div>
        <div className="detail-field">
          <dt>Period</dt>
          <dd>{formatBudgetPeriodType(budget.periodType)}</dd>
        </div>
        <div className="detail-field">
          <dt>Currency</dt>
          <dd>{budget.currency}</dd>
        </div>
        <div className="detail-field">
          <dt>Start date</dt>
          <dd>{formatBudgetDate(budget.startDate)}</dd>
        </div>
        <div className="detail-field">
          <dt>End date</dt>
          <dd>{formatBudgetDate(budget.endDate)}</dd>
        </div>
        {budget.approvedAt !== undefined ? (
          <div className="detail-field">
            <dt>Approved</dt>
            <dd>{formatBudgetDate(budget.approvedAt)}</dd>
          </div>
        ) : null}
        <div className="detail-field">
          <dt>Created</dt>
          <dd>{formatBudgetDate(budget.createdAt)}</dd>
        </div>
        <div className="detail-field">
          <dt>Updated</dt>
          <dd>{formatBudgetDate(budget.updatedAt)}</dd>
        </div>
      </dl>
    </section>
  );
}
