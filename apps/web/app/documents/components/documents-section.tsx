import type { Document } from '@synaptria/domain/documents';
import type { Program } from '@synaptria/domain/programs';
import type { Project } from '@synaptria/domain/projects';
import Link from 'next/link';

import { formatDocumentStatus, formatDocumentType, getDocumentDetailHref } from '../documents-format';
import { CreateDocumentDialog } from './create-document-dialog';

interface DocumentsSectionProps {
  readonly documents: readonly Document[];
  readonly programs: readonly Program[];
  readonly projects: readonly Project[];
  readonly lockedProgramId?: string | undefined;
  readonly lockedProjectId?: string | undefined;
}

export function DocumentsSection({
  documents,
  programs,
  projects,
  lockedProgramId,
  lockedProjectId,
}: DocumentsSectionProps) {
  return (
    <section aria-label="Documents">
      <div className="section-header">
        <div>
          <h2>Documents</h2>
          <p className="section-description">
            {documents.length === 0
              ? 'No documents registered yet.'
              : `${documents.length} ${documents.length === 1 ? 'document' : 'documents'}`}
          </p>
        </div>
        <CreateDocumentDialog
          programs={programs}
          projects={projects}
          lockedProgramId={lockedProgramId}
          lockedProjectId={lockedProjectId}
        />
      </div>

      {documents.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Status</th>
              <th>Version</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td><Link href={getDocumentDetailHref(doc.id)}>{doc.title}</Link></td>
                <td>{formatDocumentType(doc.type)}</td>
                <td>{formatDocumentStatus(doc.status)}</td>
                <td>{doc.currentVersion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  );
}
