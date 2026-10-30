import type { BudgetCategory, BudgetLine } from '@synaptria/domain/budgets';

interface OutflowSummarySectionProps {
  readonly lines: readonly BudgetLine[];
  readonly categories: readonly BudgetCategory[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

export function OutflowSummarySection({ lines, categories }: OutflowSummarySectionProps) {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const operational: BudgetLine[] = [];
  const discretionary: BudgetLine[] = [];

  for (const line of lines) {
    const category = categoryMap.get(line.categoryId);
    if (category?.outflowType === 'DISCRETIONARY') {
      discretionary.push(line);
    } else {
      operational.push(line);
    }
  }

  const operationalTotal = operational.reduce((sum, l) => sum + l.actualAmount, 0);
  const discretionaryTotal = discretionary.reduce((sum, l) => sum + l.actualAmount, 0);
  const overallTotal = operationalTotal + discretionaryTotal;

  if (lines.length === 0) {
    return (
      <div className="empty-state">
        <h2>No budget lines yet</h2>
        <p>Budget lines with actual amounts will appear here grouped by operational and discretionary spend.</p>
      </div>
    );
  }

  return (
    <div className="outflow-summary">
      <div className="outflow-breakdown">
        <OutflowGroup
          title="Operational"
          description="Core expenses required to operate"
          lines={operational}
          total={operationalTotal}
          categoryMap={categoryMap}
        />
        <OutflowGroup
          title="Discretionary"
          description="Non-essential or variable spend"
          lines={discretionary}
          total={discretionaryTotal}
          categoryMap={categoryMap}
        />
      </div>
      <div className="outflow-total-row">
        <span>Total actual spend</span>
        <strong>{formatCurrency(overallTotal)}</strong>
      </div>
    </div>
  );
}

interface OutflowGroupProps {
  readonly title: string;
  readonly description: string;
  readonly lines: readonly BudgetLine[];
  readonly total: number;
  readonly categoryMap: Map<string, BudgetCategory>;
}

function OutflowGroup({ title, description, lines, total, categoryMap }: OutflowGroupProps) {
  return (
    <div className="outflow-group">
      <div className="outflow-group-header">
        <div>
          <h4>{title}</h4>
          <p className="outflow-group-description">{description}</p>
        </div>
        <strong className="outflow-group-total">{formatCurrency(total)}</strong>
      </div>
      {lines.length > 0 && (
        <table className="data-table data-table--compact">
          <thead>
            <tr>
              <th>Line</th>
              <th>Category</th>
              <th className="numeric">Planned</th>
              <th className="numeric">Actual</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id}>
                <td>{line.name}</td>
                <td>{categoryMap.get(line.categoryId)?.name ?? '—'}</td>
                <td className="numeric">{formatCurrency(line.plannedAmount)}</td>
                <td className="numeric">{formatCurrency(line.actualAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
