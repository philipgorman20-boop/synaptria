'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Vendor } from '@synaptria/domain/vendors';

import { formatVendorCategory, formatVendorStatus, getVendorDetailHref } from '../vendors-format';

type SortKey = 'name' | 'category' | 'status' | 'country';
type SortDir = 'asc' | 'desc';

export interface VendorsTableProps {
  readonly vendors: readonly Vendor[];
}

export function VendorsTable({ vendors }: VendorsTableProps) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const rows = useMemo(() => {
    const q = query.toLowerCase();
    return vendors
      .filter((v) => {
        if (!q) return true;
        return (
          v.name.toLowerCase().includes(q) ||
          v.category.toLowerCase().includes(q) ||
          v.status.toLowerCase().includes(q) ||
          (v.country ?? '').toLowerCase().includes(q) ||
          (v.city ?? '').toLowerCase().includes(q)
        );
      })
      .slice()
      .sort((a, b) => {
        const av = String(a[sortKey] ?? '');
        const bv = String(b[sortKey] ?? '');
        const cmp = av.localeCompare(bv);
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [vendors, query, sortKey, sortDir]);

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
          placeholder="Filter vendors…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Filter vendors"
        />
        {query && (
          <span className="table-filter-count">
            {rows.length} of {vendors.length}
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="table-empty-filter">No vendors match "{query}"</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>
                <button className="table-sort-button" onClick={() => handleSort('name')}>
                  Name {sortLabel('name')}
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
                <button className="table-sort-button" onClick={() => handleSort('country')}>
                  Country {sortLabel('country')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((vendor) => (
              <tr key={vendor.id}>
                <td><Link href={getVendorDetailHref(vendor.id)}>{vendor.name}</Link></td>
                <td>{formatVendorCategory(vendor.category)}</td>
                <td>{formatVendorStatus(vendor.status)}</td>
                <td>{vendor.country ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
