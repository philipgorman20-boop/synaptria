'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Document } from '@synaptria/domain/documents';
import type { Program } from '@synaptria/domain/programs';
import type { Project } from '@synaptria/domain/projects';

import { formatDocumentStatus, formatDocumentType, getDocumentDetailHref } from '../documents-format';

type SortKey = 'title' | 'type' | 'status' | 'currentVersion' | 'program' | 'project';
type SortDir = 'asc' | 'desc';

export interface DocumentsTableProps {
  readonly documents: readonly Document[];
  readonly programs: readonly Program[];
  readonly projects: readonly Project[];
}

export function DocumentsTable({ documents, programs, projects }: DocumentsTableProps) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('title');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const programById = useMemo(() => new Map(programs.map((p) => [p.id, p])), [programs]);
  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  const rows = useMemo(() => {
    const q = query.toLowerCase();
    return documents
      .filter((d) => {
        if (!q) return true;
        const prog = d.programId !== undefined ? (programById.get(d.programId)?.name ?? '') : '';
        const proj = d.projectId !== undefined ? (projectById.get(d.projectId)?.name ?? '') : '';
        return (
          d.title.toLowerCase().includes(q) ||
          d.type.toLowerCase().includes(q) ||
          d.status.toLowerCase().includes(q) ||
          prog.toLowerCase().includes(q) ||
          proj.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
      .slice()
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === 'currentVersion') {
          cmp = a.currentVersion - b.currentVersion;
        } else if (sortKey === 'program') {
          const an = a.programId !== undefined ? (programById.get(a.programId)?.name ?? '') : '';
          const bn = b.programId !== undefined ? (programById.get(b.programId)?.name ?? '') : '';
          cmp = an.localeCompare(bn);
        } else if (sortKey === 'project') {
          const an = a.projectId !== undefined ? (projectById.get(a.projectId)?.name ?? '') : '';
          const bn = b.projectId !== undefined ? (projectById.get(b.projectId)?.name ?? '') : '';
          cmp = an.localeCompare(bn);
        } else {
          cmp = String(a[sortKey]).localeCompare(String(b[sortKey]));
        }
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [documents, query, sortKey, sortDir, programById, projectById]);

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
          placeholder="Filter documents…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Filter documents"
        />
        {query && (
          <span className="table-filter-count">
            {rows.length} of {documents.length}
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="table-empty-filter">No documents match "{query}"</p>
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
                <button className="table-sort-button" onClick={() => handleSort('type')}>
                  Type {sortLabel('type')}
                </button>
              </th>
              <th>
                <button className="table-sort-button" onClick={() => handleSort('status')}>
                  Status {sortLabel('status')}
                </button>
              </th>
              <th>
                <button className="table-sort-button" onClick={() => handleSort('currentVersion')}>
                  Version {sortLabel('currentVersion')}
                </button>
              </th>
              <th>
                <button className="table-sort-button" onClick={() => handleSort('program')}>
                  Program {sortLabel('program')}
                </button>
              </th>
              <th>
                <button className="table-sort-button" onClick={() => handleSort('project')}>
                  Project {sortLabel('project')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((doc) => {
              const program = doc.programId !== undefined ? programById.get(doc.programId) : undefined;
              const project = doc.projectId !== undefined ? projectById.get(doc.projectId) : undefined;
              return (
                <tr key={doc.id}>
                  <td><Link href={getDocumentDetailHref(doc.id)}>{doc.title}</Link></td>
                  <td>{formatDocumentType(doc.type)}</td>
                  <td>{formatDocumentStatus(doc.status)}</td>
                  <td>{doc.currentVersion}</td>
                  <td>{program?.name ?? '—'}</td>
                  <td>{project?.name ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
