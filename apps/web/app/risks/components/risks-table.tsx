'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Risk } from '@synaptria/domain/risks';

import { getRiskDetailHref } from '../risks-format';

type SortKey = 'title' | 'category' | 'status' | 'probability' | 'impact';
type SortDir = 'asc' | 'desc';

const PROBABILITY_ORDER = ['RARE', 'UNLIKELY', 'POSSIBLE', 'LIKELY', 'ALMOST_CERTAIN'];
const IMPACT_ORDER = ['NEGLIGIBLE', 'MINOR', 'MODERATE', 'MAJOR', 'SEVERE'];

function compareRisks(a: Risk, b: Risk, key: SortKey, dir: SortDir): number {
  let cmp = 0;
  if (key === 'probability') {
    cmp = PROBABILITY_ORDER.indexOf(a.probability) - PROBABILITY_ORDER.indexOf(b.probability);
  } else if (key === 'impact') {
    cmp = IMPACT_ORDER.indexOf(a.impact) - IMPACT_ORDER.indexOf(b.impact);
  } else {
    cmp = String(a[key]).localeCompare(String(b[key]));
  }
  return dir === 'asc' ? cmp : -cmp;
}

function formatEnum(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface RisksTableProps {
  readonly risks: readonly Risk[];
}

export function RisksTable({ risks }: RisksTableProps) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('title');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const rows = useMemo(() => {
    const q = query.toLowerCase();
    return risks
      .filter((r) => {
        if (!q) return true;
        return (
          r.title.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q) ||
          r.probability.toLowerCase().includes(q) ||
          r.impact.toLowerCase().includes(q)
        );
      })
      .slice()
      .sort((a, b) => compareRisks(a, b, sortKey, sortDir));
  }, [risks, query, sortKey, sortDir]);

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
          placeholder="Filter risks…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Filter risks"
        />
        {query && (
          <span className="table-filter-count">
            {rows.length} of {risks.length}
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="table-empty-filter">No risks match "{query}"</p>
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
                <button className="table-sort-button" onClick={() => handleSort('category')}>
                  Category {sortLabel('category')}
                </button>
              </th>
              <th>
                <button className="table-sort-button" onClick={() => handleSort('status')}>
                  Status {sortLabel('status')}
                </button>
              </th>
              <th>
                <button className="table-sort-button" onClick={() => handleSort('probability')}>
                  Probability {sortLabel('probability')}
                </button>
              </th>
              <th>
                <button className="table-sort-button" onClick={() => handleSort('impact')}>
                  Impact {sortLabel('impact')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((risk) => (
              <tr key={risk.id}>
                <td><Link href={getRiskDetailHref(risk.id)}>{risk.title}</Link></td>
                <td>{formatEnum(risk.category)}</td>
                <td>{formatEnum(risk.status)}</td>
                <td>{formatEnum(risk.probability)}</td>
                <td>{formatEnum(risk.impact)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
