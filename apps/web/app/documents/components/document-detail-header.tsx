import { routes } from '@synaptria/config';
import type { Document } from '@synaptria/domain/documents';
import Link from 'next/link';
import type React from 'react';

import { formatDocumentStatus, formatDocumentType } from '../documents-format';

export interface DocumentDetailHeaderProps {
  readonly document: Document;
  readonly actions?: React.ReactNode;
}

export function DocumentDetailHeader({ document, actions }: DocumentDetailHeaderProps) {
  return (
    <header className="detail-header">
      <nav aria-label="Document navigation" className="detail-breadcrumb">
        <Link className="detail-back-link" href={routes.documents}>Documents</Link>
        <span aria-hidden="true" className="detail-breadcrumb-separator">/</span>
        <span aria-current="page">{document.title}</span>
      </nav>

      <div className="detail-heading">
        <div className="detail-title-group">
          <p className="eyebrow">DOCUMENT · {formatDocumentType(document.type)}</p>
          <h1>{document.title}</h1>
          {document.description !== undefined ? (
            <p className="detail-description">{document.description}</p>
          ) : null}
        </div>
        <div className="detail-heading-aside">
          <span className="detail-status-badge">{formatDocumentStatus(document.status)}</span>
          {actions}
        </div>
      </div>
    </header>
  );
}
