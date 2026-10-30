import type { BudgetCategory } from '@synaptria/domain/budgets';

import { CreateCategoryDialog } from './create-category-dialog';
import { EditCategoryDialog } from './edit-category-dialog';
import { DeleteCategoryDialog } from './delete-category-dialog';

const OUTFLOW_LABELS: Record<string, string> = {
  OPERATIONAL: 'Operational',
  DISCRETIONARY: 'Discretionary',
};

interface BudgetCategoriesSectionProps {
  readonly categories: readonly BudgetCategory[];
}

export function BudgetCategoriesSection({ categories }: BudgetCategoriesSectionProps) {
  return (
    <section aria-label="Budget categories">
      <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2>Categories</h2>
          <p className="section-description">Organise budget lines by spend type and outflow classification</p>
        </div>
        <CreateCategoryDialog />
      </div>

      {categories.length === 0 ? (
        <div className="empty-state">
          <h2>No categories yet</h2>
          <p>Create categories to classify your budget lines as operational or discretionary spend.</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Type</th>
              <th>Description</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>{category.name}</td>
                <td>{category.code ?? <span style={{ color: '#9ca3af' }}>—</span>}</td>
                <td>{OUTFLOW_LABELS[category.outflowType] ?? category.outflowType}</td>
                <td style={{ color: category.description !== undefined ? undefined : '#9ca3af' }}>
                  {category.description ?? '—'}
                </td>
                <td>
                  <div className="table-actions">
                    <EditCategoryDialog category={category} />
                    <DeleteCategoryDialog category={category} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
