import { appConfig, documentRoute } from '@synaptria/config';
import { documentId, type DocumentId } from '@synaptria/core';
import type { DocumentStatus, DocumentType } from '@synaptria/domain/documents';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  SUPERSEDED: 'Superseded',
  ARCHIVED: 'Archived',
};

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  GENERAL: 'General',
  CONTRACT: 'Contract',
  SOW: 'Statement of Work',
  QUOTE: 'Quote',
  PURCHASE_ORDER: 'Purchase Order',
  INVOICE: 'Invoice',
  PROTOCOL: 'Protocol',
  REPORT: 'Report',
  PRESENTATION: 'Presentation',
  MEETING_NOTES: 'Meeting Notes',
  BOARD_MATERIAL: 'Board Material',
  INVESTOR_MATERIAL: 'Investor Material',
  REGULATORY: 'Regulatory',
  IP: 'IP / Patent',
  POLICY: 'Policy',
  OTHER: 'Other',
};

export function formatDocumentStatus(status: DocumentStatus): string {
  return DOCUMENT_STATUS_LABELS[status];
}

export function formatDocumentType(type: DocumentType): string {
  return DOCUMENT_TYPE_LABELS[type];
}

export function formatDocumentDate(date: Date): string {
  return new Intl.DateTimeFormat(appConfig.defaultLocale, { dateStyle: 'medium' }).format(date);
}

export function getDocumentDetailHref(id: DocumentId): string {
  return documentRoute(id);
}

export function parseDocumentRouteParam(raw: string | undefined): DocumentId | null {
  if (typeof raw !== 'string') return null;
  const normalized = raw.trim();
  if (!UUID_PATTERN.test(normalized)) return null;
  return documentId(normalized);
}
