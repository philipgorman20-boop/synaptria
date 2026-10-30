import type { BudgetCategory, BudgetLine } from '@synaptria/domain/budgets';
import type { Program } from '@synaptria/domain/programs';
import type { Project } from '@synaptria/domain/projects';
import type { BudgetId } from '@synaptria/core';

import { CreateBudgetLineDialog } from './create-budget-line-dialog';
import { EditBudgetLineDialog } from './edit-budget-line-dialog';
import { DeleteBudgetLineDialog } from './delete-budget-line-dialog';

export interface BudgetLinesSectionProps {
  readonly budgetId: BudgetId;
  readonly lines: readonly BudgetLine[];
  readonly categories: readonly BudgetCategory[];
  readonly programs: readonly Program[];
  readonly projects: readonly Project[];
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
}

export function BudgetLinesSection({ budgetId, lines, categories, programs, projects }: BudgetLinesSectionProps) {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const programMap = new Map(programs.map((p) => [p.id, p]));
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const totalPlanned = lines.reduce((sum, l) => sum + l.plannedAmount, 0);

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <h2>Budget Lines</h2>
        <CreateBudgetLineDialog
          budgetId={budgetId}
          categories={categories}
          programs={programs}
          projects={projects}
        />
      </div>

      {lines.length === 0 ? (
        <p className="empty-state">No budget lines yet. Add a line item to get started.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Program / Project</th>
              <th>Planned</th>
              <th>Actual</th>
              <th>Period</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const category = categoryMap.get(line.categoryId);
              const program = line.programId !== undefined ? programMap.get(line.programId) : undefined;
              const project = line.projectId !== undefined ? projectMap.get(line.projectId) : undefined;
              const linkedLabel = program !== undefined
                ? program.name
                : project !== undefined
                  ? project.name
                  : '—';

              return (
                <tr key={line.id}>
                  <td>{line.name}</td>
                  <td>{category?.name ?? '—'}</td>
                  <td>{linkedLabel}</td>
                  <td>{formatCurrency(line.plannedAmount, line.currency)}</td>
                  <td>{formatCurrency(line.actualAmount, line.currency)}</td>
                  <td>
                    {line.periodStart.toLocaleDateString()} – {line.periodEnd.toLocaleDateString()}
                  </td>
                  <td className="table-actions">
                    <EditBudgetLineDialog
                      budgetId={budgetId}
                      line={line}
                      categories={categories}
                      programs={programs}
                      projects={projects}
                    />
                    <DeleteBudgetLineDialog budgetId={budgetId} line={line} />
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}><strong>Total</strong></td>
              <td><strong>{lines.length > 0 ? formatCurrency(totalPlanned, lines[0]!.currency) : '—'}</strong></td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      )}
    </section>
  );
}
