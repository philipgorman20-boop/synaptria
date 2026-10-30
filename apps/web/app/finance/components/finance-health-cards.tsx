import type { BudgetLine, FundingEvent } from '@synaptria/domain/budgets';

interface FinanceHealthCardsProps {
  readonly fundingEvents: readonly FundingEvent[];
  readonly budgetLines: readonly BudgetLine[];
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

function computeMonthlyBurnRate(lines: readonly BudgetLine[]): number {
  let totalWeightedActual = 0;
  let totalMonths = 0;

  for (const line of lines) {
    if (line.actualAmount <= 0) continue;

    const startMs = line.periodStart.getTime();
    const endMs = line.periodEnd.getTime();
    const durationMs = endMs - startMs;
    if (durationMs <= 0) continue;

    const durationMonths = durationMs / (1000 * 60 * 60 * 24 * 30.44);
    totalWeightedActual += line.actualAmount;
    totalMonths += durationMonths;
  }

  if (totalMonths === 0) return 0;
  return totalWeightedActual / totalMonths;
}

export function FinanceHealthCards({ fundingEvents, budgetLines }: FinanceHealthCardsProps) {
  const cashOnHand = fundingEvents
    .filter((e) => e.status === 'RECEIVED')
    .reduce((sum, e) => sum + e.amount, 0);

  const committedPipeline = fundingEvents
    .filter((e) => e.status === 'COMMITTED')
    .reduce((sum, e) => sum + e.amount, 0);

  const monthlyBurnRate = computeMonthlyBurnRate(budgetLines);

  const runwayMonths = monthlyBurnRate > 0 ? Math.floor(cashOnHand / monthlyBurnRate) : null;

  return (
    <div className="finance-health-cards">
      <div className="finance-card">
        <p className="finance-card-label">Cash on Hand</p>
        <p className="finance-card-value">{formatCurrency(cashOnHand)}</p>
        <p className="finance-card-sub">From received funding</p>
      </div>

      <div className="finance-card">
        <p className="finance-card-label">Committed Pipeline</p>
        <p className="finance-card-value">{formatCurrency(committedPipeline)}</p>
        <p className="finance-card-sub">Funding committed but not yet received</p>
      </div>

      <div className="finance-card">
        <p className="finance-card-label">Monthly Burn Rate</p>
        <p className="finance-card-value">
          {monthlyBurnRate > 0 ? formatCurrency(monthlyBurnRate) : '—'}
        </p>
        <p className="finance-card-sub">Based on actual spend across budget lines</p>
      </div>

      <div className={`finance-card ${runwayMonths !== null && runwayMonths < 6 ? 'finance-card--warning' : ''}`}>
        <p className="finance-card-label">Estimated Runway</p>
        <p className="finance-card-value">
          {runwayMonths !== null ? `${runwayMonths} mo` : '—'}
        </p>
        <p className="finance-card-sub">
          {runwayMonths !== null
            ? runwayMonths < 6
              ? 'Less than 6 months — consider fundraising'
              : 'At current burn rate'
            : 'No burn rate data'}
        </p>
      </div>
    </div>
  );
}
