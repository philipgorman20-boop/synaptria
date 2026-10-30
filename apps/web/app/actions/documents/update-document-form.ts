import { ApplicationError } from '@synaptria/application';
import { AuthorizationDeniedError } from '@synaptria/core/errors';
import type { DocumentStatus, DocumentType } from '@synaptria/domain/documents';

export interface UpdateDocumentActionState {
  readonly status: 'idle' | 'success' | 'error';
  readonly message?: string;
  readonly fieldErrors?: Readonly<{ title?: string; type?: string }>;
  readonly values?: Readonly<{
    title: string;
    type: string;
    status: string;
    description: string;
    sourceUrl: string;
    programId: string;
    projectId: string;
  }>;
}

export interface UpdateDocumentFormValues {
  readonly title: string;
  readonly type: string;
  readonly status: string;
  readonly description: string;
  readonly sourceUrl: string;
  readonly programId: string;
  readonly projectId: string;
}

export const initialUpdateDocumentState: UpdateDocumentActionState = { status: 'idle' };

export function readUpdateDocumentFormValues(formData: FormData): UpdateDocumentFormValues {
  return {
    title: readText(formData, 'title'),
    type: readText(formData, 'type'),
    status: readText(formData, 'status'),
    description: readText(formData, 'description'),
    sourceUrl: readText(formData, 'sourceUrl'),
    programId: readText(formData, 'programId'),
    projectId: readText(formData, 'projectId'),
  };
}

export function validateUpdateDocumentFormValues(
  values: UpdateDocumentFormValues,
): UpdateDocumentActionState | undefined {
  if (values.title.trim().length === 0) {
    return {
      status: 'error',
      message: 'Correct the highlighted fields and try again.',
      fieldErrors: { title: 'Title is required.' },
      values,
    };
  }
  return undefined;
}

export function mapUpdateDocumentActionError(
  error: unknown,
  values: UpdateDocumentFormValues,
): UpdateDocumentActionState | undefined {
  if (error instanceof AuthorizationDeniedError) {
    return { status: 'error', message: 'You do not have permission to update documents.', values };
  }

  if (error instanceof ApplicationError) {
    return { status: 'error', message: error.message, values };
  }

  return undefined;
}

export function isDocumentType(value: string): value is DocumentType {
  return [
    'GENERAL', 'CONTRACT', 'SOW', 'QUOTE', 'PURCHASE_ORDER', 'INVOICE',
    'PROTOCOL', 'REPORT', 'PRESENTATION', 'MEETING_NOTES', 'BOARD_MATERIAL',
    'INVESTOR_MATERIAL', 'REGULATORY', 'IP', 'POLICY', 'OTHER',
  ].includes(value);
}

export function isDocumentStatus(value: string): value is DocumentStatus {
  return ['DRAFT', 'ACTIVE', 'SUPERSEDED', 'ARCHIVED'].includes(value);
}

function readText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === 'string' ? value.trim() : '';
}
