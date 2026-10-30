import type { Document } from '@synaptria/domain/documents';
import type { Program } from '@synaptria/domain/programs';
import type { Project } from '@synaptria/domain/projects';

import { formatDocumentDate, formatDocumentStatus, formatDocumentType } from '../documents-format';

export interface DocumentDetailMetadataProps {
  readonly document: Document;
  readonly programs: readonly Program[];
  readonly projects: readonly Project[];
}

export function DocumentDetailMetadata({ document, programs, projects }: DocumentDetailMetadataProps) {
  const linkedProgram = document.programId !== undefined ? programs.find((p) => p.id === document.programId) : undefined;
  const linkedProject = document.projectId !== undefined ? projects.find((p) => p.id === document.projectId) : undefined;
  return (
    <section aria-labelledby="document-detail-metadata-heading" className="detail-metadata">
      <h2 id="document-detail-metadata-heading">Document details</h2>

      <dl className="detail-metadata-list">
        <div className="detail-field">
          <dt>Status</dt>
          <dd>{formatDocumentStatus(document.status)}</dd>
        </div>
        <div className="detail-field">
          <dt>Type</dt>
          <dd>{formatDocumentType(document.type)}</dd>
        </div>
        <div className="detail-field">
          <dt>Version</dt>
          <dd>{document.currentVersion}</dd>
        </div>
        {document.sourceUrl !== undefined ? (
          <div className="detail-field detail-field--full">
            <dt>Source URL</dt>
            <dd><a href={document.sourceUrl} target="_blank" rel="noopener noreferrer">{document.sourceUrl}</a></dd>
          </div>
        ) : null}
        {document.tags.length > 0 ? (
          <div className="detail-field detail-field--full">
            <dt>Tags</dt>
            <dd>{document.tags.join(', ')}</dd>
          </div>
        ) : null}
        {linkedProgram !== undefined ? (
          <div className="detail-field">
            <dt>Program</dt>
            <dd>{linkedProgram.name}</dd>
          </div>
        ) : null}
        {linkedProject !== undefined ? (
          <div className="detail-field">
            <dt>Project</dt>
            <dd>{linkedProject.name}</dd>
          </div>
        ) : null}
        <div className="detail-field">
          <dt>Created</dt>
          <dd>{formatDocumentDate(document.createdAt)}</dd>
        </div>
        <div className="detail-field">
          <dt>Updated</dt>
          <dd>{formatDocumentDate(document.updatedAt)}</dd>
        </div>
      </dl>
    </section>
  );
}
