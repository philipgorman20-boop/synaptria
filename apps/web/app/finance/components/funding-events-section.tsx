import type { FundingEvent } from '@synaptria/domain/budgets';
import { EditFundingEventDialog } from './edit-funding-event-dialog';
import { DeleteFundingEventDialog } from './delete-funding-event-dialog';

interface FundingEventsSectionProps {
  readonly events: readonly FundingEvent[];
}

const TYPE_LABELS: Record<string, string> = {
  SEED: 'Seed',
  SERIES_A: 'Series A',
  SERIES_B: 'Series B',
  SERIES_C: 'Series C',
  SERIES_D: 'Series D',
  GRANT: 'Grant',
  REVENUE: 'Revenue',
  LOAN: 'Loan',
  CONVERTIBLE_NOTE: 'Convertible Note',
  SAFE: 'SAFE',
  OTHER: 'Other',
};

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export function FundingEventsSection({ events }: FundingEventsSectionProps) {
  if (events.length === 0) {
    return (
      <div className="empty-state">
        <h2>No funding events yet</h2>
        <p>Record investments, grants, and other capital inflows to track your financial position.</p>
      </div>
    );
  }

  const received = events.filter((e) => e.status === 'RECEIVED');
  const committed = events.filter((e) => e.status === 'COMMITTED');

  return (
    <div className="finance-events-sections">
      {received.length > 0 && (
        <section aria-label="Received funding">
          <h3 className="section-subtitle">Received</h3>
          <FundingEventsTable events={received} />
        </section>
      )}
      {committed.length > 0 && (
        <section aria-label="Committed funding">
          <h3 className="section-subtitle">Committed</h3>
          <FundingEventsTable events={committed} />
        </section>
      )}
    </div>
  );
}

function FundingEventsTable({ events }: { events: readonly FundingEvent[] }) {
  const total = events.reduce((sum, e) => sum + e.amount, 0);
  const currency = events[0]?.currency ?? 'USD';

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Investor / Source</th>
          <th>Date</th>
          <th className="numeric">Amount</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {events.map((event) => (
          <tr key={event.id}>
            <td>{event.name}</td>
            <td>{TYPE_LABELS[event.type] ?? event.type}</td>
            <td>{event.investor ?? '—'}</td>
            <td>
              {event.status === 'RECEIVED' && event.receivedAt !== undefined
                ? event.receivedAt.toLocaleDateString()
                : event.expectedAt !== undefined
                  ? `Expected ${event.expectedAt.toLocaleDateString()}`
                  : '—'}
            </td>
            <td className="numeric">{formatCurrency(event.amount, event.currency)}</td>
            <td className="table-actions">
              <EditFundingEventDialog event={event} />
              <DeleteFundingEventDialog event={event} />
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={4}><strong>Total</strong></td>
          <td className="numeric"><strong>{formatCurrency(total, currency)}</strong></td>
          <td />
        </tr>
      </tfoot>
    </table>
  );
}
