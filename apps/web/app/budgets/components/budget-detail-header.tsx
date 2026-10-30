import { routes } from '@synaptria/config';
import type { Budget } from '@synaptria/domain/budgets';
import Link from 'next/link';
import type React from 'react';

import { formatBudgetPeriodType, formatBudgetStatus } from '../budgets-format';

export interface BudgetDetailHeaderProps {
  readonly budget: Budget;
  readonly actions?: React.ReactNode;
}

export function BudgetDetailHeader({ budget, actions }: BudgetDetailHeaderProps) {
  return (
    <header className="detail-header">
      <nav aria-label="Budget navigation" className="detail-breadcrumb">
        <Link className="detail-back-link" href={routes.budgets}>Budgets</Link>
        <span aria-hidden="true" className="detail-breadcrumb-separator">/</span>
        <span aria-current="page">{budget.name}</span>
      </nav>

      <div className="detail-heading">
        <div className="detail-title-group">
          <p className="eyebrow">BUDGET · {formatBudgetPeriodType(budget.periodType)}</p>
          <h1>{budget.name}</h1>
          {budget.description !== undefined ? (
            <p className="detail-description">{budget.description}</p>
          ) : null}
        </div>
        <div className="detail-heading-aside">
          <span className="detail-status-badge">{formatBudgetStatus(budget.status)}</span>
          {actions}
        </div>
      </div>
    </header>
  );
}
