'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Decision } from '@synaptria/domain/decisions';

import { getDecisionDetailHref } from '../decisions-format';

type SortKey = 'title' | 'status' | 'decisionDate';
type SortDir = 'asc' | 'desc';

function formatEnum(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function compareDecisions(a: Decision, b: Decision, key: SortKey, dir: SortDir): number {
  let cmp = 0;
  if (key === 'decisionDate') {
    const aTime = a.decisionDate?.getTime() ?? 0;
    const bTime = b.decisionDate?.getTime() ?? 0;
    cmp = aTime - bTime;
  } else {
    cmp = String(a[key] ?? '').localeCompare(String(b[key] ?? ''));
  }
  return dir === 'asc' ? cmp : -cmp;
}

export interface DecisionsTableProps {
  readonly decisions: readonly Decision[];
}

export function DecisionsTable({ decisions }: DecisionsTableProps) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('title');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const rows = useMemo(() => {
    const q = query.toLowerCase();
    return decisions
      .filter((d) => {
        if (!q) return true;
        return (
          d.title.toLowerCase().includes(q) ||
          d.status.toLowerCase().includes(q) ||
          (d.decision ?? '').toLowerCase().includes(q) ||
          (d.rationale ?? '').toLowerCase().includes(q)
        );
      })
      .slice()
      .sort((a, b) => compareDecisions(a, b, sortKey, sortDir));
  }, [decisions, query, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function sortLabel(key: SortKey) {
    if (sortKey !== key) return null;
    return <span className="sort-indicator" aria-hidden="true">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  return (
    <div className="table-with-filter">
      <div className="table-filter-bar">
        <input
          type="search"
          className="table-filter-input"
          placeholder="Filter decisions…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Filter decisions"
        />
        {query && (
          <span className="table-filter-count">
            {rows.length} of {decisions.length}
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="table-empty-filter">No decisions match "{query}"</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>
                <button className="table-sort-button" onClick={() => handleSort('title')}>
                  Title {sortLabel('title')}
                </button>
              </th>
              <th>
                <button className="table-sort-button" onClick={() => handleSort('status')}>
                  Status {sortLabel('status')}
                </button>
              </th>
              <th>
                <button className="table-sort-button" onClick={() => handleSort('decisionDate')}>
                  Decision date {sortLabel('decisionDate')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((decision) => (
              <tr key={decision.id}>
                <td><Link href={getDecisionDetailHref(decision.id)}>{decision.title}</Link></td>
                <td>{formatEnum(decision.status)}</td>
                <td>{decision.decisionDate?.toLocaleDateString() ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
